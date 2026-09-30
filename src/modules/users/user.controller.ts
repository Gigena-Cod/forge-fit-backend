import type { RequestHandler } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { authRepository } from '../auth/auth.repository.js'
import { UserModel } from '../auth/user.model.js'
import { AppError } from '../../shared/errors/AppError.js'

const createSchema = z.object({ fullName: z.string().min(1), dni: z.string().min(1), phone: z.string().min(1), email: z.string().email(), password: z.string().min(8), role: z.enum(['ADMIN', 'RECEPTIONIST']) })
const updateSchema = z.object({ fullName: z.string().min(1).optional(), dni: z.string().min(1).optional(), phone: z.string().min(1).optional(), email: z.string().email().optional(), role: z.enum(['ADMIN', 'RECEPTIONIST']).optional(), accountStatus: z.enum(['ACTIVE', 'INACTIVE']).optional() }).refine(value => Object.keys(value).length > 0)

export const userController = {
  list: (async (req, res) => res.json({ data: await authRepository.listByGym(req.auth!.gymId) })) as RequestHandler,
  get: (async (req, res) => { const user = await authRepository.findByIdAndGym(String(req.params.id), req.auth!.gymId); if (!user) throw new AppError('USER_NOT_FOUND', 404, 'User not found'); res.json({ data: user }) }) as RequestHandler,
  create: (async (req, res) => { const input = createSchema.parse(req.body); if (await authRepository.findByEmail(input.email)) throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'Email already exists'); const { password, ...data } = input; const user = await authRepository.createInGym(req.auth!.gymId, { ...data, passwordHash: await bcrypt.hash(password, 12) }); const { passwordHash: _passwordHash, ...safe } = user.toObject(); res.status(201).json({ data: safe }) }) as RequestHandler,
  update: (async (req, res) => {
    const id = String(req.params.id); const data = updateSchema.parse(req.body)
    const current = await UserModel.findOne({ _id: id, gymId: req.auth!.gymId }).lean()
    if (!current) throw new AppError('USER_NOT_FOUND', 404, 'User not found')
    const removesOwner = current.role === 'OWNER' && (data.accountStatus === 'INACTIVE' || data.role !== undefined)
    if (removesOwner && await UserModel.countDocuments({ gymId: req.auth!.gymId, role: 'OWNER', accountStatus: 'ACTIVE' }) <= 1) throw new AppError('LAST_OWNER', 409, 'The last active owner cannot be changed or deactivated')
    if (data.email && data.email !== current.email && await authRepository.findByEmail(data.email)) throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'Email already exists')
    const user = await authRepository.updateInGym(id, req.auth!.gymId, data)
    res.json({ data: user })
  }) as RequestHandler,
}
