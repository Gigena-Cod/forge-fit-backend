import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { MemberModel } from '../../src/modules/members/member.model.js'
import { PaymentModel } from '../../src/modules/payments/payment.model.js'
import { createGymScenario, createMember } from '../support/fixtures.js'

describe('HTTP: paginación de pagos', () => {
  let scenario: Awaited<ReturnType<typeof createGymScenario>>

  beforeEach(async () => {
    scenario = await createGymScenario()
  })

  it('mantiene el array legado, ordena y pagina por fecha efectiva con desempate por id', async () => {
    const member = await createMember(scenario.gym._id, { name: 'Carla Méndez' })
    const payment = (period: string, paymentDate: Date | undefined, status: 'PAID' | 'PENDING' = 'PAID') => PaymentModel.create({
      gymId: scenario.gym._id, memberId: member._id, period, amount: 30000, paymentDate, status,
      paymentMethod: status === 'PAID' ? 'CASH' : undefined, recordStatus: 'ACTIVE',
    })
    const [older, tieOne, tieTwo, noDate] = await Promise.all([
      payment('2026-07', new Date('2026-07-01T10:00:00Z')),
      payment('2026-10', new Date('2026-10-10T10:00:00Z')),
      payment('2026-11', new Date('2026-10-10T10:00:00Z')),
      payment('2026-12', undefined, 'PENDING'),
    ])
    await PaymentModel.updateOne({ _id: noDate._id }, { $set: { createdAt: new Date('2026-10-15T10:00:00Z') } })

    const legacy = await request(app).get('/api/payments').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(Array.isArray(legacy.body.data)).toBe(true)
    expect(legacy.body.data.every((row: any) => Object.keys(row.memberId).every(key => ['_id', 'name'].includes(key)))).toBe(true)
    expect(JSON.stringify(legacy.body.data)).not.toContain('qrPayload')
    expect(JSON.stringify(legacy.body.data)).not.toContain('qrDigest')

    const firstPage = await request(app).get('/api/payments?page=1&limit=2').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(firstPage.body.data).toMatchObject({ page: 1, limit: 2, total: 5 })
    const tieIds = [tieOne.id, tieTwo.id].sort((left, right) => right.localeCompare(left))
    expect(firstPage.body.data.items.map((row: any) => row.id)).toEqual([noDate.id, tieIds[0]])
    const secondPage = await request(app).get('/api/payments?page=2&limit=2').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(secondPage.body.data.items.map((row: any) => row.id)).toEqual([tieIds[1], scenario.payment.id])
  })

  it('busca literal por socio, período y estado mostrado antes de paginar', async () => {
    const member = await createMember(scenario.gym._id, { name: 'Carla Méndez' })
    await PaymentModel.create({ gymId: scenario.gym._id, memberId: member._id, period: '2026-11', amount: 30000, status: 'PENDING', recordStatus: 'ACTIVE' })
    const byName = await request(app).get('/api/payments?page=1&limit=20&q=carla').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(byName.body.data).toMatchObject({ total: 1 })
    expect(byName.body.data.items[0].memberId.name).toBe('Carla Méndez')
    const byPeriod = await request(app).get('/api/payments?page=1&limit=20&q=2026-09').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(byPeriod.body.data).toMatchObject({ total: 1 })
    const byStatus = await request(app).get('/api/payments?page=1&limit=20&q=PENDIENTE').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(byStatus.body.data).toMatchObject({ total: 1 })
    const literal = await request(app).get('/api/payments?page=1&limit=20&q=%5B').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(literal.body.data).toMatchObject({ total: 0, items: [] })
  })

  it('aísla el gimnasio, excluye anulados y conserva pagos históricos sin socio', async () => {
    const other = await createGymScenario('Otro gimnasio')
    const historicalMember = await createMember(scenario.gym._id, { name: 'Socio histórico' })
    const historicalPayment = await PaymentModel.create({ gymId: scenario.gym._id, memberId: historicalMember._id, period: '2026-10', amount: 30000, status: 'PENDING', recordStatus: 'ACTIVE' })
    await PaymentModel.updateOne({ _id: scenario.payment._id }, { $set: { recordStatus: 'VOID' } })
    await MemberModel.deleteOne({ _id: historicalMember._id })
    const result = await request(app).get('/api/payments?page=1&limit=20').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(result.body.data).toMatchObject({ total: 1 })
    expect(result.body.data.items[0].id).toBe(historicalPayment.id)
    expect(result.body.data.items[0].memberId).toBe(historicalMember.id)
    expect(JSON.stringify(result.body)).not.toContain(other.payment.id)
  })

  it('rechaza parámetros inválidos y permite páginas fuera de rango', async () => {
    await request(app).get('/api/payments?page=0&limit=20').auth(scenario.tokens.owner, { type: 'bearer' }).expect(400)
    await request(app).get('/api/payments?page=1&limit=101').auth(scenario.tokens.owner, { type: 'bearer' }).expect(400)
    const result = await request(app).get('/api/payments?page=99&limit=20&q=').auth(scenario.tokens.owner, { type: 'bearer' }).expect(200)
    expect(result.body.data).toMatchObject({ items: [], page: 99, limit: 20, total: 1 })
  })
})
