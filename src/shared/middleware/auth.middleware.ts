import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { authRepository } from '../../modules/auth/auth.repository.js'
import { decryptCookie } from '../../modules/auth/session.crypto.js'
import { AppError } from '../errors/AppError.js'
import { hasPermission, type Permission } from '../domain/permissions.js'

const cookies = (header?: string) => Object.fromEntries((header ?? '').split(/;\s*/).filter(Boolean).map(value => { const index = value.indexOf('='); return [value.slice(0, index), value.slice(index + 1)] }))
const allowedOrigin = (req: any) => { const origin = req.header('origin'); if (!origin) return process.env.NODE_ENV !== 'production'; return origin === env.FRONTEND_URL || origin === `${req.protocol}://${req.get('host')}` }
export const requireTrustedOrigin: RequestHandler = (req, _res, next) => allowedOrigin(req) ? next() : next(new AppError('FORBIDDEN', 403, 'Untrusted origin'))

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  const bearer = req.header('authorization')?.replace(/^Bearer\s+/i, '')
  const cookieToken = decryptCookie(cookies(req.header('cookie')).ff_access)
  const token = bearer ?? cookieToken
  if (!token) return next(new AppError('UNAUTHORIZED', 401, 'Authentication required'))
  let payload: { userId: string; gymId: string; role: string; authVersion?: number; sessionId?: string }
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as typeof payload
  } catch { return next(new AppError('UNAUTHORIZED', 401, 'Invalid token')) }
  try {
    if (!payload.userId || !payload.gymId || !payload.role) throw new AppError('UNAUTHORIZED', 401, 'Invalid token')
    const user = await authRepository.findByIdAndGym(payload.userId, payload.gymId)
    if (!user || user.accountStatus !== 'ACTIVE' || (payload.authVersion ?? 0) !== user.authVersion) throw new AppError('UNAUTHORIZED', 401, 'Invalid token')
    if (payload.sessionId) { const session = await authRepository.findActiveSession(payload.sessionId); if (!session || session.userId.toString() !== payload.userId || session.authVersion !== user.authVersion) throw new AppError('UNAUTHORIZED', 401, 'Invalid token'); if (req.header('x-session-id') && req.header('x-session-id') !== payload.sessionId) throw new AppError('SESSION_CHANGED', 409, 'Session changed') }
    if (cookieToken && !bearer && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !allowedOrigin(req)) throw new AppError('FORBIDDEN', 403, 'Untrusted origin')
    req.auth = { ...payload, role: user.role }
    next()
  } catch (error) { next(error) }
}
export const requirePermission = (...required: Permission[]): RequestHandler => (req, _res, next) => { if (!req.auth || !required.every(permission => hasPermission(req.auth!.role, permission))) return next(new AppError('FORBIDDEN', 403, 'Insufficient permissions')); next() }
