'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { GlossaryCategory } from '@/lib/glossary'
import { glossaryTerms } from '@/lib/glossary'

const CATEGORIES: (GlossaryCategory | 'All')[] = [
  'All', 'Core Concepts', 'Scheduling', 'Cost & Value', 'Risk', 'Quality', 'Agile', 'Stakeholder & Communication', 'Procurement', 'Integration'
]

const CATEGORY_COLORS: Record<string, string> = {
  'Core Concepts': 'bg-blue-100 text-blue-800 border-blue-200',
  'Scheduling': 'bg-green-100 text-green-800 border-green-200',
  'Cost & Value': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Risk': 'bg-red-100 text-red-800 border-red-200',
  'Quality': 'bg-purple-100 text-purple-800 border-purple-200',
  'Agile': 'bg-teal-100 text-teal-800 border-teal-200',
  'Stakeholder & Communication': 'bg-orange-100 text-orange-800 border-orange-200',
  'Procurement': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Integration': 'bg-pink-100 text-pink-800 border-pink-200',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type StudyMode = 'browse' | 'study'

export default function FlashcardsPage() {
  const [mode, setMode] = useState<StudyMode>('browse')
  const [category, setCategory] = useState<GlossaryCategory | 'All'>('All')
  const [search, setSearch] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [current, setCurrent] = useState(0)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [unknown, setUnknown] = useState<Set<number>>(new Set())
  const [studyDeck, setStudyDeck] = useState(glossaryTerms)
  const [shuffled, setShuffled] = useState(false)

  const filtered = glossaryTerms.filter(t => {
    const matchesCat = category === 'All' || t.category === category
    const matchesSearch = search === '' || t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const startStudy = () => {
    const deck = category === 'All' ? [...glossaryTerms] : glossaryTerms.filter(t => t.category === category)
    setStudyDeck(shuffled ? shuffle(deck) : deck)
    setCurrent(0)
    setFlipped(false)
    setKnown(new Set())
    setUnknown(new Set())
    setMode('study')
  }

  const handleKnown = () => {
    setKnown(prev => new Set([...prev, current]))
    advance()
  }

  const handleUnknown = () => {
    setUnknown(prev => new Set([...prev, current]))
    advance()
  }

  const advance = () => {
    if (current < studyDeck.length - 1) {
      setCurrent(current + 1)
      setFlipped(false)
    } else {
      setMode('browse')
    }
  }

  const card = studyDeck[current]
  const progress = studyDeck.length > 0 ? ((current + 1) / studyDeck.length) * 100 : 0
  const masteryPct = studyDeck.length > 0 ? Math.round((known.size / studyDeck.length) * 100) : 0

  // ─── STUDY MODE ─────────────────────────────────────────────────────────
  if (mode === 'study' && card) {
    return (
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-navy text-white px-4 py-3 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={() => setMode('browse')} className="text-gray-300 hover:text-white text-sm">← Exit</button>
            <div className="text-center">
              <div className="text-gold font-bold">{current + 1} / {studyDeck.length}</div>
              <div className="text-gray-400 text-xs">{known.size} known · {unknown.size} review</div>
            </div>
            <div className="text-gold text-sm font-bold">{masteryPct}%</div>
          </div>
          <div className="max-w-2xl mx-auto mt-2">
            <div className="h-1.5 bg-white/20 rounded-full">
              <div className="h-1.5 bg-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10">
          {/* Category badge */}
          <div className="flex justify-center mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${CATEGORY_COLORS[card.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              {card.category}
            </span>
          </div>

          {/* Flashcard */}
          <div
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer select-none"
            style={{ perspective: '1000px' }}
          >
            <div style={{
              position: 'relative', height: '280px', transformStyle: 'preserve-3d',
              transition: 'transform 0.5s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}>
              {/* Front */}
              <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-md flex flex-col items-center justify-center p-8">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Term</p>
                <h2 className="text-3xl font-bold text-navy text-center">{card.term}</h2>
                {card.acronym && (
                  <span className="mt-3 bg-gold text-navy text-sm font-bold px-3 py-1 rounded-full">{card.acronym}</span>
                )}
                <p className="text-gray-400 text-xs mt-6">Tap to reveal definition</p>
              </div>
              {/* Back */}
              <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                className="bg-navy rounded-2xl border-2 border-navy shadow-md flex flex-col items-center justify-center p-8">
                <p className="text-gold text-xs uppercase tracking-widest mb-4">Definition</p>
                <p className="text-white text-center leading-relaxed text-base">{card.definition}</p>
              </div>
            </div>
          </div>

          {/* Rating buttons */}
          <div className="mt-6 flex gap-4">
            <button onClick={handleUnknown}
              className="flex-1 py-4 bg-red-100 text-red-700 font-bold rounded-xl border-2 border-red-200 hover:bg-red-200 transition-colors">
              Still Learning
            </button>
            <button onClick={() => setFlipped(!flipped)}
              className="px-6 py-4 bg-gray-100 text-gray-600 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-200 transition-colors">
              Flip
            </button>
            <button onClick={handleKnown}
              className="flex-1 py-4 bg-green-100 text-green-700 font-bold rounded-xl border-2 border-green-200 hover:bg-green-200 transition-colors">
              Got It!
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-gray-400 text-xs mt-4">Click card to flip · Rate to advance</p>
        </div>
      </main>
    )
  }

  // ─── BROWSE MODE ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">PMBOK Glossary</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">PMP Flashcards</h1>
          <p className="text-gray-300 text-lg">{glossaryTerms.length} terms from the PMBOK Guide — flip cards, track mastery, filter by category.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search terms or definitions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
            />
            {/* Study button */}
            <button onClick={startStudy}
              className="bg-gold text-navy font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors whitespace-nowrap">
              Study {category === 'All' ? 'All' : category} Cards
            </button>
          </div>

          {/* Shuffle toggle */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setShuffled(!shuffled)}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${shuffled ? 'bg-gold' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${shuffled ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-gray-600">Shuffle cards when studying</span>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  category === cat ? 'bg-navy text-white border-navy' : 'border-gray-300 text-gray-600 hover:border-navy'
                }`}>
                {cat} {cat !== 'All' && `(${glossaryTerms.filter(t => t.category === cat).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { n: filtered.length.toString(), l: 'Terms shown' },
            { n: glossaryTerms.length.toString(), l: 'Total terms' },
            { n: CATEGORIES.length - 1 + '', l: 'Categories' }
          ].map(s => (
            <div key={s.l} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-gold">{s.n}</div>
              <div className="text-gray-500 text-xs mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Glossary list */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((term) => (
            <div key={term.term} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gold transition-colors shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold text-navy text-base">{term.term}</h3>
                  {term.acronym && (
                    <span className="text-xs bg-gold/20 text-navy font-bold px-2 py-0.5 rounded mt-1 inline-block">{term.acronym}</span>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border flex-shrink-0 ${CATEGORY_COLORS[term.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                  {term.category.split(' ')[0]}
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{term.definition}</p>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">No terms found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/exam-simulator"
            className="flex-1 bg-navy text-white font-bold py-4 rounded-xl text-center hover:bg-navy/80 transition-colors">
            Practice Exam Simulator →
          </Link>
          <a href="https://calendly.com/space4grace/15min" target="_blank" rel="noopener noreferrer"
            className="flex-1 bg-gold text-navy font-bold py-4 rounded-xl text-center hover:bg-yellow-400 transition-colors">
            Book a Free Strategy Call
          </a>
        </div>
      </div>
    </main>
  )
}
