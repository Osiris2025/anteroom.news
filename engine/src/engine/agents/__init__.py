"""
AI Discovery Agents — RSS scraping and database ingestion for AI News Nexus.
"""

import hashlib
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import httpx
import feedparser

from ..config import StreamConfig

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# RSS feed scraper
# ---------------------------------------------------------------------------

def fetch_rss(url: str, timeout: int = 30) -> list[dict]:
    """Fetch and parse an RSS feed, returning a list of article dicts."""
    try:
        feed = feedparser.parse(url)
    except Exception as exc:
        logger.warning("Failed to parse RSS feed %s: %s", url, exc)
        return []

    articles = []
    for entry in feed.entries:
        link = entry.get("link", "")
        if not link:
            continue
        title = entry.get("title", "").strip()
        if not title:
            continue

        # Extract description / summary
        summary = ""
        if hasattr(entry, "summary"):
            summary = entry.summary
        elif hasattr(entry, "description"):
            summary = entry.description
        # Strip HTML tags for clean summary
        if summary:
            import re
            summary = re.sub(r"<[^>]+>", "", summary)
            summary = summary[:500]

        published = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            try:
                from time import mktime
                published = datetime.fromtimestamp(mktime(entry.published_parsed), tz=timezone.utc)
            except Exception:
                pass

        articles.append({
            "source_url": link,
            "title": title,
            "summary": summary,
            "published": published,
        })

    return articles


# ---------------------------------------------------------------------------
# Reddit scraper (fetch hot/top from a subreddit via JSON)
# ---------------------------------------------------------------------------

def fetch_reddit(subreddit: str, sort: str = "hot", limit: int = 25) -> list[dict]:
    """Fetch posts from a subreddit via the JSON API."""
    url = f"https://www.reddit.com/r/{subreddit}/{sort}.json?limit={limit}"
    headers = {"User-Agent": "AI-News-Nexus/0.1"}
    try:
        resp = httpx.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        logger.warning("Failed to fetch Reddit r/%s: %s", subreddit, exc)
        return []

    articles = []
    for child in data.get("data", {}).get("children", []):
        post = child.get("data", {})
        title = post.get("title", "").strip()
        if not title:
            continue
        # Skip stickied posts
        if post.get("stickied"):
            continue

        link = post.get("url", "")
        permalink = "https://www.reddit.com" + post.get("permalink", "")
        summary = post.get("selftext", "") or ""
        if summary:
            import re
            summary = re.sub(r"<[^>]+>", "", summary)[:500]

        created_utc = post.get("created_utc")
        published = None
        if created_utc:
            published = datetime.fromtimestamp(created_utc, tz=timezone.utc)

        articles.append({
            "source_url": link or permalink,
            "title": title,
            "summary": summary or f"[Reddit r/{subreddit}]",
            "published": published,
        })

    return articles


# ---------------------------------------------------------------------------
# Source scanner — iterates over a stream config's sources
# ---------------------------------------------------------------------------

def scan_stream_sources(config: StreamConfig) -> list[dict]:
    """Scrape all sources defined in a stream config. Returns deduplicated articles."""
    seen_urls: set[str] = set()
    all_articles: list[dict] = []

    for source in config.ingestion.sources:
        if source.type == "rss" and source.url:
            articles = fetch_rss(source.url)
        elif source.type == "reddit" and source.subreddit:
            articles = fetch_reddit(source.subreddit, source.sort, source.limit)
        else:
            continue

        for article in articles:
            url = article["source_url"]
            if url in seen_urls:
                continue
            seen_urls.add(url)
            art_id = str(uuid4())
            article["id"] = art_id
            article["stream_id"] = config.stream_id
            article["source_name"] = source.name or source.url
            all_articles.append(article)

    return all_articles


# ---------------------------------------------------------------------------
# Database writer
# ---------------------------------------------------------------------------

def insert_articles(db_conn, articles: list[dict]) -> int:
    """Insert articles into the DB, skipping duplicates by source_url."""
    import psycopg2.extras

    inserted = 0
    for art in articles:
        try:
            with db_conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO article (id, ingress, source_url, title, summary, status, published_at)
                    VALUES (%s, %s, %s, %s, %s, 'draft', %s)
                    ON CONFLICT (source_url) DO NOTHING
                    """,
                    (
                        art["id"],
                        "autonomous",
                        art["source_url"],
                        art["title"],
                        art.get("summary", ""),
                        art.get("published"),
                    ),
                )
                if cur.rowcount > 0:
                    inserted += 1
        except Exception as exc:
            logger.warning("DB insert error for %s: %s", art.get("title", "?"), exc)
            db_conn.rollback()
            continue

    db_conn.commit()
    return inserted


def run_discovery(configs: list[StreamConfig], db_url: str) -> dict:
    """Run the full discovery pipeline: scrape all sources, store to DB."""
    import psycopg2

    logger.info("Starting AI discovery pipeline...")

    all_articles: list[dict] = []
    for cfg in configs:
        articles = scan_stream_sources(cfg)
        logger.info("  %s: found %d new articles", cfg.stream_id, len(articles))
        all_articles.extend(articles)

    if not all_articles:
        logger.info("No new articles discovered.")
        return {"found": 0, "inserted": 0}

    # Deduplicate across streams
    seen = set()
    unique = []
    for art in all_articles:
        if art["source_url"] not in seen:
            seen.add(art["source_url"])
            unique.append(art)

    conn = psycopg2.connect(db_url)
    try:
        inserted = insert_articles(conn, unique)
    finally:
        conn.close()

    result = {"found": len(all_articles), "unique": len(unique), "inserted": inserted}
    logger.info("Discovery complete: %d found, %d unique, %d inserted", result["found"], result["unique"], result["inserted"])
    return result