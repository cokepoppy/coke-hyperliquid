# Hyperliquid Clone - 功能清单

## ✅ 已完成功能

### 1. 📊 图表集成 (ECharts)
- ✅ K线图（蜡烛图）显示
- ✅ 折线图模式切换
- ✅ 成交量显示
- ✅ 多时间周期支持 (1m, 5m, 15m, 1H, 4H, 1D, 1W)
- ✅ 交互式工具提示
- ✅ 响应式图表自适应
- ✅ 深色主题优化

**使用方式：**
```typescript
import TradingChart from '@/components/trading/TradingChart.vue'

// 在组件中使用
<TradingChart symbol="BTC/USDC" />
```

### 2. 🔌 WebSocket 实时连接
- ✅ WebSocket 连接管理
- ✅ 自动重连机制（最多5次）
- ✅ 频道订阅/取消订阅
- ✅ 消息处理和分发
- ✅ 连接状态监控

**使用方式：**
```typescript
import { useMarketData } from '@/composables/useMarketData'

const { subscribeToTicker, subscribeToOrderBook } = useMarketData()

// 订阅行情
const unsubscribe = subscribeToTicker('BTC/USDC')

// 取消订阅
unsubscribe()
```

**WebSocket 消息格式：**
```typescript
// 订阅
{
  "method": "subscribe",
  "params": {
    "channel": "ticker.BTC/USDC"
  }
}

// 服务端推送
{
  "channel": "ticker.BTC/USDC",
  "data": {
    "lastPrice": "50000.00",
    "change24h": "+2.5%",
    ...
  }
}
```

### 3. 💼 MetaMask 钱包集成
- ✅ 钱包连接/断开
- ✅ 自动检测已连接的钱包
- ✅ 账户切换监听
- ✅ 网络切换提示
- ✅ 消息签名功能
- ✅ 余额查询
- ✅ 错误处理

**使用方式：**
```typescript
import { useWallet } from '@/composables/useWallet'

const {
  isConnected,
  address,
  connect,
  disconnect,
  signMessage
} = useWallet()

// 连接钱包
await connect()

// 签名消息
const signature = await signMessage('Hello World')
```

**组件使用：**
```vue
<template>
  <WalletConnect />
</template>

<script setup>
import WalletConnect from '@/components/common/WalletConnect.vue'
</script>
```

### 4. 🔗 API 服务层
完整的 REST API 封装，包含以下模块：

#### 市场数据 API
```typescript
import { marketApi } from '@/utils/api'

// 获取所有交易对
const pairs = await marketApi.getTradingPairs()

// 获取行情
const ticker = await marketApi.getTicker('BTC/USDC')

// 获取订单簿
const orderbook = await marketApi.getOrderBook('BTC/USDC', 20)

// 获取最近成交
const trades = await marketApi.getRecentTrades('BTC/USDC', 50)

// 获取K线数据
const klines = await marketApi.getKlines('BTC/USDC', '1H', 500)
```

#### 交易 API
```typescript
import { tradingApi } from '@/utils/api'

// 创建订单
const order = await tradingApi.createOrder({
  symbol: 'BTC/USDC',
  side: 'BUY',
  type: 'LIMIT',
  price: '50000',
  quantity: '0.1',
  signature: '0x...'
})

// 取消订单
await tradingApi.cancelOrder('ORDER_ID')

// 批量取消
await tradingApi.cancelAllOrders('BTC/USDC')

// 获取活跃订单
const openOrders = await tradingApi.getOpenOrders()

// 设置杠杆
await tradingApi.setLeverage('BTC-PERP', 10)
```

#### 账户 API
```typescript
import { accountApi } from '@/utils/api'

// 获取余额
const balance = await accountApi.getBalance()

// 获取持仓
const positions = await accountApi.getPositions()

// 平仓
await accountApi.closePosition('BTC-PERP', 'LONG')

// 获取交易历史
const history = await accountApi.getTradeHistory()
```

