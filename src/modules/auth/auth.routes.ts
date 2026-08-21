import { Router } from 'express'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'
import { authController } from './auth.controller.js'
export const authRouter = Router(); authRouter.post('/register', authController.register); authRouter.post('/login', authController.login); authRouter.get('/me', authMiddleware, authController.me)
