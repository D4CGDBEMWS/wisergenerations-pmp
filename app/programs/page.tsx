import type { Metadata } from 'next'
import Link from 'next/link'
import { PROGRAMS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Programs — PMP®, CAPM®, Corporate & Veterans',
  description: 'PMP® prep, CAPM® career launcher, corporate team training, and veterans PM pathway. Find your certification program at Wiser Generations™.',
}

export default function ProgramsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">All Programs</p>
        <h1 className="text-4xl font-bold text-navy mb-4">Find Your Pathway</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">Every program is built on PMI standards, delivered by Crystal Stewart, and designed for the specific challenges of your situation.</p>
      </div>
      <div className="space-y-8">
        {PROGRAMS.map((p, i) => (
          <div key={p.id} className={`border-2 ${p.color} rounded-2xl p-8 md:p-10`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{p.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-navy">{p.name}</h2>
                    <p className="text-gold text-sm font-medium">{p.audience}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">{p.description}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-gold flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-between">
                <div className="bg-light-navy rounded-xl p-6 text-center mb-4">
                  {p.badge && <p className="text-xs font-bold text-gold uppercase tracking-wider mb-2">{p.badge}</p>}
                  {p.price > 0 ? (
                    <>
                      <p className="text-3xl font-bold text-navy">${p.price.toLocaleString()}</p>
                      <p className="text-gray-500 text-sm">starting price</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-navy">Custom Pricing</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Link href={`/${p.id === 'capm-adult' ? 'capm' : p.id}`} className="block w-full bg-navy text-white font-bold py-3 rounded-xl text-center hover:bg-blue-900 transition-colors">Learn More</Link>
                  <Link href="/enroll" className="block w-full border-2 border-gold text-gold font-bold py-3 rounded-xl text-center hover:bg-light-gold transition-colors">Get Started</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-16 bg-navy rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Not sure which program is right for you?</h2>
        <p className="text-gray-300 mb-6">Tell Crystal where you are and she'll point you to the right path.</p>
        <Link href="/contact" className="bg-gold text-white font-bold px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors inline-block">Talk to Crystal →</Link>
      </div>
    </div>
  )
}
