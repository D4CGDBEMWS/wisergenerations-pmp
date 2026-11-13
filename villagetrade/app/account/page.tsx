import { Card, Prose } from '@/components/ui'
import { isEnabled } from '@/lib/flags'

export const metadata = { title: 'Account — VillageTrade' }

export default function AccountPage() {
  // Authentication is architected but not wired to a provider. The flag is
  // off, so this shell states the position rather than pretending to sign
  // anybody in.
  const authReady = isEnabled('VT_AUTH')

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Account</h1>
      <div className="mt-5">
        <Card>
          <p className="font-bold text-navy">
            {authReady ? 'Sign in' : 'Accounts are not open yet'}
          </p>
          <Prose>
            <p>
              VillageTrade is in development. Registration, identity verification and bookings are
              being built, and no account can be created today.
            </p>
          </Prose>
        </Card>
      </div>
    </div>
  )
}
