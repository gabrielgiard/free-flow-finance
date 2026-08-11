"""Build price history for the charts, and write docs/history.js.

Tries several sources in order, because every single-source attempt so far has
failed from inside GitHub Actions:

    Stooq          returns "no data" for every symbol -- endpoint retired
    FRED           times out; appears to refuse datacentre traffic
    Finnhub        quotes are free, historical candles are paid-only

So this no longer bets on one provider. It tries each in turn and takes the
first that answers:

    1. Yahoo Finance v8 chart   no key, a full year in one call, fast
    2. Twelve Data              needs TWELVEDATA_API_KEY, 800 credits/day
    3. Daily accumulator        always works; one point per run, no API at all

If sources 1 and 2 both fail, charts still fill -- just a day at a time. The
accumulator is the floor, not the plan.

    python fetch_history.py               # backfill what's missing, then top up
    python fetch_history.py --test        # try both sources on 3 symbols, exit
    python fetch_history.py --limit 20    # backfill at most 20 series
    python fetch_history.py --no-backfill # today's close only, no API calls
"""

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from build import load_companies  # noqa: E402

YAHOO = ("https://query1.finance.yahoo.com/v8/finance/chart/{}"
         "?range=1y&interval=1d")
TWELVE = ("https://api.twelvedata.com/time_series"
          "?symbol={}&interval=1day&outputsize={}&apikey={}")

# Yahoo returns "Edge: Not Found" to requests without a browser user agent.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

MAX_POINTS = 260          # about one trading year
YAHOO_PAUSE = 0.6         # unofficial endpoint; stay gentle
TWELVE_PAUSE = 8.0        # free tier allows 8 calls/minute
# Refresh rule. The first version skipped anything with 200+ points, which
# meant history FROZE after the initial backfill and only grew via the daily
# accumulator. If that chain broke, history went quietly stale -- and since
# build.py now reads the last close as a price fallback, stale history means
# wrong prices. So the test is recency, not depth.
STALE_AFTER_DAYS = 4
HISTORY_PATH = os.path.join(HERE, "docs", "history.js")

# Homepage sparklines, plus ^TNX -- the 10-year Treasury yield. That last one
# is not decorative: it is the risk-free rate every WACC in the library is
# built from, so fetching it lets the model recalibrate itself when rates move.
# Yahoo quotes ^TNX as the yield times ten (43.0 means 4.30%).
MARKET = ["SPY", "QQQ", "GLD", "BNO", "^TNX"]

# Foreign primaries Finnhub's free tier does not cover. Yahoo does, using
# exchange suffixes -- .PA Paris, .SW Zurich, .DE Frankfurt, .KS Korea,
# .NS India. Mapping them here means these eight finally get real prices
# and real charts, instead of sitting on hardcoded estimates forever.
# Each entry is (Yahoo symbol, rough FX rate to USD). The rate matters: Yahoo
# quotes each listing in its LOCAL currency, so Samsung comes back in won at
# ~76,500. Fed in as dollars that produces a $451 trillion market cap. These
# rates are approximate and drift, which is exactly why the ADR route below is
# better where one exists.
FOREIGN = {
    "MC":       ("MC.PA",       1.08),    # LVMH     — Paris, EUR
    "OR":       ("OR.PA",       1.08),    # L'Oreal  — Paris, EUR
    "NESN":     ("NESN.SW",     1.13),    # Nestle   — Zurich, CHF
    "SIE":      ("SIE.DE",      1.08),    # Siemens  — XETRA, EUR
    "005930":   ("005930.KS",   0.00072), # Samsung  — Seoul, KRW
    "RELIANCE": ("RELIANCE.NS", 0.0115),  # Reliance — Mumbai, INR
    "TCEHY":    ("TCEHY",       1.0),     # Tencent ADR — already USD
    "BYDDY":    ("BYDDY",       1.0),     # BYD ADR     — already USD
}

# Nothing is skipped outright any more: everything has a route to real data.
SKIP = set()


def _get(url, headers=None, timeout=25):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode()), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except json.JSONDecodeError:
        return None, "not JSON"
    except Exception as e:
        return None, type(e).__name__


