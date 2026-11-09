import { MemberModel } from './member.model.js'
import { objectId } from '../../shared/utils/mongo.js'

const memberFilter = (id: string, gymId: string) => ({ _id: objectId(id), gymId: objectId(gymId) })

export const memberRepository = {
  findAllByGymId: (gymId: string) => MemberModel.find({ gymId: objectId(gymId) }).lean(),
  findByIdAndGymId: (id: string, gymId: string) => MemberModel.findOne(memberFilter(id, gymId)).lean(),
  findByIdWithQr: (id: string, gymId: string) => MemberModel.findOne(memberFilter(id, gymId)).select('+qrPayload +qrDigest').lean(),
  findWithQr: (digest: string, gymId: string) => MemberModel.findOne({ qrDigest: digest, gymId: objectId(gymId) }).select('+qrPayload').lean(),
  create: (gymId: string, data: any) => MemberModel.create({ ...data, gymId: objectId(gymId) }),
  update: (id: string, gymId: string, data: any) => MemberModel.findOneAndUpdate(memberFilter(id, gymId), data, { new: true, runValidators: true }).lean(),
  setStatus: (id: string, gymId: string, status: string) => MemberModel.findOneAndUpdate(memberFilter(id, gymId), { membershipStatus: status }, { new: true, runValidators: true }).lean(),
  delete: (id: string, gymId: string) => MemberModel.findOneAndUpdate(memberFilter(id, gymId), { membershipStatus: 'INACTIVE' }, { new: true }).lean(),
  issueFirstQr: (id: string, gymId: string, data: any) => MemberModel.findOneAndUpdate(
    { ...memberFilter(id, gymId), $or: [{ qrPayload: { $exists: false } }, { qrPayload: null }] },
    { $set: data },
    { new: true, runValidators: true },
  ).select('+qrPayload +qrDigest').lean(),
  rotateQr: (id: string, gymId: string, data: any) => MemberModel.findOneAndUpdate(
    memberFilter(id, gymId),
    { $set: data },
    { new: true, runValidators: true },
  ).select('+qrPayload +qrDigest').lean(),
}
