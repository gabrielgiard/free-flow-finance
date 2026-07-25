"""Build price history for the charts, and write docs/history.js.

Two sources, deliberately, so the charts don't depend on any one of them:

  1. ACCUMULATE from prices.json. Every time the daily job runs, today's close
     gets appended. This is the reliable path — it uses the same free Finnhub
     quotes that already power the site, so if it works, charts work. It just
     starts empty and fills out a day at a time.

  2. BACKFILL from Stooq (stooq.com). Free, no API key, and if it works you get
     a year of history instantly instead of waiting for it to accumulate.
     Treat this as a bonus, not a dependency: Stooq has no official API, the
     CSV endpoint is undocumented, and they have started offering an apikey
     parameter, so it may stop working without notice. Nothing breaks if it
     does — the accumulator keeps going.

Why not Finnhub for history: their /stock/candle endpoint was moved to the
premium tiers and returns 403 on a free key. Quotes are free, candles are not.

Run:
    python fetch_history.py            # try backfill, then accumulate
    python fetch_history.py --test     # check 3 Stooq symbols and exit
    python fetch_history.py --no-backfill   # accumulate only, skip Stooq

Output: docs/history.js -- a separate file from data.js on purpose, so that
if history is missing or stale the rest of the site still works normally.
"""

import csv
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from build import load_companies  # noqa: E402

STOOQ = "https://stooq.com/q/d/l/?s={}&i=d"
MAX_POINTS = 260          # about one trading year
REQUEST_PAUSE = 0.4       # be polite to a free public service
HISTORY_PATH = os.path.join(HERE, "docs", "history.js")

# Tickers whose Stooq symbol differs from "<ticker>.us".
STOOQ_OVERRIDES = {
    "BRK.B": "brk-b.us",
}

# Not on Stooq's US list (foreign primary listings). Their charts will build
# up from the accumulator instead, or stay empty if they're also in the
# fetch_prices SKIP list.
STOOQ_SKIP = {"MC", "OR", "NESN", "SIE", "005930", "RELIANCE"}


def stooq_symbol(ticker):
    if ticker in STOOQ_OVERRIDES:
        return STOOQ_OVERRIDES[ticker]
    return ticker.lower() + ".us"


