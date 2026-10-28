"""Second valuation model: trading multiples of comparable companies.

WHY THIS MODEL

After the DCF, valuing a company off what the market pays for similar
companies is the method analysts use most. It answers a different question
from the DCF: not "what is this worth on its own cash flows?" but "what would
it be worth if it traded like its closest peers?". The two disagree for a
reason worth seeing, which is why the site lets a reader switch between them.

THE RECIPE, stated once so it can be checked

1. Peers. Within the company's sector, the eight companies most like it on
   four measured things: size (market value, on a log scale), five-year
   growth, free cash flow margin and leverage (net debt as a share of
   enterprise value). A sector label alone is too coarse: NVIDIA and Seagate
   share a sector but not a valuation, and a utility is not an oil major.

2. Three ways to read the peers, blended:
     trailing   EV / last twelve months' free cash flow      weight 35%
     forward    EV / next year's free cash flow (the model's    weight 35%
                year-one forecast for each company)
     growth-    across the whole sector, the line that best     weight 30%
     adjusted   explains EV/FCF by five-year growth, read off
                at this company's own growth rate
   Forward multiples are, in the research, the most accurate single
   multiple; the growth-adjusted reading stops a fast grower being valued
   like its slower peers, or the reverse. The regression is used only when
   it explains something (R-squared of at least 0.05, rising with growth);
   otherwise its weight goes to the other two.

   Banks, insurers, exchanges and asset managers use the equity versions
   (price / free cash flow), because debt is part of their business.

3. Value. Each reading's multiple times the company's own cash flow gives an
   enterprise value; the weighted blend, minus net debt, divided by shares,
   gives a value per share. The peers' 25th and 75th percentile multiples
   give the low and high ends.

4. Sales, only as a fallback. A company with no positive free cash flow is
   valued on EV / sales (trailing and forward), and the page says so: a sales
   multiple borrowed from higher-margin peers flatters a thin-margin or
   loss-making business (a grocer priced like a soft-drink brand).

5. Robustness. Multiples outside a sane band (negative, or EV/FCF above 150x)
   are left out. If fewer than three peers give a usable multiple, the whole
   sector is used, and the breakdown says so.

What it cannot do: if a whole sector is expensive, every company in it can
look fairly valued against its peers. The DCF is the check on that.

docs/multiples.js repeats the arithmetic for the "Your case" sliders; the
two must agree, which pipeline_test.py checks.
"""

import math
import statistics

PEERS = 8
EQUITY_SECTORS = {"financials"}
BANDS = {"fcf": (0.0, 150.0), "sales": (0.0, 60.0)}
WEIGHTS = {"ttm": 0.35, "fwd": 0.35, "reg": 0.30}
MIN_R2 = 0.05
GRID_MULT = (0.8, 0.9, 1.0, 1.1, 1.2)
GRID_CASH = (-0.2, -0.1, 0.0, 0.1, 0.2)


def _rate(upside):
    from engine import rate
    return rate(upside)


def _quantile(vals, q):
    """Linear-interpolated quantile, same convention as numpy's default."""
    v = sorted(vals)
    if not v:
        return None
    pos = (len(v) - 1) * q
    lo, hi = math.floor(pos), math.ceil(pos)
    return v[lo] + (v[hi] - v[lo]) * (pos - lo)


def _distance(a, b):
    size = abs(math.log10(max(a["mcap"], 0.1) / max(b["mcap"], 0.1)))
    growth = abs(a["cagr5"] - b["cagr5"]) / 0.10
    margin = abs(a["m0"] - b["m0"]) / 0.15
    lev = abs(a.get("nd_ev", 0) - b.get("nd_ev", 0)) / 0.35
    return size + growth + margin + lev


def closeness(a, b):
    """0-100: how alike two companies are on the four peer measures."""
    return round(100 * math.exp(-_distance(a, b) / 2))


