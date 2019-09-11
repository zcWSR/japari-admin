import axios from 'axios';
import Config from '../config';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import logger from '../utils/logger';

const commandPrefixList = ['点歌', '来一首', '我想听'];

const MAX_COUNT_PRE_MINUTE = 3;

@Plugin({
  name: '163-music',
  wight: 99,
  type: 'message',
  shortInfo: '网易云点歌',
  info: '网易云音乐点歌, 使用方法: 点歌 xx, 来一首 xx, 我想听 xx',
  mute: true
})
class NetEastMusic {
  getRedisKey(id) {
    return `${this.name}-${id}`;
  }

  isCommand(content) {
    let match = null;
    let prefix = null;
    commandPrefixList.some((p) => {
      const result = content.match(new RegExp(`^${p}\\s(.*)$`));
      if (result) {
        match = result;
        prefix = p;
        return true;
      }
      return false;
    });
    if (match) {
      const [, keyword] = match;
      return { prefix, keyword };
    }
    return false;
  }

  async canSearch({ user_id: userId, group_id: groupId }, type) {
    try {
      const id = type === 'group' ? groupId : userId;
      const key = this.getRedisKey(id);
      let [firstTime, count] = (await RedisService.get(key) || ',').split(',');
      const nowDateTime = Date.now();
      firstTime = +firstTime || nowDateTime;
      count = +count || 0;

      // 超过一分钟, 用当前时间重设, 次数重置为1, 并继续
      if (nowDateTime - firstTime > 1000 * 60) {
        await RedisService.set(key, `${nowDateTime},1`);
        return true;
      }
      // 如不足最大限制次数, 则记录第一次调用时间和当前次数, 并继续
      if (count < MAX_COUNT_PRE_MINUTE) {
        await RedisService.set(key, `${firstTime},${count + 1}`);
        return true;
      }
      // 如超过最大调用次数并在一分钟内, 则判定为过量, 阻止
      await RedisService.set(key, `${firstTime},${count + 1}`);
      return false;
    } catch (e) {
      // 异常统一阻止
      logger.error(e.toString());
      return false;
    }
  }

  async fetchMusic(keyword) {
    logger.info(`search music with keyword: ${keyword}`);
    try {
      const meta = await axios({
        url: `${Config.NET_EAST_MUSIC_SERVER}/search`,
        method: 'get',
        params: {
          keywords: keyword,
          limit: 1,
          type: 1
        }
      });
      const { result = {} } = meta.data;
      if (!result.songs || !result.songs.length) {
        logger.info('search no result');
        return `无 '${keyword}' 的搜索结果`;
      }
      const [song] = result.songs;
      logger.info(`search success, music title: ${song.name}, id: ${song.id}`);
      return song;
    } catch (e) {
      if (e.isAxiosError && e.response && e.response.data) {
        const { msg } = e.response.data;
        return msg;
      }
      logger.info('search failed');
      logger.error(e.toString());
      return null;
    }
  }

  async doSearch(keyword) {
    const result = await this.fetchMusic(keyword);
    if (result === null) {
      return '请求失败, 请重试';
    }
    if (typeof result === 'string' && result) {
      return result;
    }
    return this.buildScheme(result.id);
  }

  buildScheme(id) {
    return `[CQ:music,type=163,id=${id}]`;
  }

  sendMessage(msg, body, type) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    }
    if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  async go(body, type) {
    const { message } = body;
    const c = this.isCommand(message);
    if (!c) return; // 不是指令, 直接跳过流程
    if (await this.canSearch(body, type)) {
      const msg = await this.doSearch(c.keyword);
      this.sendMessage(msg, body, type);
    } else {
      this.sendMessage(`每分钟最多可点${MAX_COUNT_PRE_MINUTE}首, 请稍后重试`, body, type);
    }
    return 'break';
  }
}
export default NetEastMusic;
