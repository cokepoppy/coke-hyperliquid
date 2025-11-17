// Common Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: number
}

// User & Auth Types
export interface User {
  id: number
  walletAddress?: string
  email?: string
  googleId?: string
  name?: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthToken {
  token: string
  expiresIn: string
}

// Trading Pair Types
export type PairType = 'SPOT' | 'PERPETUAL'

export interface TradingPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  type: PairType
  minOrderSize: string
  maxOrderSize: string
  tickSize: string
  status: 'ACTIVE' | 'INACTIVE' | 'DELISTED'
}

// Market Data Types
export interface Ticker {
  symbol: string
  lastPrice: string
  change24h: string
  high24h: string
  low24h: string
  volume24h: string
  quoteVolume24h: string
  openPrice: string
  timestamp: number
  fundingRate?: string
  markPrice?: string
}

export interface OrderBookLevel {
  price: string
  quantity: string
  total: string
}

export interface OrderBook {
  symbol: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  timestamp: number
}

export interface Trade {
  tradeId: string
  symbol: string
  price: string
  quantity: string
  side: 'BUY' | 'SELL'
  timestamp: number
}

export interface Kline {
  timestamp: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
}

// Order Types
export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET'
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED'
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY'

export interface Order {
  orderId: string
  userId: number
  symbol: string
  side: OrderSide
  type: OrderType
  price?: string
  stopPrice?: string
  quantity: string
  filledQuantity: string
  remainingQuantity: string
  status: OrderStatus
  timeInForce: TimeInForce
  reduceOnly: boolean
  postOnly: boolean
  signature: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrderRequest {
  symbol: string
  side: OrderSide
  type: OrderType
  price?: string
  stopPrice?: string
  quantity: string
  timeInForce?: TimeInForce
  reduceOnly?: boolean
  postOnly?: boolean
  signature: string
}

// Position Types
export type PositionSide = 'LONG' | 'SHORT'

export interface Position {
  positionId: string
  userId: number
  symbol: string
  side: PositionSide
  quantity: string
  entryPrice: string
  markPrice: string
  liquidationPrice: string
  leverage: number
  margin: string
  unrealizedPnl: string
  realizedPnl: string
  marginMode: 'CROSS' | 'ISOLATED'
  createdAt: Date
  updatedAt: Date
}

// Account Types
export interface Asset {
  asset: string
  free: string
  locked: string
  total: string
}

export interface Balance {
  totalEquity: string
  availableBalance: string
  usedMargin: string
  unrealizedPnl: string
  assets: Asset[]
}

// WebSocket Types
export interface WsMessage {
  channel: string
  data: any
  timestamp: number
}

export interface WsSubscription {
  method: 'subscribe' | 'unsubscribe'
  params: {
    channel: string
  }
}

// Error Types
export enum ErrorCode {
  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',

  // Auth
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Trading
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_ORDER = 'INVALID_ORDER',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  POSITION_NOT_FOUND = 'POSITION_NOT_FOUND',
  MARKET_NOT_FOUND = 'MARKET_NOT_FOUND',
  ORDER_SIZE_TOO_SMALL = 'ORDER_SIZE_TOO_SMALL',
  ORDER_SIZE_TOO_LARGE = 'ORDER_SIZE_TOO_LARGE',
  INVALID_PRICE = 'INVALID_PRICE',
  LEVERAGE_TOO_HIGH = 'LEVERAGE_TOO_HIGH',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
