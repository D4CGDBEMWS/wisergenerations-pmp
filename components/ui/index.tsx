'use client'

import { forwardRef, useId, type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// UI primitives.
//
// The Phase 0 audit found no Button, Input, Field or Card anywhere — every
// control on the site is inline Tailwind written per page, and there are zero
// focus-visible declarations sitewide. These are the primitives the Life
// Project-Ready assessment will need, built accessibly now so the assessment
// inherits it rather than reinventing it.
//
// Conventions enforced here rather than left to callers:
//   · every interactive element has a visible focus ring
//   · minimum 44px touch target on controls
//   · errors are tied to their input with aria-describedby and aria-invalid
//   · status is never carried by colour alone — there is always an icon or
//     a word alongside it
// ---------------------------------------------------------------------------

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold'

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/* ── Button ─────────────────────────────────────────────────────────────── */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, disabled, children, className, ...rest },
  ref
) {
  const styles = {
    primary: 'bg-navy text-white hover:bg-navy/90',
    secondary: 'bg-gold text-navy hover:bg-gold/90',
    ghost: 'border border-navy/30 text-navy hover:bg-navy/5',
  }[variant]

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      // Communicates busy state to assistive tech, not just visually.
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-3',
        'text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
        styles,
        FOCUS,
        className
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  )
})

/* ── FormField ──────────────────────────────────────────────────────────── */

interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (ids: { inputId: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
}

/**
 * Owns the label/hint/error wiring so no caller has to remember it.
 *
 * The render-prop shape is deliberate: it hands the input its own id and the
 * exact aria-describedby string, so the association cannot drift the way it
 * does when each page wires its own.
 */
export function FormField({ label, hint, error, required, children }: FieldProps) {
  const base = useId()
  const inputId = `${base}-input`
  const hintId = hint ? `${base}-hint` : undefined
  const errorId = error ? `${base}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-navy">
        {label}
        {required && (
          <span className="ml-1 text-gray-600">
            <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-gray-600">
          {hint}
        </p>
      )}
      {children({ inputId, describedBy, invalid: Boolean(error) })}
      {error && <ErrorMessage id={errorId!}>{error}</ErrorMessage>}
    </div>
  )
}

/* ── ErrorMessage ───────────────────────────────────────────────────────── */

export function ErrorMessage({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 text-xs font-medium text-red-700"
    >
      {/* The icon is what stops this being status-by-colour-alone. */}
      <span aria-hidden="true">⚠</span>
      <span>{children}</span>
    </p>
  )
}

/* ── Inputs ─────────────────────────────────────────────────────────────── */

const CONTROL =
  'min-h-[44px] w-full rounded-lg border px-3 py-2 text-sm text-navy placeholder:text-gray-500 ' +
  'border-gray-300 bg-white aria-[invalid=true]:border-red-600 aria-[invalid=true]:border-2'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cx(CONTROL, FOCUS, className)} {...rest} />
  }
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} rows={4} className={cx(CONTROL, FOCUS, 'min-h-[110px]', className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cx(CONTROL, FOCUS, className)} {...rest}>
        {children}
      </select>
    )
  }
)

export function Checkbox({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  const id = useId()
  return (
    <div className="flex min-h-[44px] items-start gap-3 py-2">
      <input
        id={id}
        type="checkbox"
        className={cx('mt-0.5 h-5 w-5 shrink-0 rounded border-gray-400 text-navy', FOCUS)}
        {...rest}
      />
      <label htmlFor={id} className="text-sm leading-6 text-gray-700">
        {label}
      </label>
    </div>
  )
}

/* ── RadioGroup ─────────────────────────────────────────────────────────── */

export function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: {
  legend: string
  name: string
  options: { value: string; label: ReactNode }[]
  value?: string
  onChange?: (value: string) => void
  error?: string
}) {
  const base = useId()
  const errorId = error ? `${base}-error` : undefined

  return (
    // fieldset/legend is what gives a screen reader the question alongside
    // each option — the assessment depends on this working correctly.
    <fieldset aria-describedby={errorId} aria-invalid={Boolean(error) || undefined}>
      <legend className="mb-2 text-sm font-semibold text-navy">{legend}</legend>
      <div className="flex flex-col gap-1">
        {options.map((option) => {
          const id = `${base}-${option.value}`
          return (
            <div key={option.value} className="flex min-h-[44px] items-center gap-3">
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange?.(option.value)}
                className={cx('h-5 w-5 shrink-0 border-gray-400 text-navy', FOCUS)}
              />
              <label htmlFor={id} className="text-sm text-gray-700">
                {option.label}
              </label>
            </div>
          )
        })}
      </div>
      {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </fieldset>
  )
}

/* ── Card ───────────────────────────────────────────────────────────────── */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-2xl border border-gray-200 bg-white p-6 shadow-sm', className)}>
      {children}
    </div>
  )
}

/* ── ProgressIndicator ──────────────────────────────────────────────────── */

export function ProgressIndicator({
  current,
  total,
  label = 'Progress',
}: {
  current: number
  total: number
  label?: string
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-medium text-gray-700">
        {/* The number is stated in text, so progress does not depend on being
            able to see the bar. */}
        <span>{label}</span>
        <span>
          Step {current} of {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuetext={`Step ${current} of ${total}`}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className="h-full rounded-full bg-gold transition-all motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ── Alert / StatusMessage ──────────────────────────────────────────────── */

const TONES = {
  info: { cls: 'border-navy/20 bg-navy/5 text-navy', icon: 'ℹ', word: 'Information' },
  success: { cls: 'border-green-700/30 bg-green-50 text-green-900', icon: '✓', word: 'Success' },
  warning: { cls: 'border-amber-600/40 bg-amber-50 text-amber-900', icon: '!', word: 'Warning' },
  error: { cls: 'border-red-700/30 bg-red-50 text-red-900', icon: '⚠', word: 'Error' },
} as const

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: keyof typeof TONES
  title?: string
  children: ReactNode
}) {
  const { cls, icon, word } = TONES[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={cx('flex gap-3 rounded-lg border p-4 text-sm', cls)}
    >
      <span aria-hidden="true" className="font-bold">
        {icon}
      </span>
      <div>
        {/* The tone is stated as a word for anyone who cannot see the colour
            or the icon. */}
        <span className="sr-only">{word}: </span>
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
