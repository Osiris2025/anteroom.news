"""Clean article titles and summaries before they are stored or sent to the AI.

Feeds hand us HTML fragments, double-encoded entities (&amp;lt;i&amp;gt;),
editorial marks ([UPDATED], [VIDEO], (PHOTOS)) and aggregator footers from
Reddit / Hacker News / Slashdot ("[link] [comments]", "Discuss", "Link",
"submitted by /u/x", "Comments URL: ..."). None of that belongs in a title or a
summary. Mirrors frontend/src/lib/cleanText.ts — keep the two in step.
"""
from __future__ import annotations

import html
import re

_TAG_RE = re.compile(r"<\s*/?\s*[a-zA-Z][^<>]*>|<!--.*?-->", re.S)
_BLOCK_TAG_RE = re.compile(r"<\s*(?:br|/p|/div|/li|/h[1-6])\b[^>]*>", re.I)
_SCRIPT_RE = re.compile(r"<(script|style)\b.*?</\1\s*>", re.I | re.S)

# Editorial marks: bracketed/parenthesised tags at the start or end of a title.
_MARK_WORDS = (
    r"updated?|update \d+|video|photos?|gallery|watch|listen|audio|podcast|live|"
    r"breaking|exclusive|opinion|analysis|sponsored|ad|paid|pdf|infographic|"
    r"interactive|corrected|correction|editor'?s note|developing|paywall(?:ed)?|"
    r"oc|serious|meta|discussion|news|video inside|nsfw"
)
_LEAD_MARK_RE = re.compile(rf"^\s*(?:[\[\(]\s*(?:{_MARK_WORDS})\s*[\]\)]\s*[:\-–—]?\s*)+", re.I)
_TAIL_MARK_RE = re.compile(rf"(?:\s*[\[\(]\s*(?:{_MARK_WORDS})\s*[\]\)])+\s*$", re.I)
_MARKDOWN_RE = re.compile(r"(\*\*|__|`)")

# Aggregator / RSS footer boilerplate (summaries only).
_FOOTER_PATTERNS = [
    r"submitted\s+by\s+/?u/[\w-]+(?:\s+to\s+/?r/[\w-]+)?",
    r"\[\s*link\s*\]",
    r"\[\s*comments?\s*\]",
    r"\[\s*\d+\s+comments?\s*\]",
    r"\b(?:Article|Comments)\s+URL:\s*\S+",
    r"\bPoints:\s*\d+",
    r"#\s*Comments:\s*\d+",
    r"\b(?:Read|Continue reading|Read more|Read the full (?:story|article))(?:\s+(?:at|on)\s+[\w .'-]+?)?\s*(?:\.\.\.|…|»|→)?\s*$",
    r"\bThe post .{3,200}? appeared first on .{2,120}?\.?\s*$",
    r"\bThis article (?:was )?originally appeared on .{2,120}?\.?\s*$",
    r"(?-i:\b(?:Discussion|Discuss|Link|Comments?|Share|Permalink)(?:\s*(?:\||·|•)\s*(?:Discussion|Discuss|Link|Comments?|Share|Permalink))*)\s*$",
    r"(?-i:^\s*(?:Discussion|Discuss|Link))\s*(?:\||·|•|:)\s*",
    r"\[\s*Reddit r/[\w-]+\s*\]",
]
_FOOTER_RE = [re.compile(p, re.I) for p in _FOOTER_PATTERNS]


def _decode(text: str) -> str:
    # Decode repeatedly so double-encoded entities (&amp;lt;i&amp;gt;) fully resolve.
    for _ in range(3):
        nxt = html.unescape(text)
        if nxt == text:
            break
        text = nxt
    return text


def strip_html(text: str) -> str:
    """Remove tags (including ones hidden behind entities) and decode entities."""
    if not text:
        return ""
    text = _SCRIPT_RE.sub(" ", text)
    text = _BLOCK_TAG_RE.sub(" ", text)
    text = _TAG_RE.sub("", text)
    text = _decode(text)          # entity-encoded tags become real tags here...
    text = _SCRIPT_RE.sub(" ", text)
    text = _BLOCK_TAG_RE.sub(" ", text)
    text = _TAG_RE.sub("", text)  # ...so strip again
    text = text.replace("\u00a0", " ").replace("\u200b", "")
    return text


def _collapse(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def clean_title(title: str) -> str:
    t = _collapse(strip_html(title or ""))
    t = _MARKDOWN_RE.sub("", t)
    prev = None
    while prev != t:
        prev = t
        t = _LEAD_MARK_RE.sub("", t)
        t = _TAIL_MARK_RE.sub("", t)
        t = t.strip()
    return _collapse(t)


def clean_summary(summary: str) -> str:
    s = _collapse(strip_html(summary or ""))
    prev = None
    while prev != s:
        prev = s
        for rx in _FOOTER_RE:
            s = rx.sub(" ", s)
        s = _collapse(s).strip(" |·•-–—")
    return s
