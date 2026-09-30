import { describe, expect, it } from 'vitest'
import { decideAccess } from './access.js'
import { hasPermission } from './permissions.js'

describe('ForgeFit casos de uso', () => {
  it('rechaza socio inactivo aunque tenga pago', () => expect(decideAccess('INACTIVE','PAID')).toEqual({ allowed:false, reason:'MEMBER_INACTIVE' }))
  it('rechaza socio activo sin cuota', () => expect(decideAccess('ACTIVE','MISSING')).toEqual({ allowed:false, reason:'PAYMENT_MISSING' }))
  it('rechaza cuota vencida', () => expect(decideAccess('ACTIVE','OVERDUE')).toEqual({ allowed:false, reason:'PAYMENT_OVERDUE' }))
  it('autoriza socio activo con cuota paga', () => expect(decideAccess('ACTIVE','PAID')).toEqual({ allowed:true, reason:'VALID_PAYMENT' }))
  it('permite check-in a recepción y limita reportes', () => { expect(hasPermission('RECEPTIONIST','attendance:check-in')).toBe(true); expect(hasPermission('RECEPTIONIST','reports:read')).toBe(false) })
  it('permite reportes a administrador y administración de usuarios a propietario', () => { expect(hasPermission('ADMIN','reports:read')).toBe(true); expect(hasPermission('OWNER','users:write')).toBe(true) })
  it('deniega permisos desconocidos por defecto', () => expect(hasPermission('ADMIN','unknown:action')).toBe(false))
})
