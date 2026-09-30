import { Router } from 'express'
import { authMiddleware, requirePermission } from '../../shared/middleware/auth.middleware.js'
import { userController } from './user.controller.js'
export const userRouter=Router(); userRouter.use(authMiddleware); userRouter.get('/',requirePermission('users:read'),userController.list); userRouter.get('/:id',requirePermission('users:read'),userController.get); userRouter.post('/',requirePermission('users:write'),userController.create); userRouter.patch('/:id',requirePermission('users:write'),userController.update)
