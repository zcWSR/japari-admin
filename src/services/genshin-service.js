import axios from 'axios';
import { globalConfig, cardConfig, parseCharacterData, generateCard } from 'taffy-pvp-card-sw';
import { createCanvas } from '@napi-rs/canvas';
import FirebaseService from './firebase-service';
import logger from '../utils/logger';
import path from 'path'

globalConfig.logger = logger;
globalConfig.cacheDir = path.resolve(__dirname, '../../.taffy-pvp-card-sw-cache')

export class GenshinError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'GenshinError';
  }
}

class GenshinService {
  /** 
   * @return [rowCount, colCount]
   */
  calcRowCol(length) {
    if (length <= 4) return [1, length];
    if (length <= 6) return [2, 3];
    return [Math.ceil(length / 4), 4];
  }

  async getCharaData(uid) {
    let meta;
    try {
      logger.info(`fetch genshin player(${uid}) character data...`);
      meta = await axios.get(`https://enka.network/api/uid/${uid}`);
    } catch (error) {
      if (error?.response) {
        const code = error.response.status;
        logger.info(`fetch genshin player(${uid}) character error, code ${code}`);
        switch (code) {
          case 400:
            throw new GenshinError('UID 格式错误');
          case 404:
            throw new GenshinError('玩家不存在（MHY 服务器说的）');
          case 424:
            throw new GenshinError('系统维护中，再等等吧');
          case 429:
            throw new GenshinError('请求频率过高，请稍后再试吧');
          case 500:
          case 503:
          default:
            throw new GenshinError('出错了，但不知道为什么');
        }
      }
      logger.info(`fetch genshin player(${uid}) character error, unexpected error`);
      throw new GenshinError('获取数据失败，请重试');
    }
    const { playerInfo, avatarInfoList } = meta.data;
    if (!avatarInfoList?.length) {
      throw new GenshinError('未获取到角色数据，请尝试更新展示板');
    }
    return avatarInfoList.map((avatarInfo) => parseCharacterData(uid, playerInfo, avatarInfo));
  }

  async drawCharaArtifactsImage(uid, position) {
    let dataList = await this.getCharaData(uid);
    // 如果传了 position 只选出对应 position 的，本质还是渲染拼图只不过这里只拼一个
    if (position) {
      dataList = [dataList[position - 1]];
    }
    logger.info(`player(${uid}) character total number: ${dataList.length}`);
    const cardCanvasList = await Promise.all(dataList.map((data) => generateCard(data)));
    const [rowCount, colCount] = this.calcRowCol(cardCanvasList.length);
    const width = colCount * cardConfig.width;
    const height = rowCount * cardConfig.height;
    logger.info(`generating card grid ${colCount} * ${rowCount}, size ${width} * ${height}`);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    cardCanvasList.forEach((cardCanvas, index) => {
      const col = index % colCount;
      const row = Math.floor(index / colCount);
      const x = col * cardConfig.width;
      const y = row * cardConfig.height;
      ctx.drawImage(cardCanvas, x, y);
    });
    const result = canvas.toBuffer('image/png');
    logger.info(`player(${uid}) character image generated`);
    return result;
  }

  async drawCharaArtifactsAndGetRemoteUrl(uid, position) {
    const imageBuffer = await this.drawCharaArtifactsImage(uid, position);
    const filePath = `genshin/${uid}/${Date.now()}.png`;
    return FirebaseService.uploadImage(filePath, imageBuffer);
  }
}

export default new GenshinService();
