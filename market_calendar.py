"""When was the last US market close? One answer, used everywhere.

fetch_history.py uses it to date a quote correctly, and check_freshness.py
uses it to decide whether the site is behind. Keeping both on the same
calendar is the point: they must never disagree about what "today's close"
means.

Holidays are NYSE full closures. Early-close days (1pm) need no special
handling because every update runs well after 4pm New York time. Past 2028
the list runs out and the calendar falls back to plain weekdays, which is
wrong about ten days a year -- add the next year's dates from
https://www.nyse.com/markets/hours-calendars before then.
"""

import datetime as dt

try:
    from zoneinfo import ZoneInfo
    NY = ZoneInfo("America/New_York")
except Exception:                       # no tz database: approximate EDT
    NY = dt.timezone(dt.timedelta(hours=-4))

HOLIDAYS = {
    # 2026
    "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03", "2026-05-25",
    "2026-06-19", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
    # 2027
    "2027-01-01", "2027-01-18", "2027-02-15", "2027-03-26", "2027-05-31",
    "2027-06-18", "2027-07-05", "2027-09-06", "2027-11-25", "2027-12-24",
    # 2028
    "2028-01-17", "2028-02-21", "2028-04-14", "2028-05-29", "2028-06-19",
    "2028-07-04", "2028-09-04", "2028-11-23", "2028-12-25",
}

# A daily bar is final a little after the 4pm bell.
CLOSE_FINAL = dt.time(16, 10)
MARKET_OPEN = dt.time(9, 30)


def is_trading_day(d):
    return d.weekday() < 5 and d.isoformat() not in HOLIDAYS


def prev_trading_day(d):
    d -= dt.timedelta(days=1)
    while not is_trading_day(d):
        d -= dt.timedelta(days=1)
    return d


def now_ny():
    return dt.datetime.now(NY)


def last_close_date(at=None):
    """The trading day whose closing price should be on the site right now."""
    at = (at or now_ny()).astimezone(NY)
    d = at.date()
    if is_trading_day(d) and at.time() >= CLOSE_FINAL:
        return d
    return prev_trading_day(d)


def quote_date(at):
    """The trading day a price quoted at `at` belongs to.

    During the session that is today (an intraday price). Before the open, at
    a weekend or on a holiday, the quote is still the previous session's close.
    """
    at = at.astimezone(NY)
    d = at.date()
    if is_trading_day(d) and at.time() >= MARKET_OPEN:
        return d
    return prev_trading_day(d)


def trading_days_between(older, newer):
    """How many sessions `older` is behind `newer` (0 if same day or ahead)."""
    if older >= newer:
        return 0
    n, d = 0, older
    while d < newer:
        d += dt.timedelta(days=1)
        if is_trading_day(d):
            n += 1
    return n


def parse_iso(s):
    """'2026-09-30' or '2026-09-30T22:31:00Z' -> date, or None."""
    if not isinstance(s, str) or len(s) < 10:
        return None
    try:
        return dt.date.fromisoformat(s[:10])
    except ValueError:
        return None


def parse_utc(s):
    """'2026-09-30T22:31:00Z' -> aware datetime in UTC, or None."""
    if not isinstance(s, str) or len(s) < 19:
        return None
    try:
        return dt.datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S").replace(
            tzinfo=dt.timezone.utc)
    except ValueError:
        return None
