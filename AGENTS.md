# AGENTS.md — Anteroom

Project rules for every agent and bot working in this tree.

## Project facts
- Live tree and git repository: **homelab1** `/home/todd/anteroom`,
  remote `git@github.com:Osiris2025/anteroom.news.git` (branch `master`).
- This Mac copy (`/Volumes/files1/projects/anteroom`) is documentation and context only.
- Publication: **Anteroom**. The machine behind it is **AI News Nexus** — never name
  Nexus in a social post or in public copy. Openers cite Anteroom only.
- Pipeline: systemd timer on homelab1 (ingest ~05:34, next ~05:40).
- Vault record: `projects/anteroom/` on homelab2.
- Crew: `anteroom-chief`, `-edit`, `-site`, `-qa`, `-ads`, `-social`.

## Ownership boundaries (do not cross)
- `anteroom-edit` — copy, assignment, live/draft gate. Does not post, does not touch the shop.
- `anteroom-social` — Holly Rich posts and the social queue. Does not edit articles or deploy.
- `anteroom-site` — frontend and deploy on homelab1. Does not change editorial status or post.
- `anteroom-ads` — shop, sponsorships, Stripe. Does not post as Holly or change article status.
- `anteroom-qa` — live checks on anteroom.news. Does not deploy or publish.
- `anteroom-chief` — status and tasking. Does not publish, post, or deploy.

## Rules
1. Decisions are written into `docs/DECISIONS.md` the day they are made.
2. Status goes into `docs/status/CHIEF-STATUS.md`; questions that can wait go under
   "Questions for Todd (morning)" with a recommended answer.
3. **Ingest:** contentless articles are DELETEd; `deletion_log` keeps the metadata.
4. "Admin tools" = the hover toolbar; "Dispatch desk" = the `/admin` queue.
5. Verify against the live site (anteroom.news) or the pipeline log — never an exit code alone.
6. Code and deploy changes belong on homelab1. This Mac copy is for reading and documentation.
7. Human-only blockers → `~/.hermes/scripts/notify-todd.sh "message"`. No spam.
8. After any change on homelab1, push: `~/.hermes/scripts/git-backup-audit.sh` must show SYNCED.
