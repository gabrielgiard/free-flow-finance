"""Adversarial tests for the model recalibration engine.

The point is not to confirm it works on good data. The point is to feed it
every kind of broken, hostile and absurd input a live data feed can produce
and confirm that it either handles it or refuses it — but never silently
produces a nonsense valuation.

    python crash_test.py
"""

import json
import math
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
sys.path.insert(0, HERE)

PASS = []
FAIL = []


def check(name, condition, detail=""):
    (PASS if condition else FAIL).append(f"{name}{': ' + detail if detail else ''}")


def load_built():
    txt = open("docs/data.js").read()
    return json.loads(txt[len("const FF_DATA = "):].rstrip().rstrip(";"))


def write_fixtures(fund=None, tnx=None):
    """Write fundamentals.json and history.js, or remove them."""
    import time
    today = time.strftime("%Y-%m-%d")
    if fund is None:
        if os.path.exists("fundamentals.json"):
            os.remove("fundamentals.json")
    else:
        fund["_fetched_at"] = today + "T22:30:00Z"
        json.dump(fund, open("fundamentals.json", "w"))

    hist = {}
    import build
    for c in build.load_companies():
        hist[c["t"]] = {"from": "2025-08-08", "to": today,
                        "c": [round(c["price"], 2)] * 250}
    if tnx is not None:
        hist["^TNX"] = {"from": "2025-08-08", "to": today, "c": [tnx] * 250}
    hist["_meta"] = {"series": len(hist)}
    open("docs/history.js", "w").write(
        "var FF_HISTORY = " + json.dumps(hist, separators=(",", ":")) + ";\n")


