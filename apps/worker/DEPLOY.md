# japari-worker 本地调试与线上部署

融合后的单仓：Next.js App Router + OpenNext，所有路由与能力在同一 Worker 内。

## 本地调试

### 方式一：Next 开发服务器（推荐日常开发）

在项目根目录 `apps/worker` 下：

```bash
npm install
npm run dev
```

- 使用 `next dev`，带 OpenNext Cloudflare 开发初始化（`initOpenNextCloudflareForDev`），可访问本地模拟的 D1/KV 等绑定。
- 前端地址默认：<http://localhost:3000>
- 管理后台：<http://localhost:3000/admin>，QQ 回调说明：<http://localhost:3000/japari>
- 环境变量与绑定：同目录下 `.dev.vars`（格式 `KEY=value` 每行一个），与 `wrangler.toml` 中 `[vars]`、D1/KV 绑定在本地会被模拟。

### 方式二：OpenNext 本地 Worker 预览（与线上运行时一致）

在 `apps/worker` 下：

```bash
npm run preview
```

- 先执行 `opennextjs-cloudflare build` 生成 `.open-next/`，再以 Wrangler 启动本地 Worker。
- 行为与部署到 Cloudflare 时一致，适合验证 D1/KV、插件链等。
- 默认预览地址由 Wrangler 输出（通常为 `http://localhost:8787` 或类似）。

## 线上部署

### 部署到 Cloudflare Workers

在 `apps/worker` 下：

```bash
npm run deploy
```

- 会先执行 `opennextjs-cloudflare build`（内部会跑 `next build`），再执行 `opennextjs-cloudflare deploy` 上传并部署。
- 入口为 `.open-next/worker.js`，静态资源使用 `.open-next/assets`（对应 wrangler 的 `ASSETS` 绑定）。
- 绑定（D1、KV、vars）以 `wrangler.toml` 为准；敏感配置放在 Cloudflare 控制台或 `wrangler secret`，不要提交到仓库。

### 构建与上传分离

若需只构建或只上传：

```bash
npm run build          # 仅 next build
opennextjs-cloudflare build   # 生成 .open-next/
opennextjs-cloudflare upload  # 仅上传版本
opennextjs-cloudflare deploy # 构建 + 部署
```

## 环境与绑定

- **vars**：`wrangler.toml` 的 `[vars]` + 同目录 `.dev.vars`（本地）/ Cloudflare 控制台或 Secrets（线上）。
- **D1**：`wrangler.toml` 中 `[[d1_databases]]`，本地预览使用本地 SQLite。
- **KV**：`wrangler.toml` 中 `[[kv_namespaces]]`，本地预览使用本地 KV。
- 管理鉴权依赖 `ADMIN_SECRET`、`ADMIN_BASE_URL` 等，请确保在对应环境中已配置。

## 路由一览

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/admin` | 管理首页 |
| `/admin/op` | 超管运营（模拟消息等） |
| `/admin/op/groups` | 全部群列表 |
| `/admin/group/[groupId]` | 单群管理 |
| `/admin/token/[token]` | 一次性链接兑换（GET，写 Cookie 后重定向） |
| `POST /japari/event` | QQ 事件上报 |
| `POST /japari/message` | 内部消息转发 |
| `GET /internal/schedules` | Node 拉定时列表 |
| `POST /internal/trigger-schedule` | Node 到点触发 |
