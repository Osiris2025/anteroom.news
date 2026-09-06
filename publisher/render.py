"""Turn an article row into per-platform post copy.

Keeps the magazine's voice: a hook line (headline if set, else title) + a short
teaser from the summary + the canonical article link. Never dumps the full
commentary — tease it, link out.

Character caps (approximate, per platform):
  X        280
  Bluesky  300
  LinkedIn ~1300 (we stay well under)
"""
from __future__ import annotations

import re

from .config import Config

# Per-platform max text length for the visible post body (without the link).
MAX_TEXT = {
    "x": 280,
    "bluesky": 300,
    "linkedin": 1300,
}

# Magazine name -> short, on-brand opener. Fallback below.
MAGAZINE_OPENERS = {
    "weekly-weird-news": "In today's Weekly Weird News:",
    "weird-and-wild": "This one's wild —",
    "ai-frontier": "AI Frontiers:",
    "tech-pulse": "Tech Pulse:",
    "poli-split": "Political Picture:",
    "political picture": "Political Picture:",
    "climate-watch": "Climate Watch:",
    "startup-signal": "Startup Signal:",
    "oss-report": "Open Source Report:",
    "starfall-weekly": "Starfall Weekly:",
    "vital-sign": "Vital Signs:",
    "vital signs": "Vital Signs:",
}
DEFAULT_OPENER = "From Anteroom:"


def _slugify(value: str) -> str:
    return value.strip().lower().replace(" ", "-")


def render_post(article: dict, config: Config, platform: str) -> str:
    """Build the final post text for a platform.

    `article` is a dict with keys: id, title, headline, summary, magazine_name,
    commentary (optional). Returns a string with the link already appended.
    """
    platform = platform.lower()
    cap = MAX_TEXT.get(platform, 280)

    _TAG_RE = re.compile(r"</?[a-zA-Z_][a-zA-Z0-9_]*>")
    hook = _TAG_RE.sub("", (article.get("headline") or "").strip() or (article.get("title") or "").strip()).strip()
    summary = _TAG_RE.sub("", (article.get("summary") or "").strip()).strip()

    mag = (article.get("magazine_name") or "").strip()
    key = mag.lower()
    opener = MAGAZINE_OPENERS.get(key) or MAGAZINE_OPENERS.get(_slugify(key)) or DEFAULT_OPENER

    url = config.article_url(article["id"])

    # Start with opener + hook, then a short teaser if room, then the link.
    body = f"{opener} {hook}".strip()
    if summary and len(body) + len(summary) + 1 <= cap:
        body = f"{body}\n\n{summary}".strip()
    else:
        # Teaser clip so we still hint without overflowing.
        room = cap - len(body) - 1
        if room > 20:
            teaser = summary[:room]
            if len(summary) > room:
                teaser = teaser.rsplit(" ", 1)[0].rstrip(".,;: ") + "\u2026"
            else:
                teaser = teaser.rstrip()
            body = f"{body}\n\n{teaser}".strip()

    # Ensure the link fits; the link is the whole point, so truncate prose to fit.
    link_len = len(url) + 2  # blank line + url
    if len(body) + link_len > cap:
        room = cap - link_len - 1
        body = body[:room].rsplit(" ", 1)[0].rstrip(".,;: ") + "\u2026"
    return f"{body}\n\n{url}"


def render_hashtags(article: dict, platform: str) -> str:
    """Optional: return a small set of hashtags. Keep minimal to avoid looking spammy."""
    return ""
