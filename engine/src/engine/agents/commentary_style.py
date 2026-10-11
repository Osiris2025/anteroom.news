"""
Shared commentary ("Just my opinion") style rules, validation and cleanup.

Mirrors frontend/src/lib/commentary.ts. Keep the two in sync: the frontend
uses it for the Commentary button, batch commentary and the link dropper; the
engine summarizer uses this module.
"""

import re

# Extra OpenRouter options for commentary calls. Low reasoning effort with the
# reasoning hidden stops the model pasting its own self-check notes ("Let me
# verify...", "That's about 165 words") into the answer, and is much cheaper.
# max_tokens includes the hidden reasoning tokens; the frontend's
# commentary-only calls use 2000 (1200 left ~1 call in 10 empty in testing).
# The engine call also writes a summary and ai_thoughts, so it gets more room.
REASONING = {"effort": "low", "exclude": True}
ENGINE_MAX_TOKENS = 2400

COMMENTARY_STYLE_RULES = (
    "How to write it:\n"
    "- 2 to 4 short paragraphs, about 120-220 words in total.\n"
    "- Plain conversational prose, as if you were telling a smart friend what you make of the story. First person is fine (\"I think\", \"I'd want to know\") but don't overdo it.\n"
    "- Vary how you open. Start with the most interesting concrete detail or your actual opinion. Do not open with \"What strikes me\", \"Here's the thing\", \"Let's be clear\" or \"In a world where\".\n"
    "- Say why the story matters, what it connects to, and where you land on it. Weave these together naturally; do not announce them.\n"
    "- Be specific to this story. Use concrete details from what you're given. Do not invent facts, numbers, names or quotes.\n"
    "- It's fine to be uncertain or to say what you'd want to know next.\n"
    "\n"
    "Avoid these, because they make the writing look machine-made:\n"
    "- No headings, labels or lead-ins such as \"Take:\", \"Why this matters:\", \"What connects:\", \"The bottom line:\", \"Closer:\".\n"
    "- No markdown at all: no asterisks, no bold or italics, no bullets, no numbered lists, no # headings, no links or URLs.\n"
    "- Never use the \"this isn't X, it's Y\" / \"that's not X; it's Y\" / \"the question isn't X. It's Y\" contrast, with any punctuation (comma, dash, semicolon or a new sentence), and no \"not just X, but Y\". Say what you think directly.\n"
    "- No slogan-style closing lines or punchlines. End on a plain, honest thought.\n"
    "- Use em dashes sparingly (at most one in the whole piece). Prefer commas and periods.\n"
    "- Avoid buzzwords like \"signal\", \"game-changer\", \"paradigm\", \"landscape\", \"double-edged sword\", \"make no mistake\".\n"
    "\n"
    "Output format: only the commentary text. Separate paragraphs with one blank line. No title, no sign-off, no JSON, no notes about what you wrote."
)

