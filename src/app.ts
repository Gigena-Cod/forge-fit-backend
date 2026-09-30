import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { memberRouter } from './modules/members/member.routes.js'
import { paymentRouter } from './modules/payments/payment.routes.js'
import { attendanceRouter } from './modules/attendance/attendance.routes.js'
import { settingsRouter } from './modules/settings/settings.routes.js'
import { userRouter } from './modules/users/user.routes.js'
import { roleRouter } from './modules/roles/role.routes.js'
import { reportRouter } from './modules/reports/report.routes.js'
import { errorMiddleware, notFoundMiddleware } from './shared/middleware/error.middleware.js'
export const app = express()
app.use(cors({ origin: env.FRONTEND_URL }))
app.use(express.json())
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRouter); app.use('/api/members', memberRouter); app.use('/api/payments', paymentRouter); app.use('/api/attendance', attendanceRouter); app.use('/api/settings', settingsRouter); app.use('/api/users', userRouter); app.use('/api/roles', roleRouter); app.use('/api/reports', reportRouter)
app.use(notFoundMiddleware); app.use(errorMiddleware)
