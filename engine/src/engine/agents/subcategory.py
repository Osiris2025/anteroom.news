"""
News Nexus subcategory classifier.

Deterministic, rule-based keyword assignment of an article (title + summary)
into a per-magazine subcategory taxonomy. Fast, free, reproducible — no LLM.

Design:
  * A taxonomy maps a magazine id -> ordered list of (subcategory_slug, [keywords]).
  * Order matters: the FIRST matching category wins (more specific rules are
    listed first; generic fallbacks later).
  * Matching is case-insensitive substring match on the lowercased
    title + summary.
  * Not all articles match — unmatched return None and stay untagged
    (can be set manually in Dispatch, or refined later with more keywords).

Add / refine keywords below. Keep slugs kebab-case and single words where possible.
"""

import re

MAGAZINE_TAXONOMY: dict[str, list[tuple[str, list[str]]]] = {
    # ------------------------------------------------------------------ #
    # The Veil — "Backstage of the unseen" (Mysteries realm seeker door)
    # ------------------------------------------------------------------ #
    "the-veil": [
        ("consciousness", [
            "consciousness", "conscious", "mind-wandering", "self-awareness",
            "theory of mind", "neural correlate", "awareness", "lucid", "dream",
            "interoception", "mindfulness", "present moment", "flow state",
        ]),
        ("meditation", [
            "meditation", "meditate", "contemplative", "breathwork", "breathing",
            "mindful", "vipassana", "samatha", "zazen", "metta", "loving-kindness",
            "meditative", "inner calm", "focus your busy mind", "grounding",
        ]),
        ("energy-healing", [
            "energy healing", "chakra", "aura", "reiki", "crystal", "crystals",
            "sound healing", "vibrational", "qi ", "chi ", "prana", "biomagnetic",
            "healing frequency", "kundalini", "karma", "meridians",
        ]),
        ("parapsychology", [
            "parapsycholog", "psi ", "telepathy", "precognition", "clairvoyance",
            "esp", "remote viewing", "psychic", "near-death", "ndfe", "mediumship",
            "psi research", "intuition", "sixth sense",
        ]),
        ("buddhism", [
            "buddhist", "buddhism", "bodhisattva", "dharma", "sangha", "ruche",
            "tibetan", "zen", "buddha", "sutra", "sabbath grace", "shikantaza",
        ]),
        ("wellbeing", [
            "well-being", "wellbeing", "wellnes", "burnout", "stress", "resilience",
            "happiness", "flourish", "meaning", "japanese art", "inner", "calm",
            "healing", "therapy", "emotional", "mental health", "positive",
        ]),
        ("brain-science", [
            "neurosci", "brain", "neural", "neuroplastic", "cortex", "amygdala",
            "hippocamp", "cognitive", "memory", "aging brain", "prefrontal",
        ]),
    ],
    # ------------------------------------------------------------------ #
    # AI Frontier (neural-hardware) — "AI. Cyber. Compute."
    # Order matters (first match wins): security is checked BEFORE agents/tools so
    # "hackers abuse an AI agent" lands in Security & Attacks, and the broad
    # catch-all buckets (tools, society) come last. Articles no keyword places
    # are sent to the cheap LLM fallback (see llm_fallback_subcategories).
    # Labels/descriptions: frontend/src/lib/subcategories.json.
    # ------------------------------------------------------------------ #
    "neural-hardware": [
        ("security-attacks", [
            "cyberattack", "cyber attack", "cybersecurity", "cybercrim", "hacker", "hacked", "hacking",
            "breach", "ransomware", "malware", "infostealer", "info stealing", "spyware", "botnet",
            "phishing", "vulnerabilit", "exploit", "zero-day", "zero day", "cve-", "patch tuesday",
            "security flaw", "security update", "backdoor", "supply chain attack", "ddos", "data leak",
            "credential", "privilege escalation", "jailbreak", "prompt injection", "red team",
            "threat actor", "apt group", "scam", "fraud", "cisa", "trojan", "rootkit",
        ]),
        ("safety-risk", [
            "ai safety", "alignment", "misalign", "rogue agent", "rogue ai", "existential", "x-risk",
            "superintelligence", "superalignment", "preparedness", "too dangerous", "safety research",
            "safety team", "chain of thought monitoring", "sandbox escape", "escape their sandbox",
            "deceptive", "scheming", "catastrophic risk",
        ]),
        ("politics-policy", [
            "regulation", "regulator", "ai act", "executive order", "congress", "senate", "legislat",
            "lawmaker", "white house", "trump", "pentagon", "department of defense", "military",
            "national security", "export control", "sanction", "lawsuit", "sues ", "sued", "court",
            "judge", "copyright", "attorney general", "subpoena", "ftc", "fcc", "antitrust",
            "european commission", "eu ", "government", "governor", "election", "policy",
        ]),
        ("chips-hardware", [
            "gpu", "h100", "h200", "b200", "b300", "blackwell", "rubin", "a100", "nvidia", "amd ",
            "tsmc", "semiconductor", "chip", "silicon", "foundry", "fpga", "asic", "tpu", "npu", "hbm",
            "processor", "cpu", "threadripper", "xeon", "epyc", "snapdragon", "datacenter",
            "data center", "data centre", "server", "workstation", "rack", "cooling", "power grid",
            "gigawatt", "megawatt", "compute cluster", "supercomputer", "robot", "humanoid",
        ]),
        ("reviews", [
            "review", "hands-on", "hands on", " vs ", " vs. ", "versus", "compared", "comparison",
            "tested", "we tried", "i tried", "how to ", "guide", "tutorial", "tips", "walkthrough",
            "getting started", "best practices", "demystified", "explained",
        ]),
        ("ai-companies", [
            "funding", "raises", "raised", "valuation", "series a", "series b", "series c", "seed round",
            "acquisition", "acquire", "acquires", "merger", "ipo", "revenue", "earnings", "investors",
            "investment", "partnership", "partners with", "ceo", "cfo", "executive", "hires", "hired",
            "joins", "leaves", "departure", "layoff", "pricing", "price cut", "price reduction",
            "subscription", "opens office", "office in", "startup", "unicorn",
        ]),
        ("models-research", [
            "model", "llm", "large language model", "foundation model", "open-weight", "open weight",
            "weights", "benchmark", "reasoning", "parameter", "context window", "multimodal",
            "paper", "arxiv", "research", "researchers", "training", "fine-tun", "rlhf",
            "reinforcement learning", "dataset", "synthetic data", "distillation", "scaling law",
            "embedding", "theorem", "conjecture",
        ]),
        ("tools-agents", [
            "agent", "agentic", "assistant", "chatbot", "copilot", "cursor", "codex", "claude code",
            "plugin", "extension", "mcp", "model context protocol", "api ", "apis", "sdk", "app ",
            "apps", "feature", "launch", "introduc", "rolls out", "now available", "integration",
            "workflow", "tool", "browser",
        ]),
        ("society-culture", [
            "jobs", "workers", "employment", "education", "students", "school", "teacher", "health",
            "therapy", "relationship", "film", "movie", "actor", "art", "artist", "music", "writer",
            "ethic", "opinion", "essay", "culture", "society", "public", "survey", "poll",
        ]),
    ],
    # ------------------------------------------------------------------ #
    # Dark Matter — "The universe's deepest mysteries."
    # ------------------------------------------------------------------ #
    "dark-matter": [
        ("black-holes", [
            "black hole", "blackhole", "event horizon", "singularity", "supermassive",
            "binary black hole", "hawking",
        ]),
        ("dark-matter-energy", [
            "dark matter", "dark energy", "wimp", "axion", "cosmological",
            "cosmology", "expansion of the universe",
        ]),
        ("exoplanets", [
            "exoplanet", "extrasolar", "habitable", "kepler", "tidally locked",
            "rocky world", "temperate",
        ]),
        ("gravitational-waves", [
            "gravitational wave", "ligo", "virgo", "einstein telescope", "merger",
        ]),
        ("stars", [
            "star", "supernova", "neutron star", "white dwarf", "pulsar", "red giant",
            "stellar", "stellar stream", "nucleosynthesis",
        ]),
        ("cosmic-webs", [
            "galaxy", "galaxies", "galactic", "filament", "large-scale structure",
            "reionization", "quasar", "agn ", "andromeda", "milky way",
        ]),
        ("history-instruments", [
            "telescope", "jwst", "webb", "hubble", "nasa mission", "rover", "probe",
            "juno", "voyager", "perseverance", "curiosity", "artemis", "spacex",
            "blue origin", "rocket", "launch", "iss ", "space station", "eclipse",
            "meteor", "aurora", "northern light", "aurora borealis",
        ]),
    ],
}


