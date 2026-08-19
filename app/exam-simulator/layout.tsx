import { requireEntitlement } from '@/lib/auth/guard'
import { STUDY_ACCESS } from '@/lib/entitlements'

// Server-side authorization boundary for Study Access. A request that gets
// past middleware still renders nothing here without a valid session AND a
// live entitlement — requireEntitlement redirects otherwise.
export default async function StudyAccessLayout({ children }: { children: React.ReactNode }) {
  await requireEntitlement(STUDY_ACCESS)
  return <>{children}</>
}
