"""Shared magazine routing rules (engine side).

The rules live in ONE file shared with the frontend:
  frontend/src/lib/routing-rules.json   (mounted read-only at /app/routing-rules.json)
The frontend applies the same file in src/lib/routingRules.ts, so an article lands
in the same magazine whether it came from a feed, the Collect page, a "Save to
Anteroom" button or the admin link dropper.

Order (first rule that fires wins):
  1. NASA   -> Science Frontiers; money/contracts/building -> Just the News;
              purely theoretical/speculative -> Dark Matter
  2. AI     -> AI Frontier (article from, or naming, an AI model/agent/plugin publisher)
  3. AI security -> security-only sources (BleepingComputer): AI stories to AI Frontier,
              everything else to Tech Pulse
  4. Political -> Political Picture (clear politics pulled by a tech feed)
  5. Paranormal -> Weekly Weird News (ghosts/UFOs pulled for The Veil)
"""
from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

_HERE = os.path.dirname(os.path.abspath(__file__))
_CANDIDATE_PATHS = (
    os.environ.get("ROUTING_RULES_PATH"),
    "/app/routing-rules.json",
    os.path.join(_HERE, "../../../../frontend/src/lib/routing-rules.json"),
)


@dataclass
class Route:
    magazine_id: str
    rule: str      # nasa-science | nasa-money | nasa-theory | ai | ai-security | security-tech | political | paranormal
    detail: str = ""


class RoutingRules:
    def __init__(self, data: dict):
        self.data = data
        self.mags = data.get("magazines", {})
        n = data.get("nasa", {})
        self.nasa_hosts = [h.lower() for h in n.get("source_hosts", [])]
        self.nasa_names = {s.strip().lower() for s in n.get("source_names", [])}
        self.nasa_title = _rx(n.get("title_pattern"), n.get("title_flags"))
        self.nasa_theory = _rx(n.get("theoretical_pattern"), n.get("theoretical_flags"))
        self.nasa_money = _rx(n.get("money_pattern"), n.get("money_flags"))
        a = data.get("ai", {})
        self.ai_hosts = [h.lower() for h in a.get("publisher_hosts", [])]
        self.ai_names = {s.strip().lower() for s in a.get("publisher_source_names", [])}
        self.ai_title = _rx(a.get("title_pattern"), a.get("title_flags"))
        self.ai_excl = [(_rx(e.get("remove"), e.get("flags")), _rx(e.get("when"), e.get("flags")))
                        for e in a.get("exclusions", []) if e.get("remove")]
        s = data.get("ai_security", {})
        self.sec_hosts = [h.lower() for h in s.get("source_hosts", [])]
        self.sec_names = {x.strip().lower() for x in s.get("source_names", [])}
        self.sec_title = _rx(s.get("title_pattern"), s.get("title_flags"))
        self.sec_default = s.get("default_magazine") or self.mags.get("tech", "tech-pulse")

    # -- helpers ---------------------------------------------------------
    @staticmethod
    def _host_match(host: str, hosts: list[str]) -> bool:
        return any(host == h or host.endswith("." + h) for h in hosts)

    def ai_match(self, title: str, summary: str = "") -> str | None:
        """The AI company/product named in the headline (after exclusions), or None."""
        if not self.ai_title or not title:
            return None
        t = title
        ctx = f"{title} {summary or ''}"
        for remove, when in self.ai_excl:
            if when is None or when.search(ctx):
                t = remove.sub(" ", t)
        m = self.ai_title.search(t)
        return m.group(0) if m else None

    def is_nasa(self, host: str, source_name: str, title: str) -> bool:
        return (self._host_match(host, self.nasa_hosts)
                or source_name in self.nasa_names
                or bool(self.nasa_title and self.nasa_title.search(title)))

    # -- main ------------------------------------------------------------
    def route(self, title: str, summary: str = "", source_url: str = "", source_name: str = "") -> Route | None:
        title = title or ""
        host = _host(source_url)
        sname = (source_name or "").strip().lower()

        if self.is_nasa(host, sname, title):
            if self.nasa_theory and self.nasa_theory.search(title):
                return Route(self.mags.get("theory", "dark-matter"), "nasa-theory")
            m = self.nasa_money.search(title) if self.nasa_money else None
            if m:
                return Route(self.mags.get("news", "just-the-news-thats-fit-to-print"), "nasa-money", m.group(0))
            return Route(self.mags.get("science", "weird-and-wild"), "nasa-science")

        ai_mag = self.mags.get("ai", "neural-hardware")
        if self._host_match(host, self.ai_hosts) or sname in self.ai_names:
            return Route(ai_mag, "ai", "publisher source")
        term = self.ai_match(title, summary)
        if term:
            return Route(ai_mag, "ai", term)

        if self._host_match(host, self.sec_hosts) or sname in self.sec_names:
            m = self.sec_title.search(title) if self.sec_title else None
            if m:
                return Route(ai_mag, "ai-security", m.group(0))
            return Route(self.sec_default, "security-tech")
        return None


def _rx(pattern: str | None, flags: str | None):
    if not pattern:
        return None
    f = re.IGNORECASE if "i" in (flags or "") else 0
    return re.compile(pattern, f)


def _host(url: str) -> str:
    try:
        h = (urlparse(url or "").hostname or "").lower()
        return h[4:] if h.startswith("www.") else h
    except Exception:
        return ""


_RULES: RoutingRules | None = None


def load_rules(path: str | None = None) -> RoutingRules:
    """Load (and cache) the shared rules file. An unreadable file yields empty
    rules (routing is then a no-op) so ingest never breaks."""
    global _RULES
    if _RULES is not None and path is None:
        return _RULES
    data: dict = {}
    for p in ((path,) if path else _CANDIDATE_PATHS):
        if p and os.path.exists(p):
            try:
                with open(p) as fh:
                    data = json.load(fh)
                logger.info("Routing rules loaded from %s", p)
                break
            except Exception as exc:
                logger.warning("Routing rules unreadable at %s: %s", p, exc)
    if not data:
        logger.warning("No routing rules found; shared routing disabled")
    rules = RoutingRules(data)
    if path is None:
        _RULES = rules
    return rules


def route_article(article: dict, rules: RoutingRules | None = None) -> Route | None:
    """The shared-rules destination for an article dict, or None (keep its magazine)."""
    r = rules or load_rules()
    return r.route(article.get("title") or "", article.get("summary") or "",
                   article.get("source_url") or "", article.get("source_name") or "")


def apply_routing(article: dict, rules: RoutingRules | None = None) -> str | None:
    """Apply every routing rule to an article dict in place (sets magazine_id and
    clears a now-stale subcategory when the magazine changes). Returns the name of
    the rule that fired, or None."""
    from . import apply_political_route, apply_weird_route  # legacy keyword routes

    before = article.get("magazine_id")
    before_sub = article.get("subcategory")
    route = route_article(article, rules)
    rule = None
    if route:
        article["magazine_id"] = route.magazine_id
        rule = route.rule
    else:
        apply_political_route(article)
        if article.get("magazine_id") != before:
            rule = "political"
        else:
            apply_weird_route(article)
            if article.get("magazine_id") != before:
                rule = "paranormal"
    if article.get("magazine_id") != before and article.get("subcategory") == before_sub:
        article.pop("subcategory", None)  # stale tag from the old magazine: re-tag in the new one
    return rule
