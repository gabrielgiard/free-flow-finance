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
    from companies.expansion3 import EXPANSION3
    return (SEMIS + SOFTWARE + HEALTH + FINANCIALS + CONSUMER
            + ENERGY + INDUSTRIALS + AUTOS + GLOBAL + FRONTIER + EXPANSION + EXPANSION2 + EXPANSION3)


# A close older than this is not used as a price. Covers a long weekend plus
# a public holiday; anything beyond that means the pipeline has stopped and we
# would rather show a stored estimate than a number pretending to be current.
MAX_PRICE_AGE_DAYS = 5


def prices_from_history():
    """Latest close for every series in docs/history.js.

    This costs nothing -- the file is already built for the charts, and its
    last point IS the most recent close. It covers companies the quote feed
    misses entirely, including foreign listings, so nothing is left stranded
    on a hardcoded estimate.
    """
    path = os.path.join(HERE, "docs", "history.js")
    try:
        text = open(path).read()
    except FileNotFoundError:
        return {}
    prefix = "var FF_HISTORY = "
    if not text.startswith(prefix):
        return {}
    try:
        hist = json.loads(text[len(prefix):].rstrip().rstrip(";"))
    except json.JSONDecodeError:
        return {}

    # Only trust a close that is actually recent. A price that is weeks old is
    # worse than an honest estimate, because it looks live and is not.
    import time as _time
    def _days_old(ds):
        if not isinstance(ds, str) or len(ds) < 10:
            return 9999
        try:
            y, m, d = (int(x) for x in ds[:10].split("-"))
            return int((_time.time() - _time.mktime((y, m, d, 12, 0, 0, 0, 0, -1))) / 86400)
        except (ValueError, OverflowError):
            return 9999

    out, stale = {}, 0
    for tick, entry in hist.items():
        if tick.startswith("_") or not isinstance(entry, dict):
            continue
        closes = entry.get("c")
        if not (isinstance(closes, list) and closes):
            continue
        last = closes[-1]
        if not (isinstance(last, (int, float)) and last > 0):
            continue
        if _days_old(entry.get("to")) > MAX_PRICE_AGE_DAYS:
            stale += 1
            continue
        out[tick] = float(last)
    if stale:
        print(f"  ignored {stale} chart closes older than "
              f"{MAX_PRICE_AGE_DAYS} days — too stale to use as a price")
    return out


def check_price_chart_agreement(companies):
    """The displayed price and the chart's final point must be the same number.

    They are read from the same array, so any disagreement means something
    wrote to that series after it was fetched. That happened once already:
    the accumulator was stapling stale quotes onto clean Yahoo data. This
    check exists so it can never happen silently again.
    """
    hist_px = prices_from_history()
    bad = [c["t"] for c in companies
           if c["t"] in hist_px and abs(c["price"] - hist_px[c["t"]]) > 0.01]
    if bad:
        print(f"  WARNING: price disagrees with chart end-point for "
              f"{len(bad)} companies: {', '.join(bad[:8])}"
              + (" ..." if len(bad) > 8 else ""))
    return bad


def apply_live_prices(companies):
    """Set every price from the freshest source available.

    ORDER OF PREFERENCE, deliberately changed:

      1. docs/history.js  -- the last close of the chart series. This is now
                             the PRIMARY source, not a fallback. The history
                             fetcher pulls a year of daily closes from Yahoo,
                             needs no API key, and is the one part of this
                             pipeline proven to run and commit successfully.
                             Its newest point is by definition the latest
                             close, so it is a price feed we already have.

      2. prices.json      -- Finnhub intraday quotes, if present. Fresher
                             within the trading day, but it depends on an API
                             key and has repeatedly failed to produce a file.
                             Treated as a bonus, never a requirement.

      3. companies/*.py   -- the stored estimate. Last resort only.

    Nothing here can fail the build. A missing or stale source is skipped and
    the next one down is used."""
    path = os.path.join(HERE, "prices.json")
    try:
        with open(path) as f:
            prices = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Missing or corrupt quote file is not fatal: chart history is an
        # independent source and should still be used. Returning early here
        # was a bug — it threw away perfectly good prices.
        print("No usable prices.json — falling back to chart history.")
        prices = {}
    hist_px = prices_from_history()
    from_hist = n = 0
    for c in companies:
        # 1. chart history first — the source that actually works
        hp = hist_px.get(c["t"])
        if isinstance(hp, (int, float)) and hp > 0:
            c["price"] = float(hp)
            from_hist += 1
            continue
        # 2. quote feed, if it happened to produce anything
        px = prices.get(c["t"])
        if isinstance(px, (int, float)) and px > 0:
            c["price"] = float(px)
            n += 1
    fetched = prices.get("_fetched_at", "unknown time")
    print(f"Prices: {from_hist} from chart history"
          + (f", {n} from the quote feed" if n else "")
          + f" (quotes fetched {fetched})")
    stale = [c["t"] for c in companies
             if c["t"] not in prices and c["t"] not in hist_px]
    if stale:
        # Name every one. A count alone is easy to skim past; a list of tickers
        # tells you exactly which company pages are showing an estimate rather
        # than a real price, so you can chase them.
        print(f"  {len(stale)} of {len(companies)} still on stored estimates "
              f"(no live price found):")
        for i in range(0, len(stale), 12):
            print("    " + " ".join(stale[i:i + 12]))
        print("    -> these need a working Yahoo symbol in fetch_history.py")
    else:
        print(f"  every one of {len(companies)} companies has a live price.")
    return fetched


