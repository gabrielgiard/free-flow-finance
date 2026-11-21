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
    # Bear margin: a floor of 0.01 was wrong. When the base year-five margin
    # sits below 1%, flooring the bear case at 1% makes the pessimistic
    # scenario MORE optimistic than the base — which the fuzzer duly found.
    # The bear margin must never exceed the base margin.
    bear_m1 = min(c["m1"], max(c["m1"] - 0.020, 0.0))

    # Bull terminal growth must stay clear of the bull discount rate, or the
    # Gordon Growth denominator collapses toward zero and the value explodes.
    bull_wacc = c["wacc"] - 0.005
    bull_tg = min(c["tg"] + 0.0025, bull_wacc - 0.005)

    bull = dcf(c["rev"], [g + 0.030 for g in c["growth"]], c["m0"], c["m1"] + 0.020,
               bull_wacc, bull_tg, c["netdebt"], c["shares"])
    bear = dcf(c["rev"], [g - 0.030 for g in c["growth"]], c["m0"],
               bear_m1, c["wacc"] + 0.005,
               max(c["tg"] - 0.0050, 0.0), c["netdebt"], c["shares"])

    # Final guarantee. Whatever the inputs, a bear case that prints above the
    # base case, or a bull below it, is incoherent on the page regardless of
    # how the arithmetic got there.
    b, u, d_ = base["per_share"], bull["per_share"], bear["per_share"]
    if d_ > b:
        bear["per_share"] = b
    if u < b:
        bull["per_share"] = b
    return base, bull, bear


def grid(c):
    waccs = [c["wacc"] + d for d in (-0.010, -0.005, 0, 0.005, 0.010)]
    tgs = [c["tg"] + d for d in (-0.005, -0.0025, 0, 0.0025, 0.005)]
    vals = [[round(dcf(c["rev"], c["growth"], c["m0"], c["m1"], w, max(t, 0),
                       c["netdebt"], c["shares"])["per_share"], 2)
             for t in tgs] for w in waccs]
    return {"waccs": [round(w * 100, 2) for w in waccs],
            "tgs": [round(t * 100, 2) for t in tgs], "values": vals}


# --------------------------------------------------------------------------
# Banks and insurers: the excess-return (residual income) model.
#
# A cash-flow DCF treats debt as financing. For a bank, deposits and loans ARE
# the business, and for an insurer the float is, so "free cash flow" is not a
# meaningful number for either. What is meaningful is how much the company
# earns on its shareholders' money (return on equity, ROE) against what those
# shareholders could earn elsewhere at the same risk (the cost of equity, ke).
#
#   value = book value today
#         + the present value of every future year's EXCESS return
#           (ROE - ke) x book value at the start of that year
#
# A bank earning exactly its cost of equity is worth its book value (1.0x
# price-to-book). One earning more is worth more; one earning less, less.
#
#   Years 1-5   ROE moves in a straight line from today's level to the
#               year-5 target. Book value grows by the profit kept (ROE x
#               (1 - payout)); dividends and buybacks leave the business.
#   Years 6-10  ROE holds; book value growth fades to the long-term rate.
#   Terminal    the year-11 excess return grows at the long-term rate forever.
#
# Discounting is end-of-year: book value is measured at a date, and the
# excess return accrues across the year that follows it.
# --------------------------------------------------------------------------
def excess_return(bv, roe0, roe1, ke, tg, pay, shares):
    if ke <= tg + 0.010:
        ke = tg + 0.010
    pay = min(max(pay, 0.0), 1.0)
    rows, b, pv = [], bv, 0.0
    g5 = None
    for i in range(NYEARS):
        if i < STAGE1:
            roe = roe0 + (roe1 - roe0) * ((i + 1) / STAGE1)
            gb = roe * (1 - pay)
            if i == STAGE1 - 1:
                g5 = gb
        else:
            roe = roe1
            gb = g5 + (tg - g5) * ((i - STAGE1 + 1) / STAGE2)
        ni = b * roe
        charge = b * ke
        ri = ni - charge
        df = 1 / ((1 + ke) ** (i + 1))
        pv += ri * df
        rows.append({"year": i + 1, "bv": b, "roe": roe, "ni": ni, "charge": charge,
                     "ri": ri, "df": df, "pv": ri * df, "gb": gb,
                     "stage": 1 if i < STAGE1 else 2})
        b = b * (1 + gb)
    ri11 = (roe1 - ke) * b
    tv = ri11 / (ke - tg)
    pv_tv = tv / ((1 + ke) ** NYEARS)
    equity = bv + pv + pv_tv
    return {"rows": rows, "bv": bv, "bv10": b, "pv_ri": pv, "tv": tv, "pv_tv": pv_tv,
            "equity": equity, "per_share": equity / shares if shares else 0,
            "ke": ke, "tv_share": pv_tv / equity if equity > 0 else 0}


def ri_inputs(c):
    """(bv, roe0, roe1, ke, tg, pay) for the base case. The cost of equity is
    the company's discount rate: banks carry no net debt in this library, so
    their WACC already is a cost of equity."""
    r = c["ri"]
    return r["bv"], r["roe0"], r["roe1"], c["wacc"], c["tg"], r["pay"]