def run_build():
    r = subprocess.run([sys.executable, "build.py"], capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def invariants(d, label):
    """Properties that must hold no matter what was fed in."""
    cs = d["companies"]
    for c in cs:
        t = c["t"]
        if any(math.isnan(x) or math.isinf(x)
               for x in (c["fv"], c["fv_bull"], c["fv_bear"], c["upside"])):
            check(f"{label}: {t} no NaN/Inf", False); return
        if c["fv_bear"] > c["fv"] + 1e-6 or c["fv"] > c["fv_bull"] + 1e-6:
            check(f"{label}: {t} scenario ordering", False,
                  f"{c['fv_bear']}/{c['fv']}/{c['fv_bull']}"); return
        if c["wacc"] <= c["tg"]:
            check(f"{label}: {t} wacc > terminal growth", False,
                  f"{c['wacc']} vs {c['tg']}"); return
        if len(c["growth"]) != 5:
            check(f"{label}: {t} growth path length", False, str(len(c["growth"]))); return
        if not (0.005 < c["wacc"] < 0.40):
            check(f"{label}: {t} wacc in sane range", False, str(c["wacc"])); return
        if c["m0"] > 0.95 or c["m1"] > 0.95:
            check(f"{label}: {t} margin below 95%", False,
                  f"m0={c['m0']} m1={c['m1']}"); return
        if abs(c["fv"]) > 1e6:
            check(f"{label}: {t} fair value magnitude", False, str(c["fv"])); return
    check(f"{label}: all invariants hold", True)


# ===================================================================
print("=" * 68)
print("CRASH TEST — model recalibration engine")
print("=" * 68)

import build
BASE = build.load_companies()
TICKS = [c["t"] for c in BASE]

# ---------- 1. no data at all --------------------------------------
print("\n[1] No fundamentals, no history")
write_fixtures(fund=None, tnx=None)
rc, out = run_build()
check("1 build succeeds", rc == 0, f"exit {rc}")
check("1 says WACC untouched", "left at stored values" in out or "No Treasury" in out)
invariants(load_built(), "1")

# ---------- 2. clean, realistic data --------------------------------
print("[2] Clean realistic data")
fund = {c["t"]: {"rev": c["rev"], "fcf": round(c["rev"] * c["m0"], 2),
                 "shares": c["shares"], "growth_ttm": c["growth"][0],
                 "growth_long": 0.05} for c in BASE}
write_fixtures(fund, tnx=43.1)
rc, out = run_build()
check("2 build succeeds", rc == 0, f"exit {rc}")
check("2 repriced WACCs", "repriced" in out)
invariants(load_built(), "2")

# ---------- 3. hostile numeric garbage ------------------------------
print("[3] Hostile values: negatives, zeros, absurd magnitudes, wrong types")
bad = {}
hostile = [0, -1, -999999, 1e12, 1e-12, 999.0, -0.0]
for i, c in enumerate(BASE):
    h = hostile[i % len(hostile)]
    bad[c["t"]] = {"rev": h, "fcf": h, "shares": h,
                   "growth_ttm": h, "growth_long": h, "netdebt": h}
write_fixtures(bad, tnx=43.1)
rc, out = run_build()
check("3 build survives hostile values", rc == 0, f"exit {rc}")
invariants(load_built(), "3")

# ---------- 4. wrong types entirely ---------------------------------
print("[4] Wrong types: strings, None, lists, dicts, booleans")
junk = {}
vals = ["abc", None, [], {}, True, False, "", "NaN", "Infinity"]
for i, c in enumerate(BASE):
    v = vals[i % len(vals)]
    junk[c["t"]] = {"rev": v, "fcf": v, "shares": v,
                    "growth_ttm": v, "growth_long": v}
write_fixtures(junk, tnx=43.1)
rc, out = run_build()
check("4 build survives wrong types", rc == 0, f"exit {rc}")
invariants(load_built(), "4")

# ---------- 5. extreme but type-valid growth ------------------------
print("[5] Extreme growth: -99%, +5000%, exactly 0")
ext = {}
for i, c in enumerate(BASE):
    g = [-0.99, 50.0, 0.0, -0.5, 2.5][i % 5]
    ext[c["t"]] = {"rev": c["rev"], "fcf": round(c["rev"] * c["m0"], 2),
                   "shares": c["shares"], "growth_ttm": g, "growth_long": g}
write_fixtures(ext, tnx=43.1)
rc, out = run_build()
check("5 build survives extreme growth", rc == 0, f"exit {rc}")
d = load_built()
worst = max(abs(c["growth"][0]) for c in d["companies"])
# growth is now either clamped to G1_MAX or discarded outright, and a
# discarded datum leaves the stored assumption in place — which may legitimately
# sit above G1_MAX. What must hold is that nothing absurd survives.
check("5 growth stays plausible", worst <= build.G1_REJECT_ABOVE + 1e-9,
      f"max |g1| = {worst}")
invariants(load_built(), "5")

# ---------- 6. rate shocks -------------------------------------------
print("[6] Interest rate shocks: 0%, 1%, 12%, 40%, negative")
for tnx, label in [(0.1, "0.01%"), (10.0, "1%"), (120.0, "12%"),
                   (400.0, "40%"), (-20.0, "negative")]:
    write_fixtures(fund, tnx=tnx)
    rc, out = run_build()
    check(f"6 build survives rf {label}", rc == 0, f"exit {rc}")
    invariants(load_built(), f"6 rf {label}")

# ---------- 7. margins at and beyond limits ---------------------------
print("[7] Margins: 0%, 100%, 150%, -80%")
for m, label in [(0.0, "0%"), (1.0, "100%"), (1.5, "150%"), (-0.8, "-80%")]:
    f = {c["t"]: {"rev": c["rev"], "fcf": round(c["rev"] * m, 2),
                  "shares": c["shares"], "growth_ttm": 0.05,
                  "growth_long": 0.04} for c in BASE}
    write_fixtures(f, tnx=43.1)
    rc, out = run_build()
    check(f"7 build survives margin {label}", rc == 0, f"exit {rc}")
    invariants(load_built(), f"7 margin {label}")

# ---------- 8. corrupt files ------------------------------------------
print("[8] Corrupt fundamentals.json and history.js")
open("fundamentals.json", "w").write("{{{ not json at all")
open("docs/history.js", "w").write("this is not javascript")
rc, out = run_build()
check("8 build survives corrupt files", rc == 0, f"exit {rc}")
invariants(load_built(), "8")

# ---------- 9. partial coverage ---------------------------------------
print("[9] Fundamentals for only a handful of companies")
partial = {t: {"rev": 100.0, "fcf": 20.0, "shares": 1.0,
               "growth_ttm": 0.10, "growth_long": 0.04}
           for t in TICKS[:5]}
write_fixtures(partial, tnx=43.1)
rc, out = run_build()
check("9 build survives partial data", rc == 0, f"exit {rc}")
invariants(load_built(), "9")

# ---------- 10. unknown tickers in the feed ---------------------------
print("[10] Feed contains companies that do not exist")
ghost = dict(fund)
for i in range(50):
    ghost[f"GHOST{i}"] = {"rev": 1.0, "fcf": 0.5, "shares": 1.0,
                          "growth_ttm": 0.9, "growth_long": 0.9}
write_fixtures(ghost, tnx=43.1)
rc, out = run_build()
check("10 build ignores unknown tickers", rc == 0, f"exit {rc}")
d = load_built()
check("10 no ghosts in output", not any("GHOST" in c["t"] for c in d["companies"]))
invariants(load_built(), "10")

# ---------- 11. repeated runs must converge ----------------------------
print("[11] Ten consecutive runs — values must not drift or explode")
write_fixtures(fund, tnx=43.1)
first = None
for i in range(10):
    rc, out = run_build()
    if rc != 0:
        check(f"11 run {i+1} succeeds", False, f"exit {rc}"); break
    d = load_built()
    fv = {c["t"]: c["fv"] for c in d["companies"]}
    if first is None:
        first = fv
    else:
        drift = max(abs(fv[t] - first[t]) for t in fv if t in first)
        if drift > 0.01:
            check("11 no drift across runs", False, f"max drift {drift}"); break
else:
    check("11 stable across ten runs", True)
    invariants(load_built(), "11")

# ---------- 12. every sector represented ------------------------------
print("[12] Sector medians with a single-company sector")
solo = {c["t"]: {"rev": c["rev"], "fcf": round(c["rev"] * c["m0"], 2),
                 "shares": c["shares"], "growth_ttm": 0.08,
                 "growth_long": 0.03} for c in BASE if c["sec"] == "telecom"}
write_fixtures(solo, tnx=43.1)
rc, out = run_build()
check("12 build survives sparse sectors", rc == 0, f"exit {rc}")
invariants(load_built(), "12")

# ---------- cleanup ----------------------------------------------------
for f in ("fundamentals.json", "docs/history.js"):
    if os.path.exists(f):
        os.remove(f)
subprocess.run([sys.executable, "build.py"], capture_output=True)

print("\n" + "=" * 68)
print(f"PASSED {len(PASS)}   FAILED {len(FAIL)}")
print("=" * 68)
for f in FAIL:
    print("  FAIL  " + f)
sys.exit(1 if FAIL else 0)
