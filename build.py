"""Run the valuation model over every company and generate the website data.

    python build.py

Reads:  companies/*.py   your assumptions (the actual work)
        prices.json      live prices from fetch_prices.py, if present
Writes: docs/data.js     the single file the website reads

Everything on the site -- fair values, ratings, sector medians, comps -- is
derived here. The website itself does no math; it only displays what this
script produces.
"""

import json
import os
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from engine import build  # noqa: E402

SECTORS = [
    {"k": "semis", "n": "Semiconductors & AI Hardware",
     "d": "The physical layer of the AI build-out: chip designers, the foundries that print them, and the equipment makers that make the printing possible.",
     "note": ""},
    {"k": "software", "n": "Software & Internet",
     "d": "Platforms, cloud, advertising and enterprise software — asset-light businesses where the moat is switching cost or network effect rather than capital.",
     "note": ""},
    {"k": "health", "n": "Healthcare & Pharmaceuticals",
     "d": "Drug developers, medical devices and health insurers. Value here hinges on patent life, pipeline odds and the politics of who pays.",
     "note": "Pharmaceutical cash flows are shaped by patent cliffs, so several models below deliberately include a declining year."},
    {"k": "financials", "n": "Financials",
     "d": "Banks, payment networks, insurers and asset managers — the plumbing that moves and prices capital.",
     "note": "Important: a standard free cash flow DCF does not work for banks, because debt is their raw material rather than their financing. For the banks here we treat net revenue (net interest income plus fees) as the top line, use distributable net income as the margin, and set net debt to zero. It is a simplification — the technically correct tools are a dividend discount or residual income model. Payment networks and asset managers are normal DCF candidates and are modelled conventionally."},
    {"k": "consumer", "n": "Consumer, Retail & Luxury",
     "d": "The companies that sell to households: staples, retailers, restaurants and luxury houses. Slow growing, but with pricing power that compounds quietly.",
     "note": ""},
    {"k": "energy", "n": "Energy & Materials",
     "d": "Oil and gas majors, miners, industrial gases and utilities. Earnings are a function of commodity prices as much as management.",
     "note": "Commodity producers are price takers. Our five-year forecasts assume Brent normalises from the elevated 2026 conflict levels, which is why several models show a declining second year."},
    {"k": "industrials", "n": "Industrials & Defence",
     "d": "Aerospace, machinery, defence primes and electrical equipment — the businesses building the physical economy, including the power for the data centres.",
     "note": ""},
    {"k": "autos", "n": "Autos & Mobility",
     "d": "Carmakers navigating the transition from combustion to electric, plus the one company the market values as something other than a carmaker.",
     "note": ""},
    {"k": "global", "n": "Global & Emerging Markets",
     "d": "The large caps of China, Korea and India. Business quality is often high; the discount is almost always about governance and geopolitics.",
     "note": "Non-US companies here are modelled in US dollar terms using ADR-equivalent share prices so that multiples stay comparable across the library. Currency movements are a real source of return we are not modelling."},
    {"k": "telecom", "n": "Telecom & Media",
     "d": "The companies that carry the signal and make the content \u2014 wireless carriers, broadband, studios and streaming. Capital-heavy, slow-growing, and priced mostly on cash returned to shareholders.",
     "note": "Carriers and cable operators run very high debt loads by design: the networks are long-lived assets funded with long-dated debt. Read the leverage figures here against that norm rather than against an asset-light software company."},
    {"k": "frontier", "n": "Frontier & High-Momentum",
     "d": "Space, crypto, quantum and AI infrastructure. High narrative, thin financial history, and the section where a DCF is least reliable — which is exactly why it is worth doing one.",
     "note": "Read the fair values in this section with real scepticism. A DCF needs stable, predictable cash flows to be meaningful. Several companies here have negative free cash flow today, so almost all of the calculated value sits in the terminal value — the most assumption-heavy part of the model. We publish the numbers anyway, and flag where they are close to meaningless."},
]

# Homepage strip. Everything shown there is computed from our own model by
# coverage_stats() below, so there is no external data feed to break. The only
# stored value is the date, and that gets restamped from prices.json each run.
META = {
    "asof": "22 July 2026",   # overwritten from prices.json when prices update
}


def coverage_stats(companies, sectors):
    """Headline figures for the homepage strip, all from our own model.

    Deliberately self-contained: no external market feed, nothing to break,
    and it says something about this library rather than repeating the index
    levels every finance site already shows.
    """
    ups = sorted(c["upside"] for c in companies)
    mid = len(ups) // 2
    median_up = ups[mid] if len(ups) % 2 else (ups[mid - 1] + ups[mid]) / 2
    buys = sum(1 for c in companies if c["rating"] in ("Strong Buy", "Buy"))
    sells = sum(1 for c in companies if c["rating"] in ("Sell", "Reduce"))
    return {
        "n_companies": len(companies),
        "n_sectors": len(sectors),
        "total_mcap": round(sum(c["mcap"] for c in companies) / 1000, 1),
        "median_upside": round(median_up, 4),
        "n_buy": buys,
        "n_sell": sells,
    }


