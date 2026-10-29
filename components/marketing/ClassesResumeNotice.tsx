import { LINKS, classesResumeLabel } from '@/lib/site-config'

// ---------------------------------------------------------------------------
// "Live classes resume in May 2027." Owner ruling 2026-10-29: PMP work is on
// hold until the book launches. Shown at the top of every page that sells or
// schedules live classes. Renders nothing once classes are running again
// (content/config/cohorts.json "enabled": true), so it cannot go stale.
// ---------------------------------------------------------------------------

export function ClassesResumeNotice() {
  const resume = classesResumeLabel()
  if (!resume) return null
  return (
    <div role="status" className="border-b-2 border-gold bg-navy px-4 py-3 text-center text-sm text-white">
      <strong className="text-gold">Live PMP® &amp; CAPM® classes resume in {resume}.</strong>{' '}
      Want to plan your path before then?{' '}
      <a href={LINKS.scheduling} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:no-underline">
        Book a free strategy call →
      </a>
    </div>
  )
}
