"""Bluesky adapter via the official `atproto` client (optional dependency).

Install: pip install atproto
Credentials: BLUESKY_HANDLE + BLUESKY_APP_PASSWORD env vars.

Clickable links: Bluesky only renders a URL as a tappable link when the post
record carries a richtext facet (byte range + External link). Plain-text URLs
in a facet-less record render inert on many clients, so we always build facets
for detected URLs and attach an External embed (link card) when no photo.
"""
from __future__ import annotations

import re
import urllib.parse
import urllib.request
from typing import Any

from .base import BaseAdapter
from ..config import Config

_URL_RE = re.compile("https?://[^\\s<>\"]+")
_TAG_RE = re.compile(r"</?[a-zA-Z_][a-zA-Z0-9_]*>")
_MAX_THUMB_BYTES = 950_000  # Bluesky blob limit is ~1 MB
_UA = "Mozilla/5.0 (compatible; AnteroomSocial/1.0)"


def _clip(value: str, limit: int) -> str:
    value = _TAG_RE.sub("", value or "").strip()
    if len(value) <= limit:
        return value
    return value[: limit - 1].rsplit(" ", 1)[0].rstrip(".,;: ") + "\u2026"


def _article_meta(config: Config, article_id: str | None) -> dict[str, str] | None:
    """Real headline + summary for the link card, or None (caller falls back)."""
    if not article_id or not config.database_url:
        return None
    try:
        import psycopg2
        conn = psycopg2.connect(config.database_url)
        with conn.cursor() as cur:
            cur.execute("SELECT headline, title, summary, image_url FROM article WHERE id = %s", (article_id,))
            r = cur.fetchone()
        conn.close()
        if not r:
            return None
        title = _clip(r[0] or r[1] or "", 200)
        if not title:
            return None
        return {"title": title, "description": _clip(r[2] or "", 300), "image_url": (r[3] or "").strip()}
    except Exception:
        return None


def _photo_thumb(client: Any, image_url: str):
    """Upload the article's own photo as the card thumb; None if anything fails.

    Large photos are shrunk with Pillow (if installed) so they fit Bluesky's size limit.
    """
    if not image_url.startswith("http"):
        return None
    try:
        req = urllib.request.Request(image_url, headers={"User-Agent": _UA})
        with urllib.request.urlopen(req, timeout=20) as resp:
            if not (resp.headers.get("Content-Type") or "").startswith("image/"):
                return None
            data = resp.read(15 * 1024 * 1024)
        if len(data) < 1000:
            return None
        if len(data) > _MAX_THUMB_BYTES:
            import io
            from PIL import Image  # optional; without it we fall back to the OG card
            img = Image.open(io.BytesIO(data)).convert("RGB")
            img.thumbnail((1200, 1200))
            for quality in (85, 75, 65, 55):
                buf = io.BytesIO()
                img.save(buf, "JPEG", quality=quality, optimize=True)
                if buf.tell() <= _MAX_THUMB_BYTES:
                    data = buf.getvalue()
                    break
            else:
                return None
        return client.upload_blob(data).blob
    except Exception:
        return None


def _og_thumb(client: Any, config: Config, article_id: str | None):
    """Upload the site's OG image as the card thumb; None if anything fails."""
    if not article_id or not config.site_base_url:
        return None
    try:
        og = f"{config.site_base_url}/api/og?articleId={urllib.parse.quote(article_id, safe='')}"
        req = urllib.request.Request(og, headers={"User-Agent": _UA})
        with urllib.request.urlopen(req, timeout=20) as resp:
            if not (resp.headers.get("Content-Type") or "").startswith("image/"):
                return None
            data = resp.read(_MAX_THUMB_BYTES + 1)
        if len(data) < 1000 or len(data) > _MAX_THUMB_BYTES:
            return None
        return client.upload_blob(data).blob
    except Exception:
        return None  # never block a post over a thumbnail


def _build_facets_and_embed(client: Any, text: str, meta: dict[str, str] | None = None,
                            thumb: Any = None):
    """Return (facets, embed) for a post text.

    - Every URL in the text gets a link facet -> tappable everywhere.
    - The LAST URL additionally gets an External embed (link card preview),
      titled from `meta` (article headline/summary) when available.
    """
    from atproto import models
    from atproto_client.models.app.bsky.richtext.facet import ByteSlice, Main as FacetMain, Link

    facets = []
    last_url = None
    for m in _URL_RE.finditer(text):
        url = m.group(0)
        # byte offsets (utf-8), NOT python char offsets
        b_start = len(text[: m.start()].encode("utf-8"))
        b_end = b_start + len(url.encode("utf-8"))
        facets.append(FacetMain(
            index=ByteSlice(byte_start=b_start, byte_end=b_end),
            features=[Link(uri=url)],
        ))
        last_url = url

    embed = None
    if last_url:
        try:
            embed = models.AppBskyEmbedExternal.Main(
                external=models.AppBskyEmbedExternal.External(
                    uri=last_url,
                    title=(meta or {}).get("title") or "Anteroom",
                    description=(meta or {}).get("description") or "Read the full story on Anteroom",
                    thumb=thumb,
                )
            )
        except Exception:
            embed = None

    return (facets or None), embed


class BlueskyAdapter(BaseAdapter):
    platform = "bluesky"

    def post(self, post_row: dict[str, Any], text: str, media_path: str | None = None) -> dict[str, str]:
        if self.config.disabled:
            raise RuntimeError("SOCIAL_DISABLED=1")
        try:
            from atproto import Client
        except ImportError as e:
            raise RuntimeError("Bluesky adapter needs `atproto`. pip install atproto") from e

        # Connection may come from the social_account table (DB) or env fallback
        acct = getattr(self.config, "db_accounts", {}).get("bluesky", {})
        handle = acct.get("handle") or self.config.bluesky_handle
        password = acct.get("app_password") or self.config.bluesky_password
        client = Client()
        client.login(handle, password)

        article_id = post_row.get("article_id")
        meta = _article_meta(self.config, article_id)
        thumb = None
        if meta:
            # The article's own photo first; the branded OG card is only the backup.
            thumb = _photo_thumb(client, meta.get("image_url", "")) or _og_thumb(client, self.config, article_id)
        facets, link_embed = _build_facets_and_embed(client, text, meta, thumb)

        embed = None
        # Real article card (headline + OG thumb) beats a plain image embed.
        if meta and link_embed is not None:
            embed = link_embed
        elif media_path:
            try:
                with open(media_path, "rb") as fh:
                    img_data = fh.read()
                upload = client.upload_blob(img_data)
                from atproto import models
                embed = models.AppBskyEmbedImages.Main(
                    images=[models.AppBskyEmbedImages.Image(alt="", image=upload.blob)]
                )
            except Exception:
                embed = None
        # No article card or photo -> attach the generic link card.
        if embed is None:
            embed = link_embed

        resp = client.send_post(text=text, facets=facets, embed=embed)
        uri = str(getattr(resp, "uri", ""))
        post_url = f"https://bsky.app/profile/{self.config.bluesky_handle}/post/{uri.rstrip('/').split('/')[-1]}" if uri else ""
        return {"post_id": uri, "post_url": post_url}

    def dry_run(self, text: str, media_path: str | None = None) -> None:
        super().dry_run(text, media_path)
