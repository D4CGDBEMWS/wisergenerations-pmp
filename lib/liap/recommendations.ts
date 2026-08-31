import {
  buildScoreReport,
  CLASSIFICATION_LABELS,
  POSITION_LABELS,
  POSITION_MEANINGS,
  type DimensionScore,
  type Intake,
  type Answers,
  type ScoreReport,
} from './scoring'
import type { DimensionKey, NarrativeKey } from './assessment/v2'

// ---------------------------------------------------------------------------
// Protect • Resolve • Move, and the 30/60/90 plan.
//
// Rule-based, like the scoring, and for the same reason: this is advice given
// to someone in the middle of a real change, and it has to be reproducible and
// explainable. Every sentence below traces to a dimension score, the stated
// change type, or the customer's own words quoted back — never to a generation
// step that could say something different tomorrow.
//
// §18's constraint is the hard one: EXACTLY three headline actions. The
// temptation with eight dimensions and forty answers is to return everything
// that could be improved, which is precisely what someone in a difficult month
// cannot act on. Choosing three is the product.
// ---------------------------------------------------------------------------

/**
 * A pointer to something the participant wrote. NEVER the text itself.
 *
 * ── WHY THIS TYPE EXISTS ───────────────────────────────────────────────────
 *
 * The 90-day promise is that free text is deleted. Before this, the engine
 * interpolated the participant's sentence directly into the action body, and
 * that body was JSON-encoded into assessment_results — so purging
 * assessment_narratives left a verbatim copy behind in a table the purge never
 * touched, and the results page went on quoting it at day 91. An audit proved
 * it end to end.
 *
 * A reference cannot leak, because there is nothing in it to leak. The stored
 * report says "here is where a quotation goes and here is the approved prose
 * around it"; the text is fetched from assessment_narratives at render time,
 * and once that row is gone the reference resolves to nothing.
 *
 * The rule that makes it safe rather than merely tidy: `body` must read
 * naturally on its own. A body that needs the quotation to make sense would
 * turn a purged report into nonsense, which is its own kind of failure. Every
 * `lead`/`trail` pair below is written so the sentence survives its removal —
 * and a test asserts every stored body is non-empty and quote-free.
 */
export interface NarrativeRef {
  /** Which narrative answer to resolve. A key, not a value. */
  readonly narrative: NarrativeKey
  /** Approved prose introducing the quotation. */
  readonly lead: string
  /** Approved prose after it. Omitted where none is needed. */
  readonly trail?: string
  /** Characters retained when the quotation is rendered. */
  readonly limit: number
}

/** Narratives as loaded for rendering. Empty once the retention window closes. */
export type NarrativeMap = Partial<Record<NarrativeKey, string>>

export interface Action {
  kind: 'protect' | 'resolve' | 'move'
  headline: string
  /** Approved prose. Must stand alone; never contains participant text. */
  body: string
  /** Which dimension drove this, for the "why am I seeing this" line. */
  basis: DimensionKey | 'stated'
  /** Resolved at render time, if the narrative still exists. */
  quote?: NarrativeRef
}

/** An action with its quotation already resolved — what a page or PDF renders. */
export interface RenderedAction {
  kind: Action['kind']
  headline: string
  body: string
  basis: Action['basis']
}

/**
 * What each dimension means when it is the thing most at risk.
 *
 * Written as protection rather than improvement: at this level the goal is to
 * stop something getting worse, not to optimise it.
 */
