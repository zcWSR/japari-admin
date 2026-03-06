# japari-admin 整体架构设计

## 1. 概述

japari-admin 是基于 QQ 机器人的后台服务，采用 **Node + Cloudflare Worker** 双端分离的 monorepo：**Node** 负责图片生成（含 R2 上传）与定时任务调度，**Worker** 为 Next.js App Router + OpenNext 单 Worker，负责 QQ 事件、插件/命令、管理后台及 D1/KV 访问。两者通过 HTTP 内部接口协作。

## 2. 仓库结构（Monorepo）

```
japari-admin/
├── apps/
│   ├── node/              # Koa：图片生成 + 定时调度
│   │   ├── src/
│   │   │   ├── index.js, routes, config, services/, utils/, middlewares/
│   │   │   └── (SWC 构建到 built/)
│   │   ├── dockerfile     # 生产镜像，context 为 ./apps/node
│   │   └── package.json
│   │
│   └── worker/            # Next.js + OpenNext 单 Worker
│       ├── src/
│       │   ├── app/                   # Next App Router
│       │   │   ├── page.tsx, manage/, japari/, (layout, route handlers)
│       │   │   └── japari/event/route.ts, japari/message/route.ts
│       │   ├── actions/               # Server Actions（鉴权、群配置、锁、模拟消息）
│       │   ├── lib/                   # auth, ensure-plugins
│       │   ├── plugins/               # 插件 + commands，@Plugin/@Command 装饰器
│       │   ├── services/              # D1, KV, QQ, PluginService...
│       │   ├── config.ts              # getCloudflareContext().env
│       │   └── decorators/
│       ├── wrangler.toml              # 生产部署用（勿提交）
│       ├── wrangler.dev.toml          # 本地 preview 用
│       ├── .dev.vars                  # 本地环境变量（勿提交）
│       └── package.json
│
├── package.json           # workspaces; lint/format 委托到各 app
└── ARCHITECTURE.md
```

- **根目录**：`npm run worker:dev` / `npm run node:dev`、`npm run lint` / `npm run format`。
- **Node**：Koa，SWC 构建到 `built/`，运行 `node built/index.js`；Docker 最终阶段仅装生产依赖。
- **Worker**：Next.js 构建 + OpenNext 生成 `.open-next/worker.js`；配置与绑定统一通过 **getCloudflareContext().env**（无 env-store）；插件使用 SWC 装饰器（next.config 中配置）。

## 3. 整体架构图

```mermaid
flowchart TB
  subgraph External["外部"]
    QQ[QQ 机器人平台]
    User[用户]
  end

  subgraph Node["apps/node (Koa)"]
    NodeRoutes[路由]
    ImageService[ImageService]
    ScheduleService[ScheduleService]
    GenshinService[GenshinService]
    R2[R2 上传]
    NodeRoutes --> ImageService
    NodeRoutes --> ScheduleService
    NodeRoutes --> GenshinService
    ImageService --> R2
  end

  subgraph Worker["apps/worker (Next + OpenNext)"]
    NextRoutes[App Router / Route Handlers]
    PluginChain[插件链 / 命令]
    ScheduleServiceW[ScheduleService]
    NodeAPI[NodeAPI]
    D1[(D1)]
    KV[(KV)]
    NextRoutes --> PluginChain
    NextRoutes --> ScheduleServiceW
    PluginChain --> NodeAPI
    ScheduleServiceW --> D1
    PluginChain --> D1
    PluginChain --> KV
  end

  QQ -->|POST /japari/event| Worker
  QQ -->|GET 群成员等| Worker
  Worker -->|HTTP 调 QQ 接口| QQ
  Worker -->|POST /generate-image| Node
  Worker -->|POST /message 转发 genshinUpdate| Node
  Node -->|GET /internal/schedules| Worker
  Node -->|POST /internal/trigger-schedule| Worker
  Worker -->|POST /refresh-schedules| Node
  User -->|发消息| QQ
```

## 4. Node 端（apps/node）

### 4.1 职责

- **图片生成**：hoshii、原神圣遗物图，上传 R2 返回 URL。
- **定时调度**：node-schedule 按 Worker 拉取的 schedule 列表注册，到点请求 Worker 发群消息。
- **原神缓存**：`POST /message`（genshinUpdate）更新 taffy 缓存。

### 4.2 路由与构建

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | / | 占位 |
| POST | /generate-image | 生成图片并上传 R2 |
| POST | /refresh-schedules | 从 Worker 拉取 schedule 并重新注册 |
| POST | /message | 内部消息（如 genshinUpdate） |

