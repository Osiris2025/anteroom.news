"""X (Twitter) adapter via the official `xurl` CLI.

Credentials live in ~/.xurl (OAuth2), managed by the user — never in env/chat.
We shell out to xurl so the token handling stays exactly as xurl expects.
"""
from __future__ import annotations

import json
import subprocess
from typing import Any

from .base import BaseAdapter
from ..config import Config


class XAdapter(BaseAdapter):
    platform = "x"

    def _xurl(self, *args: str, env_home: str | None = None) -> dict[str, Any]:
        env = dict(self.config_environ())
        if env_home:
            env["HOME"] = env_home
        proc = subprocess.run(
            ["xurl", *args],
            capture_output=True,
            text=True,
            env=env,
            timeout=120,
        )
        if proc.returncode != 0:
            raise RuntimeError(f"xurl failed ({proc.returncode}): {proc.stderr.strip() or proc.stdout.strip()}")
        try:
            return json.loads(proc.stdout) if proc.stdout.strip() else {}
        except json.JSONDecodeError:
            return {"raw": proc.stdout.strip()}

    def config_environ(self) -> dict[str, str]:
        return {}

    def _upload_media(self, path: str, env_home: str | None = None) -> str | None:
        """Upload media, return media_id, or None on failure."""
        if not path:
            return None
        result = self._xurl("media", "upload", path, env_home=env_home)
        data = result.get("data") or {}
        mid = data.get("media_id") or data.get("id")
        if mid:
            return str(mid)
        # Try raw shape
        if result.get("media_id_string"):
            return str(result["media_id_string"])
        return None

    def _username(self, env_home: str | None = None) -> str:
        try:
            r = self._xurl("whoami", env_home=env_home)
            data = r.get("data") or {}
            return str(data.get("username") or "")
        except Exception:
            return ""

    def post(self, post_row: dict[str, Any], text: str, media_path: str | None = None,
             env_home: str | None = None) -> dict[str, str]:
        if self.config.disabled:
            raise RuntimeError("SOCIAL_DISABLED=1")

        mid = self._upload_media(media_path, env_home=env_home) if media_path else None

        args = ["post", text]
        if mid:
            args += ["--media-id", mid]

        result = self._xurl(*args, env_home=env_home)
        data = result.get("data") or {}
        post_id = str(data.get("id") or "")
        if not post_id:
            raise RuntimeError(f"X did not return a post id: {result}")
        username = self._username(env_home)
        post_url = f"https://x.com/{username}/status/{post_id}" if username else f"https://x.com/i/status/{post_id}"
        return {"post_id": post_id, "post_url": post_url}

    def dry_run(self, text: str, media_path: str | None = None) -> None:
        super().dry_run(text, media_path)
