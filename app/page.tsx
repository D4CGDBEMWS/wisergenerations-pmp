import Link from 'next/link'
import { PROGRAMS, STATS } from '@/lib/constants'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Enterprise Academy™ · Wiser Generations™</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Project Manage Your Career.
              <br /><span className="text-gold">Transform Your Future.™</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl">
              PMP® and CAPM® certification training built for career transitioners, corporate teams, and veterans.
              Mentor-led. PMI-aligned. Delivered by Crystal Stewart — The Project Management Evangelist™.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/programs" className="bg-gold text-white font-bold px-8 py-4 rounded-lg hover:bg-amber-600 transition-colors text-lg">Explore Programs</Link>
              <Link href="/enroll" className="border-2 border-gold text-gold font-bold px-8 py-4 rounded-lg hover:bg-light-gold hover:text-navy transition-colors text-lg">Get Started</Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {['PMI-Authorized Education', 'PMP® & CAPM® Prep', 'Veterans Welcome', 'Corporate Packages', 'Virtual + Metro Atlanta'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-light-gold border-y border-gold/20 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-navy">{s.value}</p>
                <p className="text-gray-600 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Programs</p>
            <h2 className="text-3xl md:text-4xl font-bold text-navy">Find Your Pathway</h2>
            <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">Whether you're earning your first PM credential or training your entire team, there's a Wiser Generations program built for your situation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROGRAMS.map(p => (
              <div key={p.id} className={`border-2 ${p.color} rounded-2xl p-8 hover:shadow-lg transition-shadow relative`}>
                {p.badge && <span className="absolute top-4 right-4 bg-navy text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>}
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-bold text-navy mb-1">{p.name}</h3>
                <p className="text-gold text-sm font-medium mb-3">{p.audience}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{p.description}</p>
                <ul className="space-y-1 mb-6">
                  {p.features.slice(0, 4).map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-gold">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between">
                  {p.price > 0 ? (
                    <p className="text-navy font-bold text-2xl">from ${p.price.toLocaleString()}</p>
                  ) : (
                    <p className="text-navy font-bold text-lg">Custom Pricing</p>
                  )}
                  <Link href={`/${p.id}`} className="bg-navy text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-900 transition-colors text-sm">Learn More →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crystal */}
      <section className="py-16 bg-light-navy">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-4">Your Instructor</p>
          <h2 className="text-3xl font-bold text-navy mb-4">Crystal Stewart, PMP®</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
            The Project Management Evangelist™. 20+ years of enterprise transformation. Founder of Enterprise Academy™.
            U.S. Army veteran. Crystal doesn't just teach PM — she's lived it, built with it, and now equips
            the next generation of project managers to do the same.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['PMP® Certified', 'U.S. Army Veteran', 'Enterprise Academy™ Founder', '20+ Years Experience', 'Smyrna, GA'].map(t => (
              <span key={t} className="bg-white border border-navy/20 text-navy text-xs font-medium px-3 py-1.5 rounded-full">{t}</span>
            ))}
          </div>
          <Link href="/about" className="inline-block mt-6 text-gold font-semibold hover:underline">Read Crystal's Story →</Link>
        </div>
      </section>

      {/* Veterans callout */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">🎖️</div>
          <h2 className="text-3xl font-bold mb-4">Built for Veterans</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
            You've managed missions under pressure. You've led teams in high-stakes environments.
            Now translate that experience into a PMP® or CAPM® credential that civilian employers recognize.
            Veteran-discounted tuition. Veteran peer cohort. VA benefit guidance included.
          </p>
          <Link href="/veterans" className="bg-gold text-white font-bold px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors inline-block">Veterans Program →</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-light-gold border-t border-gold/20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">Ready to Manage Your Next Chapter?</h2>
          <p className="text-gray-600 mb-8">Tell us where you are and where you want to go. Crystal's team will match you to the right program.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/enroll" className="bg-gold text-white font-bold px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors">Get Started Today</Link>
            <Link href="/contact" className="border-2 border-navy text-navy font-semibold px-8 py-3 rounded-lg hover:bg-light-navy transition-colors">Talk to Crystal</Link>
          </div>
        </div>
      </section>
    </>
  )
}
