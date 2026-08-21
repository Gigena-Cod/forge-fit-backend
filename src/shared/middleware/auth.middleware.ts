import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { AppError } from '../errors/AppError.js'
export const authMiddleware: RequestHandler = (req, _res, next) => { try { const token = req.header('authorization')?.replace(/^Bearer\s+/i, ''); if (!token) throw new AppError('UNAUTHORIZED', 401, 'Authentication required'); const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; gymId: string; role: string }; if (!payload.userId || !payload.gymId || !payload.role) throw new AppError('UNAUTHORIZED', 401, 'Invalid token'); req.auth = payload; next() } catch (error) { next(error instanceof AppError ? error : new AppError('UNAUTHORIZED', 401, 'Invalid token')) } }
