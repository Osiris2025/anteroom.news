"""Tests for the shared commentary style rules and the summarizer's retry logic."""

from types import SimpleNamespace

from engine.agents import summarizer
from engine.agents.commentary_style import (
    clean_commentary,
    problem_examples,
    validate_commentary,
)

GOOD = (
    "The fine print around those first four service missions is the most interesting part of this RFP. "
    "NASA is effectively saying it will buy seats and cargo space from whoever wins, at set prices.\n\n"
    "The $325 million per crew launch and $300 million per cargo flight are the numbers I keep coming back to. "
    "It's a hedge, and a pragmatic one.\n\n"
    "What I'd want to know next is how serious the bidders really are."
)

BAD = (
    "**Take:** This isn’t just an RFP—it’s NASA rewriting the economics of low-Earth orbit. "
    "Source: https://arstechnica.com/space/2026/10/x/\n\n"
    "**The numbers tell the strategy.** That’s not a price tag; it’s a subsidy disguised as a procurement. "
    "For years this happened *before* anything else.\n\n"
    "**Closer:** The ISS was a laboratory. Its successors must be a balance sheet."
)


def test_good_commentary_passes():
    assert validate_commentary(GOOD) == []


def test_bad_commentary_flags_each_problem():
    problems = " | ".join(validate_commentary(BAD))
    assert "markdown" in problems
    assert "labels" in problems
    assert "URL" in problems
    assert "isn't X" in problems


def test_self_check_notes_and_repeats_are_flagged():
    leaked = GOOD + "\n\nThat's about 170 words. Let me double-check all the constraints.\n\n" + GOOD
    problems = " | ".join(validate_commentary(leaked))
    assert "notes" in problems
    assert "repeated" in problems


def test_clean_strips_markdown_labels_and_urls():
    cleaned = clean_commentary(BAD)
    assert "*" not in cleaned
    assert "Take:" not in cleaned and "Closer:" not in cleaned
    assert "http" not in cleaned
    assert cleaned.startswith("This isn’t just an RFP")
    assert len(cleaned.split("\n\n")) == 3


def test_clean_drops_self_check_and_duplicates():
    leaked = GOOD + "\n\nThat's about 170 words. Let me double-check all the constraints.\n\n" + GOOD
    assert clean_commentary(leaked) == GOOD


def test_clean_leaves_good_text_and_ordinary_asterisks_alone():
    assert clean_commentary(GOOD) == GOOD
    s = "Prices rose 3 * 4 percent this year, and the F*** word came up, which matters to regular people."
    assert clean_commentary(s) == s


def test_clean_bullets_and_headings_become_paragraphs():
    text = "Intro sentence here for the piece.\n\n- First point.\n- Second point.\n\n# Verdict\nFinal thought."
    assert clean_commentary(text).split("\n\n") == [
        "Intro sentence here for the piece.", "First point.", "Second point.", "Final thought.",
    ]


def _stream_cfg():
    return {"brand": {"name": "Tech Pulse", "tone": "analytical"}, "ai": {"personality": "You are Ada Circuit."}}


def test_prompt_has_style_rules_and_no_source_url():
    article = {"title": "T", "summary": "S", "source_url": "https://example.com/story"}
    prompts = summarizer._build_prompts(article, _stream_cfg())
    assert "example.com" not in prompts["user"]
    assert "cite" not in prompts["system"].lower()
    assert "What strikes me" in prompts["system"]  # listed as an opening to avoid
    assert "No markdown" in prompts["system"]


class _FakeClient:
    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        text = self.replies.pop(0)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=text))])


def _reply(commentary):
    return f"<summary>A summary.</summary><commentary>{commentary}</commentary><ai_thoughts>{{}}</ai_thoughts>"


def test_summarizer_retries_once_on_bad_commentary(monkeypatch):
    fake = _FakeClient([_reply(BAD), _reply(GOOD)])
    monkeypatch.setattr(summarizer, "_make_client", lambda: fake)
    out = summarizer.summarize_article({"title": "T", "summary": "S", "source_url": "u"}, _stream_cfg())
    assert out["commentary"] == GOOD
    assert len(fake.calls) == 2
    retry = fake.calls[1]["messages"]
    assert retry[2]["role"] == "assistant"  # revision of the first draft
    assert "breaks the style rules" in retry[3]["content"]
    assert "This isn’t just an RFP" in retry[3]["content"]  # offending line quoted back
    assert fake.calls[0]["extra_body"] == {"reasoning": {"effort": "low", "exclude": True}}
    assert fake.calls[0]["max_tokens"] <= 2400


def test_summarizer_saves_cleaned_version_when_retry_also_fails(monkeypatch):
    fake = _FakeClient([_reply(BAD), _reply(BAD)])
    monkeypatch.setattr(summarizer, "_make_client", lambda: fake)
    out = summarizer.summarize_article({"title": "T", "summary": "S", "source_url": "u"}, _stream_cfg())
    assert len(fake.calls) == 2
    assert "*" not in out["commentary"] and "Take:" not in out["commentary"]


def test_summarizer_no_retry_when_clean(monkeypatch):
    fake = _FakeClient([_reply(GOOD)])
    monkeypatch.setattr(summarizer, "_make_client", lambda: fake)
    out = summarizer.summarize_article({"title": "T", "summary": "S", "source_url": "u"}, _stream_cfg())
    assert out["commentary"] == GOOD
    assert len(fake.calls) == 1


def test_problem_examples_quotes_contrast_lines():
    ex = problem_examples("Reps aren't lazy. They're overwhelmed by tools. The past isn't prologue; it's a mirror.")
    assert ex == ["Reps aren't lazy. They're overwhelmed by tools.", "The past isn't prologue; it's a mirror."]
