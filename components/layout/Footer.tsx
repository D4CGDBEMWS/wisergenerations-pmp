import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <p className="text-gold font-bold text-lg">Wiser Generations™</p>
            <p className="text-gray-300 text-sm mt-1 mb-4">An Enterprise Academy™ Program</p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">PMP® and CAPM® certification training for career transitioners, corporate teams, and veterans. PMI-aligned. Mentor-led. Results-driven.</p>
            <p className="text-gold text-sm mt-4 font-medium">Smyrna, GA (Metro Atlanta) · Virtual Nationwide</p>
          </div>
          <div>
            <p className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-3">Programs</p>
            <div className="flex flex-col gap-2">
              {[['PMP® Prep', '/pmp'], ['CAPM® Career Launcher', '/capm'], ['Corporate Training', '/corporate'], ['Veterans Pathway', '/veterans']].map(([l, h]) => (
                <Link key={h} href={h} className="text-sm text-gray-400 hover:text-gold transition-colors">{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-3">Company</p>
            <div className="flex flex-col gap-2">
              {[['About Crystal', '/about'], ['Contact', '/contact'], ['Enterprise Academy™', 'https://enterpriseacademy.us'], ['ProjectManageAnything', 'https://projectmanageanything.com']].map(([l, h]) => (
                <a key={h} href={h} className="text-sm text-gray-400 hover:text-gold transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">© {new Date().getFullYear()} Enterprise Academy™. All rights reserved.</p>
          <p className="text-gray-500 text-xs">PMP® and CAPM® are registered marks of the Project Management Institute, Inc.</p>
        </div>
      </div>
    </footer>
  )
}
