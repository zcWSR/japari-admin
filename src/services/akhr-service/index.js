import axios from 'axios';
import _ from 'lodash';
import logger from '../../utils/logger';

const characterTableUrl =
  'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/character_table.json';
const gachaTableUrl =
  'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/gacha_table.json';

const ROBOT_TAG_OWNER_TABLE = _.keyBy(['char_285_medic2', 'char_286_cast3', 'char_376_therex']);
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
          throw e;
        }
      }
    }
  }

  // 获取公招干员列表，借鉴自
  // https://github.com/Kengxxiao/ArknightsGameData/blob/master/zh_CN/gamedata/excel/character_table.json
  getRecruitmentTable = recruitDetail => _.fromPairs(_.flatten(
    recruitDetail
      .replace(/\\n/g, '\n')
      .split(/\s*-*\n★+\s*/)
      .splice(1)
      .map(line => line.split(/(?<!<)\/(?!>)/).map(name => name.trim()))
  ).map(name => [
    name.replace(/^<.+?>(.+?)<\/>$/g, '$1'),
    name.startsWith('<@rc.eml>') ? 2 : 1
  ]));

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
    return console.log(JSON.stringify({ tagTable, staffTable }, null, 2));
  }
}

export default new AkhrService();
