"""Fetch real company fundamentals from Finnhub into fundamentals.json.

This exists because the revenue, share count and net debt figures in
companies/*.py were originally written by hand. Prices already update
themselves; these did not, which meant the most important inputs to every
valuation were slowly going stale.

Uses two free-tier endpoints per company:
  /stock/profile2  -> shares outstanding, market capitalisation
  /stock/metric    -> revenue per share, cash flow per share, enterprise value

Roughly 400 calls for 200 companies. The free tier allows 60/minute, so this
paces itself and takes about seven minutes. That is fine for a job that runs
once a day and nobody watches.

    python fetch_fundamentals.py            # fetch and write fundamentals.json
    python fetch_fundamentals.py --dry-run  # show what would change, write nothing
    python fetch_fundamentals.py --limit 10 # try ten companies first

IMPORTANT: run --dry-run first. It prints every figure the API disagrees with,
so you can see whether the feed is sane before it touches your valuations.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from build import load_companies                    # noqa: E402
from fetch_prices import SKIP, SYMBOL_MAP           # noqa: E402

PROFILE = "https://finnhub.io/api/v1/stock/profile2?symbol={}&token={}"
METRIC = "https://finnhub.io/api/v1/stock/metric?symbol={}&metric=all&token={}"

PAUSE = 1.1          # 60 calls/minute allowed; two calls per company
OUT = os.path.join(HERE, "fundamentals.json")

# A fetched figure this far from the modelled one is more likely a units
# problem or a bad response than a real correction, so we flag rather than
# apply it. Genuine restatements are rarely 5x.
SANITY_RATIO = 5.0


def get(url):
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            return json.loads(r.read().decode()), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, type(e).__name__


def first_of(d, *keys):
    """Return the first present, usable numeric value among several key names.

    Finnhub's metric names vary by company and have changed over time, so we
    try a few spellings rather than depending on one.
    """
    for k in keys:
        v = d.get(k)
        if isinstance(v, (int, float)) and v != 0:
            return float(v)
    return None


def fundamentals_for(symbol, key):
    """Return a dict of the figures we can extract, plus any notes."""
    out, notes = {}, []

    prof, err = get(PROFILE.format(symbol, key))
    time.sleep(PAUSE)
    if err or not prof:
        return None, err or "empty profile"

    # Finnhub reports shares outstanding in millions; the model uses billions.
    shares_m = first_of(prof, "shareOutstanding")
    if shares_m:
        out["shares"] = round(shares_m / 1000.0, 4)
    mcap_m = first_of(prof, "marketCapitalization")   # also millions

    met, err = get(METRIC.format(symbol, key))
    time.sleep(PAUSE)
    if err or not met:
        return (out or None), err or "empty metrics"

    m = met.get("metric") or {}

    # Revenue: per-share figure multiplied back up by the share count.
    rps = first_of(m, "revenuePerShareTTM", "revenuePerShareAnnual")
    if rps and out.get("shares"):
        out["rev"] = round(rps * out["shares"], 2)            # $/share x Bn shares = $B

    # Free cash flow, same approach. Used to sanity-check the margin
    # assumption rather than to overwrite it.
    fcfps = first_of(m, "freeCashFlowPerShareTTM", "cashFlowPerShareTTM",
                     "freeCashFlowPerShareAnnual")
    if fcfps and out.get("shares"):
        out["fcf"] = round(fcfps * out["shares"], 2)          # same units logic as revenue

    # Net debt: enterprise value less market cap. Finnhub exposes EV under a
    # couple of different names depending on the company.
    ev_m = first_of(m, "enterpriseValue", "enterpriseValueAnnual")
    if ev_m and mcap_m:
        out["netdebt"] = round((ev_m - mcap_m) / 1000.0, 2)   # $B
    else:
        notes.append("no EV")

    return (out or None), (", ".join(notes) or None)


def main():
    args = sys.argv[1:]
    dry = "--dry-run" in args
    limit = None
    if "--limit" in args:
        try:
            limit = int(args[args.index("--limit") + 1])
        except (IndexError, ValueError):
            pass

    key = os.environ.get("FINNHUB_API_KEY")
    if not key:
        print("FINNHUB_API_KEY not set. Nothing fetched, nothing changed.")
        return 0

    companies = [c for c in load_companies() if c["t"] not in SKIP]
    if limit:
        companies = companies[:limit]

    print(f"Fetching fundamentals for {len(companies)} companies "
          f"(~{len(companies) * 2 * PAUSE / 60:.0f} minutes)")
    if dry:
        print("DRY RUN — nothing will be written.\n")

    data, big_moves, failures = {}, [], []
    for i, c in enumerate(companies, 1):
        sym = SYMBOL_MAP.get(c["t"], c["t"])
        got, note = fundamentals_for(sym, key)
        if not got:
            failures.append(f"{c['t']}: {note}")
            continue

        # Compare against what the model currently assumes.
        for field, label in (("rev", "revenue"), ("shares", "shares"),
                             ("netdebt", "net debt")):
            new = got.get(field)
            old = c.get(field)
            if new is None or not isinstance(old, (int, float)):
                continue
            if field == "netdebt":
                continue    # sign conventions differ; report but never gate on it
            if old and abs(old) > 0.01:
                ratio = abs(new / old)
                if ratio > SANITY_RATIO or ratio < 1 / SANITY_RATIO:
                    big_moves.append(
                        f"{c['t']:6s} {label:9s} model {old:>10,.2f} -> feed {new:>10,.2f}")
                    got.pop(field)      # too far out to trust; keep the model value

        data[c["t"]] = got
        if i % 20 == 0 or i == len(companies):
            print(f"  {i:3d}/{len(companies)}  {len(data)} ok, {len(failures)} failed")

    if big_moves:
        print(f"\n{len(big_moves)} figures differed by more than {SANITY_RATIO:.0f}x "
              f"and were NOT applied — check these by hand:")
        for b in big_moves[:25]:
            print("  " + b)
        if len(big_moves) > 25:
            print(f"  ... and {len(big_moves) - 25} more")

    if failures:
        print(f"\n{len(failures)} companies returned nothing "
              f"(these keep their existing figures):")
        for f_ in failures[:15]:
            print("  " + f_)

    if dry:
        print(f"\nDry run complete. {len(data)} companies would be updated.")
        return 0

    data["_fetched_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(OUT, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)
    print(f"\nWrote {OUT} ({len(data) - 1} companies)")
    print("Now run:  python build.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
