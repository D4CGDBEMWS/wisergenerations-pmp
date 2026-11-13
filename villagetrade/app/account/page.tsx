import { Card, Prose, Button, SectionHeading, Badge } from '@/components/ui'
import { Field, inputClass } from '@/components/Field'
import { isEnabled } from '@/lib/flags'
import { COBB_COUNTY_ZIPS } from '@/lib/geography'

export const metadata = { title: 'Account — VillageTrade' }

export default function AccountPage() {
  const authReady = isEnabled('VT_AUTH')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Your account</h1>

      {!authReady && (
        <div className="mt-5 rounded-xl border border-gold bg-gold-pale p-4">
          <p className="text-sm font-bold text-gold-text">Sign-in is not switched on yet</p>
          <p className="mt-1 text-sm leading-relaxed text-gold-text">
            The form below is the real interface and validates as it will on launch, but no account
            is created and nothing is saved. VillageTrade is in development.
          </p>
        </div>
      )}

      <section className="mt-6" aria-labelledby="signin-heading">
        <SectionHeading id="signin-heading">Sign in</SectionHeading>
        <div className="mt-3">
          <Card>
            <Prose>
              <p>
                We send a one-time link to your email. There is no password to remember or lose.
              </p>
            </Prose>
            <form>
              <Field
                id="email"
                label="Email address"
                hint="We never show your email on a listing."
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  disabled={!authReady}
                  className={inputClass}
                />
              </Field>
              <div className="mt-4">
                <Button type="submit" disabled={!authReady}>
                  Email me a sign-in link
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="profile-heading">
        <SectionHeading id="profile-heading">Your profile</SectionHeading>
        <p className="mt-2 text-sm text-muted">
          Neighbours see your display name and your ZIP code. They never see your email, your phone
          number or your address.
        </p>
        <div className="mt-3">
          <Card>
            <form>
              <Field
                id="displayName"
                label="Display name"
                hint="What neighbours see. A first name and last initial is plenty."
              >
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="nickname"
                  maxLength={60}
                  placeholder="Dana R."
                  disabled={!authReady}
                  className={inputClass}
                />
              </Field>

              <Field
                id="zip"
                label="Your ZIP code"
                hint="VillageTrade is open in Cobb County, Georgia only."
              >
                <select id="zip" name="zip" defaultValue="" disabled={!authReady} className={inputClass}>
                  <option value="">Choose your ZIP</option>
                  {COBB_COUNTY_ZIPS.map((z) => (
                    <option key={z.zip} value={z.zip}>
                      {z.zip} — {z.city}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="mt-5">
                <Button type="submit" disabled={!authReady}>
                  Save profile
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="verify-heading">
        <SectionHeading id="verify-heading">Identity verification</SectionHeading>
        <div className="mt-3">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">Not started</Badge>
            </div>
            <Prose>
              <p>
                Verification is handled by an outside provider. VillageTrade never receives or
                stores a copy of your ID — only the provider’s yes or no.
              </p>
              <p>
                Verification reduces anonymity. It does not guarantee anyone’s safety or conduct.
              </p>
            </Prose>
          </Card>
        </div>
      </section>
    </div>
  )
}
