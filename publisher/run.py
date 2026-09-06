#!/usr/bin/env python3
"""CLI entrypoint for the Nexus social publisher.

Usage:
  nexus-social queue [--magazine m] [--status live] [--platform x,bluesky]
  nexus-social post [--dry-run] [--platform x,bluesky] [--limit 20]
  nexus-social fetch-metrics [--limit 100]
  nexus-social metrics
"""
from __future__ import annotations

import argparse
import os
import sys

from . import db
from .config import Config
from .publisher import publish_due
from .scheduling import schedule_slots


def _article_rows(conn, magazine_id: str | None, status: str) -> list[dict]:
    """Fetch candidate articles from the DB for the queue command.

    Only picks up articles flagged social_repeat — those are the ones meant
    to be recycled onto social platforms.
    """
    import psycopg2.extras

    sql = """
        SELECT a.id, a.title, a.headline, a.summary, a.commentary, a.image_url,
               m.name AS magazine_name
        FROM article a
        LEFT JOIN magazine m ON m.id = a.magazine_id
        WHERE a.status = %s
          AND a.social_repeat = TRUE
    """
    params: list = [status]
    if magazine_id:
        sql += " AND a.magazine_id = %s"
        params.append(magazine_id)
    sql += " ORDER BY a.created_at DESC LIMIT 200"

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, params)
        return [dict(r) for r in cur.fetchall()]


def _media_getter_factory(config: Config):
    """Resolve article media: look up article.image_url, download to /tmp, return path."""
    import urllib.request
    import tempfile

    def _get(row: dict) -> str | None:
        try:
            import psycopg2
            conn = psycopg2.connect(config.database_url)
            with conn.cursor() as cur:
                cur.execute("SELECT image_url FROM article WHERE id = %s", (row["article_id"],))
                r = cur.fetchone()
            conn.close()
            url = (r[0] if r else None) or ""
            if not url.startswith("http"):
                return None
            ext = ".jpg"
            for e in (".png", ".webp", ".gif", ".jpeg"):
                if e in url.lower():
                    ext = e
                    break
            path = os.path.join(tempfile.gettempdir(), "social_%d%s" % (abs(hash(url)) % 10**10, ext))
            if os.path.exists(path) and os.path.getsize(path) > 1000:
                return path
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; AnteroomSocial/1.0)"})
            with urllib.request.urlopen(req, timeout=20) as resp, open(path, "wb") as f:
                data = resp.read()
                if len(data) < 1000:
                    return None
                f.write(data)
            return path
        except Exception:
            return None  # never block a post over media
    return _get


def cmd_queue(args) -> int:
    config = Config.from_env()
    conn = db.get_conn(config.database_url)
    db.ensure_schema(conn)
    rows = _article_rows(conn, args.magazine, args.status)
    platforms = args.platform.split(",") if args.platform else ["x"]
    platforms = [p.strip().lower() for p in platforms]

    # Plan which (article, platform) pairs actually need a new row first, so
    # staggered slots stay compact (no gaps from already-posted articles).
    pending: list[tuple[dict, str]] = []
    for article in rows:
        for p in platforms:
            if not config.platform_enabled(p):
                continue
            if db.already_posted(conn, article["id"], p):
                continue
            pending.append((article, p))

    if not pending:
        print("Enqueued 0 posts from %d articles across %s" % (len(rows), platforms))
        return 0

    slots = schedule_slots(len(pending), config.max_per_day)
    enqueued = 0
    from .publisher import enqueue_article
    for (article, p), scheduled_at in zip(pending, slots):
        enqueue_article(conn, article, p, config,
                        scheduled_at=scheduled_at.isoformat())
        enqueued += 1
        print("Queued %s -> %s at %s" % (article["id"], p, scheduled_at.isoformat()))
    print("Enqueued %d posts from %d articles across %s" % (enqueued, len(rows), platforms))
    return 0


def _drain_campaigns(conn, config) -> int:
    """Move due campaign items into the social_post queue (per target platform).

    Slots: items are scheduled by the campaign creator; items without a slot
    get next free slot per campaign-day capacity (posts_per_day, ET window).
    """
    from datetime import datetime, timedelta, timezone
    from .scheduling import schedule_slots

    db.activate_due_campaigns(conn)
    items = db.due_campaign_items(conn)
    created = 0
    for item in items:
        platforms = item.get("target_platforms") or []
        # Which platform copies are still missing?
        with conn.cursor() as cur:
            cur.execute(
                "SELECT platform FROM social_post WHERE campaign_id=%s AND post_text=%s",
                (item["campaign_id"], item.get("body") or item.get("title") or ""))
            have = {r[0] for r in cur.fetchall()}
        missing = [p for p in platforms if p.lower() not in have]
        if not missing:
            db.item_mark_posted(conn, item["id"], "")
            continue
        # free slots for this campaign today (capacity = posts_per_day * platforms)
        cap_per_slot_day = max(1, int((item.get("posts_per_day") or 2)))
        slots = schedule_slots(len(missing), max_per_day=cap_per_slot_day,
                               first_start=item.get("scheduled_at"))
        for p, slot in zip(missing, slots):
            db.enqueue_campaign_item(conn, item, p, slot.isoformat())
            created += 1
    if created:
        print(f"Campaign drain: {created} platform posts queued")
    return created


def cmd_post(args) -> int:
    config = Config.from_env()
    conn = db.get_conn(config.database_url)
    db.ensure_schema(conn)
    config.load_db_accounts()  # connections: social_account table is truth
    if not args.dry_run:
        _drain_campaigns(conn, config)
    platforms = args.platform.split(",") if args.platform else None
    result = publish_due(conn, config, platforms=platforms, dry_run=args.dry_run,
                         media_getter=_media_getter_factory(config))
    print(result)
    return 0


def cmd_fetch_metrics(args) -> int:
    from .metrics import fetch_bluesky_metrics

    config = Config.from_env()
    conn = db.get_conn(config.database_url)
    db.ensure_schema(conn)
    result = fetch_bluesky_metrics(conn, config, limit=args.limit)
    print(result)
    return 0 if "error" not in result else 1


def cmd_metrics(args) -> int:
    config = Config.from_env()
    conn = db.get_conn(config.database_url)
    db.ensure_schema(conn)
    with conn.cursor() as cur:
        cur.execute(
            "SELECT platform, status, count(*) FROM social_post GROUP BY platform, status ORDER BY platform, status"
        )
        for row in cur.fetchall():
            print(f"{row[0]:10} {row[1]:8} {row[2]}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="nexus-social")
    sub = parser.add_subparsers(dest="cmd", required=True)

    q = sub.add_parser("queue", help="Enqueue socialRepeat live articles for posting")
    q.add_argument("--magazine", default=None)
    q.add_argument("--status", default="live")
    q.add_argument("--platform", default=None)
    q.set_defaults(func=cmd_queue)

    p = sub.add_parser("post", help="Publish due queued posts")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--platform", default=None)
    p.add_argument("--limit", type=int, default=50)
    p.set_defaults(func=cmd_post)

    fm = sub.add_parser("fetch-metrics", help="Fetch Bluesky engagement metrics for posted posts")
    fm.add_argument("--limit", type=int, default=100)
    fm.set_defaults(func=cmd_fetch_metrics)

    m = sub.add_parser("metrics", help="Show post status counts")
    m.set_defaults(func=cmd_metrics)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
