import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { GymModel } from '../../src/modules/gyms/gym.model.js'
import { UserModel } from '../../src/modules/auth/user.model.js'
import { createGym, createUser, fixturePassword, tokenFor } from '../support/fixtures.js'

describe('HTTP: autenticación real', () => {
  it('responde a health', async () => {
    const result = await request(app).get('/api/health').expect(200)
    expect(result.body).toEqual({ status: 'ok' })
  })

  it('registra gimnasio y propietario mediante la transacción de producción', async () => {
    const result = await request(app).post('/api/auth/register').send({
      gym: { name: 'Registro HTTP', address: 'Córdoba', phone: '3515550000', contactEmail: 'gym@example.test' },
      administrator: { fullName: 'Propietario', dni: '12345678', phone: '3515550000', email: 'owner@example.test', password: fixturePassword },
    }).expect(201)
    expect(result.body.data.user.role).toBe('OWNER')
    expect(await GymModel.countDocuments()).toBe(1)
    expect(await UserModel.countDocuments()).toBe(1)
    const profile = await request(app).get('/api/auth/me').auth(result.body.data.token, { type: 'bearer' }).expect(200)
    expect(profile.body.data.gym.id).toBe(result.body.data.gym.id)
    expect(profile.body.data.user).not.toHaveProperty('passwordHash')
  })

  it.each(['OWNER', 'ADMIN', 'RECEPTIONIST'] as const)('login y me para %s', async role => {
    const gym = await createGym()
    const user = await createUser(gym._id, role)
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: fixturePassword }).expect(200)
    const profile = await request(app).get('/api/auth/me').auth(login.body.data.token, { type: 'bearer' }).expect(200)
    expect(profile.body.data.user).toMatchObject({ id: user.id, role })
  })

  it('rechaza credenciales incorrectas', async () => {
    const user = await createUser((await createGym())._id)
    const result = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong' }).expect(401)
    expect(result.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('rechaza usuario inactivo tanto en login como con un JWT firmado', async () => {
    const user = await createUser((await createGym())._id, 'ADMIN', 'INACTIVE')
    await request(app).post('/api/auth/login').send({ email: user.email, password: fixturePassword }).expect(401)
    await request(app).get('/api/auth/me').auth(tokenFor(user), { type: 'bearer' }).expect(401)
  })

  it('rechaza token obsoleto cuando cambia authVersion', async () => {
    const user = await createUser((await createGym())._id)
    const token = tokenFor(user)
    await UserModel.updateOne({ _id: user._id }, { $inc: { authVersion: 1 } })
    await request(app).get('/api/auth/me').auth(token, { type: 'bearer' }).expect(401)
  })

  it('rechaza solicitudes sin JWT o con JWT inválido', async () => {
    await request(app).get('/api/members').expect(401)
    await request(app).get('/api/members').auth('invalid-token', { type: 'bearer' }).expect(401)
  })
})
