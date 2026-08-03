"""Build price history for the charts, and write docs/history.js.

Backfills roughly a year of daily closes per company from Twelve Data, then
tops up with today's close on every subsequent run.

Why Twelve Data: the two obvious free sources both failed from inside GitHub
Actions. Stooq stopped serving its CSV endpoint entirely and now returns "no
data" for every symbol. FRED times out -- it appears to refuse datacentre
traffic. Finnhub covers quotes on the free tier but puts historical candles
behind a paid plan. Twelve Data's /time_series is on the free tier at one
credit per symbol, 800 credits a day, comfortably more than the ~200 needed.

The rate limit is 8 calls a minute, so a full backfill takes about half an
hour. That happens ONCE. Afterwards every series already has deep history and
gets skipped, so the daily run costs no credits and finishes in seconds.

    python fetch_history.py               # backfill anything missing, then top up
    python fetch_history.py --test        # check three symbols and exit
    python fetch_history.py --limit 20    # backfill at most 20 series
    python fetch_history.py --no-backfill # today's close only, no API calls

Set TWELVEDATA_API_KEY as a repository secret. Without it this still runs --
it just skips the backfill and appends today's close, as before.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from build import load_companies  # noqa: E402

TS = ("https://api.twelvedata.com/time_series"
      "?symbol={}&interval=1day&outputsize={}&apikey={}")

MAX_POINTS = 260          # about one trading year
PAUSE = 8.0               # free tier allows 8 calls/minute; 8s stays inside it
BACKFILL_IF_UNDER = 200   # already has this many points? leave it alone
HISTORY_PATH = os.path.join(HERE, "docs", "history.js")

# Market context series for the homepage sparklines.
MARKET = {"SPY": "S&P 500 ETF", "QQQ": "Nasdaq 100 ETF",
          "GLD": "Gold ETF", "BNO": "Brent Oil ETF"}

# Foreign primaries the free tier may not cover. These accumulate one point a
# day from prices.json instead.
SKIP = {"MC", "OR", "NESN", "SIE", "005930", "RELIANCE", "TCEHY", "BYDDY"}


def fetch_series(symbol, key, points=MAX_POINTS):
    """Return (dates, closes) oldest-first, or (None, reason)."""
    try:
        with urllib.request.urlopen(TS.format(symbol, points, key), timeout=30) as r:
            data = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, type(e).__name__

    if isinstance(data, dict) and data.get("status") == "error":
        return None, str(data.get("message", "error"))[:70]

    values = data.get("values")
    if not isinstance(values, list) or not values:
        return None, "no values returned"

    dates, closes = [], []
    for row in reversed(values):          # API returns newest first
        d, c = row.get("datetime"), row.get("close")
        if not d or c in (None, ""):
            continue
        try:
            v = float(c)
        except (TypeError, ValueError):
            continue
        if v <= 0:
            continue
        dates.append(d[:10])
        closes.append(round(v, 2))

    if len(closes) < 5:
        return None, f"only {len(closes)} usable points"
    return (dates, closes), None


def load_history():
    try:
        text = open(HISTORY_PATH).read()
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
    """Append today's close from prices.json. Costs no API calls."""
    try:
        prices = json.load(open(os.path.join(HERE, "prices.json")))
    except (FileNotFoundError, json.JSONDecodeError):
        return 0

    stamp = prices.get("_fetched_at", "")[:10] or time.strftime("%Y-%m-%d")
    n = 0
    for tick, px in prices.items():
        if tick.startswith("_") or not isinstance(px, (int, float)) or px <= 0:
            continue
        e = hist.setdefault(tick, {"from": stamp, "to": stamp, "c": []})
        if e.get("to") == stamp and e["c"]:
            continue                       # already recorded today
        e["c"] = (e["c"] + [round(float(px), 2)])[-MAX_POINTS:]
        e["to"] = stamp
        e.setdefault("from", stamp)
        n += 1
    return n


def main():
    args = sys.argv[1:]
    key = os.environ.get("TWELVEDATA_API_KEY")
    hist = load_history()

    if "--test" in args:
        if not key:
            print("TWELVEDATA_API_KEY not set — cannot test.")
            return 0
        print("Testing three symbols against Twelve Data...\n")
        for sym in ["AAPL", "NVDA", "SPY"]:
            res, err = fetch_series(sym, key, 30)
            if res:
                d, c = res
                print(f"  OK   {sym:6s} {len(c)} points, {d[0]} to {d[-1]}, last {c[-1]}")
            else:
                print(f"  FAIL {sym:6s} {err}")
            time.sleep(PAUSE)
        return 0

    limit = None
    if "--limit" in args:
        try:
            limit = int(args[args.index("--limit") + 1])
        except (IndexError, ValueError):
            pass

    if "--no-backfill" in args or not key:
        if not key:
            print("TWELVEDATA_API_KEY not set — skipping backfill, "
                  "appending today's close only.")
    else:
        # Only fetch what genuinely needs it. After the first full backfill
        # this list is empty and the step costs nothing.
        targets = [c["t"] for c in load_companies()
                   if c["t"] not in SKIP
                   and len(hist.get(c["t"], {}).get("c", [])) < BACKFILL_IF_UNDER]
        targets += [s for s in MARKET
                    if len(hist.get(s, {}).get("c", [])) < BACKFILL_IF_UNDER]
        if limit:
            targets = targets[:limit]

        if not targets:
            print("Every series already has deep history — nothing to backfill.")
        else:
            mins = len(targets) * PAUSE / 60
            print(f"Backfilling {len(targets)} series (~{mins:.0f} min at "
                  f"8 calls/minute). This only happens once.\n")
            ok = fail = 0
            failures = []
            for i, sym in enumerate(targets, 1):
                res, err = fetch_series(sym, key)
                if res:
                    d, c = res
                    hist[sym] = {"from": d[0], "to": d[-1], "c": c}
                    ok += 1
                else:
                    fail += 1
                    failures.append(f"{sym}: {err}")
                if i % 10 == 0 or i == len(targets):
                    print(f"  {i:3d}/{len(targets)}  {ok} ok, {fail} failed")
                    save_history(hist)     # checkpoint: a timeout loses nothing
                time.sleep(PAUSE)

            print(f"\nBackfill: {ok} succeeded, {fail} failed.")
            if failures:
                print("Failed (these accumulate one point a day instead):")
                for f_ in failures[:12]:
                    print("  - " + f_)
                if len(failures) > 12:
                    print(f"  ... and {len(failures) - 12} more")

    n = accumulate(hist)
    if n:
        print(f"Appended today's close for {n} tickers.")

    series = [k for k in hist if not k.startswith("_")]
    deep = [k for k in series if len(hist[k].get("c", [])) >= 20]
    hist["_meta"] = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "series": len(series),
    }
    save_history(hist)
    size = os.path.getsize(HISTORY_PATH) / 1024
    print(f"\nWrote {HISTORY_PATH} ({size:.0f} KB)")
    print(f"{len(series)} series stored, {len(deep)} with 20+ points.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
