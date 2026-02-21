import { Hono } from 'hono';
import botErrorReporter from './middlewares/bot-error-reporter';
import Config from './config';
import PluginService from './services/plugin-service';
import QQService from './services/qq-service';
import ScheduleService from './services/schedule-service';

const app = new Hono();

// ========== 根路径 ==========
/** 首页：展示 bot 简介与跳转链接 */
app.get('/', (c) => {
  return c.html(
    '<h1>a simple command based qq-bot</h1>' +
      '<h2>get more info on my <a href="https://github.com/zcWSR/japari-admin">github</a></h2>' +
      '<h2><a href="/japari">⇨ジャパリパーク⇦</a></h2>'
  );
});

// ========== /japari：QQ 机器人相关 ==========
/** ジャパリパーク 页面（QQ 回调说明页） */
app.get('/japari', (c) => {
  return c.html(
    "<h1>ようこそ！ジャパリパークへ！</h1><script>console.log('/japari/event is bot')</script>"
  );
});

/** QQ 机器人事件上报入口：按消息类型执行插件链 */
app.post('/japari/event', botErrorReporter, async (c) => {
  const fromBot = await c.req.json().catch(() => ({}));
  const type = QQService.convertMessageType(fromBot);
  const plugins = PluginService.getPlugins(type);
  const config = await PluginService.getConfig(type, fromBot);
  if (!config) {
    return c.json({});
  }
  for (const plugin of plugins) {
    if (!config[plugin.name]) continue;
    const result = await plugin.go(fromBot, type);
    if (result === 'break') break;
  }
  return c.json({});
});

/** 内部消息入口：原神缓存更新等转发到 Node，由 Node 调 taffy/updateCache */
app.post('/japari/message', botErrorReporter, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const base = (Config.NODE_URL || '').replace(/\/$/, '');
  if (base && body?.type === 'genshinUpdate') {
    await fetch(`${base}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  return c.text('ok');
});

// ========== /internal：供 Node 调用的内部接口 ==========
/** 供 Node 拉取全量定时列表，用于注册 node-schedule；返回 [{ group_id, rule, text }, ...] */
app.get('/internal/schedules', async (c) => {
  const list = await ScheduleService.getAllSchedules();
  return c.json(
    list.map((r) => ({
      group_id: r.group_id,
      rule: r.rule,
      text: r.text
    }))
  );
});

/** 供 Node 到点触发：根据 groupId 查 D1 取文案并发送 QQ 群消息 */
app.post('/internal/trigger-schedule', botErrorReporter, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { groupId } = body || {};
  if (!groupId) {
    return c.json({ error: 'missing groupId' }, 400);
  }
  await ScheduleService.triggerSendForGroup(String(groupId));
  return c.json({ ok: true });
});

export default app;
