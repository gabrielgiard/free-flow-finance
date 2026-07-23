"""FreeFlow Finance — valuation engine.

A two-stage unlevered DCF, run identically for all 100 companies so the outputs
are comparable to each other.

  Stage 1 (years 1-5)   explicit forecast. Revenue grows at the rates we set per
                        company; the free cash flow margin glides from today's
                        level to a year-5 target.
  Stage 2 (years 6-10)  fade. Growth decays in a straight line from the year-5
                        rate down to the terminal rate. Margin holds.
  Terminal              Gordon Growth on year-10 free cash flow.

Cash flows are discounted with the mid-year convention, because companies
generate cash through the year rather than in a lump on 31 December.

Why ten years and not five: a five-year window followed immediately by perpetual
low growth systematically undervalues any company with a long runway. The fade
period is where a real analyst does the honest work.
"""

STAGE1 = 5
STAGE2 = 5
NYEARS = STAGE1 + STAGE2


def project(rev, growth, m0, m1, tg):
    rows, r = [], rev
    g5 = growth[-1]
    for i in range(NYEARS):
        if i < STAGE1:
            g = growth[i]
            m = m0 + (m1 - m0) * ((i + 1) / STAGE1)
        else:
            step = (i - STAGE1 + 1) / STAGE2
            g = g5 + (tg - g5) * step
            m = m1
        r = r * (1 + g)
        rows.append({"year": i + 1, "rev": r, "growth": g, "margin": m,
                     "fcf": r * m, "stage": 1 if i < STAGE1 else 2})
    return rows


def dcf(rev, growth, m0, m1, wacc, tg, netdebt, shares):
    if wacc <= tg + 0.010:
        wacc = tg + 0.010
    rows = project(rev, growth, m0, m1, tg)
    pv_explicit = 0.0
    for row in rows:
        df = 1 / ((1 + wacc) ** (row["year"] - 0.5))
        row["df"] = df
        row["pv"] = row["fcf"] * df
        pv_explicit += row["pv"]
    fcfN = rows[-1]["fcf"]
    tv = fcfN * (1 + tg) / (wacc - tg)
    tv_df = 1 / ((1 + wacc) ** (NYEARS - 0.5))
    pv_tv = tv * tv_df
    ev = pv_explicit + pv_tv
    eq = ev - netdebt
    return {"rows": rows, "pv_explicit": pv_explicit, "tv": tv, "pv_tv": pv_tv,
            "ev": ev, "equity": eq, "per_share": eq / shares if shares else 0,
            "tv_share": pv_tv / ev if ev else 0}


def scenarios(c):
    base = dcf(c["rev"], c["growth"], c["m0"], c["m1"], c["wacc"], c["tg"],
               c["netdebt"], c["shares"])
    bull = dcf(c["rev"], [g + 0.030 for g in c["growth"]], c["m0"], c["m1"] + 0.020,
               c["wacc"] - 0.005, c["tg"] + 0.0025, c["netdebt"], c["shares"])
    bear = dcf(c["rev"], [g - 0.030 for g in c["growth"]], c["m0"],
               max(c["m1"] - 0.020, 0.01), c["wacc"] + 0.005,
               max(c["tg"] - 0.0050, 0.0), c["netdebt"], c["shares"])
    return base, bull, bear


def grid(c):
    waccs = [c["wacc"] + d for d in (-0.010, -0.005, 0, 0.005, 0.010)]
    tgs = [c["tg"] + d for d in (-0.005, -0.0025, 0, 0.0025, 0.005)]
    vals = [[round(dcf(c["rev"], c["growth"], c["m0"], c["m1"], w, max(t, 0),
                       c["netdebt"], c["shares"])["per_share"], 2)
             for t in tgs] for w in waccs]
    return {"waccs": [round(w * 100, 2) for w in waccs],
            "tgs": [round(t * 100, 2) for t in tgs], "values": vals}


def rate(upside):
    if upside >= 0.30:  return "Strong Buy"
    if upside >= 0.12:  return "Buy"
    if upside >= -0.12: return "Hold"
    if upside >= -0.30: return "Reduce"
    return "Sell"


def _compound(gs):
    x = 1.0
    for g in gs:
        x *= (1 + g)
    return x


def build(c):
    base, bull, bear = scenarios(c)
    fv, price = base["per_share"], c["price"]
    upside = fv / price - 1 if price else 0
    ttm_fcf = c["rev"] * c["m0"]
    mcap = price * c["shares"]
    ev_now = mcap + c["netdebt"]
    out = dict(c)
    out.update({
        "fv": round(fv, 2),
        "fv_bull": round(bull["per_share"], 2),
        "fv_bear": round(bear["per_share"], 2),
        "upside": round(upside, 4),
        "up_bull": round(bull["per_share"] / price - 1, 4) if price else 0,
        "up_bear": round(bear["per_share"] / price - 1, 4) if price else 0,
        "rating": rate(upside),
        "mcap": round(mcap, 1),
        "ev_now": round(ev_now, 1),
        "ttm_fcf": round(ttm_fcf, 2),
        "fcf_yield": round(ttm_fcf / mcap, 4) if mcap else 0,
        "ev_sales": round(ev_now / c["rev"], 2) if c["rev"] else 0,
        "ev_fcf": round(ev_now / ttm_fcf, 1) if ttm_fcf else 0,
        "cagr5": round(_compound(c["growth"]) ** 0.2 - 1, 4),
        "rev5": round(c["rev"] * _compound(c["growth"]), 1),
        "model": [{"y": r["year"], "rev": round(r["rev"], 1),
                   "growth": round(r["growth"], 4), "margin": round(r["margin"], 4),
                   "fcf": round(r["fcf"], 2), "df": round(r["df"], 4),
                   "pv": round(r["pv"], 2), "stage": r["stage"]}
                  for r in base["rows"]],
        "dcf": {"pv_explicit": round(base["pv_explicit"], 1),
                "tv": round(base["tv"], 1), "pv_tv": round(base["pv_tv"], 1),
                "ev": round(base["ev"], 1), "netdebt": round(c["netdebt"], 1),
                "equity": round(base["equity"], 1),
                "tv_share": round(base["tv_share"], 4)},
        "grid": grid(c),
        "segs": [s for s in c["segs"] if s[1] > 0],
    })
    return out
