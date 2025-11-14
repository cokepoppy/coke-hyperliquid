export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET'
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED'
export type PositionSide = 'LONG' | 'SHORT'

export interface Order {
  orderId: string
  symbol: string
  side: OrderSide
  type: OrderType
  price?: string
  quantity: string
  filledQuantity: string
  status: OrderStatus
  createdAt: number
  updatedAt: number
}

export interface Position {
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
  marginRatio: string
}

export interface Asset {
  asset: string
  totalBalance: string
  availableBalance: string
  frozenBalance: string
  marginBalance: string
}
