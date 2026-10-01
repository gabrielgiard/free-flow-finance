"""Build price history for the charts, and write docs/history.js.

Every run re-downloads a full year of daily closes for every series. That is
the fix for the staleness that kept coming back: the previous version only
re-downloaded a chart once it was more than four days old, so on a normal day
it fetched nothing, the chart froze, and -- because the site's price is the
chart's last point -- the price froze with it. It caught up every few days
and then froze again. Now there is no skip: ~240 calls a day, about three
minutes, and every chart ends at the latest close.

Sources, tried in order per symbol:

    1. Yahoo Finance v8 chart   no key, a full year in one call
    2. Twelve Data              needs TWELVEDATA_API_KEY, 800 credits/day

If both fail for a symbol, its existing series is kept, and then topped up
with that day's quote from prices.json (see top_up_from_quotes). So a chart
can never fall behind the price shown next to it.

    python fetch_history.py               # refresh every series, then top up
    python fetch_history.py --test        # try both sources on a few symbols
    python fetch_history.py --limit 20    # refresh at most 20 series
    python fetch_history.py --no-backfill # quotes top-up only, no API calls

FILE FORMAT (docs/history.js)

    var FF_HISTORY = {
      "NVDA": {"from": "2025-10-01", "to": "2026-09-30",
               "c": [181.2, 183.9, ...],       daily closes, USD
               "d": [0, 1, 2, 5, ...]},        days after "from", one per close
      ...
      "_meta": {"updated": "...", "series": 239}
    };

"d" gives every point its real date, so the chart's axis and tooltip show
true trading dates rather than an evenly spaced guess.
"""

import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import market_calendar as cal  # noqa: E402

YAHOO_HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]
YAHOO_PATH = "/v8/finance/chart/{}?range=1y&interval=1d"
TWELVE = ("https://api.twelvedata.com/time_series"
          "?symbol={}&interval=1day&outputsize={}&apikey={}")

# Yahoo returns "Edge: Not Found" to requests without a browser user agent.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

MAX_POINTS = 260          # about one trading year
YAHOO_PAUSE = 0.6         # unofficial endpoint; stay gentle
TWELVE_PAUSE = 8.0        # free tier allows 8 calls/minute
HISTORY_PATH = os.path.join(HERE, "docs", "history.js")
PRICES_PATH = os.path.join(HERE, "prices.json")

# Homepage sparklines, plus ^TNX -- the 10-year Treasury yield. That last one
# is not decorative: it is the risk-free rate every WACC in the library is
# built from, so fetching it lets the model recalibrate itself when rates move.
MARKET = ["SPY", "QQQ", "GLD", "BNO", "^TNX"]

# Foreign primaries Finnhub's free tier does not cover. Yahoo does, using
# exchange suffixes. Each entry is (Yahoo symbol, rough FX rate to USD):
# Yahoo quotes each listing in its LOCAL currency, so Samsung comes back in
# won at ~76,500, which fed in as dollars is a $451 trillion market cap.
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


# ---------------------------------------------------------------- sources --

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


def _clean(dates, vals):
    """Pair up dates and closes, drop junk, de-duplicate dates (last wins),
    sort oldest-first, keep the last MAX_POINTS."""
    by_date = {}
    for d, v in zip(dates, vals):
        if cal.parse_iso(d) is None:
            continue
        if isinstance(v, bool):
            continue
        try:
            v = float(v)
        except (TypeError, ValueError):
            continue
        if not (v > 0 and v != float("inf")):
            continue
        by_date[d[:10]] = round(v, 2)
    keys = sorted(by_date)[-MAX_POINTS:]
    return keys, [by_date[k] for k in keys]


def from_yahoo(symbol):
    """(dates, closes) oldest-first from Yahoo's chart endpoint, or (None, why)."""
    # ^TNX and other index symbols start with a caret, which must be
    # URL-encoded or the request silently fails.
    quoted = urllib.parse.quote(symbol, safe="")

    # query1 is the host that gets rate-limited from shared datacentre IPs
    # (like GitHub's runners) first; query2 often still answers.
    data, err = None, "no hosts tried"
    for host in YAHOO_HOSTS:
        data, err = _get(f"https://{host}{YAHOO_PATH.format(quoted)}",
                         headers={"User-Agent": UA})
        if not err:
            break
    if err:
        return None, err

    try:
        res = data["chart"]["result"][0]
        stamps = res["timestamp"]
        closes = res["indicators"]["quote"][0]["close"]
        offset = int(res.get("meta", {}).get("gmtoffset") or 0)
    except (KeyError, IndexError, TypeError):
        return None, "unexpected shape"

    # Yahoo stamps each daily bar at the session open in UTC. Shifting by the
    # exchange's own offset gives the local trading date -- without it, Seoul
    # and Mumbai bars land on the previous calendar day.
    dates = [time.strftime("%Y-%m-%d", time.gmtime(ts + offset)) for ts in stamps]
    dates, vals = _clean(dates, closes)
    if len(vals) < 5:
        return None, f"only {len(vals)} usable points"
    return (dates, vals), None