def _kw_regex(kw: str) -> "re.Pattern[str]":
    """Compile one keyword. A keyword that starts with a letter/digit must start at
    a word boundary ("ban" no longer matches "urban", "api" no longer matches
    "capital"), but it may still be a prefix ("vulnerabilit" matches
    "vulnerability"). Keywords that start with a space/punctuation match as-is."""
    pat = _KW_CACHE.get(kw)
    if pat is None:
        esc = re.escape(kw)
        pat = re.compile(("(?<![a-z0-9])" + esc) if kw[:1].isalnum() else esc)
        _KW_CACHE[kw] = pat
    return pat


_KW_CACHE: dict[str, "re.Pattern[str]"] = {}


def taxonomy_for(magazine_id: str | None) -> list[tuple[str, list[str]]]:
    """The active (DB override or built-in) taxonomy for a magazine, or []."""
    if not magazine_id:
        return []
    return _overrides.get(magazine_id) or MAGAZINE_TAXONOMY.get(magazine_id) or []


def classify_article(magazine_id: str | None, title: str | None, summary: str | None) -> str | None:
    """Return the best-matching subcategory slug for an article, or None.

    Scans the taxonomy of `magazine_id` in order and returns the FIRST category
    whose any keyword appears in title+summary (case-insensitive; keywords match
    from a word start, see _kw_regex). Uses the data-driven override if present
    (set via set_taxonomy_overrides); otherwise the built-in MAGAZINE_TAXONOMY.
    """
    if not magazine_id or not title:
        return None
    tax = taxonomy_for(magazine_id)
    if not tax:
        return None
    corpus = (title or "").lower()
    if summary:
        corpus += " " + summary.lower()
    for slug, keywords in tax:
        for kw in keywords:
            if kw and _kw_regex(kw.lower()).search(corpus):
                return slug
    return None


