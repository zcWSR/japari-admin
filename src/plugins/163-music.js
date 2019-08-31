import axios from 'axios';
import Config from '../config';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import logger from '../utils/logger';

const commandPrefixList = ['点歌', '来一首', '我想听'];

@Plugin({
  name: '163-music',
  wight: 99,
  type: 'message',
  shortInfo: '网易云点歌',
  info: '网易云音乐点歌, 使用方法: 点歌 xx, 来一首 xx, 我想听 xx',
  mute: true
})
class NetEastMusic {
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

  async doSearch(keyword) {
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
    let forSend = '';
    if (!c) return; // 不是指令, 直接跳过流程
    const result = await this.doSearch(c.keyword);
    if (result === null) {
      forSend = '请求失败, 请重试';
    } else if (typeof result === 'string' && result) {
      forSend = result;
    } else {
      forSend = this.buildScheme(result.id);
    }
    this.sendMessage(forSend, body, type);
    return 'break';
  }
}
export default NetEastMusic;
