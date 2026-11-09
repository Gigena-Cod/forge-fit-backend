import type { RequestHandler } from 'express'
import { z } from 'zod'
import { attendanceService } from './attendance.service.js'

const checkSchema = z.object({ qrPayload: z.string().min(10), requestId: z.string().uuid() })
const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), q: z.string().optional() }).strict()
const paged = (req: any) => 'page' in req.query || 'limit' in req.query

export const attendanceController = {
  list: (async (req, res) => { if (!paged(req)) return res.json({ data: await attendanceService.list(req.auth!.gymId) }); const query = pageSchema.parse(req.query); return res.json({ data: await attendanceService.listPage(req.auth!.gymId, query.page, query.limit, undefined, query.q) }) }) as RequestHandler,
  listByMember: (async (req, res) => { if (!paged(req)) return res.json({ data: await attendanceService.listByMember(String(req.params.memberId), req.auth!.gymId) }); const query = pageSchema.parse(req.query); return res.json({ data: await attendanceService.listPage(req.auth!.gymId, query.page, query.limit, String(req.params.memberId)) }) }) as RequestHandler,
  accessStatus: (async (req, res) => res.json({ data: await attendanceService.accessStatus(String(req.params.id), req.auth!.gymId) })) as RequestHandler,
  checkIn: (async (req, res) => { const input = checkSchema.parse(req.body); const result = await attendanceService.checkIn(input.qrPayload, input.requestId, req.auth!.gymId); res.status(result.allowed ? 201 : 200).json({ data: result }) }) as RequestHandler,
}
