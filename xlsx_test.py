"""Checks for the downloadable Excel model (docs/xlsx.js).

    python3 xlsx_test.py            # a spread of 24 companies, all three scenarios
    python3 xlsx_test.py --all      # every company, base case

The workbook must reproduce the website's numbers with live formulas, so this
builds real .xlsx files with the same builder the browser uses, recalculates
them in LibreOffice (the files ship without cached values, as a browser-made
file would), reads every computed cell back, and compares it with the Python
engine that produces the site:

  base, bear and bull value per share     = engine.dcf() for each scenario
  sensitivity table 1 (WACC x growth)     = engine.grid(), the grid on the page
  sensitivity table 2 (growth x margin)   = engine.dcf() with the shifts
  sensitivity table 3 (beta x Rf, CAPM)   = engine.dcf() at the CAPM rate
  centre of tables 1 and 2                = the model's own value
  comps statistics                         = Python's own quartiles
  no cell anywhere holds an Excel error

It also runs the DCF skill's own validator over a sample of the files.

Needs node with exceljs installed, and LibreOffice (soffice). Without them it
says so and skips, rather than failing.
"""

import json, os, shutil, subprocess, sys, tempfile, statistics

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import engine  # noqa: E402

SCRATCH_MODULES = os.environ.get("FF_NODE_MODULES", "")
passed = failed = 0


def check(name, ok, detail=""):
    global passed, failed
    if ok:
        passed += 1
        print(f"  ok    {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}  -> {detail}")


def load_data():
    raw = open(os.path.join(HERE, "docs", "data.js")).read()
    return json.loads(raw[raw.index("{"):].strip().rstrip(";"))


def have_tools():
    if not shutil.which("soffice"):
        return "LibreOffice (soffice) not installed"
    env = dict(os.environ, NODE_PATH=SCRATCH_MODULES)
    r = subprocess.run(["node", "-e", "require('exceljs')"], env=env, capture_output=True)
    if r.returncode:
        return "node package exceljs not installed (set FF_NODE_MODULES)"
    return None


GEN = r"""
const fs = require('fs'), path = require('path');
const ExcelJS = require('exceljs');
const X = require(process.argv[2]);
const jobs = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
(async () => {
  for (const j of jobs) {
    const wb = X.build(ExcelJS, j.c, j.peers, { scenario: j.scenario, rate: j.rate, date: '2026-11-15', sectorName: j.sectorName });
    await wb.xlsx.writeFile(j.out);
  }
})().catch(e => { console.error(e); process.exit(1); });
"""


def build_files(jobs, tmp):
    spec = os.path.join(tmp, "jobs.json")
    json.dump(jobs, open(spec, "w"))
    gen = os.path.join(tmp, "gen.js")
    open(gen, "w").write(GEN)
    env = dict(os.environ, NODE_PATH=SCRATCH_MODULES)
    subprocess.run(["node", gen, os.path.join(HERE, "docs", "xlsx.js"), spec], env=env, check=True)


def recalc(files, outdir):
    """Open each file in LibreOffice, recalculate, save a copy with values."""
    os.makedirs(outdir, exist_ok=True)
    for i in range(0, len(files), 40):
        batch = files[i:i + 40]
        subprocess.run(["soffice", "--headless", "--calc", "--convert-to", "xlsx", "--outdir", outdir, *batch],
                       capture_output=True, timeout=600)


def near(a, b, tol=0.011, rel=0.0005):
    if a is None or b is None:
        return False
    return abs(a - b) <= max(tol, rel * abs(b))


def cap_wacc(c, beta, rf, erp=0.055, spread=0.015, tax=0.21):
    mc = c["price"] * c["shares"]
    nd = max(c["netdebt"], 0)
    we, wd = mc / (mc + nd), nd / (mc + nd)
    return we * (rf + beta * erp) + wd * (rf + spread) * (1 - tax)