# ---------------------------------------------------------------------------
# Cheap LLM fallback for articles the keywords can't place.
# One OpenRouter call per batch of up to 25 articles of the same magazine; the
# model may only answer with one of that magazine's slugs (anything else is
# ignored and the article stays untagged). Disabled with SUBCAT_LLM_FALLBACK=0.
# ---------------------------------------------------------------------------
SUBCAT_LLM_MODEL_DEFAULT = "deepseek/deepseek-v4-flash-0731"
_SUBCAT_META: dict | None = None


def _subcat_meta() -> dict:
    """Labels/descriptions shared with the frontend (subcategories.json)."""
    global _SUBCAT_META
    if _SUBCAT_META is None:
        import json
        import os
        _SUBCAT_META = {}
        here = os.path.dirname(os.path.abspath(__file__))
        for p in (os.environ.get("SUBCATEGORIES_PATH"), "/app/subcategories.json",
                  os.path.join(here, "../../../../frontend/src/lib/subcategories.json")):
            if p and os.path.exists(p):
                try:
                    with open(p) as fh:
                        _SUBCAT_META = json.load(fh)
                    break
                except Exception:
                    pass
    return _SUBCAT_META


def subcategory_label(magazine_id: str | None, slug: str) -> str:
    meta = _subcat_meta()
    m = (meta.get("magazines") or {}).get(magazine_id or "", {}).get(slug)
    if m and m.get("label"):
        return m["label"]
    if slug in (meta.get("labels") or {}):
        return meta["labels"][slug]
    return " ".join(w.capitalize() for w in re.split(r"[-_]", slug))


