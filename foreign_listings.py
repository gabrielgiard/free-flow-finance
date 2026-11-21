"""Companies priced from their home stock exchange, and live exchange rates.

Most companies in the library trade in New York (directly or as US-listed
shares). The ones below do not, or not liquidly, so their price comes from
their home exchange through Yahoo, in local currency, and is converted to
dollars. Each entry: site ticker -> (Yahoo symbol, currency).

Currency "GBp" means British pence (London quotes most shares in pence), so
the pound rate is divided by 100.

Exchange rates are fetched once per run (Yahoo, e.g. "EURUSD=X"). If that
fails, or the answer is more than 30% away from the fallback below, the
fallback is used and the run says so. Update FALLBACK_USD now and then; it is
only a safety net.
"""

import time

FOREIGN_LISTINGS = {
    # already in the library before November 2026
    "MC": ("MC.PA", "EUR"), "OR": ("OR.PA", "EUR"), "NESN": ("NESN.SW", "CHF"),
    "SIE": ("SIE.DE", "EUR"), "005930": ("005930.KS", "KRW"), "RELIANCE": ("RELIANCE.NS", "INR"),
    # financials
    "BNP": ("BNP.PA", "EUR"), "UCG": ("UCG.MI", "EUR"), "D05": ("D05.SI", "SGD"),
    "CBA": ("CBA.AX", "AUD"), "1398": ("1398.HK", "HKD"), "CS": ("CS.PA", "EUR"),
    "ALV": ("ALV.DE", "EUR"), "MUV2": ("MUV2.DE", "EUR"), "ZURN": ("ZURN.SW", "CHF"),
    "1299": ("1299.HK", "HKD"), "2318": ("2318.HK", "HKD"), "8766": ("8766.T", "JPY"),
    "LSEG": ("LSEG.L", "GBp"), "ADYEN": ("ADYEN.AS", "EUR"),
    # health
    "ROG": ("ROG.SW", "CHF"), "CSL": ("CSL.AX", "AUD"), "4568": ("4568.T", "JPY"),
    "LONN": ("LONN.SW", "CHF"), "EL.PA": ("EL.PA", "EUR"),
    # industrials
    "AIR": ("AIR.PA", "EUR"), "SAF": ("SAF.PA", "EUR"), "SU.PA": ("SU.PA", "EUR"),
    "DG.PA": ("DG.PA", "EUR"), "RR": ("RR.L", "GBp"), "BA.L": ("BA.L", "GBp"),
    "RHM": ("RHM.DE", "EUR"), "ABBN": ("ABBN.SW", "CHF"), "ENR": ("ENR.DE", "EUR"),
    "6501": ("6501.T", "JPY"), "8058": ("8058.T", "JPY"), "ATCO-A": ("ATCO-A.ST", "SEK"),
    "DSV": ("DSV.CO", "DKK"), "6861": ("6861.T", "JPY"),
    # semiconductors and hardware
    "IFX": ("IFX.DE", "EUR"), "8035": ("8035.T", "JPY"), "6857": ("6857.T", "JPY"),
    "000660": ("000660.KS", "KRW"), "2454": ("2454.TW", "TWD"), "2317": ("2317.TW", "TWD"),
    "4063": ("4063.T", "JPY"),
    # software and internet
    "DSY": ("DSY.PA", "EUR"), "CSU": ("CSU.TO", "CAD"), "TCS": ("TCS.NS", "INR"),
    "1810": ("1810.HK", "HKD"), "3690": ("3690.HK", "HKD"), "6098": ("6098.T", "JPY"),
    # consumer
    "RMS": ("RMS.PA", "EUR"), "CFR": ("CFR.SW", "CHF"), "ITX": ("ITX.MC", "EUR"),
    "ADS": ("ADS.DE", "EUR"), "7974": ("7974.T", "JPY"), "9983": ("9983.T", "JPY"),
    "600519": ("600519.SS", "CNY"), "9992": ("9992.HK", "HKD"), "HEIA": ("HEIA.AS", "EUR"),
    # autos
    "VOW3": ("VOW3.DE", "EUR"), "BMW": ("BMW.DE", "EUR"), "MBG": ("MBG.DE", "EUR"),
    "005380": ("005380.KS", "KRW"), "300750": ("300750.SZ", "CNY"),
    # energy, materials, utilities
    "2222": ("2222.SR", "SAR"), "IBE": ("IBE.MC", "EUR"), "ENEL": ("ENEL.MI", "EUR"),
    "GLEN": ("GLEN.L", "GBp"),
    # telecom
    "DTE": ("DTE.DE", "EUR"), "BHARTIARTL": ("BHARTIARTL.NS", "INR"), "0941": ("0941.HK", "HKD"),
}

# US dollars per one unit of each currency (approximate, November 2026)
FALLBACK_USD = {
    "USD": 1.0, "EUR": 1.16, "GBP": 1.33, "CHF": 1.25, "JPY": 0.0066, "HKD": 0.1285,
    "CNY": 0.140, "KRW": 0.00070, "TWD": 0.031, "INR": 0.0113, "SGD": 0.77,
    "AUD": 0.65, "CAD": 0.72, "SEK": 0.105, "DKK": 0.155, "SAR": 0.2667,
}


def currencies():
    return sorted({cur.replace("GBp", "GBP") for _, cur in FOREIGN_LISTINGS.values()})


def fetch_rates(price_fn, pause=0.3, log=print):
    """Dollars per unit for every currency in use. price_fn(symbol) returns
    (price, error) for a Yahoo symbol, like fetch_prices.from_yahoo."""
    rates = {"USD": 1.0}
    for cur in currencies():
        fb = FALLBACK_USD[cur]
        got = None
        px, _ = price_fn(f"{cur}USD=X")
        if px and px > 0:
            got = float(px)
        else:
            px, _ = price_fn(f"USD{cur}=X")
            if px and px > 0:
                got = 1.0 / float(px)
        if got and 0.7 <= got / fb <= 1.3:
            rates[cur] = got
        else:
            rates[cur] = fb
            log(f"  exchange rate {cur}: {'no answer' if not got else f'{got:.6g} looks wrong'}, "
                f"using the fallback {fb}")
        time.sleep(pause)
    return rates


def to_usd(ticker, rates=None):
    """Multiplier from the home-exchange quote to US dollars."""
    _, cur = FOREIGN_LISTINGS[ticker]
    pence = cur == "GBp"
    cur = "GBP" if pence else cur
    r = (rates or FALLBACK_USD).get(cur, FALLBACK_USD[cur])
    return r / 100.0 if pence else r
