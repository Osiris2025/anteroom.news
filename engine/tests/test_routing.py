"""Shared routing rules (frontend/src/lib/routing-rules.json) as applied by the engine."""
import pytest

from engine.agents.routing import apply_routing, load_rules

AI, SCI, JTN, DM, TECH = "neural-hardware", "weird-and-wild", "just-the-news-thats-fit-to-print", "dark-matter", "tech-pulse"


@pytest.fixture(scope="module")
def rules():
    r = load_rules()
    assert r.ai_title is not None, "routing-rules.json not found"
    return r


def route(rules, title, mag="tech-pulse", url="https://example.com/a", source="Example", summary=""):
    art = {"title": title, "summary": summary, "source_url": url, "source_name": source,
           "magazine_id": mag, "subcategory": "old-sub"}
    rule = apply_routing(art, rules)
    return art["magazine_id"], rule, art.get("subcategory")


@pytest.mark.parametrize("title,expected", [
    ("OpenAI releases GPT-6 Astra", AI),
    ("Anthropic CEO to have private White House dinner", AI),
    ("Hermes Agent v0.21 adds memory", AI),
    ("Google Gemini is getting a dedicated student hub", AI),
    ("Microsoft Copilot reveals secret input that allowed it to be hacked", AI),
    ("SpaceX officially closes its Cursor acquisition", AI),
])
def test_ai_company_or_product_goes_to_ai_frontier(rules, title, expected):
    mag, rule, sub = route(rules, title, mag="poli-split")
    assert mag == expected and rule == "ai"
    assert sub is None  # stale subcategory cleared for re-tagging


@pytest.mark.parametrize("title", [
    "In France, heat waves are taking a toll on the flowers that inspired Claude Monet",
    "A Rare Aztec Codex Detailing the Rise and Fall of Tenochtitlan Returns to Mexico",
    "Gemini exchange halts withdrawals as bitcoin slides",
    "From AI Copilots to Agent Swarms",
    "Why every startup now sells a copilot",
])
def test_false_positive_exclusions(rules, title):
    mag, rule, _ = route(rules, title, mag="weekly-weird-news")
    assert mag == "weekly-weird-news" and rule is None


def test_publisher_feed_goes_to_ai_frontier(rules):
    mag, rule, _ = route(rules, "Formalizing Fermat's Last Theorem", mag="oss-report",
                         url="https://www.anthropic.com/research/fermat")
    assert (mag, rule) == (AI, "ai")


def test_nasa_science_money_and_theory(rules):
    assert route(rules, "Webb measures distance to farthest fast radio burst", mag=DM,
                 url="https://science.nasa.gov/missions/webb/x", source="NASA")[:2] == (SCI, "nasa-science")
    assert route(rules, "Blue Origin wins $700 million contract to build NASA's next Mars orbiter",
                 mag="starfall-weekly")[:2] == (JTN, "nasa-money")
    assert route(rules, "GOP spat stalls NASA bill amid moon base push", mag="poli-split")[:2] == (JTN, "nasa-money")
    assert route(rules, "Launching 10,000 tiny 'femtosats' to Saturn? NASA funds 18 futuristic spaceflight ideas",
                 mag="starfall-weekly")[:2] == (DM, "nasa-theory")


def test_nasa_wins_over_ai(rules):
    assert route(rules, "NASA and IBM made an AI model with Hugging Face for exploring the Moon")[:2] == (SCI, "nasa-science")


def test_security_source_split(rules):
    bc = dict(url="https://www.bleepingcomputer.com/news/security/x", source="BleepingComputer")
    assert route(rules, "Russian state hackers use new RedFlick technique to push malware", mag=AI, **bc)[:2] == (TECH, "security-tech")
    assert route(rules, "Hackers abuse AI agents and prompt injection to steal data", mag=TECH, **bc)[:2] == (AI, "ai-security")
    assert route(rules, "Critical Langflow flaw exploited to steal OpenAI and AWS keys", mag=TECH, **bc)[:2] == (AI, "ai")


def test_legacy_political_and_paranormal_routes(rules):
    assert route(rules, "Senate Republicans block border bill", mag="tech-pulse")[:2] == ("poli-split", "political")
    mag, rule, sub = route(rules, "Ghost sighting reported at haunted mill", mag="the-veil")
    assert (mag, rule) == ("weekly-weird-news", "paranormal") and sub != "old-sub"


def test_no_rule_keeps_magazine(rules):
    assert route(rules, "Apple ships a new iPad", mag="tech-pulse") == ("tech-pulse", None, "old-sub")
