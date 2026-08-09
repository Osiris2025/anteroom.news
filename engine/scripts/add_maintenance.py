#!/usr/bin/env python3
"""Add maintenance card placements to themes.json."""
import json

path = "/home/todd/ai-news-nexus/frontend/public/themes.json"
with open(path) as f:
    themes = json.load(f)

for t in themes:
    layout = t["layout"]
    t["maintenance"] = {
        "subscribe": "sidebar" if "sidebar" in layout else "footer" if layout in ["full", "single"] else "card-inline",
        "support": "sidebar" if "sidebar" in layout else "footer" if layout in ["full", "single"] else "sticky-bottom",
        "legal": "footer",
        "ai-disclosure": "footer" if layout != "feed" else "card-inline",
        "profile": "sidebar" if "sidebar" in layout else "nav" if layout in ["full", "single"] else "card-inline",
        "about": "footer" if layout != "masonry" else "card-inline",
        "cookie-consent": "sticky-bottom",
        "theme-selector": "nav"
    }

with open(path, "w") as f:
    json.dump(themes, f, indent=2)

print(f"Updated {len(themes)} themes with maintenance card placements")
for t in themes:
    m = t["maintenance"]
    print(f"  {t['id']:12s} sub={m['subscribe']:12s} sup={m['support']:12s} legal={m['legal']:12s} prof={m['profile']:12s}")