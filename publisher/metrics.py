"""Engagement metrics fetcher for published Bluesky posts.

Usage: nexus-social fetch-metrics [--limit N]

For each social_post with status='posted' and platform='bluesky', fetches
like/repost/reply counts via the atproto client and stores them in the
metrics jsonb column with a fetched_at timestamp. Failures are logged and
counted, never raised.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from . import db
from .config import Config

logger = logging.getLogger(__name__)

CHUNK = 25  # app.bsky.feed.getPosts max uris per call


def _client(config: Config):
    from atproto import Client

    client = Client()
    client.login(config.bluesky_handle, config.bluesky_password)
    return client


def fetch_bluesky_metrics(conn, config: Config, limit: int = 100) -> dict[str, Any]:
    if not (config.bluesky_handle and config.bluesky_password):
        return {"error": "Bluesky credentials not configured", "checked": 0, "updated": 0}

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, post_id FROM social_post
            WHERE status='posted' AND platform='bluesky' AND post_id IS NOT NULL
            ORDER BY posted_at DESC NULLS LAST
            LIMIT %s
            """,
            (limit,),
        )
        rows = cur.fetchall()

    if not rows:
        return {"checked": 0, "updated": 0, "failed": 0}

    try:
        client = _client(config)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Bluesky login failed: %s", exc)
        return {"error": f"login failed: {exc}", "checked": len(rows), "updated": 0, "failed": 0}

    fetched_at = datetime.now(timezone.utc).isoformat()
    updated = failed = 0

    for i in range(0, len(rows), CHUNK):
        chunk = rows[i:i + CHUNK]
        try:
            resp = client.get_posts([r[1] for r in chunk])
            posts = {str(getattr(p, "uri", "")): p for p in getattr(resp, "posts", [])}
        except Exception as exc:  # noqa: BLE001
            logger.warning("get_posts failed for %d posts: %s", len(chunk), exc)
            failed += len(chunk)
            continue
        for post_row_id, uri in chunk:
            p = posts.get(uri)
            if p is None:
                failed += 1
                continue
            metrics = {
                "likes": int(getattr(p, "like_count", 0) or 0),
                "reposts": int(getattr(p, "repost_count", 0) or 0),
                "replies": int(getattr(p, "reply_count", 0) or 0),
                "quotes": int(getattr(p, "quote_count", 0) or 0),
                "fetched_at": fetched_at,
            }
            try:
                db.update_metrics(conn, post_row_id, metrics)
                updated += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning("metrics update failed for %s: %s", post_row_id, exc)
                failed += 1

    return {"checked": len(rows), "updated": updated, "failed": failed}
