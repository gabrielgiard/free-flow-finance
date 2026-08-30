"""Fetch one current price per company, from whichever source answers.

WHY THIS IS BUILT THIS WAY

This project has now lost three "free forever" price sources: Stooq retired its
CSV endpoint, FRED began refusing datacentre traffic, and Yahoo's unofficial
chart endpoint rate-limits aggressively once you hit it a few hundred times a
day on a schedule. Each time, prices silently froze.

So this does not depend on any one of them. It tries three independent sources
per company and takes the first that answers:

    1. Finnhub      60 calls/minute, no daily cap on US equities. Needs a key.
    2. Twelve Data  800 calls/day, 8/minute. Needs a key.
    3. Yahoo        No key at all. Fragile, so it goes last.

234 companies fits comfortably inside any one of those budgets. All three would
have to fail simultaneously for prices to stop — and if that happens, the log
says so loudly rather than quietly serving month-old numbers.

    python fetch_prices.py            # normal run
    python fetch_prices.py --test     # check each source on 3 symbols
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

FINNHUB = "https://finnhub.io/api/v1/quote?symbol={}&token={}"
TWELVE = "https://api.twelvedata.com/price?symbol={}&apikey={}"
YAHOO = ("https://query1.finance.yahoo.com/v8/finance/chart/{}"
         "?range=1d&interval=1d")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

OUT = os.path.join(HERE, "prices.json")

# Foreign primaries Finnhub does not cover on the free tier. Yahoo does, using
# exchange suffixes, with an approximate FX rate to convert to USD.
FOREIGN = {
    "MC":       ("MC.PA",       1.08),
    "OR":       ("OR.PA",       1.08),
    "NESN":     ("NESN.SW",     1.13),
    "SIE":      ("SIE.DE",      1.08),
    "005930":   ("005930.KS",   0.00072),
    "RELIANCE": ("RELIANCE.NS", 0.0115),
    "TCEHY":    ("TCEHY",       1.0),
    "BYDDY":    ("BYDDY",       1.0),
}


def usable_price(v):
    """True only for a real, finite, positive number.

    Two traps caught in testing: bool is a subclass of int in Python, so a
    JSON `true` passes an isinstance check and becomes a price of $1.00. And
    float("Infinity") parses without error, then propagates through every
    downstream calculation. Both must be rejected here, at the boundary.
    """
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return False
    return v == v and v not in (float("inf"), float("-inf")) and v > 0


def _get(url, headers=None, timeout=15, retries=2):
    """GET with a short exponential backoff. Transient 429s and timeouts are
    normal on free tiers; giving up on the first one wastes a working source."""
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers or {})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode()), None
        except urllib.error.HTTPError as e:
            if e.code in (429, 502, 503, 504) and attempt < retries:
                time.sleep(2 ** attempt)
                continue
            return None, f"HTTP {e.code}"
        except Exception as e:
            if attempt < retries:
                time.sleep(2 ** attempt)
                continue
            return None, type(e).__name__
    return None, "retries exhausted"


def from_finnhub(sym, key):
    if not key:
        return None, "no key"
    data, err = _get(FINNHUB.format(urllib.parse.quote(sym), key))
    if err:
        return None, err
    px = data.get("c") if isinstance(data, dict) else None
    if usable_price(px):
        return float(px), None
    return None, "no price in response"


def from_twelve(sym, key):
    if not key:
        return None, "no key"
    data, err = _get(TWELVE.format(urllib.parse.quote(sym), key))
    if err:
        return None, err
    if isinstance(data, dict) and data.get("status") == "error":
        return None, str(data.get("message", "error"))[:50]
    raw = data.get("price") if isinstance(data, dict) else None
    if isinstance(raw, bool):
        return None, "boolean, not a price"
    try:
        px = float(raw)
    except (TypeError, ValueError):
        return None, "unparseable price"
    if not usable_price(px):
        return None, "not a usable price"
    return px, None


def from_yahoo(sym):
    data, err = _get(YAHOO.format(urllib.parse.quote(sym, safe="")),
                     headers={"User-Agent": UA})
    if err:
        return None, err
    try:
        meta = data["chart"]["result"][0]["meta"]
    except (KeyError, IndexError, TypeError):
        return None, "unexpected shape"
    for field in ("regularMarketPrice", "previousClose", "chartPreviousClose"):
        px = meta.get(field)
        if usable_price(px):
            return float(px), None
    return None, "no price in meta"


def price_for(ticker, fh_key, td_key):
    """First source that answers wins. Returns (price, source, error)."""
    ysym, fx = FOREIGN.get(ticker, (ticker, 1.0))

    # Foreign primaries: only Yahoo covers them, and the result needs
    # converting out of the local currency.
    if ticker in FOREIGN:
        px, err = from_yahoo(ysym)
        if px:
            return round(px * fx, 2), "yahoo", None
        return None, None, f"yahoo: {err}"

    px, e1 = from_finnhub(ticker, fh_key)
    if px:
        return round(px, 2), "finnhub", None
    px, e2 = from_twelve(ticker, td_key)
    if px:
        return round(px, 2), "twelvedata", None
    px, e3 = from_yahoo(ticker)
    if px:
        return round(px, 2), "yahoo", None
    return None, None, f"finnhub: {e1}; twelve: {e2}; yahoo: {e3}"


def main():
    args = sys.argv[1:]
    fh_key = os.environ.get("FINNHUB_API_KEY")
    td_key = os.environ.get("TWELVEDATA_API_KEY")

    if "--test" in args:
        print("Testing each source on three symbols.\n")
        for sym in ("AAPL", "MSFT", "NVDA"):
            f, ef = from_finnhub(sym, fh_key)
            t, et = from_twelve(sym, td_key)
            y, ey = from_yahoo(sym)
            print(f"  {sym:6s} finnhub {f or ef!s:<22} "
                  f"twelve {t or et!s:<22} yahoo {y or ey}")
            time.sleep(1)
        print("\nAny one working source is enough to keep prices current.")
        return 0

    if not fh_key and not td_key:
        print("Neither FINNHUB_API_KEY nor TWELVEDATA_API_KEY is set.")
        print("Yahoo alone will be tried, but it rate-limits and should not be "
              "relied on. Add at least one key.")

    from build import load_companies
    companies = load_companies()

    prices, sources, failures = {}, {}, []
    print(f"Fetching {len(companies)} prices "
          f"(finnhub -> twelvedata -> yahoo)\n")

    for i, c in enumerate(companies, 1):
        px, src, err = price_for(c["t"], fh_key, td_key)
        if px:
            prices[c["t"]] = px
            sources[src] = sources.get(src, 0) + 1
        else:
            failures.append(f"{c['t']}: {err}")
        # Finnhub allows 60/minute. One second between calls keeps every
        # source inside its limit without needing to track them separately.
        time.sleep(1.05)
        if i % 40 == 0 or i == len(companies):
            print(f"  {i:3d}/{len(companies)}  {len(prices)} ok, "
                  f"{len(failures)} failed")

    if not prices:
        print("\nEVERY SOURCE FAILED FOR EVERY COMPANY.")
        print("Check that your API keys are set and still valid.")
        print("Existing prices are left untouched.")
        return 1

    prices["_fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(OUT, "w") as f:
        json.dump(prices, f, indent=2, sort_keys=True)

    got = ", ".join(f"{v} from {k}" for k, v in sorted(sources.items()))
    print(f"\nFetched {len(prices)-1} prices ({got})")
    if failures:
        print(f"{len(failures)} failed:")
        for f_ in failures[:10]:
            print("  - " + f_)
        if len(failures) > 10:
            print(f"  ... and {len(failures)-10} more")

    # A health signal the workflow can act on: if most companies failed,
    # something systemic is wrong and it should be visible, not buried.
    if len(failures) > len(companies) * 0.25:
        print(f"\nWARNING: {len(failures)} of {len(companies)} failed. "
              f"A source may have started blocking. Run --test to check each one.")
    print(f"Wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
