import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog — PM Certification Insights | Wiser Generations Int\'l',
  description: 'Project management certification tips, PMP exam insights, career advice for veterans and career transitioners, and updates on PMI exam changes from Crystal Stewart, PMP.',
}

const posts = [
  {
    slug: 'pmp-exam-changes-july-2026',
    title: 'PMP Exam Changes July 2026: Everything You Need to Know',
    excerpt: 'PMI has confirmed significant changes to the PMP exam effective July 8, 2026. New domain weights, new question types, AI and sustainability content — here is what every aspiring PMP needs to know.',
    category: 'Exam Updates',
    readTime: '8 min read',
    date: 'March 2026',
    featured: true
  },
  {
    slug: 'capm-vs-pmp-which-certification',
    title: 'CAPM vs PMP: Which Certification Is Right for Your Career?',
    excerpt: 'The CAPM and PMP are both PMI certifications — but they serve very different career stages. Here is how to decide which one makes sense for where you are right now.',
    category: 'Career Strategy',
    readTime: '6 min read',
    date: 'February 2026',
    featured: false
  },
  {
    slug: 'veterans-pmp-military-experience',
    title: 'Veterans and the PMP: How Military Experience Maps to Certification',
    excerpt: 'If you have served, you have already been managing projects — you just did not call it that. Here is how to translate your military experience into a PMP application that gets approved.',
    category: 'Veterans',
    readTime: '7 min read',
    date: 'January 2026',
    featured: false
  },
  {
    slug: 'pmp-salary-roi-2026',
    title: 'Is the PMP Worth It in 2026? Salary Data and Career ROI',
    excerpt: 'The PMP is one of the most researched professional certifications in terms of salary impact. Here is what the data actually shows — and who benefits most from earning it.',
    category: 'Career Strategy',
    readTime: '5 min read',
    date: 'December 2025',
    featured: false
  }
]

const categories = ['All', 'Exam Updates', 'Career Strategy', 'Veterans', 'Study Tips']

export default function BlogPage() {
  const featured = posts.find(p => p.featured)
  const rest = posts.filter(p => !p.featured)

  return (
    <main className="bg-white">

      {/* Hero */}
      <section className="bg-navy text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-4">Resources & Insights</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">The PM Certification Blog</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Practical insights on PMP and CAPM certification, career transitions, and project management
            — from Crystal Stewart, PMP and 20+ years of enterprise experience.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="bg-gray-50 py-6 px-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <span key={cat}
                className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-navy font-medium cursor-pointer hover:border-gold hover:text-gold transition-colors">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured post */}
      {featured && (
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">Featured</p>
            <Link href={`/blog/${featured.slug}`}
              className="block bg-navy text-white rounded-2xl p-8 hover:opacity-95 transition-opacity">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-gold text-navy text-xs font-bold px-3 py-1 rounded-full">{featured.category}</span>
                <span className="text-gray-400 text-sm">{featured.date}</span>
                <span className="text-gray-400 text-sm">{featured.readTime}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 hover:text-gold transition-colors">{featured.title}</h2>
              <p className="text-gray-300 leading-relaxed mb-6">{featured.excerpt}</p>
              <span className="text-gold font-semibold">Read Article →</span>
            </Link>
          </div>
        </section>
      )}

      {/* All posts */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}
                className="border border-gray-200 rounded-xl p-6 hover:border-gold transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-gold/20 text-navy text-xs font-bold px-3 py-1 rounded-full">{post.category}</span>
                  <span className="text-gray-400 text-xs">{post.readTime}</span>
                </div>
                <h3 className="text-lg font-bold text-navy mb-2 group-hover:text-gold transition-colors">{post.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">{post.date}</span>
                  <span className="text-gold font-semibold text-sm">Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-navy text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Get PM Insights in Your Inbox</h2>
          <p className="text-gray-300 mb-8">
            Join the Wiser Generations newsletter. Crystal sends practical PMP and CAPM updates,
            exam news, and career advice — no spam, just signal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-guide"
              className="bg-gold text-navy font-bold px-8 py-4 rounded-lg hover:bg-yellow-400 transition-colors">
              Download the Free PMP Guide
            </Link>
            <Link href="/webinars"
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-navy transition-colors">
              Join a Free Webinar
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
