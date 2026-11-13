'use client'

import { useState } from 'react'
import { trackLiap } from '@/lib/liap/analytics'

// ---------------------------------------------------------------------------
// Workshop session picker + checkout button. The price and the session's
// open/closed state are decided on the server (app/api/liap/workshop); this
// only sends the chosen session key. A failure says what happened and leaves
// the button usable.
// ---------------------------------------------------------------------------

export interface PickerDay {
  day: string
  sessions: { key: string; time: string; label: string; open: boolean }[]
}

function referralFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return new URLSearchParams(window.location.search).get('p')
  } catch {
    return null
  }
}

export function WorkshopRegister({ days, priceLabel, terms }: { days: PickerDay[]; priceLabel: string; terms: string }) {
  const [choice, setChoice] = useState<string>('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const anyOpen = days.some((d) => d.sessions.some((s) => s.open))

  async function start() {
    if (!choice) {
      setError('Please choose a session first.')
      return
    }
    setLoading(true)
    setError(null)
    trackLiap('liap_workshop_clicked')
    try {
      const referral = referralFromUrl()
      const res = await fetch('/api/liap/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: choice, ...(referral ? { p: referral } : {}) }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'We could not start checkout. Please try again in a moment.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('We could not reach checkout. Please check your connection and try again.')
      setLoading(false)
    }
  }

  if (!anyOpen) {
    return (
      <p className="rounded-2xl border border-[#CC9C48] bg-[#F6F1E6] p-5 text-[15px] text-[#1E2F55]">
        Registration for these dates has closed. New dates will be announced soon.
      </p>
    )
  }

  return (
    <div>
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8A5A0C]">Choose one session</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((d) => (
            <div key={d.day} className="rounded-2xl border border-[#EADFC8] p-4">
              <p className="font-semibold text-[#001B3A]">{d.day}</p>
              <div className="mt-3 flex flex-col gap-2">
                {d.sessions.map((s) => (
                  <label
                    key={s.key}
                    className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm ${
                      !s.open
                        ? 'cursor-not-allowed border-gray-200 text-gray-400'
                        : choice === s.key
                          ? 'border-[#001B3A] bg-[#001B3A] text-white'
                          : 'border-[#CC9C48] text-[#1E2F55] hover:bg-[#F6F1E6]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="session"
                      value={s.key}
                      disabled={!s.open}
                      checked={choice === s.key}
                      onChange={() => setChoice(s.key)}
                      className="sr-only"
                      aria-label={s.label}
                    />
                    <span aria-hidden="true">{choice === s.key ? '●' : '○'}</span>
                    <span>{s.time}</span>
                    {!s.open && <span className="ml-auto text-xs">Closed</span>}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 flex items-start gap-3 text-sm text-[#1E2F55]">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4" />
        <span>I understand: {terms}</span>
      </label>

      <button
        type="button"
        onClick={start}
        disabled={loading || !agreed}
        className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#CC9C48] px-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#001B3A] disabled:opacity-50 sm:w-auto"
      >
        {loading ? 'Opening checkout…' : `Register · ${priceLabel}`}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
