'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Question {
  id: number
  domain: string
  difficulty: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

const questions: Question[] = [
  { id:1, domain:'People', difficulty:'Medium', question:'A project manager discovers two team members have a personal conflict affecting collaboration. What is the BEST first step?', options:['Escalate to the project sponsor immediately','Meet with each team member privately to understand their perspective','Remove one of the team members from the project','Send an email asking both to resolve it themselves'], correct:1, explanation:'Best practice for conflict resolution is to first understand each perspective through private conversations. Escalation or removal should be last resorts.' },
  { id:2, domain:'People', difficulty:'Easy', question:'Which leadership style is MOST appropriate for a highly experienced and motivated team?', options:['Autocratic','Delegating','Coaching','Directing'], correct:1, explanation:'Delegating is most appropriate for high-competence, high-motivation team members. The PM assigns work and lets the team operate independently.' },
  { id:3, domain:'People', difficulty:'Hard', question:'A virtual team across four continents reports feeling isolated. Which action BEST addresses this?', options:['Increase status report frequency','Establish regular virtual team-building and informal communication channels','Require all members to work the same hours','Assign a local manager to each region'], correct:1, explanation:'Virtual teams need structured opportunities for informal connection. Regular virtual social events and informal channels build cohesion across distance.' },
  { id:4, domain:'People', difficulty:'Medium', question:'A new team member from another country consistently misses deadlines. What should the project manager investigate FIRST?', options:['Whether the team member needs to be replaced','Cultural communication differences that may be causing misunderstandings','Whether the manager should be notified','Whether the team member was correctly screened'], correct:1, explanation:'Cultural differences in communication style often explain apparent disengagement. Investigate this first before assuming performance issues.' },
  { id:5, domain:'People', difficulty:'Medium', question:'According to Tuckman model, what stage comes AFTER Storming?', options:['Forming','Performing','Norming','Adjourning'], correct:2, explanation:'Tuckman stages: Forming, Storming, Norming, Performing, Adjourning. After Storming, teams move to Norming where they establish working norms.' },
  { id:6, domain:'People', difficulty:'Easy', question:'Which conflict resolution technique results in a win-win outcome?', options:['Smoothing','Forcing','Compromising','Collaborating'], correct:3, explanation:'Collaborating (Problem Solving) is the only technique that seeks a win-win by addressing root causes and finding a solution satisfying both parties.' },
  { id:7, domain:'People', difficulty:'Medium', question:'A project manager wants to reward exceptional work but there is no formal recognition program. What is the BEST action?', options:['Wait until a formal program is established','Provide informal recognition such as public praise and a personal thank-you','Offer additional time off without authorization','Recommend a salary increase to HR'], correct:1, explanation:'Project managers have many informal motivational tools available. Public recognition and personal appreciation are highly effective and immediately available.' },
  { id:8, domain:'People', difficulty:'Hard', question:'A team member says their supervisor is pressuring them to share confidential project information. What should the PM do FIRST?', options:['Tell the team member to comply','Immediately report the supervisor to HR','Consult with the project sponsor and legal counsel','Ignore it since it is a direct reporting matter'], correct:2, explanation:'Sharing confidential information without authorization is an ethical and legal matter. Consult the sponsor and legal counsel to determine the appropriate response.' },
  { id:9, domain:'People', difficulty:'Medium', question:'During a retrospective, the team agrees standups are ineffective. What is the BEST next step?', options:['Eliminate standups immediately','Experiment with a modified standup format and evaluate after two sprints','Escalate the decision to the sponsor','Continue standups unchanged'], correct:1, explanation:'Agile retrospectives lead to experiments and continuous improvement. Try a modified approach, inspect, and adapt based on results.' },
  { id:10, domain:'People', difficulty:'Hard', question:'A project sponsor is putting pressure on the PM to approve a change that violates organizational policy. What should the PM do?', options:['Approve the change to keep the sponsor happy','Decline the change and document the refusal with reasons','Submit the change through the formal change control process','Escalate to the PMO immediately without notifying the sponsor'], correct:1, explanation:'A PM must maintain integrity and follow organizational policies. The change should be declined with documented reasons, even when sponsor pressure exists.' },
  { id:11, domain:'Process', difficulty:'Easy', question:'Which document formally authorizes a project to begin?', options:['Project Management Plan','Scope Statement','Project Charter','Business Case'], correct:2, explanation:'The Project Charter formally authorizes the project, names the PM, and grants authority to apply resources. Created in the Initiating Process Group.' },
  { id:12, domain:'Process', difficulty:'Medium', question:'A project has CPI of 0.85 and SPI of 0.90. What does this mean?', options:['Gets $0.85 of value per dollar spent; progressing at 90% of planned rate','15% over budget and 10% ahead of schedule','Will finish 15% early but over budget','Spent 85% of budget and completed 90% of work'], correct:0, explanation:'CPI = EV/AC. CPI 0.85 means 15% over budget. SPI = EV/PV. SPI 0.90 means 10% behind schedule.' },
  { id:13, domain:'Process', difficulty:'Hard', question:'An approved change adds significant scope. What must be updated FIRST?', options:['Only the project schedule','The project management plan and all affected subsidiary plans including baselines','Only the WBS','Only the stakeholder register'], correct:1, explanation:'Approved changes require updates to the PM plan and all affected subsidiary plans. Baselines must be formally updated through Integrated Change Control.' },
  { id:14, domain:'Process', difficulty:'Medium', question:'What is the primary purpose of a Work Breakdown Structure (WBS)?', options:['Define the sequence of activities','Decompose total scope into manageable deliverables','Assign resources to tasks','Estimate project duration'], correct:1, explanation:'The WBS decomposes total project scope into smaller components. It defines WHAT needs to be delivered, not when or by whom.' },
  { id:15, domain:'Process', difficulty:'Easy', question:'PERT uses which type of estimate to calculate expected activity duration?', options:['Single-point estimate','Three-point estimate','Analogous estimate','Parametric estimate'], correct:1, explanation:'PERT uses three-point estimates: (Optimistic + 4 x Most Likely + Pessimistic) / 6. Accounts for uncertainty in duration estimates.' },
  { id:16, domain:'Process', difficulty:'Hard', question:'Project has: PV=$500K, EV=$450K, AC=$480K. What is EAC assuming future work at budgeted rate?', options:['$553,333','$530,000','$526,667','$480,000'], correct:1, explanation:'EAC = AC + (BAC - EV) = 480,000 + (500,000 - 450,000) = $530,000. Assumes remaining work at original budget rate.' },
  { id:17, domain:'Process', difficulty:'Medium', question:'Which schedule compression technique involves doing activities in parallel that were planned sequentially?', options:['Crashing','Fast tracking','Resource leveling','Schedule baseline update'], correct:1, explanation:'Fast tracking overlaps activities planned in sequence. Increases risk but no added cost like crashing. Only works when activities can logically be done in parallel.' },
  { id:18, domain:'Process', difficulty:'Hard', question:'A risk has probability 0.30 and impact $80,000. What is the Expected Monetary Value (EMV)?', options:['$26,667','$80,000','$24,000','$110,000'], correct:2, explanation:'EMV = Probability x Impact = 0.30 x $80,000 = $24,000. Used in quantitative risk analysis and decision tree analysis.' },
  { id:19, domain:'Process', difficulty:'Medium', question:'What is the MAIN purpose of a project kickoff meeting?', options:['To create the project charter','To formally begin execution and align team on objectives, roles, and processes','To complete the risk register','To obtain sign-off on the PM plan'], correct:1, explanation:'The kickoff meeting marks transition from planning to execution. Formally launches the project and aligns stakeholders on objectives, roles, and ways of working.' },
  { id:20, domain:'Process', difficulty:'Easy', question:'In Kanban, work items started but not completed are called:', options:['Backlog items','Work in Progress (WIP)','Done items','Sprint items'], correct:1, explanation:'In Kanban, Work in Progress (WIP) refers to items started but not yet completed. Kanban systems often limit WIP to improve flow.' },
  { id:21, domain:'Process', difficulty:'Medium', question:'A quality audit found a process consistently producing defects. What is the BEST next step?', options:['Accept defects and deliver as-is','Perform root cause analysis to identify and eliminate the source of defects','Increase end-of-process inspections','Reassign the responsible team member'], correct:1, explanation:'Quality management focuses on preventing defects by improving processes. Root cause analysis identifies the underlying cause so it can be eliminated.' },
  { id:22, domain:'Process', difficulty:'Hard', question:'Which dependency type describes: Activity B cannot start until 5 days after Activity A starts?', options:['Finish-to-Start with lag','Start-to-Start with lag','Finish-to-Finish with lead','Start-to-Finish'], correct:1, explanation:'Start-to-Start (SS) with lag: successor cannot start until specified time after predecessor starts. B cannot start until 5 days after A starts = SS+5 days.' },
  { id:23, domain:'Process', difficulty:'Medium', question:'In Agile, what is the purpose of a Definition of Done (DoD)?', options:['Define when the project is closed','Establish criteria that must be met before a story or sprint is considered complete','Define the minimum viable product','Outline acceptance criteria for the entire release'], correct:1, explanation:'The DoD is a shared agreement about quality standards and completion criteria. Ensures consistent quality and prevents ambiguity about what finished means.' },
  { id:24, domain:'Process', difficulty:'Easy', question:'Which risk response strategy transfers the negative impact of a risk to a third party?', options:['Avoid','Mitigate','Transfer','Accept'], correct:2, explanation:'Transfer shifts financial impact of a risk to a third party through insurance, warranties, or contracts. Does not eliminate the risk but moves responsibility for managing it.' },
  { id:25, domain:'Process', difficulty:'Hard', question:'A critical path activity will be 3 weeks late. Crashing costs $15K/week. Fast tracking has 40% probability of $30K rework. Which is most cost-effective?', options:['Crash for 3 weeks ($45,000)','Fast track with EMV of $12,000','Accept the delay','Fast track - lower expected cost'], correct:3, explanation:'Fast tracking EMV = 0.40 x $30,000 = $12,000. Crashing = $45,000. Fast tracking has lower expected cost ($12K < $45K), making it more cost-effective.' },
  { id:26, domain:'Process', difficulty:'Medium', question:'What does a velocity of 40 story points per sprint indicate?', options:['Team will complete 40 sprints','Team completed 40 story points of work in the sprint','Project has 40 stories remaining','Each story point equals 40 hours'], correct:1, explanation:'Velocity measures how much work a team completes per sprint. Velocity of 40 means 40 story points delivered per sprint, used to forecast future delivery.' },
  { id:27, domain:'Process', difficulty:'Medium', question:'Which tool BEST helps prioritize stakeholder engagement on a large project?', options:['Communications management plan','Power/Interest grid','Risk register','WBS'], correct:1, explanation:'The Power/Interest grid categorizes stakeholders by authority and interest, helping prioritize engagement strategies for different stakeholder groups.' },
  { id:28, domain:'Process', difficulty:'Easy', question:'What is a sprint in Scrum?', options:['A status review meeting','A time-boxed iteration delivering a potentially shippable product increment','A backlog refinement session','The final project phase'], correct:1, explanation:'A sprint is a fixed-length iteration (typically 1-4 weeks) in Scrum. The team completes backlog items and delivers a potentially shippable product increment.' },
  { id:29, domain:'Process', difficulty:'Hard', question:'A project is terminated early. What is the MOST important action?', options:['Archive documents and celebrate the team','Release team resources immediately','Document lessons learned, capture termination decision, and close out contracts','Transfer to operations without documentation'], correct:2, explanation:'Even when terminated early, proper closure is essential: document lessons learned, obtain formal sign-off, close all contracts, and archive records.' },
  { id:30, domain:'Process', difficulty:'Medium', question:'A control chart shows 7 consecutive data points on one side of the mean. This is called:', options:['Standard deviation','Rule of Seven (special cause variation)','Normal variation','Regression to the mean'], correct:1, explanation:'The Rule of Seven: seven consecutive data points on same side of mean indicates non-random pattern (special cause variation), even within control limits.' },
  { id:31, domain:'Business Environment', difficulty:'Medium', question:'A project is aligned with a strategic objective, but the objective has changed. What should the PM do FIRST?', options:['Continue as planned since already approved','Assess the impact and escalate to the sponsor','Immediately close the project','Conduct a team meeting to decide whether to continue'], correct:1, explanation:'Projects exist to deliver business value. When strategic objectives change, assess whether the project still delivers value and escalate to the sponsor.' },
  { id:32, domain:'Business Environment', difficulty:'Easy', question:'Which document describes how a project benefits will be measured and realized after the project closes?', options:['Project Charter','Business Case','Benefits Realization Plan','Stakeholder Register'], correct:2, explanation:'The Benefits Realization Plan documents how and when benefits will be realized, who measures them, and what metrics will be used. Extends beyond project closure.' },
  { id:33, domain:'Business Environment', difficulty:'Hard', question:'An organization is restructuring during project execution and key stakeholders have changed. What is the BEST action?', options:['Continue as planned','Update stakeholder register, re-engage new stakeholders, and assess strategic alignment impact','Pause project until restructuring is complete','Request the sponsor freeze all organizational changes'], correct:1, explanation:'Stakeholder changes require re-identifying stakeholders, updating the stakeholder register and engagement plan, and reassessing strategic alignment.' },
  { id:34, domain:'Business Environment', difficulty:'Medium', question:'What is the primary purpose of a governance framework in project management?', options:['Define the project schedule','Establish decision-making authority, accountability, and oversight structures','Manage team conflicts','Track project costs'], correct:1, explanation:'Governance frameworks define who has authority to make decisions, how decisions are escalated, what oversight exists, and how accountability is established.' },
  { id:35, domain:'Business Environment', difficulty:'Medium', question:'Which action BEST demonstrates compliance management in a complex regulatory environment?', options:['Ignore regulations conflicting with schedule','Identify applicable regulations during planning and incorporate compliance into the PM plan','Delegate all compliance to legal department','Address regulatory requirements only when audited'], correct:1, explanation:'Proactive compliance management requires identifying applicable laws during planning and building compliance activities into the project plan.' },
  { id:36, domain:'Business Environment', difficulty:'Hard', question:'An approved change will shorten the project but harm the local community. What should the PM do?', options:['Implement immediately since the sponsor approved it','Raise ethical and social impact concerns formally and escalate through appropriate channels','Implement the change and document personal objections privately','Resign from the project'], correct:1, explanation:'PMI Code of Ethics requires PMs to consider community impacts and act with integrity. Formally raise ethical concerns even when sponsors have approved the change.' },
  { id:37, domain:'Business Environment', difficulty:'Easy', question:'What does OPA stand for in project management?', options:['Organizational Project Authority','Operational Process Assessment','Organizational Process Assets','Outstanding Project Approvals'], correct:2, explanation:'Organizational Process Assets (OPAs) include any artifact, practice, or knowledge from any organization that can be used to perform or govern the project.' },
  { id:38, domain:'Business Environment', difficulty:'Medium', question:'A project is delivering value incrementally to stakeholders. Which lifecycle approach does this describe?', options:['Predictive (Waterfall)','Sequential','Iterative/Incremental (Agile or Hybrid)','Linear'], correct:2, explanation:'Iterative and incremental approaches deliver value in successive portions. Agile and hybrid approaches deliver usable increments early and often.' },
  { id:39, domain:'Business Environment', difficulty:'Hard', question:'An organization uses portfolio management. Which BEST describes how a project fits into this structure?', options:['Managed independently of business strategy','A component of a program or portfolio aligned to strategic objectives, competing for resources based on relative value','Only related to other projects when sharing team members','A portfolio contains only programs, not individual projects'], correct:1, explanation:'In portfolio management, projects are grouped and prioritized based on strategic alignment and value. Resources are allocated to maximize organizational value.' },
  { id:40, domain:'Business Environment', difficulty:'Medium', question:'Which factor is MOST likely to impact a global project with teams in multiple countries?', options:['Project charter content','WBS structure','Cultural norms and time zones','Meeting frequency'], correct:2, explanation:'Cultural norms and time zones are Enterprise Environmental Factors (EEFs) significantly impacting global projects, affecting communication, decision-making, and team cohesion.' },
]

