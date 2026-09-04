"""
AI Discovery Agents — RSS scraping and database ingestion for AI News Nexus.
"""

import hashlib
import html
import itertools
import logging
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urljoin
from uuid import uuid4

import httpx
import feedparser

from ..config import StreamConfig
from .subcategory import classify_article, set_taxonomy_overrides


def load_db_taxonomy(db_url: str) -> None:
    """Load the data-driven magazine_taxonomy table and make it authoritative.

    Magazines WITH rows in the table get their taxonomy from data; magazines
    without rows keep the built-in Python MAGAZINE_TAXONOMY (safe fallback, so
    ingest behavior is unchanged until every magazine is seeded).
    """
    try:
        import psycopg2
        conn = psycopg2.connect(db_url)
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT magazine_id, subcategory, position, keywords "
                "FROM magazine_taxonomy ORDER BY magazine_id, position"
            )
            rows = cur.fetchall()
            cur.close()
        finally:
            conn.close()
        by_mag: dict[str, list[tuple[str, list[str]]]] = {}
        for mag_id, sub, _pos, kw in rows:
            kws = list(kw) if kw else []
            by_mag.setdefault(mag_id, []).append((sub, kws))
        if by_mag:
            set_taxonomy_overrides(by_mag)
    except Exception as e:  # never break ingest on taxonomy hiccup
        logging.getLogger(__name__).warning("db taxonomy load failed (using static): %s", e)

# ---------------------------------------------------------------------------
# Junk-deal filter — reject money-saving / coupon / %-off content at ingest.
# HIGH-PRECISION: only drop obvious retail/coupon content. We deliberately do
# NOT match bare words like "deal", "savings", "save", "cheap" that appear in
# normal reporting (e.g. "Senate budget deal", "DOGE savings claims"). Those
# caused false positives before. We require clear commerce intent: a coupon /
# promo-code / %-off / price-drop phrase, OR a URL path on a deal-heavy host.
# ---------------------------------------------------------------------------
_JUNK_DEAL_RE = re.compile(
    r"\b(coupon|coupons|promo\s?code|promo\s+codes|discount\s+code|discount\s+codes|"
    r"voucher|vouchers)\b|"
    r"\b(\d+\s*%(\s*(-|\s+))?(off|discount)|up\s+to\s+\d+\s*%\s*off|"
    r"off\s+your\s+(order|purchase|first\s+order)|best\s+deals?\s+(for|this|of)\b)\b|"
    r"\bdeals?\s+of\s+the\s+day\b|\bon\s+sale\b|\bclearance\b|\bmarked\s+down\b|"
    r"\bdeal\s+alert\b|\bprice\s+drop\b|\btoday\s+only\b|"
    r"\b(today\'?s?\s+|this\s+)deals?\b",
    re.IGNORECASE,
)

# Path markers that definitively indicate coupon/promo content.
_JUNK_PATH_MARKERS = (
    "/deals/", "-promo-code-", "-coupon-", "-coupons-", "-discount-code-",
    "-black-friday/", "promo-code", "/promo-codes", "/coupon-codes"
)

# Hosts that are almost entirely deal/coupon content.
_JUNK_HOSTS = (
    "slickdeals.net", "dealnews.com", "deals.kinja.com", "theblackfriday.com",
    "coupons.com", "retailmenot.com", "thekrazycouponlady.com",
)


def _clean_source_name(entry) -> str:
    """Derive a clean, human-readable publisher name for an article.

    Google News RSS items carry the REAL publisher via entry.source.href (e.g.
    'https://techcrunch.com'), while the item link is just an opaque redirect.
    Prefer that; fall back to a title-hint (e.g. trailing ' - TechCrunch').
    Returns '' when nothing usable is found.
    """
    try:
        src = getattr(entry, "source", None)
        if src and getattr(src, "href", None):
            h = src.href.replace("https://", "").replace("http://", "").replace("www.", "").lower()
            # "techcrunch.com/path" -> "techcrunch.com" -> "TechCrunch"
            h = h.split("/")[0]
            if len(h) > 2:
                base = h.split(".")[0]
                return base.replace("-", " ").replace("_", " ").strip().title()
    except Exception:
        pass
    # Fallback: title often ends with " - Publisher" (Google News style).
    try:
        t = (getattr(entry, "title", "") or "").strip()
        if " - " in t:
            tail = t.rsplit(" - ", 1)[1].strip()
            if 2 <= len(tail) <= 40 and " " not in tail.strip():
                return tail.title()
    except Exception:
        pass
    return ""


