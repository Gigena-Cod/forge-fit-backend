import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto'
import { env } from '../../config/env.js'

const key = createHash('sha256').update(env.SESSION_ENCRYPTION_KEY).digest()
export const hashRefresh = (value: string) => createHash('sha256').update(value).digest('hex')
export const newRefresh = () => randomBytes(48).toString('base64url')
export const newSessionId = () => randomUUID()

export function encryptCookie(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`
}

export function decryptCookie(value?: string) {
  if (!value) return undefined
  try {
    const [iv, tag, ciphertext] = value.split('.')
    if (!iv || !tag || !ciphertext) return undefined
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
  } catch { return undefined }
}
