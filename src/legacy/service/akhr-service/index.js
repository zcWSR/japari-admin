import axios from 'axios';
import { flatMap, intersection, keyBy } from 'es-toolkit/compat';
import Config from '../../config';
import { combinations } from '../../utils/array';
import { isDev } from '../../utils/env';
import logger from '../../utils/logger';
import { sleep } from '../../utils/process';
import QQService from '../qq-service';
import Drawer from './image-drawer';

const characterTableUrl =
  'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/character_table.json';
const gachaTableUrl =
  'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/gacha_table.json';

const ROBOT_TAG_OWNER_TABLE = keyBy(
  ['char_285_medic2', 'char_286_cast3', 'char_376_therex'],
  (item) => item
);
const POS_AND_PRO_TABLE = {
  WARRIOR: 1,
  SNIPER: 2,
  TANK: 3,
  MEDIC: 4,
  SUPPORT: 5,
  CASTER: 6,
  SPECIAL: 7,
  PIONEER: 8,
  MELEE: 9,
  RANGED: 10
};
class AkhrService {
  characterList = null;

  async getJSON(url) {
    let retryTime = 0;
    while (true) {
      try {
        logger.info(`fetching: ${url}`);
        const meta = await axios.get(url, { timeout: 5000, responseType: 'json' });
        return meta.data;
      } catch (e) {
        if (retryTime < 4) {
          logger.info('fetch error, retry...');
          retryTime++;
        } else {
          e.customErrorMsg = '远端数据获取失败';
          throw e;
        }
      }
    }
  }

  // 获取公招干员列表，借鉴自
  // https://github.com/Kengxxiao/ArknightsGameData/blob/master/zh_CN/gamedata/excel/character_table.json
  getRecruitmentTable = (recruitDetail) =>
    Object.fromEntries(
      recruitDetail
        .replace(/\\n/g, '\n')
        .split(/\s*-*\n★+\s*/)
        .splice(1)
        .flatMap((line) => line.split(/(?<!<)\/(?!>)/).map((name) => name.trim()))
        .map((name) => [
          name.replace(/^<.+?>(.+?)<\/>$/g, '$1'),
          name.startsWith('<@rc.eml>') ? 2 : 1
        ])
    );

  getTabIdNameMap(gachaTags) {
    return gachaTags.reduce((prev, curr) => {
      prev[curr.tagId] = curr.tagName;
      return prev;
    }, {});
  }

  async updateAndFormate() {
    const characterTable = await this.getJSON(characterTableUrl);
    const gachaTable = await this.getJSON(gachaTableUrl);
    const recruitmentTable = this.getRecruitmentTable(gachaTable.recruitDetail);
    const tagNameIdMap = this.getTabIdNameMap(gachaTable.gachaTags);
    let tagTable = {};
    const staffTable = Object.keys(characterTable).reduce((table, staffId) => {
      const staffInfo = characterTable[staffId];
      if (!/^char_/.test(staffId) || staffInfo.isNotObtainable) return table;
      // if (!recruitmentTable[staffInfo.name]) return table;
      // 补全「支援机械」标签
      if (ROBOT_TAG_OWNER_TABLE[staffId]) {
        staffInfo.tagList.push('支援机械');
      }
      // 补全「资深」「高资」标签
      if (staffInfo.rarity + 1 === 6) {
        staffInfo.tagList.push('高级资深干员');
      }
      if (staffInfo.rarity + 1 === 5) {
        staffInfo.tagList.push('资深干员');
      }
      // 补全「位置」「干员类型」标签
      staffInfo.tagList.push(
        tagNameIdMap[POS_AND_PRO_TABLE[staffInfo.position]],
        tagNameIdMap[POS_AND_PRO_TABLE[staffInfo.profession]]
      );
      // 注册 标签 -> 干员 1 : n 映射
      staffInfo.tagList.forEach((staffTag) => {
        if (!tagTable[staffTag]) tagTable[staffTag] = new Set();
        tagTable[staffTag].add(staffInfo.name);
      });
      table[staffInfo.name] = {
        tags: staffInfo.tagList,
        name: staffInfo.name,
        enName: staffInfo.appellation,
        level: staffInfo.rarity + 1,
        hidden: !recruitmentTable[staffInfo.name]
      };
      return table;
    }, {});
    tagTable = Object.keys(tagTable).reduce((prev, tag) => {
      prev[tag] = Array.from(tagTable[tag]);
      return prev;
    }, {});
    this.characterList = {
      tabMap: tagTable,
      staffMap: staffTable
    };
    logger.info('akhrList has been update');
    Config.ADMINS.map(async (admin, index) => {
      await QQService.sendPrivateMessage(admin, '明日方舟公招数据已更新');
      await sleep();
      return index;
    });
  }