// COMPLETE, and typed as a total Record on purpose. Every scored dimension
// must have copy before it can be scored: a dimension the engine can rank but
// cannot speak to is a dimension that reaches a customer as a blank. Typing it
// as a total Record makes adding a ninth dimension without its copy a compile
// error rather than something discovered in production.
//
// Spiritual Readiness carries owner-approved copy, 31 August 2026, verbatim.
const PROTECT_BY_DIMENSION: Record<DimensionKey, { headline: string; body: string }> = {
  money: {
    headline: 'Protect your financial floor',
    body: 'Work out the minimum it costs to run your life for one month, and confirm you can cover it. Not a budget — a floor. Knowing the number stops the worry being infinite, and it tells you exactly how much time you have to work with.',
  },
  wellness: {
    headline: 'Protect your capacity to think',
    body: 'Sleep, food and one genuine break are not indulgences during a change like this — they are what your judgement runs on. Decisions made while depleted are the ones people most often revisit.',
  },
  relationships: {
    headline: 'Protect the relationships that carry you',
    body: 'Tell one person what is actually happening. Not to solve it — so that you are not carrying it alone and so someone knows enough to help when it matters.',
  },
  time: {
    headline: 'Protect a block of time for this',
    body: 'This change will not be handled in the gaps between other obligations. Put a recurring hour somewhere real and defend it the way you would defend a meeting with someone else.',
  },
  vision: {
    headline: 'Protect your direction from the urgent',
    body: 'When everything feels pressing, the important quietly loses. Write down the one outcome you are working toward and keep it where you will see it before you make the next decision.',
  },
  career: {
    headline: 'Protect your professional standing',
    body: 'Keep your record current and your relationships warm while you have the choice. It is far easier to do this before you need it than during the week you do.',
  },
  spiritual: {
    headline: 'Protect Your First Love',
    body:
      'Life\'s demands, disappointments, and distractions can quietly pull our attention away from God. If that has happened, this is not an invitation to condemnation—it is an invitation to come closer.\n\nRemember your first love. Make room for God\'s presence and receive the assurance that you are accepted in the Beloved.\n\nBefore seeking direction, return your heart to the One who directs your steps.',
  },
  legacy: {
    headline: 'Protect what this is for',
    body: 'Name what you want this period to have counted for. It becomes the test for the decisions ahead — and it is the first thing to go missing when a change gets busy.',
  },
}

/** Total for the same reason as PROTECT_BY_DIMENSION above. */
const RESOLVE_BY_DIMENSION: Record<DimensionKey, { headline: string; body: string }> = {
  money: {
    headline: 'Resolve the money question you are avoiding',
    body: 'There is usually one specific number you have not looked at. Look at it this week. Uncertainty about money costs more attention than the answer usually does.',
  },
  wellness: {
    headline: 'Resolve the health thing you have postponed',
    body: 'Book the appointment you have been meaning to book. It is the kind of task that costs an hour now and considerably more later.',
  },
  relationships: {
    headline: 'Resolve the conversation you have been putting off',
    body: 'Someone affected by this does not yet know what is happening, or knows a version of it. Having that conversation is almost always less costly than the delay.',
  },
  time: {
    headline: 'Resolve what you are going to stop doing',
    body: 'You cannot add this change to a full week. Choose what gets set down — explicitly, so it does not simply get dropped and then reappear as guilt.',
  },
  vision: {
    headline: 'Resolve what a good outcome actually looks like',
    body: 'Write one sentence describing where you want to be. Vague direction is what makes every option look equally reasonable and equally unsatisfying.',
  },
  career: {
    headline: 'Resolve where your work is heading',
    body: 'Decide whether the current arrangement is somewhere you are staying, leaving, or changing. Not knowing which is more tiring than any of the three.',
  },
  spiritual: {
    headline: 'Remember. Return. Receive.',
    body:
      'If fear, pressure, disappointment, or your own plans have drawn your attention away from God, His mercy gives you room to return.\n\nRemember your first love. Receive His grace, and look again at your direction. Consider what is yours to do, what you need to release, and where God may be asking you to trust Him.\n\nDo what is within your hands, trust God with what is beyond your control, and be willing to change direction when He leads.',
  },
  legacy: {
    headline: 'Resolve the gap between what you value and how you spend your time',
    body: 'Name one place where they have drifted apart, and one change that would close it. Small is fine; the point is that it is specific.',
  },
}

