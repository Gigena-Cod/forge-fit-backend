import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import { GymModel } from '../modules/gyms/gym.model.js'
import { UserModel } from '../modules/auth/user.model.js'
import { MemberModel } from '../modules/members/member.model.js'
import { PaymentModel } from '../modules/payments/payment.model.js'
import { AttendanceModel } from '../modules/attendance/attendance.model.js'

const memberNames = ['Valentina Ruiz', 'Tomás Fernández', 'Camila Torres', 'Lautaro Acosta', 'Julieta Romero', 'Benjamín Díaz', 'Martina López', 'Franco Sosa', 'Agustina Castro', 'Nicolás Herrera', 'Brenda Vega', 'Facundo Molina', 'Micaela Ríos', 'Ignacio Navarro', 'Carolina Méndez', 'Santiago Luna', 'Florencia Arias', 'Lucía Gómez', 'Martín Castro', 'Paula Rivas', 'Diego Morales', 'Laura Benítez', 'Federico Álvarez', 'Cecilia Navarro', 'Ramiro Suárez', 'Andrea López', 'Gonzalo Pérez', 'Mara Díaz', 'Ezequiel Romero', 'Natalia Torres']
const methods = ['CASH', 'TRANSFER', 'CARD'] as const
const random = (seed: number) => { const value = Math.sin(seed * 12.9898) * 43758.5453; return value - Math.floor(value) }
const target = (index: number) => 10 + Math.floor(random(index + 1) * 11)
const month = (offset: number) => { const date = new Date(Date.UTC(2026, 7 - offset, 1)); return date.toISOString().slice(0, 7) }

async function ensureBaseGym() {
  let gym = await GymModel.findOne({ name: 'Apex' })
  if (!gym) {
    gym = await GymModel.create({ name: 'Apex', address: 'La Cumbre, Córdoba', phone: '03548 000000', contactEmail: 'contacto@apex.test' })
    await UserModel.create({ gymId: gym._id, fullName: 'Apex Owner', dni: '30000000', phone: '3515550000', email: 'admin@apex.test', passwordHash: await bcrypt.hash('password123', 12), role: 'OWNER' })
  }
  return gym
}

async function ensureMembers(gymId: mongoose.Types.ObjectId) {
  const baseMembers = [{ name: 'Juan Pérez', dni: '40000001', email: 'juan@apex.test', membershipStatus: 'ACTIVE' }, { name: 'Sofía Martínez', dni: '40000002', email: 'sofia@apex.test', membershipStatus: 'ACTIVE' }, { name: 'Mateo González', dni: '40000003', email: 'mateo@apex.test', membershipStatus: 'INACTIVE' }]
  const members = [...baseMembers, ...memberNames.map((name, index) => ({ name, dni: String(40000100 + index), email: `socio${index + 1}@apex.test`, membershipStatus: index % 7 === 0 ? 'INACTIVE' : 'ACTIVE' }))]
  for (let index = 0; index < members.length; index += 1) {
    const member = members[index]
    await MemberModel.updateOne({ gymId, dni: member.dni }, { $setOnInsert: { gymId, ...member, phone: `351555${String(1000 + index).slice(-4)}`, registrationDate: new Date(Date.UTC(2025, index % 12, 1)) } }, { upsert: true })
  }
  return MemberModel.find({ gymId }).sort({ dni: 1 })
}

async function ensureHistory(gymId: mongoose.Types.ObjectId, members: any[]) {
  for (let memberIndex = 0; memberIndex < members.length; memberIndex += 1) {
    const member = members[memberIndex]
    const paidPayments = await PaymentModel.find({ gymId, memberId: member._id, status: 'PAID' }).lean()
    const neededPayments = Math.max(0, target(memberIndex) - paidPayments.length)
    const periods = new Set(paidPayments.map((payment) => payment.period))
    const paymentRows = []
    for (let offset = 0; paymentRows.length < neededPayments && offset < 24; offset += 1) {
      const period = month(offset)
      if (!periods.has(period)) paymentRows.push({ gymId, memberId: member._id, period, amount: 28000 + Math.floor(random(memberIndex * 31 + offset) * 9) * 1000, paymentDate: new Date(Date.UTC(2026, 7 - offset, 2 + Math.floor(random(offset + memberIndex) * 20))), status: 'PAID' as const, paymentMethod: methods[Math.floor(random(memberIndex + offset + 7) * methods.length)] })
    }
    if (paymentRows.length) await PaymentModel.insertMany(paymentRows)
    const attendanceCount = await AttendanceModel.countDocuments({ gymId, memberId: member._id })
    const neededAttendances = Math.max(0, target(memberIndex + 50) - attendanceCount)
    const attendanceRows = Array.from({ length: neededAttendances }, (_, attendanceIndex) => ({ gymId, memberId: member._id, entryAt: new Date(Date.UTC(2026, 7, 1 + Math.floor(random(memberIndex * 17 + attendanceIndex) * 21), 6 + Math.floor(random(attendanceIndex + memberIndex) * 15), Math.floor(random(memberIndex + attendanceIndex + 3) * 60))), status: random(memberIndex + attendanceIndex + 90) > 0.08 ? 'ALLOWED' as const : 'REJECTED' as const }))
    if (attendanceRows.length) await AttendanceModel.insertMany(attendanceRows)
  }
}

try {
  await connectDatabase()
  const gym = await ensureBaseGym()
  const members = await ensureMembers(gym._id)
  await ensureHistory(gym._id, members)
  console.log(`ForgeFit seed ready: ${members.length} members with 10–20 paid payments and random attendances each.`)
} finally {
  await mongoose.disconnect()
}