- **配置**：复制 `config.example.json` 为 `config.json`，填写 `port`、`workerUrl`；R2 等用环境变量。
- **构建**：`npm run node:build`（SWC）→ 输出 `built/`。
- **运行**：`npm install && npm run build && npm start`（或在根目录 `npm run node:dev` / `npm run node:start`）。
- **Docker**：context 为 `./apps/node`，最终阶段 `npm install --omit=dev`，见 `apps/node/dockerfile`。

## 5. Worker 端（apps/worker）

### 5.1 职责

- **QQ 事件**：`POST /japari/event` 进入插件链（含 command-runner 解析 `!xxx`）。
- **管理后台**：Next 页面与 Server Actions；统一使用 `admin_token` + KV session 鉴权。
- **插件/命令**：`plugins/` + 装饰器，PluginService 管理加载与群配置；**群插件配置存 KV**，首次需插件列表时调用 **ensurePluginsLoaded()**（getGroupConfig、getPluginConfig、japari/event、simulate 等）。
- **配置与绑定**：全部通过 **getCloudflareContext().env**（Config、D1Service、KVService 内部使用），无 env-store。

### 5.2 路由一览

| 类型 | 路径 | 说明 |
|------|------|------|
| 页面 | /, /manage, /manage/token | 服务首页、管理入口、无参数鉴权输入页 |
| 页面 | /manage/group/op, /manage/group/op/groups | 超管专属页、全部群 |
| 页面 | /manage/group/[groupId], /manage/group/[groupId]/plugin/[pluginName], /manage/group/[groupId]/simulate | 单群管理、插件配置、消息模拟 |
| 页面 | /manage/token/[token] | `!setting` 一次性链接兑换（写 Cookie 后重定向） |
| API | POST /japari/event | QQ 事件上报，执行插件链 |
| API | POST /japari/message | 内部消息（如转发 genshinUpdate） |
| API | GET /internal/schedules | Node 拉取定时列表 |
| API | POST /internal/trigger-schedule | Node 到点触发 |
| API | POST /manage/lock/release | 页面关闭时释放同群占用锁 |

### 5.3 插件加载与配置

- **加载时机**：首次需要插件列表时执行 **ensurePluginsLoaded()**（在 getGroupConfig、getPluginConfig、japari/event、simulate 等入口），之后 PluginService.plugins 有数据。
- **群配置**：KV 存储；getGroupConfig 先 ensurePluginsLoaded，再读 KV 与插件列表供侧栏展示；插件开关通过 setGroupConfig 更新 KV。
- **插件配置页**：getPluginConfig/setPluginConfig 同样先 ensurePluginsLoaded，再按插件名查找并调用 getPageConfig/setPageConfig。

### 5.4 管理后台鉴权与会话模型（当前实现）

- **统一鉴权入口**：
  - `/manage/token`：手动输入 `groupId + qq`。
  - `/manage/token/[token]`：`!setting` 一次性链接兑换。
- **自动跳转**：访问 `/manage/token` 时，若当前 `admin_token` 对应会话有效，则直接跳转成功页（超管 -> `/manage/group/op`，普通用户 -> `/manage/group/{groupId}`）。
- **鉴权规则**：
  - `qq ∈ ADMINS`：允许 `groupId` 为空，进入超管会话。
  - 普通用户：必须带 `groupId`，并通过 `get_group_member_info` 校验「在群内 + admin/owner」。
- **会话存储**：KV key `admin-session:{sessionToken}`，payload 包含：
  - `groupId`、`adminId`、`qq`、`isAdminToken`、`displayName`、`avatarUrl`、`ttlSeconds`、`expiresAt`、`createdAt`。
- **TTL 配置**：
  - `MANAGE_SESSION_TTL_NORMAL`（默认 `600` 秒）；
  - `MANAGE_SESSION_TTL_ADMIN`（默认 `3600` 秒）。
- **会话查询**：`getSessionInfo()` 返回 `remainingSeconds`，用于 UI 倒计时展示。
- **登出行为**：`logout()` 删除 KV 会话、释放占用锁、清空 `admin_token`。

### 5.5 同群互斥占用锁（KV + 心跳）

- **锁 key**：`manage-lock:{groupId}`。
- **锁 value**：`holderSessionId`、`holderQq`、`holderName`、`updatedAt`。
- **TTL**：60 秒；客户端每 15 秒心跳续租。
- **获取时机**：进入群管理页后 `acquire`；若被其他会话持有返回 `busy`。
- **释放时机**：
  - 页面卸载 / 关闭：`release`（含 `sendBeacon` 调用 `/manage/lock/release`）；
  - 主动登出：`logout()` 内同步释放；
  - 异常关闭：依赖 TTL 自动回收。

### 5.6 Sidebar（manage/group）当前结构

