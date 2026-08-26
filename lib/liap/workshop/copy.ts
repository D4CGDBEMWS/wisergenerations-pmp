// ---------------------------------------------------------------------------
// The seven Virtual Workshop emails.
//
// ── APPROVED, AND THE CODE STILL ENFORCES IT ───────────────────────────────
//
// The artifact arrived stamped "OWNER REVIEW DRAFT — Customer-facing copy is
// not approved for production until owner approval", with an unsigned Approval
// Sheet, while the owner instruction called the seven emails approved and
// locked. That conflict was reported rather than guessed at, and the owner has
// since approved the review draft — 25 August 2026, in session.
//
// So `approved` is true, and the gate stays exactly where it was. Every send
// path calls assertSendable() and it throws on anything false. That is the
// mechanism for the next revision as much as this one: copy that goes back
// into review flips one boolean and stops being sendable, rather than relying
// on somebody remembering to unwire a caller.
//
// What is emphatically NOT covered by that approval: the ten survey questions,
// which their own artifact's Owner Approval Queue still lists as OWNER REVIEW.
// See lib/liap/workshop/survey.ts, where SURVEY_APPROVED remains false.
//
// ── THE BODIES ARE TRANSCRIBED, NOT WRITTEN ────────────────────────────────
//
// Every word below is the owner's, copied from
// LIAP_Virtual_Workshop_Email_Sequence_Owner_Review.docx. Nothing was
// tightened, modernised, reordered or "improved". Where the source ran two
// labels together on one line, the line break is restored and nothing else.
// ---------------------------------------------------------------------------

/**
 * Merge fields automation may insert, per owner instruction §N.
 *
 * An allow-list rather than a pattern: "insert only approved merge fields"
 * means an unknown placeholder appearing in a body is a fault to catch, not a
 * variable to helpfully resolve.
 */
export const APPROVED_MERGE_FIELDS = [
  'First Name',
  'Date',
  'Time + Time Zone',
  'Workshop Link / Access Instructions',
  'Workshop Link',
  'Replay Link',
  'Participant Material Link',
  'Survey / Reflection Link',
  'Retreat Interest Link',
  'Complete the Reflection',
] as const

export type MergeField = (typeof APPROVED_MERGE_FIELDS)[number]

export type WorkshopEmailId =
  | 'registration-confirmation'
  | 'preparation-reminder'
  | 'final-reminder'
  | 'attendee-follow-up'
  | 'no-show-replay'
  | 'reflection-reminder'
  | 'retreat-bridge'

export interface WorkshopEmail {
  readonly id: WorkshopEmailId
  /** Artifact ordering, 1–7. */
  readonly number: number
  readonly trigger: string
  readonly subject: string
  readonly body: string
  /**
   * The release gate, not a comment. assertSendable() refuses anything false,
   * so returning copy to review is a one-word change that actually stops it.
   */
  readonly approved: boolean
}

const REGISTRATION = `Hi [First Name],

You're registered for the Living Is a Project...Are You Ready?™ Virtual Workshop.

Workshop Date: [Date]
Time: [Time + Time Zone]
Location: Online
Access: [Workshop Link / Access Instructions]

Before we meet, have three things nearby: your copy of Living Is a Project...Are You Ready?™, your assessment results, and one project in your life that deserves your attention.

You do not need to have the project figured out. That is not the assignment. Come ready to look honestly at where you are, where you want to go, and what may need your attention first.

Please remember that workshop registration is non-refundable. If you are unable to attend the live session, registered participants will receive replay access.

I look forward to seeing you there.

Thanks again,
Crystal`

const PREPARATION = `Hi [First Name],

Your Living Is a Project...Are You Ready?™ Virtual Workshop is coming up.

You do not need a perfect plan before you arrive. Bring one real project—something you want to build, change, complete, navigate, or move forward.

Please have:
• Your book
• Your assessment results
• One project you are willing to think through
• Something to write with
• A quiet place where you can participate and reflect

Before the workshop, give yourself a moment to consider one question:

What deserves my attention now?

You do not have to answer everything before we meet. Just bring the project.

See you soon.

Thanks again,
Crystal`

const FINAL_REMINDER = `Hi [First Name],

A quick reminder that your Living Is a Project...Are You Ready?™ Virtual Workshop is [tomorrow/today].

Date: [Date]
Time: [Time + Time Zone]
Join: [Workshop Link]

Bring your book, assessment results, one project, and something to write with.

Please plan to join a few minutes early so you can settle in before we begin.

We are going to start with what is true today—and move from there.

See you soon.

Thanks again,
Crystal`

const ATTENDEE_FOLLOW_UP = `Hi [First Name],

Thank you for joining the Living Is a Project...Are You Ready?™ Virtual Workshop.

You came in with a project. Before rushing toward every answer, you took time to look at what is true today, what deserves your attention, what is around the project, and what your First Move could be.

Now protect that clarity.

Your next step does not have to solve the whole project. It needs to move it.

What is the Next Wise Move you will take within the next 24–48 hours?

Your workshop material is here:
[Participant Material Link]

I would also appreciate your reflection on the experience:
[Survey / Reflection Link]

Keep your Project Snapshot nearby. The road may change. When it does, you can inspect what is true, recalculate, and decide what comes next.

Thanks again,
Crystal`

