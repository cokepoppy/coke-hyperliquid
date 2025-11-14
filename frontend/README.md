# Hyperliquid Clone - Frontend

A modern cryptocurrency trading platform built with Vue 3, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern UI**: Clean and responsive design inspired by Hyperliquid
- 📊 **Trading Interface**: Complete trading view with chart, order book, and order form
- 📈 **Real-time Updates**: WebSocket support for live market data
- 💼 **Portfolio Management**: Track positions, orders, and trading history
- 🔐 **Wallet Integration**: Connect with MetaMask and other Web3 wallets

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - State management
- **Vite** - Next generation frontend tooling
- **ethers.js** - Ethereum wallet integration

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, styles
│   ├── components/     # Vue components
│   │   ├── common/     # Reusable components
│   │   ├── layout/     # Layout components (Navbar, etc.)
│   │   └── trading/    # Trading-specific components
│   ├── composables/    # Vue composables
│   ├── router/         # Vue Router configuration
│   ├── stores/         # Pinia stores
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── views/          # Page components
│   ├── App.vue         # Root component
│   └── main.ts         # Application entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Components

### Layout Components
- **Navbar**: Top navigation with wallet connection and menu

### Trading Components
- **MarketInfo**: Symbol selector and market statistics
- **TradingChart**: Price chart (integrate TradingView or ECharts)
- **OrderBook**: Real-time order book with depth visualization
- **TradeForm**: Order placement form with buy/sell options
- **PositionsPanel**: View positions, orders, and trade history

## State Management

Using Pinia for state management:
- **market**: Trading pairs, tickers, order books
- **trading**: Positions, orders, assets
- **auth**: User authentication and wallet connection

## Styling

Custom Tailwind CSS theme with trading-specific colors:
- Buy/Long: Green (#1fa67d)
- Sell/Short: Red (#f24a67)
- Accent: Cyan (#50d2c1)
- Dark theme optimized for trading

## Development

### Adding New Components

1. Create component in appropriate directory
2. Define TypeScript interfaces in `types/`
3. Add component to view or parent component
4. Use Tailwind CSS for styling

### State Management

```typescript
import { useMarketStore } from '@/stores/market'

const marketStore = useMarketStore()
marketStore.setCurrentSymbol('BTC/USDC')
```

### API Integration

Create API services in `utils/api/` directory:

```typescript
import axios from 'axios'

export const marketApi = {
  getTicker: (symbol: string) => axios.get(`/api/market/ticker/${symbol}`),
  getOrderBook: (symbol: string) => axios.get(`/api/market/orderbook/${symbol}`),
}
```

## TODO

- [ ] Integrate TradingView charting library
- [ ] Implement WebSocket connections for real-time data
- [ ] Add wallet connection (MetaMask, WalletConnect)
- [ ] Implement order placement API calls
- [ ] Add responsive mobile layout
- [ ] Implement dark/light theme toggle
- [ ] Add more trading pair types (futures, options)
- [ ] Implement advanced order types
- [ ] Add portfolio analytics
- [ ] Implement user settings and preferences

## License

MIT
