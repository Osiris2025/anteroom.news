"""Pipeline runner - stays alive for cron triggers."""
import time
from . import run_pipeline

if __name__ == "__main__":
    print("AI News Nexus Engine starting...")
    configs = run_pipeline()
    print(f"{len(configs)} streams loaded. Waiting for triggers...")
    while True:
        time.sleep(60)
