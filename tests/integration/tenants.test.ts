import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { MemberModel } from '../../src/modules/members/member.model.js'
import { PaymentModel } from '../../src/modules/payments/payment.model.js'
import { createGymScenario, memberBody } from '../support/fixtures.js'

describe('HTTP: aislamiento entre dos gimnasios', () => {
  let first: Awaited<ReturnType<typeof createGymScenario>>
  let second: Awaited<ReturnType<typeof createGymScenario>>
  beforeEach(async () => {
    ;[first, second] = await Promise.all([createGymScenario('Apex'), createGymScenario('Otro gimnasio')])
  })

  it.each(['members', 'payments', 'attendance', 'users'])('GET /%s solo devuelve recursos propios', async resource => {
    const result = await request(app).get(`/api/${resource}`).auth(first.tokens.owner, { type: 'bearer' }).expect(200)
    expect(result.body.data.length).toBe(resource === 'users' ? 3 : 1)
    for (const row of result.body.data) expect(row.gymId).toBe(first.gym.id)
    expect(JSON.stringify(result.body)).not.toContain('passwordHash')
  })

  it.each(['members', 'payments', 'users'])('GET /%s/:id oculta recursos ajenos', async resource => {
    const id = resource === 'members' ? second.member.id : resource === 'payments' ? second.payment.id : second.owner.id
    await request(app).get(`/api/${resource}/${id}`).auth(first.tokens.owner, { type: 'bearer' }).expect(404)
  })

  it.each(['payments', 'attendance'])('historial de %s no permite consultar un socio ajeno', async resource => {
    await request(app).get(`/api/members/${second.member.id}/${resource}`).auth(first.tokens.owner, { type: 'bearer' }).expect(404)
  })

  it('alta de socio usa el gimnasio del JWT aunque el body envíe otro', async () => {
    const result = await request(app).post('/api/members').auth(first.tokens.owner, { type: 'bearer' })
      .send({ ...memberBody(), gymId: second.gym.id }).expect(201)
    expect(result.body.data.gymId).toBe(first.gym.id)
    const saved = await MemberModel.findById(result.body.data.id)
    expect(saved?.gymId.toString()).toBe(first.gym.id)
  })

  it('no permite modificar un socio de otro gimnasio', async () => {
    await request(app).put(`/api/members/${second.member.id}`).auth(first.tokens.owner, { type: 'bearer' })
      .send(memberBody({ name: 'Cambio no autorizado' })).expect(404)
    expect((await MemberModel.findById(second.member.id))?.name).toBe(second.member.name)
  })

  it('no permite crear pagos para un socio ajeno', async () => {
    await request(app).post('/api/payments').auth(first.tokens.owner, { type: 'bearer' })
      .send({ memberId: second.member.id, period: '2026-10', amount: 30000, status: 'PENDING' }).expect(404)
    expect(await PaymentModel.countDocuments()).toBe(2)
  })

  it('rechaza un body inválido sin persistir un socio', async () => {
    const result = await request(app).post('/api/members').auth(first.tokens.owner, { type: 'bearer' }).send({ name: '' }).expect(400)
    expect(result.body.error.code).toBe('VALIDATION_ERROR')
    expect(await MemberModel.countDocuments()).toBe(2)
  })

  it('comprueba una restricción de rol ya implementada: recepción no lista usuarios', async () => {
    const result = await request(app).get('/api/users').auth(first.tokens.receptionist, { type: 'bearer' }).expect(403)
    expect(result.body.error.code).toBe('FORBIDDEN')
  })
})
