export type MembershipStatus = 'ACTIVE' | 'INACTIVE'
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'MISSING' | 'CONFLICT'
export function decideAccess(membershipStatus: MembershipStatus, paymentStatus: PaymentStatus) {
  if (membershipStatus !== 'ACTIVE') return { allowed: false, reason: 'MEMBER_INACTIVE' as const }
  if (paymentStatus !== 'PAID') return { allowed: false, reason: paymentStatus === 'MISSING' ? 'PAYMENT_MISSING' as const : `PAYMENT_${paymentStatus}` as const }
  return { allowed: true, reason: 'VALID_PAYMENT' as const }
}
