"""
AI Summarization & Commentary Agent
Generates enhanced summaries and commentary for draft articles using OpenRouter API.
"""

import json
import logging
import os
import re
from typing import Optional

from openai import OpenAI

logger = logging.getLogger(__name__)

from . import has_substance, is_aggregator_link  # quality gate
from .commentary_style import (
    COMMENTARY_STYLE_RULES,
    ENGINE_MAX_TOKENS,
    PROBLEM_CUT_OFF,
    REASONING,
    clean_commentary,
    problem_examples,
    validate_commentary,
)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "deepseek/deepseek-v4-flash-0731"


def _make_client() -> Optional[OpenAI]:
    api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("LLM_API_KEY")
    if not api_key:
        logger.error("No OPENROUTER_API_KEY or LLM_API_KEY set in environment")
        return None
    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=api_key,
        default_headers={
            "HTTP-Referer": "https://ai-news-nexus.app",
            "X-Title": "AI News Nexus Engine",
        },
    )


def _build_prompts(article: dict, stream_config: dict) -> dict:
    personality = stream_config.get("ai", {}).get("personality", "")
    tone = stream_config.get("brand", {}).get("tone", "neutral")
    brand_name = stream_config.get("brand", {}).get("name", "News")
    model_name = stream_config.get("ai", {}).get("model_preference", {}).get("default", DEFAULT_MODEL)

    system_prompt = (
        f"You are an AI content editor for \"{brand_name}\".\n\n"
        f"{personality}\n\n"
        f"Your job is to take a raw news article and produce THREE clearly tagged sections. "
        f"You MUST output ALL three sections, never skip one.\n\n"
        f"1. <summary> - A concise 2-3 sentence summary (100-150 words) in the {tone} tone of {brand_name}.\n"
        f"2. <commentary> - Your \"Just my opinion\" column on the story, in your own voice "
        f"(general outlook: {tone}). Follow the commentary rules below exactly.\n"
        f"3. <ai_thoughts> - A JSON object with keys: key_insight, why_interesting, confidence (0-1).\n\n"
        f"Commentary rules:\n{COMMENTARY_STYLE_RULES}\n\n"
        f"IMPORTANT: Do NOT fabricate facts. Output only the three tagged sections, with no notes "
        f"about your process. ALWAYS include the <summary> and <commentary> tags."
    )

    # No source URL here on purpose: the page already links the source, and
    # giving the model the URL made it paste "Source: https://..." into prose.
    raw_source = article.get("summary", "") or ""
    user_prompt = (
        f"Title: {article.get('title', 'N/A')}\n\n"
        f"Raw Summary/Description:\n{raw_source[:2000]}\n\n"
        f"Produce your response with <summary>, <commentary>, and <ai_thoughts> tags."
    )
    return {"model": model_name, "system": system_prompt, "user": user_prompt}


def _parse_response(text: str, source_url: str = "") -> dict:
    result = {"summary": "", "commentary": "", "ai_thoughts": "{}"}

    # Tolerant of a missing closing tag (the model sometimes forgets it or gets cut off):
    # a section ends at its own closing tag, the next section's opening tag, or the end.
    def _section(name: str):
        m = re.search(
            rf"<{name}>\s*(.*?)\s*(?:</{name}>|<(?:summary|commentary|ai_thoughts)>|\Z)",
            text, re.DOTALL | re.IGNORECASE,
        )
        return m

    summary_match = _section("summary")
    if summary_match:
        result["summary"] = summary_match.group(1).strip()

    commentary_match = _section("commentary")
    if commentary_match:
        result["commentary"] = commentary_match.group(1).strip()

    thoughts_match = re.search(r"<ai_thoughts>\s*(.*?)\s*</ai_thoughts>", text, re.DOTALL)
    if thoughts_match:
        try:
            json.loads(thoughts_match.group(1))
            result["ai_thoughts"] = thoughts_match.group(1).strip()
        except json.JSONDecodeError:
            result["ai_thoughts"] = json.dumps({"raw": thoughts_match.group(1).strip()[:200]})

    if not result["summary"]:
        result["summary"] = re.sub(r"<[^>]+>", "", text)[:300].strip()

    if not result["commentary"]:
        remaining = text
        if summary_match:
            remaining = remaining.replace(summary_match.group(0), "")
        if thoughts_match:
            remaining = remaining.replace(thoughts_match.group(0), "")
        remaining = re.sub(r"<[^>]+>", "", remaining).strip()
        if remaining:
            result["commentary"] = remaining
        else:
            result["commentary"] = (
                "This article covers newsworthy developments. "
                "Read the full story at the source."
            )

    return result


