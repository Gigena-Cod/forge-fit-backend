import type { RequestHandler } from 'express'
import { z } from 'zod'
import { authService } from './auth.service.js'
const registerSchema = z.object({ gym: z.object({ name: z.string().min(1), address: z.string().min(1), phone: z.string().min(1), contactEmail: z.string().email() }), administrator: z.object({ fullName: z.string().min(1), dni: z.string().min(1), phone: z.string().min(1), email: z.string().email(), password: z.string().min(8) }) })
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
export const authController = { register: (async (req, res) => res.status(201).json({ data: await authService.register(registerSchema.parse(req.body)) })) as RequestHandler, login: (async (req, res) => res.json({ data: await authService.login(loginSchema.parse(req.body)) })) as RequestHandler, me: (async (req, res) => res.json({ data: await authService.me(req.auth!.userId) })) as RequestHandler }
