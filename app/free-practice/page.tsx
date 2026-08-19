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
export default function FreePractice() {
  return (
    <main style={{ width: "100%", minHeight: "100vh" }}>
      <iframe
        src="/studio/pmp-practice-free.html"
        title="Free PMP Practice"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}
