import { app } from './app.js'
import { env } from './config/env.js'
import { connectDatabase } from './config/database.js'
connectDatabase().then(() => app.listen(env.PORT, () => console.log(`ForgeFit API listening on port ${env.PORT}`))).catch((error) => { console.error('MongoDB connection failed', error); process.exit(1) })
