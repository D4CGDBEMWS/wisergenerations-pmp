# LIAP registration card

**Card copy: OWNER APPROVED, 4 September 2026.**
**Card production: HOLD — do not print.**

The customer-facing wording below is the owner's approved copy and is
reproduced verbatim. It is not to be edited without a further owner decision.

Production remains on hold. The card must not go to a printer, and no
production codes may be generated, until the non-production end-to-end reader
journey has been validated: code/card → registration → entitlement → first
Assessment → Reassessment → third attempt refused.

The two statements printed **in the book** are locked owner copy held
separately and are not restated here, to avoid a second, divergent home for
them.

---

## Card face — OWNER-APPROVED COPY, verbatim

> ### LIVING IS A PROJECT ASSESSMENT
>
> Your new book includes access to the Living Is a Project Assessment.
>
> This unique access code may be registered to one reader and provides your
> first Assessment and Reassessment.
>
> **Unique Access Code:**
> `LIAP-XXXX-XXXX-XXXX-XXXX`
>
> **Register your book at:**
> wisergenerations.com/liap/book
>
> [QR CODE]

---

## Registration destination

Both the QR code and the printed URL point at:

    https://www.wisergenerations.com/liap/book

That route and no other. Three properties make it the right one, and each of
them is a constraint on anything that might replace it later:

1. **It is outside the LIAP feature-flagged tree.** Every page under
   `/living-is-a-project` returns 404 while `FEATURE_LIAP` is off. A printed
   card cannot be recalled, so its destination must never be able to 404 at a
   reader holding the book. `/liap/book` carries its own flag
   (`LIAP_BOOK_ACTIVATION`) and soft-lands rather than 404s.
2. **It asks for the code directly.** Since D2 the route renders the
   registration form, not the chooser. A gift recipient is not a buyer and
   should not have to classify their purchase before they can register.
3. **It survived a rename already.** The product tree moved from
   `/life-is-a-project` to `/living-is-a-project` in August 2026 and the
   `/liap` prefix was untouched, because it never lived inside the product
   tree. That is evidence rather than theory about which prefix belongs on
   paper.

`/living-is-a-project/register-book` renders the same component for readers
who arrive from inside the site. **It is not the printed destination** — it is
inside the flagged tree.

## QR code

Not generated here. Whatever generates it must encode the URL above exactly,
with no tracking parameters: a query string on a printed card is a promise to
keep that parameter working for the life of the edition.

## Code format, for the printer

- Fixed pattern `LIAP-XXXX-XXXX-XXXX-XXXX` — 4 groups of 4 after the prefix.
- Alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ` — Crockford Base32. **I, L, O
  and U never appear.** A proof that shows any of them is not one of our
  codes.
- Set it in a face where `8`/`B` and `5`/`S` are clearly distinct. The
  alphabet has already removed the worst pairs; the typeface has to not
  reintroduce them.
- The site accepts any case, and ignores spaces and dashes, so the card may be
  set in whatever way reads best.

## Producing a batch

**Not before the non-production journey passes.** No production codes
may be generated while the card is on production hold.

    DATABASE_URL=... node scripts/liap-generate-book-codes.mjs \
      --batch first-print --count 5000 --out first-print.csv

The CSV is written mode 600 and holds `code_id,code`. **It is the only copy of
the usable codes that will ever exist** — the database stores SHA-256 hashes
and cannot give the plaintext back. Hand the file to the printer over a
channel appropriate to that fact, and delete it once the cards are printed.

The script refuses to run without `--out` (or an explicit
`--print-to-terminal`), because codes minted with nowhere to put them are
inventory that can never be claimed.

## Damaged or unreadable cards

    DATABASE_URL=... node scripts/liap-book-code-admin.mjs --status LIAP-...
    DATABASE_URL=... node scripts/liap-book-code-admin.mjs --replace <id> --reason "..."

`--replace` voids the unclaimed original, issues a fresh code and prints it
once. Every operation writes an audit row naming the operator. There is no
self-service path for any of this, deliberately: a claimed registration is not
ordinarily transferable.
