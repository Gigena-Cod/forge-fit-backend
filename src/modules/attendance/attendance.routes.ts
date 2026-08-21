import { Router } from 'express'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'
import { attendanceController } from './attendance.controller.js'
export const attendanceRouter = Router(); attendanceRouter.use(authMiddleware); attendanceRouter.get('/', attendanceController.list)