def pick_peers(c, sector_members):
    others = [p for p in sector_members if p["t"] != c["t"]]
    return sorted(others, key=lambda p: (_distance(c, p), p["t"]))[:PEERS]


def _fwd(p, kind):
    """Next year's free cash flow (or sales): the model's year-one forecast."""
    m = p.get("model") or []
    if m:
        return m[0]["fcf"] if kind == "fcf" else m[0]["rev"]
    g = (p.get("growth") or [0])[0]
    return (p["ttm_fcf"] if kind == "fcf" else p["rev"]) * (1 + g)


def metric(p, kind, when):
    return (p["ttm_fcf"] if kind == "fcf" else p["rev"]) if when == "ttm" else _fwd(p, kind)


def multiple(p, kind, when, equity):
    """A company's own multiple, or None if unusable."""
    base = p["mcap"] if equity else p["ev_now"]
    denom = metric(p, kind, when)
    if not denom or denom <= 0 or base <= 0:
        return None
    x = base / denom
    lo, hi = BANDS[kind]
    return x if lo < x < hi else None


def regression(c, kind, equity, sector_members):
    """Sector line: trailing multiple against five-year growth. None when it
    explains nothing useful."""
    pts = [(p["cagr5"], multiple(p, kind, "ttm", equity)) for p in sector_members if p["t"] != c["t"]]
    pts = [(g, y) for g, y in pts if y is not None]
    if len(pts) < 6:
        return None
    ys = sorted(y for _, y in pts)
    lo, hi = _quantile(ys, 0.10), _quantile(ys, 0.90)
    pts = [(g, min(max(y, lo), hi)) for g, y in pts]          # winsorise the tails
    n = len(pts)
    mg = sum(g for g, _ in pts) / n
    my = sum(y for _, y in pts) / n
    sxx = sum((g - mg) ** 2 for g, _ in pts)
    if sxx <= 1e-12:
        return None
    b = sum((g - mg) * (y - my) for g, y in pts) / sxx
    a = my - b * mg
    ss_tot = sum((y - my) ** 2 for _, y in pts)
    ss_res = sum((y - (a + b * g)) ** 2 for g, y in pts)
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0
    pred = min(max(a + b * c["cagr5"], lo), hi)
    resid = math.sqrt(ss_res / max(n - 2, 1))
    return {"a": round(a, 3), "b": round(b, 3), "r2": round(r2, 3), "n": n,
            "g": round(c["cagr5"], 4), "pred": round(pred, 2),
            "lo": round(max(pred - 0.674 * resid, lo), 2), "hi": round(min(pred + 0.674 * resid, hi), 2),
            "usable": bool(r2 >= MIN_R2 and b > 0)}


