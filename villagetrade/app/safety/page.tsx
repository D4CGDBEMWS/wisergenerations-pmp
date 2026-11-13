import { SafetyStandard } from '@/components/SafetyStandard'
import { SectionHeading, Prose, Card } from '@/components/ui'

export const metadata = { title: 'Safety & Conduct — VillageTrade' }

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Safety &amp; Conduct</h1>
      <div className="mt-5">
        <SafetyStandard />
      </div>

      <section className="mt-8" aria-labelledby="tools-heading">
        <SectionHeading id="tools-heading">What you can do</SectionHeading>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="font-bold text-navy">Report</p>
            <Prose><p>Report a listing, a message or a person. Reports reach a moderator.</p></Prose>
          </Card>
          <Card>
            <p className="font-bold text-navy">Block</p>
            <Prose><p>Blocking stops contact and prevents a booking between you both.</p></Prose>
          </Card>
          <Card>
            <p className="font-bold text-navy">Cancel</p>
            <Prose><p>Either side may cancel a booking before it starts, with a reason recorded.</p></Prose>
          </Card>
          <Card>
            <p className="font-bold text-navy">Incident review</p>
            <Prose><p>Reported incidents are reviewed, and outcomes recorded against the account.</p></Prose>
          </Card>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          These controls are being built. They are described here so the standard is visible from
          the start; they are not yet operational, and VillageTrade is not accepting members.
        </p>
      </section>
    </div>
  )
}