def is_release_title(title: str) -> bool:
    """True if a title looks like a software version-bump / release entry (e.g.
    'Hermes Agent v0.20.1', 'huggingface_hub v1.0'). These get subcategory
    'Releases' at ingest so they appear on the magazine's Releases section,
    not the front-page grid. Plain news about a company/model is NOT this."""
    if not title:
        return False
    return bool(re.search(r"(^|[^a-z0-9])v[0-9]+\.[0-9]+(\.[0-9]+)?([^0-9]|$)", title, re.I))



# WWN-Routing: at ingest, articles ingested toward a soft/spiritual magazine (The Veil)
# that are really paranormal / cryptid / UFO "creepy" material belong in Weekly Weird News.
# Deterministic keyword sniff keeps The Veil on-brand and auto-kicks cryptids/ghosts/UFOs
# over to the Weird door. Notes on false positives (learned):
#  * Do NOT include "ritual": it is a SUBSTRING of "spiritual" and false-matches Meditation/Aura
#    content. Keep keywords that are distinctive to paranormal/creepy material only.
#  * Use unicoded match (strip accents) so "S’ance" and "séance" both match "seance".
_WEIRD_KEYWORDS = [
    "ufo", "uap", "area 51", "non-human patient", "extraterrestr", "alien",
    "ghost", "haunt", "spooky", "supernatural", "paranormal", "apparition",
    "cryptid", "bigfoot", "sasquatch", "loch ness", "nessie", "mothman", "chupacabra",
    "skinwalker", "demon", "exorcist", "exorcism", "poltergeist", "seance",
    "possess", "eerie", "otherworldly", "spectral",
    "werewolf", "witchcraft", "black magic", "occult", "medium",
]

import unicodedata as _ud

def _norm(s_: str) -> str:
    # strip accents so Séance/Seance/etc. all collapse to the same ASCII letters
    return "".join(
        c for c in _ud.normalize("NFD", s_) if _ud.category(c) != "Mn"
    ).lower()

def route_to_weird(article: dict) -> bool:
    corpus = _norm(" ".join([
        (article.get("title") or ""),
        (article.get("summary") or ""),
        (article.get("source_name") or ""),
    ]))
    return any(w in corpus for w in _WEIRD_KEYWORDS)

def apply_weird_route(article: dict) -> None:
    """Move a paranormal-destined article to Weekly Weird News at ingest, if it was
    meant for the soft/spiritual/consciousness room (The Veil)."""
    orig = (article.get("magazine_id") or "")
    if orig != "the-veil":
        return  # only auto-route content we pulled for the spiritual/consciousness room
    if route_to_weird(article):
        article["magazine_id"] = "weekly-weird-news"
        sub = classify_article("weekly-weird-news", article.get("title",""), article.get("summary",""))
        if sub:
            article["subcategory"] = sub


def is_junk_deal(article: dict) -> bool:
    """True if an article is clearly money-saving/coupon/% off junk (drop it)."""
    title = str(article.get("title") or "")
    url = (article.get("source_url") or "").lower()
    host = url.split("/", 3)[2] if url.startswith(("http://", "https://")) and "/" in url.split("/", 3)[2] else (url or "")
    host = host.replace("www.", "")
    # Deal-heavy hosts: junk unless it's clearly a product *review* on a news site.
    if any(h in host for h in ("slickdeals.net", "dealnews.com", "coupons.com",
                               "retailmenot.com", "theblackfriday.com", "thekrazycouponlady.com")):
        return True
    # Obvious phrases in the headline.
    if _JUNK_DEAL_RE.search(title):
        return True
    # URL path markers on consumer/tech sites that don't do real journalism.
    return any(m in url for m in _JUNK_PATH_MARKERS)


# ---------------------------------------------------------------------------
# Announcement / event / press-release filter — keeps out "NASA announces expo",
# "X hosts conference", "register for the X summit", etc. These are calendar
# items, not astronomy/tech/science coverage. HIGH-PRECISION: only obvious
# event/press-announcement markers, never bare words like "event"/"announced".
# ---------------------------------------------------------------------------
_EVENT_RE = re.compile(
    r"\b(announces?|unveils?|to (host|unveil|parate)|opens? (registration|call)|"
    r"registers? now|todays?e? the .* (expo|airshow|conference|summit|trade\\s?show)|"
    r"schedule|keynote|panel\\s+discussion|fireside|booth|exhibit)\\b|"
    r"\bexpo\\b|\bairshow\\b|\bregistrations?\\s+open\b|\bsave\\s+the\\s+date\b|\bmark\\s+your\\s+calendar\b|\bwelcome|live\\s+now\b",
    re.IGNORECASE,
)