function shuffle(arr: Question[]): Question[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp
  }
  return a
}

export default function ExamSimulator() {
  const [mode, setMode] = useState<'home'|'exam'|'results'>('home')
  const [quizSize, setQuizSize] = useState(20)
  const [timed, setTimed] = useState(true)
  const [practiceMode, setPracticeMode] = useState(true)
  const [domainFilter, setDomainFilter] = useState('All')
  const [deck, setDeck] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState(-1)
  const [showExpl, setShowExpl] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const domains = ['All', 'People', 'Process', 'Business Environment']

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

  const startExam = () => {
    const pool = domainFilter === 'All' ? questions : questions.filter(q => q.domain === domainFilter)
    const d = shuffle(pool).slice(0, Math.min(quizSize, pool.length))
    setDeck(d)
    setAnswers(new Array(d.length).fill(-1))
    setCurrent(0)
    setSelected(-1)
    setShowExpl(false)
    const mins = quizSize === 10 ? 15 : quizSize === 20 ? 30 : 60
    setTimeLeft(mins * 60)
    setMode('exam')
  }

  const handleAnswer = (i: number) => {
    if (!practiceMode && answers[current] !== -1) return
    setSelected(i)
    const a = [...answers]; a[current] = i; setAnswers(a)
    if (practiceMode) setShowExpl(true)
  }

  const next = () => {
    if (current < deck.length - 1) {
      setCurrent(current + 1)
      setSelected(answers[current + 1])
      setShowExpl(practiceMode && answers[current + 1] !== -1)
    } else {
      setMode('results')
    }
  }

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1)
      setSelected(answers[current - 1])
      setShowExpl(practiceMode && answers[current - 1] !== -1)
    }
  }

  const score = deck.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
  const pct = deck.length > 0 ? Math.round((score / deck.length) * 100) : 0
  const passed = pct >= 61
  const q = deck[current]

  const fmt = (s: number) => Math.floor(s/60) + ':' + String(s%60).padStart(2,'0')

  if (mode === 'home') return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-navy text-white py-12 px-4 text-center">
        <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Free Study Tool</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">PMP Exam Simulator</h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">Timed practice exams modeled after the real PMP. Get instant explanations, domain scoring, and performance analytics.</p>
      </div>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-navy mb-3">Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {[{k:true,l:'Practice Mode',d:'See explanations after each answer'},{k:false,l:'Exam Mode',d:'Review all answers at the end'}].map(m => (
                <button key={String(m.k)} onClick={() => setPracticeMode(m.k)}
                  className={'p-4 rounded-xl border-2 text-left ' + (practiceMode === m.k ? 'border-gold bg-gold/10' : 'border-gray-200')}>
                  <div className="font-bold text-navy text-sm">{m.l}</div>
                  <div className="text-gray-500 text-xs mt-1">{m.d}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-3">Domain</label>
            <div className="flex flex-wrap gap-2">
              {domains.map(d => (
                <button key={d} onClick={() => setDomainFilter(d)}
                  className={'px-4 py-2 rounded-full border text-sm font-medium ' + (domainFilter === d ? 'bg-navy text-white border-navy' : 'border-gray-300 text-gray-600')}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-3">Questions</label>
            <div className="flex gap-3">
              {[10,20,40].map(s => (
                <button key={s} onClick={() => setQuizSize(s)}
                  className={'flex-1 py-3 rounded-xl border-2 text-center font-bold ' + (quizSize === s ? 'border-gold bg-gold/10 text-navy' : 'border-gray-200 text-gray-600')}>
                  {s}
                  <div className="text-xs font-normal text-gray-400">{s===10?'15':s===20?'30':'60'} min</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <div className="font-semibold text-navy text-sm">Enable Timer</div>
              <div className="text-gray-500 text-xs">{quizSize===10?'15':quizSize===20?'30':'60'} minutes</div>
            </div>
            <button onClick={() => setTimed(!timed)}
              className={'w-12 h-6 rounded-full relative transition-colors ' + (timed ? 'bg-gold' : 'bg-gray-300')}>
              <div className={'w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ' + (timed ? 'left-6' : 'left-0.5')} />
            </button>
          </div>
          <button onClick={startExam} className="w-full bg-gold text-navy font-bold py-4 rounded-xl text-lg hover:bg-yellow-400 transition-colors">
            Start Practice Exam
          </button>
        </div>
        <div className="mt-4 text-center">
          <Link href="/flashcards" className="text-navy underline text-sm hover:text-gold">Study Flashcards instead</Link>
        </div>
      </div>
    </main>
  )

  if (mode === 'exam' && q) {
    const prog = ((current + 1) / deck.length) * 100
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="bg-navy text-white px-4 py-3 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <span className="text-sm"><span className="text-gold font-bold">{current+1}</span><span className="text-gray-400">/{deck.length}</span></span>
            {timed && <span className={'font-mono font-bold text-lg ' + (timeLeft < 300 ? 'text-red-400' : 'text-gold')}>{fmt(timeLeft)}</span>}
            <button onClick={() => setMode('results')} className="text-xs px-3 py-1 border border-gray-500 text-gray-300 rounded-full">End</button>
          </div>
          <div className="max-w-3xl mx-auto mt-2 h-1 bg-white/20 rounded-full">
            <div className="h-1 bg-gold rounded-full" style={{width: prog + '%'}} />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-4">
            <div className="flex gap-2 mb-4">
              <span className={'text-xs font-bold px-3 py-1 rounded-full ' + (q.domain==='People'?'bg-blue-100 text-blue-800':q.domain==='Process'?'bg-green-100 text-green-800':'bg-purple-100 text-purple-800')}>{q.domain}</span>
              <span className={'text-xs px-2 py-1 rounded-full ' + (q.difficulty==='Easy'?'bg-green-50 text-green-600':q.difficulty==='Medium'?'bg-yellow-50 text-yellow-600':'bg-red-50 text-red-600')}>{q.difficulty}</span>
            </div>
            <p className="text-navy text-lg font-medium leading-relaxed mb-6">{q.question}</p>
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isSelected = selected === i
                const isCorrect = i === q.correct
                const showResult = showExpl && practiceMode
                let cls = 'border-2 border-gray-200 text-gray-700 hover:border-navy hover:bg-gray-50'
                if (showResult) {
                  if (isCorrect) cls = 'border-2 border-green-500 bg-green-50 text-green-800'
                  else if (isSelected) cls = 'border-2 border-red-400 bg-red-50 text-red-800'
                } else if (isSelected) {
                  cls = 'border-2 border-gold bg-gold/10 text-navy'
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)}
                    className={'w-full text-left p-4 rounded-xl flex items-start gap-3 transition-all ' + cls}>
                    <span className="font-bold flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">{String.fromCharCode(65+i)}</span>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
            {showExpl && practiceMode && (
              <div className="mt-6 p-4 bg-navy/5 border border-navy/20 rounded-xl">
                <p className="font-semibold text-navy text-sm mb-1">Explanation</p>
                <p className="text-gray-700 text-sm leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button onClick={prev} disabled={current===0} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-semibold text-navy disabled:opacity-40">Back</button>
            {current === deck.length-1
              ? <button onClick={() => setMode('results')} className="px-6 py-3 bg-gold text-navy font-bold rounded-xl hover:bg-yellow-400">Finish</button>
              : <button onClick={next} className="px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/80">Next</button>
            }
          </div>
        </div>
      </main>
    )
  }

  if (mode === 'results') {
    const byDomain: Record<string, {correct:number; total:number}> = {}
    deck.forEach((ques, i) => {
      if (!byDomain[ques.domain]) byDomain[ques.domain] = {correct:0, total:0}
      byDomain[ques.domain].total++
      if (answers[i] === ques.correct) byDomain[ques.domain].correct++
    })
    return (
      <main className="min-h-screen bg-gray-50">
        <div className={'py-12 px-4 text-white text-center ' + (passed ? 'bg-green-700' : 'bg-red-700')}>
          <div className="text-5xl mb-3">{passed ? 'Great Work!' : 'Keep Studying'}</div>
          <div className="text-7xl font-bold my-4">{pct}%</div>
          <p className="text-white/80">{score} of {deck.length} correct | Passing: 61%</p>
        </div>
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-navy text-lg mb-5">Performance by Domain</h2>
            {Object.entries(byDomain).map(([dom, data]) => {
              const p = Math.round((data.correct/data.total)*100)
              return (
                <div key={dom} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">{dom}</span>
                    <span className="text-gray-500">{data.correct}/{data.total} ({p}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={'h-3 rounded-full ' + (p>=61?'bg-green-500':'bg-red-400')} style={{width:p+'%'}} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4">
            <button onClick={() => setMode('home')} className="flex-1 bg-navy text-white font-bold py-4 rounded-xl hover:bg-navy/80">New Exam</button>
            <Link href="/flashcards" className="flex-1 bg-gold text-navy font-bold py-4 rounded-xl hover:bg-yellow-400 text-center">Flashcards</Link>
          </div>
          {!passed && (
            <div className="bg-navy text-white rounded-2xl p-6 text-center">
              <p className="text-lg font-bold mb-2">Want more support?</p>
              <p className="text-gray-300 text-sm mb-4">Book a free strategy call with Crystal to discuss your path to certification.</p>
              <a href="https://calendly.com/space4grace/15min" target="_blank" rel="noopener noreferrer"
                className="bg-gold text-navy font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 inline-block">
                Book a Free Call
              </a>
            </div>
          )}
        </div>
      </main>
    )
  }

  return null
}
