"""AI Frontier subcategory keywords: order and word-start matching."""
from engine.agents.subcategory import (
    MAGAZINE_TAXONOMY, classify_article, llm_fallback_subcategories, subcategory_label,
)

NH = "neural-hardware"


def test_ai_frontier_slugs_and_order():
    slugs = [s for s, _ in MAGAZINE_TAXONOMY[NH]]
    assert slugs == ["security-attacks", "safety-risk", "politics-policy", "chips-hardware", "reviews",
                     "ai-companies", "models-research", "tools-agents", "society-culture"]


def test_security_precedes_agents():
    assert classify_article(NH, "Hackers abuse a Claude Code agent to steal API keys", "") == "security-attacks"
    assert classify_article(NH, "Anthropic adds a new agent mode to Claude", "") == "tools-agents"


def test_examples():
    assert classify_article(NH, "Nvidia unveils Blackwell Ultra GPU for data centers", "") == "chips-hardware"
    assert classify_article(NH, "Hermes Agent vs OpenClaw: which open-source agent delivers?", "") == "reviews"
    assert classify_article(NH, "Mistral raises 3 billion euros at a new valuation", "") == "ai-companies"


def test_word_start_matching():
    # "api" must not match "capital", "ban"-style substrings must not fire inside words
    assert classify_article(NH, "The urban capital of apples", "") is None


def test_labels():
    assert subcategory_label(NH, "chips-hardware") == "Chips, Hardware & Data Centers"
    assert subcategory_label("climate-watch", "climate-change") == "Climate Change"


def test_llm_fallback_disabled_without_key(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    assert llm_fallback_subcategories([{"id": "a", "magazine_id": NH, "title": "x", "summary": ""}]) == {}


def test_llm_fallback_switch(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test")
    monkeypatch.setenv("SUBCAT_LLM_FALLBACK", "0")
    assert llm_fallback_subcategories([{"id": "a", "magazine_id": NH, "title": "x", "summary": ""}]) == {}
