# Cloudflare 迁移方案

## 📋 目录

- [项目现状分析](#项目现状分析)
- [Cloudflare 对应产品](#cloudflare-对应产品)
- [迁移方案详解](#迁移方案详解)
- [成本对比分析](#成本对比分析)
- [迁移步骤](#迁移步骤)
- [代码实现](#代码实现)
- [数据迁移脚本](#数据迁移脚本)
- [注意事项](#注意事项)

---

## 项目现状分析

### 当前使用的存储方案

#### 1️⃣ Firebase Storage（对象存储）

**用途**：存储动态生成的图片

- `hoshii/*.png` - 好希图片
- `genshin/{uid}/{timestamp}.png` - 原神角色圣遗物卡片

**特点**：
- 自动公开访问
- 全球 CDN 分发
- 按存储量和流量计费

#### 2️⃣ Firestore Database（文档数据库）

**用途**：存储定时任务配置

- Collection: `schedules`
- 数据结构：
  ```javascript
  {
    [groupId]: {
      rule: "10,11,12 1,2,3,4,5",  // 小时列表 天列表
      text: "消息内容，支持变量如 ${hour}"
    }
  }
  ```

**操作**：CRUD（增删改查）

#### 3️⃣ SQLite（关系型数据库）

**用途**：持久化业务数据

| 表名 | 用途 | 字段 |
|-----|------|-----|
| `osu_bind` | OSU 账号绑定关系 | user_id, group_id, osu_id, osu_name, mode |
| `osu_map` | OSU 铺面缓存 | id, map (压缩后的 .osu 文件) |
| `new-notice` | 入群欢迎消息模板 | group_id, template |

**特点**：
- 本地文件存储（`db.sqlite3`）
- 使用 `knex` + `better-sqlite3`
- 代码注释提到计划迁移到 Firebase

#### 4️⃣ Redis（缓存 + 临时数据）

**用途**：运行时配置和缓存

| 数据 | 结构类型 | 键名 | 用途 |
|-----|---------|------|------|
| 群组插件配置 | Set | `group-plugin-config-{groupId}` | 每个群启用的插件列表 |
| HSO 图片缓存 | Set | `hso-cache` / `hso-plus-cache` | Konachan 图片列表缓存 |
| 复读机触发概率 | String | `read-again-random-{groupId}` | 复读触发概率配置 |
| 垃圾话词库 | List | `garbage-word-list-{groupId}` | 随机垃圾话列表 |
| 垃圾话概率 | String | `garbage-word-random-{groupId}` | 垃圾话触发概率 |
| 163 音乐缓存 | String + TTL | `163-music-cache-{keyword}` | 音乐搜索结果缓存（24 小时） |
| 消息调试开关 | String | `messageDebug` | 全局消息调试开关 |
| AKHR 等待队列 | Hash | `akhr-waiting-stack` | 明日方舟公招等待队列 |

---

## Cloudflare 对应产品

### 产品映射关系

| 当前方案 | Cloudflare 产品 | 优势 |
|---------|----------------|------|
| **Firebase Storage** | **R2** | • S3 兼容 API<br>• 无出站流量费用<br>• 价格更低 |
| **Firestore** | **D1** | • SQLite 语法<br>• 边缘计算支持<br>• 免费额度大 |
| **SQLite** | **D1** | • 完全兼容<br>• 统一数据库<br>• 无需本地文件 |
| **Redis** | **Workers KV** + **D1** | • 全球分布<br>• 无需维护<br>• 按使用付费 |

### Cloudflare 产品详解

#### 🗄️ Cloudflare R2

**简介**：对象存储服务，完全兼容 S3 API

**定价**：
- 存储：$0.015/GB/月
- 写入：$4.50/百万次请求
- 读取：$0.36/百万次请求
- **出站流量：免费** ⭐

**免费额度**：
- 10 GB 存储/月
- 100 万次 A 类操作/月
- 1000 万次 B 类操作/月

#### 🗃️ Cloudflare D1

**简介**：边缘 SQLite 数据库

**定价**：
- 存储：免费（最多 5 GB）
- 读取：前 500 万次/天免费，之后 $0.001/1000 次
- 写入：前 10 万次/天免费，之后 $1.00/百万次

**特点**：
- 完全兼容 SQLite 语法
- 全球边缘复制
- 强一致性

#### 🔑 Cloudflare Workers KV

**简介**：全球分布式键值存储

**定价**：
- 存储：$0.50/GB/月
- 读取：前 1000 万次/月免费，之后 $0.50/百万次
- 写入：前 100 万次/月免费，之后 $5.00/百万次

**免费额度**：
- 1 GB 存储
- 1000 万次读取/月
- 100 万次写入/月

**特点**：
- 全球低延迟读取（< 50ms）
- 支持 TTL 过期
- 最终一致性

---

## 迁移方案详解

### 方案 A：Firebase Storage → Cloudflare R2

#### 迁移原因

✅ **成本优势**：无出站流量费用，每月可节省 $10-15  
✅ **兼容性好**：S3 兼容 API，代码改动小  
✅ **性能提升**：自动 CDN 加速  
✅ **存储便宜**：$0.015/GB vs Firebase $0.026/GB  

#### 实现步骤

1. **创建 R2 Bucket**
   ```bash
   # 在 Cloudflare Dashboard 创建 bucket
   # 或使用 Wrangler CLI
   wrangler r2 bucket create japari-images
   ```

2. **配置自定义域名**
   - 在 R2 设置中添加自定义域名
   - 配置 DNS CNAME 记录
   - 示例：`images.yourdomain.com`

3. **生成 API 密钥**
   - R2 → Manage R2 API Tokens
   - 创建新的 API Token
   - 记录 `Access Key ID` 和 `Secret Access Key`

4. **安装依赖**
   ```bash
   npm install @aws-sdk/client-s3
   ```

5. **创建 R2 Service**（见代码实现章节）

6. **更新环境变量**
   ```bash
   # .env
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=japari-images
   R2_PUBLIC_DOMAIN=https://images.yourdomain.com
   ```

---

### 方案 B：Firestore + SQLite → Cloudflare D1

#### 迁移原因

✅ **统一架构**：一个数据库替代两个系统  
✅ **SQLite 兼容**：现有 SQLite 表可直接迁移  
✅ **免费额度大**：5GB 存储 + 500 万次读取/天  
✅ **边缘计算**：全球分布，低延迟  

#### 数据库设计

```sql
-- ===================================
-- 定时任务表（原 Firestore schedules）
-- ===================================
CREATE TABLE schedules (
  group_id TEXT PRIMARY KEY,
  rule TEXT NOT NULL,           -- 如 "10,11,12 1,2,3,4,5"
  text TEXT NOT NULL,           -- 消息模板
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- ===================================
-- OSU 账号绑定（原 SQLite osu_bind）
-- ===================================
CREATE TABLE osu_bind (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  osu_id INTEGER NOT NULL,
  osu_name TEXT NOT NULL,
  mode INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, group_id)
);
CREATE INDEX idx_osu_bind_user ON osu_bind(user_id, group_id);

-- ===================================
-- OSU 铺面缓存（原 SQLite osu_map）
-- ===================================
CREATE TABLE osu_map (
  id INTEGER PRIMARY KEY,       -- beatmap_id
  map TEXT NOT NULL,            -- base64 压缩后的 .osu 文件
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- ===================================
-- 入群欢迎消息（原 SQLite new-notice）
-- ===================================
CREATE TABLE new_notice (
  group_id INTEGER PRIMARY KEY,
  template TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- ===================================
-- 垃圾话词库（原 Redis List）
-- ===================================
CREATE TABLE garbage_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  position INTEGER NOT NULL,     -- 保持原有顺序
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
CREATE INDEX idx_garbage_words ON garbage_words(group_id, position);

-- 垃圾话配置
CREATE TABLE garbage_word_config (
  group_id INTEGER PRIMARY KEY,
  random_rate REAL NOT NULL DEFAULT 0.5,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- ===================================
-- 复读机配置（原 Redis String）
-- ===================================
CREATE TABLE read_again_config (
  group_id INTEGER PRIMARY KEY,
  random_rate REAL NOT NULL DEFAULT 0.5,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### 实现步骤

1. **创建 D1 数据库**
   ```bash
   wrangler d1 create japari-database
   # 记录返回的 database_id
   ```

2. **执行建表 SQL**
   ```bash
   wrangler d1 execute japari-database --file=./schema.sql
   ```

3. **创建 D1 Service**（见代码实现章节）

---

### 方案 C：Redis → Workers KV + D1

#### 数据分类与迁移策略

| 原 Redis 数据 | 访问模式 | 迁移目标 | 理由 |
|-------------|---------|---------|------|
| 群组插件配置 | 读多写少 | **Workers KV** | 全球分布，低延迟读取 |
| HSO 图片缓存 | 随机读写 | **Workers KV** | 临时缓存，可重建 |
| 复读机配置 | 读多写少 | **Workers KV** 或 **D1** | KV 更快，D1 更持久 |
| 垃圾话词库 | 顺序操作 | **D1 表** | 需要顺序和复杂查询 |
| 垃圾话概率 | 读多写少 | **Workers KV** 或 **D1** | 两者皆可 |
| 163 音乐缓存 | TTL 缓存 | **Workers KV + TTL** | 原生支持过期 |
| 消息调试开关 | 读多写少 | **Workers KV** | 全局配置 |
| AKHR 等待队列 | 强一致性 | **Durable Objects** | 需要事务性操作 |

#### 推荐方案

**简化方案（推荐）**：
- 配置类数据（读多写少）→ **Workers KV**
- 需要持久化的数据 → **D1**
- 临时缓存 → **Workers KV**

**高级方案**：
- 需要强一致性的复杂状态 → **Durable Objects**

---

## 成本对比分析

### 月度成本对比（假设场景）

**假设场景**：
- 图片存储：10 GB
- 图片流量：100 GB/月
- 数据库读取：100 万次/月
- 数据库写入：10 万次/月
- Redis/KV 读取：500 万次/月
- Redis/KV 写入：50 万次/月

| 服务类型 | 当前方案 | Cloudflare | 节省 |
|---------|---------|-----------|------|
| **对象存储** | | | |
| - 存储费用 | $0.26 | $0.15 | $0.11 |
| - 流量费用 | $12.00 | $0.00 | $12.00 |
| **数据库** | | | |
| - Firebase/SQLite | ~$5.00 | $0.00 | $5.00 |
| **缓存** | | | |
| - Redis | $15.00 | $0.00 | $15.00 |
| **总计** | **$32.26** | **$0.15** | **$32.11** ⭐ |

> **注意**：实际成本取决于具体使用量。Cloudflare 的免费额度对于中小型项目完全够用。

### 成本优化建议

1. **R2 流量优势**：如果图片流量大，R2 的免费出站流量可以节省巨大成本
2. **D1 免费额度**：5GB 存储和 500 万次读取对大多数应用足够
3. **Workers KV**：1000 万次免费读取非常慷慨

---

## 迁移步骤

### 总体策略

**原则**：
1. 🔄 分阶段迁移，降低风险
2. 🧪 每个阶段充分测试
3. 🔙 保留回滚方案
4. 📊 监控性能和错误

**推荐顺序**：
1. Firebase Storage → R2（最高收益，最低风险）
2. SQLite → D1（数据量小，易于验证）
3. Firestore → D1（数据结构简单）
4. Redis → Workers KV + D1（最复杂，放在最后）

---

### 阶段 1：Firebase Storage → R2

**预估时间**：1-2 天

#### 步骤清单

- [ ] 1. 创建 R2 bucket
- [ ] 2. 配置自定义域名
- [ ] 3. 生成 API 密钥
- [ ] 4. 实现 R2Service
- [ ] 5. 更新配置文件
- [ ] 6. 测试上传和访问
- [ ] 7. 迁移历史数据（可选）
- [ ] 8. 切换生产环境
- [ ] 9. 监控错误日志
- [ ] 10. 验证费用账单

#### 详细步骤

**1-3. 准备工作**

```bash
# 安装 Wrangler CLI（如果未安装）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 R2 bucket
wrangler r2 bucket create japari-images

# 配置自定义域名（在 Dashboard 操作）
# 1. R2 → japari-images → Settings → Public Access
# 2. Connect Domain → 输入 images.yourdomain.com
# 3. 添加 DNS CNAME 记录
```

**4. 实现 R2Service**（见代码实现章节）

**5. 更新配置**

```javascript
// config.js
export default {
  // ... 其他配置
  
  // 新增 R2 配置
  R2: {
    ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    BUCKET_NAME: process.env.R2_BUCKET_NAME || 'japari-images',
    PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN
  },
  
  // 添加开关，方便切换
  USE_R2: process.env.USE_R2 === 'true'
};
```

**6. 测试**

```javascript
// src/test/r2-upload.js
import R2Service from '../services/r2-service';
import fs from 'fs';

async function test() {
  await R2Service.init();
  
  // 测试上传
  const testImage = fs.readFileSync('./res/outPut.png');
  const url = await R2Service.uploadImage('test/upload.png', testImage);
  
  console.log('上传成功，URL:', url);
  
  // 验证 URL 可访问
  const response = await fetch(url);
  console.log('访问测试:', response.ok ? '成功' : '失败');
}

test().catch(console.error);
```

**7. 迁移历史数据（可选）**

如果需要迁移 Firebase 已有的图片：

```javascript
// scripts/migrate-firebase-to-r2.js
import admin from 'firebase-admin';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Config from '../src/config';

async function migrateImages() {
  // 初始化 Firebase
  const app = admin.initializeApp({
    credential: admin.credential.cert(Config.FIREBASE_KEY),
    storageBucket: 'japari-park-e9cc5.appspot.com'
  });
  const bucket = app.storage().bucket();
  
  // 初始化 R2
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${Config.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Config.R2.ACCESS_KEY_ID,
      secretAccessKey: Config.R2.SECRET_ACCESS_KEY
    }
  });
  
  // 获取所有文件
  const [files] = await bucket.getFiles({ prefix: 'hoshii/' });
  
  console.log(`找到 ${files.length} 个文件`);
  
  let count = 0;
  for (const file of files) {
    try {
      const [content] = await file.download();
      
      await r2Client.send(new PutObjectCommand({
        Bucket: Config.R2.BUCKET_NAME,
        Key: file.name,
        Body: content,
        ContentType: file.metadata.contentType || 'image/png'
      }));
      
      count++;
      console.log(`[${count}/${files.length}] 迁移: ${file.name}`);
    } catch (error) {
      console.error(`迁移失败: ${file.name}`, error);
    }
  }
  
  console.log(`迁移完成，成功 ${count} 个文件`);
}

migrateImages().catch(console.error);
```

**8. 切换生产环境**

```javascript
// src/services/hoshii-service/index.js
// 修改前
return FirebaseService.uploadImage(filePath, this.drawImage(topText, bottomText));

// 修改后（双写模式，保险起见）
const imageBuffer = this.drawImage(topText, bottomText);
const url = Config.USE_R2 
  ? await R2Service.uploadImage(filePath, imageBuffer)
  : await FirebaseService.uploadImage(filePath, imageBuffer);
return url;
```

**9-10. 监控和验证**

- 检查应用错误日志
- 验证图片 URL 可访问
- 检查 Cloudflare Dashboard 的使用量
- 对比 Firebase 账单

---

### 阶段 2：SQLite → D1

**预估时间**：1 天

#### 步骤清单

- [ ] 1. 创建 D1 数据库
- [ ] 2. 导出 SQLite 数据
- [ ] 3. 创建 D1 表结构
- [ ] 4. 导入数据到 D1
- [ ] 5. 实现 D1Service
- [ ] 6. 更新插件代码
- [ ] 7. 测试所有功能
- [ ] 8. 切换生产环境

#### 详细步骤

**1. 创建 D1 数据库**

```bash
wrangler d1 create japari-database

# 输出示例：
# [[d1_databases]]
# binding = "DB"
# database_name = "japari-database"
# database_id = "xxxx-xxxx-xxxx-xxxx"
```

**2. 导出 SQLite 数据**

```bash
# 导出现有数据
sqlite3 db.sqlite3 .dump > backup.sql

# 或者使用脚本
node scripts/export-sqlite.js
```

```javascript
// scripts/export-sqlite.js
import knex from 'knex';

const db = knex({
  client: 'better-sqlite3',
  connection: { filename: './db.sqlite3' },
  useNullAsDefault: true
});

async function exportData() {
  // 导出 osu_bind
  const osuBinds = await db('osu_bind').select('*');
  console.log('osu_bind 数据:', JSON.stringify(osuBinds, null, 2));
  
  // 导出 osu_map
  const osuMaps = await db('osu_map').select('*');
  console.log('osu_map 数量:', osuMaps.length);
  
  // 导出 new-notice
  const notices = await db('new-notice').select('*');
  console.log('new-notice 数据:', JSON.stringify(notices, null, 2));
  
  await db.destroy();
}

exportData();
```

**3. 创建 D1 表结构**

```bash
# 创建 schema.sql（见数据库设计章节）
wrangler d1 execute japari-database --file=./schema.sql
```

**4. 导入数据**

```javascript
// scripts/import-to-d1.js
import { S3Client } from '@aws-sdk/client-s3';
// 注意：实际需要使用 D1 HTTP API 或 Wrangler

async function importData() {
  // 方案 1：使用 wrangler d1 execute
  // wrangler d1 execute japari-database --command="INSERT INTO ..."
  
  // 方案 2：通过 Workers 脚本导入
  // 需要先部署一个 Worker 用于数据导入
}
```

**5-8. 实现和测试**（见代码实现章节）

---

### 阶段 3：Firestore → D1

**预估时间**：半天

#### 步骤清单

- [ ] 1. 导出 Firestore schedules 数据
- [ ] 2. 转换为 SQL 格式
- [ ] 3. 导入到 D1
- [ ] 4. 更新 ScheduleService
- [ ] 5. 测试定时任务
- [ ] 6. 切换生产环境

#### 数据导出脚本

```javascript
// scripts/export-firestore.js
import admin from 'firebase-admin';
import Config from '../src/config';
import fs from 'fs';

async function exportSchedules() {
  const app = admin.initializeApp({
    credential: admin.credential.cert(Config.FIREBASE_KEY)
  });
  
  const db = app.firestore();
  const schedulesRef = db.collection('schedules');
  const snapshot = await schedulesRef.get();
  
  const data = [];
  snapshot.forEach(doc => {
    data.push({
      group_id: doc.id,
      ...doc.data()
    });
  });
  
  // 生成 SQL
  const sql = data.map(item => {
    const groupId = item.group_id;
    const rule = item.rule.replace(/'/g, "''");
    const text = item.text.replace(/'/g, "''");
    return `INSERT INTO schedules (group_id, rule, text) VALUES ('${groupId}', '${rule}', '${text}');`;
  }).join('\n');
  
  fs.writeFileSync('schedules.sql', sql);
  console.log(`导出 ${data.length} 条定时任务`);
  console.log('SQL 文件已保存到 schedules.sql');
}

exportSchedules().catch(console.error);
```

---

### 阶段 4：Redis → Workers KV + D1

**预估时间**：2-3 天

#### 步骤清单

- [ ] 1. 创建 KV namespace
- [ ] 2. 分析 Redis 数据访问模式
- [ ] 3. 决定数据迁移目标（KV 或 D1）
- [ ] 4. 导出 Redis 数据
- [ ] 5. 实现 KVService
- [ ] 6. 更新插件代码
- [ ] 7. 分批切换
- [ ] 8. 验证功能

#### 详细步骤

**1. 创建 KV namespace**

```bash
wrangler kv:namespace create "JAPARI_KV"

# 输出示例：
# [[kv_namespaces]]
# binding = "JAPARI_KV"
# id = "xxxxxxxxxxxx"
```

**2-3. 数据分类**（见方案 C）

**4. 导出 Redis 数据**

```javascript
// scripts/export-redis.js
import Redis from 'ioredis';
import fs from 'fs';

const redis = new Redis({
  port: 6379,
  host: '127.0.0.1'
});

async function exportAll() {
  const data = {};
  
  // 导出所有 key
  const keys = await redis.keys('*');
  
  for (const key of keys) {
    const type = await redis.type(key);
    
    switch (type) {
      case 'string':
        data[key] = { type: 'string', value: await redis.get(key) };
        break;
      case 'set':
        data[key] = { type: 'set', value: await redis.smembers(key) };
        break;
      case 'list':
        data[key] = { type: 'list', value: await redis.lrange(key, 0, -1) };
        break;
      case 'hash':
        data[key] = { type: 'hash', value: await redis.hgetall(key) };
        break;
    }
  }
  
  fs.writeFileSync('redis-export.json', JSON.stringify(data, null, 2));
  console.log(`导出 ${keys.length} 个键`);
  
  redis.disconnect();
}

exportAll().catch(console.error);
```

**5-8. 实现和测试**（见代码实现章节）

---

## 代码实现

### 1. R2 Service

```javascript
// src/services/r2-service.js
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import Config from '../config';
import logger from '../utils/logger';

class R2Service {
  init() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${Config.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Config.R2.ACCESS_KEY_ID,
        secretAccessKey: Config.R2.SECRET_ACCESS_KEY
      }
    });
    this.bucketName = Config.R2.BUCKET_NAME;
    this.publicDomain = Config.R2.PUBLIC_DOMAIN;
  }

  async uploadImage(filePath, imageBuffer, metadata = {}) {
    try {
      logger.info(`checking image exists: ${filePath}`);
      
      // 检查文件是否存在
      let exists = false;
      try {
        await this.client.send(new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: filePath
        }));
        exists = true;
        logger.info(`image already exists: ${filePath}`);
      } catch (err) {
        if (err.name !== 'NotFound') throw err;
      }

      if (!exists) {
        logger.info(`uploading image to R2: ${filePath}`);
        await this.client.send(new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filePath,
          Body: imageBuffer,
          ContentType: metadata.contentType || 'image/png',
          CacheControl: metadata.cacheControl || 'public,max-age=31536000',
          Metadata: metadata
        }));
      }

      // 返回公开 URL
      return `${this.publicDomain}/${filePath}`;
    } catch (error) {
      logger.error('R2 upload error:', error);
      throw error;
    }
  }

  async imageExists(filePath) {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filePath
      }));
      return true;
    } catch (err) {
      if (err.name === 'NotFound') return false;
      throw err;
    }
  }

  getPublicUrl(filePath) {
    return `${this.publicDomain}/${filePath}`;
  }
}

