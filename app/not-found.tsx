import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">404 Error</p>
        <h1 className="text-6xl font-bold text-navy mb-4">404</h1>
        <p className="text-2xl font-semibold text-navy mb-4">Page Not Found</p>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Sorry, we could not find what you were looking for. The page may have moved or never existed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy/90"
          >
            Back to Home
          </Link>
          <Link
            href="/programs"
            className="rounded-xl border border-navy px-6 py-3 text-sm font-bold text-navy transition hover:bg-navy hover:text-white"
          >
            View Programs
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-600 transition hover:border-navy hover:text-navy"
          >
            Contact Us
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-400">
          Looking for something specific?{' '}
          <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">
            Email us
          </a>
          .
        </p>
      </div>
    </div>
  )
}
