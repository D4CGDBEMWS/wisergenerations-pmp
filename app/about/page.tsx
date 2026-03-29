import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'About Crystal Stewart — Wiser Generations™' }

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">About</p>
      <h1 className="text-4xl font-bold text-navy mb-8">Crystal Stewart, PMP®<br/><span className="text-2xl text-gold font-medium">The Project Management Evangelist™</span></h1>
      <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
        <p className="text-xl text-gray-600 leading-relaxed">Founder & CEO of Enterprise Academy™. U.S. Army veteran. 20+ years of enterprise transformation experience. Crystal Stewart built Wiser Generations™ because she saw the same gap in every organization she served: brilliant people without a professional framework for executing what matters most.</p>
        <h2 className="text-2xl font-bold text-navy mt-10">The Mission</h2>
        <p>Project management is not a corporate luxury. It is the professional discipline that separates people who achieve from people who intend to. Crystal's mission is to put that discipline in the hands of every career transitioner, every veteran, every professional who has been building without a blueprint — and show them what becomes possible when they have one.</p>
        <h2 className="text-2xl font-bold text-navy mt-10">The Ecosystem</h2>
        <p>Wiser Generations™ is one program within a larger ecosystem — Enterprise Academy™ — which sits under the Kingdom Compassion umbrella. The full vision spans seven pillars: education, community trade, financial empowerment, spiritual formation, publishing, sustainability, and philanthropy. Wiser Generations™ is where adult professionals enter that ecosystem through the credential that changes their career.</p>
        <div className="bg-navy rounded-xl p-8 text-white mt-10">
          <p className="text-gold font-bold uppercase text-xs tracking-wider mb-3">Credentials & Background</p>
          <ul className="space-y-2 text-gray-300 text-sm">
            {['PMP® — Project Management Professional (PMI)', 'U.S. Army Veteran', 'Founder & CEO, Enterprise Academy™', 'Creator, The 7 Project Principles™', '20+ years enterprise project management', 'Based in Smyrna, GA (Metro Atlanta)'].map(c => (
              <li key={c} className="flex items-center gap-2"><span className="text-gold">✓</span>{c}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/programs" className="bg-gold text-white font-bold px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors">Explore Programs</Link>
        <Link href="/contact" className="border-2 border-navy text-navy font-semibold px-6 py-3 rounded-lg hover:bg-light-navy transition-colors">Contact Crystal</Link>
        <a href="https://projectmanageanything.com" className="border-2 border-gold text-gold font-semibold px-6 py-3 rounded-lg hover:bg-light-gold transition-colors">The Full Ecosystem →</a>
      </div>
    </div>
  )
}
