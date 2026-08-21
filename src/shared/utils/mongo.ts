import { Types } from 'mongoose'
import { AppError } from '../errors/AppError.js'
export function objectId(value: string) { if (!Types.ObjectId.isValid(value)) throw new AppError('INVALID_ID', 400, 'Invalid identifier'); return new Types.ObjectId(value) }
export function mapDocument<T extends { _id: Types.ObjectId; __v?: number }>(document: T) { const { _id, __v, ...data } = document; return { id: _id.toString(), ...data } }
