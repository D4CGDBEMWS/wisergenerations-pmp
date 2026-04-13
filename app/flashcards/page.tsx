'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Card {
  term: string
  definition: string
  category: string
  acronym?: string
}

const cards: Card[] = [
  { term:'Project', category:'Core Concepts', definition:'A temporary endeavor undertaken to create a unique product, service, or result. Projects have a defined beginning and end, and differ from ongoing operations.' },
  { term:'Project Management', category:'Core Concepts', definition:'The application of knowledge, skills, tools, and techniques to project activities to meet project requirements. Accomplished through initiating, planning, executing, monitoring and controlling, and closing.' },
  { term:'Program', category:'Core Concepts', definition:'A group of related projects, subsidiary programs, and program activities managed in a coordinated manner to obtain benefits not available from managing them individually.' },
  { term:'Portfolio', category:'Core Concepts', definition:'Projects, programs, subsidiary portfolios, and operations managed as a group to achieve strategic objectives. Portfolio components are not necessarily interdependent or directly related.' },
  { term:'Project Charter', category:'Core Concepts', acronym:'PC', definition:'A document issued by the project initiator or sponsor that formally authorizes the existence of a project and provides the project manager with the authority to apply organizational resources.' },
  { term:'Project Management Plan', category:'Core Concepts', acronym:'PMP', definition:'The document that describes how the project will be executed, monitored, controlled, and closed. Integrates all subsidiary plans and baselines.' },
  { term:'Work Breakdown Structure', category:'Core Concepts', acronym:'WBS', definition:'A hierarchical decomposition of the total scope of work to be carried out by the project team. The lowest level of the WBS is the work package.' },
  { term:'Deliverable', category:'Core Concepts', definition:'Any unique and verifiable product, result, or capability to perform a service that is required to be produced to complete a process, phase, or project.' },
  { term:'Milestone', category:'Core Concepts', definition:'A significant point or event in a project. Milestones have zero duration and represent completion of a major deliverable or phase. Used to track project progress.' },
  { term:'Scope Creep', category:'Core Concepts', definition:'The uncontrolled expansion of product or project scope without adjustments to time, cost, and resources. Occurs when changes are made without formal change control.' },
  { term:'Triple Constraint', category:'Core Concepts', definition:'The framework for evaluating competing project demands: scope, time (schedule), and cost. Changes to one constraint typically affect the others.' },
  { term:'Organizational Process Assets', category:'Core Concepts', acronym:'OPAs', definition:'Plans, processes, policies, procedures, and knowledge bases specific to and used by the performing organization. Include lessons learned, historical data, and templates.' },
  { term:'Enterprise Environmental Factors', category:'Core Concepts', acronym:'EEFs', definition:'Conditions not under the immediate control of the team that influence, constrain, or direct the project. Include organizational culture, government regulations, and market conditions.' },
  { term:'Lessons Learned', category:'Core Concepts', definition:'Knowledge gained during a project about what worked well, what did not, and what should be done differently. Captured throughout and stored in a repository for future reference.' },
  { term:'Stakeholder', category:'Stakeholder', definition:'An individual, group, or organization that may affect, be affected by, or perceive itself to be affected by a decision, activity, or outcome of a project.' },
  { term:'Critical Path', category:'Scheduling', definition:'The sequence of activities representing the longest path through a project, determining the shortest possible duration. Activities on the critical path have zero float.' },
  { term:'Critical Path Method', category:'Scheduling', acronym:'CPM', definition:'A schedule network analysis technique used to determine the amount of scheduling flexibility (float) on various paths and determine the minimum total project duration.' },
  { term:'Float', category:'Scheduling', definition:'Also called slack. The amount of time an activity can be delayed without delaying a subsequent activity (free float) or the project end date (total float). Critical path activities have zero total float.' },
  { term:'Fast Tracking', category:'Scheduling', definition:'A schedule compression technique in which activities normally done in sequence are performed in parallel. Increases risk of rework.' },
  { term:'Crashing', category:'Scheduling', definition:'A schedule compression technique in which additional resources are added to shorten the schedule for the least incremental cost. Increases project cost.' },
  { term:'Lag', category:'Scheduling', definition:'The amount of time a successor activity is delayed with respect to a predecessor. Example: concrete must cure 3 days before painting (Finish-to-Start + 3 days lag).' },
  { term:'Lead', category:'Scheduling', definition:'The amount of time a successor activity can be advanced with respect to a predecessor. A negative lag. Example: start user docs 2 weeks before development finishes.' },
  { term:'PERT', category:'Scheduling', acronym:'PERT', definition:'Program Evaluation and Review Technique. Expected duration = (Optimistic + 4 x Most Likely + Pessimistic) / 6. Used to estimate schedule uncertainty.' },
  { term:'Gantt Chart', category:'Scheduling', definition:'A bar chart showing the project schedule. Activities listed on vertical axis, time on horizontal axis. Bars show start and end dates. Dependencies shown with arrows.' },
  { term:'Resource Leveling', category:'Scheduling', definition:'A technique in which start and finish dates are adjusted based on resource constraints to balance demand with supply. Often results in a longer project duration.' },
  { term:'Monte Carlo Simulation', category:'Scheduling', definition:'A technique that iterates the project cost or schedule many times using random input values to simulate the range of possible outcomes and their probabilities.' },
  { term:'Earned Value', category:'Cost and Value', acronym:'EV', definition:'The measure of work performed expressed in terms of the budget authorized for that work. EV = % Complete x BAC. Represents the budgeted cost of work completed.' },
  { term:'Planned Value', category:'Cost and Value', acronym:'PV', definition:'The authorized budget assigned to scheduled work. The planned amount of budget that should have been spent by a given point in time.' },
  { term:'Actual Cost', category:'Cost and Value', acronym:'AC', definition:'The realized cost incurred for the work performed on an activity during a specific time period. What was actually spent.' },
  { term:'Budget at Completion', category:'Cost and Value', acronym:'BAC', definition:'The sum of all budgets established for the work to be performed. The total planned budget for the project.' },
  { term:'Cost Performance Index', category:'Cost and Value', acronym:'CPI', definition:'Measure of cost efficiency. CPI = EV / AC. CPI greater than 1.0 is favorable (under budget); CPI less than 1.0 is unfavorable (over budget).' },
  { term:'Schedule Performance Index', category:'Cost and Value', acronym:'SPI', definition:'Measure of schedule efficiency. SPI = EV / PV. SPI greater than 1.0 means ahead of schedule; SPI less than 1.0 means behind schedule.' },
  { term:'Cost Variance', category:'Cost and Value', acronym:'CV', definition:'Budget deficit or surplus at a given point. CV = EV - AC. Positive CV means under budget; negative CV means over budget.' },
  { term:'Schedule Variance', category:'Cost and Value', acronym:'SV', definition:'Measure of schedule performance. SV = EV - PV. Positive SV means ahead of schedule; negative SV means behind schedule.' },
  { term:'Estimate at Completion', category:'Cost and Value', acronym:'EAC', definition:'Expected total cost of completing all work. Common formula: EAC = AC + (BAC - EV) or EAC = BAC / CPI.' },
  { term:'Estimate to Complete', category:'Cost and Value', acronym:'ETC', definition:'Expected cost needed to finish all remaining project work. ETC = EAC - AC.' },
  { term:'Variance at Completion', category:'Cost and Value', acronym:'VAC', definition:'Projected budget deficit or surplus. VAC = BAC - EAC.' },
  { term:'Contingency Reserve', category:'Cost and Value', definition:'Budget within the cost baseline allocated for identified risks with contingent responses. Handles known-unknowns. Managed by the project manager.' },
  { term:'Management Reserve', category:'Cost and Value', definition:'Budget held outside the performance measurement baseline for management control. Used for unknown-unknowns. Requires sponsor approval to access.' },
  { term:'Risk', category:'Risk', definition:'An uncertain event or condition that, if it occurs, has a positive or negative effect on project objectives. Risks can be threats (negative) or opportunities (positive).' },
  { term:'Risk Register', category:'Risk', definition:'A repository in which outputs of risk management processes are recorded. Contains identified risks, owners, responses, root causes, categories, status, and probability/impact ratings.' },
  { term:'Expected Monetary Value', category:'Risk', acronym:'EMV', definition:'A statistical concept that calculates the average outcome when future scenarios may or may not happen. EMV = Probability x Impact. Used in decision tree analysis.' },
  { term:'Risk Avoidance', category:'Risk', definition:'A risk response strategy where the project team acts to eliminate the threat or protect the project from its impact. Usually involves changing the project management plan.' },
  { term:'Risk Mitigation', category:'Risk', definition:'A risk response strategy where the team acts to decrease the probability of occurrence or impact of a threat. Actions taken before a risk occurs.' },
  { term:'Risk Transfer', category:'Risk', definition:'A risk response strategy where the project team shifts the impact of a threat to a third party. Examples: insurance, warranties, fixed-price contracts.' },
  { term:'Risk Acceptance', category:'Risk', definition:'A risk response strategy where the team decides to acknowledge the risk and not take action unless it occurs. Can be active (contingency plan) or passive.' },
  { term:'Residual Risk', category:'Risk', definition:'The risk that remains after risk responses have been implemented.' },
  { term:'Secondary Risk', category:'Risk', definition:'A risk that arises as a direct result of implementing a risk response.' },
  { term:'Workaround', category:'Risk', definition:'An unplanned response to a risk that was not identified in advance or was accepted. Addresses the impact of risks that have already occurred.' },
  { term:'Quality', category:'Quality', definition:'The degree to which a set of inherent characteristics fulfills requirements. Quality means the product meets stakeholder needs and project processes are carried out correctly.' },
  { term:'Quality Assurance', category:'Quality', acronym:'QA', definition:'The process of auditing quality requirements and results to ensure appropriate quality standards are used. Focuses on process improvement.' },
  { term:'Quality Control', category:'Quality', acronym:'QC', definition:'The process of monitoring and recording results of quality activities to assess performance. Focuses on product inspection and defect identification.' },
  { term:'Control Chart', category:'Quality', definition:'A graphic display of process data over time and against control limits. Used to determine whether a process is stable. Points outside control limits indicate special cause variation.' },
  { term:'Cause and Effect Diagram', category:'Quality', definition:'Also called Ishikawa or fishbone diagram. Traces an undesirable effect back to its root cause. Categories often include: Methods, Machines, Materials, Measurement, Environment, People.' },
  { term:'Pareto Chart', category:'Quality', definition:'A histogram ordered by frequency of occurrence. Based on the Pareto principle (80/20 rule): 80% of problems come from 20% of causes.' },
  { term:'Cost of Quality', category:'Quality', acronym:'COQ', definition:'All costs incurred for preventing nonconformance, appraisal of conformance, and failure to meet requirements. Includes prevention, appraisal, and failure costs.' },
  { term:'Rule of Seven', category:'Quality', definition:'In statistical process control: if seven consecutive data points fall on the same side of the mean, the process is considered out of control even within control limits.' },
  { term:'Sprint', category:'Agile', definition:'A time-boxed iteration of one to four weeks in Scrum during which the team creates a potentially shippable product increment.' },
  { term:'Product Backlog', category:'Agile', definition:'An ordered list of everything needed in the product. Single source of requirements for changes. Maintained and prioritized by the Product Owner.' },
  { term:'Sprint Backlog', category:'Agile', definition:'The set of Product Backlog items selected for the sprint plus a plan for delivering the product increment. Owned by the development team.' },
  { term:'Velocity', category:'Agile', definition:'The amount of work a team completes in a single sprint, measured in story points. Used to forecast future delivery capacity. Determined empirically over multiple sprints.' },
  { term:'User Story', category:'Agile', definition:'A brief, informal description of a feature from the user perspective. Format: As a [user type], I want [goal] so that [reason]. Used to capture requirements in Agile projects.' },
  { term:'Definition of Done', category:'Agile', acronym:'DoD', definition:'A shared understanding of what it means for work to be complete. A checklist of quality criteria that must be met before a story or sprint increment is considered done.' },
  { term:'Retrospective', category:'Agile', definition:'A regular meeting at end of each sprint where the team reflects on what went well, what did not, and what improvements to make. Central to continuous improvement in Agile.' },
  { term:'Kanban', category:'Agile', definition:'A method for visualizing workflow, limiting work in progress (WIP), and managing flow. Uses a Kanban board with columns representing stages of work.' },
  { term:'Scrum', category:'Agile', definition:'An Agile framework using fixed-length sprints, specific roles (Product Owner, Scrum Master, Development Team), and ceremonies (Sprint Planning, Daily Scrum, Sprint Review, Retrospective).' },
  { term:'Product Owner', category:'Agile', definition:'Scrum role responsible for maximizing product value by managing and prioritizing the Product Backlog. Represents the voice of the customer and stakeholders.' },
  { term:'Scrum Master', category:'Agile', definition:'Scrum role responsible for promoting and supporting Scrum. Helps everyone understand Scrum theory and practices. Removes impediments to team progress.' },
  { term:'Burndown Chart', category:'Agile', definition:'A graphical representation of work left to do versus time. Shows whether the team is on track to complete the sprint or release.' },
  { term:'Story Points', category:'Agile', definition:'A unit of measure for expressing the overall effort required to implement a product backlog item. Abstract units representing relative size, complexity, and uncertainty.' },
  { term:'Daily Scrum', category:'Agile', definition:'A 15-minute time-boxed daily event for the team to synchronize and plan the next 24 hours. Each member answers: What did I do yesterday? What will I do today? Any impediments?' },
  { term:'Communications Management Plan', category:'Stakeholder', definition:'A component of the project management plan describing how project communications will be planned, structured, implemented, and monitored.' },
  { term:'Stakeholder Engagement Plan', category:'Stakeholder', definition:'A component of the project management plan that identifies strategies and actions required to promote productive stakeholder involvement in project decision making.' },
  { term:'Power/Interest Grid', category:'Stakeholder', definition:'A stakeholder analysis tool categorizing stakeholders by level of authority (power) and concern for project outcomes (interest). Used to prioritize engagement strategies.' },
  { term:'RACI Matrix', category:'Stakeholder', definition:'A responsibility assignment matrix using Responsible, Accountable, Consulted, and Informed to clarify roles and responsibilities.' },
  { term:'Issue Log', category:'Stakeholder', definition:'A project document where information about issues is recorded and monitored. Issues are problems requiring resolution. Different from risks, which are uncertain future events.' },
  { term:'Statement of Work', category:'Procurement', acronym:'SOW', definition:'A narrative description of products, services, or results to be delivered. Includes specifications, quantities, quality requirements, and performance criteria.' },
  { term:'Request for Proposal', category:'Procurement', acronym:'RFP', definition:'A procurement document used to request proposals from prospective sellers. Used when the buyer needs to evaluate vendor approaches, qualifications, and price.' },
  { term:'Fixed Price Contract', category:'Procurement', definition:'A contract type setting the fee for a defined scope regardless of actual costs. Transfers cost risk to the seller. Types: FFP, FPIF, FP-EPA.' },
  { term:'Cost Reimbursable Contract', category:'Procurement', definition:'A contract where the buyer reimburses the seller for all allowable costs incurred plus a fee representing seller profit. Transfers cost risk to the buyer.' },
  { term:'Time and Material Contract', category:'Procurement', acronym:'T&M', definition:'A hybrid contract type. Unit rates are fixed, but total cost is variable based on time spent and materials used. Used when scope cannot be precisely defined.' },
  { term:'Integrated Change Control', category:'Integration', definition:'The process of reviewing all change requests, approving changes, and managing changes to deliverables and plans. Ensures changes are considered holistically.' },
  { term:'Change Control Board', category:'Integration', acronym:'CCB', definition:'A formally chartered group responsible for reviewing, evaluating, approving, or rejecting changes to the project, and recording and communicating change decisions.' },
  { term:'Benefits Realization Plan', category:'Integration', definition:'A document describing how and when the project will deliver benefits defined in the business case, and the mechanism by which they will be measured.' },
  { term:'Business Case', category:'Integration', definition:'A documented economic feasibility study used to establish the validity of the benefits of a selected component. Used as a basis for authorization of project management activities.' },
]

