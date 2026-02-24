<h1 align="center">
  <br>
  <br>
  加帕里动物管理员
  <h4 align="center">
    一个简单的基于 OneBot 的: 会复读, 可响应指令, 灵活可扩展的 
    qqbot. 插件化开发
  </h4>
  <!-- <h5 align="center">
    <a href="#license">开源条款</a>
  </h5> -->
  <br>
  <br>
  <br>
</h1>

基于 OneBot 的 QQ 机器人：复读、指令响应、插件化扩展，带 Web 管理后台。

## 仓库结构（Monorepo）

- **apps/node**：Koa 服务，图片生成（hoshii、原神等）+ 定时任务调度，调 Worker 内部接口。
- **apps/worker**：Next.js App Router + OpenNext 单 Worker，QQ 事件、插件/命令、管理后台、D1/KV。

根目录通过 npm workspaces 统一脚本；结构、运行与部署见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 功能概览

### 插件

- 连续复读、随机复读、垃圾话
- 指令识别（`!xxx`）与响应
- 入群提醒、网易云点歌
- 明日方舟公招（已下线）、原神面板/圣遗物查询 等

### 指令（部分）

- **基础**：`!help`、`!pr`、`!roll`、`!plugin`、`!newNotice`、`!schedule`/`!scheduleTime`、`!hoshii`、`!fd`、`!lj`、原神查询/圣遗物/原神面板
- **osu**：`!bind`、`!unbind`、`!bp`、`!bpme`、`!recent`
- 管理后台：`!setting` 下发后台链接

## 安装与运行

```bash
# 安装依赖（根目录）
npm install

# Worker 开发（Next 开发服务器，推荐）
npm run worker:dev

# Node 服务开发
npm run node:dev

# 代码检查与格式化
npm run lint
npm run format
```

- Node/Worker 配置与本地/部署步骤见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## License

GPLv3 © [zcWSR](https://zcwsr.com/)