# Absolute limits on fetched fundamentals, in billions of dollars except
# shares which is billions of shares. A value outside these is a feed error.
FUNDAMENTAL_BOUNDS = {
    "rev":     (0.01, 1000.0),      # $10m to $1tn of annual revenue
    "shares":  (0.001, 30.0),       # 1m to 30bn shares outstanding
    "netdebt": (-2000.0, 2000.0),   # +/- $2tn net debt or net cash
}


def finite(v):
    """True only for a real, usable number.

    bool is a subclass of int in Python, so True would otherwise pass as 1.
    NaN and infinity are floats and pass isinstance checks happily, then
    propagate silently through every subsequent calculation until a fair
    value comes out as nan. Everything that reads fetched data goes through
    here.
    """
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return False
    return v == v and v not in (float("inf"), float("-inf"))


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
    except (FileNotFoundError, json.JSONDecodeError, ValueError):
        print("No usable fundamentals.json — using the figures in companies/*.py")
        return
    # A list, string or number is valid JSON but not what this expects, and
    # calling .get() on it crashes the build.
    if not isinstance(fund, dict):
        print(f"fundamentals.json is a {type(fund).__name__}, not an object "
              f"— ignoring it")
        return

    applied = {"rev": 0, "shares": 0, "netdebt": 0}
    out_of_range = []
    for c in companies:
        got = fund.get(c["t"])
        if not isinstance(got, dict):
            continue
        for field in ("rev", "shares", "netdebt"):
            v = got.get(field)
            if not finite(v):
                continue
            # Bounds on both sides. Checking only for positive numbers let a
            # hostile 1e12 revenue through, which produced a fair value of
            # $2.4m per share. No company in this library has revenue above
            # $1tn, more than 30bn shares, or net debt beyond $2tn — anything
            # outside those is a data fault, not a business.
            lo, hi = FUNDAMENTAL_BOUNDS[field]
            if not (lo <= v <= hi):
                out_of_range.append(f"{c['t']} {field}={v:,.4g}")
                continue
            # Revenue is derived from a per-share figure times a share count,
            # so an error in either multiplies out. If the fetched number is
            # nowhere near the stored one, trust the stored one.
            if field == "rev" and finite(c.get("rev")) and c["rev"] > 0:
                ratio = v / c["rev"]
                if ratio > MAX_REVENUE_RATIO or ratio < 1 / MAX_REVENUE_RATIO:
                    out_of_range.append(
                        f"{c['t']} rev {v:,.1f} vs stored {c['rev']:,.1f}")
                    continue
            c[field] = float(v)
            applied[field] += 1

    if out_of_range:
        print(f"  rejected {len(out_of_range)} fundamentals outside sane bounds: "
              + ", ".join(out_of_range[:6])
              + (" ..." if len(out_of_range) > 6 else ""))

    stamp = fund.get("_fetched_at", "unknown")[:10]
    print(f"Applied fundamentals from {stamp}: "
          f"{applied['rev']} revenue, {applied['shares']} share counts, "
          f"{applied['netdebt']} net debt figures")


# The risk-free rate every WACC in this library was originally set against.
# Do not change it: it is the historical anchor. The current rate is fetched
# separately, and each company's WACC moves by the difference.
BASE_RISK_FREE = 0.0463

# Filled in at build time: the hand-written assumptions, kept so a company
# with a broken recalibration can be reverted rather than published wrong.
ORIGINAL_ASSUMPTIONS = {}

