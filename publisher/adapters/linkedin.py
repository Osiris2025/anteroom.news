"""LinkedIn adapter via the simple-share REST API (own page / UGC post).

Credentials: LINKEDIN_TOKEN env var (OAuth access token with
w_member_social scope). The person URN can be supplied via person_urn on the
adapter (default: derive from /me). Posting to a company Page requires the page
URN + different endpoint — see comments.
"""
from __future__ import annotations

import urllib.request
from typing import Any

from .base import BaseAdapter
from ..config import Config

API = "https://api.linkedin.com/v2"


class LinkedInAdapter(BaseAdapter):
    platform = "linkedin"

    def __init__(self, config: Config, person_urn: str | None = None):
        super().__init__(config)
        self._person_urn = person_urn

    def _person(self) -> str:
        if self._person_urn:
            return self._person_urn
        req = urllib.request.Request(
            f"{API}/userinfo",
            headers={"Authorization": f"Bearer {self.config.linkedin_token}"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            import json
            data = json.loads(resp.read())
            sub = data.get("sub", "")
            return f"urn:li:person:{sub}"

    def post(self, post_row: dict[str, Any], text: str, media_path: str | None = None) -> dict[str, str]:
        if self.config.disabled:
            raise RuntimeError("SOCIAL_DISABLED=1")
        if not self.config.linkedin_token:
            raise RuntimeError("LINKEDIN_TOKEN not set")

        author = self._person()
        import json as _json

        payload = {
            "author": author,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": text},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }
        body = _json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{API}/ugcPosts",
            data=body,
            headers={
                "Authorization": f"Bearer {self.config.linkedin_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            import json as _j2
            data = _j2.loads(raw)
            post_id = str(data.get("id", ""))
            post_url = f"https://www.linkedin.com/feed/update/{post_id}" if post_id else ""
            return {"post_id": post_id, "post_url": post_url}

    def dry_run(self, text: str, media_path: str | None = None) -> None:
        super().dry_run(text, media_path)