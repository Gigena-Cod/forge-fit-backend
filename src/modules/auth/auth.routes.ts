import { Router } from 'express'
import { authMiddleware, requireTrustedOrigin } from '../../shared/middleware/auth.middleware.js'
import { authController } from './auth.controller.js'
export const authRouter = Router(); authRouter.post('/register', requireTrustedOrigin, authController.register); authRouter.post('/login', requireTrustedOrigin, authController.login); authRouter.post('/refresh', requireTrustedOrigin, authController.refresh); authRouter.post('/logout', requireTrustedOrigin, authController.logout); authRouter.get('/me', authMiddleware, authController.me)