export default new R2Service();
```

---

### 2. D1 Service

```javascript
// src/services/d1-service.js
import logger from '../utils/logger';

class D1Service {
  constructor() {
    this.db = null;
  }

  // 初始化（在 Node.js 环境中使用 HTTP API）
  init(binding) {
    this.db = binding;
  }

  // 在 Cloudflare Workers 中使用
  async query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(...params);
    }
    return stmt.all();
  }

  async run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(...params);
    }
    return stmt.run();
  }

  async first(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(...params);
    }
    return stmt.first();
  }

  // ==========================================
  // Schedule 相关方法
  // ==========================================

  async getAllSchedules() {
    const { results } = await this.query('SELECT * FROM schedules');
    return results;
  }

  async getScheduleByGroupId(groupId) {
    return this.first(
      'SELECT * FROM schedules WHERE group_id = ?',
      [String(groupId)]
    );
  }

  async setSchedule(groupId, rule, text) {
    return this.run(
      `INSERT INTO schedules (group_id, rule, text, updated_at)
       VALUES (?, ?, ?, strftime('%s', 'now'))
       ON CONFLICT(group_id) DO UPDATE SET
         rule = excluded.rule,
         text = excluded.text,
         updated_at = excluded.updated_at`,
      [String(groupId), rule, text]
    );
  }

  async removeSchedule(groupId) {
    return this.run(
      'DELETE FROM schedules WHERE group_id = ?',
      [String(groupId)]
    );
  }

  // ==========================================
  // OSU 相关方法
  // ==========================================

  async getOsuBind(groupId, userId) {
    return this.first(
      'SELECT * FROM osu_bind WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
  }

  async setOsuBind(groupId, userId, osuId, osuName, mode) {
    return this.run(
      `INSERT INTO osu_bind (group_id, user_id, osu_id, osu_name, mode)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, group_id) DO UPDATE SET
         osu_id = excluded.osu_id,
         osu_name = excluded.osu_name,
         mode = excluded.mode`,
      [groupId, userId, osuId, osuName, mode]
    );
  }

  async deleteOsuBind(groupId, userId) {
    return this.run(
      'DELETE FROM osu_bind WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
  }

  async getOsuMap(mapId) {
    const result = await this.first(
      'SELECT map FROM osu_map WHERE id = ?',
      [mapId]
    );
    return result?.map;
  }

  async setOsuMap(mapId, mapData) {
    return this.run(
      'INSERT OR REPLACE INTO osu_map (id, map) VALUES (?, ?)',
      [mapId, mapData]
    );
  }

  // ==========================================
  // 入群欢迎相关
  // ==========================================

  async getNewNotice(groupId) {
    const result = await this.first(
      'SELECT template FROM new_notice WHERE group_id = ?',
      [groupId]
    );
    return result?.template;
  }

  async setNewNotice(groupId, template) {
    return this.run(
      `INSERT INTO new_notice (group_id, template, updated_at)
       VALUES (?, ?, strftime('%s', 'now'))
       ON CONFLICT(group_id) DO UPDATE SET
         template = excluded.template,
         updated_at = excluded.updated_at`,
      [groupId, template]
    );
  }

  // ==========================================
  // 垃圾话词库相关
  // ==========================================

  async getGarbageWords(groupId) {
    const { results } = await this.query(
      'SELECT word FROM garbage_words WHERE group_id = ? ORDER BY position',
      [groupId]
    );
    return results.map(r => r.word);
  }

  async addGarbageWord(groupId, word) {
    // 获取当前最大 position
    const maxPos = await this.first(
      'SELECT MAX(position) as max FROM garbage_words WHERE group_id = ?',
      [groupId]
    );
    const newPos = (maxPos?.max || 0) + 1;
    
    return this.run(
      'INSERT INTO garbage_words (group_id, word, position) VALUES (?, ?, ?)',
      [groupId, word, newPos]
    );
  }

  async removeGarbageWord(groupId, word) {
    return this.run(
      'DELETE FROM garbage_words WHERE group_id = ? AND word = ?',
      [groupId, word]
    );
  }

  async getGarbageWordConfig(groupId) {
    const result = await this.first(
      'SELECT random_rate FROM garbage_word_config WHERE group_id = ?',
      [groupId]
    );
    return result?.random_rate;
  }

  async setGarbageWordConfig(groupId, rate) {
    return this.run(
      `INSERT INTO garbage_word_config (group_id, random_rate, updated_at)
       VALUES (?, ?, strftime('%s', 'now'))
       ON CONFLICT(group_id) DO UPDATE SET
         random_rate = excluded.random_rate,
         updated_at = excluded.updated_at`,
      [groupId, rate]
    );
  }

  // ==========================================
  // 复读机配置相关
  // ==========================================

  async getReadAgainConfig(groupId) {
    const result = await this.first(
      'SELECT random_rate FROM read_again_config WHERE group_id = ?',
      [groupId]
    );
    return result?.random_rate;
  }

  async setReadAgainConfig(groupId, rate) {
    return this.run(
      `INSERT INTO read_again_config (group_id, random_rate, updated_at)
       VALUES (?, ?, strftime('%s', 'now'))
       ON CONFLICT(group_id) DO UPDATE SET
         random_rate = excluded.random_rate,
         updated_at = excluded.updated_at`,
      [groupId, rate]
    );
  }
}

export default new D1Service();
```

---

### 3. Workers KV Service

```javascript
// src/services/kv-service.js
import logger from '../utils/logger';

class KVService {
  constructor() {
    this.kv = null;
  }

  init(binding) {
    this.kv = binding;
  }

  // ==========================================
  // 基础 KV 操作
  // ==========================================

  async get(key) {
    return this.kv.get(key);
  }

  async set(key, value, expirationTtl) {
    const options = expirationTtl ? { expirationTtl } : {};
    return this.kv.put(key, value, options);
  }

  async delete(key) {
    return this.kv.delete(key);
  }

  // ==========================================
  // 群组插件配置（模拟 Redis Set）
  // ==========================================

  async getGroupPluginConfig(groupId) {
    const key = `group-plugin-config-${groupId}`;
    const value = await this.kv.get(key);
    return value ? JSON.parse(value) : [];
  }

  async updateGroupPluginConfig(groupId, pluginList) {
    const key = `group-plugin-config-${groupId}`;
    return this.kv.put(key, JSON.stringify(pluginList));
  }

  // ==========================================
  // HSO 图片缓存（模拟 Redis Set）
  // ==========================================

  async getHsoCache(plusMode) {
    const key = plusMode ? 'hso-plus-cache' : 'hso-cache';
    const value = await this.kv.get(key);
    return value ? JSON.parse(value) : [];
  }

  async setHsoCache(plusMode, hsoList) {
    const key = plusMode ? 'hso-plus-cache' : 'hso-cache';
    return this.kv.put(key, JSON.stringify(hsoList));
  }

  async popHso(plusMode) {
    const list = await this.getHsoCache(plusMode);
    if (!list.length) return null;
    
    const item = list.pop();
    await this.setHsoCache(plusMode, list);
    return item;
  }

  async clearHsoCache(plusMode) {
    const key = plusMode ? 'hso-plus-cache' : 'hso-cache';
    return this.kv.delete(key);
  }

  // ==========================================
  // 163 音乐缓存（支持 TTL）
  // ==========================================

  async getMusicCache(keyword) {
    return this.kv.get(`music-cache-${keyword}`);
  }

  async setMusicCache(keyword, id) {
    // 24 小时过期
    return this.kv.put(`music-cache-${keyword}`, id, {
      expirationTtl: 86400
    });
  }

  // ==========================================
  // 消息调试开关
  // ==========================================

  async getMessageDebug() {
    return this.kv.get('messageDebug');
  }

  async setMessageDebug(value) {
    return this.kv.put('messageDebug', String(value));
  }

  // ==========================================
  // 复读机/垃圾话触发频率（如果不用 D1）
  // ==========================================

  async getRate(key, groupId) {
    return this.kv.get(`${key}-${groupId}`);
  }

  async setRate(key, groupId, rate) {
    return this.kv.put(`${key}-${groupId}`, String(rate));
  }
}

export default new KVService();
```

---

### 4. 更新现有 Service

#### 4.1 更新 ScheduleService

```javascript
// src/services/schedule-service.js
import schedule, { scheduleJob } from 'node-schedule';
import { getShangHaiTimeParts } from '../utils/date';
import logger from '../utils/logger';
import Config from '../config';

// 根据配置选择数据源
import FirebaseService from './firebase-service';
import D1Service from './d1-service';

const USE_D1 = Config.USE_D1 || false;

class ScheduleService {
  async getAllSchedule() {
    if (USE_D1) {
      return D1Service.getAllSchedules();
    } else {
      const ref = FirebaseService.getSchedulesRef();
      const data = await ref.get();
      return data.docs;
    }
  }

  async getScheduleByGroupId(groupId) {
    if (USE_D1) {
      return D1Service.getScheduleByGroupId(groupId);
    } else {
      const doc = await FirebaseService.getSchedulesRef().doc(`${groupId}`).get();
      return doc.data();
    }
  }

  async setSchedule(groupId, rule, text) {
    this.cancelSchedule(groupId);
    const { hours, days } = this.runSchedule(groupId, rule, text);
    const ruleString = `${hours.join(',')} ${days.join(',')}`;
    
    if (USE_D1) {
      await D1Service.setSchedule(groupId, ruleString, text);
    } else {
      const docRef = FirebaseService.getSchedulesRef().doc(`${groupId}`);
      const doc = await docRef.get();
      if (doc.exists) {
        await docRef.update({ rule: ruleString, text });
      } else {
        await docRef.set({ rule: ruleString, text });
      }
    }
    
    return { hours, days };
  }

  async removeSchedule(groupId) {
    this.cancelSchedule(groupId);
    
    if (USE_D1) {
      await D1Service.removeSchedule(groupId);
    } else {
      await FirebaseService.getSchedulesRef().doc(`${groupId}`).delete();
    }
    
    return 0;
  }

  // ... 其他方法保持不变
}

export default new ScheduleService();
```

#### 4.2 更新 HoshiiService

```javascript
// src/services/hoshii-service/index.js
import logger from '../../utils/logger';
import Config from '../../config';
import FirebaseService from '../firebase-service';
import R2Service from '../r2-service';

const USE_R2 = Config.USE_R2 || false;

class HoShiiService {
  // drawImage 方法保持不变
  
  async drawAndGetRemoteUrl(topText, bottomText, fileName) {
    const filePath = `hoshii/${fileName}.png`;
    const imageBuffer = this.drawImage(topText, bottomText);
    
    if (USE_R2) {
      return R2Service.uploadImage(filePath, imageBuffer);
    } else {
      return FirebaseService.uploadImage(filePath, imageBuffer);
    }
  }
}

export default new HoShiiService();
```

#### 4.3 更新 GenshinService

```javascript
// src/services/genshin-service.js
// ... 导入部分
import Config from '../config';
import FirebaseService from './firebase-service';
import R2Service from './r2-service';

const USE_R2 = Config.USE_R2 || false;

class GenshinService {
  // ... 其他方法保持不变

  async drawCharaArtifactsAndGetRemoteUrl(uid, position) {
    const imageBuffer = await this.drawCharaArtifactsImage(uid, position);
    const filePath = `genshin/${uid}/${Date.now()}.png`;
    
    if (USE_R2) {
      return R2Service.uploadImage(filePath, imageBuffer);
    } else {
      return FirebaseService.uploadImage(filePath, imageBuffer);
    }
  }
}

export default new GenshinService();
```

#### 4.4 更新 PluginService（Redis → KV）

```javascript
// src/services/plugin-service.js
import Config from '../config';
import RedisService from './redis-service';
import KVService from './kv-service';

const USE_KV = Config.USE_KV || false;

class PluginService {
  // ... 其他方法保持不变

  async getGroupConfig(groupId) {
    if (this.groupConfigs[groupId]) {
      return this.groupConfigs[groupId];
    }
    
    let config = null;
    try {
      logger.info(`getting group(${groupId}) config...`);
      
      if (USE_KV) {
        config = await KVService.getGroupPluginConfig(groupId);
      } else {
        config = await RedisService.getGroupPluginConfig(groupId);
      }
      
      if (!Array.isArray(config) || !config.length) {
        logger.info('config not found, use default');
        config = this.defaultGroupConfig;
      } else {
        logger.info(`got config, ${JSON.stringify(config)}`);
      }
    } catch (e) {
      logger.error('get config error:', e);
      config = this.defaultGroupConfig;
    }
    
    this.groupConfigs[groupId] = config.reduce((prev, curr) => {
      prev[curr] = true;
      return prev;
    }, {});
    
    if (USE_KV) {
      await KVService.updateGroupPluginConfig(groupId, config);
    } else {
      await RedisService.updateGroupPluginConfig(groupId, config);
    }
    
    return this.groupConfigs[groupId];
  }

  async setGroupConfig(groupId, groupConfigMap) {
    this.groupConfigs[groupId] = groupConfigMap;
    const groupConfigList = Object.keys(groupConfigMap);
    
    if (USE_KV) {
      await KVService.updateGroupPluginConfig(groupId, groupConfigList);
    } else {
      await RedisService.updateGroupPluginConfig(groupId, groupConfigList);
    }
  }
}

export default new PluginService();
```

---

### 5. 配置文件更新

```javascript
// src/config.js
export default {
  // ... 现有配置
  
  // R2 配置
  R2: {
    ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    BUCKET_NAME: process.env.R2_BUCKET_NAME || 'japari-images',
    PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN // 如 https://images.yourdomain.com
  },
  
  // D1 配置
  D1: {
    DATABASE_ID: process.env.D1_DATABASE_ID,
    API_TOKEN: process.env.D1_API_TOKEN
  },
  
  // Workers KV 配置
  KV: {
    NAMESPACE_ID: process.env.KV_NAMESPACE_ID,
    API_TOKEN: process.env.KV_API_TOKEN
  },
  
  // 功能开关
  USE_R2: process.env.USE_R2 === 'true',
  USE_D1: process.env.USE_D1 === 'true',
  USE_KV: process.env.USE_KV === 'true'
};
```

```bash
# .env.example
# R2 配置
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=japari-images
R2_PUBLIC_DOMAIN=https://images.yourdomain.com

# D1 配置
D1_DATABASE_ID=your_database_id
D1_API_TOKEN=your_api_token

# KV 配置
KV_NAMESPACE_ID=your_namespace_id
KV_API_TOKEN=your_api_token

# 功能开关（迁移期间逐步开启）
USE_R2=false
USE_D1=false
USE_KV=false
```

---

## 数据迁移脚本

### 1. Firebase Storage → R2

```javascript
// scripts/migrate-firebase-to-r2.js
import admin from 'firebase-admin';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import Config from '../src/config.js';
import logger from '../src/utils/logger.js';

async function migrateImages() {
  logger.info('开始迁移 Firebase Storage 到 R2...');
  
  // 初始化 Firebase
  const app = admin.initializeApp({
    credential: admin.credential.cert(Config.FIREBASE_KEY),
    storageBucket: 'japari-park-e9cc5.appspot.com'
  });
  const bucket = app.storage().bucket();
  
  // 初始化 R2
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${Config.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: Config.R2.ACCESS_KEY_ID,
      secretAccessKey: Config.R2.SECRET_ACCESS_KEY
    }
  });
  
  // 获取所有文件
  const [files] = await bucket.getFiles();
  logger.info(`找到 ${files.length} 个文件`);
  
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    try {
      // 检查 R2 中是否已存在
      try {
        await r2Client.send(new HeadObjectCommand({
          Bucket: Config.R2.BUCKET_NAME,
          Key: file.name
        }));
        logger.info(`跳过（已存在）: ${file.name}`);
        skipCount++;
        continue;
      } catch (err) {
        if (err.name !== 'NotFound') throw err;
      }
      
      // 下载文件
      const [content] = await file.download();
      
      // 上传到 R2
      await r2Client.send(new PutObjectCommand({
        Bucket: Config.R2.BUCKET_NAME,
        Key: file.name,
        Body: content,
        ContentType: file.metadata.contentType || 'image/png',
        CacheControl: file.metadata.cacheControl || 'public,max-age=31536000'
      }));
      
      successCount++;
      logger.info(`[${successCount + skipCount + failCount}/${files.length}] 迁移成功: ${file.name}`);
    } catch (error) {
      failCount++;
      logger.error(`迁移失败: ${file.name}`, error.message);
    }
  }
  
  logger.info('='.repeat(50));
  logger.info('迁移完成！');
  logger.info(`总计: ${files.length} 个文件`);
  logger.info(`成功: ${successCount}`);
  logger.info(`跳过: ${skipCount}`);
  logger.info(`失败: ${failCount}`);
}

