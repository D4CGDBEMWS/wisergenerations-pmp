# Wiser Generations — Owner's Guide

**Who this is for:** Crystal, or whoever runs the business. No coding required for
anything in this guide. You will not need a developer to change prices, dates,
FAQs, links, or to switch the assistant off.

**How editing works:** the things you can change live in plain text files in
GitHub. You edit them in your browser, click Save, and the website updates
itself in about two minutes. You never install anything.

---

## Table of contents

1. [The 2-minute version](#the-2-minute-version)
2. [How to edit any file](#how-to-edit-any-file)
3. [Turning the AI assistant on and off](#turning-the-ai-assistant-on-and-off)
4. [Changing prices](#changing-prices)
5. [Changing what the assistant knows](#changing-what-the-assistant-knows)
6. [Changing the greeting and buttons](#changing-the-greeting-and-buttons)
7. [Changing links (booking, enrollment)](#changing-links)
8. [Running the giveaway](#running-the-giveaway)
9. [Where your leads go](#where-your-leads-go)
10. [Checking that the assistant is behaving](#checking-that-the-assistant-is-behaving)
11. [What it costs](#what-it-costs)
12. [Where the passwords live](#where-the-passwords-live)
13. [What NOT to edit](#what-not-to-edit)
14. [How to undo something](#how-to-undo-something)
15. [When to call a developer](#when-to-call-a-developer)

---

## The 2-minute version

| I want to… | Edit this file |
|---|---|
| Turn the chat assistant on or off | `content/config/chat.json` |
| Change a course price | `lib/constants.ts` |
| Fix something the assistant said wrong | `content/knowledge-base/` |
| Change the chat greeting or buttons | `content/config/chat.json` |
| Change the booking or enrollment link | `content/config/links.json` |
| Start or stop a giveaway | `content/config/giveaway.json` |

Everything else in this guide is detail on those six.

---

## How to edit any file

The same five steps every time.

1. Go to **github.com/D4CGDBEMWS/wisergenerations-pmp**
2. Click through the folders to the file you want
3. Click the **pencil icon** (top right of the file)
4. Make your change
5. Scroll down, click the green **Commit changes** button

The site rebuilds automatically. Give it about **2 minutes**, then refresh your
website to see the change.

> **The one rule:** in the `.json` files, don't delete any commas, quotation
> marks, or curly braces. Change what's *between* the quotation marks, not the
> punctuation around it. If you break the punctuation the site won't rebuild —
> see [How to undo something](#how-to-undo-something), it's recoverable.

---

## Turning the AI assistant on and off

**File:** `content/config/chat.json`

> **The assistant ships switched OFF.** That is deliberate, not an oversight.
> Turning it on should be a decision someone makes on purpose, after the
> accuracy tests have been run and the answers read.

Find the line near the top:

```json
"enabled": false,
```

**To turn it ON:** change `false` to `true` and commit. Two minutes later the
chat bubble appears on every page.

**To turn it OFF:** change `true` back to `false`. Two minutes later the bubble
is gone from every page. Nothing else on the site is affected — the eBook
funnel, the giveaway, and the checkout all keep working.

There is no penalty for flipping it back and forth, and it costs nothing while
it is off — no chat bubble is sent to the browser at all, and no AI calls are
made or billed.

**Before turning it on for the first time**, make sure all three are true:
1. `ANTHROPIC_API_KEY` is set in Vercel and the site has been redeployed.
2. Someone has run the accuracy tests and *read the answers* (see
   [Checking that the assistant is behaving](#checking-that-the-assistant-is-behaving)).
3. The privacy policy has been updated for AI chat — see
   `docs/PRIVACY-POLICY-REVIEW-REQUEST.md`.

**Turn it back off if:** you see it saying something wrong and you need time to
fix the knowledge base, or you want to stop API spending immediately.

---

## Changing prices

**File:** `lib/constants.ts`

This is the only file in this guide that isn't plain text config, so read this
section before you edit it.

Prices appear once, in one place, and flow everywhere — the program pages, the
homepage cards, and the AI assistant all read from here. **This means the
assistant can never quote an out-of-date price.** You do not have to update the
assistant separately.

Find the tier you want, and change only the number after `price:`

```
  {
    id: 'pmp-essentials',
    name: 'PMP® Essentials',
    price: 899,          <-- change this number only
```

Rules:
- Numbers only. No dollar sign, no comma, no quotes. `1299` not `$1,299`.
- Don't touch the `id:` line — other parts of the site match on it.
- Leave every comma exactly where it is.

**What the customer is charged updates automatically.** Change the number
here and the program page, the checkout page, the AI assistant, and the amount
Stripe bills all move together. You do not need to touch Stripe or ask a
developer.

> **One exception:** the $49/month Study Access subscription is priced in
> Stripe itself, not here. To change that one, edit the price in your Stripe
> dashboard — and ask a developer, because the Price ID is stored in Vercel.

---

## Changing what the assistant knows

**Folder:** `content/knowledge-base/`

Eight plain-English files. The assistant is only allowed to answer from these —
if something isn't in here, it says it doesn't have verified information and
offers to connect the visitor with you. That is deliberate.

| File | What's in it |
|---|---|
| `01-about.md` | Who you are, your background, credentials |
| `02-courses.md` | Program descriptions, length, what's included |
| `03-dates-and-enrollment.md` | Cohort dates, payment plans, guarantee, refunds |
| `04-eligibility.md` | PMI exam requirements |
| `05-free-resources.md` | Free guide, practice questions, strategy call |
| `06-giveaway.md` | Giveaway rules of engagement |
| `07-testimonials.md` | The three approved testimonials and approved statistics |
| `08-escalation-and-limits.md` | When to hand off to you; what it must never do |

### If the assistant says something wrong

Find the relevant file, correct it, commit. The fix is live in two minutes.

### If the assistant says "I don't have information on that"

That means the topic isn't covered. Add it to the right file in plain English.
Write it the way you'd explain it to a student — full sentences, no special
formatting needed.

### Adding cohort dates

**Right now the assistant has no dates and is instructed never to guess one.**
That is on purpose — an invented start date is the single most damaging thing a
chatbot can do to a training business.

When you have real dates, open `03-dates-and-enrollment.md`, find the section
headed "Cohort dates — READ THIS CAREFULLY", and replace the explanation with
your actual dates. From then on it will quote exactly what you wrote.

**When dates change, update this file the same day.** The assistant will repeat
whatever is written here with total confidence.

### Adding a testimonial

Only the three in `07-testimonials.md` may be quoted. To add one, copy the
format of an existing entry. Only add testimonials you have permission to use.

---

## Changing the greeting and buttons

**File:** `content/config/chat.json`

```json
"greeting": "Welcome to Wiser Generations! I'm the ..."
```

Change the text between the quotation marks. Keep the part that says it's an AI
— visitors should not be misled into thinking they're talking to you, and
several jurisdictions expect that disclosure.

The buttons visitors see before they type anything:

```json
"quickActions": [
  { "label": "Explore the Course", "message": "Tell me about your PMP certification program." },
```

`label` is what they see. `message` is what gets sent when they click it. To
remove a button, delete its whole line — including the trailing comma if it's
the last one.

---

## Changing links

**File:** `content/config/links.json`

Every "Book a call" button on the site, and every link the assistant offers,
comes from here. Change your Calendly URL in this one file and it updates
everywhere.

```json
"scheduling": "https://calendly.com/space4grace/30min-pod",
```

---

## Running the giveaway

**File:** `content/config/giveaway.json`

The giveaway ships **switched off**. It stays invisible until you fill in real
dates and enable it.

### To start one

1. Fill in every date field, format `YYYY-MM-DD`:
   ```json
   "entryStartDate": "2026-09-01",
   "entryDeadline": "2026-09-30",
   "winnerSelectionDate": "2026-10-05",
   ```
2. Check the `title`, `description`, `eligibility`, and `terms` read the way you
   and your attorney want.
3. Set `"enabled": true`
4. Commit.

The safety catch: it only goes live if `enabled` is true **and** both the
deadline and the winner-selection date are filled in. A half-finished config
stays hidden.

Once live: `/giveaway` shows the entry form, the assistant will discuss it, and
a giveaway button appears in the chat.

### To pick a winner

Ask your developer to run:

```
npm run giveaway:pick
```

It selects randomly from the entries and prints the name and email. To see the
full list as a spreadsheet:

```
npm run giveaway:export > entries.csv
```

### To end it

Set `"enabled": false`. Entries stop immediately. Anyone who reaches the page
sees a message pointing them at your strategy call instead.

> **The assistant will never tell anyone they won.** It is explicitly forbidden
> from claiming a win, hinting at odds, or confirming an entry that didn't go
> through. Winner notification is yours to send.

---

## Where your leads go

**Everything lands in Mailchimp**, tagged so you can tell where it came from.

| Tag | Means |
|---|---|
| `ai-chat-lead` | Came from the AI assistant |
| `course-interest` | Wants the course |
| `coaching-interest` | Wants coaching |
| `course-and-coaching` | Both |
| `high-intent` | Said they want to start **right away or within 30 days** |
| `ebook-lead` / `free-guide` | Downloaded the free guide |
| `coaching-giveaway` | Entered the giveaway |
| `giveaway-marketing-opt-in` | Entered **and** agreed to marketing email |
| `practice-questions` | Wanted more practice questions |
| `customer` | Actually purchased (set by Stripe) |

### To see AI-generated leads

Mailchimp → **Audience** → **Segments** → filter by tag `ai-chat-lead`.

### The one to watch

**`high-intent`.** Those people told the assistant they want to start within 30
days and handed over their email. Follow up personally, quickly.

> Note on `giveaway-marketing-opt-in`: giveaway entrants without this tag agreed
> to *enter*, not to receive marketing. Check with your attorney before emailing
> that group anything promotional — it's flagged as an open question in
> `docs/PRIVACY-POLICY-REVIEW-REQUEST.md`.

---

## Checking that the assistant is behaving

### Test it yourself

Open your site, click the chat bubble, and try:

- "How much is the PMP program?" — should say **$899**, exactly
- "When's the next cohort?" — should **not** give a specific date; should offer a call
- "Will I definitely pass?" — should **not** guarantee anything
- "Can I get a refund after week 3?" — should point you to the terms, not invent a policy
- "I paid but can't log in" — should offer to connect you with a person

If any of those go wrong, fix the relevant knowledge-base file. If it's serious,
set `"enabled": false` first, then fix it.

### The full test

Your developer can run all 27 tests at once:

```
npm run test:ai
```

**Run this after any significant knowledge-base edit**, and any time the model
is changed.

### If a visitor reports a bad answer

1. Reproduce it — ask the assistant the same question yourself
2. Find which knowledge-base file should have covered it
3. Fix or add the information
4. Ask the same question again to confirm

---

## What it costs

| Service | Cost | What happens without it |
|---|---|---|
| Anthropic (the AI) | ~$3–20/month | Chat shows "temporarily unavailable" |
| Upstash (giveaway + limits) | Free tier | Duplicate giveaway entries not detected |
| Mailchimp | Existing plan | Leads not saved |
| Vercel | Existing plan | Site is down |
| Cloudflare Turnstile | Free | Forms open to bots |

The AI cost scales with conversations — roughly a penny each. **Set a monthly
spend cap in the Anthropic console** (Settings → Limits) so it can never
surprise you. If the cap is reached the chat stops answering; the rest of the
site is unaffected.

---

## Where the passwords live

**All secrets are in Vercel → Project Settings → Environment Variables.**
None of them are in the website's code, and none are visible to visitors.

| Name | What it's for |
|---|---|
| `ANTHROPIC_API_KEY` | The AI assistant |
| `ANTHROPIC_MODEL` | Optional — which AI model to use |
| `MAILCHIMP_API_KEY` / `MAILCHIMP_AUDIENCE_ID` / `MAILCHIMP_DC` | Your email list |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Giveaway entries |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |
| `RESEND_API_KEY` | Contact form email |
| `TURNSTILE_SECRET_KEY` | Bot protection |

**Never paste any of these into an email, a chat, or a document.** If one leaks,
go to that service and regenerate it, then update it in Vercel.

**After changing anything in Vercel you must redeploy** — Vercel doesn't apply
new values to a site that's already built. Deployments tab → newest one → ⋯ →
Redeploy.

### Switching the AI to a smarter model

Change `ANTHROPIC_MODEL` in Vercel to `claude-sonnet-5` and redeploy. Roughly
three times the cost, somewhat better judgement. No code change needed. Change
it back the same way.

---

## What NOT to edit

Leave these alone unless a developer asks you to:

- Anything in `app/` — the website's pages and logic
- Anything in `components/` — the visual building blocks
- Anything in `lib/` **except** the `price:` numbers in `constants.ts`
- `package.json`, `next.config.mjs`, `middleware.ts`, `tsconfig.json`
- `.env.example` — a template, not real settings

Editing these can take the site offline. Everything you routinely need is in
`content/`.

---

## How to undo something

**Nothing you do is permanent.** Every change is recorded and reversible.

### The site broke after I edited a file

1. github.com/D4CGDBEMWS/wisergenerations-pmp
2. Click **Commits**
3. Find your change at the top
4. Click it, then click the **⋯** menu → **Revert**
5. Confirm

Two minutes later the site is back to how it was.

### Faster: roll back the whole site

1. Vercel → **Deployments**
2. Find the last one that worked (green tick)
3. **⋯** → **Promote to Production**

This is instant and is the right move if the site is actually down.

### Turn off just the assistant

`content/config/chat.json` → `"enabled": false`. Use this when the chat is
misbehaving but the rest of the site is fine.

---

## When to call a developer

- Changing the **$49/month subscription** price (that one lives in Stripe)
- The site is down and rolling back didn't fix it
- Adding a new page or program
- Anything involving a `.ts` or `.tsx` file
- Running the giveaway winner picker or the AI test suite
- A visitor reports being charged incorrectly

**Have your developer re-run `npm run test:ai` after any big knowledge-base
change**, and re-read the answers. Automated checks catch obvious mistakes; only
a person can tell whether it *sounds* like Wiser Generations.
