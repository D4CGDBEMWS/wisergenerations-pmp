import type { StaffRole } from '@/lib/staff/session'

// ---------------------------------------------------------------------------
// What each role may do.
//
// Permissions rather than role checks scattered through the code. A route
// asks "may this session approve a registration?", never "is this person the
// owner?" — so adding a role later is one entry in this table rather than a
// hunt for every `role === 'owner'` in the codebase.
//
// Deliberately explicit rather than hierarchical. A tempting shortcut is
// "owner inherits everything event staff can do", and it is how somebody ends
// up with a permission nobody meant to give them. Every capability is listed
// against every role that has it.
// ---------------------------------------------------------------------------

export const PERMISSIONS = [
  /** See the admin area at all. */
  'admin.view',
  /** Read retreat, group and sponsor enquiries. */
  'leads.read',
  /** Move an enquiry between statuses — the human judgment II-C depends on. */
  'leads.decide',
  /** Read the partner league table and campaign reporting. */
  'reports.read',
  /** Create and edit partners, issue referral codes. */
  'partners.manage',
  /** Set campaign targets. Reporting only; goals never gate anything. */
  'goals.manage',
  /** Record an in-kind contribution and the value approved for it. */
  'inkind.record',
  /** Invite, suspend and change the role of other staff. */
  'staff.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  owner: [
    'admin.view',
    'leads.read',
    'leads.decide',
    'reports.read',
    'partners.manage',
    'goals.manage',
    'inkind.record',
    'staff.manage',
  ],

  // Can run the day-to-day: review enquiries, decide on them, manage the
  // partner network. Cannot set financial targets, record approved in-kind
  // values, or change who has access — those stay with the owner because they
  // are the ones with money or privilege attached.
  event_staff: ['admin.view', 'leads.read', 'leads.decide', 'reports.read', 'partners.manage'],

  // Sees the numbers, touches nothing. For an accountant or an advisor who
  // needs the reporting without the ability to act.
  read_only: ['admin.view', 'leads.read', 'reports.read'],
}

/** Whether a role carries a permission. Unknown roles carry nothing. */
export function roleCan(role: StaffRole | string, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[role as StaffRole]
  return granted ? granted.includes(permission) : false
}

/** Every permission a role has. For rendering a UI that hides what it cannot do. */
export function permissionsFor(role: StaffRole | string): readonly Permission[] {
  return ROLE_PERMISSIONS[role as StaffRole] ?? []
}
