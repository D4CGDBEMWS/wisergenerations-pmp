import Image from 'next/image'
import Link from 'next/link'
import localFont from 'next/font/local'
import { LiapCta } from '@/components/liap/LiapCta'
import { AuthorSignup } from '@/components/liap/AuthorSignup'
import { LIAP_BOOK, LIAP_RETREAT } from '@/lib/liap/product'
import { publicationDate } from '@/lib/liap/launch'
import { assessmentOpen, assessmentTimingShort } from '@/lib/liap/assessment-availability'
import { PREBUY_BONUS } from '@/lib/liap/bonus'
import { RetreatCta } from '@/components/liap/RetreatCta'
import { isEnabled } from '@/lib/flags'

// ---------------------------------------------------------------------------
// Crystal Glover Stewart — author page.
//
// Lives inside the Living Is a Project tree on purpose: it inherits the
// FEATURE_LIAP gate, the LIAP metadata (no PMP keywords or share card) and
// the LIAP shell (no PMP navigation, no PMP newsletter band) from
// app/living-is-a-project/layout.tsx and lib/shell.ts, with nothing to
// remember. The short address /author redirects here (next.config.mjs).
//
// Copy rules, from the owner:
//   - Book title: Living Is a Project…Are You Ready?™
//   - "Pre-buy", not "preorder", in this page's customer-facing copy.
//   - Approved campaign lines (2026 Marketing Package) are used verbatim.
//   - Tagline: "Your PM Evangelist" — never "PMP", which is PMI's mark.
//   - No STEADY framework on public pages.
//   - Price and date come from lib/liap/product.ts and lib/liap/launch.ts.
//
// Deliberately NOT on this page yet (owner to supply):
//   - Reader / endorser quotes. No placeholder quotes ship to production.
//   - Descriptions and covers for the other three books. Owner ruling
//     2026-10-29: shown as "Coming soon" with "Notify me" (to the free-guide
//     sign-up); no dates, prices or book pages until each is ready.
//   - A booking page for the workshop; its CTA goes to /contact. The retreat
//     card opens Stripe checkout when FEATURE_LIAP_RETREAT is on, otherwise /contact.
// ---------------------------------------------------------------------------

// Bundled (SIL Open Font License, see app/fonts/liap) rather than fetched from
// Google at build time, so a build never depends on a third-party request.
const cormorant = localFont({
  src: [
    { path: '../../fonts/liap/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/liap/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../fonts/liap/cormorant-garamond-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/liap/cormorant-garamond-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../../fonts/liap/cormorant-garamond-latin-600-italic.woff2', weight: '600', style: 'italic' },
  ],
  display: 'swap',
})
const greatVibes = localFont({
  src: '../../fonts/liap/great-vibes-latin-400-normal.woff2',
  weight: '400',
  display: 'swap',
})

/** Owner-approved offer prices from the 2026 Marketing Package. */
const WORKSHOP_PRICE = '$49'
const SPONSOR_FROM = '$1,000'

const GOLD_TEXT = 'text-[#8A5A0C]'
const GOLD_ACCENT = 'text-[#A86F14]'
const BODY = 'text-[#1E2F55]'
const EYEBROW = `text-xs font-medium uppercase tracking-[0.3em] ${GOLD_TEXT}`
const RULE = 'border-t border-[#EADFC8]'

const OTHER_BOOKS = [
  { title: 'You Just Never Know', subtitle: 'Whose Report Will You Believe', color: '#5B2A6E' },
  { title: 'Love Smells Like Gardenias', subtitle: null, color: '#A8566F' },
  { title: 'The Chronicles of Grandma Ya Ya', subtitle: null, color: '#B4532A' },
] as const

export const metadata = {
  title: 'Crystal Glover Stewart, Author',
  description: `Author of Living Is a Project…Are You Ready?™ — publishing ${publicationDate()}. Pre-buy now and receive the Life Project-Ready™ Assessment free.`,
}

function SectionHeading({ eyebrow, title, center = true }: { eyebrow: string; title: string; center?: boolean }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <p className={EYEBROW}>{eyebrow}</p>
      <h2 className={`${cormorant.className} mt-3 text-4xl font-medium leading-tight text-navy sm:text-5xl`}>{title}</h2>
    </div>
  )
}