const NO_SHOW_REPLAY = `Hi [First Name],

We missed you at the Living Is a Project...Are You Ready?™ Virtual Workshop.

Because you were registered for the session, your replay is available here:

[Replay Link]

Before you begin, have your book, assessment results, one project, and something to write with nearby.

The goal is not to watch passively. Give yourself the space to work through the experience and identify what is true today, what project deserves your attention, and what your First Move could be.

Your participant material is here:
[Participant Material Link]

Afterward, you can share your reflection here:
[Survey / Reflection Link]

Your registration remains subject to the workshop's non-refundable policy.

Thanks again,
Crystal`

const REFLECTION_REMINDER = `Hi [First Name],

I hope you have had a little time to think about your Living Is a Project...Are You Ready?™ workshop experience.

If you have not completed the short reflection yet, I would value hearing what became clearer for you and what you decided to do next.

[Complete the Reflection]

Your feedback helps us understand what is serving participants well and where the experience can become stronger.

Most importantly, keep moving on the Next Wise Move you identified.

Thanks again,
Crystal`

const RETREAT_BRIDGE = `Hi [First Name],

During the Virtual Workshop, you began with one important question: What deserves my attention now?

You identified a project, looked more closely at what is true today, considered the people and resources around it, and identified a First Move.

That clarity matters. But a First Move is not yet the entire road.

The LIAP Retreat is the deeper facilitated experience for people who are ready to work through their project beyond the first move and build a more complete roadmap.

The outcome is your Completed Life Project Plan™—a plan you can leave with and continue to use as you move your project forward.

If you would like to learn more about an upcoming Retreat, you can let us know here:

[Retreat Interest Link]

There is no need to have everything figured out before you come. That is why we build the roadmap.

Thanks again,
Crystal`

export const WORKSHOP_EMAILS: readonly WorkshopEmail[] = [
  {
    id: 'registration-confirmation',
    number: 1,
    trigger: 'Immediately after successful registration',
    subject: "You're Registered — Living Is a Project...Are You Ready?™",
    body: REGISTRATION,
    approved: true,
  },
  {
    id: 'preparation-reminder',
    number: 2,
    trigger: '3–5 days before the workshop',
    subject: 'Bring One Project With You',
    body: PREPARATION,
    approved: true,
  },
  {
    id: 'final-reminder',
    number: 3,
    trigger: 'Day before or day of the workshop',
    subject: 'Your LIAP Virtual Workshop — [Date]',
    body: FINAL_REMINDER,
    approved: true,
  },
  {
    id: 'attendee-follow-up',
    number: 4,
    trigger: 'After the live workshop',
    subject: 'Your Next Wise Move',
    body: ATTENDEE_FOLLOW_UP,
    approved: true,
  },
  {
    id: 'no-show-replay',
    number: 5,
    trigger: 'Automatically after attendance reconciliation',
    subject: 'Your LIAP Virtual Workshop Replay',
    body: NO_SHOW_REPLAY,
    approved: true,
  },
  {
    id: 'reflection-reminder',
    number: 6,
    trigger: 'One reminder if reflection is incomplete',
    subject: 'A Quick Reflection on Your LIAP Workshop',
    body: REFLECTION_REMINDER,
    approved: true,
  },
  {
    id: 'retreat-bridge',
    number: 7,
    trigger: 'After workshop follow-up',
    subject: "When You're Ready to Build the Roadmap",
    body: RETREAT_BRIDGE,
    approved: true,
  },
]

export function workshopEmail(id: WorkshopEmailId): WorkshopEmail {
  const found = WORKSHOP_EMAILS.find((e) => e.id === id)
  if (!found) throw new Error(`Unknown workshop email: ${id}`)
  return found
}

/**
 * The one gate between draft copy and a customer's inbox.
 *
 * Every send path must call this first. It throws while the copy is a draft,
 * which is the point: an approval that is only written down in a document
 * somewhere is not an approval a program can respect.
 */
export function assertSendable(id: WorkshopEmailId): void {
  const email = workshopEmail(id)
  if (!email.approved) {
    throw new Error(
      `Workshop email ${email.number} (${id}) is not approved for production and must not be ` +
        'sent. Copy returns to owner review by setting `approved: false`; nothing else is needed ' +
        'to stop it going out.',
    )
  }
}

/** Placeholders actually present in a body, in order of appearance. */
export function mergeFieldsIn(body: string): string[] {
  return [...body.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1])
}

/**
 * Fills approved merge fields and nothing else.
 *
 * An unknown placeholder is left exactly as it was rather than guessed at or
 * stripped — a visible `[Something]` in a test render is a fault somebody can
 * see, where a silent removal is one nobody notices until it is in an inbox.
 */
export function renderBody(body: string, values: Partial<Record<MergeField, string>>): string {
  return body.replace(/\[([^\]]+)\]/g, (whole, field: string) => {
    if (!(APPROVED_MERGE_FIELDS as readonly string[]).includes(field)) return whole
    return values[field as MergeField] ?? whole
  })
}
