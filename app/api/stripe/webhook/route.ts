import { NextRequest, NextResponse } from 'next/server'
import { claimEvent, markEventProcessed, markEventFailed } from '@/lib/payments/events'
import { queryOne } from '@/lib/db/client'
import { upsertCustomer } from '@/lib/customers'
import {
  grantEntitlement,
  revokeEntitlementsBySource,
  revokeEntitlementsForRefund,
  STUDY_ACCESS,
} from '@/lib/entitlements'
import { identifyCheckoutSession, productGrants } from '@/lib/programs'
import {
  fulfilPreorder,
  fulfilStandaloneAssessment,
  isLiapPreorder,
  isLiapStandaloneAssessment,
} from '@/lib/liap/fulfilment'
import {
  upsertSubscriber,
  deactivateTags,
  normalizeTag as sharedNormalizeTag,
  type MailchimpAddress,
} from '@/lib/mailchimp'
import { creditBookPurchase } from '@/lib/liap/attribution'
import { LIAP_ENTITLEMENT } from '@/lib/liap/product'
import { revokeAllSessionsForCustomer } from '@/lib/auth/session'
import Stripe from 'stripe'

export const runtime = 'nodejs'

function getEnv(name: string) {
    const value = process.env[name]

  if (!value) {
        throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase()
}

// Delegates, so "what is a valid tag" has one definition rather than two that
// drift. Kept as a local name because several call sites below use it.
const normalizeTag = sharedNormalizeTag

// Convert a Stripe Checkout Session address into Mailchimp's ADDRESS merge
// field shape. Returns null if the address is incomplete so callers can
// safely omit the field rather than sending partial data that Mailchimp will
// reject. (We set billing_address_collection: 'required' on the Checkout
// Session so new subscribers always provide a complete address, but we still
// guard against edge cases like partial legacy data.)
//
// USED BY THE PMP PATHS ONLY. The LIAP flow never sends an address: a postal
// address is not needed to segment a book launch, and lib/liap/crm.ts has no
// parameter that could carry one.
function stripeAddressToMailchimp(
    address: Stripe.Address | null | undefined
): MailchimpAddress | null {
    if (!address) return null

  const addr1 = address.line1?.trim() || ''
    const city = address.city?.trim() || ''
    const state = address.state?.trim() || ''
    const zip = address.postal_code?.trim() || ''
    const country = address.country?.trim() || ''

  // All five required sub-fields must be non-empty for Mailchimp's ADDRESS
  // validator to accept the write. If any are missing, return null and the
  // caller will skip the ADDRESS merge field entirely.
  if (!addr1 || !city || !state || !zip || !country) {
        return null
  }

  return {
        addr1,
        addr2: address.line2?.trim() || '',
        city,
        state,
        zip,
        country,
  }
}

/**
 * Mailchimp upsert for the PMP paths.
 *
 * A thin wrapper over the shared client in lib/mailchimp.ts, which replaced a
 * second full implementation that used to live here. Two behaviours from that
 * implementation are preserved as explicit arguments rather than as a separate
 * copy of the code:
 *
 *   - `statusIfNew: 'subscribed'`, because these buyers have always been
 *     enrolled without a confirmation step, and switching them to `pending`
 *     would stop their mail until they re-confirmed.
 *   - the ADDRESS merge field, which the PMP audience uses.
 *
 * Neither applies to LIAP. What HAS changed is that a failure no longer
 * throws: it is logged and the webhook carries on, so a Mailchimp outage can
 * no longer turn a successful payment into a 500 and a Stripe retry storm.
 */
async function upsertMailchimpCustomer(input: {
    email: string
    firstName?: string
    lastName?: string
    tags: string[]
    address?: MailchimpAddress | null
}) {
    const result = await upsertSubscriber({
          email: normalizeEmail(input.email),
          firstName: input.firstName,
          lastName: input.lastName,
          tags: input.tags,
          statusIfNew: 'subscribed',
          address: input.address ?? null,
    })
    if (!result.ok) {
          console.error('[stripe/webhook] Mailchimp sync failed (non-fatal):', result.status)
    }
}

/** Deactivates tags when a subscription ends. Non-fatal, as before. */
async function deactivateMailchimpTags(input: { email: string; tags: string[] }) {
    await deactivateTags({ email: normalizeEmail(input.email), tags: input.tags })
}

function splitFullName(full: string | null | undefined) {
    const trimmed = (full ?? '').trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  return {
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' '),
  }
}