export default function AuthorPage() {
  return (
    <div className="bg-white text-navy">
      {/* Announcement */}
      <div className="border-b border-[#EADFC8] bg-[#FBF6EC]">
        <p className="mx-auto max-w-6xl px-5 py-2.5 text-center text-sm text-navy">
          New book publishes <strong>{publicationDate()}</strong> · Pre-buy now and get the Life
          Project-Ready™ Assessment free ·{' '}
          <a href="#book" className={`font-semibold underline ${GOLD_TEXT}`}>
            Pre-buy →
          </a>
        </p>
      </div>

      {/* In-page navigation */}
      <nav aria-label="Author page" className={`border-b border-[#EADFC8]`}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <span className={`${cormorant.className} text-2xl font-semibold`}>Crystal Glover Stewart</span>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium uppercase tracking-[0.08em]">
            <li><a href="#book" className="hover:text-[#8A5A0C]">The Book</a></li>
            <li><a href="#assessment" className="hover:text-[#8A5A0C]">Assessment</a></li>
            <li><a href="#next-steps" className="hover:text-[#8A5A0C]">Next Steps</a></li>
            <li><a href="#about" className="hover:text-[#8A5A0C]">About</a></li>
            <li><a href="#books" className="hover:text-[#8A5A0C]">All Books</a></li>
            <li><a href="#free-guide" className="hover:text-[#8A5A0C]">Free Guide</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero: the signature book */}
      <section id="book" className="relative overflow-hidden">
        <Image src="/liap/author/floral-corner.png" alt="" width={410} height={540} className="pointer-events-none absolute -left-12 -top-8 w-[230px] opacity-90 sm:w-[260px]" priority />
        <Image src="/liap/author/floral-stem.png" alt="" width={344} height={740} className="pointer-events-none absolute -bottom-20 -right-10 hidden w-[210px] opacity-90 md:block" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className={`${cormorant.className} text-2xl font-medium`}>
              Your <em className={GOLD_ACCENT}>PM</em> Evangelist
            </p>
            <p className={`mt-3 ${EYEBROW}`}>New book · Publishes {publicationDate()}</p>
            <h1 className={`${cormorant.className} mt-5 text-5xl font-medium leading-[1.05] sm:text-6xl`}>
              The bend is not the end. <em className={GOLD_ACCENT}>Be ready to make the turn.</em>
            </h1>
            <p className={`mt-6 max-w-xl text-lg leading-relaxed ${BODY}`}>
              <em>Living Is a Project…Are You Ready?™</em> gives readers practical tools to embrace and
              manage change — expected or unexpected — by helping them recognize where they are, uncover
              hidden resources, evaluate risks and priorities, and identify their next best steps.
            </p>
            <p className={`${greatVibes.className} mt-4 text-4xl ${GOLD_ACCENT}`}>by Crystal Glover Stewart, PMP®</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <LiapCta label={`Pre-buy the book — ${LIAP_BOOK.priceLabel}`} />
              <a href="#assessment" className={`text-[15px] font-semibold underline ${GOLD_TEXT}`}>
                Includes the free assessment ↓
              </a>
            </div>
            <p className={`mt-4 text-[15px] font-semibold ${GOLD_TEXT}`}>Bonus: {PREBUY_BONUS.offer}</p>
            <p className={`mt-2 text-sm ${BODY}`}>
              Hardcover · Goshen Publishing · Ships from {publicationDate()}
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[300px]">
            <Image
              src="/liap/author/living-is-a-project-cover.png"
              alt="Living Is a Project…Are You Ready? by Crystal Glover Stewart, PMP® — book cover"
              width={512}
              height={768}
              priority
              className="h-auto w-full drop-shadow-[0_22px_34px_rgba(0,27,58,0.28)]"
            />
          </div>
        </div>
      </section>

      {/* The book, continued */}
      <section className={RULE}>
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className={EYEBROW}>Inside the book</p>
          <p className={`${cormorant.className} mt-4 text-3xl font-semibold leading-snug`}>
            Some life projects are chosen. Others choose us. Either way, we still need a plan for what
            comes next.
          </p>
          <p className={`mt-5 text-[17px] leading-relaxed ${BODY}`}>
            A job ends. A diagnosis comes. A parent needs care. A season you planned turns into one you
            didn&rsquo;t. Crystal takes the discipline she used to lead enterprise projects and turns it
            toward the projects of real life.
          </p>
          <p className={`mt-6 text-[13px] font-medium uppercase tracking-[0.24em] text-navy`}>
            Discover the hidden resources · Navigate the risks · Build sustainable success
          </p>
        </div>
      </section>

      {/* The quote */}
      <section className={`relative overflow-hidden ${RULE}`}>
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className={EYEBROW}>A wise man once said</p>
          <blockquote className={`${cormorant.className} mt-4 text-3xl italic leading-snug sm:text-4xl`}>
            &ldquo;A bend in the road is not the end of the road, unless you fail to turn.&rdquo;
          </blockquote>
          <Image
            src="/liap/author/winding-sign.jpg"
            alt="A winding road through autumn woods with a curving-road sign"
            width={1536}
            height={1024}
            sizes="(min-width: 768px) 720px, 100vw"
            className="mx-auto mt-10 h-auto w-full max-w-[720px] rounded-[28px]"
          />
        </div>
      </section>

      {/* The assessment */}
      <section id="assessment" className={RULE}>
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className={EYEBROW}>Included when you pre-buy</p>
            <h2 className={`${cormorant.className} mt-3 text-4xl font-medium leading-tight sm:text-5xl`}>
              The Life Project-Ready™ Assessment
            </h2>
            <p className={`${greatVibes.className} mt-3 text-3xl ${GOLD_ACCENT}`}>
              Before you build the plan, understand where you are.
            </p>
            <p className={`mt-4 text-[17px] leading-relaxed ${BODY}`}>
              A personalized assessment across eight key life dimensions that gives you a clear snapshot of
              where you are — and what needs your attention most.
            </p>
            <ul className={`mt-6 space-y-3 text-base ${BODY}`}>
              {[
                '8 dimensions. 40 questions.',
                'Personalized insights — not scored like a test',
                'Hidden urgencies identified',
                'Actionable focus areas, three next best steps and a 30/60/90-day plan',
                'Yours to keep. Yours to use.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className={`font-bold ${GOLD_ACCENT}`}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className={`mt-6 text-sm ${BODY}`}>
              {assessmentOpen()
                ? 'Unlocked as soon as your payment is confirmed.'
                : 'Included with your pre-buy and opening soon — we’ll email you when it’s ready.'}{' '}
              <Link href="/living-is-a-project/verify-preorder" className={`font-semibold underline ${GOLD_TEXT}`}>
                Already bought the book elsewhere?
              </Link>
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3" aria-label="The eight dimensions">
            {[
              ['Vision', 'Where this is going'],
              ['Time', 'Room for what matters'],
              ['Money', 'Your financial footing'],
              ['Career & Purpose', 'Work and meaning'],
              ['Relationships', 'Who is alongside you'],
              ['Risk & Readiness', 'What’s protected'],
              ['Wellness & Capacity', 'Energy to spend'],
              ['Legacy & Meaning', 'What this chapter is for'],
            ].map(([name, line]) => (
              <li key={name} className="rounded-xl border border-[#CC9C48] p-4">
                <p className="font-bold">{name}</p>
                <p className={`mt-1 text-[13px] ${BODY}`}>{line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Next steps: the approved offer stack */}
      <section id="next-steps" className={RULE}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHeading eyebrow="Book · Assessment · Workshop · Retreat" title="Choose your next step" />
          <p className={`${greatVibes.className} mt-2 text-center text-3xl ${GOLD_ACCENT}`}>
            Am I positioned and ready to move?
          </p>
          <figure className="mx-auto mt-10 max-w-4xl">
            <Image
              src="/liap/author/sunset-path.jpg"
              alt="A footpath winding over golden hills toward the sunset"
              width={1776}
              height={896}
              sizes="(min-width: 1024px) 896px, 100vw"
              className="h-auto w-full rounded-[28px]"
            />
            <figcaption className={`${cormorant.className} mt-3 text-center text-2xl italic`}>
              Recognition is the beginning. Intentionality moves you forward.
            </figcaption>
          </figure>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <article className="flex flex-col gap-2 rounded-3xl border border-[#CC9C48] p-6">
              <p className={EYEBROW}>Read</p>
              <h3 className={`${cormorant.className} text-2xl font-semibold leading-tight`}>Living Is a Project…Are You Ready?™</h3>
              <p className={`${cormorant.className} text-2xl italic ${GOLD_ACCENT}`}>{LIAP_BOOK.priceLabel}</p>
              <p className={`text-[15px] ${BODY}`}>The book introduces a practical way to approach significant change.</p>
              <a href="#book" className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-4 text-xs font-semibold uppercase tracking-[0.16em] text-navy">Pre-buy now</a>
            </article>
            <article className="flex flex-col gap-2 rounded-3xl border border-[#EADFC8] p-6">
              <p className={EYEBROW}>Assess</p>
              <h3 className={`${cormorant.className} text-2xl font-semibold leading-tight`}>Life Project-Ready™ Assessment</h3>
              <p className={`${cormorant.className} text-2xl italic ${GOLD_ACCENT}`}>Free with pre-buy</p>
              <p className={`text-[15px] ${BODY}`}>Where are you now, what resources are hidden, and what needs attention?</p>
              <a href="#assessment" className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-full border border-navy px-4 text-center text-xs font-semibold uppercase tracking-[0.16em]">See the assessment</a>
            </article>
            <article className="flex flex-col gap-2 rounded-3xl border border-[#EADFC8] p-6">
              <p className={EYEBROW}>Work</p>
              <h3 className={`${cormorant.className} text-2xl font-semibold leading-tight`}>Be Ready to Make the Turn Workshop</h3>
              <p className={`${cormorant.className} text-2xl italic ${GOLD_ACCENT}`}>{WORKSHOP_PRICE}</p>
              <p className={`text-[15px] ${BODY}`}>Know your position. Make your next move. A live 90-minute experience.</p>
              <p className={`text-sm ${BODY}`}>
                First workshops: January 11–15, 2027, live on Zoom. Choose one session: 12:00–1:30 pm or 7:00–8:30 pm Eastern.
              </p>
              <Link href="/contact" className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-full border border-navy px-4 text-center text-xs font-semibold uppercase tracking-[0.16em]">Ask about the January workshop</Link>
            </article>
            <article className="flex flex-col gap-2 rounded-3xl border border-[#EADFC8] p-6">
              <p className={EYEBROW}>Build</p>
              <h3 className={`${cormorant.className} text-2xl font-semibold leading-tight`}>{LIAP_RETREAT.name}</h3>
              <p className={`${cormorant.className} text-2xl italic ${GOLD_ACCENT}`}>{LIAP_RETREAT.priceLabel}</p>
              <p className={`text-[15px] ${BODY}`}>Step away from the noise and build the road ahead. Lodging and meals included.</p>
              <p className={`text-sm ${BODY}`}>
                {LIAP_RETREAT.when} · {LIAP_RETREAT.where}
                <br />
                Limited to {LIAP_RETREAT.capacity} participants · first come, first served.
                {isEnabled('LIAP_RETREAT') && (
                  <>
                    <br />
                    {LIAP_RETREAT.depositLabel} deposit reserves your seat.{' '}
                    <span className="text-xs">{LIAP_RETREAT.cancellation}</span>
                  </>
                )}
              </p>
              {isEnabled('LIAP_RETREAT') ? (
                <RetreatCta label={`Reserve my seat — ${LIAP_RETREAT.depositLabel} deposit`} className="mt-auto" />
              ) : (
                <Link href="/contact" className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-full border border-navy px-4 text-center text-xs font-semibold uppercase tracking-[0.16em]">Join the retreat interest list</Link>
              )}
            </article>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#EADFC8] p-6">
            <div className="min-w-0 flex-1 basis-[420px]">
              <p className={`${cormorant.className} text-2xl font-semibold`}>Founding partners help people be ready to make the turn.</p>
              <p className={`mt-1 text-[15px] ${BODY}`}>
                Sponsor books, workshop seats, retreat participation or community cohorts. Group retreats for 5+
                participants. Founding partnership opportunities begin at {SPONSOR_FROM}.
              </p>
            </div>
            <Link href="/contact" className="inline-flex min-h-[48px] items-center rounded-full border border-navy px-6 text-xs font-semibold uppercase tracking-[0.16em]">Become a founding partner</Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className={RULE}>
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            <div className="h-[150px] w-[150px] rounded-full border border-[#CC9C48] p-1.5">
              <Image
                src="/crystal-glover-stewart-square.jpg"
                alt="Crystal Glover Stewart"
                width={300}
                height={300}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <p className={`mt-6 ${EYEBROW}`}>About the author</p>
            <h2 className={`${cormorant.className} mt-3 text-4xl font-medium leading-tight`}>
              Crystal Glover Stewart, <em className={GOLD_ACCENT}>PMP®</em>
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {['PMP Certified', 'U.S. Army Veteran', '20+ Years Enterprise PM', "Founder, Wiser Generations Int'l"].map((b) => (
                <li key={b} className="rounded-full border border-[#CC9C48] px-3.5 py-2 text-sm font-semibold">{b}</li>
              ))}
            </ul>
          </div>
          <div className={`text-[17px] leading-relaxed ${BODY}`}>
            <p>
              Crystal Glover Stewart started managing projects before project management was her job title. As a
              U.S. Army veteran, she learned to lead teams under pressure, navigate complexity without a playbook,
              and deliver when the stakes were high.
            </p>
            <p className="mt-4">
              After the Army, she spent more than two decades leading enterprise transformation programs across
              industries, earned her PMP, and founded Wiser Generations Int&rsquo;l to teach others to plan work
              that matters and finish it.
            </p>
            <p className="mt-4">
              <em>Living Is a Project…Are You Ready?</em> turns that same discipline toward the projects nobody
              assigns you — the ones that arrive with a phone call.
            </p>
            <p className={`${cormorant.className} mt-6 text-2xl italic leading-snug text-navy`}>
              &ldquo;This book is the blueprint I wish I had, and it offers practical structure for a life worth
              living.&rdquo;
            </p>
            <p className={`${greatVibes.className} mt-1 text-3xl ${GOLD_ACCENT}`}>Crystal</p>
          </div>
        </div>
      </section>

      {/* All books */}
      <section id="books" className={RULE}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <SectionHeading eyebrow="The bookshelf" title="All books by Crystal" />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <li className="flex flex-col overflow-hidden rounded-3xl border border-[#EADFC8]">
              <div className="flex justify-center bg-navy px-6 py-8">
                <Image src="/liap/author/living-is-a-project-cover.png" alt="Living Is a Project…Are You Ready? book cover" width={150} height={225} className="h-auto w-[150px] drop-shadow-[0_14px_22px_rgba(0,0,0,0.35)]" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className={`text-xs font-bold uppercase tracking-[0.08em] ${GOLD_TEXT}`}>Pre-buy now · {publicationDate()}</p>
                <h3 className="text-lg font-semibold leading-snug">Living Is a Project…Are You Ready?™</h3>
                <a href="#book" className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold text-xs font-semibold uppercase tracking-[0.16em] text-navy">Pre-buy — {LIAP_BOOK.priceLabel}</a>
              </div>
            </li>
            {OTHER_BOOKS.map((b) => (
              <li key={b.title} className="flex flex-col overflow-hidden rounded-3xl border border-[#EADFC8]">
                <div className="flex justify-center px-6 py-8" style={{ backgroundColor: b.color }}>
                  <div className="flex aspect-[2/3] w-[150px] items-center justify-center rounded-r-md bg-white p-3 text-center shadow-lg">
                    <p className={`${cormorant.className} text-lg font-bold leading-tight`} style={{ color: b.color }}>
                      {b.title}
                      {b.subtitle ? <span className="mt-1 block text-sm font-medium italic">{b.subtitle}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="text-lg font-semibold leading-snug">
                    {b.title}
                    {b.subtitle ? `: ${b.subtitle}` : ''}
                  </h3>
                  <span className="self-start rounded-full border border-[#EADFC8] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-navy">
                    Coming soon
                  </span>
                  <a
                    href="#free-guide"
                    className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ borderColor: b.color, color: b.color }}
                  >
                    Notify me
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Free guide + weekly emails — layout from the owner's Words to Know
          mockup (2026-10-29), with high-resolution photos. */}
      <section id="free-guide" className={`relative overflow-hidden ${RULE}`}>
        <div className="relative">
          <div className="relative h-64 sm:h-80 lg:absolute lg:inset-0 lg:h-auto">
            <Image
              src="/liap/author/hiker-sunset.jpg"
              alt="A woman with a backpack on a hillside trail, looking out at the sunset"
              fill
              sizes="100vw"
              className="object-cover object-[75%_center]"
            />
            <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-white via-white/90 to-transparent lg:block" />
          </div>
          <div className="relative mx-auto max-w-6xl px-5 py-12 lg:py-20">
            <div className="max-w-xl">
              <h2 className={`${cormorant.className} text-4xl font-semibold leading-[1.05] sm:text-5xl`}>
                You&rsquo;ve Been Managing Projects Longer Than You Think.
              </h2>
              <p className={`mt-5 text-[17px] leading-relaxed ${BODY}`}>
                A move. A career change. A family decision. A vacation. Starting over. You&rsquo;ve planned,
                prioritized, adjusted, managed resources and solved problems.{' '}
                <strong className="text-navy">You just may not have known what to call it.</strong>
              </p>
              <p className={`mt-8 ${EYEBROW}`}>Free guide</p>
              <p className={`${cormorant.className} mt-2 text-3xl font-semibold`}>Words to Know</p>
              <p className={`mt-1 text-[17px] ${BODY}`}>
                30 Project Management Terms to Help You Navigate the Projects That Matter in Life
              </p>
              <AuthorSignup />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-16 pt-4">
          <h3 className={`${cormorant.className} text-center text-4xl font-medium`}>Sound familiar?</h3>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <article className="overflow-hidden rounded-3xl border border-[#EADFC8]">
              <Image src="/liap/author/packing.jpg" alt="A woman packing folded clothes into a suitcase" width={1536} height={1024} sizes="(min-width: 768px) 360px, 100vw" className="h-48 w-full object-cover" />
              <div className="p-6">
                <p className={`${cormorant.className} text-2xl font-semibold`}>You identified what you needed.</p>
                <p className={`mt-2 text-[15px] leading-relaxed ${BODY}`}>
                  You considered where you were going, how long you&rsquo;d be there, what would fit and what you could leave behind.
                </p>
                <p className="mt-3 text-[15px] font-semibold text-navy">There&rsquo;s a project-management word for that.</p>
                <a href="#free-guide" className={`mt-3 inline-block text-[15px] font-semibold ${GOLD_TEXT}`}>Discover it in Words to Know &rarr;</a>
              </div>
            </article>
            <article className="overflow-hidden rounded-3xl border border-[#EADFC8]">
              <Image src="/liap/author/groceries.jpg" alt="A grocery cart full of fresh food in a supermarket aisle" width={1536} height={1024} sizes="(min-width: 768px) 360px, 100vw" className="h-48 w-full object-cover" />
              <div className="p-6">
                <p className={`${cormorant.className} text-2xl font-semibold`}>You had resources &mdash; and limits.</p>
                <p className={`mt-2 text-[15px] leading-relaxed ${BODY}`}>
                  You decided what you needed, what you could spend and what mattered most.
                </p>
                <p className="mt-3 text-[15px] font-semibold text-navy">There are project-management words for that too.</p>
                <a href="#free-guide" className={`mt-3 inline-block text-[15px] font-semibold ${GOLD_TEXT}`}>Discover them in Words to Know &rarr;</a>
              </div>
            </article>
            <article className="overflow-hidden rounded-3xl border border-[#EADFC8]">
              <Image src="/liap/author/winding-sign.jpg" alt="A curving-road warning sign beside a forest road" width={1536} height={1024} sizes="(min-width: 768px) 360px, 100vw" className="h-48 w-full object-cover object-right" />
              <div className="p-6">
                <p className={`${cormorant.className} text-2xl font-semibold`}>The plan changed.</p>
                <p className={`mt-2 text-[15px] leading-relaxed ${BODY}`}>
                  You had to decide whether to stop, wait, adjust or find another way forward.
                </p>
                <p className="mt-3 text-[15px] font-semibold text-navy">You&rsquo;ve managed this before. But did you know there was a process?</p>
                <a href="#free-guide" className={`mt-3 inline-block text-[15px] font-semibold ${GOLD_TEXT}`}>Get Words to Know &rarr;</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className={RULE}>
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className={`${cormorant.className} text-4xl font-medium`}>Questions</h2>
          <dl className="mt-6 space-y-3">
            {[
              ['When do I get the assessment?', assessmentTimingShort()],
              ['Do I get anything right away?', `Yes. As soon as your order is confirmed, you can download the ${PREBUY_BONUS.name} — an adaptive cycle for navigating change.`],
              ['When does the book ship?', `The book publishes ${publicationDate()}. Pre-buy orders ship from that date.`],
              ['How long does the assessment take?', 'Most people finish in fifteen to twenty minutes. It saves as you go, so you can stop and come back.'],
              ['Can I invite Crystal to speak?', 'Yes — churches, teams, veteran groups and conferences. Reach out through the contact page.'],
            ].map(([q, a]) => (
              <div key={q} className="rounded-2xl border border-[#EADFC8] p-5">
                <dt className="font-semibold">{q}</dt>
                <dd className={`mt-1.5 text-[15px] leading-relaxed ${BODY}`}>{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  )
}