def main():
    why = have_tools()
    if why:
        print(f"xlsx_test: skipped, {why}")
        return 0
    import openpyxl
    data = load_data()
    cos = data["companies"]
    by = {c["t"]: c for c in cos}
    secname = {s["k"]: s["n"] for s in data["sectors"]}
    every = "--all" in sys.argv
    if every:
        picks = [c["t"] for c in cos]
    else:
        picks = ["NVDA", "AAPL", "JPM", "KO", "C", "PGR", "SOFI", "XOM", "TSLA", "MSTR", "IONQ", "RIVN", "ENB", "CRM", "BRK.B",
                 "SNDK", "CBRS", "QBTS", "MUFG", "DAL", "GRAB", "005930", "LLY", "MRNA", "TGT", "BE", "JOBY"]
        picks = [t for t in picks if t in by]
    tmp = tempfile.mkdtemp(prefix="ffxl_")
    jobs = []
    for t in picks:
        c = by[t]
        peers = [by[p] for p in c.get("peers", []) if p in by]
        scen = (2,) if every else (1, 2, 3)
        for s in scen:
            jobs.append({"c": c, "peers": peers, "scenario": s, "rate": 1, "sectorName": secname.get(c["sec"], c["sec"]),
                         "out": os.path.join(tmp, f"{t.replace('.', '_')}_{s}.xlsx")})
        if not every:
            jobs.append({"c": c, "peers": peers, "scenario": 2, "rate": 2, "sectorName": secname.get(c["sec"], c["sec"]),
                         "out": os.path.join(tmp, f"{t.replace('.', '_')}_capm.xlsx")})
    print(f"building {len(jobs)} workbooks …")
    build_files(jobs, tmp)
    out = os.path.join(tmp, "calc")
    recalc([j["out"] for j in jobs], out)

    errs_total, worst = 0, 0.0
    for j in jobs:
        c, s = j["c"], j["scenario"]
        f = os.path.join(out, os.path.basename(j["out"]))
        tag = f"{c['t']} {['', 'bear', 'base', 'bull'][s]}{' capm' if j['rate'] == 2 else ''}"
        if not os.path.exists(f):
            check(f"{tag}: LibreOffice produced a recalculated file", False, f)
            continue
        wb = openpyxl.load_workbook(f, data_only=True)
        d, w = wb["DCF"], wb["WACC"]
        # 1. no Excel errors anywhere
        bad = [f"{ws.title}!{cell.coordinate}={cell.value}" for ws in wb.worksheets for row in ws.iter_rows() for cell in row
               if isinstance(cell.value, str) and cell.value.startswith("#") and cell.value.rstrip("!?0/A").startswith(("#REF", "#DIV", "#VALUE", "#NAME", "#NUM", "#N", "#NULL", "Err"))]
        errs_total += len(bad)
        if bad:
            check(f"{tag}: no formula errors", False, bad[:5])
        # 2b. banks and insurers: the Bank model sheet is the headline model
        if c.get("ri") and j["rate"] == 1:
            bm = wb["Bank model"]
            r = c["ri"]
            ke, tg = c["wacc"], c["tg"]
            args = {1: (r["roe1"] - 0.02, ke + 0.005, max(tg - 0.005, 0)), 2: (r["roe1"], ke, tg),
                    3: (r["roe1"] + 0.02, ke - 0.005, min(tg + 0.0025, ke - 0.01))}[s]
            want_ri = engine.excess_return(r["bv"], r["roe0"], args[0], args[1], args[2], r["pay"], c["shares"])["per_share"]
            got_ri = bm["B43"].value
            check(f"{tag}: bank model value per share = engine", near(got_ri, want_ri), (got_ri, want_ri))
            if s == 2:
                check(f"{tag}: bank model = the website's published value", near(got_ri, c["fv"], 0.006), (got_ri, c["fv"]))
                check(f"{tag}: bank model check cell reads zero", isinstance(bm["C49"].value, (int, float)) and abs(bm["C49"].value) < 0.006, bm["C49"].value)
                gv = [[bm.cell(row=54 + i, column=3 + k).value for k in range(5)] for i in range(5)]
                dd = [abs(gv[i][k] - c["erm"]["grid"]["values"][i][k]) for i in range(5) for k in range(5) if isinstance(gv[i][k], (int, float))]
                check(f"{tag}: bank sensitivity = the page's grid, all 25 cells", len(dd) == 25 and max(dd) <= max(0.011, 0.0005 * abs(c["fv"])), max(dd) if dd else None)
        # 2. the headline value
        ci = {1: "bear", 2: "base", 3: "bull"}[s]
        inp = {
            "bear": (([g - 0.03 for g in c["growth"]]), min(c["m1"], max(c["m1"] - 0.02, 0)), c["wacc"] + 0.005, max(c["tg"] - 0.005, 0)),
            "base": (c["growth"], c["m1"], c["wacc"], c["tg"]),
            "bull": ([g + 0.03 for g in c["growth"]], c["m1"] + 0.02, c["wacc"] - 0.005, min(c["tg"] + 0.0025, c["wacc"] - 0.01)),
        }[ci]
        if j["rate"] == 2:
            beta = w["B6"].value
            want_w = cap_wacc(c, beta, 0.0515)
            check(f"{tag}: CAPM rate matches the formula", near(w["B23"].value, want_w, 1e-6), (w["B23"].value, want_w))
            check(f"{tag}: the default beta reproduces the FreeFlow rate (within rounding)", abs(want_w - c["wacc"]) < 0.0012, (want_w, c["wacc"]))
            inp = (inp[0], inp[1], want_w, inp[3])
        want = engine.dcf(c["rev"], inp[0], c["m0"], inp[1], inp[2], inp[3], c["netdebt"], c["shares"])["per_share"]
        got = d["B74"].value
        worst = max(worst, abs((got or 0) - want))
        check(f"{tag}: value per share {got:.2f} = engine {want:.2f}" if isinstance(got, (int, float)) else f"{tag}: value per share", near(got, want), (got, want))
        if s == 2 and j["rate"] == 1:
            site = c["cf"]["fv"] if c.get("cf") else c["fv"]
            check(f"{tag}: matches the website's published value", near(got, site, 0.006), (got, site))
            check(f"{tag}: the check cell reads zero", isinstance(d["C79"].value, (int, float)) and abs(d["C79"].value) < 0.006, d["C79"].value)
            tvs = d["B78"].value
            if c["dcf"]["ev"] > 0:
                check(f"{tag}: terminal value share = site's", near(tvs, c["dcf"]["tv_share"], 0.0006), (tvs, c["dcf"]["tv_share"]))
            # 3. sensitivity table 1 equals the grid on the page, cell for cell
            g1 = [[d.cell(row=85 + i, column=3 + k).value for k in range(5)] for i in range(5)]
            diffs = [abs(g1[i][k] - c["grid"]["values"][i][k]) for i in range(5) for k in range(5) if isinstance(g1[i][k], (int, float))]
            check(f"{tag}: table 1 (WACC x growth) = the page's grid, all 25 cells", len(diffs) == 25 and max(diffs) <= max(0.011, 0.0005 * abs(c['fv'])), (max(diffs) if diffs else None))
            check(f"{tag}: table 1 centre = the model value", near(g1[2][2], got), (g1[2][2], got))
            # 4. table 2 (growth shift x margin) against the engine
            bad2 = []
            for i, dg in enumerate((-0.04, -0.02, 0, 0.02, 0.04)):
                for k, dm in enumerate((-0.04, -0.02, 0, 0.02, 0.04)):
                    e = engine.dcf(c["rev"], [g + dg for g in c["growth"]], c["m0"], c["m1"] + dm, c["wacc"], c["tg"], c["netdebt"], c["shares"])["per_share"]
                    v = d.cell(row=94 + i, column=3 + k).value
                    if not near(v, e):
                        bad2.append((dg, dm, v, round(e, 2)))
            check(f"{tag}: table 2 (growth x margin), all 25 cells recompute the DCF", not bad2, bad2[:3])
            check(f"{tag}: table 2 centre = the model value", near(d["E96"].value, got), (d["E96"].value, got))
            # 5. table 3 (beta x Rf) against the engine at the CAPM rate
            beta0 = w["B6"].value
            bad3 = []
            for i, db in enumerate((-0.4, -0.2, 0, 0.2, 0.4)):
                for k, dr in enumerate((-0.01, -0.005, 0, 0.005, 0.01)):
                    ww = cap_wacc(c, beta0 + db, 0.0515 + dr)
                    e = engine.dcf(c["rev"], c["growth"], c["m0"], c["m1"], ww, c["tg"], c["netdebt"], c["shares"])["per_share"]
                    v = d.cell(row=103 + i, column=3 + k).value
                    if not near(v, e):
                        bad3.append((db, dr, v, round(e, 2)))
            check(f"{tag}: table 3 (beta x risk-free), all 25 cells recompute the DCF", not bad3, bad3[:3])
            # 6. comps statistics
            cp = wb["Comps"]
            peers = [by[p] for p in c.get("peers", []) if p in by]
            if len(peers) >= 2:
                n = 1 + len(peers)
                med_row = 7 + n - 1 + 2 + 2
                got_med = cp.cell(row=med_row, column=5).value
                check(f"{tag}: comps median FCF margin = Python median", near(got_med, statistics.median(p["m0"] for p in peers), 1e-9), (got_med,))
    check(f"no formula errors in any workbook ({len(jobs)} files)", errs_total == 0, errs_total)
    print(f"  largest gap to the engine: ${worst:.4f}")

    # the DCF skill's validator, on a few recalculated base-case files
    val = os.path.join(os.path.expanduser("~"), ".claude", "plugins")
    script = None
    for root, _, files in os.walk(val):
        if "validate_dcf.py" in files:
            script = os.path.join(root, "validate_dcf.py")
            break
    if script:
        sample = [os.path.join(out, os.path.basename(j["out"])) for j in jobs if j["scenario"] == 2 and j["rate"] == 1][:6]
        for f in sample:
            r = subprocess.run([sys.executable, script, f], capture_output=True, text=True)
            txt = r.stdout + r.stderr
            check(f"skill validator passes {os.path.basename(f)}", "FAIL" not in txt.upper().split("STATUS")[-1][:20] and r.returncode == 0, txt[-400:])
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