def from_yahoo(symbol):
    """(dates, closes) oldest-first from Yahoo's chart endpoint, or (None, why)."""
    # ^TNX and other index symbols start with a caret, which is not valid in a
    # URL path unencoded — the request silently fails, which is why the
    # Treasury yield never arrived and WACC never recalibrated.
    data, err = _get(YAHOO.format(urllib.parse.quote(symbol, safe="")),
                     headers={"User-Agent": UA})
    if err:
        return None, err

    try:
        res = data["chart"]["result"][0]
        stamps = res["timestamp"]
        closes = res["indicators"]["quote"][0]["close"]
    except (KeyError, IndexError, TypeError):
        return None, "unexpected shape"

    dates, vals = [], []
    for ts, c in zip(stamps, closes):
        if c is None:                       # Yahoo nulls out holidays
            continue
        try:
            v = float(c)
        except (TypeError, ValueError):
            continue
        if v <= 0:
            continue
        dates.append(time.strftime("%Y-%m-%d", time.gmtime(ts)))
        vals.append(round(v, 2))

    if len(vals) < 5:
        return None, f"only {len(vals)} usable points"
    return (dates[-MAX_POINTS:], vals[-MAX_POINTS:]), None


def from_twelve(symbol, key):
    """Same contract, via Twelve Data."""
    if not key:
        return None, "no API key"
    data, err = _get(TWELVE.format(symbol, MAX_POINTS, key))
    if err:
        return None, err
    if isinstance(data, dict) and data.get("status") == "error":
        return None, str(data.get("message", "error"))[:60]

    values = data.get("values")
    if not isinstance(values, list) or not values:
        return None, "no values"

    dates, vals = [], []
    for row in reversed(values):            # API returns newest first
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
        vals.append(round(v, 2))

    if len(vals) < 5:
        return None, f"only {len(vals)} usable points"
    return (dates, vals), None


def days_since(date_str):
    """Whole days between an ISO date and today. Returns a huge number if the
    date is missing or malformed, so anything suspect gets refreshed rather
    than trusted."""
    if not isinstance(date_str, str) or len(date_str) < 10:
        return 9999
    try:
        y, m, d = (int(x) for x in date_str[:10].split("-"))
    except ValueError:
        return 9999
    try:
        then = time.mktime((y, m, d, 12, 0, 0, 0, 0, -1))
    except (ValueError, OverflowError):
        return 9999
    return int((time.time() - then) / 86400)


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
    """Append today's close from prices.json — but ONLY where Yahoo gave us
    nothing.

    This used to append to every series unconditionally, which quietly
    corrupted things: a company with a clean year of Yahoo data would get one
    Finnhub point stapled on the end. Since build.py reads the last point as
    the price, that one bad value became the displayed price AND the final
    point of the chart — so the chart and the price disagreed with each other
    and both were wrong.

    Yahoo's series is internally consistent. Do not contaminate it. The
    accumulator now only fills genuine gaps.
    """
    try:
        prices = json.load(open(os.path.join(HERE, "prices.json")))
    except (FileNotFoundError, json.JSONDecodeError):
        return 0

    stamp = prices.get("_fetched_at", "")[:10] or time.strftime("%Y-%m-%d")
    n = skipped = 0
    for tick, px in prices.items():
        if tick.startswith("_") or not isinstance(px, (int, float)) or px <= 0:
            continue
        e = hist.get(tick)

        # Series already has a real, current run of data from Yahoo. Leave it
        # completely alone.
        if e and len(e.get("c", [])) >= 20 and days_since(e.get("to")) <= STALE_AFTER_DAYS:
            skipped += 1
            continue

        e = hist.setdefault(tick, {"from": stamp, "to": stamp, "c": []})
        if e.get("to") == stamp and e["c"]:
            continue
        e["c"] = (e["c"] + [round(float(px), 2)])[-MAX_POINTS:]
        e["to"] = stamp
        e.setdefault("from", stamp)
        n += 1

    if skipped:
        print(f"Left {skipped} Yahoo series untouched (already current).")
    return n


