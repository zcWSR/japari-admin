# Worker TS 化与 OneBot 类型方案

## 一、目标

1. 将 `apps/worker` 中尚未 TS 化的 `.js` 文件全部改为 `.ts`（或 `.tsx` 视情况）。
2. 理解插件处理流程，在事件体、消息段、插件接口等处使用 **OneBot 11** 类型（项目内 `src/types/onebot11`，来源 NapCatQQ）。

---

## 二、当前 JS 文件清单（需 TS 化）

共 **53 个** `.js` 文件，按目录分组：

| 目录 | 文件 |
|------|------|
| **config** | `src/config.js` |
| **decorators** | `src/decorators/plugin.js` |
| **utils** | `logger.js`, `env.js`, `date.js`, `process.js`, `message.js`, `string-utils.js`, `notify-admin-error.js`, `homo.js`, `pinyin.js`, `osu-utils.js` |
| **services** | `config.js` 已列；`kv-service.js`, `d1-service.js`, `qq-service.js`, `plugin-service.js`, `node-api.js`, `osu-service.js`, `read-again-service.js`, `hso-service.js`, `schedule-service.js` |
| **plugins** | `registry.js`, `command-runner.js`, `self-ignore.js`, `read-again-follow.js`, `read-again-random.js`, `new-notice.js`, `163-music.js`, `schedule-loader.js`, `garbage-word-random.js`, `checkMessageDebug.js` |
| **plugins/commands** | `registry.js`, `plugin.js`, `help.js`, `setting.js`, `roll.js`, `homo.js`, `hso.js`, `pr.js`, `schedule.js`, `schedule-time.js`, `osu-bind.js`, `osu-unbind.js`, `osu-bp.js`, `osu-bpme.js`, `osu-recent.js`, `genshin-character-artifacts.js`, `master-send.js`, `new-member-notice.js`, `read-again-random.js`, `garbage-word-ramdom.js`, `admin-message-debug.js`, `hoshii.js` |

建议顺序：先 **类型与基础设施**（类型定义、config、decorators、utils、services），再 **plugins**（registry、command-runner、各插件与 commands），避免循环依赖和类型缺失。

---

## 三、插件与事件流程（便于套 OneBot 类型）

### 3.1 数据流

```
POST /japari/event (body = 上报事件)
  → QQService.convertMessageType(body) → type: 'group' | 'private' | 'notice'
  → PluginService.getPlugins(type) / getConfig(type, body)
  → 按顺序执行插件：plugin.go(body, type)，返回 'break' 可中断
```

- **消息类**：`post_type === 'message' | 'message_sent'` 时，`type = body.message_type`（'group' | 'private'）。
- **通知类**：`post_type === 'notice'` 时，`type = 'notice'`，插件内用 `notice_type`（如 `group_increase`）区分。

### 3.2 当前事件体实际字段（与 OneBot 11 对齐）

- 通用：`post_type`, `message_type?`, `notice_type?`, `user_id`, `group_id?`, `message`（消息段数组或字符串）, `sender?`, `self?` 等。
- 消息：`message` 为段数组时，段结构为 `{ type: 'text'|'image'|'at'|... , data: { text?, file?, qq?, ... } }`，与 **OneBot 11** 消息段一致。

### 3.3 OneBot 11 类型来源