_RE_BOLD = re.compile(r"\*\*[^*\n]+\*\*|(^|\s)__[^_\n]+__")
_RE_ITALIC = re.compile(r"(^|[^\w*])\*[^*\s][^*\n]{0,80}\*(?=[^\w*]|$)", re.MULTILINE)
_RE_HEADING = re.compile(r"(^|\n)[ \t]{0,3}#{1,6}\s")
_RE_BULLET = re.compile(r"(^|\n)[ \t]*(?:[-*•]|\d+[.)])[ \t]+\S")
_LABEL_WORDS = (
    r"take|the take|my take|why (?:this|it) matters|what (?:connects|it signals|it means)|"
    r"the deeper truth|the real story|the numbers[^:\n]{0,30}|bottom line|the bottom line|closer|"
    r"the closer|verdict|kicker|the signal|context|connection"
)
_RE_LABEL = re.compile(rf"(^|\n)\s*(?:\*\*)?\s*(?:{_LABEL_WORDS})\s*(?:\*\*)?\s*:", re.IGNORECASE)
_RE_LABEL_LEAD = re.compile(rf"^\s*(?:{_LABEL_WORDS})\s*:\s*", re.IGNORECASE)
_RE_META = re.compile(
    r"(?:^|[.!?][\"”']?\s+)(?:let me (?:verify|double-check|finali[sz]e|re-?read|count|refine|structure|"
    r"re-?check|check (?:the|that|all|my|again))|wait, i (?:already|need|should)|"
    r"(?:that['’]s|this is) (?:about|roughly|around) \d+ words|checks?:\s|(?:the )?word count (?:is|looks|checks)|"
    r"no headings, no)",
    re.IGNORECASE,
)
_RE_LINK = re.compile(r"https?://\S+|\[[^\]]+\]\([^)]+\)")
_RE_CONTRAST = [
    # "X isn't A, it's B" / "isn't A—it's B" / "isn't A. It's B"
    re.compile(
        r"\b(?:isn['’]t|is not|wasn['’]t|aren['’]t|weren['’]t)\s+[^.;!?\n]{1,80}?(?:[,—–;]|\.\s)\s*"
        r"(?:it['’]s|it is|it was|this is|they['’]re|that['’]s)\s",
        re.IGNORECASE,
    ),
    # "That's not A; it's B" / "That's not A, that's B" / "That's not A. It's B"
    re.compile(
        r"\b(?:that|this|it)['’]s not (?:just )?[^.;!?\n]{1,60}?(?:[,—–;]|\.\s)\s*(?:it['’]s|it is|that['’]s)\s",
        re.IGNORECASE,
    ),
    # "not just A, but B"
    re.compile(r"\bnot (?:just|merely|simply|only) [^.;!?\n]{1,60},? but (?:also )?", re.IGNORECASE),
]


def _paragraphs(text: str) -> list:
    t = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    return [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n+", t) if p.strip()]


def validate_commentary(text: str) -> list:
    """Return a list of problems; an empty list means the text passes."""
    t = (text or "").strip()
    problems = []
    if len(t) < 120:
        problems.append("too short")
    if _RE_BOLD.search(t) or _RE_ITALIC.search(t) or _RE_HEADING.search(t) or _RE_BULLET.search(t):
        problems.append("markdown formatting (asterisks, headings or bullets)")
    if _RE_LABEL.search(t):
        problems.append('section labels like "Take:" or "Why this matters:"')
    if _RE_META.search(t):
        problems.append("notes about the writing itself (word counts, self-checks)")
    if _RE_LINK.search(t):
        problems.append("a URL or link")
    if any(r.search(t) for r in _RE_CONTRAST):
        problems.append('the "this isn\'t X, it\'s Y" / "not just X, but Y" construction')
    paras = _paragraphs(t)
    lowered = [p.lower() for p in paras]
    dup = len(set(lowered)) != len(lowered)
    if not dup and paras:
        first = paras[0][:80]
        if len(first) >= 40 and t.find(first, t.find(first) + len(first)) != -1:
            dup = True
    if dup:
        problems.append("repeated paragraphs")
    if len(paras) > 6:
        problems.append("too many paragraphs")
    return problems


def problem_examples(text: str, limit: int = 4) -> list:
    """Up to `limit` offending snippets (contrast lines, labels) to quote back on retry."""
    t = re.sub(r"\s+", " ", text or "")
    out = []
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z\"“])", t)
    i = 0
    while i < len(sentences) and len(out) < limit:
        sent = sentences[i]
        pair = sent + (" " + sentences[i + 1] if i + 1 < len(sentences) else "")
        if any(r.search(sent) for r in _RE_CONTRAST):
            out.append(sent.strip())
        elif any(r.search(pair) for r in _RE_CONTRAST):
            out.append(pair.strip())
            i += 1
        i += 1
    lab = re.search(rf"(?:\*\*)?\s*(?:{_LABEL_WORDS})\s*(?:\*\*)?\s*:", t, re.IGNORECASE)
    if lab and len(out) < limit:
        out.append(lab.group(0).strip())
    return [x[:217] + "..." if len(x) > 220 else x for x in out]


