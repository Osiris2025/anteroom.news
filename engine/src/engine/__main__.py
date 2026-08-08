"""Entry point: python -m engine"""
from engine import __version__
from engine.pipeline import run_pipeline

if __name__ == "__main__":
    configs = run_pipeline()
    print(f"\nAI News Nexus Engine v{__version__}")
    print(f"{len(configs)} streams loaded. Ready to process.")