migrateImages().catch(error => {
  logger.error('迁移过程出错:', error);
  process.exit(1);
});
```

**运行**：
```bash
node scripts/migrate-firebase-to-r2.js
```

---

### 2. Firestore → D1

```javascript
// scripts/migrate-firestore-to-d1.js
import admin from 'firebase-admin';
import Config from '../src/config.js';
import logger from '../src/utils/logger.js';
import fs from 'fs';

async function exportSchedules() {
  logger.info('开始导出 Firestore schedules...');
  
  const app = admin.initializeApp({
    credential: admin.credential.cert(Config.FIREBASE_KEY)
  });
  
  const db = app.firestore();
  const schedulesRef = db.collection('schedules');
  const snapshot = await schedulesRef.get();
  
  logger.info(`找到 ${snapshot.size} 条定时任务`);
  
  const sqlStatements = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const groupId = doc.id.replace(/'/g, "''");
    const rule = data.rule.replace(/'/g, "''");
    const text = data.text.replace(/'/g, "''");
    
    sqlStatements.push(
      `INSERT INTO schedules (group_id, rule, text) VALUES ('${groupId}', '${rule}', '${text}');`
    );
  });
  
  const sql = sqlStatements.join('\n');
  fs.writeFileSync('schedules-import.sql', sql);
  
  logger.info('导出完成！');
  logger.info('SQL 文件已保存到: schedules-import.sql');
  logger.info('');
  logger.info('下一步：运行以下命令导入到 D1');
  logger.info('wrangler d1 execute japari-database --file=./schedules-import.sql');
}

exportSchedules().catch(error => {
  logger.error('导出过程出错:', error);
  process.exit(1);
});
```

**运行**：
```bash
# 1. 导出数据
node scripts/migrate-firestore-to-d1.js

# 2. 导入到 D1
wrangler d1 execute japari-database --file=./schedules-import.sql

# 3. 验证
wrangler d1 execute japari-database --command="SELECT COUNT(*) FROM schedules;"
```

---

### 3. SQLite → D1

```javascript
// scripts/migrate-sqlite-to-d1.js
import knex from 'knex';
import fs from 'fs';
import logger from '../src/utils/logger.js';

const db = knex({
  client: 'better-sqlite3',
  connection: { filename: './db.sqlite3' },
  useNullAsDefault: true
});

async function exportTable(tableName, columns) {
  logger.info(`导出表: ${tableName}`);
  
  const rows = await db(tableName).select('*');
  logger.info(`  找到 ${rows.length} 条记录`);
  
  if (rows.length === 0) return '';
  
  const sqlStatements = rows.map(row => {
    const values = columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      return val;
    }).join(', ');
    
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
  });
  
  return sqlStatements.join('\n');
}

