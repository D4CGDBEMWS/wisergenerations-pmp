import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Contact — Wiser Generations™' }
export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Contact</p>
          <h1 className="text-3xl font-bold text-navy mb-4">Talk to Crystal</h1>
          <p className="text-gray-600 leading-relaxed mb-8">Questions about certification pathways, corporate packages, veteran benefits, or scheduling — Crystal or a team member responds within 2 business days.</p>
          <div className="space-y-4">
            {[['Email', 'info@wisergenerations.com'], ['Location', 'Smyrna, GA (Metro Atlanta)'], ['Virtual', 'Nationwide via Zoom']].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gold font-bold uppercase tracking-wider">{label}</p>
                <p className="text-navy font-medium text-sm mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-light-navy rounded-2xl p-8">
          <p className="font-bold text-navy mb-6">Send a Message</p>
          <p className="text-gray-500 text-sm">Contact form coming soon. Email us directly at <a href="mailto:info@wisergenerations.com" className="text-gold hover:underline">info@wisergenerations.com</a> or visit <a href="/enroll" className="text-gold hover:underline">the enrollment page</a> to get started.</p>
        </div>
      </div>
    </div>
  )
}