def summarize_article(article: dict, stream_config: dict) -> Optional[dict]:
    client = _make_client()
    if not client:
        return None

    prompts = _build_prompts(article, stream_config)

    base_messages = [
        {"role": "system", "content": prompts["system"]},
        {"role": "user", "content": prompts["user"]},
    ]

    def _call(messages: list) -> tuple:
        response = client.chat.completions.create(
            model=prompts["model"],
            messages=messages,
            temperature=0.7,
            max_tokens=ENGINE_MAX_TOKENS,
            extra_body={"reasoning": REASONING},
        )
        choice = response.choices[0]
        text = choice.message.content or ""
        parsed = _parse_response(text, article.get("source_url", ""))
        # Hitting the token limit means the reply was cut off: count it as a failure.
        parsed["_cut_off"] = getattr(choice, "finish_reason", None) == "length"
        return parsed, text

    def _problems(parsed: dict) -> list:
        p = validate_commentary(parsed["commentary"])
        if parsed.get("_cut_off") and PROBLEM_CUT_OFF not in p:
            p.append(PROBLEM_CUT_OFF)
        return p

    try:
        parsed, raw = _call(base_messages)

        # Style check on the commentary; retry once as a revision of the first
        # draft, quoting the offending lines back. If the retry also misses,
        # keep the better attempt, cleaned up.
        problems = _problems(parsed)
        if problems:
            examples = problem_examples(parsed["commentary"])
            feedback = f"That <commentary> breaks the style rules: {'; '.join(problems)}."
            if examples:
                feedback += "\nRewrite these parts in plain, direct sentences:\n" + "\n".join(
                    f'- "{e}"' for e in examples
                )
            if PROBLEM_CUT_OFF in problems:
                feedback += "\nIt stopped mid-sentence. Keep it a little shorter and end on a complete sentence."
            feedback += "\nReturn all three tagged sections again, with the commentary revised to follow every rule."
            retry_messages = (
                [*base_messages, {"role": "assistant", "content": raw}, {"role": "user", "content": feedback}]
                if raw.strip()
                else base_messages
            )
            try:
                second, _ = _call(retry_messages)
            except Exception as exc:  # noqa: BLE001 - keep the first attempt
                logger.info("Commentary retry failed for '%s': %s", article.get("title", "?"), exc)
                second = None
            if second is not None:
                p2 = _problems(second)
                if len(p2) <= len(problems):
                    parsed, problems = second, p2
            if problems:
                logger.info(
                    "Commentary for '%s' still had style problems after retry (%s); saving cleaned version",
                    article.get("title", "?")[:60], "; ".join(problems),
                )
                parsed["commentary"] = clean_commentary(parsed["commentary"])

        if not parsed["summary"]:
            parsed["summary"] = article.get("summary", "")[:500]
        if not parsed["commentary"]:
            parsed["commentary"] = (
                "This article covers notable developments. "
                "Read the full story at the source."
            )

        return {
            "summary": parsed["summary"][:2000],
            "commentary": parsed["commentary"][:5000],
            "ai_thoughts": parsed["ai_thoughts"][:1000] if parsed["ai_thoughts"] else "{}",
        }

    except Exception as exc:
        logger.warning("LLM call failed for '%s': %s", article.get("title", "?"), exc)
        return None


def run_summarization(db_conn, article: dict, stream_config: dict) -> bool:
    result = summarize_article(article, stream_config)
    if not result:
        return False

    try:
        with db_conn.cursor() as cur:
            cur.execute(
                """
                UPDATE article
                SET summary = %s,
                    commentary = %s,
                    ai_thoughts = %s
                WHERE id = %s AND (commentary IS NULL OR commentary = '')
                """,
                (result["summary"], result["commentary"], result["ai_thoughts"], article["id"]),
            )
        db_conn.commit()
        if cur.rowcount > 0:
            logger.info("Updated '%s'", article.get("title", "?")[:60])
            return True
        return False
    except Exception as exc:
        logger.warning("DB update failed for '%s': %s", article.get("title", "?"), exc)
        db_conn.rollback()
        return False


def run_batch_summarization(configs: list, db_url: str, max_articles: int = 25) -> dict:
    import psycopg2

    logger.info("Starting batch AI summarization...")
    conn = psycopg2.connect(db_url)
    results = {"attempted": 0, "succeeded": 0, "failed": 0, "skipped": 0}

    try:
        stream_by_id = {}
        for cfg in configs:
            stream_by_id[cfg.stream_id] = cfg.model_dump() if hasattr(cfg, "model_dump") else cfg

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, source_url, summary, magazine_id
                FROM article
                WHERE (status = 'draft' OR status = 'live')
                  AND (commentary IS NULL OR commentary = '')
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (max_articles,),
            )
            articles = cur.fetchall()

        if not articles:
            logger.info("No articles needing summarization found.")
            return results

        results["attempted"] = len(articles)

        for row in articles:
            article = {
                "id": row[0],
                "title": row[1],
                "source_url": row[2],
                "summary": row[3] or "",
                "magazine_id": row[4],
            }

            mag_id = article["magazine_id"]
            stream_cfg = stream_by_id.get(mag_id)
            if not stream_cfg:
                stream_cfg = stream_by_id.get("weird-and-wild", stream_by_id.get("weekly-weird-news"))
                if not stream_cfg and configs:
                    first = configs[0]
                    stream_cfg = first.model_dump() if hasattr(first, "model_dump") else first

            if not stream_cfg:
                results["skipped"] += 1
                continue

            # QUALITY GATE: don't spend tokens summarizing articles with no
            # substance (empty/boilerplate summary, aggregator/redirect links).
            # These stay draft for human review or rejection.
            if not has_substance(article) or is_aggregator_link(article):
                results["skipped"] += 1
                continue

            if run_summarization(conn, article, stream_cfg):
                results["succeeded"] += 1
            else:
                results["failed"] += 1

    finally:
        conn.close()

    logger.info(
        "Summarization complete: %d attempted, %d succeeded, %d failed, %d skipped",
        results["attempted"], results["succeeded"], results["failed"], results["skipped"],
    )
    return results