import { AttendanceModel } from './attendance.model.js'
import { objectId } from '../../shared/utils/mongo.js'
import { MemberModel } from '../members/member.model.js'

export const attendanceRepository = {
  findAllByGymId: (gymId: string) => AttendanceModel.find({ gymId: objectId(gymId) }).populate('memberId', 'name').sort({ entryAt: -1, _id: -1 }).lean(),
  findByMember: (memberId: string, gymId: string) => AttendanceModel.find({ memberId: objectId(memberId), gymId: objectId(gymId) }).sort({ entryAt: -1, _id: -1 }).lean(),
  async findPage(gymId: string, page: number, limit: number, memberId?: string, q?: string) { const filter: any = { gymId: objectId(gymId), ...(memberId ? { memberId: objectId(memberId) } : {}) }; if(q){const r=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');const ids=await MemberModel.find({gymId:objectId(gymId),name:r}).distinct('_id');filter.$or=[{memberId:{$in:ids}},{status:r}]}; const [items, total] = await Promise.all([AttendanceModel.find(filter).populate('memberId', 'name').sort({ entryAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), AttendanceModel.countDocuments(filter)]); return { items, total } },
  findByRequestId: (gymId: string, requestId: string) => AttendanceModel.findOne({ gymId: objectId(gymId), requestId }).lean(),
  create: (gymId: string, memberId: string, data: { entryAt: Date; status: 'ALLOWED'; requestId: string }) => AttendanceModel.create({ ...data, gymId: objectId(gymId), memberId: objectId(memberId) }),
}
