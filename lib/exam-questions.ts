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
}

export const examQuestions: Question[] = [
  {
    id: 1, domain: 'People', difficulty: 'Medium',
    question: 'A project manager discovers two team members have a personal conflict affecting their collaboration. What is the BEST first step?',
    options: [
      'Escalate the conflict to the project sponsor immediately',
      'Meet with each team member privately to understand their perspective',
      'Remove one of the team members from the project',
      'Send an email asking both to resolve it themselves'
    ],
    correct: 1,
    explanation: 'Best practice for conflict resolution is to first understand each perspective through private conversations. Escalation or removal are last resorts.'
  },
  {
    id: 2, domain: 'People', difficulty: 'Easy',
    question: 'Which leadership style is MOST appropriate for a highly experienced and motivated team?',
    options: [
      'Directing - give specific instructions',
      'Coaching - explain decisions and ask for input',
      'Supporting - share decision-making',
      'Delegating - hand off responsibility to the team'
    ],
    correct: 3,
    explanation: 'For highly experienced and motivated teams, delegating is most appropriate. The team has both the competence and commitment to work independently.'
  },
  {
    id: 3, domain: 'People', difficulty: 'Hard',
    question: 'A key stakeholder is consistently disengaged during project meetings. What is the BEST approach?',
    options: [
      'Continue meetings without the stakeholder',
      'Escalate to the project sponsor',
      'Schedule a one-on-one to understand their concerns and expectations',
      'Remove them from the stakeholder register'
    ],
    correct: 2,
    explanation: 'A private conversation helps uncover why the stakeholder is disengaged. Understanding their concerns allows the PM to better address their needs and improve engagement.'
  },
  {
    id: 4, domain: 'People', difficulty: 'Medium',
    question: 'What is the PRIMARY purpose of a team charter?',
    options: [
      'Document individual performance expectations',
      'Establish team norms, values, and operating agreements',
      'Replace the project management plan',
      'Assign tasks to team members'
    ],
    correct: 1,
    explanation: 'A team charter establishes how the team will work together, including communication norms, decision-making processes, and shared values.'
  },
  {
    id: 5, domain: 'People', difficulty: 'Medium',
    question: 'A team member is underperforming. What should the project manager do FIRST?',
    options: [
      'Escalate to HR immediately',
      'Have a private, candid conversation with the team member',
      'Reassign their work to other team members',
      'Document the issue in the project status report'
    ],
    correct: 1,
    explanation: 'A private conversation is the first step in addressing underperformance. It allows the PM to understand root causes and provide coaching before escalation.'
  },
  {
    id: 6, domain: 'People', difficulty: 'Hard',
    question: 'Two stakeholders have opposing views on the project scope. How should the PM resolve this?',
    options: [
      'Make a unilateral decision to keep the project moving',
      'Facilitate a structured discussion to find a mutually acceptable solution',
      'Let the stakeholders resolve it themselves',
      'Defer to the most senior stakeholder'
    ],
    correct: 1,
    explanation: 'Facilitation brings competing interests together. A structured dialogue helps identify shared goals and reach consensus while maintaining stakeholder relationships.'
  },
  {
    id: 7, domain: 'People', difficulty: 'Medium',
    question: 'A project manager wants to motivate team members without formal authority. Which approach is MOST effective?',
    options: [
      'Threaten to remove underperformers from the team',
      'Use public recognition and provide meaningful work assignments',
      'Offer unauthorized bonuses',
      'Increase overtime hours'
    ],
    correct: 1,
    explanation: 'Public recognition and meaningful work assignments are effective motivational tools available to project managers even without formal authority.'
  },
  {
    id: 8, domain: 'People', difficulty: 'Hard',
    question: 'A distributed team has communication challenges due to time zone differences. What is the BEST solution?',
    options: [
      'Require all team members to work the same hours',
      'Establish overlapping core hours and use asynchronous communication tools',
      'Assign all work to team members in the same time zone',
      'Reduce the number of team meetings'
    ],
    correct: 1,
    explanation: 'Overlapping core hours ensure some real-time collaboration, while asynchronous tools ensure team members can contribute regardless of time zone.'
  },
  {
    id: 9, domain: 'People', difficulty: 'Easy',
    question: 'What does emotional intelligence primarily help a project manager do?',
    options: [
      'Create more accurate project schedules',
      'Understand and manage their own emotions and those of others',
      'Negotiate better contracts with vendors',
      'Track project costs more effectively'
    ],
    correct: 1,
    explanation: 'Emotional intelligence is the ability to recognize, understand, and manage emotions - both your own and those of others - leading to better team relationships.'
  },
  {
    id: 10, domain: 'People', difficulty: 'Medium',
    question: 'During project execution, a team member reveals they lack a critical skill needed for their role. What should the PM do?',
    options: [
      'Immediately replace the team member',
      'Arrange training or mentoring and reassign tasks as needed',
      'Escalate to senior management',
      'Ignore it and hope the team member figures it out'
    ],
    correct: 1,
    explanation: 'Proactively addressing skill gaps through training or reassignment protects project delivery while supporting team member development.'
  },
  {
    id: 11, domain: 'Process', difficulty: 'Easy',
    question: 'What is the purpose of a Work Breakdown Structure (WBS)?',
    options: [
      'Schedule all project activities',
      'Decompose the total scope into manageable components',
      'Identify project risks',
      'Allocate budget to team members'
    ],
    correct: 1,
    explanation: 'The WBS decomposes the total project scope into smaller, manageable work packages, providing a foundation for scheduling, costing, and risk management.'
  },
  {
    id: 12, domain: 'Process', difficulty: 'Medium',
    question: 'The project is behind schedule. The PM decides to do two tasks simultaneously that were originally sequential. This is called:',
    options: [
      'Crashing',
      'Fast tracking',
      'Resource leveling',
      'Schedule compression'
    ],
    correct: 1,
    explanation: 'Fast tracking involves performing activities in parallel that were originally planned to be done sequentially. It can increase risk but reduces schedule duration.'
  },
  {
    id: 13, domain: 'Process', difficulty: 'Hard',
    question: 'A project has a CPI of 0.85 and an SPI of 1.10. What does this indicate?',
    options: [
      'The project is ahead of schedule and under budget',
      'The project is ahead of schedule but over budget',
      'The project is behind schedule and under budget',
      'The project is behind schedule and over budget'
    ],
    correct: 1,
    explanation: 'SPI > 1.0 means ahead of schedule; CPI < 1.0 means over budget. The project is delivering work faster than planned but spending more than budgeted.'
  },
  {
    id: 14, domain: 'Process', difficulty: 'Medium',
    question: 'What is the critical path in project scheduling?',
    options: [
      'The path with the most high-risk activities',
      'The longest path through the network diagram that determines project duration',
      'The path with the highest resource requirements',
      'The path approved by the project sponsor'
    ],
    correct: 1,
    explanation: 'The critical path is the longest sequence of dependent activities, determining the minimum project duration. Any delay on the critical path delays the project.'
  },
  {
    id: 15, domain: 'Process', difficulty: 'Easy',
    question: 'Which document formally authorizes a project and identifies the project manager?',
    options: [
      'Project Management Plan',
      'Project Charter',
      'Scope Statement',
      'Business Case'
    ],
    correct: 1,
    explanation: 'The Project Charter formally authorizes the project to exist, identifies the project manager and their authority level, and is issued by the project sponsor.'
  },
  {
    id: 16, domain: 'Process', difficulty: 'Hard',
    question: 'A project scope change is requested after the project baseline is set. What is the CORRECT process?',
    options: [
      'Implement the change immediately to keep the stakeholder happy',
      'Reject all changes to protect the baseline',
      'Submit the change through the integrated change control process for evaluation',
      'Document the change and implement it at the next phase'
    ],
    correct: 2,
    explanation: 'All scope changes must go through integrated change control to assess impacts on schedule, cost, quality, and risk before approval or rejection.'
  },
  {
    id: 17, domain: 'Process', difficulty: 'Medium',
    question: 'What is the primary purpose of a risk register?',
    options: [
      'Document all project issues and problems',
      'Record identified risks, their analysis, and planned responses',
      'Track project change requests',
      'List all project assumptions'
    ],
    correct: 1,
    explanation: 'The risk register is a document that contains the results of risk identification, analysis, and response planning throughout the project.'
  },
  {
    id: 18, domain: 'Process', difficulty: 'Medium',
    question: 'During project execution, the PM notices actual costs are higher than planned. What should be done FIRST?',
    options: [
      'Immediately cut resources to reduce costs',
      'Investigate the root cause of the cost variance',
      'Request additional budget from the sponsor',
      'Update the cost baseline to reflect actual costs'
    ],
    correct: 1,
    explanation: 'Understanding why costs are higher than planned is essential before taking corrective action. Root cause analysis ensures the right solution is applied.'
  },
  {
    id: 19, domain: 'Process', difficulty: 'Easy',
    question: 'What does Earned Value (EV) represent?',
    options: [
      'The actual money spent on the project to date',
      'The value of work actually performed measured in planned budget terms',
      'The total project budget',
      'The estimated cost to complete remaining work'
    ],
    correct: 1,
    explanation: 'Earned Value is the budget for the work that has been completed. It measures what was accomplished in terms of the planned budget, enabling variance analysis.'
  },
  {
    id: 20, domain: 'Process', difficulty: 'Hard',
    question: 'A project is in execution and a previously identified risk has been realized. What should the PM do?',
    options: [
      'Update the risk register and move the risk to the issue log',
      'Ignore it since it was already identified',
      'Create a new project plan',
      'Escalate to the project board immediately'
    ],
    correct: 0,
    explanation: 'When a risk materializes, it becomes an issue. The risk register should be updated and the issue documented in the issue log for active management.'
  },
  {
    id: 21, domain: 'Process', difficulty: 'Medium',
    question: 'What is the main purpose of quality control in a project?',
    options: [
      'Ensure team members follow the project plan',
      'Monitor and record results of quality activities to assess performance',
      'Define quality standards for the project',
      'Train team members on quality processes'
    ],
    correct: 1,
    explanation: 'Quality control monitors specific project results to determine if they comply with quality standards and identifies ways to eliminate causes of unsatisfactory performance.'
  },
  {
    id: 22, domain: 'Process', difficulty: 'Hard',
    question: 'Crashing a project schedule typically results in:',
    options: [
      'Lower cost and shorter schedule',
      'Higher cost and shorter schedule',
      'Higher cost and longer schedule',
      'Lower cost and longer schedule'
    ],
    correct: 1,
    explanation: 'Crashing adds resources (usually at a premium cost) to critical path activities to reduce schedule duration. It always increases cost and may increase risk.'
  },
  {
    id: 23, domain: 'Process', difficulty: 'Medium',
    question: 'What is the purpose of a project kickoff meeting?',
    options: [
      'Finalize the project scope',
      'Mark the beginning of execution and align all stakeholders on project objectives',
      'Approve the project budget',
      'Assign work packages to team members'
    ],
    correct: 1,
    explanation: 'The kickoff meeting marks the official start of the project execution phase and aligns the team and stakeholders on goals, roles, and expectations.'
  },
  {
    id: 24, domain: 'Process', difficulty: 'Easy',
    question: 'What is a project milestone?',
    options: [
      'A task that takes more than one month to complete',
      'A significant point or event in a project with zero duration',
      'The midpoint of a project phase',
      'A budget checkpoint in the project'
    ],
    correct: 1,
    explanation: 'A milestone is a significant point or event in the project with zero duration. It marks the completion of a deliverable or a key project phase.'
  },
  {
    id: 25, domain: 'Process', difficulty: 'Hard',
    question: 'The project scope has not been adequately defined and continues to expand without control. This is known as:',
    options: [
      'Gold plating',
      'Scope creep',
      'Progressive elaboration',
      'Scope management'
    ],
    correct: 1,
    explanation: 'Scope creep refers to uncontrolled changes or continuous growth in project scope, typically without adjustments to time, cost, and resources.'
  },
  {
    id: 26, domain: 'Business Environment', difficulty: 'Easy',
    question: 'What is the purpose of a business case in project initiation?',
    options: [
      'Define the project schedule',
      'Justify the investment by documenting the need and expected benefits',
      'Assign the project manager',
      'List all project risks'
    ],
    correct: 1,
    explanation: 'A business case documents the reason for undertaking the project, the expected benefits, costs, risks, and options, helping decision-makers authorize the project.'
  },
  {
    id: 27, domain: 'Business Environment', difficulty: 'Medium',
    question: 'What does organizational agility primarily enable a company to do?',
    options: [
      'Reduce the number of projects in the portfolio',
      'Respond quickly to changes in the business environment',
      'Eliminate the need for project management',
      'Standardize all project management processes'
    ],
    correct: 1,
    explanation: 'Organizational agility is the capability to rapidly adapt to market changes in productive and cost-effective ways, enabling faster response to opportunities and threats.'
  },
  {
    id: 28, domain: 'Business Environment', difficulty: 'Hard',
    question: 'A project manager learns that a regulatory change will significantly impact the project. What should be done FIRST?',
    options: [
      'Stop the project immediately',
      'Assess the impact of the regulatory change on the project objectives',
      'Inform the team and proceed as planned',
      'Request a budget increase'
    ],
    correct: 1,
    explanation: 'Assessing the impact of the change allows the PM to understand the scope of the problem before determining appropriate actions and communicating to stakeholders.'
  },
  {
    id: 29, domain: 'Business Environment', difficulty: 'Medium',
    question: 'Benefits realization in project management refers to:',
    options: [
      'The financial profit generated during the project',
      'The process of ensuring a project delivers its intended value after completion',
      'The budget savings achieved during execution',
      'The team bonuses paid upon project completion'
    ],
    correct: 1,
    explanation: 'Benefits realization ensures that the intended outcomes and value from the project investment are actually achieved and measured after the project is delivered.'
  },
  {
    id: 30, domain: 'Business Environment', difficulty: 'Easy',
    question: 'What is a key characteristic of a project compared to ongoing operations?',
    options: [
      'Projects are repetitive and ongoing',
      'Projects are temporary endeavors with a defined beginning and end',
      'Projects have unlimited budgets',
      'Projects do not require stakeholder management'
    ],
    correct: 1,
    explanation: 'A project is a temporary endeavor undertaken to create a unique product, service, or result. Unlike operations, projects have a defined start and end date.'
  },
  {
    id: 31, domain: 'Business Environment', difficulty: 'Hard',
    question: 'An organization is considering transitioning from a predictive to a hybrid project management approach. What is the BEST reason for this?',
    options: [
      'To eliminate all project documentation',
      'To allow flexibility in areas of uncertainty while maintaining structure for well-defined deliverables',
      'To reduce the number of project managers needed',
      'To avoid stakeholder engagement'
    ],
    correct: 1,
    explanation: 'Hybrid approaches combine predictive and agile methods, providing structure for defined areas while allowing flexibility where requirements are uncertain or changing.'
  },
  {
    id: 32, domain: 'Business Environment', difficulty: 'Medium',
    question: 'What is the primary focus of portfolio management?',
    options: [
      'Managing individual project tasks',
      'Selecting and prioritizing projects that align with strategic objectives',
      'Training project managers',
      'Tracking project costs across the organization'
    ],
    correct: 1,
    explanation: 'Portfolio management involves selecting, prioritizing, and managing a collection of projects and programs to achieve strategic business objectives.'
  },
  {
    id: 33, domain: 'Business Environment', difficulty: 'Easy',
    question: 'What does VUCA stand for in the context of project management?',
    options: [
      'Value, Utility, Cost, Achievement',
      'Volatile, Uncertain, Complex, Ambiguous',
      'Vision, Understanding, Clarity, Agility',
      'Variable, Unified, Controlled, Adaptive'
    ],
    correct: 1,
    explanation: 'VUCA describes the volatile, uncertain, complex, and ambiguous business environment that modern projects operate in, requiring adaptive leadership.'
  },
  {
    id: 34, domain: 'Business Environment', difficulty: 'Hard',
    question: 'A company is experiencing significant organizational change during a project. What is the PM's BEST approach?',
    options: [
      'Pause the project until the change is complete',
      'Engage stakeholders proactively and adjust the project approach to accommodate the change',
      'Proceed with the original plan regardless of organizational changes',
      'Escalate to the PMO to handle the organizational change'
    ],
    correct: 1,
    explanation: 'Proactive stakeholder engagement and flexibility allow the project to remain relevant and aligned with the evolving organizational environment.'
  },
  {
    id: 35, domain: 'Business Environment', difficulty: 'Medium',
    question: 'Governance in project management primarily provides:',
    options: [
      'Detailed task assignments for team members',
      'A framework for decision-making, oversight, and accountability',
      'The technical standards for project deliverables',
      'The communication plan for the project'
    ],
    correct: 1,
    explanation: 'Project governance provides the framework and practices for directing and controlling projects, ensuring decisions are made with proper authority and accountability.'
  },
  {
    id: 36, domain: 'People', difficulty: 'Hard',
    question: 'A virtual team member in a different country raises concerns about cultural differences affecting collaboration. What should the PM do?',
    options: [
      'Tell the team member to adapt to the dominant team culture',
      'Acknowledge the differences and establish inclusive team norms',
      'Transfer the team member to a different project',
      'Ignore the concern as it is not project-related'
    ],
    correct: 1,
    explanation: 'Inclusive practices acknowledge and respect cultural differences, creating psychological safety and improving collaboration in diverse, global teams.'
  },
  {
    id: 37, domain: 'Process', difficulty: 'Medium',
    question: 'What is the purpose of lessons learned documentation?',
    options: [
      'To identify and punish team members who made mistakes',
      'To capture knowledge that can improve performance on future projects',
      'To document scope changes throughout the project',
      'To track individual performance metrics'
    ],
    correct: 1,
    explanation: 'Lessons learned capture positive and negative experiences to build organizational knowledge and improve processes and outcomes on future projects.'
  },
  {
    id: 38, domain: 'Business Environment', difficulty: 'Easy',
    question: 'Which of the following BEST describes a program?',
    options: [
      'A single large project with many tasks',
      'A group of related projects managed in a coordinated way to obtain benefits',
      'The organization's collection of all active projects',
      'A set of templates used across all projects'
    ],
    correct: 1,
    explanation: 'A program is a group of related projects, subsidiary programs, and activities managed in a coordinated manner to obtain benefits not available from managing them individually.'
  },
  {
    id: 39, domain: 'Process', difficulty: 'Hard',
    question: 'The PM finds that the project will not meet the originally agreed deadline. What should the PM do FIRST?',
    options: [
      'Immediately inform all stakeholders of the delay',
      'Analyze the situation to understand root causes and explore options before communicating',
      'Request a team overtime push to recover the schedule',
      'Close the project and restart with a new timeline'
    ],
    correct: 1,
    explanation: 'Before communicating a delay, the PM should understand why the delay occurred and what options exist (crashing, fast-tracking, scope reduction) to address it.'
  },
  {
    id: 40, domain: 'Business Environment', difficulty: 'Medium',
    question: 'What is the role of the project sponsor?',
    options: [
      'Manage day-to-day project tasks',
      'Provide resources, remove obstacles, and champion the project at the senior level',
      'Create the detailed project schedule',
      'Conduct quality inspections of deliverables'
    ],
    correct: 1,
    explanation: 'The project sponsor provides funding and resources, makes key decisions, removes organizational obstacles, and ensures the project aligns with business strategy.'
  }
]
