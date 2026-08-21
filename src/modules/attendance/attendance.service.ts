import { AppError } from '../../shared/errors/AppError.js'
import { memberRepository } from '../members/member.repository.js'
import { attendanceRepository } from './attendance.repository.js'
export const attendanceService = { list: (gymId: string) => attendanceRepository.findAllByGymId(gymId), async listByMember(memberId: string, gymId: string) { if (!await memberRepository.findByIdAndGymId(memberId, gymId)) throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found'); return attendanceRepository.findByMember(memberId, gymId) } }
