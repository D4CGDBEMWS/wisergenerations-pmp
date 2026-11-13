import { isDemoMode } from '@/lib/flags'

/**
 * A persistent, unmissable statement that nothing here is real.
 *
 * Founder instruction: do not claim the platform is already operating. A
 * local preview full of plausible listings is exactly how that claim gets
 * made by accident — in a screenshot, in a demo, in a slide. So the banner is
 * not dismissible and is not styled to be ignored.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null
  return (
    <div role="status" className="bg-gold-pale px-4 py-2 text-center text-xs font-semibold text-gold-text">
      Demonstration preview — fictional sample data. VillageTrade is in development and is not yet
      accepting members or bookings.
    </div>
  )
}
