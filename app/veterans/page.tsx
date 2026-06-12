import type { Metadata } from 'next'
import Link from 'next/link'
import TrustSignals from '@/components/marketing/TrustSignals'
import Faq from '@/components/marketing/Faq'

export const metadata: Metadata = {
    title: 'Veterans PM Pathway — PMP® & CAPM® for Military Veterans',
    description: 'Translate your military leadership into a PMP® or CAPM® credential. Veteran-discounted tuition and a veteran peer cohort. Enterprise Academy.',
    openGraph: { images: ['/og-image.png'] },
}

const CALENDLY = 'https://calendly.com/space4grace/30min-pod'

const VETERANS_FAQ = [
  {
        q: 'Should I pursue PMP® or CAPM® first as a transitioning veteran?',
        a: 'It depends on your service experience. If you led teams, ran missions, or managed operations for 36+ months as an E-5 or above (or as an officer), your experience usually qualifies you directly for PMP®. If you\u2019re newer to leadership or don\u2019t yet have documented \u201cproject leadership\u201d hours, CAPM® is the faster on-ramp and PMP® comes next. Book a free strategy call and Crystal and team will help you decide.',
  },
  {
        q: 'How does my MOS / rate / AFSC translate to project management?',
        a: 'Almost every military role maps to PM competencies. Logistics, signal, ops, engineering, aviation maintenance, supply, intel \u2014 all involve scope, schedule, cost, risk, communications, and stakeholder management. Our Military-to-PM Skills Translation Guide maps your specific experience into PMI\u00ae language so you can use it on your application and resume.',
  },
  {
        q: 'I\u2019m still on active duty / in the Reserves. Can I still enroll?',
        a: 'Yes. Many of our veteran students are still in uniform \u2014 active, Guard, or Reserve \u2014 and use the program to prep for their next chapter. Sessions are virtual and recorded so you can keep up around training, drill weekends, and deployments.',
  },
  {
        q: 'Do you have a veteran-only cohort or do I study with civilians?',
        a: 'Both. We run a veteran peer cohort each quarter where you\u2019ll study alongside other transitioning service members who understand your background and communication style. You can also join our standard mentor-led cohort if the timing works better \u2014 many veterans choose this for the broader networking.',
  },
  {
        q: 'How long until I\u2019m exam-ready and certified?',
        a: 'Most veterans go from enrollment to exam-ready in 10\u201314 weeks. Your military experience usually accelerates the People and Process domains. We schedule weekly check-ins so you stay on track even when life \u2014 or duty \u2014 gets in the way.',
  },
  ] as const

