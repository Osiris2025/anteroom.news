"""Pipeline orchestration for the agent DAG."""

import logging
import os

from ..config import load_all_streams
from ..agents import run_discovery
from ..agents.summarizer import run_batch_summarization

logger = logging.getLogger(__name__)

# Database URL from environment, falls back to local dev default
DEFAULT_DB_URL = "postgresql://nexus:changeme@postgres:5432/nexus"


def run_pipeline(streams_dir: str = "streams", max_summarize: int = 25):
    """Execute the full discovery + summarization pipeline for all enabled streams."""
    configs = load_all_streams(streams_dir)
    print(f"Loaded {len(configs)} stream configs")
    for cfg in configs:
        print(f"  {cfg.stream_id}: {cfg.brand.name}")

    db_url = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

    # Step 1: AI discovery (scrape RSS/Reddit sources -> store in DB)
    print("\n=== Discovery Phase ===")
    result = run_discovery(configs, db_url)
    print(f"Discovery results: {result['found']} articles found, {result['inserted']} inserted")

    # Step 2: AI summarization + commentary (generate AI content for draft articles)
    print("\n=== Summarization Phase ===")
    summary_result = run_batch_summarization(configs, db_url, max_articles=max_summarize)
    print(
        f"Summarization results: {summary_result['attempted']} attempted, "
        f"{summary_result['succeeded']} succeeded, "
        f"{summary_result['failed']} failed, "
        f"{summary_result['skipped']} skipped"
    )

    return configs


if __name__ == "__main__":
    run_pipeline()