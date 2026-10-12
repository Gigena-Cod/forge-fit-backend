import mongoose from 'mongoose'
import { env } from './env.js'
let connectionPromise: Promise<typeof mongoose> | undefined

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME })
      .then(connection => {
        console.log(`MongoDB connected to database ${env.MONGO_DB_NAME}`)
        return connection
      })
      .finally(() => { connectionPromise = undefined })
  }
  await connectionPromise
}
