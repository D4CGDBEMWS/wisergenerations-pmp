export const metadata = {
  title: "PMP® Practice Studio | Wiser Generations",
  description: "PMP-style practice questions, a full-length mock exam, ITTO flashcards, and a PMBOK® Guide glossary.",
};

// The studio is served from /api/studio, which checks the STUDY_ACCESS
// entitlement server-side before returning a byte. It is not a static asset:
// as one it sat on the CDN where no guard could see it, and appending ?full=1
// to its URL unlocked the whole paid bank for anyone who asked.
//
// No ?full=1 here on purpose. That flag is read from location.search by the
// studio's own script, so it was only ever a request, never a permission. The
// route sets window.STUDENT_MODE server-side instead.
export default function ExamSimulatorPage() {
  return (
    <main style={{ width: "100%", minHeight: "100vh" }}>
      <iframe
        src="/api/studio"
        title="PMP Practice Studio"
        style={{ width: "100%", height: "100vh", border: "0", display: "block" }}
      />
    </main>
  );
}