# URL path markers that almost always indicate a press-release / event announcement.
_EVENT_PATH_MARKERS = (
    "/news-release/", "-expo-", "-airshow-", "/conference/", "/summit/",
    "event.html", "/events/", "-registration-", "/press-release/", "/press-releases/",
)


def is_junk_announcement(article: dict) -> bool:
    """True if an article is clearly an event / press-announcement (drop it)."""
    title = str(article.get("title") or "")
    url = (article.get("source_url") or "").lower()
    # The strongest signal first: official press-release URLs (e.g. NASA /news-release/).
    if any(m in url for m in _EVENT_PATH_MARKERS):
        return True
    return bool(_EVENT_RE.search(title))


logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Image extraction helpers
# ---------------------------------------------------------------------------
# Short user-agent for fetching article pages (og:image extraction).
_IMG_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; AI-News-Nexus/1.0; +https://nexus.osiris2025.com)",
}

def _resolve_url(url: str) -> str:
    """Clean up a raw image URL found in a feed/meta tag."""
    if not url:
        return ""
    url = html.unescape(url.strip().strip("\"' "))
    if url.startswith("//"):
        return "https:" + url
    if url.startswith(("http://", "https://", "data:")):
        return url
    return url


def _feed_image(entry) -> str:
    """Try to pull an image off the feed entry without an extra HTTP request.

    Checks (in order): media_content, media_thumbnail, enclosures with
    image mimetype, and link types that are images.
    """
    if not hasattr(entry, "keys"):
        return ""
    data = getattr(entry, "media_content", None)
    if data:
        for m in data:
            url = _resolve_url(m.get("url", ""))
            if url:
                return url
    data = getattr(entry, "media_thumbnail", None)
    if data:
        for m in data:
            url = _resolve_url(m.get("url", ""))
            if url:
                return url
    encl = getattr(entry, "enclosures", None)
    if encl:
        for e in encl:
            typ = (e.get("type", "") or "")
            if "image" in typ:
                url = _resolve_url(e.get("href", "") or e.get("url", ""))
                if url:
                    return url
    links = getattr(entry, "links", None)
    if links:
        for lk in links:
            rel = (lk.get("type", "") or "") + "|" + (lk.get("rel", "") or "")
            if "image" in rel:
                url = _resolve_url(lk.get("href", ""))
                if url:
                    return url
    # IMAGE tag inside the description/summary HTML (common in some feeds).
    return ""


def _summary_image(summary: str) -> str:
    """Extract the first <img src> from an (HTML) summary, if any."""
    if not summary:
        return ""
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', summary)
    return _resolve_url(m.group(1)) if m else ""


def _page_og_image(page_url: str) -> str:
    """Fetch the article page and return og:image / twitter:image (bounded)."""
    if not page_url or not page_url.startswith("http"):
        return ""
    try:
        req = urllib.request.Request(page_url, headers=_IMG_HEADERS)
        with urllib.request.urlopen(req, timeout=6) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "html" not in ctype and "text" not in ctype and ctype:
                return ""
            body = resp.read(200000).decode("utf-8", "ignore")
        pat = (
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        )
        for p in pat:
            m = re.search(p, body, re.I)
            if m:
                return _resolve_url(urljoin(page_url, m.group(1)))
        return ""
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# RSS feed scraper
# ---------------------------------------------------------------------------

def fetch_rss(url: str, timeout: int = 30) -> list[dict]:
    """Fetch and parse an RSS feed, returning a list of article dicts."""
    try:
        import socket
        old_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(timeout)
        try:
            logger.info("  Fetching RSS: %s", url[:80])
            feed = feedparser.parse(url, agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36")
            logger.info("  Got %d entries from %s", len(feed.entries) if hasattr(feed, 'entries') else 0, url[:60])
        finally:
            socket.setdefaulttimeout(old_timeout)
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
        # Decode HTML character references so titles don't store raw &#8217; etc.
        title = html.unescape(title)

        # Extract description / summary
        summary = ""
        raw_summary = ""
        if hasattr(entry, "summary"):
            summary = raw_summary = entry.summary
        elif hasattr(entry, "description"):
            summary = raw_summary = entry.description
        # Grab an image before HTML is stripped: feed media first, then an
        # <img> in the summary, and finally fetch the article page's og:image.
        image_url = _feed_image(entry) or _summary_image(raw_summary)
        if not image_url:
            image_url = _page_og_image(link)
        # Strip HTML tags for clean summary, then decode entities
        if summary:
            summary = re.sub(r"<[^>]+>", "", summary)
            summary = html.unescape(summary)
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
            "source_name": _clean_source_name(entry),
            "title": title,
            "summary": summary,
            "published": published,
            "image_url": image_url or None,
        })

    return articles


