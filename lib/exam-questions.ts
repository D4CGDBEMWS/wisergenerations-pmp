export type Domain = 'People' | 'Process' | 'Business Environment'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Question {
  id: number
  domain: Domain
  difficulty: Difficulty
  question: string
  options: string[]
  correct: number
  explanation: string
  reference?: string
}

export const examQuestions: Question[] = [
  // ─── PEOPLE DOMAIN ───────────────────────────────────────────────────────
  {
    id: 1, domain: 'People', difficulty: 'Medium',
    question: 'A project manager discovers that two team members have a personal conflict that is affecting their collaboration. What is the BEST first step?',
    options: ['Escalate the conflict to the project sponsor immediately','Meet with each team member privately to understand their perspective','Remove one of the team members from the project','Send an email to both team members asking them to resolve it themselves'],
    correct: 1,
    explanation: 'Best practice for conflict resolution is to first understand each party's perspective through private conversations before bringing them together. Immediate escalation or removal should be last resorts.',
    reference: 'PMBOK 7 - Team Performance Domain'
  },
  {
    id: 2, domain: 'People', difficulty: 'Easy',
    question: 'Which leadership style is MOST appropriate when working with a highly experienced and motivated team?',
    options: ['Autocratic','Delegating','Coaching','Directing'],
    correct: 1,
    explanation: 'Delegating (also called laissez-faire) is most appropriate for high-competence, high-motivation team members. The project manager assigns work and lets the team operate independently.',
    reference: 'PMBOK 7 - Situational Leadership'
  },
  {
    id: 3, domain: 'People', difficulty: 'Hard',
    question: 'A project manager is leading a virtual team spread across four continents. Team members report feeling isolated. Which action BEST addresses this?',
    options: ['Increase the frequency of status reports','Establish regular virtual team-building activities and informal communication channels','Require all team members to work the same hours regardless of time zone','Assign a local manager to each region to replace the project manager'],
    correct: 1,
    explanation: 'Virtual teams need structured opportunities for informal connection and team building. Regular virtual social events and informal channels (like team chat rooms) build cohesion across distance.',
    reference: 'PMBOK 7 - Team Performance Domain'
  },
  {
    id: 4, domain: 'People', difficulty: 'Medium',
    question: 'A new team member from another country consistently misses deadlines and appears disengaged. What should the project manager investigate FIRST?',
    options: ['Whether the team member needs to be replaced','Cultural communication differences that may be causing misunderstandings','Whether the team member's manager should be notified','Whether the team member was correctly screened before joining'],
    correct: 1,
    explanation: 'Cultural differences in communication style, expectations about hierarchy, and work norms often explain apparent disengagement. A culturally aware project manager investigates this first before assuming performance issues.',
    reference: 'PMBOK 7 - Stakeholder Performance Domain'
  },
  {
    id: 5, domain: 'People', difficulty: 'Medium',
    question: 'According to Tuckman's model of team development, what stage comes AFTER Storming?',
    options: ['Forming','Performing','Norming','Adjourning'],
    correct: 2,
    explanation: 'Tuckman's five stages are: Forming, Storming, Norming, Performing, Adjourning. After Storming (conflict), teams move to Norming where they establish working norms and relationships.',
    reference: 'PMBOK 6 - Develop Project Team'
  },
  {
    id: 6, domain: 'People', difficulty: 'Hard',
    question: 'A project manager is working with a functional manager to negotiate for resources. The functional manager keeps reassigning the team member to other work. What is the BEST approach?',
    options: ['Escalate to the project sponsor and request the resource be formally allocated','Document the issue in the risk register and proceed without the resource','Schedule a meeting with both the functional manager and the project sponsor to align priorities','Accept the situation and redistribute the work among existing team members'],
    correct: 2,
    explanation: 'When resource conflicts exist between projects, the appropriate approach is to bring both the functional manager and sponsor together to align on organizational priorities. This creates a formal resolution without bypassing either authority.',
    reference: 'PMBOK 6 - Resource Management'
  },
  {
    id: 7, domain: 'People', difficulty: 'Easy',
    question: 'Which conflict resolution technique results in a win-win outcome?',
    options: ['Smoothing','Forcing','Compromising','Collaborating'],
    correct: 3,
    explanation: 'Collaborating (or Problem Solving) is the only conflict resolution technique that seeks a win-win by addressing the root cause and finding a solution that satisfies both parties' needs.',
    reference: 'PMBOK 6 - Manage Team'
  },
  {
    id: 8, domain: 'People', difficulty: 'Medium',
    question: 'A project manager wants to reward a team member for exceptional work. The organization has no formal recognition program. What is the BEST action?',
    options: ['Wait until the organization establishes a formal program','Provide informal recognition such as public praise during team meetings and a personal thank-you','Offer the team member additional paid time off without authorization','Recommend the team member for a salary increase to HR'],
    correct: 1,
    explanation: 'Project managers have many informal motivational tools available regardless of formal programs. Public recognition and personal appreciation are highly effective and immediately available.',
    reference: 'PMBOK 6 - Develop Project Team'
  },
  {
    id: 9, domain: 'People', difficulty: 'Hard',
    question: 'A project team member tells the project manager that their supervisor is pressuring them to share confidential project information. What should the project manager do FIRST?',
    options: ['Tell the team member to comply with the supervisor's request','Immediately report the supervisor to HR','Consult with the project sponsor and legal counsel about the appropriate response','Ignore the situation since it involves the team member's direct reporting relationship'],
    correct: 2,
    explanation: 'Sharing confidential project information without authorization is an ethical and potentially legal matter. The project manager should first consult with the sponsor and legal counsel to determine the appropriate organizational response.',
    reference: 'PMI Code of Ethics and Professional Conduct'
  },
  {
    id: 10, domain: 'People', difficulty: 'Medium',
    question: 'During a retrospective, the team agrees that standups are ineffective. What is the BEST next step?',
    options: ['Eliminate standups immediately','Experiment with a modified standup format and evaluate after two sprints','Escalate the decision to the project sponsor','Continue standups unchanged as they are a required Agile ceremony'],
    correct: 1,
    explanation: 'Agile retrospectives lead to experiments and continuous improvement — not immediate elimination of practices. The team should try a modified approach, inspect, and adapt based on results.',
    reference: 'Agile Practice Guide - Retrospectives'
  },

  // ─── PROCESS DOMAIN ──────────────────────────────────────────────────────
  {
    id: 11, domain: 'Process', difficulty: 'Easy',
    question: 'Which document provides the formal authorization for a project to begin?',
    options: ['Project Management Plan','Scope Statement','Project Charter','Business Case'],
    correct: 2,
    explanation: 'The Project Charter formally authorizes the project, names the project manager, and grants authority to apply resources. It is created in the Initiating Process Group.',
    reference: 'PMBOK 6 - Develop Project Charter'
  },
  {
    id: 12, domain: 'Process', difficulty: 'Medium',
    question: 'A project is currently running behind schedule and over budget. The CPI is 0.85 and SPI is 0.90. Which is the MOST accurate interpretation?',
    options: ['The project is getting $0.85 of value for every dollar spent and is progressing at 90% of the planned rate','The project is 15% over budget and 10% ahead of schedule','The project will finish 15% early but will be over budget','The project has spent 85% of the budget and completed 90% of the work'],
    correct: 0,
    explanation: 'CPI = EV/AC. A CPI of 0.85 means the project gets $0.85 of earned value for every actual dollar spent (15% over budget). SPI = EV/PV. An SPI of 0.90 means the project is progressing at 90% of the planned rate (10% behind schedule).',
    reference: 'PMBOK 6 - Earned Value Management'
  },
  {
    id: 13, domain: 'Process', difficulty: 'Hard',
    question: 'A change request is approved that adds significant scope to the project. What documents must be updated FIRST?',
    options: ['Only the project schedule','The project management plan and relevant subsidiary plans including scope, schedule, and cost baselines','Only the WBS','Only the stakeholder register'],
    correct: 1,
    explanation: 'Approved changes require updates to the project management plan and all affected subsidiary plans. Baselines (scope, schedule, cost) must be formally updated through the Integrated Change Control process.',
    reference: 'PMBOK 6 - Perform Integrated Change Control'
  },
  {
    id: 14, domain: 'Process', difficulty: 'Medium',
    question: 'What is the purpose of a Work Breakdown Structure (WBS)?',
    options: ['To define the sequence of project activities','To decompose the total scope of work into manageable deliverables','To assign resources to project tasks','To estimate the project duration'],
    correct: 1,
    explanation: 'The WBS decomposes the total project scope into smaller, more manageable components (work packages). It defines WHAT needs to be delivered, not when or by whom.',
    reference: 'PMBOK 6 - Create WBS'
  },
  {
    id: 15, domain: 'Process', difficulty: 'Easy',
    question: 'Which scheduling technique uses three point estimates (optimistic, pessimistic, most likely) to calculate expected activity duration?',
    options: ['Critical Path Method','Monte Carlo Analysis','PERT (Program Evaluation and Review Technique)','Analogous Estimating'],
    correct: 2,
    explanation: 'PERT uses three point estimates. Expected duration = (O + 4M + P) / 6, where O=Optimistic, M=Most Likely, P=Pessimistic. This accounts for uncertainty in duration estimates.',
    reference: 'PMBOK 6 - Estimate Activity Durations'
  },
  {
    id: 16, domain: 'Process', difficulty: 'Hard',
    question: 'A project has: PV=$500,000, EV=$450,000, AC=$480,000. What is the Estimate at Completion (EAC) using the typical EAC formula assuming future work will be performed at the budgeted rate?',
    options: ['$553,333','$530,000','$526,667','$480,000'],
    correct: 2,
    explanation: 'EAC = AC + (BAC - EV). First we need BAC. Given PV=500K is assumed to equal BAC: EAC = 480,000 + (500,000 - 450,000) = 480,000 + 50,000 = $530,000. This formula assumes remaining work will be done at the original budget.',
    reference: 'PMBOK 6 - Earned Value Management'
  },
  {
    id: 17, domain: 'Process', difficulty: 'Medium',
    question: 'A project manager wants to compress the schedule without changing scope. Which technique involves doing activities in parallel that were originally planned sequentially?',
    options: ['Crashing','Fast tracking','Resource leveling','Schedule compression'],
    correct: 1,
    explanation: 'Fast tracking overlaps phases or activities that were originally planned in sequence. It increases risk but does not add cost like crashing (adding resources). It only works when activities can logically be done in parallel.',
    reference: 'PMBOK 6 - Schedule Compression'
  },
  {
    id: 18, domain: 'Process', difficulty: 'Hard',
    question: 'A project manager identifies a risk with a probability of 0.30 and an impact of $80,000. What is the Expected Monetary Value (EMV) of this risk?',
    options: ['$26,667','$80,000','$24,000','$110,000'],
    correct: 2,
    explanation: 'EMV = Probability x Impact = 0.30 x $80,000 = $24,000. EMV is used in quantitative risk analysis and decision tree analysis to evaluate risk value.',
    reference: 'PMBOK 6 - Quantitative Risk Analysis'
  },
  {
    id: 19, domain: 'Process', difficulty: 'Medium',
    question: 'What is the MAIN purpose of a project kickoff meeting?',
    options: ['To create the project charter','To formally begin execution and align the team on project objectives, roles, and processes','To complete the risk register','To obtain final sign-off on the project management plan'],
    correct: 1,
    explanation: 'The kickoff meeting marks the transition from planning to execution. Its primary purpose is to formally launch the project, align stakeholders and team members on objectives, roles, responsibilities, and ways of working.',
    reference: 'PMBOK 6 - Direct and Manage Project Work'
  },
  {
    id: 20, domain: 'Process', difficulty: 'Easy',
    question: 'A project manager is using a Kanban board. Work items that are started but not completed are called:',
    options: ['Backlog items','Work in Progress (WIP)','Done items','Sprint items'],
    correct: 1,
    explanation: 'In Kanban, Work in Progress (WIP) refers to items that have been started but not yet completed. Kanban systems often limit WIP to improve flow and reduce multitasking.',
    reference: 'Agile Practice Guide - Kanban'
  },
  {
    id: 21, domain: 'Process', difficulty: 'Medium',
    question: 'The project quality audit found that a process is consistently producing defects. What is the BEST next step?',
    options: ['Accept the defects and deliver the product as-is','Perform root cause analysis to identify and eliminate the source of the defects','Increase inspections at the end of the process','Blame the team member responsible for the process'],
    correct: 1,
    explanation: 'Quality management focuses on preventing defects by improving processes, not just detecting them. Root cause analysis (e.g., fishbone/Ishikawa diagram, 5 Whys) identifies the underlying cause so it can be eliminated.',
    reference: 'PMBOK 6 - Control Quality'
  },
  {
    id: 22, domain: 'Process', difficulty: 'Hard',
    question: 'A project manager is planning a complex construction project. Which dependency type describes a situation where Activity B cannot start until 5 days after Activity A starts?',
    options: ['Finish-to-Start with lag','Start-to-Start with lag','Finish-to-Finish with lead','Start-to-Finish'],
    correct: 1,
    explanation: 'Start-to-Start (SS) with lag means the successor cannot start until a specified amount of time after the predecessor starts. Here: B cannot start until 5 days after A starts = SS+5 days.',
    reference: 'PMBOK 6 - Sequence Activities'
  },
  {
    id: 23, domain: 'Process', difficulty: 'Medium',
    question: 'In Agile, what is the purpose of a Definition of Done (DoD)?',
    options: ['To define when the project is closed','To establish the criteria that must be met before a user story or sprint is considered complete','To define the minimum viable product','To outline the acceptance criteria for the entire release'],
    correct: 1,
    explanation: 'The Definition of Done is a shared agreement about the quality standards and completion criteria for work items. It ensures consistent quality and prevents ambiguity about what "finished" means.',
    reference: 'Agile Practice Guide - Definition of Done'
  },
  {
    id: 24, domain: 'Process', difficulty: 'Easy',
    question: 'Which risk response strategy involves transferring the negative impact of a risk to a third party?',
    options: ['Avoid','Mitigate','Transfer','Accept'],
    correct: 2,
    explanation: 'Transfer shifts the financial impact of a risk to a third party through mechanisms like insurance, warranties, or contracts. It does not eliminate the risk but moves responsibility for managing it.',
    reference: 'PMBOK 6 - Plan Risk Responses'
  },
  {
    id: 25, domain: 'Process', difficulty: 'Hard',
    question: 'A project manager discovers a critical path activity will be 3 weeks late due to a vendor delay. Crashing will cost $15,000/week. Fast tracking carries a 40% probability of rework costing $30,000. Which option is MOST cost-effective?',
    options: ['Crash the schedule for 3 weeks ($45,000)','Fast track and accept the risk (EMV: $12,000)','Accept the delay and notify stakeholders','Fast track — lower expected cost than crashing'],
    correct: 3,
    explanation: 'Fast tracking EMV = 0.40 x $30,000 = $12,000 expected rework cost. Crashing = $45,000 certain cost. Fast tracking has a lower expected cost ($12,000 < $45,000), making it more cost-effective from a pure EV perspective. However, the project manager should also consider the risk tolerance of stakeholders.',
    reference: 'PMBOK 6 - Schedule Compression + Risk'
  },
  {
    id: 26, domain: 'Process', difficulty: 'Medium',
    question: 'What does a velocity of 40 story points per sprint indicate in an Agile project?',
    options: ['The team will complete 40 sprints','The team completed work worth 40 story points in the sprint','The project has 40 user stories remaining','Each story point equals 40 hours of work'],
    correct: 1,
    explanation: 'Velocity measures how much work (in story points) a team typically completes per sprint. A velocity of 40 means the team delivers 40 story points of value per sprint, which is used to forecast future delivery.',
    reference: 'Agile Practice Guide - Velocity'
  },
  {
    id: 27, domain: 'Process', difficulty: 'Medium',
    question: 'A project has a large number of stakeholders. Which tool BEST helps the project manager prioritize stakeholder engagement?',
    options: ['Communications management plan','Power/Interest grid','Risk register','WBS'],
    correct: 1,
    explanation: 'The Power/Interest (or Power/Impact) grid categorizes stakeholders by their level of authority and interest in the project, helping the project manager prioritize engagement strategies for different groups.',
    reference: 'PMBOK 6 - Identify Stakeholders'
  },
  {
    id: 28, domain: 'Process', difficulty: 'Easy',
    question: 'What is a sprint in Scrum?',
    options: ['A meeting to review project status','A time-boxed iteration during which the team delivers a potentially shippable product increment','A backlog refinement session','The final phase of project delivery'],
    correct: 1,
    explanation: 'A sprint is a fixed-length iteration (typically 1-4 weeks) in Scrum during which the team completes a set of backlog items and delivers a potentially shippable product increment.',
    reference: 'Scrum Guide - Sprint'
  },
  {
    id: 29, domain: 'Process', difficulty: 'Hard',
    question: 'A project manager is closing a project that was terminated early. What is the MOST important action?',
    options: ['Archive all project documents and celebrate the team's effort','Release team resources immediately','Document lessons learned, capture formal acceptance (or termination decision), and close out contracts','Transfer ownership to operations without documentation'],
    correct: 2,
    explanation: 'Even when projects are terminated early, proper closure is essential: document lessons learned, obtain formal sign-off on the termination, close all contracts, and archive records. This protects the organization and benefits future projects.',
    reference: 'PMBOK 6 - Close Project or Phase'
  },
  {
    id: 30, domain: 'Process', difficulty: 'Medium',
    question: 'A project manager is reviewing a control chart. Data points consistently fall on one side of the mean for seven consecutive measurements. This is called:',
    options: ['Standard deviation','A rule of seven (special cause variation)','Normal variation','Regression to the mean'],
    correct: 1,
    explanation: 'The "Rule of Seven" states that seven consecutive data points on the same side of the mean indicates a non-random pattern (special cause variation), even if all points are within control limits. The process should be investigated.',
    reference: 'PMBOK 6 - Control Quality'
  },

  // ─── BUSINESS ENVIRONMENT DOMAIN ─────────────────────────────────────────
  {
    id: 31, domain: 'Business Environment', difficulty: 'Medium',
    question: 'A project is aligned with a strategic business objective, but the business objective has changed. What should the project manager do FIRST?',
    options: ['Continue the project as planned since it was already approved','Assess the impact of the changed objective on the project and escalate to the sponsor','Immediately close the project','Conduct a team meeting to decide whether to continue'],
    correct: 1,
    explanation: 'Projects exist to deliver business value. When strategic objectives change, the project manager must assess whether the project still delivers the intended value and escalate to the sponsor for a decision about continuation, modification, or closure.',
    reference: 'PMBOK 7 - Business Environment Domain'
  },
  {
    id: 32, domain: 'Business Environment', difficulty: 'Easy',
    question: 'Which document describes how a project's benefits will be measured and realized after the project closes?',
    options: ['Project Charter','Business Case','Benefits Realization Plan','Stakeholder Register'],
    correct: 2,
    explanation: 'The Benefits Realization Plan documents how and when project benefits will be realized, who is responsible for measuring them, and what metrics will be used. It extends beyond project closure into operations.',
    reference: 'PMBOK 6 - Benefits Management'
  },
  {
    id: 33, domain: 'Business Environment', difficulty: 'Hard',
    question: 'An organization is undergoing a major restructuring during project execution. Key stakeholders have changed. What is the BEST action?',
    options: ['Continue the project as planned; organizational changes are outside project scope','Update the stakeholder register, re-engage new stakeholders, and assess impact on the project's strategic alignment','Pause the project until the restructuring is complete','Request that the sponsor freeze all organizational changes until the project is done'],
    correct: 1,
    explanation: 'Stakeholder changes require the project manager to re-identify and re-engage stakeholders, update the stakeholder register and engagement plan, and reassess whether the project is still strategically aligned given the new organizational structure.',
    reference: 'PMBOK 7 - Stakeholder Performance Domain'
  },
  {
    id: 34, domain: 'Business Environment', difficulty: 'Medium',
    question: 'What is the primary purpose of a governance framework in project management?',
    options: ['To define the project schedule','To establish decision-making authority, accountability, and oversight structures for projects','To manage team conflicts','To track project costs'],
    correct: 1,
    explanation: 'Governance frameworks define who has authority to make decisions, how decisions are escalated, what oversight mechanisms exist, and how accountability is established. They ensure projects are conducted within organizational guidelines.',
    reference: 'PMBOK 7 - Project Governance'
  },
  {
    id: 35, domain: 'Business Environment', difficulty: 'Medium',
    question: 'A project manager must navigate a complex regulatory environment. Which action BEST demonstrates compliance management?',
    options: ['Ignore regulations that conflict with the project schedule','Identify all applicable regulations during planning and incorporate compliance requirements into the project plan','Delegate all compliance matters to the legal department','Address regulatory requirements only when audited'],
    correct: 1,
    explanation: 'Proactive compliance management requires identifying applicable laws, regulations, and standards during planning and building compliance activities into the project plan, rather than reacting to audits or violations.',
    reference: 'PMBOK 7 - Business Environment Domain'
  },
  {
    id: 36, domain: 'Business Environment', difficulty: 'Hard',
    question: 'A project manager is asked to approve a change that will shorten the project but will harm the local community. The change has been approved by the project sponsor. What should the project manager do?',
    options: ['Implement the change immediately since the sponsor approved it','Raise the ethical and social impact concerns formally, document them, and escalate through appropriate channels before implementing','Implement the change and document personal objections in a private journal','Resign from the project'],
    correct: 1,
    explanation: 'PMI's Code of Ethics requires project managers to consider impacts on communities and act with integrity. The project manager must formally raise ethical concerns through appropriate channels — even when sponsors have approved the change.',
    reference: 'PMI Code of Ethics and Professional Conduct'
  },
  {
    id: 37, domain: 'Business Environment', difficulty: 'Easy',
    question: 'What does OPA stand for in project management?',
    options: ['Organizational Project Authority','Operational Process Assessment','Organizational Process Assets','Outstanding Project Approvals'],
    correct: 2,
    explanation: 'Organizational Process Assets (OPAs) include any artifact, practice, or knowledge from any organization involved in the project that can be used to perform or govern the project — such as templates, historical data, lessons learned, and policies.',
    reference: 'PMBOK 6 - Organizational Process Assets'
  },
  {
    id: 38, domain: 'Business Environment', difficulty: 'Medium',
    question: 'A project is delivering value incrementally to stakeholders. Which lifecycle approach does this describe?',
    options: ['Predictive (Waterfall)','Sequential','Iterative/Incremental (Agile or Hybrid)','Linear'],
    correct: 2,
    explanation: 'Iterative and incremental approaches deliver value in successive portions. Agile and hybrid approaches are designed to deliver usable increments early and often, allowing stakeholders to benefit before the project is fully complete.',
    reference: 'PMBOK 7 - Development Approach'
  },
  {
    id: 39, domain: 'Business Environment', difficulty: 'Hard',
    question: 'An organization uses a portfolio management approach. Which BEST describes how a project fits into this structure?',
    options: ['A project is managed independently of business strategy','A project is a component of a program or portfolio aligned to strategic objectives, and competes for resources based on its relative value to the organization','A project is only related to other projects when they share team members','A portfolio contains only programs, not individual projects'],
    correct: 1,
    explanation: 'In portfolio management, projects and programs are grouped and prioritized based on their strategic alignment and relative value. Resources are allocated across the portfolio to maximize organizational value.',
    reference: 'PMBOK 6 - Portfolio, Program, and Project Management'
  },
  {
    id: 40, domain: 'Business Environment', difficulty: 'Medium',
    question: 'Which environmental factor is MOST likely to impact a global project with teams in multiple countries?',
    options: ['Project charter content','WBS structure','Cultural norms and time zones','Meeting frequency'],
    correct: 2,
    explanation: 'Cultural norms and time zones are Enterprise Environmental Factors (EEFs) that significantly impact global projects — affecting communication, decision-making styles, working hours, holidays, and team cohesion.',
    reference: 'PMBOK 6 - Enterprise Environmental Factors'
  },
]
