import { createHash, randomBytes } from 'node:crypto'
import { AppError } from '../../shared/errors/AppError.js'
import { mapDocument } from '../../shared/utils/mongo.js'
import { memberRepository } from './member.repository.js'

type Input = { name: string; dni: string; birthDate?: string | null; phone: string; email: string; registrationDate: string; membershipStatus: 'ACTIVE' | 'INACTIVE' }
type QrMember = { _id: { toString(): string }; qrPayload?: string; qrIssuedAt?: Date }

const data = (input: Input) => ({ ...input, birthDate: input.birthDate ? new Date(input.birthDate) : null, registrationDate: new Date(input.registrationDate) })
const map = (doc: any) => mapDocument(doc)
const qrResponse = (member: QrMember) => ({ memberId: member._id.toString(), qrPayload: member.qrPayload!, issuedAt: member.qrIssuedAt!.toISOString() })
const newQr = () => {
  const qrPayload = `ffq_v1_${randomBytes(32).toString('base64url')}`
  return { qrPayload, qrDigest: createHash('sha256').update(qrPayload).digest('hex'), qrIssuedAt: new Date() }
}

export const memberService = {
  async list(gymId: string) { return (await memberRepository.findAllByGymId(gymId)).map(map) },
  async get(id: string, gymId: string) {
    const member = await memberRepository.findByIdAndGymId(id, gymId)
    if (!member) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
    return map(member)
  },
  async create(gymId: string, input: Input) { return map((await memberRepository.create(gymId, data(input))).toObject()) },
  async update(id: string, gymId: string, input: Input) {
    const member = await memberRepository.update(id, gymId, data(input))
    if (!member) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
    return map(member)
  },
  async setStatus(id: string, gymId: string, status: 'ACTIVE' | 'INACTIVE') {
    const member = await memberRepository.setStatus(id, gymId, status)
    if (!member) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
    return map(member)
  },
  async remove(id: string, gymId: string) {
    if (!await memberRepository.delete(id, gymId)) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
  },
  async issueQr(id: string, gymId: string, rotate = false) {
    const current = await memberRepository.findByIdWithQr(id, gymId) as QrMember | null
    if (!current) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
    if (current.qrPayload && !rotate) return qrResponse(current)

    const updated = rotate
      ? await memberRepository.rotateQr(id, gymId, newQr())
      : await memberRepository.issueFirstQr(id, gymId, newQr())
    if (updated) return qrResponse(updated as QrMember)

    const persisted = await memberRepository.findByIdWithQr(id, gymId) as QrMember | null
    if (!persisted) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
    if (!persisted.qrPayload) throw new AppError('QR_NOT_ASSIGNED', 404, 'QR not assigned')
    return qrResponse(persisted)
  },
  async getQr(id: string, gymId: string) {
    const member = await memberRepository.findByIdWithQr(id, gymId) as QrMember | null
    if (!member) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found')
    if (!member.qrPayload) throw new AppError('QR_NOT_ASSIGNED', 404, 'QR not assigned')
    return qrResponse(member)
  },
}