const MOVE_BY_POSITION = {
  move: {
    headline: 'Take the step you are already ready for',
    body: 'Your answers show the footing to act. Choose the one action you have been considering and put a date on it — the readiness you have now is not permanent, and waiting for more certainty rarely produces it.',
  },
  plan: {
    headline: 'Turn your intent into a sequence',
    body: 'You know roughly where you are going. Break it into the first three steps with dates, so progress stops depending on how you feel in a given week.',
  },
  build: {
    headline: 'Rebuild one foundation, properly',
    body: 'Pick the single lowest area and give it a month of real attention. Rebuilding one thing well beats improving four things slightly, and it makes the next move hold.',
  },
  stabilize: {
    headline: 'Steady one thing this week',
    body: 'Choose the smallest action that makes next week calmer than this one. Momentum during a hard change is built from small completed things, not large intended ones.',
  },
} as const

/** Whether the participant wrote anything. A boolean, safe to store. */
function stated(text: string | null | undefined): boolean {
  return typeof text === 'string' && text.trim().length > 0
}

/**
 * Resolves a reference against whatever narratives still exist.
 *
 * Returns null when the narrative is absent — which is the state after the
 * 90-day purge, and the state this whole design exists to make safe.
 */
export function resolveNarrative(
  ref: NarrativeRef | undefined,
  narratives: NarrativeMap
): string | null {
  if (!ref) return null
  const raw = narratives[ref.narrative]
  if (!raw) return null
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  return clean.length > ref.limit ? clean.slice(0, ref.limit - 1).trimEnd() + '…' : clean
}

/** Approved prose, plus the quotation if it is still available. */
function withQuote(body: string, ref: NarrativeRef | undefined, narratives: NarrativeMap): string {
  const text = resolveNarrative(ref, narratives)
  if (!text || !ref) return body
  const trail = ref.trail ? ` ${ref.trail}` : ''
  return `${body} ${ref.lead} \u201c${text}\u201d${trail}`
}

export function renderAction(action: Action, narratives: NarrativeMap): RenderedAction {
  return {
    kind: action.kind,
    headline: action.headline,
    body: withQuote(action.body, action.quote, narratives),
    basis: action.basis,
  }
}

/**
 * §18 and §19. Exactly three actions, chosen in a defined order.
 *
 * PROTECT comes from the most at-risk dimension: what is closest to breaking.
 * RESOLVE comes from the next one down, unless the customer named a decision
 * themselves — in which case theirs wins, because they know their situation
 * and being told to resolve something else would read as not having listened.
 * MOVE comes from the position, tempered by S.T.E.A.D.Y.: someone in an
 * unexpected, urgent change is not told to expand.
 */
export function nextBestThree(report: ScoreReport, intake: Intake): Action[] {
  const ranked = report.ranked

  // Every scored dimension has approved copy, so protect always speaks to the
  // dimension that most needs protecting, and resolve to the next one down.
  // No filtering and no fallback: a dimension that could be ranked but not
  // spoken to would reach a customer as a blank, and the total Record above
  // makes that a compile error instead.
  const protectSource = ranked[0]!
  const resolveSource = ranked[1] ?? protectSource

  const protectCopy = PROTECT_BY_DIMENSION[protectSource.key]

  const protect: Action = {
    kind: 'protect',
    headline: protectCopy.headline,
    body: protectCopy.body,
    basis: protectSource.key,
  }

  const resolveCopy = RESOLVE_BY_DIMENSION[resolveSource.key]
  // The BOOLEAN is stored, never the sentence. Whether they wrote something
  // decides which headline they get; what they wrote is resolved at render.
  const resolve: Action = stated(intake.importantDecision)
    ? {
        kind: 'resolve',
        headline: 'Resolve the decision you named',
        // Reads correctly with the quotation and without it.
        body: `Give it a decision date rather than more thinking time. ${resolveCopy.body}`,
        basis: 'stated',
        quote: {
          narrative: 'important_decision',
          lead: 'You told us this is what feels most important right now:',
          limit: 180,
        },
      }
    : { kind: 'resolve', headline: resolveCopy.headline, body: resolveCopy.body, basis: resolveSource.key }

  // §19: for unexpected or high-urgency transitions, stabilisation precedes
  // expansion. A "Ready to Move" total does not override a week that has just
  // been upended.
  const moveKey = report.steady && report.position === 'move' ? 'plan' : report.position
  const moveCopy = MOVE_BY_POSITION[moveKey]
  const describedBetter = stated(intake.ninetyDayBetter)
  const move: Action = {
    kind: 'move',
    headline: moveCopy.headline,
    // Approved prose only. The trail lives on the reference, because "let that
    // be the test" has nothing to point at once the quotation is gone.
    body: moveCopy.body,
    basis: describedBetter ? 'stated' : report.strengths[0]?.key ?? protectSource.key,
    ...(describedBetter
      ? {
          quote: {
            narrative: 'ninety_day_better' as const,
            lead: 'You described better as:',
            trail: 'Let that be the test for whichever step you choose.',
            limit: 180,
          },
        }
      : {}),
  }

  return [protect, resolve, move]
}