# Guard rails on automatic recalibration. A fetched figure outside these
# bounds is more likely a data problem than a real change, so it is reported
# and ignored rather than applied.
MAX_MARGIN_SHIFT = 0.15      # how far a margin may move in one run

# Absolute plausibility. The relative check above was not enough: a fetched
# margin of 274% moved a long way AND was impossible, but only the movement
# was being tested. Almost no real company sustains a free cash flow margin
# above 55%, and one below -50% is a data fault rather than a business.
MARGIN_FLOOR, MARGIN_CEILING = -0.50, 0.55

# Fetched revenue must be in the same universe as what the model already has.
# Revenue is derived as revenue-per-share x share count, so an error in either
# multiplies. A figure more than this far from the stored value is rejected.
MAX_REVENUE_RATIO = 2.5
MIN_WACC = 0.055
MAX_WACC = 0.180


def current_risk_free():
    """Latest 10-year Treasury yield from the chart history, as a decimal.

    Yahoo quotes ^TNX as the yield times ten, so 43.1 means 4.31%.
    Returns None if unavailable, in which case WACC is left untouched.
    """
    path = os.path.join(HERE, "docs", "history.js")
    try:
        text = open(path).read()
    except FileNotFoundError:
        return None
    prefix = "var FF_HISTORY = "
    if not text.startswith(prefix):
        return None
    try:
        hist = json.loads(text[len(prefix):].rstrip().rstrip(";"))
    except json.JSONDecodeError:
        return None

    entry = hist.get("^TNX")
    if not isinstance(entry, dict) or not entry.get("c"):
        return None
    raw = entry["c"][-1]
    if not isinstance(raw, (int, float)):
        return None
    rf = raw / 1000.0                     # 43.1 -> 0.0431
    return rf if 0.005 < rf < 0.12 else None


def recalibrate_model(companies):
    """Update the inputs that drive fair value, from real data.

    Two things happen here, and both are arithmetic rather than judgement:

    1. WACC moves with the risk-free rate. Every discount rate was set against
       a 4.63% ten-year Treasury. When that rate changes, the cost of capital
       changes for everyone. Each company keeps its own risk premium exactly
       as written -- only the common base moves -- so the relative ranking
       between companies is untouched.

    2. The starting free cash flow margin is rebased to what the company is
       actually earning, using the revenue and free cash flow that
       fetch_fundamentals.py pulls. A model whose starting point drifted away
       from reality is stale no matter how good the original thinking was.

    What is deliberately NOT touched: the five-year growth path, the year-five
    margin target, and the terminal growth rate. Those are forecasts, not
    measurements. No feed can produce them and they should change when the
    analyst revisits a company, not when a number moves.
    """
    rf_now = current_risk_free()
    wacc_moved = margin_moved = 0
    rejected = []

    # --- 1. WACC follows the risk-free rate -----------------------------
    if rf_now is not None:
        delta = rf_now - BASE_RISK_FREE
        if abs(delta) >= 0.0005:          # ignore noise below 5 basis points
            for c in companies:
                new = c["wacc"] + delta
                if not (MIN_WACC <= new <= MAX_WACC):
                    rejected.append(f"{c['t']} wacc {new:.3f} out of bounds")
                    continue
                if new <= c["tg"] + 0.005:   # discount rate must exceed growth
                    rejected.append(f"{c['t']} wacc would fall below terminal growth")
                    continue
                c["wacc"] = round(new, 5)
                wacc_moved += 1
            print(f"Risk-free rate {BASE_RISK_FREE*100:.2f}% -> {rf_now*100:.2f}% "
                  f"({delta*10000:+.0f} bp): repriced {wacc_moved} WACCs")
        else:
            print(f"Risk-free rate unchanged at {rf_now*100:.2f}% — WACC untouched")
    else:
        print("No Treasury yield available — WACC left at stored values")

    # --- 2. Rebase the starting margin to actuals ------------------------
    try:
        fund = json.load(open(os.path.join(HERE, "fundamentals.json")))
    except (FileNotFoundError, json.JSONDecodeError, ValueError):
        fund = {}
    if not isinstance(fund, dict):
        fund = {}

    big_moves, implausible = [], []
    for c in companies:
        got = fund.get(c["t"])
        if not isinstance(got, dict):
            continue
        rev, fcf = got.get("rev"), got.get("fcf")
        if not (finite(rev) and finite(fcf)) or rev <= 0:
            continue
        actual = fcf / rev
        # Impossible on its face, regardless of how far it moved.
        if not (MARGIN_FLOOR <= actual <= MARGIN_CEILING):
            implausible.append(f"{c['t']:6s} implied margin {actual:>8.1%}")
            continue
        # A company modelled as profitable that reports a negative margin is
        # usually a one-off or a data artefact. Report it, do not act on it.
        if actual <= 0 < c["m0"]:
            rejected.append(f"{c['t']} actual margin {actual:.1%} is negative")
            continue
        shift = actual - c["m0"]
        if abs(shift) > MAX_MARGIN_SHIFT:
            big_moves.append(f"{c['t']:6s} modelled {c['m0']:>6.1%} -> actual {actual:>6.1%}")
            continue
        if abs(shift) < 0.002:
            continue
        c["m0"] = round(actual, 4)
        # Keep the year-five target above the new starting point if the
        # original model assumed expansion; do not silently invert the thesis.
        if c["m1"] < c["m0"]:
            c["m1"] = round(c["m0"], 4)
        margin_moved += 1

    if margin_moved:
        print(f"Rebased {margin_moved} starting margins to reported free cash flow")
    if implausible:
        print(f"  {len(implausible)} implied margins were outside "
              f"{MARGIN_FLOOR:.0%} to {MARGIN_CEILING:.0%} and were rejected as "
              f"impossible (the revenue feed is unreliable for these):")
        for x in implausible[:10]:
            print("    " + x)
        if len(implausible) > 10:
            print(f"    ... and {len(implausible)-10} more")
    if big_moves:
        print(f"  {len(big_moves)} margins moved more than "
              f"{MAX_MARGIN_SHIFT:.0%} and were NOT applied — review by hand:")
        for b in big_moves[:12]:
            print("    " + b)
        if len(big_moves) > 12:
            print(f"    ... and {len(big_moves)-12} more")
    if rejected:
        print(f"  {len(rejected)} recalibrations rejected by guard rails")

    return {"wacc": wacc_moved, "margin": margin_moved}


