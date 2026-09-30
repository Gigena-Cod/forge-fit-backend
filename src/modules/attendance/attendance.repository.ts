import { AttendanceModel } from './attendance.model.js'
import { objectId } from '../../shared/utils/mongo.js'

export const attendanceRepository = {
  findAllByGymId: (gymId: string) => AttendanceModel.find({ gymId: objectId(gymId) }).populate('memberId', 'name').sort({ entryAt: -1 }).lean(),
  findByMember: (memberId: string, gymId: string) => AttendanceModel.find({ memberId: objectId(memberId), gymId: objectId(gymId) }).sort({ entryAt: -1 }).lean(),
  findByRequestId: (gymId: string, requestId: string) => AttendanceModel.findOne({ gymId: objectId(gymId), requestId }).lean(),
  create: (gymId: string, memberId: string, data: { entryAt: Date; status: 'ALLOWED'; requestId: string }) => AttendanceModel.create({ ...data, gymId: objectId(gymId), memberId: objectId(memberId) }),
}
