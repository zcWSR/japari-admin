import logger from '../utils/logger.js';
import GenshinService from './genshin-service.js';
import HoShiiService from './hoshii-service/index.js';

/**
 * 统一图片生成入口：画图 + 上传 R2 返回 URL
 * @param {string} type - 'hoshii' | 'genshin'
 * @param {object} params - type=hoshii: { topText, bottomText, fileName }; type=genshin: { uid, position? }
 * @returns {Promise<string>} 图片公网 URL
 */
async function generate(type, params = {}) {
  if (type === 'hoshii') {
    const { topText, bottomText, fileName } = params;
    const name = fileName || `hoshii-${Date.now()}`;
    return HoShiiService.drawAndGetRemoteUrl(topText || '', bottomText || '', name);
  }
  if (type === 'genshin') {
    const { uid, position } = params;
    if (!uid) throw new Error('genshin image need uid');
    return GenshinService.drawCharaArtifactsAndGetRemoteUrl(uid, position);
  }
  logger.warn('unknown image type: %s', type);
  throw new Error(`unknown image type: ${type}`);
}

export default { generate };