export default function VeteransPage() {
    return (
          <div>
            {/* Hero with background image */}
                <section className="relative bg-navy text-white py-24">
                        <div className="absolute inset-0 overflow-hidden">
                                  <img
                                                src="/veterans-mentor.jpg"
                                                alt="Mentor working one-on-one with a student"
                                                className="w-full h-full object-cover opacity-10"
                                              />
                        </div>div>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
                        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                                  <div className="text-4xl mb-6">\uD83C\uDF96\uFE0F</div>div>
                                  <p className="text-gold text-sm font-bold uppercase tracking-widest mb-3">Veterans PM Pathway</p>p>
                                  <h1 className="text-4xl md:text-5xl font-bold mb-6">You Already Lead Projects.<br/>Now Get the Credential.</h1>h1>
                                  <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mb-8">
                                              Every mission you led was a project. Every team you commanded was a stakeholder group.
                                              Every operation you executed had a critical path. Now translate that into the PMP® or CAPM®
                                              certification that civilian employers recognize \u2014 and respect.
                                  </p>p>
                                  <div className="flex flex-wrap gap-4">
                                              <Link href="/checkout" className="bg-gold text-white font-bold px-8 py-4 rounded-lg hover:bg-amber-600 transition-colors text-lg">Start Your Pathway</Link>Link>
                                              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg">Talk to Crystal and Team</a>a>
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* Trust signals strip \u2014 veteran-focused headline */}
                <TrustSignals headline="Veteran-built. Mission-tested. Trusted nationwide." />
          
            {/* Translation */}
                <section className="py-16 bg-light-navy">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                                  <h2 className="text-2xl font-bold text-navy mb-8 text-center">Your Military Experience Already Speaks PM</h2>h2>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                          ['Mission Planning', 'Project Charter & Scope Management'],
                          ['Operations Order', 'Work Breakdown Structure (WBS)'],
                          ['Battle Rhythm', 'Sprint Planning & Critical Path'],
                          ['Chain of Command', 'Stakeholder Management & RACI'],
                          ['AAR (After Action Review)', 'Project Retrospective & Lessons Learned'],
                          ['Intel & Comms', 'Requirements Gathering & Communications'],
                          ['Unit Readiness', 'Resource & Risk Management'],
                          ['Mission Debrief', 'Project Close & Documentation'],
                        ].map(([mil, pm]) => (
                                        <div key={mil} className="bg-white rounded-lg p-4 flex items-center gap-4 border border-gray-100">
                                                        <div className="text-center min-w-[120px]">
                                                                          <p className="text-xs font-bold text-gold uppercase tracking-wider mb-1">Military</p>p>
                                                                          <p className="text-navy font-semibold text-sm">{mil}</p>p>
                                                        </div>div>
                                                        <div className="text-2xl text-gray-400">\u2192</div>div>
                                                        <div>
                                                                          <p className="text-xs font-bold text-navy uppercase tracking-wider mb-1">PM Equivalent</p>p>
                                                                          <p className="text-gray-700 text-sm">{pm}</p>p>
                                                        </div>div>
                                        </div>div>
                                      ))}
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* What's included */}
                <section className="py-16 bg-white">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                              <div>
                                                            <h2 className="text-2xl font-bold text-navy mb-2">Veterans PM Pathway \u2014 What&apos;s Included</h2>h2>
                                                            <p className="text-gold font-medium mb-8">From $799 (Professional tier with veteran discount) \u00b7 Veteran discount applied at enrollment</p>p>
                                                            <div className="space-y-5">
                                                              {[
            { icon: '\uD83D\uDCCB', title: 'Military-to-PM Skills Translation Guide', body: 'A personalized document mapping your MOS/rate and service experience to PMI competency areas. Use this in interviews and on your resume.' },
            { icon: '\uD83D\uDCDA', title: 'PMP® or CAPM® Prep (Your Choice)', body: 'Full certification prep course with live study sessions, practice exams, and Crystal and team as your mentors. You choose the credential that fits your timeline.' },
            { icon: '\uD83D\uDC65', title: 'Veteran Peer Cohort', body: 'Study and grow alongside other veterans who understand your background, your communication style, and your mission-first mindset.' },
            { icon: '\uD83D\uDCBC', title: 'Employer Introduction Program', body: "Access to Enterprise Academy\u2019s network of PM-hiring employers who actively seek veteran talent. Resume review and interview prep included." },
            { icon: '\uD83C\uDF96\uFE0F', title: 'Veteran-Discounted Tuition', body: 'Discounted rate for all honorably discharged veterans. Bring your DD-214 verification at enrollment.' },
                            ].map(item => (
                                                <div key={item.title} className="flex gap-4">
                                                                    <span className="text-2xl flex-shrink-0">{item.icon}</span>span>
                                                                    <div>
                                                                                          <h3 className="font-bold text-navy mb-1">{item.title}</h3>h3>
                                                                                          <p className="text-gray-600 text-sm leading-relaxed">{item.body}</p>p>
                                                                    </div>div>
                                                </div>div>
                                              ))}
                                                            </div>div>
                                              </div>div>
                                              <div className="sticky top-24">
                                                            <img
                                                                              src="/veterans-classroom-2.jpg"
                                                                              alt="Instructor engaging with students in a classroom setting"
                                                                              className="w-full rounded-xl object-cover mb-6"
                                                                              style={{ maxHeight: '280px' }}
                                                                            />
                                                            <div className="mt-4 bg-navy rounded-xl p-5 text-white text-center">
                                                                            <p className="font-bold text-gold mb-1">Ready to start?</p>p>
                                                                            <p className="text-sm text-gray-300 mb-3">Book a free strategy call with Crystal and team</p>p>
                                                                            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="block bg-gold text-navy font-bold py-2 rounded-lg hover:bg-amber-400 transition-colors">Book Your Call \u2192</a>a>
                                                            </div>div>
                                              </div>div>
                                  </div>div>
                        </div>div>
                </section>section>
          
            {/* Crystal veteran note */}
                <section className="py-16 bg-navy text-white">
                        <div className="max-w-3xl mx-auto px-4 text-center">
                                  <p className="text-gold font-bold uppercase text-sm tracking-wider mb-4">From Crystal</p>p>
                                  <blockquote className="text-xl italic text-gray-200 leading-relaxed mb-4">
                                              \u201cI served. I know what it means to transition \u2014 to walk out of a world where your competence is
                                              unquestioned into a civilian environment where no one speaks your language yet. This program
                                              is the bridge I wish I\u2019d had.\u201d
                                  </blockquote>blockquote>
                                  <p className="text-gold font-bold">\u2014 Crystal Stewart, PMP\u00ae \u00b7 U.S. Army Veteran</p>p>
                        </div>div>
                </section>section>
          
            {/* FAQ \u2014 emits FAQPage JSON-LD for Google rich snippets */}
                <Faq items={VETERANS_FAQ} heading="Veterans Pathway FAQ" />
          
                <section className="py-12 bg-light-gold">
                        <div className="max-w-xl mx-auto px-4 text-center">
                                  <h2 className="text-2xl font-bold text-navy mb-4">Start Your Veterans Pathway</h2>h2>
                                  <p className="text-gray-600 mb-6">Tell us your branch, your timeline, and your goal. We\u2019ll take it from there.</p>p>
                                  <Link href="/checkout" className="bg-gold text-white font-bold px-8 py-3 rounded-lg hover:bg-amber-600 transition-colors inline-block">Apply Now \u2192</Link>Link>
                        </div>div>
                </section>section>
          </div>div>
        )
}</div>