- 项目已克隆 [NapCatQQ napcat-onebot/types](https://github.com/NapNeko/NapCatQQ/tree/main/packages/napcat-onebot/types) 到 **`src/types/onebot11/`**（含 `data.ts`、`message.ts`），提供：
  - 数据结构：`OB11User`、`OB11Sender`、`OB11Group`、`OB11GroupMember` 等；
  - 消息与事件：`OB11Message`、`OB11MessageData`、`OB11MessageMixType`、`OB11MessageType`、各消息段类型及 Schema。
- 上报格式即为 OneBot 11（`post_type` + `message_type` / `notice_type`），直接使用上述类型标注事件体与消息段即可。

---

## 四、OneBot 11 类型使用方案

### 4.1 已有类型（onebot11）

- **`src/types/onebot11/`**：克隆自 NapCatQQ，已提供完整 OneBot 11 类型。
  - **data.ts**：`OB11User`、`OB11Sender`、`OB11Group`、`OB11GroupMember`、`OB11GroupFile`、`OB11GroupMemberRole` 等。
  - **message.ts**：`OB11Message`、`OB11MessageData`、`OB11MessageMixType`、`OB11MessageType`、各消息段类型（text/at/face/image 等）及 TypeBox Schema。

### 4.2 新增类型层（插件与事件适配）

在 `src/types/` 下增加事件与插件相关类型，**基于 onebot11**，便于插件链统一入参。

- **文件建议**：`src/types/onebot.ts`（或 `events.ts` + `plugin.ts`）。

**（1）插件用「运行态」事件类型（与 convertMessageType 一致）**

- `PluginPostType`：`'group' | 'private' | 'notice'`（若还有 `loader` 等可一并加入）。
- 可选：`NoticeDetailType`：`'group_increase' | 'group_decrease' | ...'`，与现有 `notice_type` 对齐。

**（2）上报体（入参）类型**

- 消息类事件可直接用 **`OB11Message`**（onebot11 已含 `post_type`、`message_type`、`message`、`user_id`、`group_id`、`sender` 等）。
- 通知类事件可定义窄类型或与消息合并为联合类型，例如：

```ts
import type { OB11Message } from '@/types/onebot11';

// 消息事件：直接使用 OB11Message（post_type 为 message / message_sent）
// 通知事件：与现有 notice_type 对齐
export interface OB11NoticeEvent {
  post_type: 'notice';
  notice_type: string; // e.g. 'group_increase'
  user_id?: string;
  group_id?: string;
  operator_id?: string;
  // ...
}

export type IncomingEvent = OB11Message | OB11NoticeEvent;
```

**（3）消息段**

- 对外接口、工具函数（如 `utils/message.ts` 的 `extractFirstText`、`formatForLog`、`text()`、`image()` 等）的 **消息内容** 使用 **`OB11MessageData[]` 或 `OB11MessageMixType`**（onebot11 已定义，含 text/at/face/image 等段）。

**（4）插件接口**

- 定义插件「运行接口」，供 decorator 与 PluginService 使用：

```ts
import type { IncomingEvent } from '@/types/onebot';

export type PluginPostType = 'group' | 'private' | 'notice';

export interface IPlugin {
  name: string;
  weight?: number;
  type?: 'group' | 'private' | 'message' | 'notice' | 'loader';
  shortInfo?: string;
  info?: string;
  default?: boolean;
  hide?: boolean;
  mute?: boolean;
  go?(body: IncomingEvent, type: PluginPostType): Promise<void | 'break'>;
  init?(): Promise<void>;
}
```

- 命令插件：`run(params: string, body: IncomingEvent, type: PluginPostType, commandMap: ...): Promise<void>`，与现有 `trigger` 调用方式一致。

这样，事件体与消息段统一使用 **OneBot 11** 类型（`OB11Message`、`OB11MessageData`、`OB11MessageMixType` 等），插件入参为 `IncomingEvent` + `PluginPostType`。

### 4.2 各层使用方式小结

| 位置 | 建议类型 |
|------|----------|
| `POST /japari/event` 的 body | 断言或校验为 `IncomingEvent`，再传入插件 |
| `QQService.convertMessageType(event)` | 入参 `event: IncomingEvent`，返回 `PluginPostType` |
| `PluginService.getConfig(type, event)` | `event` 为 `IncomingEvent` 中带 `group_id` 的部分（或 Pick<IncomingEvent, 'group_id'>） |
| 各插件 `go(body, type)` | `body: IncomingEvent`, `type: PluginPostType` |
| 命令 `run(params, body, type, commandMap)` | 同上 |
| `utils/message` 中消息段参数 | `OB11MessageData[]` 或 `OB11MessageMixType`（来自 `@/types/onebot11`） |
| 模拟消息 body（simulate） | 与 `OB11Message` 结构兼容的类型（可复用或扩展） |

---

## 五、TS 化实施顺序建议

1. **类型层**  
   - 已有 **`src/types/onebot11/`**（NapCatQQ 克隆），无需再引 OneBot 12。  
   - 新增 `src/types/onebot.ts`（或 `events.ts` + `plugin.ts`）：定义 `IncomingEvent`（基于 `OB11Message` + 自建通知事件）、`PluginPostType`、`IPlugin`。

2. **配置与工具**  
   - `config.js` → `config.ts`（若涉及 getCloudflareContext，保持现有调用方式，仅加类型）。  
   - `utils/*.js` → `utils/*.ts`（`message.ts` 中消息段参数用 **`OB11MessageData[]` 或 `OB11MessageMixType`**）。

3. **服务层**  
   - `kv-service.js`、`d1-service.js` → `.ts`。  
   - `qq-service.js` → `qq-service.ts`：`convertMessageType(event: IncomingEvent): PluginPostType`，其它方法参数/返回值按需标注。  
   - `plugin-service.js` → `plugin-service.ts`：`getPlugins(postType: PluginPostType)`、`getConfig(type, event)` 等用上述类型。  
   - 其余 `node-api`、`osu-service`、`read-again-service`、`hso-service`、`schedule-service` 按同样方式改为 `.ts`。

4. **装饰器与插件基础设施**  
   - `decorators/plugin.js` → `decorators/plugin.ts`：`Plugin`/`Command` 的 config 与 `go`/`run` 签名与 `IPlugin`、`IncomingEvent`、`PluginPostType` 对齐。

5. **插件与命令**  
   - `plugins/registry.js`、`command-runner.js` 以及各插件、commands 下的 `.js` 改为 `.ts`；`go(body, type)`、`run(params, body, type, ...)` 统一使用 `IncomingEvent` 与 `PluginPostType`。  
   - 涉及 `message` 解析处使用 **`OB11MessageData` / `OB11MessageMixType`**（onebot11）。

6. **路由与 Action**  
   - `app/japari/event/route.ts`：body 定为 `IncomingEvent`，去掉不必要的 `@ts-expect-error`，插件循环内用 `IPlugin` 或具体插件类型。  
   - `actions/simulate.ts`：模拟 body 类型与 `IncomingMessageEvent` 兼容；`simulate-form.tsx` 中构造的 `post_type`/`message_type` 等与类型定义一致。

7. **导入与扩展名**  
   - 全部改为 TS 后，将原 `from 'xxx.js'` 的导入改为 `from 'xxx'` 或 `from 'xxx.js'`（视 Next/tsconfig 是否开启 allowJs 与模块解析而定）；必要时在 `tsconfig` 中保留 `"moduleResolution": "bundler"` 等以兼容现有解析。

---

## 六、注意事项

- **循环依赖**：`ensure-plugins` ↔ `plugin-service` 已存在，TS 化时保持单例与懒加载方式，类型仅做接口描述，避免在类型层引入运行时循环。  
- **OneBot 11 一致**：项目已统一采用 OneBot 11 类型（onebot11），`at.data.qq`、`message_type` 等均为标准字段，无需再兼容 v12。  
- **测试**：每批 TS 化后跑一次 `npm run build` 与现有 lint，确保无回归。  
- **JSDoc 迁移**：原 `.js` 中的 `@param`/`@returns` 可改为 TypeScript 类型，减少重复注释。

按上述顺序推进，即可在「全部 JS 改为 TS」的同时，在事件体、消息段和插件接口上统一使用 **OneBot 11** 类型（`src/types/onebot11` + `IncomingEvent`/`PluginPostType` 适配插件链）。