def from_twelve(symbol, key):
    """Same contract, via Twelve Data."""
    if not key:
        return None, "no API key"
    data, err = _get(TWELVE.format(urllib.parse.quote(symbol, safe=""),
                                   MAX_POINTS, key))
    if err:
        return None, err
    if not isinstance(data, dict):
        return None, "unexpected shape"
    if data.get("status") == "error":
        return None, str(data.get("message", "error"))[:60]
    values = data.get("values")
    if not isinstance(values, list) or not values:
        return None, "no values"
    dates = [str(r.get("datetime", ""))[:10] for r in values if isinstance(r, dict)]
    closes = [r.get("close") for r in values if isinstance(r, dict)]
    dates, vals = _clean(dates, closes)
    if len(vals) < 5:
        return None, f"only {len(vals)} usable points"
    return (dates, vals), None


# ----------------------------------------------------------- file format --

def encode(dates, vals):
    """(dates, closes) -> stored series with day offsets."""
    start = cal.parse_iso(dates[0])
    return {
        "from": dates[0],
        "to": dates[-1],
        "c": vals,
        "d": [(cal.parse_iso(d) - start).days for d in dates],
    }


def decode(entry):
    """Stored series -> (dates, closes). Series written by older versions of
    this script have no "d"; their dates are rebuilt by counting trading days
    back from "to", which is exact except across market holidays."""
    closes = entry.get("c") if isinstance(entry, dict) else None
    if not isinstance(closes, list) or not closes:
        return [], []
    start = cal.parse_iso(entry.get("from"))
    offs = entry.get("d")
    if (start and isinstance(offs, list) and len(offs) == len(closes)
            and all(isinstance(o, int) and not isinstance(o, bool) for o in offs)):
        dates = [(start + dt.timedelta(days=o)).isoformat() for o in offs]
    else:
        end = cal.parse_iso(entry.get("to")) or cal.last_close_date()
        dates, d = [], end
        for _ in closes:
            dates.append(d.isoformat())
            d = cal.prev_trading_day(d)
        dates.reverse()
    return _clean(dates, closes)


