import { v4 as uuid } from 'uuid';
import axios from 'axios';
import { defaultCardConfig, generateCard } from 'taffy-pvp-card-sw';
import { createCanvas } from '@napi-rs/canvas';
import FirebaseService from './firebase-service';
import logger from '../utils/logger';

const EQUIP_TYPE_MAP = {
  EQUIP_BRACER: 'flower',
  EQUIP_NECKLACE: 'feather',
  EQUIP_SHOES: 'sands',
  EQUIP_RING: 'goblet',
  EQUIP_DRESS: 'circlet'
};

export class GenshinError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'GenshinError';
  }
}

class GenshinService {
  buildReliquaryInfo(item) {
    let info;
    if (item) {
      const { reliquarySubstats } = item.flat;
      const subProps = Array.isArray(reliquarySubstats)
        ? reliquarySubstats.map((subStats) => ({
          id: subStats.appendPropId,
          value: subStats.statValue
        }))
        : [];
      info = {
        id: item.itemId,
        level: item.reliquary.level,
        mainProp: {
          id: item.flat.reliquaryMainstat.mainPropId,
          value: item.flat.reliquaryMainstat.statValue
        },
        subProps,
        type: EQUIP_TYPE_MAP[item.flat.equipType]
      };
    }
    return info;
  }

  buildWeaponInfo(item) {
    let info;
    if (item) {
      info = {
        id: item.itemId,
        level: item.weapon.level,
        promoteLevel: item.weapon.promoteLevel,
        mainProp: {
          id: item.flat.weaponStats[0].appendPropId,
          value: item.flat.weaponStats[0].statValue
        },
        subProp:
          item.flat.weaponStats.length > 1
            ? {
              id: item.flat.weaponStats[1].appendPropId,
              value: item.flat.weaponStats[1].statValue
            }
            : null
      };
    }
    return info;
  }

  buildCharacterData(uid, playerInfo, avatarInfo) {
    const equipMap = {};
    avatarInfo.equipList.forEach((item) => {
      if (item.flat.itemType === 'ITEM_RELIQUARY') {
        equipMap[EQUIP_TYPE_MAP[item.flat.equipType]] = item;
      } else if (item.flat.itemType === 'ITEM_WEAPON') {
        equipMap.weapon = item;
      }
    });
    const {
      flower, feather, sands, goblet, circlet, weapon
    } = equipMap;

    return {
      owner: {
        uid,
        name: playerInfo.nickname
      },
      id: avatarInfo.avatarId,
      level: parseInt(avatarInfo.propMap['4001'].val, 10),
      talent: Array.isArray(avatarInfo.talentIdList)
        ? avatarInfo.talentIdList.length
        : 0,
      skills: Object.keys(avatarInfo.skillLevelMap).map(
        (key) => avatarInfo.skillLevelMap[key]
      ),
      fightPropMap: avatarInfo.fightPropMap,
      reliquaries: {
        flower: this.buildReliquaryInfo(flower),
        feather: this.buildReliquaryInfo(feather),
        sands: this.buildReliquaryInfo(sands),
        goblet: this.buildReliquaryInfo(goblet),
        circlet: this.buildReliquaryInfo(circlet)
      },
      weapon: this.buildWeaponInfo(weapon)
    };
  }

  // @return [rowCount, colCount]
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
    return avatarInfoList.map((avatarInfo) => this.buildCharacterData(uid, playerInfo, avatarInfo));
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
    const width = colCount * defaultCardConfig.width;
    const height = rowCount * defaultCardConfig.height;
    logger.info(`generate card grid ${colCount} * ${rowCount}, size ${width} * ${height}`);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    cardCanvasList.forEach((cardCanvas, index) => {
      const col = index % colCount;
      const row = Math.floor(index / colCount);
      const x = col * defaultCardConfig.width;
      const y = row * defaultCardConfig.height;
      ctx.drawImage(cardCanvas, x, y);
    });
    return canvas.toBuffer('image/png');
  }

  async drawCharaArtifactsAndGetRemoteUrl(uid, position) {
    const imageBuffer = await this.drawCharaArtifactsImage(uid, position);
    const filePath = `genshin/${uid}/${Date.now()}.png`;
    const file = FirebaseService.bucket.file(filePath);
    const fileDownloadToken = uuid();
    await file.save(imageBuffer, {
      validation: 'md5',
      metadata: {
        contentType: 'image/png',
        cacheControl: 'max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: fileDownloadToken
        }
      }
    });
    return `https://firebasestorage.googleapis.com/v0/b/${
      FirebaseService.bucketUrl
    }/o/${encodeURIComponent(filePath)}?alt=media&token=${fileDownloadToken}`;
  }
}

export default new GenshinService();
