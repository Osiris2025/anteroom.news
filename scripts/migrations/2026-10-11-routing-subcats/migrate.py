#!/usr/bin/env python3
"""One-off data migration: NASA / AI Frontier routing + AI Frontier subcategories.

Default is a DRY RUN: read-only transaction, nothing is written, a summary of
the final counts per magazine and per AI Frontier subcategory is printed.
Pass --apply to write (one transaction; backups first; every move logged to
magazine_move_log). Run it with ./run.sh (see README.md), never by hand on the
live DB without a fresh pg_dump.

What it does
  0. backup tables: bk_20261011_article_routing (id, magazine_id, subcategory of
     every article it may touch), bk_20261011_magazine_taxonomy, bk_20261011_source
  1. magazine_taxonomy for neural-hardware -> the 9 new subcategories/keywords
     (from engine/src/engine/agents/subcategory.py)
  2. BleepingComputer source (nh-bleepingcomputer) -> Tech Pulse
  3. article moves, first match wins per article:
       a. data/nasa-moves.csv            (NASA wins over the AI rule)
       b. off-topic AI Frontier articles  -> Tech Pulse (data/ai-frontier-subcats.csv offtopic=True)
       c. non-AI BleepingComputer articles in AI Frontier -> Tech Pulse (shared routing rules)
       d. data/ai-frontier-moves.csv     (the 732 articles naming an AI company/product)
     An article is only moved if it is still in the magazine the audit saw
     (an admin may have moved it since) and is not rejected.
  4. subcategories: every non-rejected AI Frontier article gets its audited
     subcategory (data/ai-frontier-subcats.csv; Hacks & Jailbreaks folded into
     Security & Attacks); others are keyword-tagged, then (with --apply and an
     OpenRouter key) LLM-tagged. Articles moved to another magazine are
     re-tagged with that magazine's keywords (or cleared).
Only article.magazine_id / article.subcategory are written, so it does not
conflict with jobs rewriting commentary. Source move_count is NOT bumped.
"""
from __future__ import annotations

import argparse
import collections
import csv
import os
import sys
import time
import uuid

import psycopg2
import psycopg2.extras

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "../../../engine/src")))

from engine.agents import subcategory as subcat  # noqa: E402
from engine.agents.routing import load_rules  # noqa: E402

AI, TECH = "neural-hardware", "tech-pulse"
BLEEPING_SOURCE_ID = "nh-bleepingcomputer"
OLD_TO_NEW = {  # last-resort mapping of the old AI Frontier slugs
    "agents": "tools-agents", "cybersecurity": "security-attacks", "hardware-datacenters": "chips-hardware",
    "open-source": "tools-agents", "models": "models-research", "research": "models-research",
    "business": "ai-companies", "policy-safety": "politics-policy", "hacks-jailbreaks": "security-attacks",
}
BK = "bk_20261011"


