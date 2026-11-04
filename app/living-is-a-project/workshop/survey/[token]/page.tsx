import localFont from 'next/font/local'
import { notFound } from 'next/navigation'
import { LiapBanner } from '@/components/liap/LiapBanner'
import { WorkshopSurveyForm } from '@/components/liap/WorkshopSurveyForm'
import { isEnabled } from '@/lib/flags'
import { registrationForSurvey } from '@/lib/liap/workshop-service'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false }, title: 'Workshop survey | Living Is a Project…Are You Ready?™' }

const cormorant = localFont({
  src: '../../../../fonts/liap/cormorant-garamond-latin-600-normal.woff2',
  weight: '600',
  display: 'swap',
})

export default async function WorkshopSurvey({ params }: { params: Promise<{ token: string }> }) {
  if (!isEnabled('LIAP')) notFound()
  const { token } = await params
  const reg = await registrationForSurvey(token)
  if (!reg) notFound()
  return (
    <main className="bg-white">
      <LiapBanner eyebrow="Workshop survey" />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <h1 className={`${cormorant.className} text-4xl leading-tight text-[#001B3A]`}>Three quick questions</h1>
        <div className="mt-8">
          {reg.answered ? (
            <p className="rounded-2xl bg-[#F6F1E6] p-6 text-center text-[17px] text-[#001B3A]">You&rsquo;ve already answered. Thank you.</p>
          ) : (
            <WorkshopSurveyForm token={token} />
          )}
        </div>
      </section>
    </main>
  )
}
