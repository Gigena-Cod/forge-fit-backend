import { AttendanceModel } from './attendance.model.js'; import { objectId } from '../../shared/utils/mongo.js'
export const attendanceRepository={findAllByGymId:(g:string)=>AttendanceModel.find({gymId:objectId(g)}).populate('memberId','name').sort({entryAt:-1}).lean(),findByMember:(m:string,g:string)=>AttendanceModel.find({memberId:objectId(m),gymId:objectId(g)}).sort({entryAt:-1}).lean()}
