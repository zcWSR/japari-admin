import axios from 'axios';
import Config from '../config';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import logger from '../utils/logger';
import { extractFirstText } from '../utils/message';

const commandPrefixList = ['点歌', '来一首', '我想听'];

const MAX_COUNT_PRE_MINUTE = 2;

const CHS_NUMBER_LIST = ['一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九'];

const SUFFIX_TEXT_TEMPLATE_MAP = {
  prev: (count) => `前${CHS_NUMBER_LIST[count - 1]}首`,
  next: (count) => `后${CHS_NUMBER_LIST[count - 1]}首`
};

const SHIFT_METHOD_MAP = {
  prev: (index, count) => index - count,
  next: (index, count) => index + count
};

@Plugin({
  name: '163-music',
  weight: 99,
  type: 'message',
  shortInfo: '网易云点歌',
  info: '网易云音乐点歌, 使用方法: 点歌 xx, 来一首 xx, 我想听 xx\n 支持 ',
  default: true,
  mute: true
})
class NetEastMusic {
  getTimeoutRedisKey(id) {
    return `163-music-timeout-${id}`;
  }

  getIdCacheRedisKey(keyword) {
    return `163-music-keyword-${keyword}`;
  }

  isCommand(message) {
    // 从消息段数组提取第一个 text 段的内容
    const content = extractFirstText(message);
    if (!content) return false;

    let match = null;
    let prefix = null;
    commandPrefixList.some((p) => {
      const result = content.match(new RegExp(`^${p}(prev|next|clear)?(\\d*)?\\s(.*)$`));
      if (result) {
        match = result;
        prefix = p;
        return true;
      }
      return false;
    });
    if (match) {
      // shiftCount只会在suffix有值时才会生效, 所以正常点歌时可以随便给默认值
      const [, suffix, shiftCount = 1, keyword] = match;
      return {
        prefix,
        suffix,
        shiftCount: +shiftCount,
        keyword: keyword.trim()
      };
    }
    return false;
  }

  async canSearch({ user_id: userId, group_id: groupId }, type) {
    if (Config.ADMINS.includes(userId)) {
      return true;
    }
    try {
      const id = type === 'group' ? groupId : userId;
      const timeoutKey = this.getTimeoutRedisKey(id);
      let [firstTime, count] = ((await RedisService.get(timeoutKey)) || ',').split(',');
      const nowDateTime = Date.now();
      firstTime = +firstTime || nowDateTime;
      count = +count || 0;

      // 超过一分钟, 用当前时间重设, 次数重置为1, 并继续
      if (nowDateTime - firstTime > 1000 * 60) {
        await RedisService.set(timeoutKey, `${nowDateTime},1`);
        return true;
      }
      // 如不足最大限制次数, 则记录第一次调用时间和当前次数, 并继续
      if (count < MAX_COUNT_PRE_MINUTE) {
        await RedisService.set(timeoutKey, `${firstTime},${count + 1}`);
        return true;
      }
      // 如超过最大调用次数并在一分钟内, 则判定为过量, 阻止
      await RedisService.set(timeoutKey, `${firstTime},${count + 1}`);
      return false;
    } catch (e) {
      // 异常统一阻止
      logger.error(e.toString());
      return false;
    }
  }

  // 返回number类型的id
  async checkKeywordCache(keyword) {
    try {
      logger.info(`checking music keyword cache: ${keyword}`);
      const result = await RedisService.get(this.getIdCacheRedisKey(keyword));
      if (result) {
        logger.info(`get keyword cache, id: ${result}`);
      } else {
        logger.info('cache not found, fetching...');
      }
      return +result;
    } catch (e) {
      logger.error('check keyword cache error');
      logger.error(e);
      return null;
    }
  }

  async setKeywordCache(keyword, id) {
    logger.info(`set music keyword cache: ${keyword}, id: ${id}`);
    const cacheKey = this.getIdCacheRedisKey(keyword);
    await RedisService.set(cacheKey, id);
    await RedisService.redis.expire(cacheKey, 60 * 60 * 24);
  }

  getSearchUrl() {
    // if (Math.random() > 0.5) {
    return `${Config.NET_EAST_MUSIC_SERVER}/search`;
    // }
    // 发现两个接口返回的结果不总是一致的, 暂时改成用一个
    // return `${Config.NET_EAST_MUSIC_SERVER}/search/suggest`;
  }