def load_history():
    try:
        text = open(HISTORY_PATH).read()
    except FileNotFoundError:
        return {}
    prefix = "var FF_HISTORY = "
    if not text.startswith(prefix):
        return {}
    try:
        data = json.loads(text[len(prefix):].rstrip().rstrip(";"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def save_history(hist, previous=None):
    """Write docs/history.js. Skipped when no series changed, so a backup run
    that finds everything current does not create an empty commit."""
    series = {k: v for k, v in hist.items() if not k.startswith("_")}
    if previous is not None:
        old = {k: v for k, v in previous.items() if not k.startswith("_")}
        if json.dumps(old, sort_keys=True) == json.dumps(series, sort_keys=True):
            return False
    out = dict(sorted(series.items()))
    out["_meta"] = {"updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "series": len(series)}
    os.makedirs(os.path.dirname(HISTORY_PATH), exist_ok=True)
    tmp = HISTORY_PATH + ".tmp"
    with open(tmp, "w") as f:
        f.write("var FF_HISTORY = ")
        json.dump(out, f, separators=(",", ":"))
        f.write(";\n")
    os.replace(tmp, HISTORY_PATH)          # never leave a half-written file
    return True


# ------------------------------------------------------- quotes top-up --

def top_up_from_quotes(hist):
    """Add the day's quote to any chart that does not have that day yet.

    The quote in prices.json and the chart's last close must describe the
    same day, or the page shows a price that disagrees with its own chart.
    If Yahoo answered, the chart already ends at the latest close and nothing
    happens here. If Yahoo failed for a symbol, this appends the quote as a
    properly dated point, so the chart stays current anyway.

    The old accumulator did something similar without dates, and stapled
    quotes onto series that already had that day -- which is exactly how the
    price and the chart drifted apart before. The date check prevents it.
    """
    try:
        prices = json.load(open(PRICES_PATH))
    except (FileNotFoundError, json.JSONDecodeError):
        return 0
    if not isinstance(prices, dict):
        return 0
    fetched = cal.parse_utc(prices.get("_fetched_at", ""))
    if fetched is None:
        return 0
    qday = cal.quote_date(fetched)
    # A quote older than the latest close is no use to anyone.
    if cal.trading_days_between(qday, cal.last_close_date()) > 0:
        return 0
    qiso = qday.isoformat()

    added = 0
    for tick, px in prices.items():
        if tick.startswith("_") or isinstance(px, bool):
            continue
        if not isinstance(px, (int, float)) or not px > 0:
            continue
        dates, vals = decode(hist.get(tick, {}))
        if dates and dates[-1] >= qiso:
            continue                         # chart already has this day
        dates, vals = _clean(dates + [qiso], vals + [px])
        hist[tick] = encode(dates, vals)
        added += 1
    return added


# ------------------------------------------------------------------ main --

def main():
    args = sys.argv[1:]
    key = os.environ.get("TWELVEDATA_API_KEY")

    if "--test" in args:
        print("Testing both sources.\n")
        for sym in ["AAPL", "NVDA", "SPY", "^TNX", "MC.PA", "005930.KS"]:
            r, e = from_yahoo(sym)
            print(f"  Yahoo      {sym:10s} " +
                  (f"OK   {len(r[1])} points, {r[0][0]} to {r[0][-1]}, last {r[1][-1]}"
                   if r else f"FAIL {e}"))
            time.sleep(YAHOO_PAUSE)
        print()
        for sym in ["AAPL", "NVDA", "SPY"]:
            r, e = from_twelve(sym, key)
            print(f"  TwelveData {sym:10s} " +
                  (f"OK   {len(r[1])} points, {r[0][0]} to {r[0][-1]}" if r else f"FAIL {e}"))
            time.sleep(TWELVE_PAUSE if key else 0)
        print(f"\nLatest close the site should show: {cal.last_close_date()}")
        return 0

    limit = None
    if "--limit" in args:
        try:
            limit = int(args[args.index("--limit") + 1])
        except (IndexError, ValueError):
            pass

    previous = load_history()
    hist = {k: v for k, v in previous.items() if not k.startswith("_")}
    target_day = cal.last_close_date().isoformat()
    print(f"Latest close the site should show: {target_day}")

    failures, targets = [], []
    if "--no-backfill" not in args:
        from build import load_companies
        targets = [c["t"] for c in load_companies()] + MARKET
        targets = list(dict.fromkeys(targets))          # de-duplicate, keep order
        if limit:
            targets = targets[:limit]

        print(f"Refreshing {len(targets)} series (Yahoo first, Twelve Data as backup).\n")
        by_source = {"yahoo": 0, "twelve": 0}
        yahoo_dead = False

        for i, sym in enumerate(targets, 1):
            res = err = None
            ysym, fx = FOREIGN.get(sym, (sym, 1.0))
            if not yahoo_dead:
                res, err = from_yahoo(ysym)
                time.sleep(YAHOO_PAUSE)
                if res:
                    by_source["yahoo"] += 1
                elif i >= 8 and by_source["yahoo"] == 0:
                    yahoo_dead = True
                    print("  Yahoo failed on the first 8 symbols — treating it as "
                          "blocked and using Twelve Data for the rest.\n")

            if not res and sym not in FOREIGN:
                res, err2 = from_twelve(sym, key)
                if res:
                    by_source["twelve"] += 1
                else:
                    err = f"yahoo: {err}; twelve: {err2}"
                if key:
                    time.sleep(TWELVE_PAUSE)

            if res:
                dates, vals = res
                if fx != 1.0:
                    vals = [round(v * fx, 2) for v in vals]
                hist[sym] = encode(dates, vals)
            else:
                failures.append(f"{sym}: {err}")

            if i % 25 == 0 or i == len(targets):
                done = by_source["yahoo"] + by_source["twelve"]
                print(f"  {i:3d}/{len(targets)}  {done} ok "
                      f"(yahoo {by_source['yahoo']}, twelve {by_source['twelve']}), "
                      f"{len(failures)} failed")

        print(f"\nRefresh complete — Yahoo {by_source['yahoo']}, "
              f"Twelve Data {by_source['twelve']}, failed {len(failures)}.")
        if failures:
            print("Failed (kept their existing chart, topped up from quotes below):")
            for f_ in failures[:10]:
                print("  - " + f_)
            if len(failures) > 10:
                print(f"  ... and {len(failures) - 10} more")

    n = top_up_from_quotes(hist)
    if n:
        print(f"Added today's quote to {n} chart(s) that were missing it.")

    # Report what the site will actually show.
    company_ends = sorted(e.get("to", "") for k, e in hist.items()
                          if k not in MARKET and isinstance(e, dict))
    behind = [k for k, e in hist.items()
              if k not in MARKET and isinstance(e, dict) and e.get("to", "") < target_day]
    if company_ends:
        print(f"Newest close: {company_ends[-1]}. "
              f"{len(company_ends) - len(behind)} of {len(company_ends)} "
              f"charts end on {target_day}.")
    if behind:
        print(f"  Behind: {' '.join(sorted(behind)[:20])}"
              + (" ..." if len(behind) > 20 else ""))

    wrote = save_history(hist, previous)
    print(f"{'Wrote' if wrote else 'No change to'} {HISTORY_PATH}"
          + (f" ({os.path.getsize(HISTORY_PATH) / 1024:.0f} KB)" if wrote else ""))

    # Exit non-zero only if nothing at all could be refreshed. The workflow
    # treats this step as non-fatal; the freshness check at the end decides
    # whether the run as a whole succeeded.
    if targets and len(failures) == len(targets):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
