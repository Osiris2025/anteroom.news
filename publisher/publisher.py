"""Dispatch core: pull queued posts, run through the right adapter, record results."""
from __future__ import annotations

import logging
from typing import Any

from . import db
from .adapters.base import get_adapter
from .config import Config

logger = logging.getLogger(__name__)


def enqueue_article(conn, article: dict[str, Any], platform: str, config: Config,
                    scheduled_at: str | None = None, media_url: str | None = None) -> None:
    """Build post text and insert a queued social_post for an article+platform."""
    from .render import render_post

    text = render_post(article, config, platform)
    row = {
        "id": f"{article['id']}::{platform}",
        "article_id": article["id"],
        "platform": platform,
        "post_text": text,
        "media_url": media_url,
        "scheduled_at": scheduled_at,
    }
    db.enqueue(conn, row)


def publish_one(conn, post_row: dict[str, Any], config: Config,
                media_path: str | None = None) -> dict[str, str]:
    """Publish a single queued post. Returns {post_id, post_url}. Raises on failure."""
    platform = post_row["platform"].lower()
    adapter = get_adapter(platform, config)
    text = post_row.get("post_text") or ""
    result = adapter.post(post_row, text, media_path)
    db.mark_posted(conn, post_row["id"], result["post_id"], result["post_url"])
    logger.info("Posted %s -> %s (%s)", post_row["id"], result["post_url"], platform)
    return result


def publish_due(conn, config: Config, platforms: list[str] | None = None,
                dry_run: bool = False, media_getter=None, limit: int = 50) -> dict[str, Any]:
    """Publish all due queued posts. Returns a summary dict.

    `media_getter(post_row) -> media_path|None` lets the caller resolve an image
    to a local file; pass None to skip media.
    """
    if config.disabled:
        logger.warning("SOCIAL_DISABLED=1 — no posts published")
        return {"posted": 0, "failed": 0, "skipped_disabled": True}

    if platforms is None:
        platforms = [p for p in ("x", "bluesky", "linkedin") if config.platform_enabled(p)]

    due = db.fetch_due(conn, platforms, limit=limit)
    summary = {"posted": 0, "failed": 0, "dry_run": dry_run}

    for row in due:
        if not config.platform_enabled(row["platform"]):
            logger.info("Platform not enabled: %s — skipping", row["platform"])
            continue
        media_path = media_getter(row) if (media_getter and not dry_run) else None
        adapter = get_adapter(row["platform"], config)
        try:
            if dry_run:
                adapter.dry_run(row.get("post_text") or "", media_path)
                summary["posted"] += 1
            else:
                publish_one(conn, row, config, media_path)
                summary["posted"] += 1
        except Exception as exc:  # noqa: BLE001
            logger.warning("Publish failed for %s: %s", row["id"], exc)
            if not dry_run:
                try:
                    db.mark_failed(conn, row["id"], str(exc))
                except Exception:  # noqa: BLE001
                    pass
            summary["failed"] += 1

    return summary
