import { isEnabled } from '@/lib/flags'

// ---------------------------------------------------------------------------
// Whether the Life Project-Ready™ Assessment is open, and how every customer
// surface talks about it while it is not.
//
// One function and one set of sentences, so the book page, the author page,
// the checkout description and the post-purchase page can never disagree
// about whether a buyer can start today. See LIAP_ASSESSMENT in lib/flags.ts.
// ---------------------------------------------------------------------------

/** True when buyers can take the Assessment now. */
export function assessmentOpen(): boolean {
  return isEnabled('LIAP_ASSESSMENT')
}

/** What a buyer is promised, short form, for FAQs and CTAs. */
export function assessmentTimingShort(): string {
  return assessmentOpen()
    ? 'Your order unlocks the Life Project-Ready™ Assessment as soon as payment is confirmed — you do not wait for the book to arrive.'
    : 'Your order includes the Life Project-Ready™ Assessment. It opens soon — we’ll email you the moment it’s ready, and you won’t need to buy anything else.'
}

/** The line used in the Stripe checkout description. */
export function assessmentCheckoutLine(): string {
  return assessmentOpen()
    ? 'unlock the Life Project-Ready™ Assessment immediately'
    : 'receive the Life Project-Ready™ Assessment when it opens'
}
