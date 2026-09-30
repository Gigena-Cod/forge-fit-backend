import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware, requirePermission } from '../../shared/middleware/auth.middleware.js'
import { MemberModel } from '../members/member.model.js'
import { PaymentModel } from '../payments/payment.model.js'
import { AttendanceModel } from '../attendance/attendance.model.js'
import { objectId } from '../../shared/utils/mongo.js'
import { AppError } from '../../shared/errors/AppError.js'

const dateSchema = z.object({ from: z.string().date().optional(), to: z.string().date().optional() }).superRefine((value, context) => {
  if (Boolean(value.from) !== Boolean(value.to)) context.addIssue({ code: 'custom', message: 'from and to must be supplied together' })
  if (value.from && value.to && value.from > value.to) context.addIssue({ code: 'custom', message: 'from must not be after to' })
})
const periodSchema = z.object({ periodFrom: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(), periodTo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() }).superRefine((value, context) => {
  if (Boolean(value.periodFrom) !== Boolean(value.periodTo)) context.addIssue({ code: 'custom', message: 'periodFrom and periodTo must be supplied together' })
  if (value.periodFrom && value.periodTo && value.periodFrom > value.periodTo) context.addIssue({ code: 'custom', message: 'periodFrom must not be after periodTo' })
})
const utcRange = (from?: string, to?: string) => !from || !to ? {} : { $gte: new Date(`${from}T00:00:00.000Z`), $lt: new Date(`${to}T00:00:00.000Z`).setUTCDate(new Date(`${to}T00:00:00.000Z`).getUTCDate() + 1) }

export const reportRouter = Router()
reportRouter.use(authMiddleware, requirePermission('reports:read'))
reportRouter.get('/members', async (req, res) => {
  const query = dateSchema.parse(req.query)
  const gymId = objectId(req.auth!.gymId)
  const registrationDate = utcRange(query.from, query.to)
  const [total, active, inactive, registrations] = await Promise.all([
    MemberModel.countDocuments({ gymId }), MemberModel.countDocuments({ gymId, membershipStatus: 'ACTIVE' }), MemberModel.countDocuments({ gymId, membershipStatus: 'INACTIVE' }),
    MemberModel.countDocuments({ gymId, ...(query.from ? { registrationDate } : {}) }),
  ])
  res.json({ data: { range: query.from ? { from: query.from, to: query.to, timezone: 'America/Argentina/Cordoba' } : null, total, active, inactive, registrations } })
})
reportRouter.get('/payments', async (req, res) => {
  const query = periodSchema.parse(req.query)
  const gymId = objectId(req.auth!.gymId)
  const match = { gymId, recordStatus: { $ne: 'VOID' }, ...(query.periodFrom ? { period: { $gte: query.periodFrom, $lte: query.periodTo } } : {}) }
  const rows = await PaymentModel.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }])
  const byStatus = Object.fromEntries(rows.map(row => [row._id, { count: row.count, amount: row.amount }]))
  res.json({ data: { range: query.periodFrom ? { periodFrom: query.periodFrom, periodTo: query.periodTo } : null, currency: 'ARS', paid: byStatus.PAID ?? { count: 0, amount: 0 }, pending: byStatus.PENDING ?? { count: 0, amount: 0 }, overdue: byStatus.OVERDUE ?? { count: 0, amount: 0 } } })
})
reportRouter.get('/attendance', async (req, res) => {
  const query = dateSchema.parse(req.query)
  const gymId = objectId(req.auth!.gymId)
  const entryAt = utcRange(query.from, query.to)
  const rows = await AttendanceModel.aggregate([{ $match: { gymId, status: 'ALLOWED', ...(query.from ? { entryAt } : {}) } }, { $group: { _id: { $dateToString: { date: '$entryAt', format: '%Y-%m-%d', timezone: 'America/Argentina/Cordoba' } }, entries: { $sum: 1 }, members: { $addToSet: '$memberId' } } }, { $sort: { _id: 1 } }])
  const totalEntries = rows.reduce((sum, row) => sum + row.entries, 0)
  const memberIds = new Set(rows.flatMap(row => row.members.map((member: unknown) => String(member))))
  res.json({ data: { range: query.from ? { from: query.from, to: query.to, timezone: 'America/Argentina/Cordoba' } : null, totalEntries, uniqueMembers: memberIds.size, entriesByDay: rows.map(row => ({ date: row._id, entries: row.entries })) } })
})