- 基于 shadcn `SidebarProvider + Sidebar + SidebarInset`。
- `SidebarHeader`：
  - 左侧群头像（`p.qlogo.cn/gh/{groupId}/{groupId}/100`）；
  - 右侧两行显示群名、群号（超管页显示超管模式标识）。
- `SidebarFooter`：
  - 左侧会话头像 + 环形倒计时进度；
  - 悬停显示「鉴权过期倒计时」；
  - 右侧下拉菜单提供登出。
- 插件项支持 `Switch` 实时开关，动作走 `setGroupConfig`。

### 5.7 Worker 本地调试与部署

**方式一：Next 开发服务器（推荐日常开发）**

在 `apps/worker` 下：`npm install`、`npm run dev`（或根目录 `npm run worker:dev`）。使用 `next dev` + OpenNext 开发初始化，可访问本地模拟 D1/KV。前端默认 <http://localhost:3000>，管理后台入口 <http://localhost:3000/manage/token>，QQ 说明 <http://localhost:3000/japari>。环境变量与绑定：同目录 `.dev.vars`（`KEY=value` 每行一个），与 wrangler 配置中 `[vars]`、D1/KV 在本地会被模拟。

**方式二：本地 Worker 预览（与线上运行时一致）**

在 `apps/worker` 下：`npm run preview`。先 `opennextjs-cloudflare build` 生成 `.open-next/`，再以 Wrangler 启动（**使用 wrangler.dev.toml**，脚本已带 `--config wrangler.dev.toml`）。预览地址由 Wrangler 输出（通常 `http://localhost:8787`）。

**Wrangler 配置文件**

| 场景 | 使用的配置 | 说明 |
|------|------------|------|
| 本地预览 | `wrangler.dev.toml` | `npm run preview` 已写死 `--config wrangler.dev.toml` |
| 线上部署 | `wrangler.toml` | `npm run deploy` 使用默认文件名 |

`wrangler.toml`、`wrangler.dev.toml`、`.dev.vars` 均在 `.gitignore`，不提交；需本地或 CI 自建（从占位符复制后填写 D1/KV 的 database_id、id 等）。

**线上部署**

在 `apps/worker` 下：`npm run deploy`。会先 `opennextjs-cloudflare build`（内部跑 `next build`），再 `opennextjs-cloudflare deploy`。入口 `.open-next/worker.js`，静态资源 `.open-next/assets`（ASSETS 绑定）。绑定以 **wrangler.toml** 为准；敏感配置用 Cloudflare 控制台或 `wrangler secret`。

**构建与上传分离**（按需）：`npm run build` 仅 next build；`opennextjs-cloudflare build` 生成 .open-next/；`opennextjs-cloudflare upload` 仅上传版本；`opennextjs-cloudflare deploy` 构建+部署。

**环境与绑定**：vars = wrangler `[vars]` + `.dev.vars`（本地）/ 控制台或 Secrets（线上）。D1/KV 在 wrangler 中配置，本地预览用本地 SQLite/KV。管理鉴权相关变量包括 `ADMIN_BASE_URL`、`ADMINS`、`MANAGE_SESSION_TTL_NORMAL`、`MANAGE_SESSION_TTL_ADMIN`。

## 6. 配置与部署约定

| 端 | 配置来源 | 关键项 |
|----|----------|--------|
| Node | config.json + 环境变量 | port、workerUrl；R2_* |
| Worker | .dev.vars / wrangler [vars]；getCloudflareContext().env | QQ_SERVER、NODE_URL、ADMINS、BOT_QQ_ID、ADMIN_BASE_URL、MANAGE_SESSION_TTL_NORMAL、MANAGE_SESSION_TTL_ADMIN；D1/KV 在 wrangler 绑定 |

**内部接口约定**：Node 调 Worker → `GET {workerUrl}/internal/schedules`、`POST {workerUrl}/internal/trigger-schedule`（body: `{ groupId }`）。Worker 在 schedule 相关命令或后台修改定时后调 Node → `POST {nodeUrl}/refresh-schedules`。

## 7. 核心数据流（与旧版一致）

- QQ 消息 → POST /japari/event → 插件链 → 命令/图片等 → Node 或 QQ。
- 定时：Node 拉 GET /internal/schedules，到点 POST /internal/trigger-schedule；用户改定时后 Worker 调 Node POST /refresh-schedules。
- 原神缓存：POST /japari/message 转发到 Node POST /message。

以上为当前 japari-admin 的整体架构，Worker 已迁移为 Next.js + OpenNext 单 Worker，配置与绑定统一走 getCloudflareContext，管理后台已切换到 `manage` 路由体系与统一会话鉴权模型。
