import { Schema, model, type InferSchemaType } from 'mongoose'
const userSchema = new Schema({ gymId: { type: Schema.Types.ObjectId, ref: 'Gym', required: true, index: true }, fullName: { type: String, required: true }, dni: { type: String, required: true }, phone: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true }, passwordHash: { type: String, required: true }, role: { type: String, enum: ['OWNER', 'ADMIN'], default: 'OWNER', required: true } }, { timestamps: true })
export type UserDocument = InferSchemaType<typeof userSchema>
export const UserModel = model('User', userSchema)