export async function POST(request: NextRequest) {
  // Visible to the catch block: a failed event must have its claim cleared,
  // otherwise the ledger turns a transient error into permanent data loss by
  // treating every Stripe retry as an already-seen duplicate.
  let claimedEventId: string | null = null

    try {
          const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'), { apiVersion: '2025-08-27.basil' })
          const signature = request.headers.get('stripe-signature')
          const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET')

      if (!signature) {
              return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })
      }

      const payload = await request.text()
          const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

      // Signature verification proves the event is authentic. It does NOT
      // prove this is the first copy — Stripe retries on any non-2xx and can
      // replay a delivery that already succeeded. The ledger is that check.
      //
      // Deliberately non-fatal. The Mailchimp tagging below predates this
      // ledger and works without a database; a database outage must not take
      // it down too. If the ledger is unavailable we lose de-duplication for
      // that delivery — Mailchimp's upsert is keyed by email and tolerates a
      // repeat — but we do not lose the behaviour that already worked.
      let ledgerAvailable = true
      try {
        const claim = await claimEvent({ eventId: event.id, eventType: event.type })
        claimedEventId = event.id
        if (!claim.isFirstDelivery) {
          // 200 so Stripe stops retrying something already handled.
          return NextResponse.json({ received: true, duplicate: true })
        }
      } catch (ledgerErr) {
        ledgerAvailable = false
        console.error(
          '[stripe/webhook] idempotency ledger unavailable; continuing without de-duplication.',
          ledgerErr
        )
      }

      // ─────────────────────────────────────────────────────────────────
      // 1. One-time program purchases (PMP, CAPM, Veterans) — existing
      // ─────────────────────────────────────────────────────────────────
      if (event.type === 'payment_intent.succeeded') {
              const paymentIntent = event.data.object as Stripe.PaymentIntent
              const programId = paymentIntent.metadata.program_id || 'program'
              const programName = paymentIntent.metadata.program_name || programId

              // SECURITY: customer email/name no longer come from PaymentIntent
              // metadata (which would surface in every event payload and the
              // Stripe dashboard search). We retrieve the Customer record on
              // demand and read identity fields from there.
              let customerEmail = paymentIntent.receipt_email || ''
              let customerName = ''

              if (paymentIntent.customer && typeof paymentIntent.customer === 'string') {
                      try {
                                const customer = await stripe.customers.retrieve(paymentIntent.customer)
                                if (!customer.deleted) {
                                            customerEmail = customer.email || customerEmail
                                            customerName = customer.name || ''
                                }
                      } catch (err) {
                                console.error('[stripe webhook] customer retrieve failed:', err)
                      }
              }

              const email = normalizeEmail(customerEmail)

              if (email) {
                      // Stripe stores name as a single string. Split on the first
                      // space for Mailchimp's FNAME / LNAME merge fields. Edge
                      // cases like "Maria de la Cruz" become FNAME="Maria",
                      // LNAME="de la Cruz", which is acceptable for marketing.
                      const trimmed = customerName.trim()
                      const firstSpace = trimmed.indexOf(' ')
                      const firstName = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)
                      const lastName = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1)

                await upsertMailchimpCustomer({
                            email,
                            firstName,
                            lastName,
                            tags: ['customer', normalizeTag(programId), normalizeTag(programName)],
                })
            }
      }

      // ─────────────────────────────────────────────────────────────────
      // 2. Study Access subscription signups ($49/mo)
      //    Fires once when the Stripe Checkout Session in subscription
      //    mode completes. Tags the customer so the Mailchimp drip with
      //    monthly PM templates kicks in.
      // ─────────────────────────────────────────────────────────────────
      if (event.type === 'checkout.session.completed') {
              const session = event.data.object as Stripe.Checkout.Session

            if (session.mode === 'subscription') {
                      const email = normalizeEmail(
                                session.customer_email || session.customer_details?.email || ''
                      )

                if (email) {
                            const tier = session.metadata?.tier || 'study-access'
                            const fullName = session.customer_details?.name
                            const { firstName, lastName } = splitFullName(fullName)

                      // Map Stripe's billing address into Mailchimp's ADDRESS
                      // merge field. Returns null if the address is incomplete,
                      // in which case the ADDRESS field is omitted from the
                      // Mailchimp PUT rather than sending partial data.
                      const address = stripeAddressToMailchimp(
                                  session.customer_details?.address
                      )

                      await upsertMailchimpCustomer({
                                  email,
                                  firstName,
                                  lastName,
                                  address,
                                  tags: [
                                              'customer',
                                              'subscriber',
                                              'subscription-active',
                                              normalizeTag(tier),
                                              'pm-templates-monthly',
                                  ],
                            })
                  }
            }
      }

      // ─────────────────────────────────────────────────────────────────
      // 3. Subscription cancellations
      //    Deactivate the subscription-active and pm-templates-monthly tags
      //    so the templates drip stops. Customer stays on the audience.
      // ─────────────────────────────────────────────────────────────────
      // ───────────────────────────────────────────────────────────────
      // Entitlements. The database — not Stripe — is the source of access.
      // ───────────────────────────────────────────────────────────────
      if (event.type === 'checkout.session.completed') {
        const s2 = event.data.object as Stripe.Checkout.Session
        const email2 = s2.customer_email || s2.customer_details?.email || ''
        // ── B-2. Subscription is a billing mechanism, not product identity ──
        //
        // This used to read `Boolean(s2.subscription) || <two metadata
        // checks>`, and the first clause swallowed the other two: every
        // subscription checkout granted Study Access whatever it was for. It
        // worked only because there has been exactly one subscription product.
        // A LIAP payment plan, a Retreat instalment, coaching or a future Boot
        // Camp arrangement would each have inherited a PMP entitlement, and it
        // would have failed silently and in the direction of granting.
        //
        // lib/programs identifies the product from the marker the checkout
        // route actually wrote — including `metadata.tier`, which is what the
        // live subscription flow has always set and the reason the shortcut
        // existed. Unidentifiable grants nothing.
        const product = identifyCheckoutSession(s2)
        const isStudyAccess = productGrants(product, STUDY_ACCESS)

        if (email2 && !isStudyAccess && s2.payment_status === 'paid') {
          console.log(
            `[stripe/webhook] no Study Access grant for ${s2.id}: ` +
              `${product ? `${product.program}/${product.marker}` : 'unrecognised product'}`
          )
        }

        if (email2 && isStudyAccess && s2.payment_status === 'paid') {
          const c2 = await upsertCustomer({
            email: email2,
            name: s2.customer_details?.name ?? null,
            stripeCustomerId: typeof s2.customer === 'string' ? s2.customer : null,
          })
          await grantEntitlement({
            customerId: c2.id,
            entitlementKey: STUDY_ACCESS,
            sourceType: s2.subscription ? 'subscription' : 'order',
            sourceId: (typeof s2.subscription === 'string' ? s2.subscription : null) ?? s2.id,
            idempotencyKey: `${event.id}:${STUDY_ACCESS}`,
          })
        }
      }

      // ───────────────────────────────────────────────────────────────
      // Living Is a Project…Are You Ready? book preorder.
      //
      // Matched on metadata rather than on amount or product name: the marker
      // is set in one place, app/api/liap/preorder, and nothing else uses it.
      // Deliberately separate from the Study Access branch above — the two
      // products share this transport and nothing else, so a change to one
      // cannot reach the other.
      // ───────────────────────────────────────────────────────────────
      if (event.type === 'checkout.session.completed') {
        const liapSession = event.data.object as Stripe.Checkout.Session
        const liapEmail =
          liapSession.customer_email || liapSession.customer_details?.email || ''

        if (isLiapPreorder(liapSession.metadata) && liapEmail && liapSession.payment_status === 'paid') {
          const result = await fulfilPreorder({
            email: liapEmail,
            name: liapSession.customer_details?.name ?? null,
            stripeCustomerId:
              typeof liapSession.customer === 'string' ? liapSession.customer : null,
            sourceId: liapSession.id,
            paymentIntentId:
              typeof liapSession.payment_intent === 'string' ? liapSession.payment_intent : null,
            idempotencyKey: `${event.id}:${LIAP_ENTITLEMENT}`,
            amount: liapSession.amount_total ?? null,
          })

          // Credit the community partner whose code brought this buyer, if
          // there was one. AFTER fulfilment and deliberately not before: the
          // customer's access is the thing that must not fail, and
          // creditBookPurchase swallows its own errors so a measurement
          // problem cannot cost somebody the product they paid for.
          //
          // Keyed on the checkout session id, so Stripe's webhook retries
          // credit one sale once.
          await creditBookPurchase({
            referralCode: liapSession.metadata?.referral ?? null,
            customerId: result.customerId,
            outcomeRef: liapSession.id,
          })
        }

        // ─────────────────────────────────────────────────────────────
        // Standalone Life Project-Ready™ Assessment. $29, no book.
        //
        // Its own marker and its own branch, so a standalone buyer is
        // never fulfilled as a book purchaser and never tagged as one.
        // Both doors grant the same assessment entitlement, because it
        // is the same assessment; what differs is the order record and
        // the journey tag.
        //
        // No referral credit: partner codes are printed on book
        // collateral and credit a book sale.
        // ─────────────────────────────────────────────────────────────
        if (
          isLiapStandaloneAssessment(liapSession.metadata) &&
          liapEmail &&
          liapSession.payment_status === 'paid'
        ) {
          await fulfilStandaloneAssessment({
            email: liapEmail,
            name: liapSession.customer_details?.name ?? null,
            stripeCustomerId:
              typeof liapSession.customer === 'string' ? liapSession.customer : null,
            sourceId: liapSession.id,
            paymentIntentId:
              typeof liapSession.payment_intent === 'string'
                ? liapSession.payment_intent
                : null,
            idempotencyKey: `${event.id}:${LIAP_ENTITLEMENT}:standalone`,
            amount: liapSession.amount_total ?? null,
          })
        }
      }

      // Refunds revoke access. Without this a refunded customer keeps the
      // product, because an entitlement outlives the payment that created it.
      if (event.type === 'charge.refunded') {
        const charge = event.data.object as Stripe.Charge
        // Resolves the payment back to whatever identifier the entitlement
        // recorded. The old single-identifier revoke silently matched nothing
        // for book preorders — see revokeEntitlementsForRefund.
        await revokeEntitlementsForRefund({
          paymentIntentId:
            typeof charge.payment_intent === 'string' ? charge.payment_intent : null,
          chargeId: charge.id,
          reason: 'charge.refunded',
        })
      }

      if (event.type === 'customer.subscription.deleted') {
              const subscription = event.data.object as Stripe.Subscription

            // Need to look up the customer email from the customer object
            try {
                      const customerId =
                                typeof subscription.customer === 'string'
                                          ? subscription.customer
                                          : subscription.customer.id
                      const customer = await stripe.customers.retrieve(customerId)

                if (!('deleted' in customer) || !customer.deleted) {
                            const email = (customer as Stripe.Customer).email
                            if (email) {
                                        await deactivateMailchimpTags({
                                                    email,
                                                    tags: ['subscription-active', 'pm-templates-monthly'],
                                          })
                                  }
                  }
            } catch (lookupErr) {
                      console.warn('Could not look up canceled subscription customer:', lookupErr)
            }

        // Revoke by the subscription that granted access, then drop live
        // sessions so the change takes effect on the next request rather than
        // whenever the cookie happens to expire.
        {
          const revoked = await revokeEntitlementsBySource({
            sourceType: 'subscription',
            sourceId: subscription.id,
            reason: 'customer.subscription.deleted',
          })
          if (revoked > 0) {
            const owner = await queryOne<{ customer_id: string }>(
              `SELECT customer_id FROM entitlements
                WHERE source_type = 'subscription' AND source_id = $1 LIMIT 1`,
              [subscription.id]
            )
            if (owner) await revokeAllSessionsForCustomer(owner.customer_id)
          }
        }
      }

      if (ledgerAvailable) await markEventProcessed(event.id)
      return NextResponse.json({ received: true })
    } catch (error) {
          const message = error instanceof Error ? error.message : String(error)

          if (claimedEventId) {
            // Best-effort: never let bookkeeping mask the original failure.
            await markEventFailed(claimedEventId, message).catch(() => {})
          }

          const isSignatureError =
                message.toLowerCase().includes('signature') ||
                message.toLowerCase().includes('webhook secret')

          console.error('Stripe webhook error:', error)

          // Surface the real error in the response body so it shows up
          // directly in the Stripe dashboard's Event deliveries → Response
          // section. Previously this returned a generic "Webhook processing
          // failed." message that forced debuggers to dig through Vercel
          // function logs.
          //
          // We use 400 for signature/verification errors (Stripe won't retry
          // those — they're permanent config mismatches) and 500 for
          // downstream failures like Mailchimp outages (Stripe WILL retry,
          // giving us a chance to recover without losing the event).
          return NextResponse.json(
                { error: message },
                { status: isSignatureError ? 400 : 500 }
          )
    }
}
