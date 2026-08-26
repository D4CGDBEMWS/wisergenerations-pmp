// ---------------------------------------------------------------------------
// Every fixed string the Participant Display shows.
//
// ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
//
// Reconciliation caught a hole in my own content inventory. The inventory was
// generated from the content constants, so it covered the prompts and the
// event names — and completely missed eight strings hardcoded in the display
// component's JSX. Eight participant-facing lines, projected onto a wall,
// that no review had ever seen.
//
// A generated inventory is only as complete as what it reads. So the display's
// copy lives here, as data, and the inventory reads it too. A new string typed
// straight into the component is now the anomaly rather than the norm.
//
// ── PROVENANCE ─────────────────────────────────────────────────────────────
//
// Four came from approved artifacts. The other four — the page heading, the
// waiting state, the clock label and the line introducing a team's own words —
// have no artifact equivalent, because the physical Journey Map is a visual
// and carries no projected-screen chrome. The owner reviewed and approved
// those four as written.
// ---------------------------------------------------------------------------

export interface DisplayString {
  readonly id: string
  readonly text: string
  readonly where: string
  readonly source: string | null
}

export const DISPLAY_COPY = {
  /** Artifact 7 §6, STARTING PROMPT — verbatim. The wall before any decision. */
  startingPrompt: 'You have your project. Start with what is true today. Then decide your first move.',

  /** Artifact 4, ROAD EVENT LOG column header — verbatim. */
  decidedLabel: 'WHAT DID WE DECIDE?',

  /** Artifact 3, ROADMAP CHECK, minus the facilitator's "Ask:" prefix. */
  roadmapCheck:
    'Does this change your First Move, Decision/Milestone Check, Next Milestone, later milestone, or Destination? If yes, revise the road.',

  /** Artifact 4, footer — verbatim. Shown once a Destination has been revised. */
  roadCanChange: 'The road can change without the journey ending.',

  // ── OWNER-APPROVED AS WRITTEN — no artifact equivalent exists ────────────
  /** The projected map's heading. */
  heading: 'THE JOURNEY',
  /** Before the console has answered. */
  waiting: 'Waiting for the facilitator…',
  /** Label above the participant clock. */
  taskWindow: 'task window',
  /** Introduces the team's own earlier words under a consequence. */
  becauseYouDecided: 'Because you decided:',
} as const

/** For the content inventory. Order matches DISPLAY_COPY. */
export const DISPLAY_STRINGS: readonly DisplayString[] = [
  {
    id: 'display.starting-prompt',
    text: DISPLAY_COPY.startingPrompt,
    where: 'Participant Display, before the team has recorded a decision',
    source: 'Artifact 7 §6 — Launch Script & Team Start, STARTING PROMPT',
  },
  {
    id: 'display.decided-label',
    text: DISPLAY_COPY.decidedLabel,
    where: "Participant Display, heading above the team's most recent decision",
    source: 'Artifact 4 — Journey Documentation Tool, ROAD EVENT LOG column',
  },
  {
    id: 'display.roadmap-check',
    text: DISPLAY_COPY.roadmapCheck,
    where: 'Participant Display, under a revealed Road Event until the team answers',
    source: 'Artifact 3 — ROADMAP CHECK, identical on all eight cards',
  },
  {
    id: 'display.road-can-change',
    text: DISPLAY_COPY.roadCanChange,
    where: 'Participant Display, once a recalculation has revised the Destination',
    source: 'Artifact 4 — Journey Documentation Tool, footer',
  },
  {
    id: 'display.heading',
    text: DISPLAY_COPY.heading,
    where: 'Participant Display, page heading',
    source: null,
  },
  {
    id: 'display.waiting',
    text: DISPLAY_COPY.waiting,
    where: 'Participant Display, before the console has answered',
    source: null,
  },
  {
    id: 'display.task-window',
    text: DISPLAY_COPY.taskWindow,
    where: 'Participant Display, label above the 90-minute clock',
    source: null,
  },
  {
    id: 'display.because-you-decided',
    text: DISPLAY_COPY.becauseYouDecided,
    where: "Participant Display, introducing the team's own words under a consequence",
    source: null,
  },
]
