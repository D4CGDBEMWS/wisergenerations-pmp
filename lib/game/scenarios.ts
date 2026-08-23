import type { Scenario, LessonChoice } from './types'

// ---------------------------------------------------------------------------
// The day, as data.
//
// One project, one set of starting conditions, for every first-time player.
// Outcomes differ because decisions differ — which is the question the
// Virtual Workshop can then ask out loud: we all started with the same
// project, so how did we end up in different places?
//
// ── HOW THESE ARE WRITTEN ──────────────────────────────────────────────────
//
// Situations first, terminology afterwards. A player meets a stakeholder who
// keeps adding small things; they decide what to do; they see what it costs;
// and only then are they asked what project managers call it. Reversing that
// order would make this a quiz with a story painted on it.
//
// Several scenarios have more than one defensible answer with different
// costs. That is deliberate: a set of one obvious answer and three absurd ones
// teaches test-taking, and this is meant to teach judgement.
//
// ── ON THE PROJECT ─────────────────────────────────────────────────────────
//
// Deliberately ordinary and not a technology fantasy: a member-services portal
// replacement at a mid-sized organisation, hybrid, already underway, inherited
// mid-flight. The participant is given imperfect information on purpose. Part
// of the work is deciding what deserves attention.
// ---------------------------------------------------------------------------

/**
 * The dashboard the day opens on.
 *
 * Two of these lines are the weak signals. They are not marked, they are not
 * highlighted, and nothing tells the player which ones matter.
 */
export const PROJECT_BRIEF = {
  name: 'Member Services Portal — Phase 2',
  purpose:
    'Members currently phone in to update their own details. The portal lets them do it themselves, so the service team can spend its time on the calls that actually need a person.',
  value: 'Fewer routine calls. Faster updates for members. The same team covering more.',
  sponsor: 'Dana Whitfield, Director of Member Services',
  customerRep: 'Ray Okafor, Member Services team lead',
  milestone: 'Self-service profile update — demo to members in 9 days',
  team: '6 people. Two on leave Thursday.',
  budget: 'Spend is running slightly ahead of plan this iteration.',
  backlog: '14 items in the iteration backlog. 3 done, 2 in review, 1 blocked.',
  signals: [
    'The same defect has come back twice in profile validation.',
    'The compliance approver has not responded to last week’s request.',
    'Ray has missed the last two backlog refinements.',
  ],
} as const