#### API 配置
在 `.env` 文件中配置：
```bash
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

#### 自动Token管理
API客户端自动处理：
- ✅ JWT Token 添加到请求头
- ✅ 401 自动跳转登录
- ✅ 请求/响应拦截器
- ✅ 错误统一处理

### 5. 📱 响应式移动端布局

#### 桌面端 (lg: ≥1024px)
- 三列网格布局
- 图表占据左侧2列
- 右侧显示订单簿和交易表单
- 底部显示持仓/订单面板

#### 平板端 (md: 768px - 1023px)
- 两列网格布局
- 图表占据全宽
- 订单簿和交易表单并排显示
- 底部显示持仓/订单面板

#### 移动端 (<768px)
- 标签页切换布局
- Chart / Trade / Book / Positions 四个标签
- 每次只显示一个视图
- 优化触摸交互

**响应式断点：**
```css
/* Tailwind 断点 */
sm: 640px   /* 小屏手机 */
md: 768px   /* 平板 */
lg: 1024px  /* 桌面 */
xl: 1280px  /* 大屏 */
2xl: 1536px /* 超大屏 */
```

## 📦 组件清单

### 布局组件
- `Navbar.vue` - 顶部导航栏
- `WalletConnect.vue` - 钱包连接按钮

### 交易组件
- `MarketInfo.vue` - 交易对信息栏
- `TradingChart.vue` - K线图表
- `OrderBook.vue` - 订单簿
- `TradeForm.vue` - 交易表单
- `PositionsPanel.vue` - 持仓/订单面板

### Composables
- `useWebSocket.ts` - WebSocket 连接管理
- `useMarketData.ts` - 市场数据订阅
- `useWallet.ts` - 钱包功能

### Stores (Pinia)
- `market.ts` - 市场数据状态
- `trading.ts` - 交易数据状态
- `auth.ts` - 认证状态

## 🎨 样式系统

### Tailwind 自定义颜色
```javascript
colors: {
  'bg-primary': '#0f1a1f',
  'bg-secondary': '#1b2429',
  'bg-tertiary': '#303030',
  'text-primary': '#f6fefd',
  'text-secondary': '#949e9c',
  'buy': '#1fa67d',
  'sell': '#f24a67',
  'accent-primary': '#50d2c1',
}
```

### 自定义 CSS 类
```css
.btn-buy      /* 买入按钮 */
.btn-sell     /* 卖出按钮 */
.card         /* 卡片容器 */
.input-field  /* 输入框 */
.price-up     /* 上涨价格 */
.price-down   /* 下跌价格 */
.mono-number  /* 等宽数字 */
```

## 🚀 启动项目

### 安装依赖
```bash
cd frontend
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:3000

### 生产构建
```bash
npm run build
npm run preview
```

## 🔧 环境配置

复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

编辑配置：
```bash
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
VITE_CHAIN_ID=42161
VITE_CHAIN_NAME=Arbitrum One
```

## 📝 TypeScript 类型支持

完整的类型定义：
- `types/market.ts` - 市场数据类型
- `types/trading.ts` - 交易相关类型
- 全局类型声明
- 组件 Props 类型

## 🎯 下一步开发建议

1. **实时数据集成**
   - 连接真实的 WebSocket 服务
   - 实现心跳保活机制
   - 数据去重和合并

2. **订单签名**
   - EIP-712 消息签名
   - 订单验证流程
   - Nonce 管理

3. **高级功能**
   - 止盈止损订单
   - 条件单
   - 批量下单
   - 一键平仓

4. **性能优化**
   - 虚拟滚动（大量订单）
   - 数据缓存策略
   - 组件懒加载
   - 代码分割

5. **用户体验**
   - 加载骨架屏
   - 错误边界
   - 离线提示
   - 操作确认

## 📖 相关文档

- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [ECharts 文档](https://echarts.apache.org/)
- [ethers.js 文档](https://docs.ethers.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
