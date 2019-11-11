import axios from 'axios';
import _ from 'lodash';
import 'lodash.combinations';
import RedisService from './redis-service';
import Config from '../config';
import logger from '../utils/logger';

const AKHR_LIST_KEY = 'akhr-list';

class AkhrService {
  AKHR;
  async fetchMetaData() {
    logger.info('fetching akhr origin list...');
    const meta = await axios.get('https://graueneko.github.io/akhr.json');
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
        if (!prev.staffMap[name]) {
          prev.staffMap[name] = {
            tags,
            name,
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

  async updateAkhrList() {
    const metaList = await this.fetchMetaData();
    const akhrList = this.formatMetaData(metaList);
    await RedisService.set(AKHR_LIST_KEY, JSON.stringify(akhrList));
    await RedisService.redis.expire(AKHR_LIST_KEY, 60 * 60 * 24 * 3);
    this.AKHR_LIST = akhrList;
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
      // 根据干员名反查干员信息, 并
      let staffs = staffNames.reduce((staffList, name) => {
        const staff = list.staffMap[name];
        // 过滤
        if (
          staff
          && !staff.hidden // 不在公招池里的
          && !(staff.level === 6 && tags.indexOf('高级资深干员') === -1) // 6星,但是没有高级资深干员tag
        ) {
          staffList.push(staff);
        }
        return staffList;
      }, []);
      // 按星级排序
      staffs = staffs.sort((a, b) => b.level - a.level);
      if (staffs.length) {
        result.push({
          tags,
          staffs
        });
      }
      return result;
    }, []);
    return {
      words,
      combined: data
    };
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

  async getORCResult(imgUrl) {
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
    throw new Error('ocr parse error');
  }
}

export default new AkhrService();
