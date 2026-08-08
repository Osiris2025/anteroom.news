"""Test stream config loading."""
from engine.config import load_all_streams


def test_load_weekly_weird_news():
    configs = load_all_streams("streams")
    assert len(configs) == 1
    wwn = configs[0]
    assert wwn.stream_id == "weekly-weird-news"
    assert wwn.brand.name == "Weekly Weird News"
    assert wwn.brand.tone == "satire"
    assert len(wwn.ingestion.sources) == 2
    assert wwn.features.get("catboy_series", {}).get("enabled")


def test_catboy_debut_exists():
    from engine.catboy import DEBUT_STORY
    assert DEBUT_STORY["episode"] == 1
    assert "CATBOY" in DEBUT_STORY["title"]
    assert DEBUT_STORY["featured"] is True
