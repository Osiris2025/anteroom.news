"""Blocked-topic filter: SNL / Saturday Night Live in titles."""
import pytest

from engine.agents import is_blocked_topic


@pytest.mark.parametrize("title", [
    "Watch Rosalía Perform on SNL",
    "‘SNL’ Pays Tribute To Patrick Stewart",
    "'SNL U.K.' Weekend Update Takes Jab",
    "Saturday Night Live returns",
    "inside SATURDAY  NIGHT LIVE history",
])
def test_blocked(title):
    assert is_blocked_topic({"title": title})


@pytest.mark.parametrize("title", [
    "snl lowercase is not the show",
    "SNLX chip launches",
    "Saturday night lights in Texas",
    "Live updates: oil deal",
    "",
])
def test_allowed(title):
    assert not is_blocked_topic({"title": title})


def test_headline_checked():
    assert is_blocked_topic({"title": "Big night", "headline": "An SNL first"})
