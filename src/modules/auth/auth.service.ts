import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors/AppError.js'
import { authRepository, maxRefreshRotations } from './auth.repository.js'
import { hashRefresh, newRefresh, newSessionId } from './session.crypto.js'

const publicData = (user: any, gym: any) => ({ user: { id: user._id.toString(), fullName: user.fullName, email: user.email, role: user.role }, gym: { id: gym._id.toString(), name: gym.name } })
function newCredentials() {
  return {
    sessionId: newSessionId(),
    refresh: newRefresh(),
    expiresAt: new Date(Date.now() + env.SESSION_REFRESH_DAYS * 86_400_000),
  }
}

function access(user: any, gym: any, sessionId: string, expiresAt: Date) {
  const payload = { userId: user._id.toString(), gymId: gym._id.toString(), role: user.role, authVersion: user.authVersion ?? 0, sessionId }
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.SESSION_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
  const { exp } = jwt.decode(token) as { exp: number }
  const sessionExpiry = Math.floor(expiresAt.getTime() / 1000)
  return exp <= sessionExpiry ? token : jwt.sign({ ...payload, exp: sessionExpiry }, env.JWT_SECRET)
}

type Registration = {
  gym: { name: string; address: string; phone: string; contactEmail: string }
  administrator: { fullName: string; dni: string; phone: string; email: string; password: string }
}

export const authService = {
  async register(input: Registration) {
    if (await authRepository.findByEmail(input.administrator.email)) {
      throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'Email already exists')
    }
    const passwordHash = await bcrypt.hash(input.administrator.password, 12)
    const { sessionId, refresh, expiresAt } = newCredentials()
    const { user, gym } = await authRepository.createGymAndOwner({ sessionId, refreshHash: hashRefresh(refresh), expiresAt }, {
      gym: input.gym,
      administrator: { ...input.administrator, passwordHash },
    })
    return { ...publicData(user, gym), access: access(user, gym, sessionId, expiresAt), refresh, expiresAt }
  },
  async login(input: { email: string; password: string }) {
    const user = await authRepository.findByEmail(input.email)
    if (!user || user.accountStatus !== 'ACTIVE' || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password')
    }
    const gym = user.gymId
    const { sessionId, refresh, expiresAt } = newCredentials()
    const token = access(user, gym, sessionId, expiresAt)
    await authRepository.createSession({
      sessionId, userId: user._id, gymId: gym._id, authVersion: user.authVersion, refreshHash: hashRefresh(refresh), expiresAt,
    })
    return { ...publicData(user, gym), access: token, refresh, expiresAt }
  },
  async refresh(refresh: string, expectedSessionId?: string) {
    const hash = hashRefresh(refresh); const current = await authRepository.findSessionByCurrentRefresh(hash)
    if (!current || current.revokedAt || current.expiresAt <= new Date()) { const reused = await authRepository.findSessionByConsumedRefresh(hash); if (reused) await authRepository.revokeSession(reused._id.toString()); throw new AppError('SESSION_EXPIRED', 401, 'Session expired') }
    if (expectedSessionId && expectedSessionId !== current.sessionId) throw new AppError('SESSION_CHANGED', 409, 'Session changed')
    const user = await authRepository.findById(current.userId.toString())
    if (!user || user.accountStatus !== 'ACTIVE' || user.authVersion !== current.authVersion) { await authRepository.revokeSession(current._id.toString()); throw new AppError('SESSION_EXPIRED', 401, 'Session expired') }
    if (current.consumedRefreshHashes.length >= maxRefreshRotations) {
      await authRepository.revokeSession(current._id.toString())
      throw new AppError('SESSION_EXPIRED', 401, 'Session expired')
    }
    const next = newRefresh(); const rotated = await authRepository.rotateSession(current._id.toString(), hash, { refreshHash: hashRefresh(next), authVersion: user.authVersion })
    if (!rotated) { const reused = await authRepository.findSessionByConsumedRefresh(hash); if (reused) await authRepository.revokeSession(reused._id.toString()); throw new AppError('SESSION_EXPIRED', 401, 'Session expired') }
    return { access: access(user, user.gymId, current.sessionId, current.expiresAt), refresh: next, expiresAt: current.expiresAt }
  },
  async logout(refresh?: string, expectedSessionId?: string) {
    if (!refresh) return
    const hash = hashRefresh(refresh)
    const session = await authRepository.findSessionByCurrentRefresh(hash) ?? await authRepository.findSessionByConsumedRefresh(hash)
    if (!session) return
    if (expectedSessionId && expectedSessionId !== session.sessionId) {
      throw new AppError('SESSION_CHANGED', 409, 'Session changed')
    }
    await authRepository.revokeSession(session._id.toString())
  },
  async me(userId: string, sessionId?: string) { const user = await authRepository.findById(userId); if (!user || user.accountStatus === 'INACTIVE') throw new AppError('UNAUTHORIZED', 401, 'Invalid token'); const gym = user.gymId as any; return { user: { id: user._id.toString(), fullName: user.fullName, dni: user.dni, phone: user.phone, email: user.email, role: user.role, accountStatus: user.accountStatus }, gym: { id: gym._id.toString(), name: gym.name }, ...(sessionId ? { sessionId } : {}) } },
}
