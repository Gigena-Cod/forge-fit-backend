import { Schema, model, type InferSchemaType } from 'mongoose'
const paymentSchema = new Schema({ gymId: { type: Schema.Types.ObjectId, ref: 'Gym', required: true, index: true }, memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true }, period: { type: String, required: true }, amount: { type: Number, required: true }, paymentDate: Date, status: { type: String, enum: ['PAID', 'PENDING', 'OVERDUE'], required: true }, paymentMethod: { type: String, enum: ['CASH', 'TRANSFER', 'CARD'] }, recordStatus: { type: String, enum: ['ACTIVE', 'VOID'], default: 'ACTIVE', required: true }, voidedAt: Date, voidedByUserId: Schema.Types.ObjectId, voidReason: String, replacesPaymentId: Schema.Types.ObjectId }, { timestamps: true })
paymentSchema.index({ gymId: 1, memberId: 1 })
export type PaymentDocument = InferSchemaType<typeof paymentSchema>
export const PaymentModel = model('Payment', paymentSchema)
