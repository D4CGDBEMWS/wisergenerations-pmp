# LIAP First-Admin Bootstrap — proposed procedure

**Status: DOCUMENTATION ONLY. Not executed. No admin exists.**

Owner review required before this is performed.

---

## The problem this solves

`lib/liap/facilitation.ts` deliberately contains no code path that creates an
admin. `'admin'` appears only in `SELECT` statements; no `INSERT` in the module
can write it, and no function takes an `authority` parameter. That is what makes
"a Trainer cannot promote themselves to Owner/Admin" true by construction rather
than by a check somebody could remove.

The cost of that guarantee is a chicken-and-egg: **every authority in the system
is granted by an admin, and the application cannot mint the first one.**

That is the correct trade. An application that can create its own first admin
has, by definition, a code path that grants ultimate authority — and that path
is the first thing an attacker looks for.

## What is deliberately NOT proposed

| Rejected | Why |
|---|---|
| An admin-registration endpoint | A public path to ultimate authority, however guarded |
| A bootstrap secret in an env var | A permanent credential that grants admin forever; leaks with the environment |
| "First user becomes admin" | A race: whoever signs up first wins |
| A CLI command in the repo | Ships the capability to every clone and every CI runner |
| A seed row in migration 0008 | Would create an admin on every environment the migration touches, including previews |

Each of these re-introduces exactly what the design removed.

## The proposed procedure

**Preconditions — all required:**

1. The Pre-Launch Database Gate has been intentionally opened by the owner.
2. Migrations 0005, 0006, 0007 and 0008 have been reviewed as a set and applied.
3. The person to become admin already exists in `customers` (they have signed in
   at least once, so the row is real and the email is confirmed).

**Step 1 — identify the customer.** Read-only.

```sql
SELECT id, email, created_at FROM customers WHERE lower(email) = lower('<owner email>');
```

Copy the `id`. If no row returns, stop: the person must sign in first. Do not
create a customer row by hand.

**Step 2 — confirm no admin already exists.** Read-only.

```sql
SELECT customer_id, granted_at FROM liap_authorities
 WHERE authority = 'admin' AND revoked_at IS NULL;
```

Expect zero rows. If any row returns, an admin already exists — stop and use the
ordinary authority flow instead of bootstrapping a second one.

**Step 3 — insert the grant.** The only write, performed by the owner directly
against the database, in a session the application does not have.

```sql
INSERT INTO liap_authorities (customer_id, authority, granted_by, granted_at)
VALUES ('<customer id from step 1>', 'admin', NULL, now());
```

`granted_by` is `NULL` and that is meaningful: it is the signature of a
bootstrap. Every subsequent authority row names the admin who granted it, so a
`NULL` granter marks the one grant that came from outside the system. There
should never be more than one.

**Step 4 — record it in the audit trail.** Not automatic, because the
application did not perform the action.

```sql
INSERT INTO audit_events (event_type, customer_id, actor, metadata)
VALUES ('liap.trainer_authority_granted', '<customer id>', 'bootstrap',
        '{"result":"admin_bootstrap"}'::jsonb);
```

**Step 5 — verify, then stop.**

```sql
SELECT count(*) FROM liap_authorities WHERE authority = 'admin' AND revoked_at IS NULL;
```

Expect exactly `1`. Everything after this point — trainers, certifications,
assignments — goes through the ordinary application flow with that admin as the
actor.

## Properties this procedure has

- **Outside ordinary authority flows.** No endpoint, no session, no request.
- **Deliberate owner action.** Someone with database credentials must decide to
  do it and type it.
- **Auditable.** The `NULL` granter is a permanent, queryable marker, and step 4
  puts it in the audit trail alongside every later authority change.
- **No permanent secret.** Nothing is left behind that could be used again.
- **Gated.** It cannot be performed at all until the Pre-Launch Database Gate is
  open, because the tables do not exist until 0008 is applied.

## Revocation

An admin grant is revoked the same way as any other — by setting `revoked_at`,
not by deleting the row. The history of who held ultimate authority, and when,
is not something to erase.

If the bootstrap admin must be replaced, grant the new admin through the
application first (as an existing admin), then revoke the old one. Bootstrapping
a second time should never be necessary and would produce a second `NULL`
granter, which is the signal that something went wrong.
