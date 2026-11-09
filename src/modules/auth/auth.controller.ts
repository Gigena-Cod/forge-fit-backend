import type { RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { decryptCookie, encryptCookie } from './session.crypto.js'
import { authService } from './auth.service.js'
import { AppError } from '../../shared/errors/AppError.js'

const registerSchema = z.object({ gym: z.object({ name: z.string().min(1), address: z.string().min(1), phone: z.string().min(1), contactEmail: z.string().email() }), administrator: z.object({ fullName: z.string().min(1), dni: z.string().min(1), phone: z.string().min(1), email: z.string().email(), password: z.string().min(8) }) })
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
const cookies = (header?: string) => Object.fromEntries((header ?? '').split(/;\s*/).filter(Boolean).map(value => { const index = value.indexOf('='); return [value.slice(0, index), value.slice(index + 1)] }))
const secure = process.env.NODE_ENV === 'production'
const options = (path: string) => ({ httpOnly: true, secure, sameSite: 'lax' as const, path })
const clear = (res: any) => { res.clearCookie('ff_access', options('/api')); res.clearCookie('ff_refresh', options('/api/auth')) }
function setCredentials(res: Response, value: { access: string; refresh: string; expiresAt: Date }) {
  const access = jwt.decode(value.access) as { exp: number }
  const accessExpiry = Math.min(access.exp * 1000, value.expiresAt.getTime())
  res.cookie('ff_access', encryptCookie(value.access), { ...options('/api'), expires: new Date(accessExpiry) })
  res.cookie('ff_refresh', encryptCookie(value.refresh), { ...options('/api/auth'), expires: value.expiresAt })
}
const payload = (value: any) => ({ user: value.user, gym: value.gym })

export const refreshCookie = (req: any) => decryptCookie(cookies(req.headers.cookie).ff_refresh)
export const authController = {
  register: (async (req, res) => { const result = await authService.register(registerSchema.parse(req.body)); setCredentials(res, result); res.set('Cache-Control', 'no-store').status(201).json({ data: payload(result) }) }) as RequestHandler,
  login: (async (req, res) => { const result = await authService.login(loginSchema.parse(req.body)); setCredentials(res, result); res.set('Cache-Control', 'no-store').json({ data: payload(result) }) }) as RequestHandler,
  refresh: (async (req, res) => { const refresh = refreshCookie(req); if (!refresh) { clear(res); return res.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Session expired' } }) }; try { const result = await authService.refresh(refresh, req.header('x-session-id')); setCredentials(res, result); res.set('Cache-Control', 'no-store').status(204).send() } catch (error) { if (error instanceof AppError && error.code === 'SESSION_EXPIRED') clear(res); throw error } }) as RequestHandler,
  logout: (async (req, res) => { await authService.logout(refreshCookie(req), req.header('x-session-id')); clear(res); res.set('Cache-Control', 'no-store').status(204).send() }) as RequestHandler,
  me: (async (req, res) => res.set('Cache-Control', 'no-store').json({ data: await authService.me(req.auth!.userId, req.auth!.sessionId) })) as RequestHandler,
}
