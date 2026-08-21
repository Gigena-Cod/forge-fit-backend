import type { RequestHandler } from 'express'
import { attendanceService } from './attendance.service.js'
export const attendanceController = { list: (async (req, res) => res.json({ data: await attendanceService.list(req.auth!.gymId) })) as RequestHandler, listByMember: (async (req, res) => res.json({ data: await attendanceService.listByMember(String(req.params.memberId), req.auth!.gymId) })) as RequestHandler }
