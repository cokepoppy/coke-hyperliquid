export interface TradingPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  type: 'PERPETUAL' | 'SPOT'
  lastPrice: string
  change24h: string // Deprecated: use priceChangePercent24h
  priceChange24h?: string // Absolute price change (e.g., "+410.00")
  priceChangePercent24h?: string // Percentage change (e.g., "+0.82")
  volume24h: string
  high24h: string
  low24h: string
  marketCap?: string
}

export interface OrderBookLevel {
  price: string
  quantity: string
  total?: string
}

export interface OrderBook {
  symbol: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  timestamp: number
}

export interface Trade {
  id: string
  symbol: string
  price: string
  quantity: string
  side: 'BUY' | 'SELL'
  timestamp: number
}

export interface Ticker {
  symbol: string
  lastPrice: string
  change24h: string
  changePercent24h: string
  volume24h: string
  high24h: string
  low24h: string
  marketCap?: string
}
