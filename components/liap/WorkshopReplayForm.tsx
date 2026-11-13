'use client'

import { useState } from 'react'

export interface ReplayRow {
  key: string
  label: string
  ended: boolean
  saved: string
}

export function WorkshopReplayForm({ ownerKey, rows }: { ownerKey: string; rows: ReplayRow[] }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.key, r.saved])))
  const [msg, setMsg] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  async function save(key: string) {
    setBusy(key)
    const res = await fetch('/api/liap/workshop-replay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: ownerKey, session: key, replayUrl: values[key] ?? '' }),
    }).catch(() => null)
    const data = res ? ((await res.json().catch(() => ({}))) as { error?: string; sent?: number }) : {}
    setMsg((m) => ({
      ...m,
      [key]: res?.ok ? `Saved. ${data.sent ?? 0} replay email(s) sent now.` : (data.error ?? 'Could not save. Try again.'),
    }))
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((r) => (
        <div key={r.key} className="rounded-2xl border border-[#EADFC8] p-4">
          <p className="font-semibold text-[#001B3A]">{r.label}</p>
          <p className="text-xs text-[#5A5F70]">{r.ended ? 'Session has ended. Replays go out as soon as you save.' : 'Not finished yet. Replays wait until the session ends.'}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              placeholder="https://… replay link"
              value={values[r.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [r.key]: e.target.value }))}
              className="min-h-[44px] flex-1 rounded-xl border border-[#CC9C48] px-3"
            />
            <button type="button" onClick={() => save(r.key)} disabled={busy === r.key} className="min-h-[44px] rounded-full bg-[#001B3A] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-50">
              {busy === r.key ? 'Saving…' : 'Save'}
            </button>
          </div>
          {msg[r.key] && <p className="mt-2 text-sm text-[#1E2F55]">{msg[r.key]}</p>}
        </div>
      ))}
    </div>
  )
}
