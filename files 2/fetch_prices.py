"""Fetch live share prices from Finnhub and write them to prices.json.

Run this BEFORE build.py. The flow is:

    fetch_prices.py  ->  prices.json  ->  build.py  ->  docs/data.js

Why a separate file instead of editing the company files directly: your
assumptions (revenue, margins, WACC) are things you decide and should live in
version control as your work. Prices are just market data that changes every
day. Keeping them apart means an API outage can never corrupt your models --
build.py simply falls back to the price already stored in the company file.

The API key is read from the FINNHUB_API_KEY environment variable. Never paste
it into a file you commit. Locally:

    export FINNHUB_API_KEY=your_key_here      # macOS / Linux
    setx FINNHUB_API_KEY "your_key_here"      # Windows

On GitHub it lives in Settings -> Secrets and variables -> Actions.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import load_companies  # noqa: E402

API = "https://finnhub.io/api/v1/quote?symbol={}&token={}"

# Finnhub's free tier covers US-listed stocks only (ADRs included). These names
# trade on foreign exchanges or thin OTC lines that need a paid plan, so we skip
# them and keep the hardcoded price from the company file.
# If you upgrade to a paid plan, delete entries from this set and add the proper
# Finnhub symbol to SYMBOL_MAP below (e.g. "MC": "MC.PA").
SKIP = {
    "MC",        # LVMH            - Euronext Paris
    "OR",        # L'Oreal         - Euronext Paris
    "NESN",      # Nestle          - SIX Swiss
    "SIE",       # Siemens         - Frankfurt / XETRA
    "005930",    # Samsung         - Korea Exchange
    "RELIANCE",  # Reliance        - NSE / BSE
    "TCEHY",     # Tencent ADR     - thin OTC line
    "BYDDY",     # BYD ADR         - thin OTC line
}

# Where your ticker differs from Finnhub's symbol, map it here.
SYMBOL_MAP = {
    "BRK.B": "BRK.B",
}

RATE_LIMIT_SLEEP = 1.1  # free tier is 60 calls/minute; ~1.1s keeps us under it


def quote(symbol, key):
    """Return the current price for one symbol, or None if unavailable."""
    url = API.format(symbol, key)
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  ! {symbol}: HTTP {e.code}")
        return None
    except Exception as e:
        print(f"  ! {symbol}: {type(e).__name__} {e}")
        return None
    price = data.get("c")
    # Finnhub returns c=0 for symbols it has no data for, rather than an error
    if not price:
        print(f"  ! {symbol}: no data returned (free tier may not cover it)")
        return None
    return float(price)


def main():
    key = os.environ.get("FINNHUB_API_KEY")
    if not key:
        print("ERROR: FINNHUB_API_KEY is not set. See the docstring in this file.")
        return 1

    companies = load_companies()
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prices.json")

    # Start from whatever we fetched last time, so one bad run never wipes the file
    try:
        with open(out_path) as f:
            prices = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        prices = {}

    targets = [c for c in companies if c["t"] not in SKIP]
    print(f"Fetching {len(targets)} prices ({len(SKIP)} skipped as non-US listings)\n")

    ok = fail = 0
    for i, c in enumerate(targets, 1):
        sym = SYMBOL_MAP.get(c["t"], c["t"])
        px = quote(sym, key)
        if px:
            old = prices.get(c["t"])
            prices[c["t"]] = px
            delta = f"  ({(px/old-1)*100:+.1f}%)" if old else ""
            print(f"  {i:3d}/{len(targets)} {c['t']:<9} ${px:,.2f}{delta}")
            ok += 1
        else:
            fail += 1
        time.sleep(RATE_LIMIT_SLEEP)

    prices["_fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(out_path, "w") as f:
        json.dump(prices, f, indent=2, sort_keys=True)

    print(f"\nUpdated {ok} prices, {fail} failed, {len(SKIP)} skipped.")
    print(f"Wrote {out_path}")

    fetch_market(key)

    print("\nNow run:  python build.py")

    # Only fail the job if essentially everything broke -- a handful of misses
    # is normal and shouldn't stop the site from rebuilding.
    if ok == 0:
        print("ERROR: no prices were fetched at all. Check your API key.")
        return 1
    return 0


# ---------------------------------------------------------------------------
# Market context for the homepage.
#
# We use exchange-traded funds rather than the indices themselves, because the
# free tier covers US-listed securities but not index feeds -- and because the
# two sources that do publish index levels for free (Stooq and FRED) both
# refuse connections from GitHub's servers. These ETFs are what actually
# trades, so the numbers are real and verifiable rather than approximations.
#
# The homepage labels them honestly as ETFs. SPY is not "the S&P 500", it is a
# fund that tracks it, and the site says so.
# ---------------------------------------------------------------------------
MARKET_ETFS = {
    "spy": ("SPY", "S&P 500 ETF"),
    "qqq": ("QQQ", "Nasdaq 100 ETF"),
    "bno": ("BNO", "Brent Oil ETF"),
    "gld": ("GLD", "Gold ETF"),
}


def fetch_market(key):
    """Fetch the homepage market figures into market.json.

    Anything that fails is simply left out, and build.py keeps the value it
    already has. The 10-year Treasury yield and Fed funds target stay manual:
    neither is a traded security with a price to look up.
    """
    print("\nFetching market context...")
    out = {}
    for meta_key, (symbol, label) in MARKET_ETFS.items():
        px = quote(symbol, key)
        if px:
            out[meta_key] = round(px, 2)
            print(f"  OK   {label:18s} {symbol:5s} ${px:,.2f}")
        else:
            print(f"  MISS {label:18s} {symbol:5s} no data")
        time.sleep(RATE_LIMIT_SLEEP)

    if not out:
        print("  No market figures fetched — homepage keeps its stored values.")
        return

    out["asof_iso"] = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "market.json")
    with open(path, "w") as f:
        json.dump(out, f, indent=2, sort_keys=True)
    print(f"  Wrote {path} ({len(out) - 1} of {len(MARKET_ETFS)})")


if __name__ == "__main__":
    sys.exit(main())
