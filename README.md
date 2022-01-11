<h1 align="center">
  <br>
  <br>
  加帕里动物管理员
  <h4 align="center">
    一个简单的基于coolq-http-api的: 会复读, 可响应指令, 灵活可扩展的 qqbot. 插件化开发
  </h4>
  <!-- <h5 align="center">
    <a href="#license">开源条款</a>
  </h5> -->
  <br>
  <br>
  <br>
</h1>

### 目前支持的功能(插件)
1. 连续复读: 当某一群组中出现连续三次相同的内容时, 复读内容
2. 随机复读: 对某一群组内的聊天内容进行随机复读, 可为每个群设置不同的复读概率
3. 指令识别: 对 __!xxx__ 格式的指令进行识别, 并做出响应
4. 垃圾话: 随机发送垃圾话
5. 入群提示: 新人入群时提醒
6. 网易云点歌: 点歌
7. 明日方舟公开招募查询: 识别并查询所发截图的公招信息

...完善中

### 支持的指令

#### 基础指令

1. help: 查看所有指令或者某特定指令的使用方法
2. pr: prprprpr
3. hso: hso
4. roll: roll一个随机数
5. newNotice 配置入群提醒模板
6. plugin: 查看\开启\关闭插件功能
7. schedule/scheduleTime: 添加修改群定时任务
8. hoshii: 5000兆円表情包生成器
9. fd: 设置随机复读概率(配合随机复读插件使用)
10. lj: 设置随机垃圾话概率(配合垃圾话插件使用)
11. akhr: 明日方舟公开招募查询(配合公招插件使用)
12. akhrUpdate: 更新明日方舟干员基础信息(配合公招插件使用)

...完善中

#### osu特有指令

1. bind: 绑定账号
2. unbind: 解绑账号
3. bp: 查询bp
4. bpme: 查看所绑定账号的bp
5. recent: 查询最近游玩记录

...完善中

## 安装

需要依赖 sqlite 和 node-canvas，node-canvas 有其对应依赖，请参考其 repo 的 README

对于 M1 用户，brew 安装 node-canvas 依赖请添加 `arch -arm64` 前缀

## License

GPLv3 © [zcWSR](https://zcwsr.com/)