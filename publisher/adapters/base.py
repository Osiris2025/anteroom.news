"""Base class for platform adapters + the adapter registry."""
from __future__ import annotations

from typing import Any

from ..config import Config


class BaseAdapter:
    platform = "base"

    def __init__(self, config: Config):
        self.config = config

    def post(self, post_row: dict[str, Any], text: str, media_path: str | None = None) -> dict[str, str]:
        """Publish the post. Return {'post_id': ..., 'post_url': ...}.

        Must raise on any failure so the caller marks the row 'failed'.
        """
        raise NotImplementedError

    def dry_run(self, text: str, media_path: str | None = None) -> None:
        print(f"[dry-run:{self.platform}] would post: {text!r} media={media_path!r}")


def get_adapter(platform: str, config: Config) -> BaseAdapter:
    from . import x as _x
    from . import bluesky as _b
    from . import linkedin as _l

    registry = {
        "x": _x.XAdapter,
        "bluesky": _b.BlueskyAdapter,
        "linkedin": _l.LinkedInAdapter,
    }
    p = platform.lower()
    if p not in registry:
        raise ValueError(f"Unknown platform: {platform}")
    return registry[p](config)
