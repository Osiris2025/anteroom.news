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
  article_id    text REFERENCES article(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS social_campaign (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  kind             text NOT NULL DEFAULT 'custom',
  description      text,
  status           text NOT NULL DEFAULT 'draft',
  start_at         timestamptz NOT NULL DEFAULT now(),
  end_at           timestamptz NOT NULL,
  posts_per_day    int  NOT NULL DEFAULT 2,
  window_start_min int  NOT NULL DEFAULT 480,
  window_end_min   int  NOT NULL DEFAULT 1320,
  target_platforms text[] NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS social_campaign_item (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES social_campaign(id) ON DELETE CASCADE,
  title        text NOT NULL,
  body         text,
  image_url    text,
  link_url     text,
  position     int  NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'queued',
  scheduled_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_campaign_item_campaign_idx ON social_campaign_item(campaign_id, status);
ALTER TABLE social_post ADD COLUMN IF NOT EXISTS queue_type text NOT NULL DEFAULT 'article';
ALTER TABLE social_post ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES social_campaign(id);

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
            ON CONFLICT (id) DO UPDATE
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
            (post_id, post_url, psycopg2.extras.Json(metrics or {}), post_row_id),
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

# ---------------------------------------------------------------------------
# Campaign queue support (2026-09-06): campaigns hold their own items; the
# publisher drains due items into social_post rows (queue_type='campaign').
# ---------------------------------------------------------------------------

def activate_due_campaigns(conn) -> list[str]:
    """Mark draft campaigns active once start_at passes; complete expired ones."""
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE social_campaign SET status='active', updated_at=now() "
            "WHERE status='draft' AND start_at <= now() RETURNING name")
        started = [r[0] for r in cur.fetchall()]
        cur.execute(
            "UPDATE social_campaign SET status='completed', updated_at=now() "
            "WHERE status='active' AND end_at < now() RETURNING name")
        completed = [r[0] for r in cur.fetchall()]
    conn.commit()
    return started + completed


def due_campaign_items(conn, limit: int = 100) -> list[dict]:
    """Queued items from ACTIVE campaigns whose scheduled_at is due (or unset)."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT i.*, c.name AS campaign_name, c.target_platforms
            FROM social_campaign_item i
            JOIN social_campaign c ON c.id = i.campaign_id
            WHERE c.status = 'active' AND c.end_at >= now()
              AND i.status = 'queued'
              AND (i.scheduled_at IS NULL OR i.scheduled_at <= now())
            ORDER BY i.scheduled_at NULLS LAST, i.position
            LIMIT %s
            """,
            (limit,),
        )
        return [dict(r) for r in cur.fetchall()]


def enqueue_campaign_item(conn, item: dict, platform: str, scheduled_at) -> str:
    """Create (or update) the social_post row for a campaign item + platform."""
    row_id = f"camp:{item['id']}:{platform}"
    text = item.get("body") or item.get("title") or ""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO social_post
              (id, article_id, platform, status, post_text, media_url,
               scheduled_at, queue_type, campaign_id)
            VALUES (%s, NULL, %s, 'queued', %s, %s, %s, 'campaign', %s)
            ON CONFLICT (id) DO UPDATE
              SET status = 'queued',
                  post_text = EXCLUDED.post_text,
                  media_url = EXCLUDED.media_url,
                  scheduled_at = EXCLUDED.scheduled_at,
                  error = NULL
            WHERE social_post.status <> 'posted'
            """,
            (row_id, platform.lower(), text, item.get("image_url"), scheduled_at,
             item["campaign_id"]),
        )
        # remember link_url in media_url if no image; keep item mark scheduled
        cur.execute(
            "UPDATE social_campaign_item SET status='scheduled' "
            "WHERE id=%s AND status='queued'",
            (item["id"],),
        )
    conn.commit()
    return row_id


def item_mark_posted(conn, item_id: str, platform: str) -> None:
    """When every platform copy of an item is posted, mark the item posted."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) FROM social_post
            WHERE campaign_id = (SELECT campaign_id FROM social_campaign_item WHERE id=%s)
              AND post_text = (SELECT COALESCE(body, title) FROM social_campaign_item WHERE id=%s)
              AND status <> 'posted'
            """,
            (item_id, item_id),
        )
        pending = cur.fetchone()[0]
        if pending == 0:
            cur.execute(
                "UPDATE social_campaign_item SET status='posted' WHERE id=%s",
                (item_id,),
            )
    conn.commit()
