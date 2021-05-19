import axios from 'axios';
import _ from 'lodash';
import 'lodash.combinations';
import RedisService from '../redis-service';
import Config from '../../config';
import logger from '../../utils/logger';
import Drawer from './image-drawer';
import { isDev } from '../../utils/env';

// 更新用数据源 redis key
const AKHR_UPDATE_URL_KEY = 'akhr-update-url';
const AKHR_LIST_KEY = 'akhr-list';
const AKHR_LIST_EXPIRE_TIME = 60 * 60 * 24 * 7;

class AkhrService {
  AKHR;
  async fetchMetaData(newUrl) {
    let url = '';
    try {
      if (newUrl) {
        logger.info('has new update url, update redis');
        await RedisService.set(AKHR_UPDATE_URL_KEY, newUrl);
        url = newUrl;
      } else {
        logger.info('get update url from redis');
        url = await RedisService.get(AKHR_UPDATE_URL_KEY);
        if (!url) {
          logger.info('no url find, use config as default');
          url = Config.AKHR_UPDATE_SERVER;
        }
      }
    } catch (e) {
      e.customErrorMsg = 'Redis url操作失败';
      throw e;
    }
    let meta;
    try {
      logger.info('fetching akhr origin list...');
      meta = await axios.get(url);
    } catch (e) {
      e.customErrorMsg = '远端数据获取失败';
      throw e;
    }
    return meta.data;
  }

  formatMetaData(list) {
    const result = list.reduce(
      (prev, staff) => {
        const {
          name, level, sex, type, hidden
        } = staff;
        const { tags } = staff;
        tags.push(`${sex}性干员`);
        tags.push(`${type}干员`);
        if (level === 6) {
          tags.push('高级资深干员');
        }
        tags.forEach((tag) => {
          if (!prev.tagMap[tag]) prev.tagMap[tag] = new Set();
          prev.tagMap[tag].add(name);
        });
        // 数据源列表存在name重复但内容不同的项目, 采用覆盖原则
        // 优先选择tag多的, 或者不隐藏的
        const staffCache = prev.staffMap[name];
        if (!staffCache || staffCache.tags.length < tags.length || !hidden) {
          prev.staffMap[name] = {
            tags,
            name,
            enName: staff['name-en'],
            level,
            hidden
          };
        }
        return prev;
      },
      { tagMap: {}, staffMap: {} }
    );
    result.tagMap = Object.keys(result.tagMap).reduce((prev, tag) => {
      prev[tag] = Array.from(result.tagMap[tag]);
      return prev;
    }, {});
    return result;
  }

  async updateAkhrList(newUrl) {
    const metaList = await this.fetchMetaData(newUrl);
    try {
      const akhrList = this.formatMetaData(metaList);
      await RedisService.set(AKHR_LIST_KEY, JSON.stringify(akhrList));
      await RedisService.redis.expire(AKHR_LIST_KEY, AKHR_LIST_EXPIRE_TIME);
      this.AKHR_LIST = akhrList;
    } catch (e) {
      e.customErrorMsg = '格式转换或存储失败';
      throw e;
    }
    logger.info('akhrList has been update');
  }

  async getAkhrList() {
    if (!this.AKHR_LIST) {
      const json = await RedisService.get(AKHR_LIST_KEY);
      if (json) {
        this.AKHR_LIST = JSON.parse(json);
      } else {
        await this.updateAkhrList();
      }
    }
    return this.AKHR_LIST;
  }

  combine(words, list) {
    // 过滤OCR识别出的文字, 只留tag名
    words = words.filter(word => list.tagMap[word]);
    // 组合, 3-1个tag的所有组合方式
    const combineTags = _.flatMap([3, 2, 1], count => _.combinations(words, count));
    const data = combineTags.reduce((result, tags) => {
      // 取不同tag的干员的交集
      const staffNames = _.intersection(...tags.map(tag => list.tagMap[tag]));
      // 干员等级总和, 后排序用
      let levelSum = 0;
      // 根据干员名反查干员信息, 并
      let staffs = staffNames.reduce((staffList, name) => {
        const staff = list.staffMap[name];
        // 过滤
        if (
          staff
          && !staff.hidden // 不在公招池里的
          && !(staff.level === 6 && tags.indexOf('高级资深干员') === -1) // 6星,但是没有高级资深干员tag
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
    try {
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
    } catch (e) {
      throw e;
    }
  }
}

export default new AkhrService();