def _heading_sub(m):
    h = m.group(1).strip()
    return "\n" if len(h.split()) <= 8 else f"\n{h}\n"


def clean_commentary(raw: str) -> str:
    """Strip stray markdown, labels, URLs, HTML, self-check notes and duplicate paragraphs."""
    t = (raw or "").replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"```[a-z]*\s*[\s\S]*?```", "", t, flags=re.IGNORECASE)
    t = re.sub(r"<a\b[^>]*>([\s\S]*?)</a>", r"\1", t, flags=re.IGNORECASE)
    t = re.sub(r"<br\s*/?>", "\n", t, flags=re.IGNORECASE)
    t = re.sub(r"</?p\b[^>]*>", "\n\n", t, flags=re.IGNORECASE)
    t = re.sub(r"</?(?:a|b|strong|i|em|u|span|div|h[1-6]|ul|ol|li|blockquote|code)\b[^>]*>", "", t, flags=re.IGNORECASE)
    t = re.sub(r"^[ \t]{0,3}#{1,6}[ \t]+(.*)$", _heading_sub, t, flags=re.MULTILINE)
    t = re.sub(r"\n(?=[ \t]*(?:[-*•]|\d+[.)])[ \t]+\S)", "\n\n", t)
    t = re.sub(r"\*\*([^*\n]+?)\*\*", r"\1", t)
    t = re.sub(r"__([^_\n]+?)__", r"\1", t)
    t = re.sub(r"(^|[^\w*])\*([^*\s][^*\n]*?)\*(?=[^\w*]|$)", r"\1\2", t, flags=re.MULTILINE)
    t = re.sub(r"(^|[^\w_])_([^_\s][^_\n]*?)_(?=[^\w_]|$)", r"\1\2", t, flags=re.MULTILINE)
    t = re.sub(r"^[ \t]*(?:[-*•]|\d+[.)])[ \t]+", "", t, flags=re.MULTILINE)
    t = re.sub(r"\[([^\]]+)\]\((?:https?:)?[^)]+\)", r"\1", t)
    t = re.sub(r"(^|\n)[ \t]*(?:Source|Read more|Via)\s*:\s*\S+[ \t]*(?=\n|$)", r"\1", t, flags=re.IGNORECASE)
    t = re.sub(r"\s*\(?(?:Source|Via)\s*:\s*https?://[^\s)]+\)?", "", t, flags=re.IGNORECASE)
    t = re.sub(r"\s*\(https?://[^)\s]+\)", "", t)
    t = re.sub(r"\b(from|at|via|see|on)\s+https?://[^\s)]+", r"\1 the source", t, flags=re.IGNORECASE)
    t = re.sub(r"<a\b[^>]*$", "", t, flags=re.IGNORECASE)
    t = re.sub(r"https?://[^\s)]*", "", t)
    t = re.sub(r"\(\s*\)", "", t)
    t = re.sub(r"[ \t]+([.,;:])", r"\1", t)
    t = re.sub(r"(^|\s)\*\*(?=[^\s*])", r"\1", t)
    t = re.sub(r"(?<=[^\s*])\*\*(?=[\s.,;:!?]|$)", "", t)

    out, seen = [], set()
    for p in re.split(r"\n\s*\n+", t):
        p = re.sub(r"\s*\n\s*", " ", p)
        p = re.sub(r"\s{2,}", " ", p).strip()
        p = _RE_LABEL_LEAD.sub("", p)
        if p:
            p = p[0].upper() + p[1:]
        if not p or re.fullmatch(r"[\s.,;:—–-]*", p):
            continue
        if _RE_META.search(p):
            continue
        key = p.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return "\n\n".join(out)
