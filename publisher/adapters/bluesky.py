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
from typing import Any

from .base import BaseAdapter
from ..config import Config

_URL_RE = re.compile("https?://[^\\s<>\"]+")


def _build_facets_and_embed(client: Any, text: str):
    """Return (facets, embed) for a post text.

    - Every URL in the text gets a link facet -> tappable everywhere.
    - The LAST URL additionally gets an External embed (link card preview).
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
                    title="Anteroom",
                    description="Read the full story on Anteroom",
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

        facets, link_embed = _build_facets_and_embed(client, text)

        embed = None
        if media_path:
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
        # No photo -> attach the link card so the article preview renders.
        if embed is None:
            embed = link_embed

        resp = client.send_post(text=text, facets=facets, embed=embed)
        uri = str(getattr(resp, "uri", ""))
        post_url = f"https://bsky.app/profile/{self.config.bluesky_handle}/post/{uri.rstrip('/').split('/')[-1]}" if uri else ""
        return {"post_id": uri, "post_url": post_url}

    def dry_run(self, text: str, media_path: str | None = None) -> None:
        super().dry_run(text, media_path)
