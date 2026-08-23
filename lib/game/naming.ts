// ---------------------------------------------------------------------------
// What the game is called.
//
// One home, because a product name that lives in six string literals is a
// product name that will be wrong in two of them within a month. Everything
// customer-facing reads from here: the page heading, the browser tab, the
// teaser, and the teaser's title — which is derived rather than typed a second
// time, so the full game and the preview can never disagree about the first
// four words of their own name.
//
// ── WHAT IS DELIBERATELY NOT RENAMED ───────────────────────────────────────
//
// Owner ruling: technical identifiers do not follow a public name. The route
// stays /liap/game, the flags stay FEATURE_LIAP_GAME and
// FEATURE_LIAP_GAME_PREVIEW, the component stays GameClient, the modules stay
// under lib/game, and every scenario id is untouched. Renaming those would
// churn a working system to match a marketing decision no user can see, and
// would break the one thing that must not break — a printed URL.
//
// The phrase "a day in the life of a project manager" may still be used
// descriptively where it reads naturally. It is not the product name.
// ---------------------------------------------------------------------------

/**
 * Owner-approved product name. The whole name, everywhere.
 *
 * The teaser carries it unmodified — no "— Game Preview" suffix, no variant.
 * It is the same product met in a smaller way, and the closing line is what
 * tells someone they have seen one hour of it rather than the title.
 */
export const GAME_NAME = 'Living Life as a Project Manager'

/** Owner-approved supporting line. */
export const GAME_SUPPORTING_LINE =
  'Experience the decisions. Live with the consequences. Discover the wisdom.'

// No brand suffix constant, deliberately. app/layout.tsx sets
//
//   title: { template: '%s | Wiser Generations Int'l' }
//
// so Next appends the brand to every page title already. A page that adds its
// own gets it twice — which is what these two pages did, and what most of the
// site still does: /liap/book, /living-is-a-project and the assessment all
// render "… | Wiser Generations | Wiser Generations Int'l" today, and /faq
// manages the brand three times. Reported, not fixed here: those pages are
// outside this authorisation.
//
// These two pages pass the bare name and let the template do its job.
