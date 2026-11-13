import type Stripe from 'stripe'
import { upsertCustomer } from '@/lib/customers'
import { upsertSubscriber } from '@/lib/mailchimp'
import { recordAttribution, partnerFromSubmission } from './attribution'
import { LIAP_RETREAT } from './product'

// ---------------------------------------------------------------------------
// What a paid Retreat registration does.
//
// Stripe holds the payment and the receipt. This records the customer, tags
// them in Mailchimp so the retreat-details emails can be sent, and logs a
// retreat_registered touch for partner reporting. It grants no entitlement:
// a seat at the Retreat is not a site permission.
//
// Never throws past its caller's guard — each step logs and carries on, so a
// Mailchimp hiccup cannot make Stripe retry and double-count a registration.
// ---------------------------------------------------------------------------

export const RETREAT_TAG = 'liap_retreat_registered'
/** Marks registrants who still owe the balance — the owner's invoicing list. */
export const RETREAT_BALANCE_TAG = 'liap_retreat_balance_due'
/** Marks a registration that arrived after all seats were paid for. */
export const RETREAT_OVER_CAPACITY_TAG = 'liap_retreat_over_capacity'

/** True when a Stripe object carries the Retreat's marker. */
export function isLiapRetreat(metadata: Stripe.Metadata | null | undefined): boolean {
  return metadata?.product === LIAP_RETREAT.metadataKey
}

export async function fulfilRetreat(input: {
  email: string
  name: string | null
  stripeCustomerId: string | null
  referralCode: string | null
  /** Paid seats including this registration; over capacity flags it for the owner. */
  paidSeats?: number | null
}): Promise<void> {
  let customerId: string | null = null
  try {
    const c = await upsertCustomer({
      email: input.email,
      name: input.name,
      stripeCustomerId: input.stripeCustomerId,
    })
    customerId = c.id
  } catch (err) {
    console.error('[liap/retreat] could not record customer', err)
  }

  if ((input.paidSeats ?? 0) > LIAP_RETREAT.capacity) {
    console.error(
      `[liap/retreat] OVERBOOKED: ${input.paidSeats} paid seats for ${LIAP_RETREAT.capacity}; ` +
        `latest registration ${input.email} is tagged ${RETREAT_OVER_CAPACITY_TAG}`
    )
  }

  const [firstName, ...rest] = (input.name ?? '').trim().split(/\s+/)
  try {
    await upsertSubscriber({
      email: input.email,
      firstName: firstName || undefined,
      lastName: rest.join(' ') || undefined,
      tags: [
        'customer',
        RETREAT_TAG,
        RETREAT_BALANCE_TAG,
        ...((input.paidSeats ?? 0) > LIAP_RETREAT.capacity ? [RETREAT_OVER_CAPACITY_TAG] : []),
      ],
    })
  } catch (err) {
    console.error('[liap/retreat] could not tag subscriber', err)
  }

  await recordAttribution({
    partner: await partnerFromSubmission(input.referralCode).catch(() => null),
    eventType: 'retreat_registered',
    customerId,
  })
}
