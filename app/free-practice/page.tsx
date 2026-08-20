import Link from "next/link";

export const metadata = {
  title: "Free PMP® Practice Questions | Wiser Generations",
  description: "Try real PMP-style practice questions free — full rationale on every answer.",
};

// PUBLIC MARKETING ROUTE — no auth gate.
//
// Serves pmp-practice-free.html, which is GENERATED from the full studio by
// scripts/build-free-studio.mjs and contains twelve questions, no mock exam,
// no ITTO cards and no glossary. Do not point this at the full studio: it was
// previously the same file as the paid route, so every question, answer and
// rationale was readable from this page's source whatever the email gate did.
//
// The upgrade bar below the studio is the only route from the free sample to
// the paid product. Before it, someone could work the free questions, like
// them, and find nothing to click — the warmest lead on the site reaching a
// dead end.
//
// It is a slim band rather than a banner or an interstitial on purpose. The
// navbar already hides its CTAs on this route so as not to pull focus from
// someone mid-session, and that judgement is worth keeping: the offer should
// be reachable at any moment without competing with the question in front of
// them. Sizing the studio with flex-1 rather than a viewport calc means the
// bar can change height — wrapping to two lines on a narrow screen — without
// ever overlapping the frame.
export default function FreePractice() {
  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <iframe
        src="/studio/pmp-practice-free.html"
        title="Free PMP Practice"
        className="flex-1 w-full block border-0"
      />

      <aside className="flex-shrink-0 bg-navy text-white px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center">
          <p className="text-sm text-gray-200">
            Ready for the full question bank, the timed mock exam, ITTO flashcards and the glossary?
          </p>
          <Link
            href="/access"
            className="bg-gold text-navy font-bold px-5 py-2 rounded-lg text-sm whitespace-nowrap transition-colors hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            See Practice Studio — $49/mo
          </Link>
        </div>
      </aside>
    </main>
  );
}