const CATEGORIES = ['All', 'Core Concepts', 'Scheduling', 'Cost and Value', 'Risk', 'Quality', 'Agile', 'Stakeholder', 'Procurement', 'Integration']

const CAT_COLOR: Record<string, string> = {
  'Core Concepts': 'bg-blue-100 text-blue-800',
  'Scheduling': 'bg-green-100 text-green-800',
  'Cost and Value': 'bg-yellow-100 text-yellow-800',
  'Risk': 'bg-red-100 text-red-800',
  'Quality': 'bg-purple-100 text-purple-800',
  'Agile': 'bg-teal-100 text-teal-800',
  'Stakeholder': 'bg-orange-100 text-orange-800',
  'Procurement': 'bg-indigo-100 text-indigo-800',
  'Integration': 'bg-pink-100 text-pink-800',
}

function shuffle(arr: Card[]): Card[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashcardsPage() {
  const [mode, setMode] = useState<'browse'|'study'>('browse')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [current, setCurrent] = useState(0)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [unknown, setUnknown] = useState<Set<number>>(new Set())
  const [deck, setDeck] = useState<Card[]>(cards)
  const [shuffleOn, setShuffleOn] = useState(false)

  const filtered = cards.filter(t =>
    (category === 'All' || t.category === category) &&
    (search === '' || t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase()))
  )

  const startStudy = () => {
    const pool = category === 'All' ? [...cards] : cards.filter(t => t.category === category)
    setDeck(shuffleOn ? shuffle(pool) : pool)
    setCurrent(0)
    setFlipped(false)
    setKnown(new Set())
    setUnknown(new Set())
    setMode('study')
  }

  const advance = () => {
    if (current < deck.length - 1) {
      setCurrent(current + 1)
      setFlipped(false)
    } else {
      setMode('browse')
    }
  }

  const handleKnown = () => { setKnown(prev => new Set([...prev, current])); advance() }
  const handleUnknown = () => { setUnknown(prev => new Set([...prev, current])); advance() }

  const card = deck[current]
  const prog = deck.length > 0 ? ((current + 1) / deck.length) * 100 : 0

  if (mode === 'study' && card) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="bg-navy text-white px-4 py-3 sticky top-0 z-10">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <button onClick={() => setMode('browse')} className="text-gray-300 hover:text-white text-sm">Exit</button>
            <div className="text-center">
              <div className="text-gold font-bold text-sm">{current+1} / {deck.length}</div>
              <div className="text-gray-400 text-xs">{known.size} known</div>
            </div>
            <div className="text-gold text-sm font-bold">{Math.round((known.size/Math.max(deck.length,1))*100)}%</div>
          </div>
          <div className="max-w-xl mx-auto mt-2 h-1.5 bg-white/20 rounded-full">
            <div className="h-1.5 bg-gold rounded-full transition-all" style={{width: prog + '%'}} />
          </div>
        </div>
        <div className="max-w-xl mx-auto px-4 py-10">
          <div className="flex justify-center mb-4">
            <span className={'text-xs font-bold px-3 py-1 rounded-full ' + (CAT_COLOR[card.category] || 'bg-gray-100 text-gray-800')}>
              {card.category}
            </span>
          </div>
          <div onClick={() => setFlipped(!flipped)} className="cursor-pointer select-none" style={{perspective:'1000px'}}>
            <div style={{position:'relative',height:'280px',transformStyle:'preserve-3d',transition:'transform 0.5s',transform:flipped?'rotateY(180deg)':'rotateY(0deg)'}}>
              <div style={{position:'absolute',width:'100%',height:'100%',backfaceVisibility:'hidden'}}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-md flex flex-col items-center justify-center p-8">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Term</p>
                <h2 className="text-3xl font-bold text-navy text-center">{card.term}</h2>
                {card.acronym && <span className="mt-3 bg-gold text-navy text-sm font-bold px-3 py-1 rounded-full">{card.acronym}</span>}
                <p className="text-gray-400 text-xs mt-6">Tap to reveal definition</p>
              </div>
              <div style={{position:'absolute',width:'100%',height:'100%',backfaceVisibility:'hidden',transform:'rotateY(180deg)'}}
                className="bg-navy rounded-2xl shadow-md flex flex-col items-center justify-center p-8">
                <p className="text-gold text-xs uppercase tracking-widest mb-4">Definition</p>
                <p className="text-white text-center leading-relaxed">{card.definition}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button onClick={handleUnknown} className="flex-1 py-4 bg-red-100 text-red-700 font-bold rounded-xl border-2 border-red-200 hover:bg-red-200">Still Learning</button>
            <button onClick={() => setFlipped(!flipped)} className="px-6 py-4 bg-gray-100 text-gray-600 font-semibold rounded-xl border-2 border-gray-200">Flip</button>
            <button onClick={handleKnown} className="flex-1 py-4 bg-green-100 text-green-700 font-bold rounded-xl border-2 border-green-200 hover:bg-green-200">Got It!</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">PMBOK Glossary</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">PMP Flashcards</h1>
          <p className="text-gray-300 text-lg">{cards.length} terms from the PMBOK Guide. Flip cards, track mastery, filter by category.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input type="text" placeholder="Search terms or definitions..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            <button onClick={startStudy} className="bg-gold text-navy font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors whitespace-nowrap">
              Study {category === 'All' ? 'All' : category} Cards
            </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setShuffleOn(!shuffleOn)}
              className={'w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ' + (shuffleOn ? 'bg-gold' : 'bg-gray-300')}>
              <div className={'w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-all ' + (shuffleOn ? 'left-5' : 'left-0.5')} />
            </button>
            <span className="text-sm text-gray-600">Shuffle cards when studying</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={'text-xs px-3 py-1.5 rounded-full border font-medium transition-all ' + (category === cat ? 'bg-navy text-white border-navy' : 'border-gray-300 text-gray-600 hover:border-navy')}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((term) => (
            <div key={term.term} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gold transition-colors shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold text-navy text-base">{term.term}</h3>
                  {term.acronym && <span className="text-xs bg-gold/20 text-navy font-bold px-2 py-0.5 rounded mt-1 inline-block">{term.acronym}</span>}
                </div>
                <span className={'text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ' + (CAT_COLOR[term.category] || 'bg-gray-100 text-gray-800')}>{term.category}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{term.definition}</p>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">Search</p>
            <p className="font-medium">No terms found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/exam-simulator" className="flex-1 bg-navy text-white font-bold py-4 rounded-xl text-center hover:bg-navy/80 transition-colors">Exam Simulator</Link>
          <a href="https://calendly.com/space4grace/15min" target="_blank" rel="noopener noreferrer"
            className="flex-1 bg-gold text-navy font-bold py-4 rounded-xl text-center hover:bg-yellow-400 transition-colors">
            Book a Free Call
          </a>
        </div>
      </div>
    </main>
  )
}