// ---------------------------------------------------------------------------
// §20. The 30/60/90-day plan.
//
// Rule-based and specific to this person: it names their lowest dimension,
// their strongest, and their own stated outcome. A plan that could have been
// printed before they answered anything is not worth sending.
// ---------------------------------------------------------------------------

/**
 * One line of the plan.
 *
 * Same rule as an Action: `text` is approved prose that stands alone, and any
 * quotation is a reference resolved at render time. A stored plan contains no
 * participant sentence, so purging the narratives purges it everywhere.
 */
export interface PlanItem {
  text: string
  quote?: NarrativeRef
}

export interface PlanPhase {
  window: string
  title: string
  items: PlanItem[]
}

export interface Plan {
  phases: PlanPhase[]
  /** ISO date, 90 days out. Passed in so the engine stays clock-free. */
  reviewOn: string | null
}

/** A phase with its quotations resolved — plain strings, as a page expects. */
export interface RenderedPlanPhase {
  window: string
  title: string
  items: string[]
}

export interface RenderedPlan {
  phases: RenderedPlanPhase[]
  reviewOn: string | null
}

export function renderPlan(plan: Plan, narratives: NarrativeMap): RenderedPlan {
  return {
    reviewOn: plan.reviewOn,
    phases: plan.phases.map((phase) => ({
      window: phase.window,
      title: phase.title,
      items: phase.items.map((item) => withQuote(item.text, item.quote, narratives)),
    })),
  }
}

function name(score: DimensionScore | undefined): string {
  return score?.name ?? 'the area you scored lowest'
}

export function buildPlan(report: ScoreReport, intake: Intake, today?: Date): Plan {
  const lowest = report.ranked[0]
  const second = report.ranked[1]
  const strongest = report.strengths[0]
  const describedBetter = stated(intake.ninetyDayBetter)
  const namedDecision = stated(intake.importantDecision)

  const first: PlanItem[] = [
    { text: `Protect the essentials in ${name(lowest)} — this is where your answers show the least room right now.` },
    { text: 'Gather the information you are currently missing, rather than deciding without it.' },
  ]
  if (report.steady) {
    first.unshift({ text: 'Work the S.T.E.A.D.Y. sequence before committing to anything larger. Stabilise first; the plan will hold better for it.' })
  }
  if (namedDecision) {
    // Complete as a sentence on its own; the quotation adds their words while
    // they exist, and its absence at day 91 costs the line nothing.
    first.push({
      text: 'Set a decision date for the decision you named.',
      quote: { narrative: 'important_decision', lead: 'You wrote:', limit: 120 },
    })
  }
  first.push({ text: 'Choose one milestone you can reach inside 30 days, and write down how you will know you reached it.' })

  const secondPhase: PlanItem[] = [
    { text: `Act on your Move step rather than revisiting it.` },
    { text: `Give ${name(second)} deliberate attention — it is the next area that will limit progress.` },
  ]
  if (strongest) {
    secondPhase.push({ text: `Use ${strongest.name}, your strongest area at ${strongest.score}/25, to carry the parts that feel heaviest.` })
  }
  secondPhase.push({ text: 'Track what actually happened each week. Two lines is enough.' })

  const third: PlanItem[] = [
    { text: 'Review what changed, honestly — including anything that did not.' },
    { text: `Re-score ${name(lowest)} and see whether the work moved it.` },
    { text: 'Update the risks: some will have closed, and new ones will have appeared.' },
  ]
  third.push(
    describedBetter
      ? {
          text: 'Measure against what you said better would look like.',
          quote: { narrative: 'ninety_day_better', lead: 'You wrote:', limit: 120 },
        }
      : { text: 'Decide what the next 90 days are for, now that this period has a shape.' }
  )

  let reviewOn: string | null = null
  if (today) {
    const d = new Date(today.getTime())
    d.setUTCDate(d.getUTCDate() + 90)
    reviewOn = d.toISOString().slice(0, 10)
  }

  return {
    reviewOn,
    phases: [
      { window: 'Days 1–30', title: 'Stabilize & clarify', items: first },
      { window: 'Days 31–60', title: 'Act & strengthen', items: secondPhase },
      { window: 'Days 61–90', title: 'Review & adjust', items: third },
    ],
  }
}

