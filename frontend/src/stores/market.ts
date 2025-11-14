import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TradingPair, OrderBook, Ticker } from '@/types/market'

export const useMarketStore = defineStore('market', () => {
  const currentSymbol = ref('BTC/USDC')
  const tradingPairs = ref<TradingPair[]>([])
  const tickers = ref<Record<string, Ticker>>({})
  const orderBooks = ref<Record<string, OrderBook>>({})

  const setCurrentSymbol = (symbol: string) => {
    currentSymbol.value = symbol
  }

  const updateTicker = (symbol: string, ticker: Ticker) => {
    tickers.value[symbol] = ticker
  }

  const updateOrderBook = (symbol: string, orderBook: OrderBook) => {
    orderBooks.value[symbol] = orderBook
  }

  return {
    currentSymbol,
    tradingPairs,
    tickers,
    orderBooks,
    setCurrentSymbol,
    updateTicker,
    updateOrderBook,
  }
})
