import { Request, Response, NextFunction } from 'express'
import { ApiError, ErrorCode } from '../types'
import { sendError } from '../utils/response'
import logger from '../utils/logger'

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  })

  // Send error response
  sendError(res, err)
}

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new ApiError(
    ErrorCode.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    404
  )
  sendError(res, error)
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
