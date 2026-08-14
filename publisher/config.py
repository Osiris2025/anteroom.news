"""Centralised configuration for the Nexus social publisher.

Reads everything from the environment (never hardcoded), so the same code runs
under Docker or bare systemd and on any domain.
"""
from __future__ import annotations

import os


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


class Config:
    """Immutable-ish config snapshot. Load once via Config.from_env()."""

    def __init__(self, env: dict[str, str] | None = None):
        e = env if env is not None else os.environ
        self.site_base_url = (e.get("SITE_BASE_URL") or "").rstrip("/")
        self.database_url = e.get("DATABASE_URL") or ""
        self.disabled = (e.get("SOCIAL_DISABLED") or "0").lower() in {"1", "true", "yes"}
        self.max_per_day = int(e.get("SOCIAL_MAX_PER_DAY") or "10")

        # Platform credentials
        self.bluesky_handle = e.get("BLUESKY_HANDLE") or ""
        self.bluesky_password = e.get("BLUESKY_APP_PASSWORD") or ""
        self.linkedin_token = e.get("LINKEDIN_TOKEN") or ""

        # Explicitly enabled platforms (comma-separated). Empty = allow those that
        # have credentials; used as a guard against accidental posting.
        raw = e.get("SOCIAL_PLATFORMS") or ""
        self.enabled_platforms: set[str] = {
            p.strip().lower() for p in raw.split(",") if p.strip()
        }

    # -- helpers ----------------------------------------------------------
    def article_url(self, article_id: str) -> str:
        if not self.site_base_url:
            raise ValueError("SITE_BASE_URL is not set")
        return f"{self.site_base_url}/articles/{article_id}"

    def platform_enabled(self, platform: str) -> bool:
        platform = platform.lower()
        if self.enabled_platforms:
            return platform in self.enabled_platforms
        # No explicit list: platform is enabled if it has credentials below.
        if platform == "x":
            return True  # xurl manages its own creds in ~/.xurl
        if platform == "bluesky":
            return bool(self.bluesky_handle and self.bluesky_password)
        if platform == "linkedin":
            return bool(self.linkedin_token)
        return False

    @classmethod
    def from_env(cls) -> "Config":
        return cls()