def value(c, peers, sector_members):
    """The multiples valuation for one company, with all of its working."""
    equity = c["sec"] in EQUITY_SECTORS
    kind = "fcf" if c["ttm_fcf"] > 0 else "sales"
    pre = "P/" if equity else "EV/"
    unit = "FCF" if kind == "fcf" else "Sales"
    methods = []
    for when, label in (("ttm", "trailing"), ("fwd", "forward")):
        own = metric(c, kind, when)
        if not own or own <= 0:
            continue
        vals = [m for m in (multiple(p, kind, when, equity) for p in peers) if m is not None]
        source = "peers"
        if len(vals) < 3:
            vals = [m for m in (multiple(p, kind, when, equity) for p in sector_members
                                if p["t"] != c["t"]) if m is not None]
            source = "sector"
        if len(vals) < 3:
            continue
        methods.append({"id": when, "k": f"{pre}{unit}, {label}", "w": WEIGHTS[when],
                        "n": len(vals), "from": source, "own": round(own, 2),
                        "med": round(statistics.median(vals), 2),
                        "q25": round(_quantile(vals, 0.25), 2),
                        "q75": round(_quantile(vals, 0.75), 2)})
    reg = regression(c, kind, equity, sector_members) if kind == "fcf" else None
    if reg and reg["usable"] and c["ttm_fcf"] > 0:
        methods.append({"id": "reg", "k": f"{pre}{unit}, growth-adjusted", "w": WEIGHTS["reg"],
                        "n": reg["n"], "from": "sector", "own": round(c["ttm_fcf"], 2),
                        "med": reg["pred"], "q25": reg["lo"], "q75": reg["hi"]})
    if not methods:
        return None
    tw = sum(m["w"] for m in methods)
    for m in methods:
        m["w"] = round(m["w"] / tw, 4)

    shares, nd = c["shares"], c["netdebt"]

    def to_share(whole):
        eq = whole if equity else whole - nd
        return eq / shares if shares > 0 and eq > 0 else 0.0

    for m in methods:
        m["implied"] = round(m["med"] * m["own"], 2)
        m["ps"] = round(to_share(m["implied"]), 2)
        m["ps_lo"] = round(to_share(m["q25"] * m["own"]), 2)
        m["ps_hi"] = round(to_share(m["q75"] * m["own"]), 2)

    blend = lambda q: sum(m["w"] * m[q] * m["own"] for m in methods)
    whole, whole_lo, whole_hi = blend("med"), blend("q25"), blend("q75")
    fv, bear, bull = to_share(whole), to_share(whole_lo), to_share(whole_hi)
    price = c["price"]
    up = (fv / price - 1) if fv > 0 and price else 0.0

    base_metric = methods[0]["own"]                          # the trailing figure
    eff = whole / base_metric if base_metric else 0           # blended multiple of it
    grid = [[round(to_share(whole * fm * (1 + fc)), 2) for fc in GRID_CASH] for fm in GRID_MULT]
    cur = (c["mcap"] if equity else c["ev_now"]) / base_metric if base_metric > 0 else None

    return {
        "fv": round(fv, 2), "fv_bear": round(bear, 2), "fv_bull": round(bull, 2),
        "upside": round(up, 4),
        "up_bear": round(bear / price - 1, 4) if bear > 0 and price else 0.0,
        "up_bull": round(bull / price - 1, 4) if bull > 0 and price else 0.0,
        "rating": _rate(up) if fv > 0 else "Sell",
        "basis": "equity" if equity else "ev",
        "kind": kind,
        "sales_only": kind == "sales",
        "methods": methods,
        "reg": reg,
        "whole": round(whole, 2),
        "netdebt": round(nd, 2),
        "equity": round(whole if equity else whole - nd, 2),
        "eff": round(eff, 2),
        "cur": round(cur, 2) if cur else None,
        "prem": round(cur / methods[0]["med"] - 1, 4) if cur and methods[0]["med"] else None,
        "grid": {"mults": [round(eff * f, 2) for f in GRID_MULT],
                 "cash": [int(f * 100) for f in GRID_CASH], "values": grid},
        "close": {p["t"]: closeness(c, p) for p in peers},
    }


def apply(companies):
    """Set each company's peers and its multiples valuation ('mx')."""
    by_sector = {}
    for c in companies:
        by_sector.setdefault(c["sec"], []).append(c)
    done = 0
    for c in companies:
        members = by_sector[c["sec"]]
        peers = pick_peers(c, members)
        c["peers"] = [p["t"] for p in peers]
        mx = value(c, peers, members)
        if mx:
            c["mx"] = mx
            done += 1
        else:
            c.pop("mx", None)
    ups = sorted(c["mx"]["upside"] for c in companies if c.get("mx") and c["mx"]["fv"] > 0)
    med = ups[len(ups) // 2] if ups else 0
    regs = sum(1 for c in companies if c.get("mx") and any(m["id"] == "reg" for m in c["mx"]["methods"]))
    print(f"Multiples model: {done}/{len(companies)} companies valued, "
          f"growth-adjusted reading used for {regs}, median gap to price {med * 100:+.1f}%")
    return done
