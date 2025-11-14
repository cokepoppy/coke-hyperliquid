import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * Auth Routes
 */

// Public routes
router.post('/login', AuthController.loginWithWallet)
router.post('/google', AuthController.loginWithGoogle)
router.get('/google/callback', AuthController.googleCallback) // Google 回调使用 GET
router.post('/verify', AuthController.verifySignature)
router.get('/challenge', AuthController.getChallenge)

// Protected routes (require authentication)
router.get('/profile', authenticate, AuthController.getProfile)
router.put('/email', authenticate, AuthController.updateEmail)

export default router
