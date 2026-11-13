import type { ReactNode } from 'react'

/**
 * One labelled field.
 *
 * The label is a real <label for>, the error is tied by aria-describedby and
 * announced, and the hint is not the only way to understand the field. None
 * of that is optional on a form people fill in on a phone.
 */
export function Field({
  id, label, hint, error, children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-sm font-bold text-navy">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-0.5 text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5" aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}>
        {children}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClass =
  'w-full min-h-[44px] rounded-xl border border-line bg-white px-3 text-base text-ink ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy'
