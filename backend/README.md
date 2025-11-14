# Hyperliquid Clone - Backend API

基于 Express + TypeScript + MySQL + WebSocket 构建的高性能交易平台后端服务。

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js 4.x
- **语言**: TypeScript 5.x
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.x
- **WebSocket**: ws 8.x
- **认证**: JWT + ethers.js (EIP-712)

## 项目结构

```
backend/
├── src/
│   ├── config/              # 配置文件
│   │   └── index.ts         # 环境变量配置
│   ├── controllers/         # 控制器层 (处理请求)
│   ├── services/            # 服务层 (业务逻辑)
│   ├── models/              # 数据模型 (数据库操作)
│   ├── middleware/          # 中间件
│   │   └── errorHandler.ts # 错误处理
│   ├── routes/              # 路由定义
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts         # 通用类型
│   ├── utils/               # 工具函数
│   │   ├── response.ts      # 响应格式化
│   │   └── logger.ts        # 日志工具
│   ├── app.ts               # Express 应用配置
│   └── server.ts            # 服务器启动入口
├── .env.example             # 环境变量示例
├── package.json             # 项目依赖
├── tsconfig.json            # TypeScript 配置
└── README.md                # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库和其他服务：

```bash
# Server
PORT=4000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hyperliquid
DB_USER=root
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_change_in_production
```

### 3. 创建数据库

```sql
CREATE DATABASE hyperliquid CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:4000 启动。

### 5. 测试健康检查

```bash
curl http://localhost:4000/health
```

## 可用脚本

- `npm run dev` - 启动开发服务器（自动重载）
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器
- `npm run typecheck` - TypeScript 类型检查
- `npm run lint` - 代码检查

## API 端点

### 健康检查

```
GET /health
```

### 市场数据 API (计划中)

```
GET  /api/market/pairs          # 获取所有交易对
GET  /api/market/ticker/:symbol # 获取行情
GET  /api/market/orderbook/:symbol # 获取订单簿
GET  /api/market/trades/:symbol # 获取最近成交
GET  /api/market/klines/:symbol # 获取K线数据
```

### 交易 API (计划中)

```
POST   /api/trade/order         # 创建订单
DELETE /api/trade/order/:id     # 取消订单
DELETE /api/trade/orders/all    # 取消所有订单
GET    /api/trade/orders/open   # 获取活跃订单
POST   /api/trade/leverage      # 设置杠杆
```

### 账户 API (计划中)

```
GET    /api/account/balance     # 获取余额
GET    /api/account/positions   # 获取持仓
POST   /api/account/position/close # 平仓
GET    /api/account/history     # 获取交易历史
```

### 认证 API (计划中)

```
POST   /api/auth/register       # 注册
POST   /api/auth/login          # 登录
POST   /api/auth/verify         # 验证签名
```

## WebSocket 服务

WebSocket 服务将在独立端口运行（默认 4001）。

### 连接

```javascript
const ws = new WebSocket('ws://localhost:4001')
```

### 订阅频道

```javascript
// 订阅行情
ws.send(JSON.stringify({
  method: 'subscribe',
  params: { channel: 'ticker.BTC/USDC' }
}))

// 订阅订单簿
ws.send(JSON.stringify({
  method: 'subscribe',
  params: { channel: 'orderbook.BTC/USDC' }
}))

// 订阅成交记录
ws.send(JSON.stringify({
  method: 'subscribe',
  params: { channel: 'trades.BTC/USDC' }
}))
```

## 错误处理

所有 API 响应遵循统一格式：

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "timestamp": 1234567890
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "timestamp": 1234567890
}
```

### 错误代码

- `INTERNAL_ERROR` - 服务器内部错误
- `INVALID_REQUEST` - 无效请求
- `UNAUTHORIZED` - 未授权
- `NOT_FOUND` - 资源不存在
- `INVALID_SIGNATURE` - 签名无效
- `INSUFFICIENT_BALANCE` - 余额不足
- `INVALID_ORDER` - 订单无效
- `RATE_LIMIT_EXCEEDED` - 超过速率限制

## 开发指南

### 添加新路由

1. 在 `src/types/` 定义类型
2. 在 `src/models/` 创建数据模型
3. 在 `src/services/` 实现业务逻辑
4. 在 `src/controllers/` 创建控制器
5. 在 `src/routes/` 定义路由
6. 在 `src/app.ts` 注册路由

### 数据库迁移

数据库表结构参考 `doc/系统设计.md`。

### 日志级别

- `error` - 错误信息
- `warn` - 警告信息
- `info` - 常规信息（默认）
- `debug` - 调试信息

通过 `.env` 中的 `LOG_LEVEL` 配置。

## 部署

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
NODE_ENV=production npm start
```

### 使用 PM2

```bash
npm install -g pm2
pm2 start dist/server.js --name hyperliquid-api
pm2 save
pm2 startup
```

### Docker 部署

```bash
docker build -t hyperliquid-backend .
docker run -p 4000:4000 --env-file .env hyperliquid-backend
```

## 安全考虑

- ✅ 请求体大小限制（10MB）
- ✅ CORS 配置
- ✅ JWT 认证
- ✅ 速率限制
- ✅ SQL 注入防护（参数化查询）
- ✅ XSS 防护
- ✅ 签名验证

## 性能优化

- 数据库连接池
- Redis 缓存
- WebSocket 推送
- 响应压缩
- 异步处理

## 监控和日志

- 结构化日志
- 错误追踪
- 性能监控
- 健康检查

## 许可证

MIT License
