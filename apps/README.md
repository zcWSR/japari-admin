# japari-admin 同仓结构

- **apps/node**：Koa 服务，图片生成 + 定时触发（到点请求 Worker）；无 Controller/装饰器。
- **apps/worker**：Hono + D1/KV **绑定**，QQ 回调和插件/命令；入口 `worker.js` 供 wrangler dev/deploy。

## Node (apps/node)

- 配置：复制 `config.example.json` 为 `config.json`，填写 `port`、`workerUrl`；R2 用环境变量。
- 运行：`npm install && npm run build && npm start`。根目录快捷：`npm run node:dev` / `npm run node:start`。

## Worker (apps/worker)

- **D1/KV**：直接使用 Worker 绑定（`env.DB`、`env.KV`），不走 HTTP API。
- **配置**：从 env 读取。本地调试：复制 `.dev.vars.example` 为 `.dev.vars`，填写 `QQ_SERVER`、`NODE_URL`、`ADMINS`、`BOT_QQ_ID` 等；`wrangler.toml` 中 D1/KV 的 `database_id`/`id` 可先占位，本地 wrangler dev 会用本地存储。
- **本地调试**：`cd apps/worker && npm install && npm run dev`（或根目录 `npm run worker:dev`）。会启动 wrangler dev，默认端口 8787。

## 约定

- Node 调用 Worker：`GET {workerUrl}/internal/schedules`、`POST {workerUrl}/internal/trigger-schedule`（body: `{ groupId }`）。
- Worker 在 schedule/scheduleTime 命令修改定时后，调用 Node：`POST {nodeUrl}/refresh-schedules`。
