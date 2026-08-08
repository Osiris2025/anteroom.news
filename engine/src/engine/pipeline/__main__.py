"""Entry point for the pipeline runner: python -m engine.pipeline"""
from . import run_pipeline

if __name__ == "__main__":
    configs = run_pipeline()
    print(f"\nPipeline ready. {len(configs)} streams loaded.")
