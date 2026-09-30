"""Staggered scheduling for social posts.

Slots are computed once per queue run so that posts spread out:
- up to N slots per calendar day (N = Config.max_per_day, SOCIAL_MAX_PER_DAY)
- all times are random within 08:00-22:00 America/New_York
- two slots less than 24h apart are never closer than 4 hours
- the first slot is on the day `now + SOCIAL_START_DELAY_DAYS` (default 5),
  with overflow pushed to the following days sequentially
"""
from __future__ import annotations

import os
import random
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")

WINDOW_START_MIN = 8 * 60    # 08:00 ET
WINDOW_END_MIN = 22 * 60     # 22:00 ET
MIN_GAP_MIN = 4 * 60         # 4 hours between slots on the same day


def _capacity(after_min: int) -> int:
    """Max number of >=4h-spaced slots that fit in the window after `after_min`."""
    lo = max(WINDOW_START_MIN, after_min)
    if lo >= WINDOW_END_MIN:
        return 0
    return (WINDOW_END_MIN - lo) // MIN_GAP_MIN + 1


def _pick_day_slots(n: int, after_min: int) -> list[int] | None:
    """Pick n sorted random minutes-of-day in the window, all >= after_min and
    >=4h apart. Returns None if random draws can't find a valid set."""
    lo = max(WINDOW_START_MIN, after_min)
    for _ in range(300):
        times = sorted(random.randint(lo, WINDOW_END_MIN - 1) for _ in range(n))
        if all(times[i + 1] - times[i] >= MIN_GAP_MIN for i in range(n - 1)):
            return times
    return None


def _even_day_slots(n: int, after_min: int) -> list[int]:
    """Deterministic evenly-spaced fallback (valid because n <= capacity)."""
    lo = max(WINDOW_START_MIN, after_min)
    usable = WINDOW_END_MIN - lo  # > 0 because n <= capacity(after_min)
    if n == 1:
        return [lo + usable // 2]
    step = usable // (n - 1)
    return [lo + step * i for i in range(n)]


def _day_slots(n: int, after_min: int) -> list[int]:
    """n slots guaranteed to fit the constraints (n must be <= capacity)."""
    if n <= 0:
        return []
    return _pick_day_slots(n, after_min) or _even_day_slots(n, after_min)


def schedule_slots(count: int, max_per_day: int,
                   first_start: datetime | None = None) -> list[datetime]:
    """Return `count` tz-aware datetimes (America/New_York) staggered across days."""
    if count <= 0:
        return []
    max_per_day = max(1, int(max_per_day))

    if first_start is None:
        base = datetime.now(ET) + timedelta(
            days=float(os.environ.get("SOCIAL_START_DELAY_DAYS", "5")))
    else:
        base = first_start.astimezone(ET) if first_start.tzinfo \
            else first_start.replace(tzinfo=ET)

    slots: list[datetime] = []
    day = base.date()
    first_after = base.hour * 60 + base.minute
    while len(slots) < count:
        cap = _capacity(first_after if not slots and day == base.date() else WINDOW_START_MIN)
        n = min(max_per_day, count - len(slots), cap)
        if n <= 0:
            # Window exhausted today — continue tomorrow.
            day = day + timedelta(days=1)
            continue
        after_min = first_after if (day == base.date() and not slots) else WINDOW_START_MIN
        for t in _day_slots(n, after_min):
            slots.append(datetime.combine(day, time(t // 60, t % 60), tzinfo=ET))
        day = day + timedelta(days=1)
    return slots
