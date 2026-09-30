import mongoose from 'mongoose'
import { describe, expect, it } from 'vitest'
import { GymModel } from '../../src/modules/gyms/gym.model.js'
import { MemberModel } from '../../src/modules/members/member.model.js'
import { createGym, createMember, memberBody } from '../support/fixtures.js'

describe('Infraestructura Mongo temporal', () => {
  it('usa base aleatoria de prueba en loopback, inicialmente vacía', async () => {
    expect(mongoose.connection.name).toMatch(/^forgefit_test_[a-f0-9]+$/)
    expect(mongoose.connection.host).toBe('127.0.0.1')
    expect(await GymModel.countDocuments()).toBe(0)
    await createGym('No debe sobrevivir a otra prueba')
  })

  it('cada prueba empieza limpia y conserva los índices reales', async () => {
    expect(await GymModel.countDocuments()).toBe(0)
    const gym = await createGym()
    const original = await createMember(gym._id, { dni: '12345678' })
    await expect(createMember(gym._id, { dni: original.dni })).rejects.toMatchObject({ code: 11000 })
    const otherGym = await createGym()
    await expect(createMember(otherGym._id, { dni: original.dni })).resolves.toBeDefined()
  })

  it('soporta rollback real de transacciones', async () => {
    const gym = await createGym()
    const session = await mongoose.startSession()
    try {
      await expect(session.withTransaction(async () => {
        await MemberModel.create([{ ...memberBody(), gymId: gym._id }], { session })
        throw new Error('Rollback intencional de prueba')
      })).rejects.toThrow('Rollback intencional')
      expect(await MemberModel.countDocuments()).toBe(0)
    } finally {
      await session.endSession()
    }
  })
})
