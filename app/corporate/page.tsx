import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Corporate PM Training | Wiser Generations Int\'l',
  description: 'Custom PMP and CAPM training for corporate teams. PMI-aligned curriculum tailored to your industry, delivered virtually or on-site in Metro Atlanta. Volume pricing for 5+ employees.',
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

const benefits = [
  {
    icon: '🎯',
    title: 'Tailored to Your Industry',
    body: 'Generic PM training rarely sticks. Crystal customizes examples, case studies, and terminology to match your team\'s actual work — so the training is immediately relevant and applicable.'
  },
  {
    icon: '🏛️',
    title: 'PMI-Aligned & Certifiable',
    body: 'All corporate training is built on PMI standards. Employees earn documented PMI contact hours and are positioned to pursue PMP or CAPM certification as a next step.'
  },
  {
    icon: '🌐',
    title: 'Virtual or On-Site in Metro Atlanta',
    body: 'Deliver training your way. Virtual sessions work for distributed teams. On-site delivery is available for Metro Atlanta organizations that want an immersive, in-person experience.'
  },
  {
    icon: '👥',
    title: 'Team Cohort Format',
    body: 'Your team trains together — building shared language, shared methodology, and shared accountability. The cohort format creates alignment that individual self-paced training never achieves.'
  },
  {
    icon: '📊',
    title: 'Executive Briefings Available',
    body: 'Crystal offers executive-level briefings for leadership teams who want to understand PMI methodology, project governance, and how PM certification drives ROI — without sitting through the full curriculum.'
  },
  {
    icon: '💲',
    title: 'Volume Pricing for 5+ Employees',
    body: 'Organizations training five or more employees receive volume pricing. The more your team grows together, the more cost-effective the investment becomes.'
  }
]

const outcomes = [
  'PMP and CAPM certified project managers across your team',
  'Shared PM methodology and consistent project language',
  'Documented PMI contact hours for every participant',
  'Reduced project failure rates through structured PM practices',
  'Higher employee retention and career satisfaction',
  'A credentialed talent pipeline ready for larger responsibilities'
]

const industries = [
  { name: 'Government & Defense', icon: '🏛️' },
  { name: 'Healthcare & Life Sciences', icon: '🏥' },
  { name: 'Financial Services', icon: '💼' },
  { name: 'Technology & IT', icon: '💻' },
  { name: 'Construction & Engineering', icon: '🏗️' },
  { name: 'Nonprofit & Education', icon: '📚' },
]

const process = [
  {
    step: '1',
    title: 'Discovery Call',
    body: 'We start with a conversation about your team, your goals, your industry, and your timeline. No obligation — just an honest discussion about whether we are the right fit.'
  },
  {
    step: '2',
    title: 'Custom Proposal',
    body: 'Crystal puts together a tailored training proposal with recommended curriculum, delivery format, schedule, and pricing for your team size.'
  },
  {
    step: '3',
    title: 'Curriculum Alignment',
    body: 'Before training begins, Crystal aligns the content with your industry context, your current PM maturity level, and your certification goals.'
  },
  {
    step: '4',
    title: 'Cohort Delivery',
    body: 'Your team trains together in live sessions — virtual or on-site. Sessions are scheduled around your team\'s availability and workload.'
  },
  {
    step: '5',
    title: 'Certification Support',
    body: 'After training, Crystal supports employees through the PMI application process and exam preparation — so the investment results in actual credentials.'
  },
  {
    step: '6',
    title: 'Ongoing Partnership',
    body: 'Organizations become long-term partners. As your team grows and new employees join, Crystal is there for follow-on cohorts and individual certification support.'
  }
]

export default function CorporatePage() {
  return (
    <main className="bg-white">
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-4">Corporate PM Training</p>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Train Your Team to PMP Standard</h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Custom PM training and certification prep for corporate teams. PMI-aligned, industry-tailored,
                and delivered by a practitioner with 20+ years of enterprise experience. Virtual or on-site in Metro Atlanta.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
                  className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors text-center">
                  Schedule a Discovery Call
                </a>
                <Link href="/contact"
                  className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-navy transition-colors text-center">
                  Send an Inquiry
                </Link>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <h3 className="text-xl font-bold text-gold mb-6">What Organizations Get</h3>
              <ul className="space-y-3">
                {['Customized PMI-aligned curriculum','Live cohort sessions for your full team','Virtual or on-site delivery','PMI contact hours documentation','PMP and CAPM certification support','Executive briefings available','Volume pricing for 5+ employees','Ongoing partnership & follow-on cohorts'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-200">
                    <span className="text-gold">✓</span><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gold py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-navy text-center text-sm font-semibold mb-4">Industries We Serve</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {industries.map((ind) => (
              <div key={ind.name} className="text-center">
                <div className="text-2xl mb-1">{ind.icon}</div>
                <p className="text-navy font-medium text-xs">{ind.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Why Organizations Choose Us</p>
            <h2 className="text-3xl font-bold text-navy">What Makes Corporate Training With Crystal Different</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <div key={b.title} className="border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="text-lg font-bold text-navy mb-2">{b.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-3xl font-bold text-navy">From First Call to Certified Team</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {process.map((p) => (
              <div key={p.step} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold text-navy font-bold flex items-center justify-center flex-shrink-0 text-sm">{p.step}</div>
                  <div>
                    <h3 className="font-bold text-navy mb-2">{p.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{p.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Outcomes</p>
              <h2 className="text-3xl font-bold text-navy mb-6">What a Certified Team Delivers</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Organizations that invest in PM certification see measurable improvements in project delivery, team confidence, and organizational capability.
              </p>
            </div>
            <div className="bg-navy rounded-2xl p-8">
              <ul className="space-y-4">
                {outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-gray-200">
                    <span className="text-gold mt-0.5 flex-shrink-0">✓</span><span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-2xl text-navy italic mb-6 leading-relaxed">
            &ldquo;Knowledgeable with a sincere concern for each of her pupils, she has a unique way of conveying the concepts regardless of their learning method. I highly recommend Crystal&apos;s services to any organization that desires to improve their PMO.&rdquo;
          </p>
          <p className="font-bold text-gold">Lynn Fleming MBA, PMP, PMI-ACP, PMI-SP</p>
          <p className="text-gray-600 text-sm">Principal Strategic Program Manager</p>
        </div>
      </section>

      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Team?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Schedule a discovery call with Crystal. She will learn about your team, your goals, and your timeline — and put together a custom proposal at no obligation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer"
              className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors">
              Schedule a Discovery Call
            </a>
            <Link href="/contact"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-navy transition-colors">
              Send an Inquiry
            </Link>
          </div>
          <p className="text-gray-400 text-sm mt-6">
            Prefer email?{' '}
            <a href="mailto:info@wisergenerations.com" className="text-gold underline">info@wisergenerations.com</a>
          </p>
        </div>
      </section>
    </main>
  )
}
