import { createHash, randomBytes, randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import { env } from '../../src/config/env.js'
import { GymModel } from '../../src/modules/gyms/gym.model.js'
import { UserModel } from '../../src/modules/auth/user.model.js'
import { MemberModel } from '../../src/modules/members/member.model.js'
import { PaymentModel } from '../../src/modules/payments/payment.model.js'
import { AttendanceModel } from '../../src/modules/attendance/attendance.model.js'

export const fixturePassword = 'Test-password-123!'
// Reduced cost only for fixtures. Production hashing remains unchanged.
const passwordHash = bcrypt.hashSync(fixturePassword, 4)
type Role = 'OWNER' | 'ADMIN' | 'RECEPTIONIST'

export function createGym(name = `Gym ${randomUUID()}`) {
  return GymModel.create({ name, address: 'La Cumbre, Córdoba', phone: '3515550000', contactEmail: `${randomUUID()}@example.test` })
}

export function createUser(gymId: Types.ObjectId, role: Role = 'OWNER', accountStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE') {
  return UserModel.create({ gymId, fullName: `Test ${role}`, dni: randomUUID(), phone: '3515551111', email: `${randomUUID()}@example.test`, passwordHash, role, accountStatus, authVersion: 0 })
}

export function tokenFor(user: { _id: Types.ObjectId; gymId: Types.ObjectId; role: string; authVersion: number }) {
  return jwt.sign({ userId: user._id.toString(), gymId: user.gymId.toString(), role: user.role, authVersion: user.authVersion }, env.JWT_SECRET, { expiresIn: '1h' })
}

export function memberBody(overrides: Partial<{ name: string; dni: string; phone: string; email: string; registrationDate: string; membershipStatus: 'ACTIVE' | 'INACTIVE' }> = {}) {
  return { name: 'Socio de prueba', dni: randomUUID(), phone: '3515552222', email: `${randomUUID()}@example.test`, registrationDate: '2026-09-01', membershipStatus: 'ACTIVE' as const, ...overrides }
}

export function createMember(gymId: Types.ObjectId, overrides: Parameters<typeof memberBody>[0] = {}) {
  return MemberModel.create({ ...memberBody(overrides), gymId })
}

export function createPayment(gymId: Types.ObjectId, memberId: Types.ObjectId, overrides: Partial<{ period: string; status: 'PAID' | 'PENDING' | 'OVERDUE'; recordStatus: 'ACTIVE' | 'VOID' }> = {}) {
  return PaymentModel.create({ gymId, memberId, period: '2026-09', amount: 30000, paymentDate: new Date('2026-09-01T12:00:00Z'), status: 'PAID', paymentMethod: 'CASH', recordStatus: 'ACTIVE', ...overrides })
}

export function createAttendance(gymId: Types.ObjectId, memberId: Types.ObjectId) {
  return AttendanceModel.create({ gymId, memberId, entryAt: new Date('2026-09-15T12:00:00Z'), status: 'ALLOWED', requestId: randomUUID() })
}

export async function associateQr(memberId: Types.ObjectId) {
  const qrPayload = `ffq_v1_${randomBytes(32).toString('base64url')}`
  await MemberModel.updateOne({ _id: memberId }, { qrPayload, qrDigest: createHash('sha256').update(qrPayload).digest('hex'), qrIssuedAt: new Date() })
  return qrPayload
}

export async function createGymScenario(name = 'Gimnasio de pruebas') {
  const gym = await createGym(name)
  const [owner, admin, receptionist, member] = await Promise.all([
    createUser(gym._id, 'OWNER'), createUser(gym._id, 'ADMIN'), createUser(gym._id, 'RECEPTIONIST'), createMember(gym._id),
  ])
  const [payment, attendance] = await Promise.all([createPayment(gym._id, member._id), createAttendance(gym._id, member._id)])
  return { gym, owner, admin, receptionist, member, payment, attendance,
    tokens: { owner: tokenFor(owner), admin: tokenFor(admin), receptionist: tokenFor(receptionist) } }
}
