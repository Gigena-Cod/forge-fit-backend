import { PaymentModel } from './payment.model.js'
import { objectId } from '../../shared/utils/mongo.js'
import { MemberModel } from '../members/member.model.js'

const active = { $ne: 'VOID' }
const sortStages = [
  { $addFields: { sortDate: { $ifNull: ['$paymentDate', '$createdAt'] } } },
  { $sort: { sortDate: -1 as const, _id: -1 as const } },
]
const memberStage = [
  {
    $lookup: {
      from: MemberModel.collection.name,
      let: { memberId: '$memberId', paymentGymId: '$gymId' },
      pipeline: [
        { $match: { $expr: { $and: [{ $eq: ['$_id', '$$memberId'] }, { $eq: ['$gymId', '$$paymentGymId'] }] } } },
        { $project: { _id: 1, name: 1 } },
      ],
      as: 'member',
    },
  },
  { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
  { $set: { memberId: { $ifNull: ['$member', '$memberId'] } } },
  { $project: { member: 0, sortDate: 0 } },
]
const literal = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const displayedStatuses = (query: string) => {
  const normalized = query.toLocaleLowerCase('es-AR')
  return ([['PAID', 'pagado'], ['PENDING', 'pendiente'], ['OVERDUE', 'vencido']] as const)
    .filter(([, label]) => label.includes(normalized))
    .map(([status]) => status)
}

async function listFilter(gymId: string, q?: string) {
  const filter: Record<string, unknown> = { gymId: objectId(gymId), recordStatus: active }
  if (!q) return filter
  const expression = new RegExp(literal(q), 'i')
  const [memberIds, statuses] = await Promise.all([
    MemberModel.find({ gymId: objectId(gymId), name: expression }).distinct('_id'),
    Promise.resolve(displayedStatuses(q)),
  ])
  filter.$or = [
    { memberId: { $in: memberIds } },
    { period: expression },
    ...(statuses.length ? [{ status: { $in: statuses } }] : []),
  ]
  return filter
}

export const paymentRepository = {
  async findAllByGymId(gymId: string) {
    return PaymentModel.aggregate([{ $match: await listFilter(gymId) }, ...sortStages, ...memberStage])
  },
  async findPageByGymId(gymId: string, page: number, limit: number, q?: string) {
    const filter = await listFilter(gymId, q)
    const [result] = await PaymentModel.aggregate([
      { $match: filter },
      ...sortStages,
      {
        $facet: {
          items: [{ $skip: (page - 1) * limit }, { $limit: limit }, ...memberStage],
          metadata: [{ $count: 'total' }],
        },
      },
    ])
    return { items: result?.items ?? [], total: result?.metadata[0]?.total ?? 0 }
  },
  findByIdAndGymId: (id: string, gymId: string) => PaymentModel.findOne({ _id: objectId(id), gymId: objectId(gymId) }).lean(),
  findByMember: (memberId: string, gymId: string) => PaymentModel.find({ memberId: objectId(memberId), gymId: objectId(gymId), recordStatus: active }).lean(),
  findForPeriod: (memberId: string, gymId: string, period: string) => PaymentModel.find({ memberId: objectId(memberId), gymId: objectId(gymId), period, recordStatus: active }).lean(),
  create: (gymId: string, data: any) => PaymentModel.create({ ...data, gymId: objectId(gymId), memberId: objectId(data.memberId), recordStatus: 'ACTIVE' }),
  update: (id: string, gymId: string, data: any) => PaymentModel.findOneAndUpdate({ _id: objectId(id), gymId: objectId(gymId), recordStatus: active }, { ...data, memberId: objectId(data.memberId) }, { new: true, runValidators: true }).lean(),
  void: (id: string, gymId: string, userId: string, reason: string) => PaymentModel.findOneAndUpdate({ _id: objectId(id), gymId: objectId(gymId), recordStatus: active }, { recordStatus: 'VOID', voidedAt: new Date(), voidedByUserId: objectId(userId), voidReason: reason }, { new: true }).lean(),
}