async function migrateAll() {
  logger.info('开始迁移 SQLite 数据到 D1...');
  logger.info('');
  
  const tables = [
    {
      name: 'osu_bind',
      columns: ['id', 'user_id', 'group_id', 'osu_id', 'osu_name', 'mode']
    },
    {
      name: 'osu_map',
      columns: ['id', 'map']
    },
    {
      name: 'new-notice',
      columns: ['group_id', 'template']
    }
  ];
  
  const allSql = [];
  
  for (const table of tables) {
    const sql = await exportTable(table.name, table.columns);
    if (sql) allSql.push(sql);
  }
  
  const finalSql = allSql.join('\n\n');
  fs.writeFileSync('sqlite-to-d1.sql', finalSql);
  
  await db.destroy();
  
  logger.info('');
  logger.info('导出完成！');
  logger.info('SQL 文件已保存到: sqlite-to-d1.sql');
  logger.info('');
  logger.info('下一步：');
  logger.info('1. 检查 SQL 文件内容');
  logger.info('2. 运行: wrangler d1 execute japari-database --file=./sqlite-to-d1.sql');
  logger.info('3. 验证: wrangler d1 execute japari-database --command="SELECT COUNT(*) FROM osu_bind;"');
}

migrateAll().catch(error => {
  logger.error('迁移过程出错:', error);
  process.exit(1);
});
```

**运行**：
```bash
# 1. 导出数据
node scripts/migrate-sqlite-to-d1.js

