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
          name, level, sex, type
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
            level
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
    this.AKHR_LIST = akhrList;
    logger.info('akhrList has been update');
  }

  async getAkhrList() {
    if (!this.AKHR_LIST) {
      const json = await RedisService.get(AKHR_LIST_KEY);
      this.AKHR_LIST = JSON.parse(json);
    }
    return this.AKHR_LIST;
  }

  combine(words, list) {
    words = words.filter(word => list.tagMap[word]);
    const combineTags = _.flatMap([3, 2, 1], count => _.combinations(words, count));
    const data = combineTags.reduce((result, tags) => {
      const staffs = _.intersection(...tags.map(tag => list.tagMap[tag]));
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

  parseTextOutput(list, result) {
    const { words, combined } = result;
    let text = `识别词条: ${words.split('、')}\n\n`;
    text += combined
      .map(({ tags, staffs }) => {
        const staffsWithLevel = staffs.map((staff) => {
          const { level, name } = list.staffMap[staff];
          return `(${level})${name}`;
        });
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
        url: encodeURIComponent(imgUrl),
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
