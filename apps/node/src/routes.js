import Router from '@koa/router';
import GenshinService from './services/genshin-service.js';
import ImageService from './services/image-service.js';
import ScheduleService from './services/schedule-service.js';

const router = new Router();

// ========== 根路径 ==========
/** 首页：简单占位 */
router.get('/', (ctx) => {
  ctx.body = '<h1>japari node</h1>';
});

// ========== 供 Worker 或外部调用的接口 ==========
/** 生成图片并上传 R2，返回公网 URL；body: { type: 'hoshii'|'genshin', ...params } */
router.post('/generate-image', async (ctx) => {
  const { type, ...params } = ctx.request.body || {};
  const url = await ImageService.generate(type, params);
  ctx.body = { url };
});

/** 刷新定时任务：从 Worker 拉取最新 schedule 列表并重新注册 node-schedule（Worker 在 schedule 命令修改后调用） */
router.post('/refresh-schedules', async (ctx) => {
  await ScheduleService.refresh();
  ctx.body = { ok: true };
});

/** 内部消息：如原神缓存更新，仅更新本地缓存不发 QQ */
router.post('/message', async (ctx) => {
  const { type, data } = ctx.request.body || {};
  if (type === 'genshinUpdate') {
    await GenshinService.updateCache(data || []);
  }
  ctx.body = 'ok';
});

export default router;
