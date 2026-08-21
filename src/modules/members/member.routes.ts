import { Router } from 'express'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'
import { memberController } from './member.controller.js'
import { paymentController } from '../payments/payment.controller.js'
import { attendanceController } from '../attendance/attendance.controller.js'
export const memberRouter = Router(); memberRouter.use(authMiddleware); memberRouter.get('/', memberController.list); memberRouter.get('/:id', memberController.get); memberRouter.post('/', memberController.create); memberRouter.put('/:id', memberController.update); memberRouter.delete('/:id', memberController.remove); memberRouter.get('/:memberId/payments', paymentController.listByMember); memberRouter.get('/:memberId/attendance', attendanceController.listByMember)
