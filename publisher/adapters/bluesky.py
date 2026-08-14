"""Bluesky adapter via the official `atproto` client (optional dependency).

Install: pip install atproto
Credentials: BLUESKY_HANDLE + BLUESKY_APP_PASSWORD env vars.
"""
from __future__ import annotations

from typing import Any

from .base import BaseAdapter
from ..config import Config


class BlueskyAdapter(BaseAdapter):
    platform = "bluesky"

    def post(self, post_row: dict[str, Any], text: str, media_path: str | None = None) -> dict[str, str]:
        if self.config.disabled:
            raise RuntimeError("SOCIAL_DISABLED=1")
        try:
            from atproto import Client
        except ImportError as e:
            raise RuntimeError("Bluesky adapter needs `atproto`. pip install atproto") from e

        client = Client()
        client.login(self.config.bluesky_handle, self.config.bluesky_password)

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

        resp = client.send_post(text=text, embed=embed)
        uri = str(getattr(resp, "uri", ""))
        post_url = f"https://bsky.app/profile/{self.config.bluesky_handle}/post/{uri.rstrip('/').split('/')[-1]}" if uri else ""
        return {"post_id": uri, "post_url": post_url}

    def dry_run(self, text: str, media_path: str | None = None) -> None:
        super().dry_run(text, media_path)