# ---------------------------------------------------------------------------
# Reddit scraper (fetch hot/top from a subreddit via JSON)
# ---------------------------------------------------------------------------

def fetch_reddit(subreddit: str, sort: str = "hot", limit: int = 25) -> list[dict]:
    """Fetch posts from a subreddit via RSS feed (JSON API is blocked by Reddit)."""
    import feedparser

    url = f"https://www.reddit.com/r/{subreddit}/{sort}/.rss?limit={limit}"
    try:
        feed = feedparser.parse(url)
    except Exception as exc:
        logger.warning("Failed to fetch Reddit r/%s RSS: %s", subreddit, exc)
        return []

    articles = []
    for entry in feed.entries[:limit]:
        title = entry.get("title", "").strip()
        if not title:
            continue

        link = entry.get("link", "")
        summary_text = entry.get("summary", "") or ""
        if summary_text:
            import re
            summary_text = re.sub(r"<[^>]+>", "", summary_text)[:500]

        published = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            from time import mktime
            published = datetime.fromtimestamp(mktime(entry.published_parsed), tz=timezone.utc)

        # Extract image from feed entry if available
        image_url = ""
        if hasattr(entry, "media_content") and entry.media_content:
            for m in entry.media_content:
                if m.get("url"):
                    image_url = m["url"]
                    break

        articles.append({
            "source_url": link,
            "title": title,
            "summary": summary_text or f"[Reddit r/{subreddit}]",
            "published": published,
            "image_url": image_url,
        })

    return articles


def _reddit_image(post: dict) -> str:
    """Best available image for a Reddit post (thumbnail/preview/url)."
    Kept for backward compatibility with legacy callers."""
    return post.get("image_url", "")
    thumb = post.get("thumbnail", "")
    if isinstance(thumb, str) and thumb.startswith(("http://", "https://")) and "default" not in thumb:
        return thumb
    preview = post.get("preview", {})
    if isinstance(preview, dict) and preview.get("images"):
        imgs = preview["images"][0]
        if isinstance(imgs, dict):
            src = ((imgs.get("source") or {}) or {}).get("url", "")
            if src:
                return _resolve_url(src)
    return ""


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
            article["magazine_id"] = config.stream_id
            article["source_name"] = source.name or source.url
            all_articles.append(article)

    return all_articles


# ---------------------------------------------------------------------------
# Database writer
# ---------------------------------------------------------------------------

