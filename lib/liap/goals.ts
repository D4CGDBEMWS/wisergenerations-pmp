import { getDb } from '@/lib/db/client'

// ---------------------------------------------------------------------------
// Campaign goals.
//
// The owner's instruction: fundraising goals are business planning
// assumptions and must remain editable dashboard values, never hard-coded and
// never used as application logic.
//
// ── THE INVARIANT ──────────────────────────────────────────────────────────
//
//   No goal value may influence any decision this system makes.
//
//   Nothing branches on whether a target is met. No campaign closes, no offer
//   appears or disappears, no contribution is accepted or refused, no email
//   fires, no page changes. Goals are read by reporting and by nothing else.
//
// The test suite asserts that this module is imported only by reporting code,
// because "hide the donate button once we hit target" is the kind of small,
// reasonable-sounding request that arrives one afternoon and quietly kills
// the constraint.
//
// ── TARGETS AND RESULTS ARE NOT THE SAME KIND OF NUMBER ────────────────────
//
// Six figures appear on the dashboard row, and they are stored three
// different ways on purpose:
//
//   cash_goal, in_kind_goal, lead_goal    Typed by the owner. Editable any
//                                         time, which is the whole point.
//
//   cash_received, leads_generated        DERIVED, from orders and from
//                                         attribution. There is deliberately
//                                         nowhere to type these: a figure
//                                         that can disagree with the Stripe
//                                         ledger is worse than no figure at
//                                         all, because nobody can tell which
//                                         one is wrong.
//
//   in_kind_received                      SUMMED from individually recorded
//                                         contributions. In-kind has no
//                                         payment behind it so a human number
//                                         is unavoidable — but a total made
//                                         of itemised rows can answer "what
//                                         makes up that $8,000?" a year
//                                         later, and a single typed total
//                                         cannot.
// ---------------------------------------------------------------------------

export interface CampaignGoals {
  /** Cents. null means no target has been set — not zero. */
  cashGoal: number | null
  inKindGoal: number | null
  leadGoal: number | null
}

export interface CampaignProgress extends CampaignGoals {
  campaign: string
  /** Cents, summed from paid contribution orders. */
  cashReceived: number
  /** Cents, summed from in-kind contributions that a human has valued. */
  inKindReceived: number
  /** Count of attributed leads. */
  leadsGenerated: number
}

/**
 * The current targets for a campaign, or for one partner within it.
 *
 * Goals are effective-dated rather than overwritten, so this asks for the row
 * that is in force today. Raising a target mid-campaign leaves the previous
 * row intact with an end date, which is what keeps a retrospective readable.
 *
 * Returns nulls rather than zeroes when nothing is set. A partner with no
 * target has no target; showing them as "0% of $0" would be nonsense.
 */
export async function currentGoals(
  campaign: string,
  partnerId: string | null = null
): Promise<CampaignGoals> {
  const rows = await getDb().query<{
    cash_goal: number | null
    in_kind_goal: number | null
    lead_goal: number | null
  }>(
    `SELECT cash_goal, in_kind_goal, lead_goal
       FROM campaign_goals
      WHERE campaign = $1
        AND partner_id IS NOT DISTINCT FROM $2::uuid
        AND effective_from <= CURRENT_DATE
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
      ORDER BY effective_from DESC
      LIMIT 1`,
    [campaign, partnerId]
  )

  const row = rows[0]
  return {
    cashGoal: row?.cash_goal ?? null,
    inKindGoal: row?.in_kind_goal ?? null,
    leadGoal: row?.lead_goal ?? null,
  }
}

/**
 * Targets alongside what actually happened.
 *
 * The three results are computed here and cannot be supplied by a caller,
 * which is the mechanical expression of the rule above.
 *
 * Cash counts only orders marked as contributions. A book sale is revenue and
 * belongs in a different report — the owner's instruction is that
 * crowdfunding and sponsorship are never combined with ordinary purchases,
 * even though Stripe processes both through one account.
 */
export async function campaignProgress(campaign: string): Promise<CampaignProgress> {
  const db = getDb()
  const goals = await currentGoals(campaign)

  const [cash] = await db.query<{ total: string }>(
    `SELECT COALESCE(sum(amount), 0)::text AS total
       FROM orders
      WHERE transaction_category IN ('contribution', 'sponsorship')
        AND status = 'paid'
        AND stripe_checkout_session_id IS NOT NULL`
  )

  // Only contributions a human has valued. An unvalued row is awaiting
  // valuation, and counting it as zero would understate the total while
  // looking like a complete answer.
  const [inKind] = await db.query<{ total: string }>(
    `SELECT COALESCE(sum(approved_value), 0)::text AS total
       FROM in_kind_contributions
      WHERE campaign = $1 AND approved_value IS NOT NULL`,
    [campaign]
  )

  const [leads] = await db.query<{ total: string }>(
    `SELECT count(*)::text AS total
       FROM attribution_events e
       JOIN partners p ON p.id = e.partner_id
      WHERE e.event_type IN ('lead', 'retreat_interest', 'sponsor_inquiry')
        AND p.campaign = $1`,
    [campaign]
  )

  return {
    campaign,
    ...goals,
    cashReceived: Number(cash?.total ?? 0),
    inKindReceived: Number(inKind?.total ?? 0),
    leadsGenerated: Number(leads?.total ?? 0),
  }
}