/** What is BUILT and STORED. Carries references; contains no participant text. */
export interface FullReport extends ScoreReport {
  positionLabel: string
  positionMeaning: string
  actions: Action[]
  plan: Plan
  classificationLabels: typeof CLASSIFICATION_LABELS
}

/**
 * What is RENDERED — by the results page, the email and the PDF alike.
 *
 * Identical in shape to what those callers consumed before this change, which
 * is deliberate: the fix moves where the text lives, not what a page expects.
 */
export interface RenderedReport extends ScoreReport {
  positionLabel: string
  positionMeaning: string
  actions: RenderedAction[]
  plan: RenderedPlan
  classificationLabels: typeof CLASSIFICATION_LABELS
}

/**
 * Resolves a stored report against whatever narratives remain.
 *
 * Pass an empty map and you get exactly what a participant sees at day 91.
 * That is the whole safety property, and it is one function call to test.
 */
export function renderReport(report: FullReport, narratives: NarrativeMap): RenderedReport {
  return {
    ...report,
    actions: report.actions.map((a) => renderAction(a, narratives)),
    plan: renderPlan(report.plan, narratives),
  }
}

/** The whole report, from answers to plan, with no I/O anywhere in the path. */
export function buildFullReport(answers: Answers, intake: Intake, today?: Date): FullReport {
  const report = buildScoreReport(answers, intake)
  return {
    ...report,
    positionLabel: POSITION_LABELS[report.position],
    positionMeaning: POSITION_MEANINGS[report.position],
    actions: nextBestThree(report, intake),
    plan: buildPlan(report, intake, today),
    classificationLabels: CLASSIFICATION_LABELS,
  }
}

// ---------------------------------------------------------------------------
// RETAINED — risk-management copy, owner-approved, currently unwired.
//
// Risk & Readiness was retired as a scored dimension on 31 August 2026. These
// two blocks were keyed to it. They are kept here verbatim rather than deleted,
// because the owner's ruling was explicit that risk remains part of LIAP
// methodology and that risk logic must not be removed simply because the
// dimension was retired.
//
// They are not exported and nothing reads them: a recommendation is selected by
// scored dimension, and there is no longer a risk dimension to select. Re-homing
// them -- to the planning logic, to a safeguard, or to a dimension the owner
// nominates -- is a content decision, not a refactor.
// ---------------------------------------------------------------------------
const RETIRED_RISK_COPY = {
  protect: {
    headline: 'Protect the essentials before anything else',
    body: 'Check that housing, income, insurance and health cover are actually in place, not assumed. One afternoon of confirming these removes the risk that a second problem arrives on top of the first.',
  },
  resolve: {
    headline: 'Resolve the risk you keep meaning to handle',
    body: 'Name the one you already know about — the lapsed policy, the document you cannot find, the conversation you have not had — and close it. Carrying a known risk is more expensive than fixing it.',
  },
} as const
void RETIRED_RISK_COPY
