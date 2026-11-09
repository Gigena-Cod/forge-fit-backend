import 'dotenv/config'
import { z } from 'zod'
const schema = z.object({ PORT: z.coerce.number().default(3000), MONGO_URI: z.string().min(1), MONGO_DB_NAME: z.string().min(1).default('forgefit'), JWT_SECRET: z.string().min(32), JWT_EXPIRES_IN: z.string().default('1d'), SESSION_ENCRYPTION_KEY: z.string().min(32).optional(), SESSION_ACCESS_EXPIRES_IN: z.string().default('15m'), SESSION_REFRESH_DAYS: z.coerce.number().int().min(1).max(30).default(7), FRONTEND_URL: z.string().url() })
const parsed = schema.parse(process.env)
export const env = { ...parsed, SESSION_ENCRYPTION_KEY: parsed.SESSION_ENCRYPTION_KEY ?? parsed.JWT_SECRET }
