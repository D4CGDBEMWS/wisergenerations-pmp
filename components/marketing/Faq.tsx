// ---------------------------------------------------------------------------
// Faq — reusable accordion + FAQPage JSON-LD schema.
//
//   <Faq
//     items={[{ q: 'Question?', a: 'Answer.' }, ...]}
//     heading="Frequently asked"
//   />
//
// Uses native <details> so it works without client JavaScript and is fully
// crawlable by search engines. Emits FAQPage schema inline so Google can
// surface rich snippets in SERPs.
// ---------------------------------------------------------------------------

export type FaqItem = { q: string; a: string }

type Tone = 'light' | 'navy'

export default function Faq({
  items,
  heading = 'Frequently asked',
  tone = 'light',
}: {
  items: readonly FaqItem[]
  heading?: string
  tone?: Tone
}) {
  const isNavy = tone === 'navy'

  return (
    <section aria-label={heading} className={isNavy ? 'bg-navy py-16 text-white' : 'bg-white py-16'}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p
          className={`text-xs font-bold uppercase tracking-[0.18em] ${
            isNavy ? 'text-gold' : 'text-amber-700'
          }`}
        >
          {heading}
        </p>
        <h2
          className={`mt-2 text-3xl font-bold tracking-tight ${
            isNavy ? 'text-white' : 'text-slate-900'
          }`}
        >
          Questions students ask before enrolling
        </h2>

        <div
          className={`mt-8 divide-y rounded-2xl border ${
            isNavy
              ? 'divide-white/10 border-white/15 bg-white/5'
              : 'divide-slate-200 border-slate-200 bg-white shadow-sm'
          }`}
        >
          {items.map((item) => (
            <details key={item.q} className="group p-6">
              <summary
                className={`flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold ${
                  isNavy ? 'text-white' : 'text-slate-900'
                }`}
              >
                {item.q}
                <span
                  className={`text-2xl transition group-open:rotate-45 ${
                    isNavy ? 'text-gold' : 'text-amber-600'
                  }`}
                >
                  +
                </span>
              </summary>
              <p
                className={`mt-3 text-sm leading-6 ${
                  isNavy ? 'text-gray-300' : 'text-slate-600'
                }`}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* JSON-LD: FAQPage schema for Google rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />
    </section>
  )
}
