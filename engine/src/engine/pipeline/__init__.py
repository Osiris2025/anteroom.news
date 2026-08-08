"""Pipeline orchestration for the agent DAG."""

from ..config import load_all_streams


def run_pipeline(streams_dir: str = "streams"):
    """Execute the full pipeline for all enabled streams."""
    configs = load_all_streams(streams_dir)
    print(f"Loaded {len(configs)} stream configs")
    for cfg in configs:
        print(f"  {cfg.stream_id}: {cfg.brand.name}")
    return configs


if __name__ == "__main__":
    run_pipeline()
