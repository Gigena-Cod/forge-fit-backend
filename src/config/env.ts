import 'dotenv/config'
import { z } from 'zod'
const schema = z.object({ PORT: z.coerce.number().default(3000), MONGO_URI: z.string().min(1), MONGO_DB_NAME: z.string().min(1).default('forgefit'), JWT_SECRET: z.string().min(32), JWT_EXPIRES_IN: z.string().default('1d'), FRONTEND_URL: z.string().url() })
export const env = schema.parse(process.env)
