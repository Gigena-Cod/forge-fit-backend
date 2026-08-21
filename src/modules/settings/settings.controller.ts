import type { RequestHandler } from 'express'
import { z } from 'zod'
import { settingsService } from './settings.service.js'
const schema = z.object({ gym: z.object({ name: z.string().min(1), address: z.string().min(1), phone: z.string().min(1), contactEmail: z.string().email() }), administrator: z.object({ fullName: z.string().min(1), dni: z.string().min(1), phone: z.string().min(1), email: z.string().email() }) })
export const settingsController = { get: (async (req, res) => res.json({ data: await settingsService.get(req.auth!.userId, req.auth!.gymId) })) as RequestHandler, update: (async (req, res) => res.json({ data: await settingsService.update(req.auth!.userId, req.auth!.gymId, schema.parse(req.body)) })) as RequestHandler }
