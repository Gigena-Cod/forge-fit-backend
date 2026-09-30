import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { UserModel } from '../../modules/auth/user.model.js'
import { AppError } from '../errors/AppError.js'
import { hasPermission, type Permission } from '../domain/permissions.js'

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) throw new AppError('UNAUTHORIZED', 401, 'Authentication required')
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; gymId: string; role: string; authVersion?: number }
    if (!payload.userId || !payload.gymId || !payload.role) throw new AppError('UNAUTHORIZED', 401, 'Invalid token')
    const user = await UserModel.findOne({ _id: payload.userId, gymId: payload.gymId }).select('role accountStatus authVersion').lean()
    if (!user || user.accountStatus !== 'ACTIVE' || (payload.authVersion ?? 0) !== user.authVersion) throw new AppError('UNAUTHORIZED', 401, 'Invalid token')
    req.auth = { ...payload, role: user.role }
    next()
  } catch (error) { next(error instanceof AppError ? error : new AppError('UNAUTHORIZED', 401, 'Invalid token')) }
}

export const requirePermission = (...required: Permission[]): RequestHandler => (req, _res, next) => {
  if (!req.auth || !required.every(permission => hasPermission(req.auth!.role, permission))) return next(new AppError('FORBIDDEN', 403, 'Insufficient permissions'))
  next()
}