def stamp_date(meta):
    """Set the homepage date from when prices were last fetched."""
    try:
        with open(os.path.join(HERE, "prices.json")) as f:
            iso = json.load(f).get("_fetched_at", "")[:10]
    except (FileNotFoundError, json.JSONDecodeError):
        return
    if len(iso) != 10:
        return
    try:
        y, mo, d = iso.split("-")
        months = ["January", "February", "March", "April", "May", "June", "July",
                  "August", "September", "October", "November", "December"]
        meta["asof"] = f"{int(d)} {months[int(mo) - 1]} {y}"
        print(f"Homepage dated {meta['asof']} from prices.json")
    except (ValueError, IndexError):
        pass


def load_companies():
    """Import every company list. Add new sector modules to this function."""
    from companies.semis import SEMIS
    from companies.software import SOFTWARE
    from companies.health import HEALTH
    from companies.financials import FINANCIALS
    from companies.consumer import CONSUMER
    from companies.energy_industrials import ENERGY, INDUSTRIALS
    from companies.autos_global_frontier import AUTOS, GLOBAL, FRONTIER
    from companies.expansion import EXPANSION
    from companies.expansion2 import EXPANSION2
    return (SEMIS + SOFTWARE + HEALTH + FINANCIALS + CONSUMER
            + ENERGY + INDUSTRIALS + AUTOS + GLOBAL + FRONTIER + EXPANSION + EXPANSION2)


def apply_live_prices(companies):
    """Overlay prices.json onto the hardcoded prices, if the file exists."""
    path = os.path.join(HERE, "prices.json")
    try:
        with open(path) as f:
            prices = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print("No prices.json found — using prices from the company files.")
        return None
    n = 0
    for c in companies:
        px = prices.get(c["t"])
        if isinstance(px, (int, float)) and px > 0:
            c["price"] = float(px)
            n += 1
    fetched = prices.get("_fetched_at", "unknown time")
    print(f"Applied {n} live prices (fetched {fetched})")
    return fetched


def apply_fundamentals(companies):
    """Overlay real revenue, share count and net debt from fundamentals.json.

    These were originally hand-written estimates. Anything the feed provides
    replaces them; anything it does not provide keeps the existing value, so a
    partial fetch degrades gracefully rather than leaving holes.
    """
    path = os.path.join(HERE, "fundamentals.json")
    try:
        with open(path) as f:
            fund = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print("No fundamentals.json — using the figures in companies/*.py")
        return

    applied = {"rev": 0, "shares": 0, "netdebt": 0}
    for c in companies:
        got = fund.get(c["t"])
        if not isinstance(got, dict):
            continue
        for field in ("rev", "shares", "netdebt"):
            v = got.get(field)
            if not isinstance(v, (int, float)):
                continue
            # revenue and share count must be positive; net debt may be
            # negative, which simply means the company holds net cash
            if field in ("rev", "shares") and v <= 0:
                continue
            c[field] = float(v)
            applied[field] += 1

    stamp = fund.get("_fetched_at", "unknown")[:10]
    print(f"Applied fundamentals from {stamp}: "
          f"{applied['rev']} revenue, {applied['shares']} share counts, "
          f"{applied['netdebt']} net debt figures")


def validate(companies):
    """Catch the mistakes that are easy to make when adding a new company."""
    errors = []
    seen = {}
    valid_sectors = {s["k"] for s in SECTORS}
    required = ["t", "n", "sec", "price", "shares", "rev", "growth",
                "m0", "m1", "wacc", "tg", "desc", "segs", "bull", "risks"]
    for c in companies:
        t = c.get("t", "<missing ticker>")
        if t in seen:
            errors.append(f"{t}: duplicate ticker")
        seen[t] = True
        for field in required:
            if field not in c or c[field] in (None, "", []):
                errors.append(f"{t}: missing required field '{field}'")
        if c.get("sec") not in valid_sectors:
            errors.append(f"{t}: sector '{c.get('sec')}' is not one of {sorted(valid_sectors)}")
        if len(c.get("growth", [])) != 5:
            errors.append(f"{t}: 'growth' must have exactly 5 values, got {len(c.get('growth', []))}")
        if c.get("price", 0) <= 0:
            errors.append(f"{t}: price must be positive")
        if c.get("shares", 0) <= 0:
            errors.append(f"{t}: shares must be positive")
        if c.get("wacc", 0) <= c.get("tg", 0):
            errors.append(f"{t}: wacc ({c.get('wacc')}) must exceed terminal growth ({c.get('tg')})")
        segs = c.get("segs", [])
        total = sum(s[1] for s in segs)
        if segs and not (90 <= total <= 110):
            errors.append(f"{t}: revenue segments sum to {total}%, expected ~100%")
        if len(c.get("bull", [])) < 2 or len(c.get("risks", [])) < 2:
            errors.append(f"{t}: needs at least 2 thesis points and 2 risks")
    return errors


