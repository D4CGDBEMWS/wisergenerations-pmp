import Link from 'next/link'
import { Card, Prose, Button, SectionHeading } from '@/components/ui'
import { Field, inputClass } from '@/components/Field'
import { isEnabled } from '@/lib/flags'
import { COBB_COUNTY_ZIPS } from '@/lib/geography'
import { DEMO_CATEGORIES } from '@/lib/demo'
import { SAFETY_MESSAGE } from '@/lib/safety'

export const metadata = { title: 'Post a listing — VillageTrade' }

export default function NewListingPage() {
  const ready = isEnabled('VT_LISTINGS')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Post a listing</h1>

      {!ready && (
        <div className="mt-5 rounded-xl border border-gold bg-gold-pale p-4">
          <p className="text-sm font-bold text-gold-text">Listings are not open yet</p>
          <p className="mt-1 text-sm leading-relaxed text-gold-text">
            This is the real form. Nothing is saved and no listing is created.
          </p>
        </div>
      )}

      <form className="mt-6">
        <Card>
          <Field id="title" label="Title" hint="What you are offering, in a few words.">
            <input
              id="title" name="title" type="text" maxLength={120} disabled={!ready}
              placeholder="Yard clean-up and leaf removal" className={inputClass}
            />
          </Field>

          <Field
            id="body"
            label="Description"
            hint="Please do not include your phone number, email or address — listings are public. You will share those privately once a booking is confirmed."
          >
            <textarea
              id="body" name="body" rows={5} maxLength={4000} disabled={!ready}
              className={`${inputClass} py-2`}
            />
          </Field>

          <fieldset className="mt-4">
            <legend className="text-sm font-bold text-navy">What is it?</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {[
                { v: 'service', l: 'A service I can do' },
                { v: 'item', l: 'An item I have' },
              ].map((o) => (
                <label key={o.v} className="flex min-h-[44px] items-center gap-2 text-sm">
                  <input type="radio" name="kind" value={o.v} disabled={!ready} className="h-5 w-5" />
                  {o.l}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-sm font-bold text-navy">How would you like to be paid?</legend>
            <div className="mt-2 flex flex-col gap-2">
              {[
                { v: 'paid', l: 'Payment' },
                { v: 'barter', l: 'Barter — a trade of goods or services' },
                { v: 'combined', l: 'Combined payment and barter' },
              ].map((o) => (
                <label key={o.v} className="flex min-h-[44px] items-center gap-2 text-sm">
                  <input type="radio" name="offerType" value={o.v} disabled={!ready} className="h-5 w-5" />
                  {o.l}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              VillageTrade records what you and your neighbour agree. It does not collect, hold or
              transfer money — any payment is arranged directly between you.
            </p>
          </fieldset>

          <Field id="category" label="Category">
            <select id="category" name="categorySlug" defaultValue="" disabled={!ready} className={inputClass}>
              <option value="">Choose a category</option>
              {DEMO_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field id="listingZip" label="ZIP code" hint="Where you are offering this.">
            <select id="listingZip" name="zip" defaultValue="" disabled={!ready} className={inputClass}>
              <option value="">Choose a ZIP</option>
              {COBB_COUNTY_ZIPS.map((z) => (
                <option key={z.zip} value={z.zip}>{z.zip} — {z.city}</option>
              ))}
            </select>
          </Field>

          <div className="mt-6 rounded-xl border border-gold bg-gold-pale p-3">
            <p className="text-sm font-bold text-gold-text">{SAFETY_MESSAGE}</p>
            <p className="mt-1 text-xs leading-relaxed text-gold-text">
              By posting you agree to the{' '}
              <Link href="/safety" className="underline underline-offset-2">conduct standard</Link>.
            </p>
          </div>

          <div className="mt-5">
            <Button type="submit" disabled={!ready}>Post listing</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
