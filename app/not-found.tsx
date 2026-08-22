import { isEnabled } from '@/lib/flags'
import { NotFoundView } from '@/components/NotFoundView'

// Read per request. The flag decides which recovery navigation is shown, and
// a statically generated 404 would bake in whatever it said at build time —
// so LIAP going live would not change this page until the next deploy.
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return <NotFoundView liapEnabled={isEnabled('LIAP')} />
}
