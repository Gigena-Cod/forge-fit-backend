import { AppError } from '../../shared/errors/AppError.js'
import { mapDocument } from '../../shared/utils/mongo.js'
import { memberRepository } from '../members/member.repository.js'
import { paymentRepository } from './payment.repository.js'

type Input = { memberId: string; period: string; amount: number; paymentDate?: string | null; status: 'PAID' | 'PENDING' | 'OVERDUE'; paymentMethod?: 'CASH' | 'TRANSFER' | 'CARD' | null }
const data = (input: Input) => ({ ...input, paymentDate: input.paymentDate ? new Date(input.paymentDate) : null })
const map = (document: any) => mapDocument(document)

export const paymentService = {
  async list(gymId: string) { return (await paymentRepository.findAllByGymId(gymId)).map(map) },
  async get(id: string, gymId: string) { const payment = await paymentRepository.findByIdAndGymId(id, gymId); if (!payment) throw new AppError('PAYMENT_NOT_FOUND', 404, 'Payment not found'); return map(payment) },
  async listByMember(memberId: string, gymId: string) { if (!await memberRepository.findByIdAndGymId(memberId, gymId)) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found'); return (await paymentRepository.findByMember(memberId, gymId)).map(map) },
  async create(gymId: string, input: Input) { if (!await memberRepository.findByIdAndGymId(input.memberId, gymId)) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found'); return map((await paymentRepository.create(gymId, data(input))).toObject()) },
  async update(id: string, gymId: string, input: Input) { if (!await memberRepository.findByIdAndGymId(input.memberId, gymId)) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found'); const payment = await paymentRepository.update(id, gymId, data(input)); if (!payment) throw new AppError('PAYMENT_NOT_FOUND', 404, 'Payment not found'); return map(payment) },
  async remove(id: string, gymId: string, userId: string, reason: string) { if (!await paymentRepository.void(id, gymId, userId, reason)) throw new AppError('PAYMENT_NOT_FOUND', 404, 'Payment not found') },
}
