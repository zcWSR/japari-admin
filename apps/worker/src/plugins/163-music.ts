import axios, { type AxiosError } from 'axios';
import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';
import type {
  OB11GroupMessage,
  OB11Message,
  OB11PrivateMessage,
  OB11Segment
} from '@/types/onebot11';
import Config from '../config';
import { Plugin } from '../decorators/plugin';
import logger from '../utils/logger';
import { extractFirstText } from '../utils/message';
import type { CommandEvent, PluginPostTypeLike } from './types';

const commandPrefixList = ['点歌', '来一首', '我想听'];

const MAX_COUNT_PRE_MINUTE = 2;

const CHS_NUMBER_LIST = ['一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九'];

const SUFFIX_TEXT_TEMPLATE_MAP = {
  prev: (count: number) => `前${CHS_NUMBER_LIST[count - 1]}首`,
  next: (count: number) => `后${CHS_NUMBER_LIST[count - 1]}首`
};

const SHIFT_METHOD_MAP = {
  prev: (index: number, count: number) => index - count,
  next: (index: number, count: number) => index + count
};

type MusicCommand = {
  prefix?: string | null;
  suffix?: 'prev' | 'next' | 'clear';
  shiftCount: number;
  keyword: string;
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
  // ==========================================
  // KV 数据操作
  // ==========================================

  getTimeoutKey(id: string | number) {
    return `163-music-timeout-${id}`;
  }

  getKeywordCacheKey(keyword: string) {
    return `163-music-keyword-${keyword}`;
  }

  async getTimeout(id: string | number) {
    return KVService.get(this.getTimeoutKey(String(id)));
  }

  async setTimeout(id: string | number, value: string) {
    return KVService.set(this.getTimeoutKey(String(id)), value);
  }

  async getKeywordCache(keyword: string) {
    return KVService.get(this.getKeywordCacheKey(keyword));
  }

  async setKeywordCache(keyword: string, id: string | number) {
    // 24 小时过期
    return KVService.set(this.getKeywordCacheKey(keyword), String(id), 86400);
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  isCommand(message: OB11Segment[]): MusicCommand | false {
    const content = extractFirstText(message);
    if (!content) return false;
    let match: RegExpMatchArray | null = null;
    let prefix: string | null = null;
    commandPrefixList.some((p: string) => {
      const result = content.match(new RegExp(`^${p}(prev|next|clear)?(\\d*)?\\s(.*)$`));
      if (result) {
        match = result;
        prefix = p;
        return true;
      }
      return false;
    });
    if (match) {
      // shiftCount 只会在 suffix 有值时才会生效，所以正常点歌时可以随便给默认值
      const [, suffix, shiftCount = 1, keyword] = match as RegExpMatchArray;
      return {
        prefix,
        suffix: suffix as 'prev' | 'next' | 'clear',
        shiftCount: +shiftCount,
        keyword: keyword.trim()
      };
    }
    return false;
  }

  async canSearch(body: OB11Message, type: PluginPostTypeLike) {
    if (Config.ADMINS.includes(body.user_id)) {
      return true;
    }
    try {
      const id =
        type === 'group'
          ? (body as OB11GroupMessage).group_id
          : (body as OB11PrivateMessage).user_id;
      const [firstTimeString, countString] = ((await this.getTimeout(id)) || ',').split(',');
      const nowDateTime = Date.now();
      const firstTime = +firstTimeString || nowDateTime;
      const count = +countString || 0;

      // 超过一分钟，用当前时间重设，次数重置为 1，并继续
      if (nowDateTime - firstTime > 1000 * 60) {
        await this.setTimeout(id, `${nowDateTime},1`);
        return true;
      }
      // 如不足最大限制次数，则记录第一次调用时间和当前次数，并继续
      if (count < MAX_COUNT_PRE_MINUTE) {
        await this.setTimeout(id, `${firstTime},${count + 1}`);
        return true;
      }
      // 如超过最大调用次数并在一分钟内，则判定为过量，阻止
      await this.setTimeout(id, `${firstTime},${count + 1}`);
      return false;
    } catch (e) {
      // 异常统一阻止
      logger.error(e);
      return false;
    }
  }

  // 返回 number 类型的 id
  async checkKeywordCache(keyword: string) {
    try {
      logger.info(`checking music keyword cache: ${keyword}`);
      const result = await this.getKeywordCache(keyword);
      if (result) {
        logger.info(`get keyword cache, id: ${result}`);
      } else {
        logger.info('cache not found, fetching...');
      }
      return result ? result : null;
    } catch (e) {
      logger.error('check keyword cache error');
      logger.error(e);
      return null;
    }
  }

  async saveKeywordCache(keyword: string, id: string | number) {
    logger.info(`set music keyword cache: ${keyword}, id: ${id}`);
    await this.setKeywordCache(keyword, id);
  }

  getSearchUrl() {
    // if (Math.random() > 0.5) {
    return `${Config.NET_EAST_MUSIC_SERVER}/search`;
    // }
    // 发现两个接口返回的结果不总是一致的, 暂时改成用一个
    // return `${Config.NET_EAST_MUSIC_SERVER}/search/suggest`;
  }

  async fetchMusic(keyword: string) {
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
    } catch (error) {
      const e = error as AxiosError<{ msg: string }>;
      if (e.isAxiosError && e.response && e.response.data) {
        const { msg } = e.response.data;
        return msg;
      }
      logger.info('search failed');
      logger.error(e.toString());
      throw new Error('请求失败, 请重试');
    }
  }

  getShiftedSongId(
    songs: { id: string }[],
    id: string,
    suffix: MusicCommand['suffix'],
    shiftCount: number
  ) {
    // 没有 prev 或 next 指令尾缀，则直接返回查到的 id
    if (!suffix) {
      return id;
    }
    // kv 返回的结果是数字
    const currIdx = songs.findIndex((song) => song.id === id);
    // 返回结果里找不到了，默认取第一首
    if (currIdx === -1) {
      logger.info('can not find music in search result, use index 0 as default');
      return songs[0].id;
    }
    const shiftedIndex = SHIFT_METHOD_MAP[suffix as 'prev'](currIdx, shiftCount) as number;
    logger.info(`shifted to index: ${shiftedIndex}`);
    // 取偏移
    const shiftedSong = songs[shiftedIndex];
    if (!shiftedSong) {
      throw new Error('超出偏移范围, 无结果');
    }
    return shiftedSong.id;
  }

  async doSearch(
    { keyword, suffix, shiftCount }: MusicCommand,
    body: OB11Message,
    type: PluginPostTypeLike
  ) {
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
          `正在查询当前关键词搜索结果的${SUFFIX_TEXT_TEMPLATE_MAP[suffix](shiftCount!)}...`,
          body,
          type
        );
      }
      if (!id || suffix) {
        const songs = await this.fetchMusic(keyword);
        if (!id) {
          // 从缓存里没取到，直接取接口返回的第一首
          const [song] = songs;
          id = song.id;
          await this.saveKeywordCache(keyword, id!);
        } else {
          // 取到了走上一首下一首逻辑
          const shiftedId = this.getShiftedSongId(songs, id, suffix as 'prev' | 'next', shiftCount);
          if (shiftedId !== id) {
            await this.saveKeywordCache(keyword, shiftedId);
          }
          id = shiftedId;
        }
      }
      return id;
    } catch (e) {
      return (e as Error).message;
    }
  }

  sendMessage(msg: string, body: CommandEvent, type: PluginPostTypeLike) {
    if (type === 'group') {
      QQService.sendGroupMessage((body as OB11GroupMessage).group_id, msg);
    }
    if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  sendMusic(id: string | number, body: CommandEvent, type: PluginPostTypeLike) {
    if (type === 'group') {
      QQService.sendGroupMusic((body as OB11GroupMessage).group_id, id);
    }
    if (type === 'private') {
      QQService.sendPrivateMusic(body.user_id, id);
    }
  }

  async go(body: OB11Message, type: PluginPostTypeLike) {
    const { message } = body;
    const c = this.isCommand(message);
    if (!c) return; // 不是指令，直接跳过流程
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
      c.suffix = undefined;
      c.shiftCount = 0;
    }
    if (await this.canSearch(body, type)) {
      const id = await this.doSearch(c, body, type);
      if (!id || Number.isNaN(+id)) {
        logger.info(`an error occurred: ${id}`);
        this.sendMessage('非法 id', body, type);
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
