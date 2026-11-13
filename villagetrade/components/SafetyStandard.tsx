import { SAFETY_MESSAGE, PROHIBITED_CONDUCT, EXCLUDED_SERVICES } from '@/lib/safety'

/**
 * The conduct standard, rendered from lib/safety.ts rather than retyped.
 *
 * One source for the page, the booking gate and the stored acknowledgment.
 */
export function SafetyStandard() {
  return (
    <section aria-labelledby="conduct-heading" className="rounded-2xl border-2 border-gold bg-white p-5">
      <h2 id="conduct-heading" className="font-display text-xl font-bold text-navy">
        {SAFETY_MESSAGE}
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        VillageTrade exchanges are professional services between neighbours. The following are
        prohibited between providers and customers:
      </p>
      <ul className="mt-3 space-y-1.5">
        {PROHIBITED_CONDUCT.map((item) => (
          <li key={item} className="flex gap-2 text-sm font-medium text-ink">
            <span aria-hidden="true" className="text-danger">
              ✕
            </span>
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm font-semibold text-ink">
        VillageTrade does not host: {EXCLUDED_SERVICES.join(' or ')}.
      </p>

      {/*
        Required wording, and the most important sentence on the page.
        Verification reduces anonymity. It does not make a stranger safe, and
        saying otherwise would be the single most harmful claim this product
        could make.
      */}
      <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">
        Identity verification does not guarantee anyone’s safety or conduct. VillageTrade does not
        supervise exchanges, guarantee services, or verify professional licences. Meet in public
        first, and use your own judgement about whom you meet and where.
      </p>
    </section>
  )
}