# 2. 导入到 D1
wrangler d1 execute japari-database --file=./sqlite-to-d1.sql

# 3. 验证各表
wrangler d1 execute japari-database --command="SELECT COUNT(*) FROM osu_bind;"
wrangler d1 execute japari-database --command="SELECT COUNT(*) FROM osu_map;"
wrangler d1 execute japari-database --command="SELECT COUNT(*) FROM new_notice;"
```

---

### 4. Redis → KV + D1

```javascript
// scripts/migrate-redis-to-cloudflare.js
import Redis from 'ioredis';
import Config from '../src/config.js';
import logger from '../src/utils/logger.js';
import fs from 'fs';

const redis = new Redis({
  port: Config.REDIS.REDIS_PORT,
  host: '127.0.0.1',
  password: Config.REDIS.REDIS_PW,
  db: 0
});

async function exportAll() {
  logger.info('开始导出 Redis 数据...');
  logger.info('');
  
  const kvData = {}; // 用于导出到 KV 的数据
  const d1Data = { // 用于导出到 D1 的数据
    read_again_config: [],
    garbage_word_config: [],
    garbage_words: []
  };
  
  // 获取所有 key
  const keys = await redis.keys('*');
  logger.info(`找到 ${keys.length} 个键`);
  
  for (const key of keys) {
    const type = await redis.type(key);
    logger.info(`处理: ${key} (${type})`);
    
    switch (type) {
      case 'string': {
        const value = await redis.get(key);
        
        // 判断是否是配置数据
        if (key.startsWith('read-again-random-')) {
          const groupId = key.replace('read-again-random-', '');
          d1Data.read_again_config.push({ groupId, rate: parseFloat(value) });
        } else if (key.startsWith('garbage-word-random-')) {
          const groupId = key.replace('garbage-word-random-', '');
          d1Data.garbage_word_config.push({ groupId, rate: parseFloat(value) });
        } else {
          // 其他字符串数据放到 KV
          kvData[key] = { type: 'string', value };
        }
        break;
      }
      
      case 'set': {
        const members = await redis.smembers(key);
        kvData[key] = { type: 'set', value: members };
        break;
      }
      
      case 'list': {
        const items = await redis.lrange(key, 0, -1);
        
        // 判断是否是垃圾话词库
        if (key.startsWith('garbage-word-list-')) {
          const groupId = key.replace('garbage-word-list-', '');
          items.forEach((word, index) => {
            d1Data.garbage_words.push({ groupId, word, position: index + 1 });
          });
        } else {
          kvData[key] = { type: 'list', value: items };
        }
        break;
      }
      
      case 'hash': {
        const hash = await redis.hgetall(key);
        kvData[key] = { type: 'hash', value: hash };
        break;
      }
    }
  }
  
  // 保存 KV 数据
  fs.writeFileSync('redis-to-kv.json', JSON.stringify(kvData, null, 2));
  logger.info('');
  logger.info('KV 数据已导出到: redis-to-kv.json');
  
  // 生成 D1 SQL
  const d1Sql = [];
  
  // 复读机配置
  d1Data.read_again_config.forEach(({ groupId, rate }) => {
    d1Sql.push(
      `INSERT INTO read_again_config (group_id, random_rate) VALUES (${groupId}, ${rate});`
    );
  });
  
  // 垃圾话配置
  d1Data.garbage_word_config.forEach(({ groupId, rate }) => {
    d1Sql.push(
      `INSERT INTO garbage_word_config (group_id, random_rate) VALUES (${groupId}, ${rate});`
    );
  });
  
  // 垃圾话词库
  d1Data.garbage_words.forEach(({ groupId, word, position }) => {
    const escapedWord = word.replace(/'/g, "''");
    d1Sql.push(
      `INSERT INTO garbage_words (group_id, word, position) VALUES (${groupId}, '${escapedWord}', ${position});`
    );
  });
  
  if (d1Sql.length > 0) {
    fs.writeFileSync('redis-to-d1.sql', d1Sql.join('\n'));
    logger.info('D1 SQL 已导出到: redis-to-d1.sql');
  }
  
  redis.disconnect();
  
  logger.info('');
  logger.info('导出完成！');
  logger.info('');
  logger.info('下一步：');
  logger.info('1. KV 数据需要通过 wrangler 或 API 手动导入');
  logger.info('2. D1 数据运行: wrangler d1 execute japari-database --file=./redis-to-d1.sql');
}

exportAll().catch(error => {
  logger.error('导出过程出错:', error);
  process.exit(1);
});
```

**KV 数据导入脚本**：

```javascript
// scripts/import-to-kv.js
import fs from 'fs';
import logger from '../src/utils/logger.js';

// 注意：需要使用 Cloudflare API 或 Wrangler 导入
// 这里提供批量生成 wrangler 命令的脚本

async function generateKVCommands() {
  const data = JSON.parse(fs.readFileSync('redis-to-kv.json', 'utf-8'));
  const commands = [];
  
  for (const [key, item] of Object.entries(data)) {
    let value;
    
    if (item.type === 'string') {
      value = item.value;
    } else {
      value = JSON.stringify(item.value);
    }
    
    // 转义特殊字符
    const escapedValue = value.replace(/"/g, '\\"');
    commands.push(`wrangler kv:key put --namespace-id=${process.env.KV_NAMESPACE_ID} "${key}" "${escapedValue}"`);
  }
  
  fs.writeFileSync('import-kv-commands.sh', commands.join('\n'));
  logger.info('KV 导入命令已生成到: import-kv-commands.sh');
  logger.info('运行: chmod +x import-kv-commands.sh && ./import-kv-commands.sh');
}

generateKVCommands().catch(error => {
  logger.error('生成命令出错:', error);
  process.exit(1);
});
```

---

## 注意事项

### ⚠️ 迁移风险

1. **数据一致性**
   - 迁移过程中新产生的数据可能丢失
   - 建议在低峰期进行迁移
   - 或者实现双写策略（同时写入新旧系统）

2. **URL 变更**
   - R2 的公开 URL 与 Firebase 不同
   - 历史消息中的图片 URL 会失效
   - 建议：保留 Firebase Storage 一段时间

3. **API 限制**
   - Cloudflare 有请求频率限制
   - D1 写入限制：10 万次/天（免费）
   - Workers KV 写入限制：100 万次/月（免费）

4. **数据库差异**
   - Firestore 是文档数据库，D1 是关系型
   - 查询语法完全不同
   - 需要重写所有数据库操作代码

### 🛡️ 回滚方案

每个迁移阶段都保留回滚能力：

1. **通过环境变量控制**
   ```bash
   # 回滚到 Firebase Storage
   USE_R2=false
   
   # 回滚到 Firestore
   USE_D1=false
   
   # 回滚到 Redis
   USE_KV=false
   ```

2. **保留旧服务一段时间**
   - 迁移后保留 Firebase/Redis 至少 1-2 周
   - 验证 Cloudflare 方案稳定后再关闭

3. **数据备份**
   - 迁移前完整备份所有数据
   - 定期验证备份完整性

### 📊 监控和验证

1. **功能验证**
   - 测试所有涉及存储的功能
   - 验证数据读写正确性
   - 检查图片 URL 可访问性

2. **性能监控**
   - 对比迁移前后响应时间
   - 监控 Cloudflare Dashboard 使用量
   - 观察错误日志

3. **成本跟踪**
   - 监控 Cloudflare 账单
   - 对比 Firebase 历史账单
   - 确认节省成本符合预期

### 🔐 安全建议

1. **API 密钥管理**
   - 不要将密钥提交到 Git
   - 使用环境变量或密钥管理服务
   - 定期轮换密钥

2. **访问权限**
   - R2 bucket 配置适当的 CORS 策略
   - D1 数据库限制访问权限
   - KV namespace 绑定到特定 Worker

3. **数据加密**
   - R2 支持服务端加密
   - 敏感数据考虑客户端加密

### 💡 优化建议

1. **缓存策略**
   - 充分利用 Workers KV 的全球分布
   - 设置合理的 TTL
   - 热点数据放在 KV，冷数据放 D1

2. **批量操作**
   - D1 支持事务，批量写入更高效
   - R2 支持批量上传
   - 减少 API 调用次数

3. **边缘计算**
   - 考虑将部分逻辑迁移到 Cloudflare Workers
   - 利用边缘计算降低延迟
   - 减轻主服务器压力

---

## 总结

### 迁移收益

✅ **成本节省**：预计每月节省 $20-40  
✅ **性能提升**：R2 免费 CDN + Workers 边缘计算  
✅ **架构简化**：统一到 Cloudflare 生态系统  
✅ **运维简化**：无需维护 Redis 服务器  
✅ **可扩展性**：Cloudflare 全球基础设施  

### 迁移时间

- **阶段 1（R2）**：1-2 天
- **阶段 2（D1-SQLite）**：1 天
- **阶段 3（D1-Firestore）**：半天
- **阶段 4（KV）**：2-3 天
- **总计**：约 5-7 天

### 推荐策略

1. **优先级**：Firebase Storage → SQLite → Firestore → Redis
2. **方式**：分阶段迁移，每阶段充分测试
3. **保险**：保留双写模式，验证稳定后切换
4. **监控**：全程监控性能和成本

---

## 参考资源

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [AWS S3 SDK 文档](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)

---

**文档版本**：v1.0  
**创建日期**：2024-12-11  
**最后更新**：2024-12-11

