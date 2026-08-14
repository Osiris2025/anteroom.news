#!/usr/bin/env python3
"""CLI entrypoint for the Nexus social publisher.

Usage:
  nexus-social queue --magazine tech-pulse [--status approved] [--platform x,bluesky]
  nexus-social post [--dry-run] [--platform x,bluesky] [--limit 20]
  nexus-social metrics
"""
from __future__ import annotations

import argparse
import os
import sys

from . import db
from .config import Config
from .publisher import publish_due


def _article_rows(conn, magazine_id: str | None, status: str) -> list[dict]:
    """Fetch candidate articles from the DB for the queue command."""
    import psycopg2.extras

    sql = """
        SELECT a.id, a.title, a.headline, a.summary, a.commentary, a.image_url,
               m.name AS magazine_name
        FROM article a
        LEFT JOIN magazine m ON m.id = a.magazine_id
        WHERE a.status = %s
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
    def _get(row: dict) -> str | None:
        return None  # media resolution to local file lives in the caller/app
    return _get


def cmd_queue(args) -> int:
    config = Config.from_env()
    conn = db.get_conn(config.database_url)
    db.ensure_schema(conn)
    rows = _article_rows(conn, args.magazine, args.status)
    platforms = args.platform.split(",") if args.platform else ["x"]
    enqueued = 0
    for article in rows:
        for p in platforms:
            p = p.strip().lower()
            if not config.platform_enabled(p):
                continue
            if db.already_posted(conn, article["id"], p):
                continue
            from .publisher import enqueue_article
            enqueue_article(conn, article, p, config)
            enqueued += 1
    print(f"Enqueued {enqueued} posts from {len(rows)} articles across {platforms}")
    return 0


def cmd_post(args) -> int:
    config = Config.from_env()
    conn = db.get_conn(config.database_url)
    db.ensure_schema(conn)
    platforms = args.platform.split(",") if args.platform else None
    result = publish_due(conn, config, platforms=platforms, dry_run=args.dry_run,
                         media_getter=_media_getter_factory(config))
    print(result)
    return 0


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

    q = sub.add_parser("queue", help="Enqueue candidate articles for posting")
    q.add_argument("--magazine", default=None)
    q.add_argument("--status", default="approved")
    q.add_argument("--platform", default=None)
    q.set_defaults(func=cmd_queue)

    p = sub.add_parser("post", help="Publish due queued posts")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--platform", default=None)
    p.add_argument("--limit", type=int, default=50)
    p.set_defaults(func=cmd_post)

    m = sub.add_parser("metrics", help="Show post status counts")
    m.set_defaults(func=cmd_metrics)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())