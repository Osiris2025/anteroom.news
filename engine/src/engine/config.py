"""Stream configuration loader."""

from pathlib import Path
import yaml
from pydantic import BaseModel


class Brand(BaseModel):
    name: str = "Unnamed Stream"
    tagline: str = ""
    description: str = ""
    tone: str = "neutral"
    url: str = ""
    colors: dict = {}


class AIModelPref(BaseModel):
    default: str = "deepseek/deepseek-v4-flash-0731"
    summarizer: str = ""
    commentator: str = ""


class AIConfig(BaseModel):
    personality: str = ""
    model_preference: AIModelPref = AIModelPref()


class Source(BaseModel):
    type: str = "rss"
    url: str = ""
    name: str = ""
    subreddit: str = ""
    sort: str = "hot"
    limit: int = 25


class Ingestion(BaseModel):
    schedule: str = "*/30 * * * *"
    max_articles_per_run: int = 25
    sources: list[Source] = []


class SocialAccount(BaseModel):
    handle: str = ""
    post_frequency: str = ""


class Social(BaseModel):
    accounts: dict[str, SocialAccount] = {}


class Community(BaseModel):
    enabled: bool = False
    category: str = ""


class StreamConfig(BaseModel):
    api_version: str = "0.1.0"
    stream_id: str = ""
    enabled: bool = True
    brand: Brand = Brand()
    ai: AIConfig = AIConfig()
    ingestion: Ingestion = Ingestion()
    social: Social = Social()
    community: Community = Community()
    features: dict = {}


def load_all_streams(streams_dir: str = "streams") -> list[StreamConfig]:
    """Load all enabled stream configs from a directory."""
    path = Path(streams_dir)
    configs = []
    for f in sorted(path.glob("*.yaml")):
        with open(f) as fh:
            data = yaml.safe_load(fh)
        config = StreamConfig(**data)
        if config.enabled:
            configs.append(config)
    return configs
