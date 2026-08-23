// ---------------------------------------------------------------------------
// The notice a participant reads before they begin.
//
// Owner-approved wording, 23 August 2026, verbatim. Nothing here was written
// by the system and nothing here may be rewritten by it.
//
// ── WHY IT SITS ON STEP 1 ──────────────────────────────────────────────────
//
// Step 1 is where the three narrative questions are asked. A retention notice
// that appeared after someone had already written about their marriage would
// be a record of what happened, not a choice they made — so it goes above the
// step that collects the text, where it is still information they can act on.
//
// ── EVERY SENTENCE IS ASSERTED ─────────────────────────────────────────────
//
// The counts, the absence of AI scoring, the 90 days, the exclusion from the
// Snapshot and the automatic email are all claims about the implementation,
// and tests/liap-privacy-copy.test.ts checks each against the running system
// rather than against this file. A privacy notice that drifts from the code is
// worse than none: it is a promise nobody is keeping.
// ---------------------------------------------------------------------------

export function AssessmentPrivacyNotice() {
  return (
    <section
      aria-labelledby="assessment-privacy-heading"
      className="mb-8 rounded-xl border border-line bg-paper p-5 sm:p-6"
    >
      <h2 id="assessment-privacy-heading" className="text-lg font-bold text-navy">
        Your Privacy Matters
      </h2>

      <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700">
        <p>
          The Life Project-Ready&trade; Assessment is designed to help you understand where you are
          today and identify areas that may deserve your attention.
        </p>
        <p>
          Your assessment uses 40 scored questions across eight dimensions. Your results are
          calculated using established scoring rules. Artificial intelligence does not determine
          your score or decide whether you are &ldquo;ready.&rdquo;
        </p>
        <p>
          You will also have the opportunity to answer three narrative questions in your own words.
          These responses provide context while you use your assessment results.
        </p>
        <p>
          Your narrative responses are retained in the active application for up to 90 days and then
          removed. They are not included in your downloadable Life Project Snapshot.
        </p>
        <p>
          Your personalized results are available through a secure results page. You will receive an
          automatic results email, and you can download your Life Project Snapshot to keep and use
          as you move forward.
        </p>
        <p>
          Please do not enter highly sensitive personal information that is unnecessary for
          completing the assessment.
        </p>
        <p className="font-medium text-navy">
          By continuing, you acknowledge that you have read this notice and understand how your
          assessment information is used.
        </p>
      </div>
    </section>
  )
}
