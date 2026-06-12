export const metadata = {
  title: "Free PMP® Practice Questions | Wiser Generations",
  description: "Try real PMP-style practice questions free — full rationale on every answer.",
};

// PUBLIC MARKETING ROUTE — no auth gate, no ?full=1
// This is the free-sample entry point driven by the studio's built-in email gate.
export default function FreePractice() {
  return (
    <main style={{ width: "100%", minHeight: "100vh" }}>
      <iframe
        src="/studio/pmp-practice-studio.html"
        title="Free PMP Practice"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}
