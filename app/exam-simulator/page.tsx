'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Question, Domain } from '@/lib/exam-questions'
import { examQuestions } from '@/lib/exam-questions'

type Mode = 'home' | 'exam' | 'review' | 'results'

const QUIZ_SIZES = [10, 20, 40]
const DOMAIN_OPTIONS: (Domain | 'All')[] = ['All', 'People', 'Process', 'Business Environment']
const TIME_LIMITS: Record<number, number> = { 10: 15, 20: 30, 40: 60 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ExamSimulator() {
  const [mode, setMode] = useState<Mode>('home')
  const [domain, setDomain] = useState<Domain | 'All'>('All')
  const [quizSize, setQuizSize] = useState(20)
  const [timed, setTimed] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [flagged, setFlagged] = useState<boolean[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [examMode, setExamMode] = useState<'practice' | 'exam'>('practice')

  const startExam = () => {
    const pool = domain === 'All' ? examQuestions : examQuestions.filter(q => q.domain === domain)
    const selected = shuffle(pool).slice(0, Math.min(quizSize, pool.length))
    setQuestions(selected)
    setAnswers(new Array(selected.length).fill(null))
    setFlagged(new Array(selected.length).fill(false))
    setCurrent(0)
    setSelected(null)
    setShowExplanation(false)
    setTimeLeft(TIME_LIMITS[quizSize] * 60)
    setMode('exam')
  }

  useEffect(() => {
    if (mode !== 'exam' || !timed) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setMode('results'); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [mode, timed])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleAnswer = (idx: number) => {
    if (examMode === 'exam' && answers[current] !== null) return
    setSelected(idx)
    const newAnswers = [...answers]
    newAnswers[current] = idx
    setAnswers(newAnswers)
    if (examMode === 'practice') setShowExplanation(true)
  }

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setSelected(answers[current + 1])
      setShowExplanation(examMode === 'practice' && answers[current + 1] !== null)
    } else {
      setMode('results')
    }
  }

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1)
      setSelected(answers[current - 1])
      setShowExplanation(examMode === 'practice' && answers[current - 1] !== null)
    }
  }

  const toggleFlag = () => {
    const f = [...flagged]; f[current] = !f[current]; setFlagged(f)
  }

  const getScore = () => {
    let correct = 0
    questions.forEach((q, i) => { if (answers[i] === q.correct) correct++ })
    return correct
  }

  const getByDomain = () => {
    const domains: Record<string, { correct: number; total: number }> = {}
    questions.forEach((q, i) => {
      if (!domains[q.domain]) domains[q.domain] = { correct: 0, total: 0 }
      domains[q.domain].total++
      if (answers[i] === q.correct) domains[q.domain].correct++
    })
    return domains
  }

  const q = questions[current]
  const score = mode === 'results' ? getScore() : 0
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const passed = pct >= 61

  // ─── HOME SCREEN ────────────────────────────────────────────────────────
  if (mode === 'home') return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Free PMP Practice Tool</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">PMP Exam Simulator</h1>
          <p className="text-gray-300 text-lg">Timed practice exams with explanations, domain scoring, and question flagging — modeled after the real PMP exam experience.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-navy mb-6">Configure Your Practice Session</h2>

          {/* Mode */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-navy mb-3">Session Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {(['practice', 'exam'] as const).map(m => (
                <button key={m} onClick={() => setExamMode(m)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${examMode === m ? 'border-gold bg-gold/10' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="font-bold text-navy capitalize">{m === 'practice' ? 'Practice Mode' : 'Exam Mode'}</div>
                  <div className="text-gray-500 text-xs mt-1">{m === 'practice' ? 'See explanations after each answer' : 'Review all answers at the end'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Domain */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-navy mb-3">Domain Filter</label>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map(d => (
                <button key={d} onClick={() => setDomain(d)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${domain === d ? 'bg-navy text-white border-navy' : 'border-gray-300 text-gray-600 hover:border-navy'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-navy mb-3">Number of Questions</label>
            <div className="flex gap-3">
              {QUIZ_SIZES.map(s => (
                <button key={s} onClick={() => setQuizSize(s)}
                  className={`flex-1 py-3 rounded-xl border-2 text-center font-bold transition-all ${quizSize === s ? 'border-gold bg-gold/10 text-navy' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {s}
                  <div className="text-xs font-normal text-gray-400">{TIME_LIMITS[s]} min</div>
                </button>
              ))}
            </div>
          </div>

          {/* Timer toggle */}
          <div className="mb-8 flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-semibold text-navy text-sm">Enable Timer</div>
              <div className="text-gray-500 text-xs">{quizSize} questions = {TIME_LIMITS[quizSize]} minutes</div>
            </div>
            <button onClick={() => setTimed(!timed)}
              className={`w-12 h-6 rounded-full transition-colors relative ${timed ? 'bg-gold' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${timed ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <button onClick={startExam}
            className="w-full bg-gold text-navy font-bold py-4 rounded-xl text-lg hover:bg-yellow-400 transition-colors">
            Start Practice Exam
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          {[{ n: '40', l: 'Total Questions' }, { n: '3', l: 'Domains' }, { n: '61%', l: 'Passing Score' }].map(s => (
            <div key={s.l} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-2xl font-bold text-gold">{s.n}</div>
              <div className="text-gray-500 text-xs mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link href="/flashcards" className="text-navy underline text-sm hover:text-gold">
            Study with PMBOK Flashcards instead →
          </Link>
        </div>
      </div>
    </main>
  )

  // ─── EXAM SCREEN ────────────────────────────────────────────────────────
  if (mode === 'exam' && q) {
    const answered = answers.filter(a => a !== null).length
    const progress = ((current + 1) / questions.length) * 100

    return (
      <main className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-navy text-white px-4 py-3 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gold font-bold">{current + 1}</span>
              <span className="text-gray-400"> / {questions.length}</span>
              <span className="text-gray-400 ml-3">{answered} answered</span>
            </div>
            {timed && (
              <div className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-400' : 'text-gold'}`}>
                {formatTime(timeLeft)}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={toggleFlag}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${flagged[current] ? 'bg-yellow-400 text-navy border-yellow-400' : 'border-gray-500 text-gray-300 hover:border-white'}`}>
                {flagged[current] ? '🚩 Flagged' : '⚑ Flag'}
              </button>
              <button onClick={() => { if (confirm('End exam and see results?')) setMode('results') }}
                className="text-xs px-3 py-1 rounded-full border border-gray-500 text-gray-300 hover:border-white">
                End Exam
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="max-w-4xl mx-auto mt-2">
            <div className="h-1 bg-white/20 rounded-full">
              <div className="h-1 bg-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-4">
            {/* Domain badge */}
            <div className="flex items-center gap-3 mb-5">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                q.domain === 'People' ? 'bg-blue-100 text-blue-800' :
                q.domain === 'Process' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'}`}>
                {q.domain}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' :
                q.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                'bg-red-50 text-red-600'}`}>
                {q.difficulty}
              </span>
            </div>

            {/* Question */}
            <p className="text-navy text-lg font-medium leading-relaxed mb-6">{q.question}</p>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isSelected = selected === i
                const isCorrect = i === q.correct
                const showResult = showExplanation && examMode === 'practice'
                let cls = 'border-2 border-gray-200 text-gray-700 hover:border-navy hover:bg-gray-50'
                if (showResult) {
                  if (isCorrect) cls = 'border-2 border-green-500 bg-green-50 text-green-800'
                  else if (isSelected && !isCorrect) cls = 'border-2 border-red-400 bg-red-50 text-red-800'
                } else if (isSelected) {
                  cls = 'border-2 border-gold bg-gold/10 text-navy'
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-3 ${cls}`}>
                    <span className="font-bold flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                    {showResult && isCorrect && <span className="ml-auto text-green-600">✓</span>}
                    {showResult && isSelected && !isCorrect && <span className="ml-auto text-red-500">✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showExplanation && examMode === 'practice' && (
              <div className="mt-6 p-4 bg-navy/5 border border-navy/20 rounded-xl">
                <p className="font-semibold text-navy text-sm mb-1">Explanation</p>
                <p className="text-gray-700 text-sm leading-relaxed">{q.explanation}</p>
                {q.reference && <p className="text-gold text-xs mt-2 font-medium">{q.reference}</p>}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prev} disabled={current === 0}
              className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-semibold text-navy disabled:opacity-40 hover:border-navy transition-colors">
              ← Previous
            </button>
            <div className="text-gray-400 text-sm">{flagged.filter(Boolean).length} flagged</div>
            {current === questions.length - 1 ? (
              <button onClick={() => setMode('results')}
                className="px-6 py-3 bg-gold text-navy font-bold rounded-xl hover:bg-yellow-400 transition-colors">
                Finish Exam
              </button>
            ) : (
              <button onClick={next} disabled={examMode === 'exam' && selected === null}
                className="px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/80 transition-colors disabled:opacity-40">
                Next →
              </button>
            )}
          </div>
        </div>
      </main>
    )
  }

  // ─── RESULTS SCREEN ─────────────────────────────────────────────────────
  if (mode === 'results') {
    const domainBreakdown = getByDomain()
    return (
      <main className="min-h-screen bg-gray-50">
        <div className={`py-12 px-4 text-white ${passed ? 'bg-green-700' : 'bg-red-700'}`}>
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-5xl mb-3">{passed ? '🏆' : '📚'}</div>
            <h1 className="text-3xl font-bold mb-2">{passed ? 'Well Done!' : 'Keep Studying'}</h1>
            <div className="text-7xl font-bold my-4">{pct}%</div>
            <p className="text-white/80">{score} of {questions.length} correct &nbsp;|&nbsp; Passing score: 61%</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Domain breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-navy text-lg mb-5">Performance by Domain</h2>
            {Object.entries(domainBreakdown).map(([dom, data]) => {
              const p = Math.round((data.correct / data.total) * 100)
              return (
                <div key={dom} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">{dom}</span>
                    <span className="text-gray-500">{data.correct}/{data.total} &nbsp; {p}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-3 rounded-full transition-all ${p >= 61 ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Question review */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-navy text-lg mb-4">Question Review</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questions.map((q, i) => {
                const isCorrect = answers[i] === q.correct
                return (
                  <div key={q.id} className={`p-3 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-start gap-2">
                      <span className={`font-bold text-sm flex-shrink-0 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>{isCorrect ? '✓' : '✗'}</span>
                      <div className="flex-1">
                        <p className="text-sm text-navy font-medium">{i + 1}. {q.question.substring(0, 80)}...</p>
                        {!isCorrect && (
                          <p className="text-xs text-gray-500 mt-1">
                            Your answer: {answers[i] !== null ? q.options[answers[i]!] : 'Not answered'}<br/>
                            Correct: {q.options[q.correct]}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 italic">{q.explanation.substring(0, 100)}...</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button onClick={() => setMode('home')}
              className="flex-1 bg-navy text-white font-bold py-4 rounded-xl hover:bg-navy/80 transition-colors">
              New Exam
            </button>
            <Link href="/flashcards"
              className="flex-1 bg-gold text-navy font-bold py-4 rounded-xl hover:bg-yellow-400 transition-colors text-center">
              Study Flashcards
            </Link>
          </div>

          {!passed && (
            <div className="bg-navy text-white rounded-2xl p-6 text-center">
              <p className="text-lg font-bold mb-2">Ready for more support?</p>
              <p className="text-gray-300 text-sm mb-4">Crystal&apos;s cohort program covers every domain with mentor-led instruction, not just practice tests.</p>
              <a href="https://calendly.com/space4grace/15min" target="_blank" rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors inline-block">
                Book a Free Strategy Call
              </a>
            </div>
          )}
        </div>
      </main>
    )
  }

  return null
}
