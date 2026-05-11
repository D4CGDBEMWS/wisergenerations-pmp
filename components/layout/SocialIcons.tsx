import type { SVGProps } from 'react'

// ---------------------------------------------------------------------------
// SocialIcons — shared component used by both Navbar and Footer.
//
//   <SocialIcons variant="white" />  → used in the navy navbar
//   <SocialIcons variant="gold" />   → used in the navy footer
// ---------------------------------------------------------------------------

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/wisergenerations',
    Icon: FacebookIcon,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/wisergenerations',
    Icon: InstagramIcon,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/wiser-generations',
    Icon: LinkedInIcon,
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@wisergenerations',
    Icon: YouTubeIcon,
  },
] as const

type Variant = 'gold' | 'white'

export default function SocialIcons({
  variant = 'gold',
  className = '',
}: {
  variant?: Variant
  className?: string
}) {
  const colorClass =
    variant === 'gold'
      ? 'text-gold hover:text-amber-300'
      : 'text-white hover:text-gold'

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {SOCIAL_LINKS.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          className={`transition-colors ${colorClass}`}
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline SVG icons (no extra dependency)
// ---------------------------------------------------------------------------

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
    </svg>
  )
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.55 3.5 12 3.5 12 3.5s-7.55 0-9.4.58A3 3 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3 3 0 0 0 2.1 2.12c1.85.58 9.4.58 9.4.58s7.55 0 9.4-.58a3 3 0 0 0 2.1-2.12c.5-1.87.5-5.8.5-5.8s0-3.93-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
    </svg>
  )
}