def fetch_stooq(symbol):
    """Return (dates, closes) from Stooq, or (None, None) on any failure.

    Stooq returns CSV: Date,Open,High,Low,Close,Volume
    A symbol it doesn't know returns a body containing 'No data'.
    """
    url = STOOQ.format(symbol)
    req = urllib.request.Request(url, headers={"User-Agent": "freeflow-finance/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, f"{type(e).__name__}"

    if "No data" in body or "Date" not in body[:200]:
        return None, "no data for symbol"

    dates, closes = [], []
    try:
        for row in csv.DictReader(io.StringIO(body)):
            close = row.get("Close")
            date = row.get("Date")
            if not close or not date or close in ("N/A", "-"):
                continue
            try:
                closes.append(round(float(close), 2))
                dates.append(date)
            except ValueError:
                continue
    except Exception as e:
        return None, f"parse error {type(e).__name__}"

    if len(closes) < 10:
        return None, f"only {len(closes)} points"

    return (dates[-MAX_POINTS:], closes[-MAX_POINTS:]), None


def load_history():
    """Read the existing history.js back into a dict."""
    try:
        with open(HISTORY_PATH) as f:
            text = f.read()
    except FileNotFoundError:
        return {}
    prefix = "var FF_HISTORY = "
    if not text.startswith(prefix):
        return {}
    try:
        return json.loads(text[len(prefix):].rstrip().rstrip(";"))
    except json.JSONDecodeError:
        return {}


def save_history(hist):
    os.makedirs(os.path.dirname(HISTORY_PATH), exist_ok=True)
    with open(HISTORY_PATH, "w") as f:
        f.write("var FF_HISTORY = ")
        json.dump(hist, f, separators=(",", ":"))
        f.write(";\n")


def accumulate(hist):
    """Append today's price from prices.json to each series."""
    try:
        with open(os.path.join(HERE, "prices.json")) as f:
            prices = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print("No prices.json — nothing to accumulate.")
        return 0

    stamp = prices.get("_fetched_at", "")[:10] or time.strftime("%Y-%m-%d")
    n = 0
    for tick, px in prices.items():
        if tick.startswith("_") or not isinstance(px, (int, float)) or px <= 0:
            continue
        entry = hist.setdefault(tick, {"from": stamp, "to": stamp, "c": []})
        # don't double-append if the job runs twice in one day
        if entry.get("to") == stamp and entry["c"]:
            continue
        entry["c"].append(round(float(px), 2))
        entry["c"] = entry["c"][-MAX_POINTS:]
        entry["to"] = stamp
        entry.setdefault("from", stamp)
        n += 1
    return n


# ---------------------------------------------------------------------------
# Market levels for the homepage come from FRED (Federal Reserve Bank of
# St. Louis). Stooq stopped serving us entirely -- every symbol returned
# "no data" -- so this replaced it. FRED is an official government source,
# needs no API key for the CSV endpoint, and is far less likely to vanish.
#
# Series IDs can be looked up at fred.stlouisfed.org; the ID appears in the
# page title and URL of any series.
# ---------------------------------------------------------------------------
FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={}"

# meta key -> (FRED series id, label for logs, key used in history.js)
FRED_SERIES = {
    "spx":   ("SP500",        "S&P 500",                "SPX"),
    "ndx":   ("NASDAQCOM",    "Nasdaq Composite",       "NDX"),
    "vix":   ("VIXCLS",       "VIX",                    "VIX"),
    "brent": ("DCOILBRENTEU", "Brent crude",            "BRENT"),
    "rf":    ("DGS10",        "10-year Treasury yield", "US10Y"),
}


def fetch_fred(series_id):
    """Full daily series from FRED as (dates, values), or (None, reason).

    FRED returns CSV shaped like:
        observation_date,SP500
        2026-07-23,7612.40
    Missing days (holidays, weekends) are written as "." and skipped.

    We return the whole series rather than just the last value, because the
    homepage sparklines need the history and this saves a second request.
    """
    url = FRED_CSV.format(series_id)
    req = urllib.request.Request(url, headers={"User-Agent": "freeflow-finance/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, type(e).__name__

    rows = [ln for ln in body.splitlines() if ln.strip()]
    if len(rows) < 2:
        return None, "empty response"

    dates, values = [], []
    for line in rows[1:]:
        parts = line.split(",")
        if len(parts) < 2:
            continue
        date, raw = parts[0].strip(), parts[1].strip()
        if raw in (".", "", "NA"):      # holidays and gaps
            continue
        try:
            values.append(round(float(raw), 2))
            dates.append(date)
        except ValueError:
            continue

    if not values:
        return None, "no usable values"
    return (dates[-MAX_POINTS:], values[-MAX_POINTS:]), None


def write_market_snapshot(hist):
    """Fetch homepage market levels and sparkline history from FRED.

    Writes market.json (the headline numbers) and adds the series to hist
    (the sparklines under them). Anything that fails simply isn't written, so
    build.py keeps the value it already has. Fed funds is deliberately absent
    -- it's a target range set at FOMC meetings, not a traded price, so it
    stays manual in build.py.
    """
    out, dates, failures = {}, [], []
    print("\nFetching market levels from FRED...")
    for meta_key, (series_id, label, hist_key) in FRED_SERIES.items():
        result, err = fetch_fred(series_id)
        if result:
            series_dates, series_vals = result
            val = series_vals[-1]
            # Index levels read better whole; rates and commodities need decimals.
            out[meta_key] = round(val) if meta_key in ("spx", "ndx") else val
            dates.append(series_dates[-1])
            # feed the sparkline under this number too
            hist[hist_key] = {"from": series_dates[0], "to": series_dates[-1],
                              "c": series_vals}
            print(f"  OK   {label:24s} {out[meta_key]:>10}   ({len(series_vals)} pts, to {series_dates[-1]})")
        else:
            failures.append(f"{label} [{series_id}]: {err}")
            print(f"  MISS {label:24s} {err}")
        time.sleep(REQUEST_PAUSE)

    if not out:
        print("\nNo market levels fetched — homepage figures keep their stored values.")
        return

    if dates:
        out["asof_iso"] = max(dates)

    path = os.path.join(HERE, "market.json")
    with open(path, "w") as f:
        json.dump(out, f, indent=2, sort_keys=True)
    print(f"\nWrote {path} ({len(out) - 1} of {len(FRED_SERIES)} levels)")
    if failures:
        print("Missing (these keep their previous values):")
        for f_ in failures:
            print(f"  - {f_}")


def main():
    args = sys.argv[1:]
    test_mode = "--test" in args
    do_backfill = "--no-backfill" not in args

    companies = load_companies()
    hist = load_history()

    if test_mode:
        print("Testing both data sources.\n")
        print("FRED (homepage market levels) — the one that matters most:")
        for meta_key, (sid, label, _) in FRED_SERIES.items():
            result, err = fetch_fred(sid)
            if result:
                d, v = result
                print(f"  OK   {label:24s} {v[-1]:>10}  ({len(v)} pts, to {d[-1]})")
            else:
                print(f"  FAIL {label:24s} {err}")
            time.sleep(REQUEST_PAUSE)

        print("\nStooq (optional company-history backfill):")
        for sym in ["nvda.us", "aapl.us"]:
            result, err = fetch_stooq(sym)
            if result:
                d, c = result
                print(f"  OK   {sym:10s} {len(c)} points, {d[0]} to {d[-1]}")
            else:
                print(f"  FAIL {sym:10s} {err}")
            time.sleep(REQUEST_PAUSE)
        print("\nStooq failing is survivable — company charts build up from")
        print("daily prices instead. FRED failing means the homepage numbers")
        print("will not update.")
        return 0

    if do_backfill:
        targets = [(c["t"], stooq_symbol(c["t"])) for c in companies
                   if c["t"] not in STOOQ_SKIP]
        print(f"Backfilling {len(targets)} series from Stooq...\n")

        ok = fail = 0
        failures = []
        for i, (key, sym) in enumerate(targets, 1):
            result, err = fetch_stooq(sym)
            if result:
                dates, closes = result
                hist[key] = {"from": dates[0], "to": dates[-1], "c": closes}
                ok += 1
                if i % 20 == 0 or i == len(targets):
                    print(f"  {i:3d}/{len(targets)} ... {ok} ok, {fail} failed")
            else:
                fail += 1
                failures.append(f"{key} ({sym}): {err}")
            time.sleep(REQUEST_PAUSE)

        print(f"\nBackfill complete: {ok} succeeded, {fail} failed.")
        if failures:
            print("\nFailed symbols (these will build up from daily prices instead):")
            for f in failures[:15]:
                print(f"  - {f}")
            if len(failures) > 15:
                print(f"  ... and {len(failures)-15} more")
        if ok == 0:
            print("\nStooq returned nothing — it appears to have stopped serving")
            print("this endpoint. Not a problem: company charts build up one day")
            print("at a time from the Finnhub prices instead, and the homepage")
            print("market levels come from FRED below.")

    n = accumulate(hist)
    if n:
        print(f"\nAppended today's close for {n} tickers.")

    # Must run before save_history: this adds the index/commodity series that
    # the homepage sparklines read.
    write_market_snapshot(hist)

    hist["_meta"] = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "series": len([k for k in hist if not k.startswith("_")]),
    }
    save_history(hist)
    size = os.path.getsize(HISTORY_PATH) / 1024
    print(f"\nWrote {HISTORY_PATH} ({size:.0f} KB, "
          f"{hist['_meta']['series']} series)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
