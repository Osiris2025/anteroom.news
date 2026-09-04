# Anteroom Editorial Guide (Admin)

> How to run the site day-to-day as an admin. UI behaviors as of 2026-09-04.
> Ops/infra: [[RUNBOOK]]. Source rules: [[Source-Quality-Policy]].

## Sign-in
You are an admin by role (`admin`/`superadmin` in the `user` table). Admin UI
appears automatically when signed in — hover tools on cards, Admin link in navbar.

## The Dispatch Desk (`/admin`)
The review queue. Default shows the newest 200 rows; use the **Magazine** and
**Status** dropdowns + search box to scope.

### Bulk actions (server-side)
- **✓ Approve All (n)** — drafts → approved in the current scope
- **📤 Publish All Approved (n)** — approved → live in the current scope
- Scope = your current Magazine + Status + search. "All magazines + All status"
  genuinely means everything. A confirm dialog always shows the exact count
  ("Publish 3,446 articles in ALL magazines?") before one SQL runs.
- Buttons show **true DB counts** for the scope, not just the 200 loaded rows.
- Tip: test on a small magazine first (The Green Room has 5 articles).

### Per-article actions
Each queue row: approve / publish / reject / back-to-draft / delete (asks a
reason — reasons feed the source strike stats) / move magazine / set subcategory /
generate or regenerate AI commentary / feature (star) / pin (FLASH).

### Queue fields worth noticing
- **Warnings / flagged** — engine saw something off (junk filters, dupes)
- **socialRepeat** — flagged for a second social push
- **site name** — derived from the source domain

## Article tools anywhere (hover)
On **every** article card — magazine grid, the "● Live · from the pipeline"
strip, Search, Bookmarks, My Feed, Highlights, Reading History:
- **Desktop:** hover the card → toolbar fades in at the card's lower edge
- **Touch:** the small **(A)** circle on the card toggles the toolbar
- Same actions as Dispatch; changes refresh the page section in place
- Magazine grid additionally supports move-magazine and subcategory pickers inline

## Magazine pages
- **Pagination:** Per-page dropdown (20/50/100/200) + ◀ Prev / Next ▶. Page count
  and total stories shown. Switching magazine/subcategory resets to page 1.
- **Subcategory chips** filter the grid; an active filter shows a banner with Clear.
- **Pins (FLASH/IMPORTANT)** surface first on the page + in the Live strip, and
  expire automatically (pin-cleanup cron every 10 min).
- **Star** marks the flagship/leader article for the magazine page hero.
- **Explore drawer** (right hamburger): per-magazine cards and subcategory browse.

## AI commentary
- Generate per-article (card tool) or batch (Dispatch).
- Commentary is what makes an article feel "written" — empty-summary sources
  (e.g. Hugging Face) get their substance here.
- The summarizer **skips** junk (see [[Source-Quality-Policy]]) — if commentary
  generation is refused, the article probably failed the quality gate; delete it
  or fix the source.

## Reader-facing features
- Comments on article pages (sign-in required), notifications for magazine
  followers, bookmarks, reading history (auto-tracked), weekly highlights page,
  email digest (daily/weekly toggle), C7 browser extension + Collect page for
  saving links (AI picks the magazine, flags suitability), thread-maker &
  quote-graphics for X.

## Social publishing
- Post to X per-article (Dispatch), thread-splitting for long commentary.
- Social accounts configured in Admin → Social tab.
- Auto-post on publish is part of the auto-publish tier (see [[Anteroom]] §social).

## House rules
1. **Publish from the queue, not the DB.** Bulk actions exist so you never need SQL.
2. **A source that keeps failing the gate will pause itself** — that's working as
   designed; un-pause only after fixing the feed.
3. **Delete asks why** — those reasons drive source demotion. Don't skip it.
4. Staging (`preview.anteroom.news`) is for testing risky changes; its DB resets
   from nightly dumps, so don't save anything there you care about.
