import { Router } from 'express'
import { authMiddleware, requirePermission } from '../../shared/middleware/auth.middleware.js'
import { settingsController } from './settings.controller.js'
export const settingsRouter = Router(); settingsRouter.use(authMiddleware); settingsRouter.get('/', requirePermission('settings:write'), settingsController.get); settingsRouter.put('/', requirePermission('settings:write'), settingsController.update)
