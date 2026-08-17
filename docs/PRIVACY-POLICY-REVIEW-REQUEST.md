# Privacy Policy — Review Request

**To:** Counsel for Wiser Generations Int'l
**From:** Crystal Stewart, Wiser Generations Int'l (an Enterprise Academy program)
**Re:** Website changes requiring privacy policy review
**Current policy:** https://www.wisergenerations.com/privacy-policy (Effective April 12, 2026 · Last updated June 12, 2026)

> This memo describes factual changes to the website and identifies where the
> existing policy appears not to cover them. It is written by the development
> team and is **not legal advice**. Suggested wording is a starting point for
> counsel to accept, rewrite, or reject. Nothing here has been published.

---

## 1. Summary of what changed

Three new data flows have been added to the website and are **not yet live in production**:

1. **An AI chat assistant** ("Wiser Generations Virtual Guide") that answers visitor questions. Visitor messages are transmitted to a third-party AI provider (Anthropic) for processing.
2. **A lead-capture form inside that chat**, collecting first name, email address, and an optional "when do you want to begin" timeframe.
3. **A coaching-session giveaway** collecting first name, last name, email address, a separate marketing-consent flag, and an entry timestamp.

Two new third-party processors are involved: **Anthropic** (AI processing) and **Upstash** (Redis data store, used for giveaway entries and for rate limiting).

---

## 2. Gaps identified against the current policy

### Section 2 — "Information We Collect"

Currently lists contact information, payment information, program enrollment data, and communications. It does not mention:

- **Chat interaction content.** Free-text messages a visitor types into the AI assistant. A visitor may type anything, including information we did not ask for.
- **Giveaway entry data.** Last name is collected here but nowhere else on the site; the current policy references only "name."
- **Marketing consent state.** Recorded as a discrete yes/no for giveaway entrants.
- **Inferred interest category.** The assistant classifies each lead (course, coaching, both, eBook, giveaway, corporate, veterans, general) and, where the visitor supplies a timeframe, an intent level. These are stored as tags in Mailchimp.

*Question for counsel:* does the inferred interest/intent tagging need separate disclosure, or is it adequately covered by a general statement about how we use information to tailor communications?

### Section 4 — "Third-Party Services"

Currently lists Stripe, Mailchimp (Intuit), Calendly, Google Analytics, and Vercel. Two additions appear necessary:

- **Anthropic** — processes visitor chat messages to generate responses. Privacy policy: https://www.anthropic.com/legal/privacy
- **Upstash** — stores giveaway entries and rate-limiting counters. Privacy policy: https://upstash.com/trust/privacy.pdf

*Please verify independently:* our understanding is that Anthropic does not train its models on data submitted through the commercial API, and that API data retention is governed by their commercial terms and any account-level retention setting. **We have not verified this against Anthropic's current terms and counsel should confirm it before any representation is published.** We do not want the policy to assert something about a vendor that we have not confirmed.

### Section 5 — "Data Retention"

Currently covers newsletter data (until unsubscribe), purchase records (7 years), and inquiries (3 years). Not addressed:

- **How long giveaway entries are retained** after a winner is selected. This is a business decision we need from you — our suggestion is to delete non-winning entries a defined period after the drawing, but we have not implemented any automatic deletion and will not until you advise.
- **How long chat interaction data persists** at the AI provider.

*Note on our own logs:* the application was deliberately built so that server logs record only structural information about a lead (interest category, timeframe, whether a goal was provided) and **never the visitor's name, email address, or message content.** Giveaway entrant names and emails are stored in Upstash because the winner must be contactable.

### Section 6 / Section 7 — Rights, and California (CCPA/CPRA)

- A deletion request now needs to reach **four** systems rather than two: Mailchimp, Stripe, Upstash (giveaway entries), and any retained chat data at Anthropic. The current 30-day response commitment stands, but the operational process behind it has changed.
- *Question for counsel:* the AI assistant provides information and routes visitors to a booking link or a form. It does not price, approve, deny, or decide anything about a person. Does that fall outside CCPA/CPRA automated decision-making provisions, or should the policy address it anyway?

### Possible new section — AI disclosure

There is currently no AI disclosure. In the product itself, the assistant is labelled "AI assistant · not a live person," states in its opening message that it is an AI, is instructed never to claim to be Crystal or any human, and hands off to a person for billing, account, or private concerns.

*Question for counsel:* is a policy-level AI disclosure warranted in addition to the in-product labelling, and does any FTC guidance on AI disclosure or endorsement apply here?

---

## 3. Giveaway-specific questions

The giveaway is configuration-driven and **ships disabled**. It will not run until dates and rules are filled in and it is explicitly switched on — so there is time to resolve these first.

1. **Sweepstakes compliance.** Entry is free and no purchase is necessary; that is stated in the rules and enforced in the product (entry does not require the marketing opt-in). Are the drafted rules sufficient for the states we will accept entries from? Current eligibility text: *"Open to legal residents of the United States who are 18 years of age or older at the time of entry. No purchase necessary."*
2. **Registration/bonding.** Do we need to register or bond in any state given the prize is a coaching session with no stated cash value? The rules currently state the prize has no cash value and is non-transferable.
3. **Winner announcement.** The rules say the winner is notified by email at the address used to enter. Do we need consent before naming a winner publicly? We currently make no public-announcement claim.
4. **Consent separation.** Marketing consent is a separate, optional, unticked checkbox, and entry does not depend on it. Entrants who do not tick it are still added to the audience tagged as giveaway entrants so the winner can be contacted. *Is that acceptable, or must non-consenting entrants be excluded from the marketing audience entirely?* This is the question we are least certain about and would most like guidance on.
5. **Record retention** for the drawing — see Section 5 above.

---

## 4. What we need back

1. Approved wording for the Sections 2, 4, and 5 additions.
2. A decision on whether a standalone AI disclosure section is needed.
3. A retention period for giveaway entries.
4. An answer on item 3.4 above (non-consenting entrants in the marketing audience).
5. Confirmation the giveaway rules are adequate, or replacement text.

Nothing is published and the giveaway is switched off, so there is no time pressure beyond our launch date.

---

## 5. For the developer, once counsel responds

- Policy text: `app/privacy-policy/page.tsx`
- Giveaway rules text: `content/config/giveaway.json` (`eligibility` and `terms` fields — editable without a developer)
- Update the "Last Updated" date in `app/privacy-policy/page.tsx`
- If non-consenting entrants must be excluded from Mailchimp, that changes `app/api/giveaway/route.ts`
