import { PaymentModel } from './payment.model.js'
import { objectId } from '../../shared/utils/mongo.js'

const active = { $ne: 'VOID' }
export const paymentRepository = {
  findAllByGymId: (gymId: string) => PaymentModel.find({ gymId: objectId(gymId), recordStatus: active }).populate('memberId', 'name').lean(),
  findByIdAndGymId: (id: string, gymId: string) => PaymentModel.findOne({ _id: objectId(id), gymId: objectId(gymId) }).lean(),
  findByMember: (memberId: string, gymId: string) => PaymentModel.find({ memberId: objectId(memberId), gymId: objectId(gymId), recordStatus: active }).lean(),
  findForPeriod: (memberId: string, gymId: string, period: string) => PaymentModel.find({ memberId: objectId(memberId), gymId: objectId(gymId), period, recordStatus: active }).lean(),
  create: (gymId: string, data: any) => PaymentModel.create({ ...data, gymId: objectId(gymId), memberId: objectId(data.memberId), recordStatus: 'ACTIVE' }),
  update: (id: string, gymId: string, data: any) => PaymentModel.findOneAndUpdate({ _id: objectId(id), gymId: objectId(gymId), recordStatus: active }, { ...data, memberId: objectId(data.memberId) }, { new: true, runValidators: true }).lean(),
  void: (id: string, gymId: string, userId: string, reason: string) => PaymentModel.findOneAndUpdate({ _id: objectId(id), gymId: objectId(gymId), recordStatus: active }, { recordStatus: 'VOID', voidedAt: new Date(), voidedByUserId: objectId(userId), voidReason: reason }, { new: true }).lean(),
}
