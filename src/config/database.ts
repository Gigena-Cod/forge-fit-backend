import mongoose from 'mongoose'
import { env } from './env.js'
export async function connectDatabase() { await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME }); console.log(`MongoDB connected to database ${env.MONGO_DB_NAME}`) }