def main():
    args = sys.argv[1:]
    key = os.environ.get("TWELVEDATA_API_KEY")
    hist = load_history()

    if "--test" in args:
        print("Testing both sources on three symbols.\n")
        for sym in ["AAPL", "NVDA", "SPY", "MC.PA", "NESN.SW"]:
            r, e = from_yahoo(sym)
            print(f"  Yahoo      {sym:5s} " +
                  (f"OK   {len(r[1])} points, {r[0][0]} to {r[0][-1]}" if r else f"FAIL {e}"))
            time.sleep(YAHOO_PAUSE)
        print()
        for sym in ["AAPL", "NVDA", "SPY"]:
            r, e = from_twelve(sym, key)
            print(f"  TwelveData {sym:5s} " +
                  (f"OK   {len(r[1])} points, {r[0][0]} to {r[0][-1]}" if r else f"FAIL {e}"))
            time.sleep(TWELVE_PAUSE if key else 0)
        print("\nIf either source shows OK, charts will fill on the next run.")
        return 0

    limit = None
    if "--limit" in args:
        try:
            limit = int(args[args.index("--limit") + 1])
        except (IndexError, ValueError):
            pass

    if "--no-backfill" not in args:
        def needs_refresh(sym):
            e = hist.get(sym)
            if not e or not e.get("c"):
                return True                    # nothing stored at all
            if len(e["c"]) < 20:
                return True                    # too thin to be a real chart
            return days_since(e.get("to")) > STALE_AFTER_DAYS

        targets = [c["t"] for c in load_companies() if needs_refresh(c["t"])]
        targets += [s for s in MARKET if needs_refresh(s)]
        if limit:
            targets = targets[:limit]

        if not targets:
            print(f"Every series is current (newest point within "
                  f"{STALE_AFTER_DAYS} days) — nothing to fetch.")
        else:
            print(f"Backfilling {len(targets)} series.")
            print("Trying Yahoo Finance first, falling back to Twelve Data.\n")
            by_source = {"yahoo": 0, "twelve": 0}
            failures = []
            yahoo_dead = False        # after enough consecutive failures, stop trying

            for i, sym in enumerate(targets, 1):
                res = err = None

                ysym, fx = FOREIGN.get(sym, (sym, 1.0))
                if not yahoo_dead:
                    res, err = from_yahoo(ysym)
                    if res and fx != 1.0:
                        # convert the whole series to USD so it is comparable
                        # with every other company in the library
                        d, c = res
                        res = (d, [round(v * fx, 2) for v in c])
                    if res:
                        by_source["yahoo"] += 1
                    time.sleep(YAHOO_PAUSE)
                    # If Yahoo fails the first 8 in a row it is blocked, not flaky.
                    if not res and i >= 8 and by_source["yahoo"] == 0:
                        yahoo_dead = True
                        print("  Yahoo failed on the first 8 symbols — treating it as\n"
                              "  blocked and switching to Twelve Data for the rest.\n")

                if not res:
                    res, err2 = from_twelve(sym, key)
                    if res:
                        by_source["twelve"] += 1
                    else:
                        err = f"yahoo: {err}; twelve: {err2}"
                    time.sleep(TWELVE_PAUSE if key else 0)

                if res:
                    d, c = res
                    hist[sym] = {"from": d[0], "to": d[-1], "c": c}
                else:
                    failures.append(f"{sym}: {err}")

                if i % 10 == 0 or i == len(targets):
                    done = by_source["yahoo"] + by_source["twelve"]
                    print(f"  {i:3d}/{len(targets)}  {done} ok "
                          f"(yahoo {by_source['yahoo']}, twelve {by_source['twelve']}), "
                          f"{len(failures)} failed")
                    save_history(hist)     # checkpoint: a timeout loses nothing

            print(f"\nBackfill complete — Yahoo {by_source['yahoo']}, "
                  f"Twelve Data {by_source['twelve']}, failed {len(failures)}.")
            if failures:
                print("Failed (these accumulate one point per day instead):")
                for f_ in failures[:10]:
                    print("  - " + f_)
                if len(failures) > 10:
                    print(f"  ... and {len(failures) - 10} more")

    n = accumulate(hist)
    if n:
        print(f"Appended today's close for {n} tickers.")

    series = [k for k in hist if not k.startswith("_")]
    deep = [k for k in series if len(hist[k].get("c", [])) >= 20]
    hist["_meta"] = {"updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                     "series": len(series)}
    save_history(hist)
    print(f"\nWrote {HISTORY_PATH} "
          f"({os.path.getsize(HISTORY_PATH)/1024:.0f} KB)")
    print(f"{len(series)} series stored, {len(deep)} with 20+ points.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
