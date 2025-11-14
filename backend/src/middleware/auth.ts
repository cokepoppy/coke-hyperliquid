import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config'
import { UserModel } from '../models/User'
import { createError } from '../utils/response'
import { asyncHandler } from './errorHandler'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        walletAddress?: string
      }
    }
  }
}

/**
 * JWT Authentication Middleware
 */
export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError.unauthorized('No token provided')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: number
        walletAddress?: string
      }

      // Get user from database
      const user = await UserModel.findById(decoded.userId)

      if (!user) {
        throw createError.unauthorized('User not found')
      }

      // Attach user to request
      req.user = {
        id: user.id,
        walletAddress: user.walletAddress || undefined,
      }

      next()
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        throw createError.unauthorized('Invalid token')
      }
      if (error.name === 'TokenExpiredError') {
        throw createError.unauthorized('Token expired')
      }
      throw error
    }
  }
)

/**
 * Optional authentication - sets user if token is valid, but doesn't require it
 */
export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: number
        walletAddress?: string
      }

      const user = await UserModel.findById(decoded.userId)

      if (user) {
        req.user = {
          id: user.id,
          walletAddress: user.walletAddress || undefined,
        }
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next()
  }
)

/**
 * Generate JWT token for user
 */
export function generateToken(userId: number, identifier: string): string {
  const payload = { userId, walletAddress: identifier }
  const secret = config.jwt.secret
  return jwt.sign(payload, secret, { expiresIn: '7d' } as any)
}
