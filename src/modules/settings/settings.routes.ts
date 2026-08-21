import { Router } from 'express'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'
import { settingsController } from './settings.controller.js'
export const settingsRouter = Router(); settingsRouter.use(authMiddleware); settingsRouter.get('/', settingsController.get); settingsRouter.put('/', settingsController.update)
