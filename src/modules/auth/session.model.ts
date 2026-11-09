import { Schema, model } from 'mongoose'

const sessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  gymId: { type: Schema.Types.ObjectId, ref: 'Gym', required: true },
  authVersion: { type: Number, required: true },
  refreshHash: { type: String, required: true },
  consumedRefreshHashes: { type: [String], default: [] },
  revokedAt: Date,
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export const SessionModel = model('Session', sessionSchema)
