import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../../src/app.js'
import { AttendanceModel } from '../../src/modules/attendance/attendance.model.js'
import { MemberModel } from '../../src/modules/members/member.model.js'
import { PaymentModel } from '../../src/modules/payments/payment.model.js'
import { UserModel } from '../../src/modules/auth/user.model.js'
import { createGym, createGymScenario, createMember, createPayment, memberBody } from '../support/fixtures.js'

describe('HTTP: endpoints que completan ForgeFit', () => {
  let scenario: Awaited<ReturnType<typeof createGymScenario>>
  beforeEach(async () => {
    // Evaluate access in the same month as the scenario's payment.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))
    scenario = await createGymScenario()
  })
  afterEach(() => { vi.useRealTimers() })

  it('cambia el estado de un socio sin borrar su historial', async () => {
    await request(app).patch(`/api/members/${scenario.member.id}/status`).auth(scenario.tokens.admin, { type: 'bearer' }).send({ membershipStatus: 'INACTIVE' }).expect(200)
    expect((await MemberModel.findById(scenario.member.id))?.membershipStatus).toBe('INACTIVE')
    expect(await PaymentModel.countDocuments({ memberId: scenario.member._id })).toBe(1)
    expect(await AttendanceModel.countDocuments({ memberId: scenario.member._id })).toBe(1)
  })

  it('informa habilitación por socio activo y pago del mes actual', async () => {
    const response = await request(app).get(`/api/members/${scenario.member.id}/access-status`).auth(scenario.tokens.receptionist, { type: 'bearer' }).expect(200)
    expect(response.body.data).toMatchObject({ memberId: scenario.member.id, period: '2026-09', paymentStatus: 'PAID', allowed: true, reason: 'VALID_PAYMENT' })
  })

  it('informa pago vencido, faltante y conflicto sin registrar asistencia', async () => {
    await PaymentModel.updateOne({ _id: scenario.payment._id }, { status: 'OVERDUE' })
    let response = await request(app).get(`/api/members/${scenario.member.id}/access-status`).auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(response.body.data).toMatchObject({ allowed: false, paymentStatus: 'OVERDUE', reason: 'PAYMENT_OVERDUE' })
    await PaymentModel.deleteMany({ memberId: scenario.member._id })
    response = await request(app).get(`/api/members/${scenario.member.id}/access-status`).auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(response.body.data).toMatchObject({ allowed: false, paymentStatus: 'MISSING' })
    await Promise.all([createPayment(scenario.gym._id, scenario.member._id), createPayment(scenario.gym._id, scenario.member._id)])
    response = await request(app).get(`/api/members/${scenario.member.id}/access-status`).auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(response.body.data).toMatchObject({ allowed: false, paymentStatus: 'CONFLICT' })
  })

  it('emite, consulta y rota un QR opaco', async () => {
    const issued = await request(app).post(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).send({}).expect(201)
    expect(issued.body.data.qrPayload).toMatch(/^ffq_v1_/)
    expect(issued.body.data.qrPayload).not.toContain(scenario.member.dni)
    expect(issued.headers['cache-control']).toBe('no-store')
    expect(issued.body.data.issuedAt).toMatch(/^2026-09-15T12:00:00\.000Z$/)
    const read = await request(app).get(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.admin, { type: 'bearer' }).expect(200)
    expect(read.body.data.qrPayload).toBe(issued.body.data.qrPayload)
    expect(read.body.data.issuedAt).toBe(issued.body.data.issuedAt)
    expect(read.headers['cache-control']).toBe('no-store')
    const rotated = await request(app).post(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).send({ rotate: true }).expect(201)
    expect(rotated.body.data.qrPayload).not.toBe(issued.body.data.qrPayload)
  })

  it('emite una sola credencial ante emisiones iniciales concurrentes', async () => {
    const member = await createMember(scenario.gym._id)
    const responses = await Promise.all(Array.from({ length: 8 }, () =>
      request(app).post(`/api/members/${member.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).send({}).expect(201),
    ))
    const payloads = new Set(responses.map(response => response.body.data.qrPayload))
    const issuedAt = new Set(responses.map(response => response.body.data.issuedAt))
    expect(payloads.size).toBe(1)
    expect(issuedAt.size).toBe(1)
    const stored = await MemberModel.findById(member._id).select('+qrPayload +qrDigest').lean()
    expect(stored?.qrPayload).toBe(responses[0].body.data.qrPayload)
  })

  it('protege la credencial QR y distingue las dos ausencias', async () => {
    await request(app).get(`/api/members/${scenario.member.id}/qr`).expect(401)
    await request(app).get(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.receptionist, { type: 'bearer' }).expect(403)
    await request(app).get(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).expect(404).expect({ error: { code: 'QR_NOT_ASSIGNED', message: 'QR not assigned' } })
    const otherGym = await createGym()
    const otherMember = await createMember(otherGym._id)
    await request(app).get(`/api/members/${otherMember.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).expect(404).expect({ error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found' } })
  })

  it('invalida el QR previo al rotarlo y acepta el nuevo', async () => {
    const original = (await request(app).post(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).send({}).expect(201)).body.data.qrPayload
    const replacement = (await request(app).post(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).send({ rotate: true }).expect(201)).body.data.qrPayload
    await request(app).post('/api/attendance/check-in').auth(scenario.tokens.receptionist, { type: 'bearer' }).send({ qrPayload: original, requestId: randomUUID() }).expect(200).expect(({ body }) => expect(body.data.reason).toBe('QR_INVALID'))
    await request(app).post('/api/attendance/check-in').auth(scenario.tokens.receptionist, { type: 'bearer' }).send({ qrPayload: replacement, requestId: randomUUID() }).expect(201)
  })

  it('registra check-in una vez y recupera el mismo resultado en reintento', async () => {
    const qr = (await request(app).post(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).send({}).expect(201)).body.data.qrPayload
    const requestId = randomUUID()
    const first = await request(app).post('/api/attendance/check-in').auth(scenario.tokens.receptionist, { type: 'bearer' }).send({ qrPayload: qr, requestId }).expect(201)
    const retry = await request(app).post('/api/attendance/check-in').auth(scenario.tokens.receptionist, { type: 'bearer' }).send({ qrPayload: qr, requestId }).expect(201)
    expect(first.body.data.attendance._id).toBe(retry.body.data.attendance._id)
    expect(retry.body.data.replayed).toBe(true)
    expect(await AttendanceModel.countDocuments({ memberId: scenario.member._id, requestId })).toBe(1)
  })

  it.each([
    ['unknown QR', 'ffq_v1_unknown_payload_never_assigned', 'QR_INVALID'],
    ['inactive member', null, 'MEMBER_INACTIVE'],
    ['missing payment', null, 'PAYMENT_MISSING'],
  ] as const)('rechaza check-in: %s', async (_name, suppliedQr, reason) => {
    let qr = suppliedQr
    if (!qr) qr = (await request(app).post(`/api/members/${scenario.member.id}/qr`).auth(scenario.tokens.owner, { type: 'bearer' }).send({}).expect(201)).body.data.qrPayload
    if (reason === 'MEMBER_INACTIVE') await MemberModel.updateOne({ _id: scenario.member._id }, { membershipStatus: 'INACTIVE' })
    if (reason === 'PAYMENT_MISSING') await PaymentModel.deleteMany({ memberId: scenario.member._id })
    const result = await request(app).post('/api/attendance/check-in').auth(scenario.tokens.receptionist, { type: 'bearer' }).send({ qrPayload: qr, requestId: randomUUID() }).expect(200)
    expect(result.body.data).toMatchObject({ allowed: false, reason, attendance: null })
  })

  it('administra usuarios, limita creación al owner y protege el último owner', async () => {
    const create = await request(app).post('/api/users').auth(scenario.tokens.owner, { type: 'bearer' }).send({ fullName: 'Nueva recepción', dni: '44444444', phone: '3515559999', email: 'new@example.test', password: 'password123', role: 'RECEPTIONIST' }).expect(201)
    expect(create.body.data).not.toHaveProperty('passwordHash')
    await request(app).post('/api/users').auth(scenario.tokens.admin, { type: 'bearer' }).send({ fullName: 'X', dni: '1', phone: '1', email: 'x@example.test', password: 'password123', role: 'RECEPTIONIST' }).expect(403)
    await request(app).patch(`/api/users/${scenario.owner.id}`).auth(scenario.tokens.owner, { type: 'bearer' }).send({ accountStatus: 'INACTIVE' }).expect(409)
    await request(app).patch(`/api/users/${create.body.data._id}`).auth(scenario.tokens.owner, { type: 'bearer' }).send({ accountStatus: 'INACTIVE' }).expect(200)
    expect((await UserModel.findById(create.body.data._id))?.accountStatus).toBe('INACTIVE')
  })

  it('expone roles y reportes consolidados solo a administración', async () => {
    const roles = await request(app).get('/api/roles').auth(scenario.tokens.admin, { type: 'bearer' }).expect(200)
    expect(roles.body.data.map((role: { code: string }) => role.code)).toEqual(['OWNER', 'ADMIN', 'RECEPTIONIST'])
    const members = await request(app).get('/api/reports/members?from=2026-09-01&to=2026-09-30').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(members.body.data).toMatchObject({ total: 1, active: 1, registrations: 1 })
    const payments = await request(app).get('/api/reports/payments?periodFrom=2026-09&periodTo=2026-09').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(payments.body.data.paid).toMatchObject({ count: 1, amount: 30000 })
    await request(app).get('/api/reports/attendance').auth(scenario.tokens.receptionist, { type: 'bearer' }).expect(403)
  })

  it('valida rutas nuevas y sus parámetros', async () => {
    await request(app).patch(`/api/members/${scenario.member.id}/status`).auth(scenario.tokens.owner, { type: 'bearer' }).send({ membershipStatus: 'UNKNOWN' }).expect(400)
    await request(app).post('/api/attendance/check-in').auth(scenario.tokens.owner, { type: 'bearer' }).send({ qrPayload: 'short', requestId: 'not-uuid' }).expect(400)
    await request(app).get('/api/reports/payments?periodFrom=2026-15&periodTo=2026-15').auth(scenario.tokens.owner, { type: 'bearer' }).expect(400)
    await request(app).delete(`/api/payments/${scenario.payment.id}`).auth(scenario.tokens.owner, { type: 'bearer' }).send({}).expect(400)
  })

  it('anula un pago sin borrarlo y deja de considerarlo para la habilitación', async () => {
    await request(app).delete(`/api/payments/${scenario.payment.id}`).auth(scenario.tokens.owner, { type: 'bearer' }).send({ reason: 'Comprobante duplicado' }).expect(204)
    expect((await PaymentModel.findById(scenario.payment.id))?.recordStatus).toBe('VOID')
    const access = await request(app).get(`/api/members/${scenario.member.id}/access-status`).auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(access.body.data).toMatchObject({ allowed: false, paymentStatus: 'MISSING' })
  })
})
