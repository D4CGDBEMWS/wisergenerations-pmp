import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Get Started — Wiser Generations™' }

export default function EnrollPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Get Started</p>
        <h1 className="text-4xl font-bold text-navy mb-4">Choose Your Program</h1>
        <p className="text-gray-600 text-lg">Select the pathway that fits your situation. Crystal's team will follow up within 48 hours.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {[
          { icon: '🏆', name: 'PMP® Certification Prep', price: 'from $1,497', href: '/pmp', desc: 'For working professionals ready to earn the gold standard' },
          { icon: '🚀', name: 'CAPM® Career Launcher', price: 'from $997', href: '/capm', desc: 'For career transitioners entering project management' },
          { icon: '🎖️', name: 'Veterans PM Pathway', price: 'from $797', href: '/veterans', desc: 'Veteran-discounted, military-to-PM translation included' },
          { icon: '🏢', name: 'Corporate Training', price: 'Custom pricing', href: '/corporate', desc: 'For teams of 5+ employees, on-site or virtual' },
        ].map(p => (
          <Link key={p.name} href={p.href} className="border-2 border-gray-200 hover:border-gold rounded-xl p-6 transition-all hover:shadow-md group">
            <div className="text-3xl mb-3">{p.icon}</div>
            <h3 className="font-bold text-navy text-lg group-hover:text-gold transition-colors">{p.name}</h3>
            <p className="text-gold font-medium text-sm my-1">{p.price}</p>
            <p className="text-gray-600 text-sm">{p.desc}</p>
            <p className="text-gold text-sm font-semibold mt-3">Learn more →</p>
          </Link>
        ))}
      </div>
      <div className="bg-navy rounded-2xl p-8 text-white text-center">
        <p className="font-bold text-xl mb-2">Not sure where to start?</p>
        <p className="text-gray-300 mb-4">Email Crystal directly and she'll point you to the right program.</p>
        <a href="mailto:crystal@wisergenerations.com" className="bg-gold text-white font-bold px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors inline-block">crystal@wisergenerations.com</a>
      </div>
    </div>
  )
}
