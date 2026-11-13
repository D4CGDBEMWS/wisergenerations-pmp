'use client'

import { useState } from 'react'

const NEXT = [
  { v: 'retreat', l: 'The 3-Day Retreat' },
  { v: 'coaching', l: 'One-on-one coaching' },
  { v: 'group', l: 'A support group or community' },
  { v: 'not_now', l: 'Nothing right now' },
]

export function WorkshopSurveyForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0)
  const [mostHelpful, setMostHelpful] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return setError('Please choose a rating.')
    setState('sending')
    setError(null)
    const res = await fetch('/api/liap/workshop-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, rating, mostHelpful: mostHelpful.slice(0, 2000), nextStep }),
    }).catch(() => null)
    if (!res || !res.ok) {
      const data = res ? ((await res.json().catch(() => ({}))) as { error?: string }) : {}
      setError(data.error ?? 'We could not save your answers. Please try again.')
      setState('idle')
      return
    }
    setState('done')
  }

  if (state === 'done') {
    return <p className="rounded-2xl bg-[#F6F1E6] p-6 text-center text-[17px] text-[#001B3A]">Thank you. Your answers help shape what comes next.</p>
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 text-[#1E2F55]">
      <fieldset>
        <legend className="font-semibold text-[#001B3A]">How helpful was the workshop?</legend>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              aria-pressed={rating === n}
              className={`h-12 w-12 rounded-full border text-lg ${rating === n ? 'border-[#001B3A] bg-[#001B3A] text-white' : 'border-[#CC9C48]'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-[#5A5F70]">1 = not helpful · 5 = very helpful</p>
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="font-semibold text-[#001B3A]">What was most helpful? (optional)</span>
        <textarea value={mostHelpful} onChange={(e) => setMostHelpful(e.target.value)} rows={4} maxLength={2000} className="rounded-xl border border-[#EADFC8] p-3" />
      </label>
      <fieldset>
        <legend className="font-semibold text-[#001B3A]">What would help you most next?</legend>
        <div className="mt-3 flex flex-col gap-2">
          {NEXT.map((o) => (
            <label key={o.v} className="flex items-center gap-3">
              <input type="radio" name="next" value={o.v} checked={nextStep === o.v} onChange={() => setNextStep(o.v)} />
              {o.l}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" disabled={state === 'sending'} className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#CC9C48] px-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#001B3A] disabled:opacity-50">
        {state === 'sending' ? 'Sending…' : 'Send my answers'}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
