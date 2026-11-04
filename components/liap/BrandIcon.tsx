import { BRAND_ICONS, type BrandIconName } from '@/lib/liap/brand-icons'

/** Decorative gold icon from the Living Is a Project set. Hidden from screen readers. */
export function BrandIcon({
  name,
  size = 24,
  className = 'text-[#A86F14]',
}: {
  name: BrandIconName
  size?: number
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: BRAND_ICONS[name] }}
    />
  )
}
