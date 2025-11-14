import { Request, Response } from 'express'
import { AuthService } from '../services/AuthService'
import { sendSuccess } from '../utils/response'
import { asyncHandler } from '../middleware/errorHandler'
import logger from '../utils/logger'

/**
 * Auth Controller - Handle authentication operations
 */
export class AuthController {
  /**
   * POST /api/auth/login
   * Login or register with wallet signature
   */
  static loginWithWallet = asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress, signature, message } = req.body

    if (!walletAddress || !signature || !message) {
      throw new Error('Wallet address, signature, and message are required')
    }

    const result = await AuthService.loginWithWallet(
      walletAddress,
      signature,
      message
    )

    sendSuccess(res, result)
  })

  /**
   * GET /api/auth/profile
   * Get user profile (requires authentication)
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const profile = await AuthService.getProfile(userId)
    sendSuccess(res, profile)
  })

  /**
   * PUT /api/auth/email
   * Update user email (requires authentication)
   */
  static updateEmail = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { email } = req.body
    if (!email) {
      throw new Error('Email is required')
    }

    await AuthService.updateEmail(userId, email)

    sendSuccess(res, { message: 'Email updated successfully' })
  })

  /**
   * POST /api/auth/verify
   * Verify signature (public endpoint for testing)
   */
  static verifySignature = asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress, signature, message } = req.body

    if (!walletAddress || !signature || !message) {
      throw new Error('Wallet address, signature, and message are required')
    }

    const isValid = await AuthService.verifyWalletSignature(
      walletAddress,
      message,
      signature
    )

    sendSuccess(res, { valid: isValid })
  })

  /**
   * GET /api/auth/challenge
   * Get authentication challenge message
   */
  static getChallenge = asyncHandler(async (req: Request, res: Response) => {
    const timestamp = Date.now()
    const message = `Sign this message to authenticate with Hyperliquid Clone.\n\nTimestamp: ${timestamp}`

    sendSuccess(res, {
      message,
      timestamp,
    })
  })

  /**
   * POST /api/auth/google
   * Login with Google OAuth token (popup mode)
   */
  static loginWithGoogle = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body

    if (!token) {
      throw new Error('Google token is required')
    }

    const result = await AuthService.loginWithGoogle(token)
    sendSuccess(res, result)
  })

  /**
   * GET /api/auth/google/callback
   * Handle Google OAuth callback with authorization code (redirect mode)
   * Google will redirect here with code in query params
   */
  static googleCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query

    if (!code) {
      // Redirect to frontend with error
      const frontendUrl = state || process.env.CORS_ORIGIN || 'http://localhost:5173'
      return res.redirect(`${frontendUrl}/login?error=no_code`)
    }

    try {
      // Exchange code for tokens (redirect_uri must match what was sent to Google)
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`

      logger.info('Google OAuth callback', {
        code: code ? 'received' : 'missing',
        redirectUri,
        protocol: req.protocol,
        host: req.get('host')
      })

      const result = await AuthService.loginWithGoogleCode(code as string, redirectUri)

      // Redirect to frontend with token in URL (or use cookie)
      const frontendUrl = state || process.env.CORS_ORIGIN || 'http://localhost:5173'

      // Option 1: Pass token in URL hash (not query to avoid server logs)
      res.redirect(`${frontendUrl}/auth/callback#token=${result.token.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`)

      // Option 2: Set httpOnly cookie and redirect (more secure, but needs CORS setup)
      // res.cookie('auth_token', result.token.token, { httpOnly: true, secure: false })
      // res.redirect(`${frontendUrl}/trade`)
    } catch (error: any) {
      logger.error('Google callback error', { error: error.message })
      const frontendUrl = state || process.env.CORS_ORIGIN || 'http://localhost:5173'
      res.redirect(`${frontendUrl}/login?error=auth_failed`)
    }
  })
}