def ri_scenarios(c):
    bv, roe0, roe1, ke, tg, pay = ri_inputs(c)
    sh = c["shares"]
    base = excess_return(bv, roe0, roe1, ke, tg, pay, sh)
    # same shape as the cash-flow DCF's bull and bear: the operating
    # assumption +/- 2 points, the discount rate +/- half a point
    bull_ke = ke - 0.005
    bull = excess_return(bv, roe0, roe1 + 0.020, bull_ke, min(tg + 0.0025, bull_ke - 0.005), pay, sh)
    bear = excess_return(bv, roe0, roe1 - 0.020, ke + 0.005, max(tg - 0.0050, 0.0), pay, sh)
    b = base["per_share"]
    if bear["per_share"] > b:
        bear["per_share"] = b
    if bull["per_share"] < b:
        bull["per_share"] = b
    return base, bull, bear


def ri_grid(c):
    """Fair value by cost of equity (rows) and year-5 ROE (columns)."""
    bv, roe0, roe1, ke, tg, pay = ri_inputs(c)
    kes = [ke + d for d in (-0.010, -0.005, 0, 0.005, 0.010)]
    roes = [roe1 + d for d in (-0.04, -0.02, 0, 0.02, 0.04)]
    vals = [[round(excess_return(bv, roe0, r, k, tg, pay, c["shares"])["per_share"], 2)
             for r in roes] for k in kes]
    return {"kes": [round(k * 100, 2) for k in kes],
            "roes": [round(r * 100, 2) for r in roes], "values": vals}


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


def _r(v, d):
    """Round for publication, keeping detail on figures under $1B.

    One decimal of a billion is plenty for Apple and useless for a company
    with $13M of revenue, whose every row would otherwise print as $0.0B or
    $0.1B. Below one (billion) keep three more places, i.e. to the million.
    """
    return round(v, d + 3) if abs(v) < 1 else round(v, d)


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
        "ttm_fcf": _r(ttm_fcf, 2),
        "fcf_yield": round(ttm_fcf / mcap, 4) if mcap else 0,
        "ev_sales": round(ev_now / c["rev"], 2) if c["rev"] else 0,
        "ev_fcf": round(ev_now / ttm_fcf, 1) if ttm_fcf else 0,
        "cagr5": round(_compound(c["growth"]) ** 0.2 - 1, 4),
        "rev5": _r(c["rev"] * _compound(c["growth"]), 1),
        "model": [{"y": r["year"], "rev": _r(r["rev"], 1),
                   "growth": round(r["growth"], 4), "margin": round(r["margin"], 4),
                   "fcf": _r(r["fcf"], 2), "df": round(r["df"], 4),
                   "pv": _r(r["pv"], 2), "stage": r["stage"]}
                  for r in base["rows"]],
        "dcf": {"pv_explicit": _r(base["pv_explicit"], 1),
                "tv": _r(base["tv"], 1), "pv_tv": _r(base["pv_tv"], 1),
                "ev": _r(base["ev"], 1), "netdebt": _r(c["netdebt"], 1),
                "equity": _r(base["equity"], 1),
                "tv_share": round(base["tv_share"], 4)},
        "grid": grid(c),
        "segs": [s for s in c["segs"] if s[1] > 0],
    })
    if c.get("ri"):
        # Banks and insurers: the headline value comes from the excess-return
        # model. The cash-flow DCF stays on the page as a cross-check.
        rb, ru, rd = ri_scenarios(c)
        rfv = rb["per_share"]
        bvps = c["ri"]["bv"] / c["shares"] if c["shares"] else 0
        out["cf"] = {"fv": out["fv"], "fv_bull": out["fv_bull"], "fv_bear": out["fv_bear"],
                     "upside": out["upside"], "rating": out["rating"]}
        rup = rfv / price - 1 if price else 0
        out.update({
            "fv": round(rfv, 2),
            "fv_bull": round(ru["per_share"], 2),
            "fv_bear": round(rd["per_share"], 2),
            "upside": round(rup, 4),
            "up_bull": round(ru["per_share"] / price - 1, 4) if price else 0,
            "up_bear": round(rd["per_share"] / price - 1, 4) if price else 0,
            "rating": rate(rup),
            "bvps": round(bvps, 2),
            "pb": round(price / bvps, 2) if bvps > 0 else 0,
            "erm": {
                "bv": _r(rb["bv"], 1), "bv10": _r(rb["bv10"], 1),
                "pv_ri": _r(rb["pv_ri"], 1), "tv": _r(rb["tv"], 1), "pv_tv": _r(rb["pv_tv"], 1),
                "equity": _r(rb["equity"], 1), "ke": round(rb["ke"], 4),
                "tv_share": round(rb["tv_share"], 4),
                "pb_fair": round(rfv / bvps, 2) if bvps > 0 else 0,
                "rows": [{"y": r["year"], "bv": _r(r["bv"], 1), "roe": round(r["roe"], 4),
                          "ni": _r(r["ni"], 2), "charge": _r(r["charge"], 2), "ri": _r(r["ri"], 2),
                          "df": round(r["df"], 4), "pv": _r(r["pv"], 2), "gb": round(r["gb"], 4),
                          "stage": r["stage"]} for r in rb["rows"]],
                "grid": ri_grid(c),
            },
        })
    return out
