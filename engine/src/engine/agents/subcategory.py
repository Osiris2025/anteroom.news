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
    # Neural Hardware — "AI. Cyber. Compute."
    # ------------------------------------------------------------------ #
    "neural-hardware": [
        # Agents / agentic AI (most specific agent-ish terms first)
        ("agents", [
            "ai agent", "agentic", "multi-agent", "autonomous agent", "agent platform",
            "computer use", "tool use", "computer use agent", "agent harness",
            "mcp ", "model context protocol", "openclaw", "lobster", "hermes agent",
            "claude agent", "deep research", "browser agent", "agentic ai",
        ]),
        # Cybersecurity / security / privacy / threats
        ("cybersecurity", [
            "cyber", "hack", "breach", "ransomware", "malware", "vulnerability",
            "exploit", "zero-day", "zero day", "phishing", "password", "encryption",
            "security", "privacy", "data leak", "data breach", "threat", "firewall",
            "red team", "cyberattack", "defense", "sandbox", "privilege escalation",
            "backdoor", "supply chain attack", "info stealing",
        ]),
        # Hardware / chips / datacenters
        ("hardware-datacenters", [
            "gpu", "gpus", "h100", "h200", "b200", "a100", "nvidia", "amd",
            "inference", "datacenter", "data center", "server", "silicon", "chip",
            "semiconductor", "tsmc", "foundry", "fpga", "asic", "quantum computer",
            "processor", "cpu", "tpu", "neural processing unit", "npu", "hbm",
            "power grid", "cooling", "liquid cooling", "power consumption",
            "compute cluster", "cluster", "energy",
        ]),
        # Open-source / OSS / licensing
        ("open-source", [
            "open source", "opensource", "open-weight", "open weight", "license",
            "apache 2.0", "mit license", "github", "hugging face", "huggingface",
            "repo", "open model", "open-llm", "contribute", "community edition",
        ]),
        # Models / LLMs / foundation models / reasoning
        ("models", [
            "llm", "large language model", "foundation model", "gpt-", "gpt ",
            "claude", "gemini", "llama", "mistral", "deepseek", "qwen", "grok",
            "phi-", "command r", "model release", "reasoning model", "o1", "o3",
            "o4", "4o", "benchmark", "hallucination", "context window", "token",
            "multimodal", "openai", "anthropic", "nvidia ai", "weights",
        ]),
        # Training / research / papers
        ("research", [
            "paper", "arxiv", "training", "fine-tune", "fine tune", "rlhf",
            "reinforcement learning", "dataset", "synthetic data", "alignment",
            "scaling law", "pruning", "distillation", "inference scaling",
            "vector database", "embedding", "retrieval", "rag ", "research",
            "red teaming ai", "superalignment",
        ]),
        # Funding / business / corporate
        ("business", [
            "funding", "raises", "raised", "valuation", "round", "seed", "series a",
            "series b", "acquisition", "acquire", "ipo", "revenue", "billion", "million",
            "partnership", "partners with", "launches", "announces", "ceo", "startup",
            "unicorn", "deal", "investment", "openai and microsoft", "merger",
        ]),
        # Policy / regulation / safety / governance
        ("policy-safety", [
            "regulation", "regulator", "ai act", "executive order", "congress",
            "senate", "legislation", "ban", "banned", "policy", "governance",
            "safety", "responsible ai", "national security", "export control",
            "copyright", "lawsuit", "court", "fcc", "ftc", "eu ", "white house",
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


def classify_article(magazine_id: str | None, title: str | None, summary: str | None) -> str | None:
    """Return the best-matching subcategory slug for an article, or None.

    Scans the taxonomy of `magazine_id` in order and returns the FIRST category
    whose any keyword appears in title+summary. Case-insensitive substring match.
    """
    if not magazine_id or not title:
        return None
    tax = MAGAZINE_TAXONOMY.get(magazine_id)
    if not tax:
        return None
    corpus = (title or "").lower()
    if summary:
        corpus += " " + summary.lower()
    for slug, keywords in tax:
        for kw in keywords:
            if kw in corpus:
                return slug
    return None