def run_db_sources(configs: list, db_url: str) -> list[dict]:
    """Query the DB 'source' table and scrape any admin-added feeds.

    Returns a list of article dicts (with id, stream_id, source_name set) — ready
    for deduplication and insertion downstream. Magazines that already have a
    YAML StreamConfig reuse it so personalities/behaviour stay consistent;
    otherwise a minimal default config is generated.
    """
    import psycopg2

    config_by_id = {c.stream_id: c for c in configs} if configs else {}

    from ..config import AIConfig, Brand, Ingestion, Source, StreamConfig

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT s.magazine_id, s.type, s.url, s.name, s.sort, s."limit",
                       m.name AS magazine_name, m.tone, s.status, s.tune
                FROM source s
                LEFT JOIN magazine m ON m.id = s.magazine_id
                WHERE s.magazine_id IS NOT NULL
                  AND COALESCE(s.status, 'active') <> 'paused'
                  AND COALESCE(s.status, 'active') <> 'deleted'
                ORDER BY s.magazine_id, s.tune DESC
                """
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        logger.info("  No DB-backed sources to scan.")
        return []

    grouped: dict[str, list] = {}
    for magazine_id, stype, url, name, sort, limit, mname, mtone, status, tune in rows:
        grouped.setdefault(magazine_id, []).append({
            "type": stype, "url": url, "name": name, "sort": sort, "limit": limit,
        })

    # MOVE-LEARNING: which magazine (if any) does each source's work most often
    # get moved TO? If a source reliably lands in a different magazine than the
    # one it was auto-assigned, reroute future articles there (min 2 moves).
    learned_mag_by_source: dict[str, str] = {}
    try:
        ml_conn = psycopg2.connect(db_url)
        with ml_conn.cursor() as ml_cur:
            ml_cur.execute("""
                SELECT source_url, to_magazine_id, COUNT(*) AS n
                FROM magazine_move_log
                WHERE to_magazine_id IS NOT NULL
                GROUP BY source_url, to_magazine_id
            """)
            for source_url, to_mag, n in ml_cur.fetchall():
                if (source_url or "").strip() and n >= 2:
                    # keep the most-frequent target; ties => first wins (dict keeps first)
                    learned_mag_by_source.setdefault(source_url, to_mag)
        ml_conn.close()
    except Exception:
        logger.warning("Move-learning unavailable (magazine_move_log read failed)", exc_info=True)
    if learned_mag_by_source:
        logger.info("  Move-learning: %d source(s) have a learned magazine target", len(learned_mag_by_source))

    all_articles: list[dict] = []
    for magazine_id, sources in grouped.items():
        # Reuse an existing config's brand/AI persona if present, else default.
        base = config_by_id.get(magazine_id)
        src_objs = []
        for s in sources:
            if s["type"] == "reddit":
                # DB stores the subreddit name in `url`; scanner expects `subreddit`.
                src_objs.append(Source(
                    type="reddit", subreddit=s["url"] or "", url="",
                    name=s["name"] or f"r/{s['url']}",
                    sort=s["sort"] or "hot", limit=s["limit"] or 25,
                ))
            else:
                src_objs.append(Source(
                    type="rss", url=s["url"] or "", name=s["name"] or s["url"],
                    sort=s["sort"] or "hot", limit=s["limit"] or 25,
                ))

        scan_cfg = StreamConfig(
            stream_id=magazine_id,
            brand=(base.brand if base else Brand(name=mname or magazine_id, tone=mtone or "neutral")),
            ai=(base.ai if base else AIConfig()),
            ingestion=Ingestion(sources=src_objs),
        )

        articles = scan_stream_sources(scan_cfg)
        # Tag each discovered article with its magazine id so insert storage assigns it.
        for a in articles:
            a["magazine_id"] = magazine_id
            # WWN-route: paranormal items pulled for The Veil belong in Weekly Weird News.
            apply_weird_route(a)
            # MOVE-LEARNING: if this source's work reliably gets moved to another
            # magazine (>=2 corroborating moves), start it off there instead.
            src_url = (a.get("source_url") or "").strip()
            learned = learned_mag_by_source.get(src_url)
            if learned and learned != magazine_id:
                a["magazine_id"] = learned
                logger.info("    Move-learn: article assigned to %s (was auto %s) via move-history", learned, magazine_id)
        logger.info("  %s (DB sources): found %d articles", magazine_id, len(articles))
        all_articles.extend(articles)

    return all_articles




_STOPWORDS = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "by", "with", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "has", "have", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "its",
    "it", "this", "that", "these", "those", "not", "no", "nor", "so",
    "if", "than", "then", "just", "about", "up", "down", "out", "off",
    "over", "under", "again", "further", "once", "here", "there", "when",
    "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "only", "own", "same", "too", "very",
    "after", "before", "between", "through", "during", "above", "below",
    "into", "onto", "upon", "new", "one", "two", "get", "says", "report",
})


def _title_words(title: str) -> set:
    cleaned = re.sub(r"[^a-z0-9\s]", " ", title.lower())
    words = cleaned.split()
    return {w for w in words if len(w) > 2 and w not in _STOPWORDS}


def _word_jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


DUPLICATE_THRESHOLD = 0.75


def find_near_duplicate(db_conn, title, magazine_id):
    words = _title_words(title)
    if not words:
        return None
    with db_conn.cursor() as cur:
        if magazine_id:
            cur.execute(
                "SELECT id, title FROM article "
                "WHERE magazine_id = %s "
                "AND created_at >= NOW() - INTERVAL '7 days' "
                "AND source_url IS DISTINCT FROM %s "
                "ORDER BY created_at DESC LIMIT 100",
                (magazine_id, "")
            )
        else:
            cur.execute(
                "SELECT id, title FROM article "
                "WHERE created_at >= NOW() - INTERVAL '7 days' "
                "ORDER BY created_at DESC LIMIT 100"
            )
        for art_id, existing_title in cur.fetchall():
            if not existing_title:
                continue
            existing_words = _title_words(existing_title)
            sim = _word_jaccard(words, existing_words)
            if sim >= DUPLICATE_THRESHOLD:
                logger.info(
                    "NEAR-DUP (%.2f): %s ~ %s",
                    sim, title[:60], existing_title[:60]
                )
                return art_id
    return None



DEFAULT_PUBLISH_SETTINGS = {
    "auto_publish_enabled": "0",
    "auto_publish_until": "",
    "max_delete_count": "2",
    "max_move_count": "2",
    "min_tune_autopublish": "0",
    "min_tune_approve": "-3",
}


def _setting_int(settings, key, default):
    try:
        return int(settings.get(key, str(default)))
    except (TypeError, ValueError):
        return default


def load_publishing_settings(db_conn) -> dict:
    """Load global pipeline publishing settings + a per-source health/override map."""
    settings = dict(DEFAULT_PUBLISH_SETTINGS)
    try:
        cur = db_conn.cursor()
        cur.execute("SELECT key, value FROM pipeline_setting")
        for k, v in cur.fetchall():
            if k and v is not None:
                settings[k] = v
        cur.close()
    except Exception as e:
        logger.warning("pipeline_setting read failed (using defaults): %s", e)

    enabled = settings.get("auto_publish_enabled", "0").strip().lower() in ("1", "true", "yes", "on")
    until = (settings.get("auto_publish_until") or "").strip()
    if enabled and until:
        try:
            from datetime import datetime as _dt, timezone as _tz
            limit = _dt.fromisoformat(until.replace("Z", "+00:00"))
            if limit.tzinfo is None:
                limit = limit.replace(tzinfo=_tz.utc)
            if _dt.now(limit.tzinfo) >= limit:
                enabled = False
        except Exception as e:
            logger.warning("auto_publish_until parse failed; treating as disabled: %s", e)
            enabled = False

    source_map = {}
    try:
        cur = db_conn.cursor()
        cur.execute(
            "SELECT name, magazine_id, tune, delete_count, move_count, auto_publish FROM source"
        )
        for name, mag, tune, dc, mc, ovr in cur.fetchall():
            if not name:
                continue
            source_map[(name, mag)] = {
                "tune": int(tune or 0),
                "delete_count": int(dc or 0),
                "move_count": int(mc or 0),
                "override": ovr,
            }
        cur.close()
    except Exception as e:
        logger.warning("source health map build failed: %s", e)

    return {
        "enabled": enabled,
        "until": until,
        "thresholds": {
            "max_delete_count": _setting_int(settings, "max_delete_count", 2),
            "max_move_count": _setting_int(settings, "max_move_count", 2),
            "min_tune_autopublish": _setting_int(settings, "min_tune_autopublish", 0),
            "min_tune_approve": _setting_int(settings, "min_tune_approve", -3),
        },
        "sources": source_map,
    }



# ---------------------------------------------------------------------------
# Content-quality gate — "no substance" detector.
# An article has no substance when the feed gave us nothing readable: empty
# summary, pure link-aggregator boilerplate ("submitted by ... [link]
# [comments]"), or a link to a discussion/aggregator page instead of an article.
# Such articles are forced to 'draft' regardless of auto-publish tier, and the
# source's delete_count is bumped so habitual offenders sink to paused.
# ---------------------------------------------------------------------------
_AGGREGATOR_LINK_PATTERNS = (
    "news.ycombinator.com/item",
    "reddit.com/r/hackernews",
)

_BOILERPLATE_RE = re.compile(r"submitted by|\[link\]|\[comments\]|^\s*\[Reddit r", re.I)


def has_substance(art: dict) -> bool:
    """True when the article carries readable content (summary or commentary)."""
    summary = (art.get("summary") or "").strip()
    if _BOILERPLATE_RE.search(summary):
        return False
    if len(summary) < 20:
        # Allow AI commentary to rescue an empty-summary article.
        commentary = (art.get("commentary") or "").strip()
        return len(commentary) >= 40 and not _BOILERPLATE_RE.search(commentary)
    return True


def is_aggregator_link(art: dict) -> bool:
    url = (art.get("source_url") or "").lower()
    return any(pat in url for pat in _AGGREGATOR_LINK_PATTERNS)


def bump_source_delete_count(db_conn, source_name: str, magazine_id: str) -> None:
    """Record a quality strike against the source; auto-pause at the threshold."""
    if not source_name:
        return
    try:
        with db_conn.cursor() as cur:
            cur.execute(
                """
                UPDATE source
                   SET delete_count = COALESCE(delete_count,0) + 1,
                       last_delete_at = now(),
                       tune = CASE WHEN COALESCE(delete_count,0) + 1 >= 15 THEN -5 ELSE tune END,
                       status = CASE WHEN COALESCE(delete_count,0) + 1 >= 15 THEN 'paused' ELSE status END
                 WHERE name = %s AND COALESCE(status,'active') = 'active'
                """,
                (source_name,),
            )
        db_conn.commit()
    except Exception as exc:
        logger.warning("source strike update failed for %s: %s", source_name, exc)
        try:
            db_conn.rollback()
        except Exception:
            pass


def decide_tier(settings: dict, art: dict) -> str:
    """Decide insert status: 'live' (auto-publish) | 'approved' (queue) | 'draft'."""
    enabled = settings.get("enabled", False)
    src = settings.get("sources", {}).get((art.get("source_name"), art.get("magazine_id")))
    if src:
        override = (src.get("override") or "").strip()
        # Per-source override honored ONLY when global autopublish is ON.
        if enabled and override in ("live", "approved", "draft"):
            return override

    th = settings.get("thresholds", {})

    if not enabled:
        # Kill-switch OFF (default): stay fully backward-compatible — everything
        # lands as 'draft' (human review), exactly as before autopublish existed.
        # Nothing auto-publishes and nothing is auto-approved until the switch is
        # flipped ON explicitly.
        return "draft"

    if src is not None:
        dc = src.get("delete_count", 0)
        mc = src.get("move_count", 0)
        tune = src.get("tune", 0)
        if dc > th.get("max_delete_count", 2) or mc > th.get("max_move_count", 2):
            return "approved"
        if tune >= th.get("min_tune_autopublish", 0):
            return "live"
        if tune >= th.get("min_tune_approve", -3):
            return "approved"
        return "draft"
    return "approved"


def insert_articles(db_conn, articles: list[dict], publish_settings: dict | None = None) -> int:
    """Insert articles into the DB, skipping duplicates by source_url."""
    _quality_strikes: list[tuple[str, str]] = []
    import psycopg2.extras

    inserted = 0
    for art in articles:
        if is_junk_deal(art):
            logger.info("  JUNK-DEAL SKIP: %s", art.get("title", "?")[:80])
            continue
        if is_junk_announcement(art):
            logger.info("  JUNK-EVENT SKIP: %s", art.get("title", "?")[:80])
            continue
        # Auto-tag software version-bump titles (e.g. "Hermes Agent v0.20.1")
        # as Releases so they land on the magazine's Releases section, not the
        # front-page grid. Individual release articles (non-version news) are
        # NOT this category and stay on the front page.
        if is_release_title(art.get("title", "")):
            art["subcategory"] = "Releases"
        elif not art.get("subcategory"):
            # Otherwise classify into a magazine subcategory (agents, cyber,
            # models, hardware…) via the deterministic keyword classifier.
            art["subcategory"] = classify_article(
                art.get("magazine_id"), art.get("title", ""), art.get("summary", ""))

        # Near-duplicate check: skip if same story from another outlet
        nd_id = find_near_duplicate(
            db_conn,
            art.get("title", ""),
            art.get("magazine_id"),
        )
        if nd_id:
            logger.info(
                "SKIP near-dup: %s (matches %s)",
                art.get("title", "?")[:80], nd_id[:12]
            )
            continue

        # QUALITY GATE: no-substance articles (empty/boilerplate summary, or a
        # link to an aggregator/discussion page) are ALWAYS draft, and the source
        # takes a strike. This outranks any auto-publish tier.
        if not has_substance(art) or is_aggregator_link(art):
            art["status"] = "draft"
            _quality_strikes.append((art.get("source_name") or "", art.get("magazine_id") or ""))
        else:
            # SAFEGUARD: decide publish status via the data-driven two-tier logic
            # (live = auto-publish, approved = review queue, draft = human only).
            art["status"] = decide_tier(publish_settings or {}, art)
        try:
            with db_conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO article (id, ingress, source_url, source_name, title, summary, status, magazine_id, published_at, image_url, subcategory)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (source_url) DO NOTHING
                    """,
                    (
                        art["id"],
                        "autonomous",
                        art["source_url"],
                        art.get("source_name") or None,
                        art["title"],
                        art.get("summary", ""),
                        art.get("status", "draft"),  # live | approved | draft (two-tier)
                        art.get("magazine_id"),  # may be None for YAML-config sources w/o mag
                        art.get("published"),
                        art.get("image_url"),  # may be None when no image found
                        art.get("subcategory"),  # 'Releases' or magazine subcategory
                    ),
                )
                if cur.rowcount > 0:
                    inserted += 1
                    # NOTIFICATION: auto-trigger 'new_article' notifications for
                    # users who follow this magazine.
                    mag_id = art.get("magazine_id")
                    if mag_id:
                        try:
                            with db_conn.cursor() as nf_cur:
                                nf_cur.execute(
                                    "SELECT user_id FROM user_follow WHERE magazine_id = %s",
                                    (mag_id,)
                                )
                                follower_ids = [r[0] for r in nf_cur.fetchall()]
                            if follower_ids:
                                ref_id = art.get("id", "")
                                title_short = art.get("title", "New article")[:80]
                                for uid in follower_ids:
                                    try:
                                        with db_conn.cursor() as ins_cur:
                                            ins_cur.execute(
                                                "INSERT INTO notification "
                                                "(user_id, type, title, body, reference_type, reference_id, read) "
                                                "VALUES (%s, 'new_article', %s, %s, 'article', %s, false)",
                                                (
                                                    uid,
                                                    title_short,
                                                    f"New article in {mag_id}: {title_short}",
                                                    ref_id,
                                                )
                                            )
                                    except Exception:
                                        pass  # per-user notif failure is non-fatal
                                logger.info(
                                    "  Notifications: %d follower(s) of %s alerted about '%s'",
                                    len(follower_ids), mag_id, title_short,
                                )
                        except Exception as notif_err:
                            logger.warning(
                                "  Notification creation failed for %s: %s",
                                art.get("title", "?"), notif_err,
                            )
        except Exception as exc:
            logger.warning("DB insert error for %s: %s", art.get("title", "?"), exc)
            db_conn.rollback()
            continue

    # Flush quality strikes collected during this batch (one per unsubstantial
    # article, grouped per source) so habitual offenders sink automatically.
    try:
        from collections import Counter
        strikes = Counter((sn, mid) for sn, mid in _quality_strikes if sn)
        for (sn, _mid), n in strikes.items():
            with db_conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE source
                       SET delete_count = COALESCE(delete_count,0) + %s,
                           last_delete_at = now(),
                           tune = CASE WHEN COALESCE(delete_count,0) + %s >= 15 THEN -5 ELSE tune END,
                           status = CASE WHEN COALESCE(delete_count,0) + %s >= 15 THEN 'paused' ELSE status END
                     WHERE name = %s AND COALESCE(status,'active') = 'active'
                    """,
                    (n, n, n, sn),
                )
        db_conn.commit()
    except Exception as exc:
        logger.warning("quality strike flush failed: %s", exc)
        try:
            db_conn.rollback()
        except Exception:
            pass

    db_conn.commit()
    return inserted


def run_discovery(configs: list[StreamConfig], db_url: str) -> dict:
    """Run the full discovery pipeline: scrape all sources, store to DB."""
    import psycopg2

    logger.info("Starting AI discovery pipeline...")
    # Load the data-driven taxonomy (magazine_taxonomy) as the authoritative
    # source for subcategory assignment, falling back to Python if DB has none.
    load_db_taxonomy(db_url)

    all_articles: list[dict] = []
    for cfg in configs:
        articles = scan_stream_sources(cfg)
        logger.info("  %s: found %d new articles", cfg.stream_id, len(articles))
        all_articles.extend(articles)

    # Also scan DB-backed sources added via the admin UI (Part B).
    db_articles = run_db_sources(configs, db_url)
    logger.info("DB-backed sources yielded %d articles total", len(db_articles))
    all_articles.extend(db_articles)

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
        publish_settings = load_publishing_settings(conn)
        inserted = insert_articles(conn, unique, publish_settings)
    finally:
        conn.close()

    result = {"found": len(all_articles), "unique": len(unique), "inserted": inserted}
    logger.info("Discovery complete: %d found, %d unique, %d inserted", result["found"], result["unique"], result["inserted"])
    return result