import { Router } from 'express'
import { authMiddleware, requirePermission } from '../../shared/middleware/auth.middleware.js'
import { paymentController } from './payment.controller.js'
export const paymentRouter = Router(); paymentRouter.use(authMiddleware); paymentRouter.get('/', requirePermission('payments:read'), paymentController.list); paymentRouter.get('/:id', requirePermission('payments:read'), paymentController.get); paymentRouter.post('/', requirePermission('payments:write'), paymentController.create); paymentRouter.put('/:id', requirePermission('payments:write'), paymentController.update); paymentRouter.delete('/:id', requirePermission('payments:void'), paymentController.remove)
