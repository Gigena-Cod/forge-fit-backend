import { Router } from 'express'
import { authMiddleware, requirePermission } from '../../shared/middleware/auth.middleware.js'
import { permissions, roles } from '../../shared/domain/permissions.js'

export const roleRouter = Router()
roleRouter.use(authMiddleware)
roleRouter.get('/', requirePermission('roles:read'), (_req, res) => {
  res.json({ data: roles.map(code => ({ code, permissions: permissions[code] })) })
})
