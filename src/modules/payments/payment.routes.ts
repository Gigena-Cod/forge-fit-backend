import { Router } from 'express'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'
import { paymentController } from './payment.controller.js'
export const paymentRouter = Router(); paymentRouter.use(authMiddleware); paymentRouter.get('/', paymentController.list); paymentRouter.get('/:id', paymentController.get); paymentRouter.post('/', paymentController.create); paymentRouter.put('/:id', paymentController.update); paymentRouter.delete('/:id', paymentController.remove)
