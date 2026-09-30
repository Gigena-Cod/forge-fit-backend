import { Router } from 'express'
import { authMiddleware, requirePermission } from '../../shared/middleware/auth.middleware.js'
import { attendanceController } from './attendance.controller.js'
export const attendanceRouter = Router(); attendanceRouter.use(authMiddleware); attendanceRouter.get('/', requirePermission('attendance:read'), attendanceController.list); attendanceRouter.post('/check-in', requirePermission('attendance:check-in'), attendanceController.checkIn)
