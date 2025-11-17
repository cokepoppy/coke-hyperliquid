# Hyperliquid 交易平台测试指南

## 📋 目录

- [环境准备](#环境准备)
- [启动服务](#启动服务)
- [测试检查清单](#测试检查清单)
- [WebSocket 测试](#websocket-测试)
- [Hyperliquid 数据测试](#hyperliquid-数据测试)
- [组件交互测试](#组件交互测试)
- [响应式布局测试](#响应式布局测试)
- [账户功能测试](#账户功能测试)
- [问题排查](#问题排查)
- [API 测试命令](#api-测试命令)

---

## 🔧 环境准备

### 系统要求

- **Node.js**: >= 16.x
- **npm**: >= 8.x
- **MySQL**: >= 8.0 (可选，用于数据库功能)
- **浏览器**: Chrome/Firefox/Edge 最新版本

### 依赖安装

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd frontend
npm install
```

---

## 🚀 启动服务

### 1️⃣ 启动后端服务器

```bash
# 进入后端目录
cd backend

# 启动开发服务器
npm run dev

# ✓ 成功输出示例:
# [INFO] Hyperliquid service initialized
# [INFO] Market data sync started
# [INFO] WebSocket service initialized
#   - Port: 4001
#   - URL: ws://localhost:4001
# [INFO] HTTP server started
#   - Environment: development
#   - Host: localhost
#   - Port: 3000
#   - API URL: http://localhost:3000
```

**验证后端启动成功**:
```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 预期响应:
# {"status":"ok","timestamp":1234567890}
```

### 2️⃣ 启动前端开发服务器

```bash
# 打开新的终端窗口
cd frontend

# 启动前端服务
npm run dev

# ✓ 成功输出示例:
# VITE v4.x.x ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

### 3️⃣ 访问应用

在浏览器中打开：**http://localhost:5173**

---

## ✅ 测试检查清单

### A. 基础功能测试

#### 1. 首页加载
- [ ] 页面正常显示
- [ ] 导航栏显示正常
- [ ] 无明显控制台错误
- [ ] 样式加载正确

#### 2. 导航到交易页面

**访问**: `http://localhost:5173/trade`

**应该看到的组件**:

| 组件位置 | 组件名称 | 说明 |
|---------|---------|------|
| 顶部 | Navbar | 导航栏 |
| 第二行 | MarketInfo | 交易对信息 |
| 左侧大 | TradingChart | K线图表 |
| 中上 | OrderBook | 买卖盘深度 |
| 中下 | RecentTrades | 最近成交记录 |
| 右上 | TradeForm | 下单表单 |
| 右中 | AccountEquity | 账户权益 |
| 底部 | PositionsPanel | 持仓/订单面板 |

#### 3. 数据显示验证

**MarketInfo (市场信息)**:
```
BTC-PERP  $97,234.56  +1,234.56  +1.29%  ↗
```
- [ ] 显示交易对名称
- [ ] 显示当前价格（真实 Hyperliquid 数据）
- [ ] 显示24h涨跌额和涨跌幅
- [ ] 显示成交量

**OrderBook (订单簿)**:
```
Price        Amount      Total
97,235.50    0.1234      12.00
97,235.00    0.5678      55.24
...
```
- [ ] 买盘（绿色）显示正常
- [ ] 卖盘（红色）显示正常
- [ ] 价格排序正确
- [ ] 深度条显示正常

**TradingChart (K线图)**:
- [ ] TradingView 图表加载
- [ ] 显示 BTC 价格走势
- [ ] 时间周期按钮可用 (1m, 5m, 15m, 1H, 4H, 1D, 1W)
- [ ] 成交量柱状图显示

**RecentTrades (最近成交)**:
```
Price        Amount      Time
97,234.56    0.1234      14:23:45  ← 绿色(BUY)
97,233.21    0.0567      14:23:43  ← 红色(SELL)
```
- [ ] 显示成交记录
- [ ] 买单绿色，卖单红色
- [ ] 时间格式正确 (HH:MM:SS)

**TradeForm (下单表单)**:
- [ ] Buy/Sell 按钮显示
- [ ] 价格输入框
- [ ] 数量输入框
- [ ] 订单类型选择（Market/Limit）
- [ ] 可用余额显示

**AccountEquity (账户权益)**:
```
Total Equity         $10,234.56
Available Balance    $8,000.00
Margin Used          $2,234.56
Unrealized PnL       +$156.78
Margin Ratio         21.82%
```
- [ ] 显示总权益
- [ ] 显示可用余额
- [ ] 显示已用保证金
- [ ] 显示未实现盈亏（带颜色）
- [ ] 显示保证金率

**PositionsPanel (持仓面板)**:
- [ ] Positions 标签
- [ ] Orders 标签
- [ ] History 标签
- [ ] 数据表格显示正常

---

## 🔌 WebSocket 测试

### 1. 检查 WebSocket 连接

**打开浏览器开发者工具**: `F12` 或 `Ctrl+Shift+I`

**Console 标签 - 应该看到**:
```javascript
WebSocket connected for OrderBook
WebSocket connected for MarketInfo
WebSocket connected for PositionsPanel
WebSocket connected for RecentTrades
WebSocket connected for AccountEquity

Subscribed to orderbook:BTC/USDC
Subscribed to ticker:BTC/USDC
Subscribed to trades:BTC/USDC
Subscribed to user positions and orders
```

**Network 标签 - WS 过滤**:
```
Name              Status    Type        Size
localhost:4001    101       websocket   -
```

点击 WebSocket 连接 → **Messages 标签**:

**应该看到实时消息**:
```json
// 订单簿更新 (每1秒)
{
  "channel": "orderbook:BTC/USDC",
  "data": {
    "symbol": "BTC/USDC",
    "bids": [...],
    "asks": [...]
  },
  "timestamp": 1234567890
}

// 行情更新 (每2秒)
{
  "channel": "ticker:BTC/USDC",
  "data": {
    "symbol": "BTC/USDC",
    "lastPrice": "97234.56",
    "change24h": "1234.56",
    ...
  },
  "timestamp": 1234567890
}

// 成交更新 (每1秒)
{
  "channel": "trades:BTC/USDC",
  "data": {
    "tradeId": "abc123",
    "price": "97234.56",
    "quantity": "0.1234",
    "side": "BUY",
    "timestamp": 1234567890
  }
}
```

### 2. 验证实时更新

#### OrderBook 组件
- [ ] 右上角有绿色圆点 (实时连接指示器)
- [ ] 观察买卖盘价格变化 (每1秒)
- [ ] 数量在实时变化
- [ ] 深度条动态更新

#### MarketInfo 组件
- [ ] 价格实时跳动 (每2秒)
- [ ] 涨跌幅实时更新
- [ ] 成交量实时变化

#### RecentTrades 组件
- [ ] 有绿色实时指示器
- [ ] 新成交记录不断出现
- [ ] 列表自动滚动
- [ ] 买卖颜色正确

#### PositionsPanel 组件
- [ ] 持仓盈亏实时更新 (每3秒)
- [ ] 订单状态实时变化

### 3. WebSocket 重连测试

**步骤**:
1. 停止后端服务器 (Ctrl+C)
2. 观察前端 Console

**应该看到**:
```javascript
WebSocket disconnected
Attempting to reconnect... (1/5)
Attempting to reconnect... (2/5)
...
```

3. 重启后端服务器
4. 观察前端自动重连

**应该看到**:
```javascript
WebSocket connected
Subscribed to orderbook:BTC/USDC
...
```

---

## 📡 Hyperliquid 数据测试

### 1. API 请求验证

**打开 Network 标签**，刷新页面

**应该看到的 API 请求**:

```bash
# 市场数据
GET /api/market/pairs                    # 交易对列表
GET /api/market/ticker/BTC-PERP          # 行情数据
GET /api/market/orderbook/BTC-PERP       # 订单簿
GET /api/market/klines/BTC-PERP?interval=1h  # K线数据

# 用户数据 (需登录)
GET /api/account/balance                 # 账户余额
GET /api/account/positions               # 持仓列表
GET /api/trading/orders/open             # 未完成订单
```

### 2. 检查响应数据

**点击任意 API 请求** → **Preview 标签**

**getTicker 响应示例**:
```json
{
  "success": true,
  "data": {
    "symbol": "BTC-PERP",
    "lastPrice": "97234.56",
    "markPrice": "97235.00",
    "indexPrice": "97233.45",
    "priceChange24h": "1234.56",
    "priceChangePercent24h": "1.29",
    "high24h": "98500.00",
    "low24h": "95800.00",
    "volume24h": "12345678.90",
    "fundingRate": "0.0001",
    "openInterest": "1234567.89",
    "timestamp": 1234567890
  }
}
```

### 3. 验证真实数据

**检查价格合理性**:
- [ ] BTC 价格在合理范围 ($95,000 - $100,000)
- [ ] ETH 价格在合理范围 ($3,000 - $4,000)
- [ ] 涨跌幅在正常范围 (-10% ~ +10%)
- [ ] 成交量不是固定值

**Console 日志**:
```javascript
// 如果看到这个，说明使用了真实数据
✓ Fetched real-time data from Hyperliquid

// 如果看到这个，说明降级到模拟数据
⚠ Failed to fetch Hyperliquid data, using fallback
```

### 4. 数据源对比

| 数据类型 | 真实数据特征 | 模拟数据特征 |
|---------|------------|------------|
| BTC 价格 | $97,234.56 (真实市场价) | $50,000 (固定基准价) |
| 订单簿 | 不规则的价格和数量 | 规律的价格间隔 |
| 成交记录 | 不规则的时间间隔 | 固定1秒间隔 |
| K线数据 | 真实历史数据 | 算法生成数据 |

---

## 🎮 组件交互测试

### 1. 交易对切换

**步骤**:
1. 点击 **MarketInfo** 组件的交易对选择器
2. 在下拉列表中选择不同的交易对 (如 ETH-PERP)
3. 观察所有组件变化

**预期结果**:
- [ ] MarketInfo 显示新交易对信息
- [ ] TradingChart 切换到新交易对K线
- [ ] OrderBook 显示新交易对深度
- [ ] RecentTrades 清空并显示新数据
- [ ] TradeForm 更新交易对名称
- [ ] 所有组件重新订阅 WebSocket

**Console 输出**:
```javascript
Unsubscribed from ticker:BTC/USDC
Unsubscribed from orderbook:BTC/USDC
Unsubscribed from trades:BTC/USDC
Subscribed to ticker:ETH-PERP
Subscribed to orderbook:ETH-PERP
Subscribed to trades:ETH-PERP
```

### 2. K线时间周期切换

**步骤**:
1. 在 TradingChart 组件上方找到时间周期按钮
2. 点击不同的时间周期: `1m`, `5m`, `15m`, `1H`, `4H`, `1D`, `1W`
3. 观察图表变化

**预期结果**:
- [ ] K线图自动刷新
- [ ] 时间轴缩放相应改变
- [ ] 选中的按钮高亮显示
- [ ] K线数量适应时间周期

### 3. 订单簿精度切换

**步骤**:
1. 在 OrderBook 组件右上角找到精度选择器
2. 点击切换精度 (0.01, 0.1, 1, 10)

**预期结果**:
- [ ] 价格精度改变
- [ ] 订单簿重新聚合
- [ ] 深度条重新计算

### 4. 下单表单交互

**步骤**:
1. 在 TradeForm 组件中输入数量
2. 选择订单类型 (Market/Limit)
3. 如果是 Limit，输入价格
4. 点击 Buy Long 或 Sell/Short 按钮

**预期结果**:

**未登录状态**:
- [ ] 提示需要登录
- [ ] 跳转到登录页面

**已登录状态**:
- [ ] 显示订单确认
- [ ] 显示预估成本
- [ ] 显示手续费
- [ ] 点击确认后提交订单

### 5. 持仓操作

**步骤** (需要有持仓):
1. 在 PositionsPanel → Positions 标签
2. 找到某个持仓
3. 点击 "Close" 按钮

**预期结果**:
- [ ] 弹出确认对话框
- [ ] 确认后发送平仓请求
- [ ] 持仓列表更新
- [ ] 显示成功/失败消息

---

## 📱 响应式布局测试

### 桌面端 (> 1024px)

**布局**:
```
┌──────────────────────────────────────────┐
│  Navbar                                   │
├──────────────────────────────────────────┤
│  MarketInfo                               │
├─────────────┬─────────┬──────────────────┤
│             │OrderBook│  TradeForm        │
│   Chart     ├─────────┼──────────────────┤
│             │ Trades  │  AccountEquity    │
├─────────────┴─────────┴──────────────────┤
│  PositionsPanel                           │
└──────────────────────────────────────────┘
```

**测试**:
- [ ] 4列网格布局正确
- [ ] 所有组件可见
- [ ] 组件高度合理
- [ ] 滚动条仅在需要时出现

### 平板端 (768px - 1024px)

**打开设备模拟**: F12 → Device Toolbar → iPad

**布局**:
```
┌─────────────────────────────┐
│  Navbar                      │
├─────────────────────────────┤
│  MarketInfo                  │
├──────────────┬──────────────┤
│   Chart      │   Chart      │
├──────────────┼──────────────┤
│  OrderBook   │  TradeForm   │
├──────────────┴──────────────┤
│  PositionsPanel              │
└─────────────────────────────┘
```

**测试**:
- [ ] 2列网格布局
- [ ] 组件自适应宽度
- [ ] 图表高度合适
- [ ] 文字大小可读

### 移动端 (< 768px)

**打开设备模拟**: F12 → Device Toolbar → iPhone

**标签页**:
```
[ Chart ] [ Trade ] [ Book ] [ Trades ] [ Account ] [ Positions ]
```

**测试每个标签**:

**Chart 标签**:
- [ ] K线图全屏显示
- [ ] 高度适中 (400px)
- [ ] 可以缩放和拖动

**Trade 标签**:
- [ ] 下单表单完整显示
- [ ] 按钮大小适合手指点击
- [ ] 输入框易于操作

**Book 标签**:
- [ ] 订单簿完整显示
- [ ] 买卖盘分开清晰
- [ ] 价格和数量可读

**Trades 标签**:
- [ ] 成交记录滚动流畅
- [ ] 颜色区分明显
- [ ] 时间显示完整

**Account 标签**:
- [ ] 账户信息完整
- [ ] 数字格式清晰
- [ ] 操作按钮可用

**Positions 标签**:
- [ ] 持仓表格横向滚动
- [ ] 所有列显示正常
- [ ] 操作按钮可点击

---

## 👤 账户功能测试

### 1. 登录流程

**Google OAuth 登录**:

**步骤**:
1. 点击右上角 "Login" 按钮
2. 选择 "Continue with Google"
3. 选择 Google 账号
4. 授权应用

**预期结果**:
- [ ] 跳转到 Google 登录页面
- [ ] 授权后跳转回应用
- [ ] 显示用户头像/邮箱
- [ ] "Login" 变为用户名或头像

### 2. 账户余额

**步骤**:
登录后，查看 TradeForm 和 AccountEquity 组件

**TradeForm**:
```
Available Balance: $10,000.00 USDC
```

**AccountEquity**:
```
Total Equity         $10,234.56
Available Balance    $8,000.00
Margin Used          $2,234.56
```

**测试**:
- [ ] 余额数据加载正确
- [ ] 数字格式化正确
- [ ] 实时更新

### 3. 持仓管理

**PositionsPanel → Positions 标签**

**测试持仓显示**:
```
Symbol    Side   Size    Entry     Mark      PnL
BTC-PERP  LONG   0.5     97000     97500     +$250.00
```

- [ ] 显示所有持仓
- [ ] 盈亏计算正确
- [ ] 颜色标识（盈利绿色，亏损红色）
- [ ] 杠杆倍数显示

**测试平仓功能**:
1. 点击某个持仓的 "Close" 按钮
2. 确认对话框出现
3. 点击确认

**预期**:
- [ ] 发送平仓请求
- [ ] 显示加载状态
- [ ] 成功后更新持仓列表
- [ ] 显示成功提示

### 4. 订单管理

**PositionsPanel → Orders 标签**

**测试订单显示**:
```
Time      Symbol    Type   Side  Price    Amount   Status
14:23:45  BTC-PERP  LIMIT  BUY   97000    0.1      OPEN
```

- [ ] 显示所有未完成订单
- [ ] 订单状态正确
- [ ] 时间格式正确

**测试取消订单**:
1. 点击某个订单的 "Cancel" 按钮
2. 确认对话框出现
3. 点击确认

**预期**:
- [ ] 发送取消请求
- [ ] 订单从列表移除
- [ ] 显示成功提示

### 5. 交易历史

**PositionsPanel → History 标签**

**测试**:
- [ ] 显示历史成交记录
- [ ] 时间倒序排列
- [ ] 显示成交价格、数量、手续费

---

## 🐛 问题排查

### 问题 1: 后端启动失败

**错误信息**:
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**原因**: 端口 3000 已被占用

**解决方法**:

**Linux/Mac**:
```bash
# 查找占用进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者修改端口
# 编辑 backend/.env
PORT=3001
```

**Windows**:
```bash
# 查找占用进程
netstat -ano | findstr :3000

# 杀死进程
taskkill /PID <PID> /F
```

### 问题 2: WebSocket 连接失败

**错误信息**:
```javascript
WebSocket connection to 'ws://localhost:4001' failed
```

**排查步骤**:

1. **检查后端是否运行**
```bash
curl http://localhost:3000/api/health
```

2. **检查 WebSocket 服务器日志**
后端 console 应该有:
```
[INFO] WebSocket service initialized
  - Port: 4001
  - URL: ws://localhost:4001
```

3. **检查防火墙**
```bash
# Linux
sudo ufw allow 4001

# Windows
# 防火墙 → 高级设置 → 入站规则 → 新建规则 → 端口 4001
```

4. **检查前端 WebSocket URL**
```javascript
// frontend/src/services/websocket.ts
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4001'
```

### 问题 3: 前端白屏

**排查步骤**:

1. **检查 Console 错误**
F12 → Console 标签

**常见错误**:

**CORS 错误**:
```
Access to fetch at 'http://localhost:3000/api/...'
has been blocked by CORS policy
```

**解决**: 确保后端 CORS 配置正确
```javascript
// backend/src/app.ts
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

**模块未找到**:
```
Failed to resolve module '@/components/...'
```

**解决**:
```bash
cd frontend
npm install
```

2. **检查网络请求**
F12 → Network 标签

**API 请求失败 (404)**:
- 检查后端是否运行
- 检查 API 端点路径

**API 请求失败 (500)**:
- 检查后端 console 错误
- 检查数据库连接

### 问题 4: Hyperliquid 数据获取失败

**警告信息**:
```javascript
Failed to fetch Hyperliquid ticker, using fallback
```

**原因**:
1. Hyperliquid API 暂时不可用
2. 网络问题
3. 符号格式错误
4. API 限流

**解决**:
- 系统会自动降级到模拟数据
- 检查网络连接
- 稍后重试

**验证 Hyperliquid 连接**:
```bash
# 后端 console 查看
[INFO] Hyperliquid client initialized
[INFO] Fetched real-time data from Hyperliquid for BTC
```

### 问题 5: 数据库连接错误

**错误信息**:
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解决**:

1. **检查 MySQL 是否运行**
```bash
# Linux
sudo systemctl status mysql

# Mac
brew services list

# Windows
net start MySQL80
```

2. **检查 .env 配置**
```bash
# backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hyperliquid
```

3. **初始化数据库**
```bash
cd backend
npm run db:init
```

4. **测试连接**
```bash
mysql -u root -p -h localhost
```

### 问题 6: 图表不显示

**原因**: TradingView 脚本加载失败

**排查**:

1. **检查网络**
F12 → Network → 搜索 "tradingview"

2. **检查 CSP 设置**
确保没有 Content Security Policy 阻止

3. **清除缓存**
Ctrl+Shift+R 强制刷新

### 问题 7: 样式错乱

**原因**: Tailwind CSS 未正确加载

**解决**:
```bash
cd frontend
npm install
npm run dev
```

**检查 tailwind.config.js**:
```javascript
content: [
  "./index.html",
  "./src/**/*.{vue,js,ts,jsx,tsx}",
],
```

---

## 🧪 API 测试命令

### 使用 cURL 测试

#### 市场数据 API

**获取交易对列表**:
```bash
curl http://localhost:3000/api/market/pairs
```

**获取行情数据**:
```bash
curl http://localhost:3000/api/market/ticker/BTC-PERP
```

**获取订单簿**:
```bash
curl http://localhost:3000/api/market/orderbook/BTC-PERP
```

**获取K线数据**:
```bash
curl "http://localhost:3000/api/market/klines/BTC-PERP?interval=1h&limit=100"
```

**获取资金费率**:
```bash
curl http://localhost:3000/api/market/funding/BTC-PERP
```

#### 账户 API (需要认证)

**获取余额**:
```bash
curl http://localhost:3000/api/account/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**获取持仓**:
```bash
curl http://localhost:3000/api/account/positions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**获取订单**:
```bash
curl http://localhost:3000/api/trading/orders/open \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 使用 wscat 测试 WebSocket

**安装 wscat**:
```bash
npm install -g wscat
```

**连接 WebSocket**:
```bash
wscat -c ws://localhost:4001
```

**订阅频道**:
```json
{"action":"subscribe","channel":"ticker:BTC/USDC"}
```

**应该收到**:
```json
{
  "type": "subscribed",
  "channel": "ticker:BTC/USDC",
  "timestamp": 1234567890
}
```

**接收实时数据**:
```json
{
  "channel": "ticker:BTC/USDC",
  "data": {
    "symbol": "BTC/USDC",
    "lastPrice": "97234.56",
    ...
  },
  "timestamp": 1234567891
}
```

**取消订阅**:
```json
{"action":"unsubscribe","channel":"ticker:BTC/USDC"}
```

---

## ✅ 测试结果示例

### 成功的测试结果

**Console 输出**:
```
✓ WebSocket connected for OrderBook
✓ WebSocket connected for MarketInfo
✓ WebSocket connected for PositionsPanel
✓ WebSocket connected for RecentTrades
✓ WebSocket connected for AccountEquity

✓ Subscribed to orderbook:BTC/USDC
✓ Subscribed to ticker:BTC/USDC
✓ Subscribed to trades:BTC/USDC
✓ Subscribed to user positions and orders

✓ Fetched real-time data from Hyperliquid for BTC
✓ OrderBook updated via WebSocket: 20 levels
✓ Positions updated via WebSocket: 1
✓ Orders updated via WebSocket: 2
```

**页面显示**:
```
┌────────────────────────────────────────┐
│ BTC-PERP  $97,234.56  +$1,234  +1.29%  │ ← 实时更新
├────────────────────────────────────────┤
│ 订单簿价格持续滚动更新 ● (绿点)        │
│ 成交记录不断出现新数据 ● (绿点)        │
│ 账户权益实时计算       ● (绿点)        │
└────────────────────────────────────────┘
```

---

## 📊 性能测试

### 页面加载性能

**Lighthouse 测试**:
1. F12 → Lighthouse 标签
2. 选择 Performance
3. 点击 "Analyze page load"

**目标指标**:
- Performance: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s

### WebSocket 性能

**消息延迟测试**:
```javascript
// Console 中运行
let lastTimestamp = Date.now()
websocketService.subscribe('ticker:BTC/USDC', (data) => {
  const now = Date.now()
  console.log('Latency:', now - lastTimestamp, 'ms')
  lastTimestamp = now
})

// 预期: < 100ms
```

### API 响应时间

**测试脚本**:
```bash
# 测试 10 次请求的平均响应时间
for i in {1..10}; do
  curl -w "\nTime: %{time_total}s\n" \
    -o /dev/null -s \
    http://localhost:3000/api/market/ticker/BTC-PERP
done
```

**目标**: < 200ms

---

## 📝 测试报告模板

### 测试环境

- **日期**: 2025-01-XX
- **测试人**: XXX
- **浏览器**: Chrome 120.x
- **后端版本**: Git commit XXXXXXX
- **前端版本**: Git commit XXXXXXX

### 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 后端启动 | ✅ | 正常 |
| 前端启动 | ✅ | 正常 |
| WebSocket 连接 | ✅ | 5个频道全部连接 |
| Hyperliquid 数据 | ✅ | 真实数据正常 |
| 页面布局 | ✅ | 桌面/平板/移动端正常 |
| 组件交互 | ✅ | 所有交互正常 |
| 账户功能 | ⚠️ | 登录正常，交易待测 |
| 性能指标 | ✅ | Lighthouse 92分 |

### 发现的问题

1. **问题描述**: XXX
   - **严重程度**: 高/中/低
   - **复现步骤**: 1. 2. 3.
   - **预期结果**: XXX
   - **实际结果**: XXX
   - **解决方案**: XXX

### 总结

- **通过率**: 95%
- **阻塞问题**: 0
- **建议**: XXX

---

## 🎯 下一步

测试完成后，根据结果：

### ✅ 测试通过
- [ ] 更新文档
- [ ] 准备演示
- [ ] 部署到测试环境

### ❌ 发现问题
- [ ] 记录问题到 Issue
- [ ] 修复问题
- [ ] 重新测试

### 💡 改进建议
- [ ] 性能优化
- [ ] UI/UX 改进
- [ ] 功能增强

---

## 📞 需要帮助？

如果测试过程中遇到问题：

1. **检查日志**: 后端 console 和浏览器 Console
2. **查看文档**: 参考 README.md 和其他文档
3. **搜索 Issue**: 检查 GitHub Issues
4. **创建 Issue**: 详细描述问题和复现步骤

---

**测试愉快！** 🚀
