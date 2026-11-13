import localFont from 'next/font/local'

// ---------------------------------------------------------------------------
// The Living Is a Project banner. Owner request, 2026-11-04: the assessment
// should open under the Living Is a Project banner, not Wiser Generations, and
// use the campaign art (the golden road and the crown).
//
// The title is live text in the book's typefaces, so it stays sharp at every
// size and always reads "Living Is a Project…Are You Ready?™". The road art is
// from the campaign's email header, faded into the cream ground on its left.
// ---------------------------------------------------------------------------

const cormorant = localFont({
  src: '../../app/fonts/liap/cormorant-garamond-latin-600-normal.woff2',
  weight: '600',
  display: 'swap',
})
const greatVibes = localFont({
  src: '../../app/fonts/liap/great-vibes-latin-400-normal.woff2',
  weight: '400',
  display: 'swap',
})

export function LiapBanner({ eyebrow }: { eyebrow: string }) {
  return (
    <header className="relative overflow-hidden bg-[#FBF9F5]">
      <img
        src="/liap/brand/road.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 top-0 hidden h-full w-auto max-w-none sm:block"
        style={{ WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 40%)', maskImage: 'linear-gradient(90deg, transparent 0%, #000 40%)' }}
      />
      <div className="relative mx-auto max-w-5xl px-5 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8A5A0C] sm:text-xs">{eyebrow}</p>
        <p className={`${cormorant.className} mt-3 text-4xl leading-none text-[#001B3A] sm:text-6xl`}>
          Living Is a Project&hellip;
        </p>
        <p className={`${greatVibes.className} mt-1 text-4xl leading-tight text-[#A86F14] sm:text-6xl`}>
          Are You Ready?&trade;
        </p>
        <p className="mt-3 max-w-[22rem] text-[11px] uppercase tracking-[0.12em] text-[#1E2F55] sm:max-w-none sm:text-xs">
          Find hidden resources &middot; Navigate risks &middot; Build sustainable success
        </p>
      </div>
      <div className="relative flex items-center gap-3 border-t-[3px] border-[#CC9C48] bg-[#001B3A] px-5 py-2.5 sm:px-8">
        <img src="/liap/brand/crown.png" alt="" aria-hidden="true" width={34} height={28} className="h-7 w-auto" />
        <span className={`${cormorant.className} text-sm tracking-[0.14em] text-[#CC9C48] sm:text-base`}>
          CRYSTAL GLOVER STEWART, PMP&reg;
        </span>
      </div>
    </header>
  )
}
