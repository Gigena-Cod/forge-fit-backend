import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { afterAll, beforeAll, beforeEach } from 'vitest'

// This setup runs before test files import app/env. Never inherit a real URI.
const databaseName = `forgefit_test_${randomUUID().replaceAll('-', '')}`
process.env.NODE_ENV = 'test'
process.env.DOTENV_CONFIG_PATH = resolve('tests/.env.unused')
process.env.MONGO_URI = 'mongodb://127.0.0.1:1/test_not_started'
process.env.MONGO_DB_NAME = databaseName
process.env.JWT_SECRET = 'forgefit-integration-only-secret-not-for-deployment'
process.env.JWT_EXPIRES_IN = '1h'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.PORT = '0'

let replicaSet: MongoMemoryReplSet | undefined
let ownedUri: string | undefined

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) throw new Error('Tests require a disconnected Mongoose instance')
  replicaSet = await MongoMemoryReplSet.create({
    binary: { version: '8.2.6' },
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  })
  ownedUri = replicaSet.getUri(databaseName)
  process.env.MONGO_URI = ownedUri
  await mongoose.connect(ownedUri, { dbName: databaseName })
  // Build indexes before fixtures/requests; keep them across tests.
  await Promise.all(Object.values(mongoose.models).map(model => model.init()))
})

beforeEach(async () => {
  const { connection } = mongoose
  if (!ownedUri || connection.name !== databaseName || connection.host !== '127.0.0.1') {
    throw new Error('Refusing cleanup outside the temporary test database')
  }
  await Promise.all(Object.values(connection.collections).map(collection => collection.deleteMany({})))
})

afterAll(async () => {
  try {
    if (ownedUri) await mongoose.disconnect()
  } finally {
    await replicaSet?.stop()
  }
})