  async fetchMusic(keyword) {
    logger.info(`search music with keyword: ${keyword}`);
    try {
      const meta = await axios({
        url: this.getSearchUrl(),
        method: 'get',
        params: {
          keywords: keyword,
          type: 1,
          realIP: Config.IP
        }
      });
      const { result = {} } = meta.data;
      if (!result.songs || !result.songs.length) {
        logger.info('search no result');
        throw new Error(`无 '${keyword}' 的搜索结果`);
      }
      return result.songs;
    } catch (e) {
      if (e.isAxiosError && e.response && e.response.data) {
        const { msg } = e.response.data;
        return msg;
      }
      logger.info('search failed');
      logger.error(e.toString());
      throw new Error('请求失败, 请重试');
    }
  }

  getShiftedSongId(songs, id, suffix, shiftCount) {
    // 没有pre或next指令尾缀, 则直接返回查到的id
    if (!suffix) {
      return id;
    }
    // redis 返回的结果是数字
    const currIdx = songs.findIndex((song) => song.id === id);
    // 返回结果里找不到了, 默认取第一首
    if (currIdx === -1) {
      logger.info('can not find music in search result, use index 0 as default');
      return songs[0].id;
    }
    const shiftedIndex = SHIFT_METHOD_MAP[suffix](currIdx, shiftCount);
    logger.info(`shifted to index: ${shiftedIndex}`);
    // 取偏移
    const shiftedSong = songs[shiftedIndex];
    if (!shiftedSong) {
      throw new Error('超出偏移范围, 无结果');
    }
    return shiftedSong.id;
  }

  async doSearch({ keyword, suffix, shiftCount }, body, type) {
    try {
      let id = suffix !== 'clear' ? await this.checkKeywordCache(keyword) : null;
      // if (!id && suffix) {
      //   logger.info('with no suffix, return current id');
      // }
      if (suffix === 'clear') {
        logger.info('clear mode, skip check cache');
      }
      if (id && suffix && suffix !== 'clear') {
        logger.info(`searching music which ${suffix} ${shiftCount} current id`);
        this.sendMessage(
          `正在查询当前关键词搜索结果的${SUFFIX_TEXT_TEMPLATE_MAP[suffix](shiftCount)}...`,
          body,
          type
        );
      }
      if (!id || suffix) {
        const songs = await this.fetchMusic(keyword);
        if (!id) {
          // 从缓存里没取到, 直接取接口返回的第一首
          const [song] = songs;
          id = song.id;
          await this.setKeywordCache(keyword, id);
        } else {
          // 取到了走上一首下一首逻辑
          const shiftedId = this.getShiftedSongId(songs, id, suffix, shiftCount);
          if (shiftedId !== id) {
            await this.setKeywordCache(keyword, shiftedId);
          }
          id = shiftedId;
        }
      }
      return id;
    } catch (e) {
      return e.message;
    }
  }

  sendMessage(msg, body, type) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    }
    if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  sendMusic(id, body, type) {
    if (type === 'group') {
      QQService.sendGroupMusic(body.group_id, id);
    }
    if (type === 'private') {
      QQService.sendPrivateMusic(body.user_id, id);
    }
  }

  async go(body, type) {
    const { message } = body;
    const c = this.isCommand(message);
    if (!c) return; // 不是指令, 直接跳过流程
    logger.info(`163-music triggered, params: ${JSON.stringify(c)}`);
    if (!c.keyword) {
      this.sendMessage('非法参数', body, type);
      return 'break';
    }
    if (c.shiftCount > 9) {
      this.sendMessage('超出最大偏移量, 最多偏移九位', body, type);
      return 'break';
    }
    if (c.shiftCount === 0) {
      this.sendMessage('偏移0位和不偏移有啥区别呢?', body, type);
      // 假装无事发生
      c.suffix = null;
      c.shiftCount = null;
    }
    if (await this.canSearch(body, type)) {
      const id = await this.doSearch(c, body, type);
      if (Number.isNaN(+id)) {
        logger.info(`an error occurred: ${id}`);
        this.sendMessage(id, body, type);
      } else {
        logger.info(`send music with id: ${id}`);
        this.sendMusic(id, body, type);
      }
    } else {
      this.sendMessage(`每分钟最多可点${MAX_COUNT_PRE_MINUTE}首, 请稍后重试`, body, type);
    }
    return 'break';
  }
}
export default NetEastMusic;
