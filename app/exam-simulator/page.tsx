export const metadata = {
  title: "PMP Practice Studio | Wiser Generations",
  description: "694 PMP-style practice questions, a full-length mock exam, ITTO flashcards, and a PMBOK 8 glossary.",
};

export default function ExamSimulatorPage() {
  return (
    <main style={{ width: "100%", minHeight: "100vh" }}>
      <iframe
        src="/studio/pmp-practice-studio.html?full=1"
        title="PMP Practice Studio"
        style={{ width: "100%", height: "100vh", border: "0", display: "block" }}
      />
    </main>
  );
}