  async getAkhrList() {
    if (!this.characterList) {
      await this.updateAndFormate();
    }
    return this.characterList;
  }

  combine(words, list) {
    list = list || this.characterList;
    // 过滤OCR识别出的文字, 只留tag名
    words = words.filter((word) => list.tagMap[word]);
    // 组合, 3-1个tag的所有组合方式
    const combineTags = flatMap([3, 2, 1], (count) => combinations(words, count));
    const data = combineTags.reduce((result, tags) => {
      // 取不同tag的干员的交集
      const staffNames = intersection(...tags.map((tag) => list.tagMap[tag]));
      // 干员等级总和, 后排序用
      let levelSum = 0;
      // 根据干员名反查干员信息, 并
      let staffs = staffNames.reduce((staffList, name) => {
        const staff = list.staffMap[name];
        // 过滤
        if (
          staff &&
          !staff.hidden && // 不在公招池里的
          !(staff.level === 6 && tags.indexOf('高级资深干员') === -1) // 6星,但是没有高级资深干员tag
        ) {
          levelSum += staff.level;
          staffList.push(staff);
        }
        return staffList;
      }, []);
      // 按星级排序
      staffs = staffs.sort((a, b) => b.level - a.level);
      if (staffs.length) {
        result.push({
          tags,
          averageLevel: levelSum / staffs.length,
          staffs
        });
      }
      return result;
    }, []);
    return {
      words,
      // 按平均等级排序
      combined: data.sort((a, b) => b.averageLevel - a.averageLevel)
    };
  }

  async getORCResult(imgUrl) {
    if (isDev()) {
      return ['辅助干员', '先锋干员', '远程位', '新手', '费用回复'];
    }
    const meta = await axios({
      url: 'https://api.ocr.space/parse/imageurl',
      params: {
        apikey: Config.OCR_KEY,
        url: imgUrl,
        language: 'chs'
      }
    });
    if (Array.isArray(meta.data.ParsedResults)) {
      const ocrString = meta.data.ParsedResults[0].ParsedText || '';
      return ocrString
        .replace(/\r\n$/, '')
        .replace(/冫口了/g, '治疗')
        .split('\r\n');
    }
    throw new Error(`ocr parse error\n${meta.data.ErrorMessage.join('\n')}`);
  }

  parseTextOutput(result) {
    const { words, combined } = result;
    let text = `识别词条: ${words.join('、')}\n\n`;
    text += combined
      .map(({ tags, staffs }) => {
        const staffsWithLevel = staffs.map(({ level, name }) => `(${level})${name}`);
        return `【${tags.join('+')}】${staffsWithLevel.join(' ')}`;
      })
      .join('\n==========\n');
    return text;
  }

  async parseImageOutPut(result, withStaffImage) {
    const drawer = new Drawer(result, 1200, 20, withStaffImage);
    const draw = await drawer.draw();
    // const stream = draw.createPNGStream();
    // const filePath = path.resolve(__dirname, '../../../res/', `outPut${Date.now()}.png`);
    // const out = fs.createWriteStream(filePath);
    // stream.pipe(out);
    // out.on('finish', () => {
    //   console.log('write file to:');
    //   console.log(filePath);
    //   done('done');
    // });
    return draw.toBuffer('image/png').toString('base64');
  }
}

export default new AkhrService();
