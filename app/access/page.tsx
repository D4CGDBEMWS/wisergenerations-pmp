import Link from 'next/link'

export const metadata = {
  title: 'PMP® Practice Studio — Included with Study Access',
  description: '694 practice questions, a full-length 200-question mock exam, ITTO flashcards, and a PMBOK® glossary — included with Wiser Generations Int’l Study Access, $49/month.',
}

export default function AccessPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#0a1628] text-white py-16 px-4 text-center">
        <span className="inline-block bg-yellow-400 text-[#0a1628] text-sm font-bold px-4 py-1 rounded-full mb-4 uppercase">PMP® Practice Studio</span>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">PMP® Practice Studio<br /><span className="text-yellow-400">694 Questions + Mock Exam</span></h1>
        <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">694 practice questions, a full-length 200-question timed mock exam, ITTO flashcards, and a glossary — included with Study Access.</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl font-bold text-yellow-400">$49</span>
          <span className="text-gray-300 text-lg font-medium">/month · cancel anytime</span>
        </div>
        <div className="mt-8">
          <Link href="/checkout" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-[#0a1628] font-bold py-4 px-10 rounded-xl text-lg transition-colors">Start Study Access — $49/month</Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">Already a member? <Link href="/access/login" className="text-yellow-400 font-semibold hover:underline">Sign in here</Link></p>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#0a1628]">What&apos;s included with Study Access:</h2>
            {[
              ['PMP Exam Simulator', '694 practice questions across all 3 ECO domains, every question with a full rationale. Shuffle mode and topic filter included.'],
              ['Full-Length Mock Exam', '200-question timed mock exam (230 minutes) with a question navigator — mirrors the real PMP exam experience.'],
              ['ITTO Flashcards', '40 ITTO process flashcards + a 30-term PMBOK glossary, with flip-cards and category filters.'],
              ['Unlimited Retakes', 'Questions shuffle every session so you learn concepts, not just answers.'],
              ['Monthly PM Templates', 'A new Wiser Generations Int’l branded PM template delivered on the 1st of each month.'],
              ['Live Q&A Office Hours', 'Monthly live Q&A sessions with Crystal and the Wiser Generations team.'],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-4 items-start p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <div><h3 className="font-bold text-[#0a1628]">{t}</h3><p className="text-gray-600 text-sm">{d}</p></div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 h-fit">
            <h2 className="text-2xl font-bold text-[#0a1628] mb-2">Start Study Access</h2>
            <p className="text-gray-600 mb-6">$49/month, cancel anytime. Instant access to the PMP Practice Studio and every study tool after checkout.</p>
            <Link href="/checkout" className="block text-center w-full bg-yellow-400 hover:bg-yellow-300 text-[#0a1628] font-bold py-4 rounded-xl text-lg transition-colors">Start Study Access — $49/month</Link>
            <p className="mt-4 text-center text-xs text-gray-500">Secure checkout by Stripe. Cancel anytime.</p>
            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-600">Already a member? <Link href="/access/login" className="text-yellow-600 font-semibold hover:underline">Sign in here</Link></p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-[#0a1628] text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Cancel Anytime</h2>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">No long-term commitment. Study Access is month-to-month — keep it for as long as you&rsquo;re preparing, and cancel whenever you&rsquo;re ready.</p>
        <Link href="/checkout" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-[#0a1628] font-bold py-4 px-10 rounded-xl text-lg">Start Study Access — $49/month</Link>
      </section>
    </main>
  )
}