# --- forecast recalibration bounds -----------------------------------------
# Every one of these exists because an unbounded automatic model will happily
# extrapolate a single odd quarter into a decade of nonsense.
# Year-one growth band. The original 60% ceiling was far too permissive:
# the feed reported JPMorgan growing 109% and Royal Bank 135%, which is not
# something large banks do. Clamping those to 60% still published a fiction.
# Anything above this is now REJECTED rather than clamped, because a number
# that wrong is not a signal worth partially trusting.
G1_MIN, G1_MAX = -0.25, 0.45
G1_REJECT_ABOVE = 0.60            # beyond this the datum is discarded entirely
G1_MAX_STEP = 0.20                # how far year-one growth may move in one run
FADE_FLOOR = 0.02                 # growth never fades below this by year five
M1_MAX_EXPANSION = 0.08           # margin may be forecast to expand by 8pp, no more
MIN_FORECAST_YEARS = 5


def sector_long_growth(companies):
    """Median observed long-run growth per sector, used to shape the fade.

    Anchoring the tail of the forecast to what a sector actually does is more
    defensible than picking a number, and it updates itself as the data does.
    """
    buckets = {}
    for c in companies:
        g = c.get("_growth_long")
        if finite(g) and -0.2 < g < 0.6:
            buckets.setdefault(c["sec"], []).append(g)
    out = {}
    for sec, vals in buckets.items():
        vals.sort()
        med = vals[len(vals) // 2] if len(vals) % 2 else \
              (vals[len(vals) // 2 - 1] + vals[len(vals) // 2]) / 2
        out[sec] = max(FADE_FLOOR, min(0.18, med))
    return out


def recalibrate_forecasts(companies):
    """Rebuild the five-year growth path and margin target from observed data.

    THE RULE, stated once so it can be checked:

      Year one growth  = the company's actual trailing revenue growth, clamped
                         to a sane band and limited in how far it may move from
                         the previous assumption in a single run.

      Years two to five = a smooth geometric fade from year one toward the
                         median long-run growth of that company's sector.

      Year five margin = current margin plus a bounded convergence toward the
                         sector median margin, so a company earning far below
                         its peers is assumed to close part of the gap, and one
                         earning far above is assumed to give some back.

    This makes the library systematic rather than hand-tuned. That is a real
    trade: it is consistent and reproducible across every company, and it
    cannot capture a company-specific insight that the numbers do not yet
    show. The thesis and risk sections carry that judgement instead.
    """
    try:
        fund = json.load(open(os.path.join(HERE, "fundamentals.json")))
    except (FileNotFoundError, json.JSONDecodeError, ValueError):
        fund = None
    if not isinstance(fund, dict):
        print("No usable fundamentals.json — forecasts left at stored values")
        return {"growth": 0, "margin": 0}

    # stash fetched long-run growth so sector medians can be computed
    for c in companies:
        got = fund.get(c["t"])
        if isinstance(got, dict):
            c["_growth_long"] = got.get("growth_long")

    sector_g = sector_long_growth(companies)

    # sector median current margin, for the year-five target
    m_buckets = {}
    for c in companies:
        m_buckets.setdefault(c["sec"], []).append(c["m0"])
    sector_m = {}
    for sec, vals in m_buckets.items():
        vals.sort()
        sector_m[sec] = vals[len(vals) // 2] if len(vals) % 2 else \
                        (vals[len(vals) // 2 - 1] + vals[len(vals) // 2]) / 2

    grown = margined = 0
    clamped, discarded = [], []

    for c in companies:
        got = fund.get(c["t"])
        if not isinstance(got, dict):
            continue

        # ---- growth path -------------------------------------------------
        g_actual = got.get("growth_ttm")
        if finite(g_actual) and abs(g_actual) > G1_REJECT_ABOVE:
            # Not a real growth rate. Keep the stored assumption.
            discarded.append(f"{c['t']:6s} reported growth {g_actual:>8.1%}")
            g_actual = None
        if finite(g_actual):
            old_g1 = c["growth"][0]
            g1 = max(G1_MIN, min(G1_MAX, g_actual))
            if abs(g1 - g_actual) > 0.001:
                clamped.append(f"{c['t']:6s} growth {g_actual:>7.1%} clamped to {g1:>6.1%}")
            # do not let one print swing the whole forecast
            if g1 - old_g1 > G1_MAX_STEP:
                g1 = old_g1 + G1_MAX_STEP
            elif old_g1 - g1 > G1_MAX_STEP:
                g1 = old_g1 - G1_MAX_STEP

            target = sector_g.get(c["sec"], 0.05)
            target = max(FADE_FLOOR, min(g1, target))   # never fade upward
            path = []
            for yr in range(MIN_FORECAST_YEARS):
                # geometric glide from g1 to target across the five years
                w = yr / (MIN_FORECAST_YEARS - 1)
                path.append(round(g1 * (1 - w) + target * w, 4))
            if path != c["growth"]:
                c["growth"] = path
                grown += 1

        # ---- year-five margin target -------------------------------------
        peer_m = sector_m.get(c["sec"], c["m0"])
        gap = peer_m - c["m0"]
        # close a third of the gap to the sector, bounded either way
        move = max(-M1_MAX_EXPANSION, min(M1_MAX_EXPANSION, gap / 3.0))
        new_m1 = round(c["m0"] + move, 4)
        # a company already earning well should not be forecast into losses
        if new_m1 > 0 and abs(new_m1 - c["m1"]) > 0.002:
            c["m1"] = new_m1
            margined += 1

    for c in companies:
        c.pop("_growth_long", None)

    print(f"Forecasts: {grown} growth paths rebuilt from actual revenue growth, "
          f"{margined} margin targets reset to sector convergence")
    if discarded:
        print(f"  {len(discarded)} reported growth rates exceeded "
              f"{G1_REJECT_ABOVE:.0%} and were discarded as implausible "
              f"(stored assumption kept):")
        for x in discarded[:10]:
            print("    " + x)
        if len(discarded) > 10:
            print(f"    ... and {len(discarded)-10} more")
    if clamped:
        print(f"  {len(clamped)} growth rates fell outside the "
              f"{G1_MIN:.0%} to {G1_MAX:.0%} band and were clamped:")
        for x in clamped[:10]:
            print("    " + x)
        if len(clamped) > 10:
            print(f"    ... and {len(clamped)-10} more")
    return {"growth": grown, "margin": margined}


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


def warn_implausible(companies):
    """Flag figures that are probably wrong rather than merely surprising.

    Prices self-correct from the daily feed, but share counts do not — so a
    stock split silently doubles the market cap and every multiple built on
    it. These warnings do not stop the build; they make bad inputs visible
    instead of letting them sit on the live site.
    """
    warnings = []
    for c in companies:
        mcap = c["price"] * c["shares"]          # $B
        if mcap > 6000:
            warnings.append(f"{c['t']}: market cap ${mcap/1000:.2f}T looks too high "
                            f"(${c['price']:,.2f} x {c['shares']:.3f}B shares) "
                            f"— check for a stock split")
        if mcap < 8:
            warnings.append(f"{c['t']}: market cap ${mcap:.1f}B looks too low "
                            f"for a large-cap library — check price and share count")
        # Post-split, very few large caps trade above $900. A high price here
        # is the single best signal that a split happened and the stored share
        # count was never updated to match.
        if c["price"] > 900 and c["t"] not in ("BKNG", "ASML"):
            warnings.append(f"{c['t']:6s} ${c['price']:>9,.2f}  "
                            f"mcap ${mcap:>7,.0f}B  — high price, verify not pre-split")
    return warnings


def main():
    companies = load_companies()
    print(f"Loaded {len(companies)} companies")

    errors = validate(companies)
    if errors:
        print(f"\n{len(errors)} validation error(s) — fix these before the site will build:\n")
        for e in errors:
            print(f"  - {e}")
        return 1

    for w in warn_implausible(companies):
        print(f"  warning: {w}")

    # Snapshot the hand-written assumptions before anything touches them, so
    # a company whose recalibration produces nonsense can fall back to them.
    global ORIGINAL_ASSUMPTIONS
    ORIGINAL_ASSUMPTIONS = {
        c["t"]: {"growth": list(c["growth"]), "m0": c["m0"], "m1": c["m1"],
                 "wacc": c["wacc"], "tg": c["tg"], "rev": c["rev"],
                 "shares": c["shares"], "netdebt": c["netdebt"]}
        for c in companies
    }

    apply_fundamentals(companies)
    recalibrate_model(companies)
    recalibrate_forecasts(companies)
    apply_live_prices(companies)
    check_price_chart_agreement(companies)
    meta = dict(META)
    stamp_date(meta)

    # Last line of defence. If anything above let a bad number through, stop
    # here rather than publishing a nan fair value.
    # Last line of defence. Rather than failing the whole run, drop any company
    # whose inputs are unusable and carry on — one bad feed entry should not
    # take the site down, but it must never be published either.
    clean, dropped = [], []
    for c in companies:
        bad = None
        for k in ("price", "shares", "rev", "netdebt", "m0", "m1", "wacc", "tg"):
            if not finite(c.get(k)):
                bad = f"{k}={c.get(k)!r}"
                break
        if bad is None and not all(finite(g) for g in c.get("growth", [])):
            bad = "growth path"
        if bad:
            dropped.append(f"{c['t']} ({bad})")
        else:
            clean.append(c)
    if dropped:
        print(f"  DROPPED {len(dropped)} companies with unusable inputs: "
              + ", ".join(dropped[:8]) + (" ..." if len(dropped) > 8 else ""))
        print("  These are excluded from the site rather than published wrong.")
    companies = clean
    if not companies:
        print("No companies survived validation — refusing to overwrite data.js")
        return 1

    # ---- final output sanity gate ------------------------------------
    # Whatever survived the input checks, a fair value implying several
    # thousand percent upside is not a research finding, it is a broken
    # input. Rebuild those companies from their stored assumptions rather
    # than publishing the number.
    from engine import build as _build
    out, reverted = [], []
    for c in companies:
        row = _build(c)
        # A negative fair value is a legitimate result when a company's debt
        # exceeds the present value of its cash flows. The site already renders
        # those as "N/M" rather than a negative price, so they must not be
        # caught by a gate meant for broken inputs.
        legitimately_negative = row.get("fv", 0) <= 0
        implausible = (not finite(row.get("upside"))
                       or (not legitimately_negative
                           and not (-0.98 <= row["upside"] <= 3.0)))
        if implausible:
            original = ORIGINAL_ASSUMPTIONS.get(c["t"])
            if original:
                fixed = dict(c)
                fixed.update(original)
                candidate = _build(fixed)
                if finite(candidate.get("upside")) and -0.98 <= candidate["upside"] <= 3.0:
                    reverted.append(f"{c['t']} ({row['upside']*100:+,.0f}%)")
                    out.append(candidate)
                    continue
            reverted.append(f"{c['t']} ({row['upside']*100:+,.0f}%, dropped)")
            continue
        out.append(row)

    if reverted:
        print(f"  REVERTED {len(reverted)} companies whose recalibrated upside was "
              f"implausible (> 300% or < -98%):")
        for r in reverted[:12]:
            print("    " + r)
        if len(reverted) > 12:
            print(f"    ... and {len(reverted)-12} more")
        print("    These use their stored assumptions instead of the fetched data.")

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
