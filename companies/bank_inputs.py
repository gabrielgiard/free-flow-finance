"""Inputs for the excess-return model (banks and insurers).

For these companies the headline fair value comes from book value and
return on equity instead of a cash-flow DCF (see engine.excess_return). Each
entry:

  bv    common shareholders' equity, $ billions (US dollars; preferred
        shares and other equity instruments left out)
  roe0  return on that equity over the last twelve months
  roe1  the return we expect the business to sustain from year 5 on
  pay   share of profit handed back each year, dividends plus buybacks

The cost of equity is the company's discount rate in companies/*.py, and
moves with the 10-year Treasury yield like every other discount rate.

These are analyst estimates rounded to sensible precision, from the latest
annual and quarterly reports, converted to dollars at recent exchange rates.
Update bv and roe0 when results come out; roe1 and pay are judgement calls.
"""

BANK = {
    # ----------------------------------------------------- US banks ---
    "JPM":  dict(kind="bank", bv=345.0, roe0=0.180, roe1=0.170, pay=0.65),
    "BAC":  dict(kind="bank", bv=275.0, roe0=0.110, roe1=0.125, pay=0.75),
    "WFC":  dict(kind="bank", bv=162.0, roe0=0.130, roe1=0.150, pay=0.85),
    "C":    dict(kind="bank", bv=190.0, roe0=0.075, roe1=0.100, pay=0.80),
    "GS":   dict(kind="bank", bv=113.0, roe0=0.150, roe1=0.150, pay=0.70),
    "MS":   dict(kind="bank", bv=100.0, roe0=0.180, roe1=0.170, pay=0.75),
    "PNC":  dict(kind="bank", bv=54.0,  roe0=0.110, roe1=0.120, pay=0.60),
    "USB":  dict(kind="bank", bv=56.0,  roe0=0.115, roe1=0.130, pay=0.55),
    "TFC":  dict(kind="bank", bv=57.0,  roe0=0.080, roe1=0.095, pay=0.90),
    "COF":  dict(kind="bank", bv=108.0, roe0=0.080, roe1=0.120, pay=0.60),
    "BK":   dict(kind="bank", bv=39.0,  roe0=0.130, roe1=0.135, pay=0.85),
    "SCHW": dict(kind="bank", bv=41.0,  roe0=0.190, roe1=0.210, pay=0.75),
    "AXP":  dict(kind="bank", bv=33.0,  roe0=0.330, roe1=0.310, pay=0.70),
    "SOFI": dict(kind="bank", bv=10.0,  roe0=0.050, roe1=0.140, pay=0.00),
    # ------------------------------------------- banks outside the US ---
    "HSBC": dict(kind="bank", bv=168.0, roe0=0.120, roe1=0.130, pay=0.85),
    "RY":   dict(kind="bank", bv=92.0,  roe0=0.160, roe1=0.160, pay=0.60),
    "TD":   dict(kind="bank", bv=76.0,  roe0=0.130, roe1=0.135, pay=0.60),
    "SAN":  dict(kind="bank", bv=110.0, roe0=0.130, roe1=0.140, pay=0.50),
    "BBVA": dict(kind="bank", bv=70.0,  roe0=0.185, roe1=0.170, pay=0.60),
    "UBS":  dict(kind="bank", bv=89.0,  roe0=0.085, roe1=0.120, pay=0.80),
    "MUFG": dict(kind="bank", bv=135.0, roe0=0.100, roe1=0.110, pay=0.55),
    "SMFG": dict(kind="bank", bv=100.0, roe0=0.095, roe1=0.105, pay=0.55),
    "ITUB": dict(kind="bank", bv=39.0,  roe0=0.225, roe1=0.200, pay=0.60),
    "HDB":  dict(kind="bank", bv=63.0,  roe0=0.150, roe1=0.160, pay=0.25),
    "IBN":  dict(kind="bank", bv=38.0,  roe0=0.180, roe1=0.170, pay=0.15),
    "NU":   dict(kind="bank", bv=10.5,  roe0=0.280, roe1=0.270, pay=0.00),
    # ------------------------------- added with 100 global companies ---
    "ING":  dict(kind="bank", bv=58.0,  roe0=0.125, roe1=0.130, pay=0.85),
    "BCS":  dict(kind="bank", bv=80.0,  roe0=0.105, roe1=0.120, pay=0.60),
    "LYG":  dict(kind="bank", bv=57.0,  roe0=0.110, roe1=0.125, pay=0.75),
    "NWG":  dict(kind="bank", bv=49.0,  roe0=0.140, roe1=0.140, pay=0.70),
    "DB":   dict(kind="bank", bv=77.0,  roe0=0.090, roe1=0.100, pay=0.60),
    "MFG":  dict(kind="bank", bv=73.0,  roe0=0.100, roe1=0.100, pay=0.55),
    "KB":   dict(kind="bank", bv=42.0,  roe0=0.100, roe1=0.100, pay=0.50),
    "SHG":  dict(kind="bank", bv=40.0,  roe0=0.090, roe1=0.095, pay=0.50),
    "BMO":  dict(kind="bank", bv=58.0,  roe0=0.110, roe1=0.120, pay=0.70),
    "BNS":  dict(kind="bank", bv=52.0,  roe0=0.110, roe1=0.120, pay=0.70),
    "BNP":  dict(kind="bank", bv=116.0, roe0=0.100, roe1=0.105, pay=0.60),
    "UCG":  dict(kind="bank", bv=72.0,  roe0=0.170, roe1=0.155, pay=0.90),
    "D05":  dict(kind="bank", bv=48.0,  roe0=0.170, roe1=0.155, pay=0.65),
    "CBA":  dict(kind="bank", bv=47.5,  roe0=0.135, roe1=0.135, pay=0.80),
    "1398": dict(kind="bank", bv=504.0, roe0=0.095, roe1=0.085, pay=0.30),
    "CS":   dict(kind="insurer", bv=57.0,  roe0=0.150, roe1=0.155, pay=0.75),
    "ALV":  dict(kind="insurer", bv=72.0,  roe0=0.170, roe1=0.165, pay=0.75),
    "MUV2": dict(kind="insurer", bv=35.0,  roe0=0.190, roe1=0.170, pay=0.70),
    "ZURN": dict(kind="insurer", bv=28.0,  roe0=0.230, roe1=0.210, pay=0.85),
    "PUK":  dict(kind="insurer", bv=17.5,  roe0=0.140, roe1=0.150, pay=0.55),
    "SLF":  dict(kind="insurer", bv=17.3,  roe0=0.170, roe1=0.170, pay=0.65),
    "1299": dict(kind="insurer", bv=42.0,  roe0=0.150, roe1=0.150, pay=0.70),
    "2318": dict(kind="insurer", bv=130.0, roe0=0.130, roe1=0.120, pay=0.45),
    "8766": dict(kind="insurer", bv=47.0,  roe0=0.150, roe1=0.130, pay=0.65),
    # ------------------------------------------------------- insurers ---
    "BRK.B": dict(kind="insurer", bv=680.0, roe0=0.100, roe1=0.090, pay=0.00),
    "PGR":  dict(kind="insurer", bv=30.0,  roe0=0.300, roe1=0.240, pay=0.45),
    "CB":   dict(kind="insurer", bv=70.0,  roe0=0.130, roe1=0.120, pay=0.35),
    "TRV":  dict(kind="insurer", bv=31.0,  roe0=0.170, roe1=0.150, pay=0.60),
    "ALL":  dict(kind="insurer", bv=25.0,  roe0=0.240, roe1=0.170, pay=0.40),
    "AIG":  dict(kind="insurer", bv=41.0,  roe0=0.075, roe1=0.100, pay=0.90),
    "MET":  dict(kind="insurer", bv=27.0,  roe0=0.150, roe1=0.150, pay=0.70),
    "AFL":  dict(kind="insurer", bv=27.0,  roe0=0.140, roe1=0.130, pay=0.75),
    "MFC":  dict(kind="insurer", bv=34.0,  roe0=0.160, roe1=0.160, pay=0.60),
}
