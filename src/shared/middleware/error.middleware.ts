import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors/AppError.js'
export const notFoundMiddleware: RequestHandler = (_req, res) => { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }) }
export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => { if (error instanceof AppError) { res.status(error.status).json({ error: { code: error.code, message: error.message } }); return } if (error instanceof ZodError) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' } }); return } console.error(error); res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }) }
