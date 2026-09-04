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
        f"2. <commentary> - A thoughtful commentary (3-5 paragraphs) in the distinctive voice of {brand_name}. "
        f"Connect the story to broader themes, include analysis, and cite the source URL.\n"
        f"3. <ai_thoughts> - A JSON object with keys: key_insight, why_interesting, confidence (0-1).\n\n"
        f"IMPORTANT: Always cite the source article URL. Do NOT fabricate facts. "
        f"ALWAYS include the <summary> and <commentary> tags."
    )

    raw_source = article.get("summary", "") or ""
    user_prompt = (
        f"Source article URL: {article.get('source_url', 'N/A')}\n\n"
        f"Title: {article.get('title', 'N/A')}\n\n"
        f"Raw Summary/Description:\n{raw_source[:2000]}\n\n"
        f"Produce your response with <summary>, <commentary>, and <ai_thoughts> tags."
    )
    return {"model": model_name, "system": system_prompt, "user": user_prompt}


def _parse_response(text: str, source_url: str = "") -> dict:
    result = {"summary": "", "commentary": "", "ai_thoughts": "{}"}

    summary_match = re.search(r"<summary>\s*(.*?)\s*</summary>", text, re.DOTALL)
    if summary_match:
        result["summary"] = summary_match.group(1).strip()

    commentary_match = re.search(r"<commentary>\s*(.*?)\s*</commentary>", text, re.DOTALL)
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
        result["summary"] = text[:300].strip()

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
                f"This article from {source_url} covers newsworthy developments. "
                f"Read the full story at the source URL."
            )

    return result


def summarize_article(article: dict, stream_config: dict) -> Optional[dict]:
    client = _make_client()
    if not client:
        return None

    prompts = _build_prompts(article, stream_config)

    try:
        response = client.chat.completions.create(
            model=prompts["model"],
            messages=[
                {"role": "system", "content": prompts["system"]},
                {"role": "user", "content": prompts["user"]},
            ],
            temperature=0.7,
            max_tokens=1500,
        )

        text = response.choices[0].message.content or ""
        parsed = _parse_response(text, article.get("source_url", ""))

        if not parsed["summary"]:
            parsed["summary"] = article.get("summary", "")[:500]
        if not parsed["commentary"]:
            parsed["commentary"] = (
                f"From {article.get('source_url', 'the source')}: "
                f"This article covers notable developments."
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