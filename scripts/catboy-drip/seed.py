#!/usr/bin/env python3
"""Seed the 25 "Catboy sighting" articles as drafts with a randomized drip schedule.

Each row is inserted with status='draft' and published_at = its planned drop time
(this doubles as the schedule). catboy-drip.sh flips due rows to 'live' and adds
a 7-day FLASH ("Breaking") pin.

Schedule: slot 1 (cookie-jar-caper) = now. Every next slot = previous slot + a
random duration uniform in [72h, 192h], re-sampled until the local time
(America/New_York) is between 08:00 and 22:00.

Usage (run on the server, from anywhere):
  python3 seed.py --dry-run            # print schedule, touch nothing
  python3 seed.py                      # insert into DB 'nexus'
  CATBOY_DB=nexus_preview python3 seed.py   # insert into the preview DB
  python3 seed.py --show               # print schedule of rows already in the DB
Inserts use ON CONFLICT (id) DO NOTHING, so re-running never overwrites rows.
"""
import argparse, json, os, random, subprocess, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
HERE = Path(__file__).resolve().parent
MIN_H, MAX_H = 72, 192
DAY_START, DAY_END = 8, 22  # local hours, [08:00, 22:00)
AGENT = "Max the Cryptid Reporter"


def build_schedule(n, rng, start):
    slots = [start]
    while len(slots) < n:
        while True:
            cand = slots[-1] + timedelta(seconds=rng.uniform(MIN_H * 3600, MAX_H * 3600))
            local = cand.astimezone(ET)
            if DAY_START <= local.hour < DAY_END:
                slots.append(cand)
                break
    return slots


def lit(v):
    """SQL string literal (standard_conforming_strings is on in Postgres >= 9.1)."""
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def psql(args, sql):
    cmd = ["docker", "exec", "-i", args.container, "psql", "-U", args.user, "-d", args.db,
           "-v", "ON_ERROR_STOP=1", "--single-transaction", "-q"]
    return subprocess.run(cmd, input=sql, text=True, check=True)


def show(args):
    sql = ("select id, status, published_at at time zone 'America/New_York' as drop_et, "
           "round(extract(epoch from published_at - lag(published_at) over (order by published_at))/3600,1) as gap_h "
           "from article where id like 'catboy-%' and id not like 'catboy-episode-%' order by published_at;")
    subprocess.run(["docker", "exec", "-i", args.container, "psql", "-U", args.user, "-d", args.db, "-c", sql], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--show", action="store_true")
    ap.add_argument("--seed", type=int, default=None, help="RNG seed (default: random)")
    ap.add_argument("--db", default=os.environ.get("CATBOY_DB", "nexus"))
    ap.add_argument("--container", default=os.environ.get("CATBOY_DB_CONTAINER", "nexus-db"))
    ap.add_argument("--user", default=os.environ.get("CATBOY_DB_USER", "nexus"))
    args = ap.parse_args()
    if args.show:
        return show(args)

    arts = json.loads((HERE / "articles.json").read_text())
    assert len(arts) == 25 and arts[0]["slug"] == "cookie-jar-caper"
    rng = random.Random(args.seed) if args.seed is not None else random.SystemRandom()
    now = datetime.now(timezone.utc).replace(microsecond=0)
    slots = build_schedule(len(arts), rng, now)

    print(f"{'#':>2}  {'slug':28} {'drop (America/New_York)':26} gap_h")
    ok = True
    for i, (a, t) in enumerate(zip(arts, slots)):
        gap = (t - slots[i - 1]).total_seconds() / 3600 if i else None
        if gap is not None and not (MIN_H <= gap <= MAX_H):
            ok = False
        print(f"{i+1:>2}  {a['slug']:28} {t.astimezone(ET).strftime('%a %Y-%m-%d %H:%M %Z'):26} {'' if gap is None else f'{gap:.1f}'}")
    assert ok, "gap out of range"
    print("all gaps within 72-192h")
    if args.dry_run:
        return

    rows = []
    for a, t in zip(arts, slots):
        slug = a["slug"]
        thoughts = json.dumps({"agent": AGENT, "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%S.000Z")})
        vals = [
            f"catboy-{slug}", "ai-generated", None, a["title"], a["headline"], "draft", "weekly-weird-news",
            a["summary"], a["commentary"], thoughts, a["subcategory"], t.isoformat(),
            f"/images/catboy/{slug}.jpg", a.get("efx"), AGENT,
        ]
        rows.append("(" + ", ".join(lit(v) for v in vals) + ", false, false, false, false)")
    sql = ("INSERT INTO article (id, ingress, source_url, title, headline, status, magazine_id, summary, commentary, "
           "ai_thoughts, subcategory, published_at, image_url, efx, source_name, featured, suitability_ok, flagged, social_repeat)\nVALUES\n"
           + ",\n".join(rows) + "\nON CONFLICT (id) DO NOTHING;\n")
    psql(args, sql)
    print(f"seeded into database {args.db} (existing ids are left untouched)")
    show(args)


if __name__ == "__main__":
    main()
