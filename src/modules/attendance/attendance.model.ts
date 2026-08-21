import { Schema, model, type InferSchemaType } from 'mongoose'
const attendanceSchema = new Schema({ gymId: { type: Schema.Types.ObjectId, ref: 'Gym', required: true, index: true }, memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true }, entryAt: { type: Date, required: true, index: true }, status: { type: String, enum: ['ALLOWED', 'REJECTED'], required: true } }, { timestamps: true })
attendanceSchema.index({ gymId: 1, memberId: 1 })
export type AttendanceDocument = InferSchemaType<typeof attendanceSchema>
export const AttendanceModel = model('Attendance', attendanceSchema)
