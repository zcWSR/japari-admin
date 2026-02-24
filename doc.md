# 插件与指令设计说明

本文描述 Worker 端插件模组与指令驱动的设计思路。实现上：**群插件配置存 KV**；插件列表在首次需要时通过 **ensurePluginsLoaded()** 加载并缓存在 PluginService；D1 用于 schedule、osu_bind、new_notice 等表。

---

### 插件模组设计思路

与 1.0 不同，2.0 引入插件可配置方案。从路由顶部按上报事件分类：group（群聊）、private（私聊）、notice（通知）；request 暂不支持。

PluginService 负责插件的获取/加载/分类/执行。

#### 群可配置插件方案

- 服务启动时从 `plugins/` 读取并初始化（若有则 sync 执行插件的 createTable 和 init），按 `type` 维护在 PluginService.plugins.group / private / notice。
- 收到消息后按上报类型取对应插件列表、按权重依次执行；**可配置**通过「群配置的插件名」包装：若当前插件名不在该群配置列表中则跳过。
- 群配置从 **KV** 一次性读取，以 `{ group_id: { plugin.name: true } }` 形式存于 PluginService.groupConfigs，便于查找。

此方案用时间换空间（遍历插件列表），因多数情况下有 break 等不会走完全表，对性能影响可接受。

#### 插件的生命周期

- `init()`：插件初始化到内存  
- `go(reqBody, type)`：执行插件  
- `createTable(ctx)`：初始化时提供数据库实例，用于插件持久化（事务支持）

#### 特殊插件类型：指令驱动插件

以 osu 为例：不是所有群都需要 osu 指令，但 !help 会展示；未开 osu 插件的群，该插件所加载的指令组不可查看和调用。用不同插件加载不同指令组，按文件夹区分（如 commands/osu）。

#### 权限管理

- **私聊插件**：由 config 中 ADMIN 配置的管理员配置，分级别展示不同列表。
- **群聊插件**：群主/管理可配置，写入 KV；可通过群指令或管理后台配置。

---

### 指令驱动插件的指令设计

指令格式：`!x y`（x 为长度大于 2 的英文单词，y 为参数）。

- **类型 (type)**：all / private / group  
- **权限 (level)**：1 普通、2 群管、3 系统管理员；私聊下无群管，level=2 视为 1。  
- 初始化时以 `{ command.command: command }` 维护在 CommandRunner.command.private / group；type=all 两边都放。  
- 执行时按数据类型走私聊/群聊逻辑，在 CommandRunner 层判断指令是否存在，不存在则响应并 break。