export const SCENARIOS: readonly Scenario[] = [
  // ── 08:00 ────────────────────────────────────────────────────────────────
  {
    id: 'morning',
    time: '8:00 AM',
    title: 'Start the day',
    stage: 'why',
    situation: [
      'You inherited this project three weeks ago. The demo to members is in nine days.',
      'Your board is open, your inbox has forty-one unread messages, and everything on the dashboard is technically green.',
      'You have time to do one thing properly before the team meets at nine.',
    ],
    question: 'What deserves your attention first?',
    choices: [
      {
        id: 'inbox',
        label: 'Clear the inbox so nothing is missed',
        outcome:
          'Ninety minutes gone and you have read everything. Two of the forty-one messages mattered. You arrive at the team meeting having spent your best thinking time on other people’s filing.',
        focusCost: 3,
        health: { time: -3, people: -2 },
        wisdom: 0,
      },
      {
        id: 'signals',
        label: 'Look at what the dashboard is not saying',
        outcome:
          'You read past the green. A defect has come back twice in profile validation, the compliance approver has gone quiet, and Ray has missed two refinements. None of that is on the status report. You now know where to listen today.',
        focusCost: 2,
        health: { risk: 5, quality: 3 },
        wisdom: 10,
      },
      {
        id: 'plan',
        label: 'Rebuild the plan for the next nine days in detail',
        outcome:
          'You produce a careful hour-by-hour plan for nine days. By eleven, two of its assumptions are already wrong. Planning the distance in the detail of the near term is expensive and does not survive contact with the day.',
        focusCost: 3,
        health: { time: -2, value: -1 },
        wisdom: 2,
      },
      {
        id: 'ask',
        label: 'Ask the team what they are worried about',
        outcome:
          'You ask three people what is on their mind. You learn about the recurring defect within four minutes, and the team learn that you ask. It is not everything, but it cost you very little.',
        focusCost: 1,
        health: { people: 4, risk: 2 },
        wisdom: 8,
      },
    ],
  },

  // ── 09:00 ────────────────────────────────────────────────────────────────
  {
    id: 'standup',
    time: '9:00 AM',
    title: 'Lead the team',
    stage: 'start',
    situation: [
      'The team meet for fifteen minutes. Work is moving, mostly.',
      'Then Priya says it plainly: the member-consent change is finished, but she cannot ship it. It needs a compliance sign-off, and the approver has not replied since last Tuesday.',
      'She has asked twice. The room looks at you.',
    ],
    question: 'The team is blocked by someone outside the team. What do you do?',
    choices: [
      {
        id: 'document',
        label: 'Log it as a blocker and carry on with the meeting',
        outcome:
          'It is written down. It is still blocked. The board is now accurate about a problem that nobody is solving.',
        focusCost: 0,
        health: { time: -3, people: -3 },
        wisdom: 0,
        delayed: {
          firesAt: 'hybrid',
          text: 'The consent change is still waiting on compliance. Two other items now depend on it, and the demo build cannot include any of them.',
          health: { time: -6, value: -4, risk: -3 },
          favourable: false,
        },
      },
      {
        id: 'escalate',
        label: 'Escalate to the sponsor immediately',
        outcome:
          'Dana is surprised to be hearing about a five-day delay for the first time as an escalation. She will chase it. She also now wonders what else you are not handling.',
        focusCost: 2,
        health: { time: 2, people: -2, value: -1 },
        wisdom: 3,
      },
      {
        id: 'workaround',
        label: 'Tell the team to work around it and move on',
        outcome:
          'Priya starts something else. The consent change sits finished and unshipped, and the queue behind it grows quietly.',
        focusCost: 0,
        health: { time: -2, quality: -2 },
        wisdom: 1,
        delayed: {
          firesAt: 'hybrid',
          text: 'Three items are now finished-but-unshipped behind the consent approval. Work in progress has quietly doubled.',
          health: { time: -4, value: -3 },
          favourable: false,
        },
      },
      {
        id: 'unblock',
        label: 'Go and get the approver moving yourself',
        outcome:
          'You find out the approver has been out sick and nobody covered the queue. Twenty minutes and one phone call later there is a named deputy and a date. Priya ships tomorrow.',
        focusCost: 2,
        health: { people: 5, time: 4, risk: 2 },
        wisdom: 10,
        delayed: {
          firesAt: 'hybrid',
          text: 'The consent change shipped yesterday, so the two items behind it moved on schedule. Nobody mentions it. That is usually what a removed impediment looks like.',
          health: { time: 3, value: 2 },
          favourable: true,
        },
      },
    ],
    glossary: {
      prompt: 'What do project managers call the thing Priya was stuck behind?',
      options: ['Impediment', 'Milestone', 'Baseline', 'Resource leveling'],
      answer: 'Impediment',
      reveal:
        'Impediment — anything stopping the team from making progress. Removing it is the job; noticing it is only the start.',
    },
  },

  // ── 10:00 ────────────────────────────────────────────────────────────────
  {
    id: 'backlog',
    time: '10:00 AM',
    title: 'Work the backlog',
    stage: 'backlog',
    situation: [
      'A message from Marcus in Finance: "While you’re in there — could the portal also show members their payment history? Shouldn’t be much."',
      'It is the fourth "shouldn’t be much" this month. The previous three went straight into the sprint because they were small.',
      'The demo is in nine days.',
    ],
    question: 'What do you do with the request?',
    choices: [
      {
        id: 'absorb',
        label: 'Add it to this iteration — it is small',
        outcome:
          'The team absorb it. That is now four small things this month that nobody agreed to, sitting on top of the work that was actually committed.',
        focusCost: 1,
        health: { time: -4, value: -3, people: -2 },
        wisdom: 0,
        delayed: {
          firesAt: 'quality',
          text: 'The four small additions have taken about a third of the iteration between them. The committed work is behind, and no single decision caused it.',
          health: { time: -5, value: -3 },
          favourable: false,
        },
      },
      {
        id: 'refuse',
        label: 'Tell Marcus it is out of scope',
        outcome:
          'Technically correct, and Marcus stops telling you things. You may have just closed the channel that told you about the payments problem next month.',
        focusCost: 0,
        health: { people: -3, value: -1 },
        wisdom: 2,
      },
      {
        id: 'clarify',
        label: 'Ask Marcus what problem he is trying to solve',
        outcome:
          'It turns out members call Finance to ask what they paid. Marcus does not need payment history in the portal; he needs the calls to stop. There may be a much smaller answer, and it may not be this project’s.',
        focusCost: 1,
        health: { value: 5, people: 3 },
        wisdom: 10,
      },
      {
        id: 'backlog-it',
        label: 'Put it in the product backlog for the next refinement',
        outcome:
          'It is captured, visible, and not in this iteration. Ray can weigh it against everything else when the team next refine. Reasonable — though you still do not know what Marcus actually needs.',
        focusCost: 0,
        health: { value: 2, time: 2 },
        wisdom: 7,
      },
    ],
    glossary: {
      prompt: 'Three small undocumented additions had already gone in this month. What is that called?',
      options: ['Scope creep', 'Progressive elaboration', 'Resource leveling', 'Fast tracking'],
      answer: 'Scope creep',
      reveal:
        'Scope creep — work added without going through a decision. Not the same as progressive elaboration, where known work simply becomes clearer as you learn more.',
    },
  },

  // ── 11:00 ────────────────────────────────────────────────────────────────
  {
    id: 'stakeholders',
    time: '11:00 AM',
    title: 'Two people, both right',
    stage: 'need',
    situation: [
      'Dana wants the profile page to require a phone number. Members who cannot be reached are the source of most of her team’s rework.',
      'Ray wants it optional. He says a required field is exactly where members abandon the form, and an abandoned form means another phone call.',
      'Dana is the sponsor. Ray represents the people who will actually use it. They are in your calendar back to back, and both are right about something.',
    ],
    question: 'How do you handle it?',
    choices: [
      {
        id: 'sponsor-wins',
        label: 'Go with Dana — she is the sponsor',
        outcome:
          'Decided in four minutes. Ray stops arguing and stops offering. You have resolved a disagreement without learning what either of them actually needed.',
        focusCost: 0,
        health: { people: -4, value: -3 },
        wisdom: 1,
      },
      {
        id: 'user-wins',
        label: 'Go with Ray — he knows the members',
        outcome:
          'Also decided in four minutes, and also without asking why. Dana finds out from the demo, which is the worst possible moment for a sponsor to learn a decision was made without them.',
        focusCost: 0,
        health: { people: -2, value: -2, risk: -2 },
        wisdom: 1,
      },
      {
        id: 'facilitate',
        label: 'Get them in a room and find what is underneath both positions',
        outcome:
          'Twenty minutes. Dana needs to be able to reach members; Ray needs the form completed. Neither of those requires a mandatory field — an optional number with a clear reason for giving it satisfies both, and they design it together.',
        focusCost: 2,
        health: { people: 6, value: 5, quality: 2 },
        wisdom: 10,
      },
      {
        id: 'split',
        label: 'Split the difference — required for new members, optional for existing',
        outcome:
          'A compromise nobody asked for. It satisfies the positions rather than the needs, and now there are two behaviours to build, test and explain.',
        focusCost: 1,
        health: { quality: -3, value: -1 },
        wisdom: 3,
      },
    ],
    glossary: {
      prompt: 'Dana and Ray both have a legitimate interest in this project. What are they?',
      options: ['Stakeholders', 'Sponsors', 'Approvers', 'Dependencies'],
      answer: 'Stakeholders',
      reveal:
        'Stakeholder — anyone affected by the project or able to affect it. Dana is also the sponsor; the two are not the same thing.',
    },
  },

  // ── 12:00 ────────────────────────────────────────────────────────────────
  {
    id: 'signals',
    time: '12:00 PM',
    title: 'Something does not look right',
    stage: 'check',
    situation: [
      'The iteration report lands. Spend is eleven per cent above plan and the team completed less this iteration than the last two.',
      'You have a standing offer from Dana: if the project needs more budget, ask early rather than late.',
      'You do not yet know why the numbers moved.',
    ],
    question: 'What do you do about the numbers?',
    choices: [
      {
        id: 'ask-budget',
        label: 'Ask Dana for the additional budget now, while the offer is open',
        outcome:
          'You have asked for money to solve a problem you cannot describe. Dana asks what is driving it. You do not know, and that is the answer she remembers.',
        focusCost: 2,
        health: { resources: -2, value: -2 },
        wisdom: 0,
        delayed: {
          firesAt: 'sponsor',
          text: 'Dana opens with the budget request from this morning. She wants the cause, not the number, and you are still finding out.',
          health: { people: -3, value: -2 },
          favourable: false,
        },
      },
      {
        id: 'cut-quality',
        label: 'Reduce scope on testing to bring the numbers back',
        outcome:
          'The numbers will improve this iteration. You have not established whether testing is what is driving them.',
        focusCost: 1,
        health: { quality: -5, resources: 2, risk: -3 },
        wisdom: 0,
      },
      {
        id: 'analyse',
        label: 'Find out what is actually driving the variance first',
        outcome:
          'An hour with the numbers. Almost all of the overspend is rework on one thing: the profile validation defect that keeps coming back. It is not a budget problem wearing a disguise. It is a quality problem with a cost attached.',
        focusCost: 2,
        health: { resources: 4, quality: 3, risk: 4 },
        wisdom: 10,
      },
      {
        id: 'watch',
        label: 'Note it and watch it for one more iteration',
        outcome:
          'Defensible with one data point. This is the second iteration in a row, though, and you already know there is a defect coming back. You had reason to look.',
        focusCost: 0,
        health: { risk: -2 },
        wisdom: 3,
      },
    ],
    glossary: {
      prompt: 'The gap between planned spend and actual spend has a name. What is it?',
      options: ['Variance', 'Baseline', 'Trigger', 'Nonconformity'],
      answer: 'Variance',
      reveal:
        'Variance — the difference between what was planned and what happened. It tells you to look. It does not tell you why.',
    },
  },

  // ── 1:00 PM ──────────────────────────────────────────────────────────────
  {
    id: 'change',
    time: '1:00 PM',
    title: 'Change happens',
    stage: 'risk',
    situation: [
      'Dana calls. The regulator has clarified a rule: member consent has to be re-confirmed annually, and it has to be recorded.',
      'This is not a preference. It is not negotiable. It affects work already built and signed off.',
      'She asks what you want to do.',
    ],
    question: 'How do you respond?',
    choices: [
      {
        id: 'absorb-change',
        label: 'Say yes and get the team started on it now',
        outcome:
          'Willing, fast, and blind. Nobody yet knows what it touches, what it displaces, or whether the demo in nine days is still possible. You will find out in public.',
        focusCost: 2,
        health: { time: -4, risk: -5, quality: -2 },
        wisdom: 1,
      },
      {
        id: 'refuse-change',
        label: 'Say it is out of scope for this phase',
        outcome:
          'Scope is a decision the project makes. A regulator is not a stakeholder you negotiate scope with, and this one has already decided.',
        focusCost: 0,
        health: { risk: -6, value: -4 },
        wisdom: 0,
      },
      {
        id: 'assess',
        label: 'Assess the impact before committing to anything',
        outcome:
          'Half a day of work: it touches three built items, adds about five days, and one existing item becomes unnecessary. Now the conversation with Dana is about a real choice — the demo date or the demo contents — instead of a wish.',
        focusCost: 2,
        health: { risk: 5, value: 4, quality: 2 },
        wisdom: 10,
        opensPivot: true,
      },
      {
        id: 'defer-change',
        label: 'Log it for the next phase and keep this one clean',
        outcome:
          'Tidy, and it leaves this phase delivering something the regulator has just told you is not sufficient. Delivering the wrong thing on time is still delivering the wrong thing.',
        focusCost: 0,
        health: { value: -4, risk: -4 },
        wisdom: 1,
      },
    ],
    glossary: {
      prompt: 'Before agreeing to a change of this size, what should happen?',
      options: ['Impact assessment', 'Fast tracking', 'Resource leveling', 'Lessons learned'],
      answer: 'Impact assessment',
      reveal:
        'Impact assessment — working out what a change actually costs before you agree to it. Once approved, the plans and the people who depend on them have to be brought back into line.',
    },
  },

  // ── 2:00 PM ──────────────────────────────────────────────────────────────
  {
    id: 'hybrid',
    time: '2:00 PM',
    title: 'Two speeds, one project',
    stage: 'adjust',
    situation: [
      'The member-facing screens change every time somebody watches a real member use them. The team work in two-week iterations and expect to.',
      'The payments integration does not work that way. It has a fixed interface, a formal test window the bank controls, and a signed-off specification.',
      'Your programme office wants one plan, in one format, updated the same way. Both halves are on the same demo date.',
    ],
    question: 'How do you run a project with two different rhythms in it?',
    choices: [
      {
        id: 'all-agile',
        label: 'Put everything on the iteration cadence',
        outcome:
          'The bank’s test window does not care about your iteration boundary. You have given a predictable piece of work an unpredictable wrapper, and gained nothing.',
        focusCost: 1,
        health: { risk: -4, time: -3 },
        wisdom: 1,
      },
      {
        id: 'all-plan',
        label: 'Put everything on the plan-driven cadence',
        outcome:
          'The screens now change between formal baselines instead of between iterations — which is to say they still change, but later, more expensively, and out of sight.',
        focusCost: 1,
        health: { value: -4, quality: -2 },
        wisdom: 1,
      },
      {
        id: 'integrate',
        label: 'Let each part keep its own cadence, and integrate the view',
        outcome:
          'The screens stay on iterations, the integration stays on its fixed window, and you report one view: are we going to deliver the outcome, and what is in the way? The programme office gets an answer to their question rather than a format.',
        focusCost: 2,
        health: { value: 5, time: 3, risk: 3, people: 2 },
        wisdom: 10,
      },
      {
        id: 'two-reports',
        label: 'Report the two halves separately and let readers combine them',
        outcome:
          'Honest, and it hands your integration problem to whoever reads the report. They are the least equipped person to solve it.',
        focusCost: 1,
        health: { value: -2 },
        wisdom: 3,
      },
    ],
    glossary: {
      prompt: 'Running predictive and adaptive approaches together in one project is called what?',
      options: ['Hybrid', 'Fast tracking', 'Rolling-wave planning', 'Progressive elaboration'],
      answer: 'Hybrid',
      reveal:
        'Hybrid — choosing the approach that fits the work, not the habit. Uncertainty, rate of change and how clear the requirements are decide it; seniority and preference do not.',
    },
  },

  // ── 3:00 PM ──────────────────────────────────────────────────────────────
  {
    id: 'sponsor',
    time: '3:00 PM',
    title: 'The sponsor update',
    stage: 'adjust',
    situation: [
      'Twenty minutes with Dana. She has a board meeting on Thursday and a stage gate to decide: does this phase continue as planned?',
      'You have a fourteen-item backlog, a regulatory change, a recurring defect, an approval bottleneck and a demo in nine days.',
      'She has twenty minutes and one decision to make.',
    ],
    question: 'What do you bring her?',
    choices: [
      {
        id: 'everything',
        label: 'Walk her through the full backlog and the detail',
        outcome:
          'Thorough, and she leaves knowing everything except what she came to find out. Twenty minutes of information is not the same as one decision supported.',
        focusCost: 2,
        health: { people: -2, value: -1 },
        wisdom: 2,
      },
      {
        id: 'green',
        label: 'Keep it high level and positive — the detail is under control',
        outcome:
          'She approves the gate on a picture that is missing the regulatory change. You have made her decision easier and worse.',
        focusCost: 1,
        health: { risk: -5, people: -2 },
        wisdom: 0,
      },
      {
        id: 'decision-shaped',
        label: 'Bring the decision she has to make, and what it turns on',
        outcome:
          'The regulatory change means the demo can hold its date or its contents, not both. Here is what each costs, here is what you recommend, here is what you need from her. She decides in nine minutes and uses the rest to talk about the members.',
        focusCost: 2,
        health: { value: 5, people: 4, risk: 3 },
        wisdom: 10,
      },
      {
        id: 'ask-everything',
        label: 'Bring her the four open problems and ask how to handle them',
        outcome:
          'Three of the four were yours to resolve. Escalation is not free — used for ordinary work it spends the authority you will need for the one thing that genuinely requires her.',
        focusCost: 2,
        health: { people: -3, value: -2 },
        wisdom: 2,
      },
    ],
    glossary: {
      prompt: 'Dana’s Thursday decision — does this phase remain justified and ready to continue — is what?',
      options: ['Stage gate', 'Milestone', 'Baseline', 'Retrospective'],
      answer: 'Stage gate',
      reveal:
        'Stage gate — a governance decision point confirming the project is still worth continuing against agreed criteria. A milestone marks progress; a gate asks whether to go on.',
    },
  },

  // ── 3:45 PM ──────────────────────────────────────────────────────────────
  {
    id: 'ethics',
    time: '3:45 PM',
    title: 'Make it green',
    stage: 'adjust',
    situation: [
      'A message from a senior manager who is not your sponsor, an hour before the report goes out:',
      '"We’re nearly there and the board panics at amber. Can you just make tomorrow’s dashboard green? We’ll have it fixed by the time anyone asks."',
      'He is probably right that it will be fixed. He is asking you to report something that is not true today.',
    ],
    question: 'What goes in the report?',
    choices: [
      {
        id: 'lie',
        label: 'Report it green — it will be true by next week',
        outcome:
          'The board makes Thursday’s decision on a picture you knew was wrong. Whatever happens next, you are now the person who supplied it.',
        focusCost: 0,
        health: { risk: -8, people: -5, value: -4 },
        wisdom: 0,
      },
      {
        id: 'soften',
        label: 'Report amber but bury the detail where nobody will read it',
        outcome:
          'Technically true and designed not to be understood. Accuracy that is arranged to be missed is not accuracy.',
        focusCost: 1,
        health: { risk: -4, people: -2 },
        wisdom: 1,
      },
      {
        id: 'accurate',
        label: 'Report it accurately, and bring him the recovery plan',
        outcome:
          'Amber, with the cause, the recovery and the date. He is not pleased on the call and is noticeably relieved on Thursday, when the board asks the exact question your note had already answered.',
        focusCost: 1,
        health: { people: 5, risk: 5, value: 3 },
        wisdom: 10,
      },
      {
        id: 'delay',
        label: 'Delay the report until the fix lands',
        outcome:
          'The board meets on Thursday whether or not your report arrives. A late report is a decision made without you.',
        focusCost: 1,
        health: { risk: -3, value: -2 },
        wisdom: 1,
      },
    ],
  },

  // ── 4:00 PM ──────────────────────────────────────────────────────────────
  {
    id: 'seam',
    time: '4:00 PM',
    title: 'Everything is green',
    stage: 'done',
    situation: [
      'Ray forwards a message from a member who tried the new profile update during the pilot.',
      '"I changed my address on the website. Two weeks later my renewal went to the old one."',
      'You check. The portal team’s tests pass — the address is saved correctly, every time. The membership system team’s tests pass — it renews to the address it holds, every time. Both boards are green. Both teams are right.',
    ],
    question: 'Where do you look?',
    choices: [
      {
        id: 'blame-portal',
        label: 'Ask the portal team to find their bug',
        outcome:
          'They look, carefully, and find nothing — because there is nothing there. You have spent a day of a team’s time confirming what their tests already told you.',
        focusCost: 2,
        health: { people: -3, time: -3 },
        wisdom: 1,
      },
      {
        id: 'blame-members',
        label: 'Treat it as a one-off and ask the member to try again',
        outcome:
          'It is not a one-off. It is the first person to notice. Every address changed since the pilot began has the same problem, and now you have told one of them it was probably them.',
        focusCost: 0,
        health: { value: -6, quality: -5, people: -2 },
        wisdom: 0,
      },
      {
        id: 'end-to-end',
        label: 'Follow one real address change all the way through',
        outcome:
          'You trace one member’s change from the form to the renewal letter. The portal writes the new address. The membership system reads a nightly extract — and the extract was scoped to the fields Phase 1 used. Address is not in it. Nobody built it wrong. Nobody owned the join.',
        focusCost: 3,
        health: { quality: 6, value: 6, risk: 4 },
        wisdom: 10,
        opensPivot: true,
      },
      {
        id: 'add-check',
        label: 'Add a validation rule so the address cannot be wrong',
        outcome:
          'You have added a check to a system that was already correct. The address is still not reaching the renewal.',
        focusCost: 2,
        health: { quality: -2, time: -2 },
        wisdom: 1,
      },
    ],
    glossary: {
      prompt: 'The deliverable met its written specification and still failed the member. What does that distinction show?',
      options: [
        'Conformance is not the same as fitness for use',
        'The requirement was not baselined',
        'The team needed resource leveling',
        'The project needed fast tracking',
      ],
      answer: 'Conformance is not the same as fitness for use',
      reveal:
        'Conformance means it matches the specification. Fitness for use means it does what the customer actually needed. A deliverable can pass every test it was given and still be useless — which is why validation asks the customer, not the test suite.',
    },
  },

  // ── 4:30 PM ──────────────────────────────────────────────────────────────
  {
    id: 'quality',
    time: '4:30 PM',
    title: 'The review you do not have time for',
    stage: 'value',
    situation: [
      'The team are behind and they know it. Sam proposes skipping Thursday’s review on the profile validation work to make the demo date.',
      'It is a reasonable suggestion from someone who wants to deliver. It is also the third time this iteration that this particular piece of work has come back.',
    ],
    question: 'Do you skip the review?',
    choices: [
      {
        id: 'never-skip',
        label: 'No — quality reviews are never skipped',
        outcome:
          'A rule instead of a judgement. It happens to protect you here, and it will cost you the day it applies to something that genuinely did not need reviewing.',
        focusCost: 0,
        health: { quality: 2, people: -2, time: -2 },
        wisdom: 4,
      },
      {
        id: 'skip',
        label: 'Yes — the date matters more',
        outcome:
          'This is the piece of work that has come back twice already. You have removed the check from the one item with a demonstrated history of needing it.',
        focusCost: 0,
        health: { quality: -6, risk: -4, time: 2 },
        wisdom: 0,
        delayed: {
          firesAt: 'close',
          text: 'The profile validation defect resurfaced in the pilot build this afternoon. Third time. The review would have caught it.',
          health: { quality: -4, value: -3 },
          favourable: false,
        },
      },
      {
        id: 'assess-risk',
        label: 'Ask what we are risking, on this item specifically',
        outcome:
          'Five minutes. This item has failed twice, touches member data, and is in the demo. Two others in the same batch are cosmetic and have never failed. You review this one and let the other two go — the team make the date and the risk goes down.',
        focusCost: 1,
        health: { quality: 5, time: 3, people: 4, risk: 3 },
        wisdom: 10,
      },
      {
        id: 'overtime',
        label: 'Keep the review and ask the team to work late',
        outcome:
          'You have protected the process by spending the people. Two of them are on leave Thursday, and now they are tired as well.',
        focusCost: 1,
        health: { people: -5, quality: 2 },
        wisdom: 2,
      },
    ],
    glossary: {
      prompt: 'The same defect has now come back three times. What technique helps you find why?',
      options: [
        'Cause-and-effect analysis',
        'Fast tracking',
        'Rolling-wave planning',
        'Resource leveling',
      ],
      answer: 'Cause-and-effect analysis',
      reveal:
        'Cause-and-effect analysis — sometimes drawn as a fishbone. Pair it with Pareto: a small number of causes usually produce most of the trouble. Fixing the symptom three times is more expensive than finding the cause once.',
    },
  },

  // ── 5:00 PM ──────────────────────────────────────────────────────────────
  {
    id: 'close',
    time: '5:00 PM',
    title: 'Close the day',
    stage: 'close',
    situation: [
      'The office empties. Nine days to the demo, and the project is not finished — projects rarely are at five o’clock.',
      'What today produced is not just work done. It produced information you did not have this morning: what the variance was really about, where the join was missing, what Marcus actually needed.',
      'Tomorrow is clearer than it was, because of today.',
    ],
    question: 'What is tomorrow’s first priority?',
    choices: [
      {
        id: 'fix-seam',
        label: 'The missing join between the portal and the renewal',
        outcome:
          'It is the one thing failing a promise you have already made to members. Everything else is a project problem; this one is a member holding a letter with the wrong address on it.',
        focusCost: 0,
        health: { value: 4, quality: 3 },
        wisdom: 10,
      },
      {
        id: 'catch-up',
        label: 'Catch the schedule back up',
        outcome:
          'Understandable with nine days left. Going faster does not help if part of what you are shipping does not reach the member — check the direction before you press the gas.',
        focusCost: 0,
        health: { time: 2, value: -2 },
        wisdom: 3,
      },
      {
        id: 'plan-detail',
        label: 'Plan the remaining nine days in full detail',
        outcome:
          'Detail the next few days; leave the rest at the level you can actually know. Today is proof of why — this morning’s nine-day plan would already be wrong twice over.',
        focusCost: 0,
        health: { time: -1 },
        wisdom: 4,
      },
      {
        id: 'demo-prep',
        label: 'Prepare the demo',
        outcome:
          'The demo will need preparing. It matters less than whether the thing being demonstrated does what it promised.',
        focusCost: 0,
        health: { value: -1 },
        wisdom: 3,
      },
    ],
    glossary: {
      prompt: 'Detailing near-term work while leaving distant work at a higher level is called what?',
      options: [
        'Rolling-wave planning',
        'Fast tracking',
        'Change control',
        'Resource leveling',
      ],
      answer: 'Rolling-wave planning',
      reveal:
        'Rolling-wave planning — plan the near term in detail and the distance in outline, then fill it in as you learn. Planning does not stop when the work starts.',
    },
  },
]

/**
 * The end-of-day reflection.
 *
 * Closed choices only. Version 1 deliberately collects no free text: an
 * unrestricted box invites exactly the kind of personal narrative the
 * participant-data work is currently holding, and a game does not need it.
 */
export const LESSON_CHOICES: readonly LessonChoice[] = [
  { id: 'clarify', label: 'Ask a clarifying question sooner.' },
  { id: 'protect', label: 'Protect team focus more carefully.' },
  { id: 'risk', label: 'Address risk earlier.' },
  { id: 'communicate', label: 'Communicate a change sooner.' },
  { id: 'value', label: 'Check customer value before adding work.' },
  { id: 'delegate', label: 'Delegate instead of personally solving everything.' },
  { id: 'same', label: 'I would make the same decision again.' },
]
