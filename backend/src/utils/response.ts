import { Response } from 'express'
import { ApiResponse, ApiError, ErrorCode } from '../types'

/**
 * Send successful API response
 */
export const sendSuccess = <T>(res: Response, data: T, statusCode: number = 200): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: Date.now(),
  }
  return res.status(statusCode).json(response)
}

/**
 * Send error API response
 */
export const sendError = (
  res: Response,
  error: ApiError | Error,
  statusCode?: number
): Response => {
  if (error instanceof ApiError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: Date.now(),
    }
    return res.status(error.statusCode).json(response)
  }

  // Generic error
  const response: ApiResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message || 'Internal server error',
    },
    timestamp: Date.now(),
  }
  return res.status(statusCode || 500).json(response)
}

/**
 * Create API error shortcuts
 */
export const createError = {
  badRequest: (message: string, details?: any) =>
    new ApiError(ErrorCode.INVALID_REQUEST, message, 400, details),

  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(ErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message: string = 'Forbidden') =>
    new ApiError(ErrorCode.FORBIDDEN, message, 403),

  notFound: (message: string = 'Resource not found') =>
    new ApiError(ErrorCode.NOT_FOUND, message, 404),

  invalidSignature: (message: string = 'Invalid signature') =>
    new ApiError(ErrorCode.INVALID_SIGNATURE, message, 401),

  insufficientBalance: (message: string = 'Insufficient balance') =>
    new ApiError(ErrorCode.INSUFFICIENT_BALANCE, message, 400),

  invalidOrder: (message: string, details?: any) =>
    new ApiError(ErrorCode.INVALID_ORDER, message, 400, details),

  marketNotFound: (symbol: string) =>
    new ApiError(ErrorCode.MARKET_NOT_FOUND, `Market ${symbol} not found`, 404),

  rateLimitExceeded: (message: string = 'Rate limit exceeded') =>
    new ApiError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429),

  internal: (message: string = 'Internal server error', details?: any) =>
    new ApiError(ErrorCode.INTERNAL_ERROR, message, 500, details),
}
