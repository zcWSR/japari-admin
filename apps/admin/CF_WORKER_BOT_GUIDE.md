# 🚀 Cloudflare Workers 机器人全家桶架构指南

本指南旨在指导如何将传统的 Koa 机器人迁移至 Cloudflare 边缘环境，并实现高安全性的“一次性配置页面”。

## 1. 核心架构设计

* **前端/API 层**: Next.js (App Router)
* **机器人逻辑层**: Hono (部署于同一个 Worker)
* **存储层**:
* **KV**: 存储 Session Token、一次性标记、临时缓存。
* **D1**: 存储群插件开关、黑名单、用户数据（持久化 SQL）。
* **Cache API**: 节点级缓存，降低 KV 额度消耗。



---

## 2. 迁移逻辑对照表

| 传统 Node.js (Koa) | Cloudflare Workers (Hono/Next) |
| --- | --- |
| `app.listen(3000)` | 自动由 CF 调度，无需手动监听端口 |
| `ctx.request.body` | `await c.req.json()` (异步处理) |
| `axios.post()` | `await fetch()` (浏览器标准 API) |
| `redis.set(k, v, 'EX', 60)` | `env.KV.put(k, v, { expirationTtl: 60 })` |
| 内存全局变量 (持久有效) | 内存全局变量 (随实例销毁，仅用于热请求缓存) |

---

## 3. 一次性 Token 与配置界面实现 (代码参考)

### A. 机器人端：下发临时地址

```typescript
// 触发指令: !setting
app.post('/webhook', async (c) => {
  const { group_id, user_id } = await c.req.json();
  
  // 1. 生成一次性 Token
  const token = crypto.randomUUID();
  const session = { groupId: group_id, adminId: user_id, used: false };

  // 2. 存入 KV，5分钟过期
  await c.env.BOT_KV.put(`token:${token}`, JSON.stringify(session), {
    expirationTtl: 300 
  });

  return c.json({
    reply: `请在 5 分钟内完成配置：https://bot-ui.pages.dev/config?t=${token}`
  });
});

```

### B. Next.js API 层：读取并立即销毁 (One-time Access)

```typescript
// app/api/config/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('t');
  const { env } = getCloudflareContext();

  const data = await env.BOT_KV.get(`token:${token}`, { type: 'json' });

  if (!data || data.used) {
    return Response.json({ error: "链接已失效" }, { status: 403 });
  }

  // 关键：读取后立即标记为已使用（或直接删除）
  // 配合 KV 的固定源快速读取特性，能有效拦截刷新行为
  await env.BOT_KV.put(`token:${token}`, JSON.stringify({ ...data, used: true }), {
    expirationTtl: 300 
  });

  return Response.json({ config: await env.DB.prepare("SELECT * FROM settings...").all() });
}

```

---

## 4. 性能极致优化方案：三级缓存

为了减少对 KV 读写额度的消耗，建议在 `fetch` 处理器中使用以下逻辑：

1. **L1 (Isolate Memory)**: 使用全局变量存储高频配置，只要实例不销毁，响应时间 **<1ms**。
2. **L2 (Cache API)**: 使用 `caches.default` 存储节点级数据，跨实例共享，响应时间 **~10ms**。
3. **L3 (KV/D1)**: 最终存储，响应时间 **~50-100ms**。

---

## 5. Wrangler 部署配置 (wrangler.jsonc)

```jsonc
{
  "name": "qq-bot-all-in-one",
  "compatibility_date": "2026-02-11",
  "compatibility_flags": ["nodejs_compat"],
  "kv_namespaces": [
    {
      "binding": "BOT_KV",
      "id": "你的_KV_ID"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "bot_db",
      "database_id": "你的_D1_ID"
    }
  ],
  "observability": {
    "enabled": true // 开启日志记录，方便调试
  }
}

```

---

## 6. 注意事项

1. **Webhook 响应**: 建议使用 `ctx.waitUntil()` 处理耗时的插件逻辑，先给 QQ 服务器返回 `204` 或 `200`，防止因超时导致 QQ 判定推送失败。
2. **安全性**: 即使有 Token 销毁，也建议在配置页面加入简单的 `User-Agent` 或 `IP` 校验，防止链接在群内转发被恶意点击。
3. **域名**: Worker 默认的 `workers.dev` 在国内部分地区访问不稳定，建议绑定自定义域名。

---

希望这份文档能帮到你的工程！如果你在 **D1 数据库的 SQL 编写**或者 **Next.js 路由守卫**上需要具体的代码片段，随时告诉我。