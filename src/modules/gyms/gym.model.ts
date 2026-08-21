import { Schema, model, type InferSchemaType } from 'mongoose'
const gymSchema = new Schema({ name: { type: String, required: true }, address: { type: String, required: true }, phone: { type: String, required: true }, contactEmail: { type: String, required: true } }, { timestamps: true })
export type GymDocument = InferSchemaType<typeof gymSchema>
export const GymModel = model('Gym', gymSchema)