def read_csv(name):
    with open(os.path.join(DATA, name), newline="") as fh:
        return list(csv.DictReader(fh))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write changes (default: dry run)")
    ap.add_argument("--no-llm", action="store_true", help="never call the LLM for leftover subcategories")
    ap.add_argument("--log", default=f"/tmp/routing-migration-{time.strftime('%Y%m%d-%H%M%S')}.csv")
    args = ap.parse_args()
    dry = not args.apply

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.set_session(readonly=dry, autocommit=False)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if not dry:
        cur.execute("SET LOCAL lock_timeout = '10s'")
        cur.execute("SET LOCAL statement_timeout = '120s'")

    rules = load_rules()
    if rules.ai_title is None:
        sys.exit("routing-rules.json not found (set ROUTING_RULES_PATH)")

    nasa = read_csv("nasa-moves.csv")
    ai_moves = read_csv("ai-frontier-moves.csv")
    subs = read_csv("ai-frontier-subcats.csv")
    audited_sub = {r["id"]: r["subcategory"] for r in subs if r["subcategory"]}
    offtopic = {r["id"] for r in subs if r["group"] == "current" and r["offtopic"] == "True"}

    ids = {r["id"] for r in nasa} | {r["id"] for r in ai_moves} | set(audited_sub)
    cur.execute("SELECT id FROM article WHERE magazine_id = %s", (AI,))
    ids |= {r["id"] for r in cur.fetchall()}
    cur.execute(
        "SELECT id, title, summary, source_url, source_name, magazine_id, subcategory, status "
        "FROM article WHERE id = ANY(%s)", (list(ids),))
    arts = {r["id"]: dict(r) for r in cur.fetchall()}

    # ---- 1/2: taxonomy + source (computed now, written later) ----------------
    new_tax = subcat.MAGAZINE_TAXONOMY[AI]
    subcat.set_taxonomy_overrides(_load_db_taxonomy(cur, exclude=AI) | {AI: new_tax})

    # ---- 3: moves -------------------------------------------------------------
    moves: dict[str, tuple[str, str, str]] = {}  # id -> (from, to, reason)
    skipped = collections.Counter()

    def plan(aid, want_from, to, reason):
        if aid in moves:
            return
        a = arts.get(aid)
        if not a:
            skipped["missing"] += 1
            return
        if a["status"] == "rejected":
            skipped["rejected"] += 1
            return
        if want_from and a["magazine_id"] != want_from:
            skipped["moved-since-audit"] += 1
            moves[aid] = None  # claimed: lower rules must not move it either
            return
        if a["magazine_id"] == to:
            moves[aid] = None
            return
        moves[aid] = (a["magazine_id"], to, reason)

    for r in nasa:
        plan(r["id"], r["from_magazine_id"], r["to_magazine_id"], "nasa: " + r["reason"])
    for aid in offtopic:
        plan(aid, AI, TECH, "ai-frontier off-topic")
    for aid, a in arts.items():
        if a["magazine_id"] == AI and aid not in moves:
            rt = rules.route(a["title"] or "", a["summary"] or "", a["source_url"] or "", a["source_name"] or "")
            if rt and rt.rule == "security-tech":
                plan(aid, AI, TECH, "bleepingcomputer: no AI angle")
    for r in ai_moves:
        plan(r["id"], r["from_magazine_id"], AI, "ai rule: " + r["reason"])
    moves = {k: v for k, v in moves.items() if v}

    # ---- 4: subcategories ------------------------------------------------------
    final_mag = {aid: (moves[aid][1] if aid in moves else a["magazine_id"]) for aid, a in arts.items()}
    sub_updates: dict[str, str | None] = {}
    sub_source = collections.Counter()
    leftovers = []
    for aid, a in arts.items():
        if a["status"] == "rejected":
            continue
        mag = final_mag[aid]
        if mag == AI:
            if aid in audited_sub:
                new, how = audited_sub[aid], "audit (LLM)"
            else:
                new = subcat.classify_article(AI, a["title"], a["summary"])
                how = "keywords"
                if not new:
                    leftovers.append({"id": aid, "magazine_id": AI, "title": a["title"], "summary": a["summary"]})
                    new, how = OLD_TO_NEW.get(a["subcategory"] or ""), "old-slug map"
        elif aid in moves:
            new, how = subcat.classify_article(mag, a["title"], a["summary"]), "re-tag after move"
        else:
            continue
        sub_source[how] += 1
        if new != a["subcategory"]:
            sub_updates[aid] = new
    if leftovers and not dry and not args.no_llm:
        picks = subcat.llm_fallback_subcategories(leftovers, max_items=len(leftovers))
        for aid, s in picks.items():
            sub_updates[aid] = s
        sub_source["llm (of leftovers)"] = len(picks)

    # ---- summary ---------------------------------------------------------------
    cur.execute("SELECT id, name FROM magazine")
    names = {r["id"]: r["name"] for r in cur.fetchall()}
    cur.execute("SELECT magazine_id, count(*) n FROM article WHERE status = 'live' GROUP BY 1")
    before = {r["magazine_id"]: r["n"] for r in cur.fetchall()}
    after = collections.Counter(before)
    for aid, (fr, to, _) in moves.items():
        if arts[aid]["status"] == "live":
            after[fr] -= 1
            after[to] += 1
    by_reason = collections.Counter(v[2].split(":")[0] for v in moves.values())
    flows = collections.Counter((v[0], v[1]) for v in moves.values())

    print("=" * 72)
    print("DRY RUN (nothing written)" if dry else "APPLY")
    print(f"articles considered: {len(arts)}   moves planned: {len(moves)}   skipped: {dict(skipped)}")
    print("moves by rule:", dict(by_reason))
    print("\nmoves by flow:")
    for (fr, to), n in flows.most_common():
        print(f"  {names.get(fr, fr):20} -> {names.get(to, to):20} {n:5}")
    print("\nLIVE articles per magazine (before -> after):")
    for mid in sorted(set(before) | set(after), key=lambda m: names.get(m, m or "")):
        b, a = before.get(mid, 0), after.get(mid, 0)
        print(f"  {names.get(mid, mid) or '(none)':20} {b:6} -> {a:6}  ({a - b:+d})")
    print("\nAI Frontier LIVE subcategories after:")
    sub_after = collections.Counter()
    for aid, a in arts.items():
        if final_mag[aid] == AI and a["status"] == "live":
            sub_after[sub_updates.get(aid, a["subcategory"]) or "(none)"] += 1
    for s, n in sub_after.most_common():
        print(f"  {subcat.subcategory_label(AI, s) if s != '(none)' else s:32} {n:5}")
    print("\nsubcategory source:", dict(sub_source), f"| updates: {len(sub_updates)}",
          f"| keyword-unplaced (LLM in --apply): {len(leftovers)}")
    print("BleepingComputer source -> Tech Pulse")

    if dry:
        conn.rollback()
        return

    # ---- apply -----------------------------------------------------------------
    touch = list(set(moves) | set(sub_updates))
    cur.execute(f"CREATE TABLE {BK}_article_routing AS SELECT id, magazine_id, subcategory, now() AS saved_at "
                f"FROM article WHERE id = ANY(%s)", (touch,))
    cur.execute(f"CREATE TABLE {BK}_magazine_taxonomy AS SELECT * FROM magazine_taxonomy")
    cur.execute(f"CREATE TABLE {BK}_source AS SELECT * FROM source WHERE id = %s", (BLEEPING_SOURCE_ID,))

    cur.execute("DELETE FROM magazine_taxonomy WHERE magazine_id = %s", (AI,))
    for pos, (slug, kws) in enumerate(new_tax):
        cur.execute("INSERT INTO magazine_taxonomy (magazine_id, subcategory, position, keywords) VALUES (%s,%s,%s,%s)",
                    (AI, slug, pos, psycopg2.extras.Json(kws)))
    cur.execute("UPDATE source SET magazine_id = %s WHERE id = %s", (TECH, BLEEPING_SOURCE_ID))

    psycopg2.extras.execute_batch(cur, "UPDATE article SET magazine_id = %s WHERE id = %s",
                                  [(to, aid) for aid, (fr, to, _) in moves.items()], page_size=200)
    psycopg2.extras.execute_batch(cur, "UPDATE article SET subcategory = %s WHERE id = %s",
                                  [(s, aid) for aid, s in sub_updates.items()], page_size=200)
    psycopg2.extras.execute_batch(
        cur,
        "INSERT INTO magazine_move_log (id, article_id, title, source_url, source_name, from_magazine_id, to_magazine_id) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s)",
        [(str(uuid.uuid4()), aid, arts[aid]["title"], arts[aid]["source_url"], arts[aid]["source_name"], fr, to)
         for aid, (fr, to, _) in moves.items()], page_size=200)
    conn.commit()

    with open(args.log, "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "from_magazine_id", "to_magazine_id", "old_subcategory", "new_subcategory", "reason", "title"])
        for aid in touch:
            mv = moves.get(aid)
            a = arts[aid]
            w.writerow([aid, a["magazine_id"], mv[1] if mv else a["magazine_id"], a["subcategory"],
                        sub_updates.get(aid, a["subcategory"]), mv[2] if mv else "subcategory", a["title"]])
    print(f"\nCOMMITTED. {len(moves)} moves, {len(sub_updates)} subcategory updates. Log: {args.log}")
    print(f"Rollback: see README.md (tables {BK}_*).")


def _load_db_taxonomy(cur, exclude):
    cur.execute("SELECT magazine_id, subcategory, keywords FROM magazine_taxonomy WHERE magazine_id <> %s "
                "ORDER BY magazine_id, position", (exclude,))
    out: dict = {}
    for r in cur.fetchall():
        out.setdefault(r["magazine_id"], []).append((r["subcategory"], list(r["keywords"] or [])))
    return out


if __name__ == "__main__":
    main()