def main():
    companies = load_companies()
    print(f"Loaded {len(companies)} companies")

    errors = validate(companies)
    if errors:
        print(f"\n{len(errors)} validation error(s) — fix these before the site will build:\n")
        for e in errors:
            print(f"  - {e}")
        return 1

    apply_fundamentals(companies)
    apply_live_prices(companies)
    meta = dict(META)
    stamp_date(meta)

    out = [build(c) for c in companies]

    # sector aggregates + peer sets, used by the sector pages and comps tables
    sectors = [dict(s) for s in SECTORS]
    for s in sectors:
        peers = [c for c in out if c["sec"] == s["k"]]
        if not peers:
            print(f"  warning: sector '{s['k']}' has no companies")
            s.update(count=0, mcap=0, med_ev_sales=0, med_ev_fcf=0)
            continue
        evs = sorted(p["ev_sales"] for p in peers)
        evf = sorted(p["ev_fcf"] for p in peers if 0 < p["ev_fcf"] < 400)
        s["med_ev_sales"] = round(statistics.median(evs), 2)
        s["med_ev_fcf"] = round(statistics.median(evf), 1) if evf else 0
        s["count"] = len(peers)
        s["mcap"] = round(sum(p["mcap"] for p in peers) / 1000, 2)
        for p in peers:
            p["peers"] = [q["t"] for q in peers if q["t"] != p["t"]][:8]
            p["prem_sales"] = (round(p["ev_sales"] / s["med_ev_sales"] - 1, 3)
                               if s["med_ev_sales"] else 0)
            # Rule of 40: revenue growth + FCF margin. A rough health check
            # borrowed from software investing -- above 40 usually means growth
            # and profitability are in a sensible balance. Less meaningful for
            # banks and commodity producers, which is flagged in the UI.
            p["rule40"] = round((p["cagr5"] + p["m0"]) * 100, 1)
            # Leverage: years of current free cash flow needed to clear net
            # debt. Negative means the company holds net cash.
            p["nd_fcf"] = (round(p["netdebt"] / p["ttm_fcf"], 1)
                           if p["ttm_fcf"] > 0 else None)
            p["nd_ev"] = round(p["netdebt"] / p["ev_now"], 3) if p["ev_now"] else 0
            # How much of the DCF value sits beyond the explicit forecast.
            p["tv_pct"] = round(p["dcf"]["tv_share"] * 100, 1)

        # Percentile rank within the sector, 0 = lowest, 100 = highest.
        for metric in ("ev_sales", "ev_fcf", "fcf_yield", "cagr5", "m0",
                       "upside", "rule40"):
            vals = [p[metric] for p in peers
                    if isinstance(p.get(metric), (int, float))]
            for p in peers:
                v = p.get(metric)
                p.setdefault("pctl", {})
                if isinstance(v, (int, float)) and len(vals) > 1:
                    below = sum(1 for x in vals if x < v)
                    p["pctl"][metric] = round(below / (len(vals) - 1) * 100)
                else:
                    p["pctl"][metric] = 50

    meta.update(coverage_stats(out, sectors))
    data = {"sectors": sectors, "companies": out, "meta": meta}

    docs = os.path.join(HERE, "docs")
    os.makedirs(docs, exist_ok=True)
    target = os.path.join(docs, "data.js")
    with open(target, "w") as f:
        f.write("const FF_DATA = ")
        json.dump(data, f, separators=(",", ":"))
        f.write(";\n")

    ratings = {}
    for c in out:
        ratings[c["rating"]] = ratings.get(c["rating"], 0) + 1

    print()
    for s in sectors:
        print(f"  {s['k']:12s} {s['count']:3d} names  ${s['mcap']:7.2f}T  "
              f"med EV/S {s['med_ev_sales']:6.2f}x")
    print(f"\nRatings: {ratings}")
    print(f"Total coverage: ${sum(c['mcap'] for c in out)/1000:.2f}T market cap")
    print(f"\nWrote {target} ({os.path.getsize(target)/1024:.0f} KB)")
    print("Open docs/index.html in a browser to view the site.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
