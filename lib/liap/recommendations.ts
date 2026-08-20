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
import type { DimensionKey } from './assessment/v1'

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

export interface Action {
  kind: 'protect' | 'resolve' | 'move'
  headline: string
  body: string
  /** Which dimension drove this, for the "why am I seeing this" line. */
  basis: DimensionKey | 'stated'
}

/**
 * What each dimension means when it is the thing most at risk.
 *
 * Written as protection rather than improvement: at this level the goal is to
 * stop something getting worse, not to optimise it.
 */
const PROTECT_BY_DIMENSION: Record<DimensionKey, { headline: string; body: string }> = {
  money: {
    headline: 'Protect your financial floor',
    body: 'Work out the minimum it costs to run your life for one month, and confirm you can cover it. Not a budget — a floor. Knowing the number stops the worry being infinite, and it tells you exactly how much time you have to work with.',
  },
  risk: {
    headline: 'Protect the essentials before anything else',
    body: 'Check that housing, income, insurance and health cover are actually in place, not assumed. One afternoon of confirming these removes the risk that a second problem arrives on top of the first.',
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
  legacy: {
    headline: 'Protect what this is for',
    body: 'Name what you want this period to have counted for. It becomes the test for the decisions ahead — and it is the first thing to go missing when a change gets busy.',
  },
}

const RESOLVE_BY_DIMENSION: Record<DimensionKey, { headline: string; body: string }> = {
  money: {
    headline: 'Resolve the money question you are avoiding',
    body: 'There is usually one specific number you have not looked at. Look at it this week. Uncertainty about money costs more attention than the answer usually does.',
  },
  risk: {
    headline: 'Resolve the risk you keep meaning to handle',
    body: 'Name the one you already know about — the lapsed policy, the document you cannot find, the conversation you have not had — and close it. Carrying a known risk is more expensive than fixing it.',
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
  rebuild: {
    headline: 'Rebuild one foundation, properly',
    body: 'Pick the single lowest area and give it a month of real attention. Rebuilding one thing well beats improving four things slightly, and it makes the next move hold.',
  },
  stabilize: {
    headline: 'Steady one thing this week',
    body: 'Choose the smallest action that makes next week calmer than this one. Momentum during a hard change is built from small completed things, not large intended ones.',
  },
} as const

/** A short, safe echo of the customer's own words. Never re-published raw. */
function quote(text: string | null | undefined, limit = 180): string | null {
  if (!text) return null
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  return clean.length > limit ? clean.slice(0, limit - 1).trimEnd() + '…' : clean
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
  const protectSource = ranked[0]!
  const resolveSource = ranked[1] ?? ranked[0]!

  const protectCopy = PROTECT_BY_DIMENSION[protectSource.key]
  const protect: Action = {
    kind: 'protect',
    headline: protectCopy.headline,
    body: protectCopy.body,
    basis: protectSource.key,
  }

  const statedDecision = quote(intake.importantDecision)
  const resolveCopy = RESOLVE_BY_DIMENSION[resolveSource.key]
  const resolve: Action = statedDecision
    ? {
        kind: 'resolve',
        headline: 'Resolve the decision you named',
        body: `You told us this is what feels most important right now: “${statedDecision}” Give it a decision date rather than more thinking time. ${resolveCopy.body}`,
        basis: 'stated',
      }
    : { kind: 'resolve', headline: resolveCopy.headline, body: resolveCopy.body, basis: resolveSource.key }

  // §19: for unexpected or high-urgency transitions, stabilisation precedes
  // expansion. A "Ready to Move" total does not override a week that has just
  // been upended.
  const moveKey = report.steady && report.position === 'move' ? 'plan' : report.position
  const moveCopy = MOVE_BY_POSITION[moveKey]
  const desired = quote(intake.ninetyDayBetter)
  const move: Action = {
    kind: 'move',
    headline: moveCopy.headline,
    body: desired
      ? `${moveCopy.body} You described better as: “${desired}” Let that be the test for whichever step you choose.`
      : moveCopy.body,
    basis: desired ? 'stated' : report.strengths[0]?.key ?? protectSource.key,
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

export interface PlanPhase {
  window: string
  title: string
  items: string[]
}

export interface Plan {
  phases: PlanPhase[]
  /** ISO date, 90 days out. Passed in so the engine stays clock-free. */
  reviewOn: string | null
}

function name(score: DimensionScore | undefined): string {
  return score?.name ?? 'the area you scored lowest'
}

export function buildPlan(report: ScoreReport, intake: Intake, today?: Date): Plan {
  const lowest = report.ranked[0]
  const second = report.ranked[1]
  const strongest = report.strengths[0]
  const desired = quote(intake.ninetyDayBetter, 120)
  const decision = quote(intake.importantDecision, 120)

  const first: string[] = [
    `Protect the essentials in ${name(lowest)} — this is where your answers show the least room right now.`,
    'Gather the information you are currently missing, rather than deciding without it.',
  ]
  if (report.steady) {
    first.unshift('Work the S.T.E.A.D.Y. sequence before committing to anything larger. Stabilise first; the plan will hold better for it.')
  }
  if (decision) {
    first.push(`Set a decision date for: “${decision}”`)
  }
  first.push('Choose one milestone you can reach inside 30 days, and write down how you will know you reached it.')

  const secondPhase: string[] = [
    `Act on your Move step rather than revisiting it.`,
    `Give ${name(second)} deliberate attention — it is the next area that will limit progress.`,
  ]
  if (strongest) {
    secondPhase.push(`Use ${strongest.name}, your strongest area at ${strongest.score}/25, to carry the parts that feel heaviest.`)
  }
  secondPhase.push('Track what actually happened each week. Two lines is enough.')

  const third: string[] = [
    'Review what changed, honestly — including anything that did not.',
    `Re-score ${name(lowest)} and see whether the work moved it.`,
    'Update the risks: some will have closed, and new ones will have appeared.',
  ]
  third.push(
    desired
      ? `Measure against what you said better would look like: “${desired}”`
      : 'Decide what the next 90 days are for, now that this period has a shape.'
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

export interface FullReport extends ScoreReport {
  positionLabel: string
  positionMeaning: string
  actions: Action[]
  plan: Plan
  classificationLabels: typeof CLASSIFICATION_LABELS
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
