"""Fetch upcoming (and just-reported) earnings dates into earnings.json.

Uses Finnhub's earnings calendar (free tier): one call returns every US-listed
company reporting in a date range, with the expected day, before or after the
market, and the consensus estimates; after the report it also carries the
actual figures. The library's US listings and US-listed foreign shares are
covered. Companies priced from a home exchange abroad (Airbus in Paris, Sony
in Tokyo...) are not on Finnhub's free calendar, so they show no date.

It asks for two weeks back (to show "just reported" results) and about three
months ahead, in one-week slices, so a busy week cannot be cut short:
roughly 15 calls, about 20 seconds.

    python fetch_earnings.py            # fetch and write earnings.json
    python fetch_earnings.py --dry-run  # print what it found, write nothing

Nothing here is required: if the key is missing or Finnhub refuses, the run
says so, the old earnings.json stays, and the site simply shows fewer dates.
"""

import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

URL = "https://finnhub.io/api/v1/calendar/earnings?from={}&to={}&token={}"
OUT = os.path.join(HERE, "earnings.json")
BACK_DAYS, AHEAD_DAYS, STEP = 14, 98, 7
PAUSE = 1.1
HOURS = {"bmo": "bmo", "amc": "amc", "dmh": "dmh"}   # before open, after close, during hours


def get(url):
    try:
        with urllib.request.urlopen(url, timeout=25) as r:
            return json.loads(r.read().decode()), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:  # network, JSON
        return None, type(e).__name__


def num(v):
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) and v == v else None


def clean(row):
    """One calendar row -> the few fields the site uses, or None if unusable."""
    d = row.get("date")
    try:
        dt.date.fromisoformat(d)
    except (TypeError, ValueError):
        return None
    out = {"d": d, "h": HOURS.get(row.get("hour") or "", "")}
    for src, k in (("quarter", "q"), ("year", "y")):
        v = row.get(src)
        if isinstance(v, int) and not isinstance(v, bool):
            out[k] = v
    for src, k in (("epsEstimate", "eps_e"), ("epsActual", "eps_a"),
                   ("revenueEstimate", "rev_e"), ("revenueActual", "rev_a")):
        v = num(row.get(src))
        if v is not None:
            out[k] = round(v / 1e9, 4) if k.startswith("rev") else round(v, 4)
    return out


def main():
    args = sys.argv[1:]
    key = os.environ.get("FINNHUB_API_KEY")
    if not key:
        print("FINNHUB_API_KEY is not set — earnings dates not updated (the site keeps the last ones).")
        return 0

    from build import load_companies
    from fetch_prices import QUOTE_ALIASES
    from foreign_listings import FOREIGN_LISTINGS
    tickers = [c["t"] for c in load_companies() if c["t"] not in FOREIGN_LISTINGS]
    # the calendar spells a few symbols differently from the site
    lookup = {t: t for t in tickers}
    lookup.update({t.replace(".", "-"): t for t in tickers if "." in t})
    lookup.update({t.replace(".", ""): t for t in tickers if "." in t})
    lookup.update({alias: t for t, alias in QUOTE_ALIASES.items() if t in tickers})

    today = dt.date.today()
    start, end = today - dt.timedelta(days=BACK_DAYS), today + dt.timedelta(days=AHEAD_DAYS)
    found, calls, errors = {}, 0, []
    day = start
    while day <= end:
        stop = min(day + dt.timedelta(days=STEP - 1), end)
        data, err = get(URL.format(day.isoformat(), stop.isoformat(), key))
        calls += 1
        if err or not isinstance(data, dict):
            errors.append(f"{day}..{stop}: {err or 'unexpected reply'}")
            if err in ("HTTP 401", "HTTP 403"):
                print(f"Finnhub refused the earnings calendar ({err}). Check the key; "
                      "the old earnings.json is kept.")
                return 0
        else:
            for row in data.get("earningsCalendar") or []:
                if not isinstance(row, dict):
                    continue
                t = lookup.get(str(row.get("symbol") or "").upper())
                e = clean(row) if t else None
                if not e:
                    continue
                # keep the next upcoming report, and the latest one already out
                slot = "next" if e["d"] >= today.isoformat() else "last"
                cur = found.setdefault(t, {}).get(slot)
                if cur is None or (e["d"] < cur["d"] if slot == "next" else e["d"] > cur["d"]):
                    found[t][slot] = e
        day = stop + dt.timedelta(days=1)
        time.sleep(PAUSE)

    upcoming = sum(1 for v in found.values() if "next" in v)
    print(f"Earnings calendar: {calls} calls, {upcoming} upcoming dates and "
          f"{sum(1 for v in found.values() if 'last' in v)} recent reports for "
          f"{len(found)} of {len(tickers)} US-listed companies.")
    for e in errors[:5]:
        print("  failed " + e)
    if not found:
        print("Nothing found — earnings.json left as it was.")
        return 0
    if "--dry-run" in args:
        for t in sorted(found)[:20]:
            print(f"  {t:8s} {found[t]}")
        return 0
    found["_fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(OUT, "w") as f:
        json.dump(found, f, separators=(",", ":"), sort_keys=True)
    print(f"Wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
