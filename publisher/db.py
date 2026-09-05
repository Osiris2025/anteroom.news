"""Postgres helpers for the social_post table.

Creates the table if missing (idempotent) and provides small CRUD used by the
publisher and the Dispatch desk. Uses the same DATABASE_URL as the app.
"""
from __future__ import annotations

from typing import Any

import psycopg2
import psycopg2.extras

SCHEMA = """
CREATE TABLE IF NOT EXISTS social_post (
  id            text PRIMARY KEY,
  article_id    text NOT NULL REFERENCES article(id) ON DELETE CASCADE,
  platform      text NOT NULL,
  status        text NOT NULL DEFAULT 'queued',   -- queued | posted | failed
  post_text     text,
  media_url     text,
  post_id       text,          -- platform's id for the post
  post_url      text,          -- permalink to the post on the platform
  error         text,
  scheduled_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  posted_at     timestamptz,
  metrics       jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (article_id, platform)
);
"""


def get_conn(database_url: str):
    return psycopg2.connect(database_url)


def ensure_schema(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(SCHEMA)
    conn.commit()


def enqueue(conn, row: dict[str, Any]) -> None:
    """Insert a queued social_post (idempotent on article_id+platform).

    Re-queueing an existing queued/failed row refreshes its schedule and text.
    Posted rows are never touched.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO social_post
              (id, article_id, platform, status, post_text, media_url, scheduled_at)
            VALUES (%s, %s, %s, 'queued', %s, %s, %s)
            ON CONFLICT (article_id, platform) DO UPDATE
              SET status = 'queued',
                  post_text = EXCLUDED.post_text,
                  media_url = EXCLUDED.media_url,
                  scheduled_at = EXCLUDED.scheduled_at,
                  error = NULL
            WHERE social_post.status <> 'posted'
            """,
            (
                row.get("id"),
                row["article_id"],
                row["platform"].lower(),
                row.get("post_text"),
                row.get("media_url"),
                row.get("scheduled_at"),
            ),
        )
    conn.commit()


def mark_posted(conn, post_row_id: str, post_id: str, post_url: str, metrics: dict | None = None) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE social_post
            SET status='posted', post_id=%s, post_url=%s, posted_at=now(),
                metrics=%s::jsonb, error=NULL
            WHERE id=%s
            """,
            (post_id, post_url, (metrics or {}), post_row_id),
        )
    conn.commit()


def mark_failed(conn, post_row_id: str, error: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE social_post SET status='failed', error=%s WHERE id=%s",
            (error[:1000], post_row_id),
        )
    conn.commit()


def requeue(conn, post_row_id: str, scheduled_at=None) -> None:
    """Reset a failed post back to queued so publish_due can retry it."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE social_post
            SET status='queued', error=NULL, scheduled_at=COALESCE(%s, now())
            WHERE id=%s AND status='failed'
            """,
            (scheduled_at, post_row_id),
        )
    conn.commit()


def update_metrics(conn, post_row_id: str, metrics: dict) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE social_post SET metrics=%s::jsonb WHERE id=%s",
            (psycopg2.extras.Json(metrics), post_row_id),
        )
    conn.commit()


def fetch_due(conn, platforms: list[str] | None = None, limit: int = 50) -> list[dict[str, Any]]:
    """Queued posts that are scheduled now-or-earlier (or unscheduled)."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if platforms:
            ph = ", ".join(["%s"] * len(platforms))
            cur.execute(
                f"""
                SELECT * FROM social_post
                WHERE status='queued'
                  AND platform IN ({ph})
                  AND (scheduled_at IS NULL OR scheduled_at <= now())
                ORDER BY created_at ASC
                LIMIT %s
                """,
                (*platforms, limit),
            )
        else:
            cur.execute(
                """
                SELECT * FROM social_post
                WHERE status='queued'
                  AND (scheduled_at IS NULL OR scheduled_at <= now())
                ORDER BY created_at ASC
                LIMIT %s
                """,
                (limit,),
            )
        return [dict(r) for r in cur.fetchall()]


def already_posted(conn, article_id: str, platform: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM social_post WHERE article_id=%s AND platform=%s AND status='posted'",
            (article_id, platform.lower()),
        )
        return cur.fetchone() is not None