def _subcat_description(magazine_id: str, slug: str, keywords: list[str]) -> str:
    m = (_subcat_meta().get("magazines") or {}).get(magazine_id, {}).get(slug) or {}
    return m.get("description") or ("keywords: " + ", ".join(keywords[:12]))


def llm_fallback_subcategories(items: list[dict], max_items: int | None = None) -> dict[str, str]:
    """items: [{id, magazine_id, title, summary}] that keywords could not place.
    Returns {article_id: slug}. Never raises; returns {} when disabled/no key."""
    import json
    import os
    if os.environ.get("SUBCAT_LLM_FALLBACK", "1").strip().lower() in ("0", "false", "off", "no"):
        return {}
    key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("LLM_API_KEY")
    if not key or not items:
        return {}
    limit = max_items if max_items is not None else int(os.environ.get("SUBCAT_LLM_MAX", "150"))
    model = os.environ.get("SUBCAT_LLM_MODEL", SUBCAT_LLM_MODEL_DEFAULT)
    try:
        import httpx
    except Exception:
        return {}

    by_mag: dict[str, list[dict]] = {}
    for it in items[:limit]:
        if taxonomy_for(it.get("magazine_id")):
            by_mag.setdefault(it["magazine_id"], []).append(it)

    out: dict[str, str] = {}
    for mag, arts in by_mag.items():
        tax = taxonomy_for(mag)
        slugs = [s for s, _ in tax]
        system = (
            "You file news articles into ONE subcategory of a magazine section. Allowed slugs:\n"
            + "\n".join(f"- {s}: {_subcat_description(mag, s, kw)}" for s, kw in tax)
            + '\nReply with JSON only: {"results":[{"i":<number>,"sub":"<slug>"}]}, one entry per article.'
        )
        for k in range(0, len(arts), 25):
            batch = arts[k:k + 25]
            user = "\n\n".join(
                f"[{i}] {a.get('title') or ''}\n{(a.get('summary') or '')[:300]}" for i, a in enumerate(batch)
            )
            try:
                resp = httpx.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {key}", "X-Title": "Anteroom subcategories"},
                    json={"model": model, "temperature": 0, "response_format": {"type": "json_object"},
                          "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]},
                    timeout=60,
                )
                resp.raise_for_status()
                txt = (resp.json()["choices"][0]["message"]["content"] or "").strip()
                txt = re.sub(r"^```(?:json)?|```$", "", txt).strip()
                for r in json.loads(txt).get("results", []):
                    i = int(r.get("i", -1))
                    sub = str(r.get("sub") or "").strip()
                    if 0 <= i < len(batch) and sub in slugs:
                        out[batch[i]["id"]] = sub
            except Exception:
                continue
    return out


# Data-driven taxonomy override support. The magazine_taxonomy table (loaded from
# the DB by the ingest path) becomes authoritative WHEN PRESENT; the built-in
# MAGAZINE_TAXONOMY remains the safe fallback so ingest never breaks.
_overrides: dict[str, list[tuple[str, list[str]]]] = {}


def set_taxonomy_overrides(overrides: dict[str, list[tuple[str, list[str]]]]) -> None:
    """Merge/value a data-driven taxonomy from the DB. Magazines absent from
    `overrides` keep their built-in (static) taxonomy."""
    _overrides.update(overrides)
