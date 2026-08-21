import { Schema, model, type InferSchemaType } from 'mongoose'
const memberSchema = new Schema({ gymId: { type: Schema.Types.ObjectId, ref: 'Gym', required: true, index: true }, name: { type: String, required: true }, dni: { type: String, required: true }, birthDate: Date, phone: { type: String, required: true }, email: { type: String, required: true }, registrationDate: { type: Date, required: true }, membershipStatus: { type: String, enum: ['ACTIVE', 'INACTIVE'], required: true } }, { timestamps: true })
memberSchema.index({ gymId: 1, dni: 1 }, { unique: true })
export type MemberDocument = InferSchemaType<typeof memberSchema>
export const MemberModel = model('Member', memberSchema)
