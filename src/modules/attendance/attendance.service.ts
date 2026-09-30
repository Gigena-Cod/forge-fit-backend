import { createHash } from 'node:crypto'
import { AppError } from '../../shared/errors/AppError.js'
import { decideAccess, type PaymentStatus } from '../../shared/domain/access.js'
import { memberRepository } from '../members/member.repository.js'
import { paymentRepository } from '../payments/payment.repository.js'
import { attendanceRepository } from './attendance.repository.js'

const currentPeriod = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Cordoba', year: 'numeric', month: '2-digit' }).formatToParts(date)
  return `${parts.find(part => part.type === 'year')!.value}-${parts.find(part => part.type === 'month')!.value}`
}

export const attendanceService = {
  list: (gymId: string) => attendanceRepository.findAllByGymId(gymId),
  async listByMember(memberId: string, gymId: string) {
    if (!await memberRepository.findByIdAndGymId(memberId, gymId)) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
    return attendanceRepository.findByMember(memberId, gymId)
  },
  async accessStatus(memberId: string, gymId: string) {
    const member = await memberRepository.findByIdAndGymId(memberId, gymId)
    if (!member) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
    const period = currentPeriod()
    const payments = await paymentRepository.findForPeriod(memberId, gymId, period)
    const paymentStatus: PaymentStatus = payments.length === 0 ? 'MISSING' : payments.length > 1 ? 'CONFLICT' : payments[0].status
    const decision = decideAccess(member.membershipStatus, paymentStatus)
    return { memberId, membershipStatus: member.membershipStatus, period, paymentStatus, allowed: decision.allowed, reason: decision.reason, evaluatedAt: new Date().toISOString() }
  },
  async checkIn(qrPayload: string, requestId: string, gymId: string) {
    const existing = await attendanceRepository.findByRequestId(gymId, requestId)
    if (existing) return { allowed: true, reason: 'ACCESS_GRANTED', attendance: existing, replayed: true }
    const member = await memberRepository.findWithQr(createHash('sha256').update(qrPayload).digest('hex'), gymId)
    if (!member) return { allowed: false, reason: 'QR_INVALID', attendance: null, replayed: false }
    const access = await this.accessStatus(member._id.toString(), gymId)
    if (!access.allowed) return { allowed: false, reason: access.reason, attendance: null, replayed: false }
    try {
      const attendance = await attendanceRepository.create(gymId, member._id.toString(), { entryAt: new Date(), status: 'ALLOWED', requestId })
      return { allowed: true, reason: 'ACCESS_GRANTED', attendance, replayed: false }
    } catch (error: any) {
      if (error?.code === 11000) {
        const attendance = await attendanceRepository.findByRequestId(gymId, requestId)
        if (attendance) return { allowed: true, reason: 'ACCESS_GRANTED', attendance, replayed: true }
      }
      throw error
    }
  },
}
