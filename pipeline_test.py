"""Adversarial tests for the daily update pipeline. No network needed.

    python pipeline_test.py

Runs in a temporary copy of the repository, so nothing real is touched.
Covers the paths that caused stale prices before: dating quotes across
weekends and holidays, topping up charts when a source fails, corrupted or
old-format files, the freshness alarm, and the track record keeping its
history.
"""

import datetime as dt
import json
import os
import shutil
import subprocess
import sys
import tempfile

SRC = os.path.dirname(os.path.abspath(__file__))
PASS, FAIL = [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(f"  {'ok  ' if cond else 'FAIL'} {name}" + (f"  — {detail}" if detail and not cond else ""))


def section(t):
    print(f"\n[{t}]")


work = tempfile.mkdtemp(prefix="ff_pipeline_")
shutil.copytree(SRC, work, dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("__pycache__", ".git"))
os.chdir(work)
sys.path.insert(0, work)

import market_calendar as cal  # noqa: E402
import fetch_history as fh     # noqa: E402

NY = cal.NY
def ny(y, m, d, hh, mm=0):
    return dt.datetime(y, m, d, hh, mm, tzinfo=NY)


# ------------------------------------------------------------------------
section("1. Market calendar")
check("Wed 5:30pm -> that Wednesday", cal.last_close_date(ny(2026, 9, 30, 17, 30)) == dt.date(2026, 9, 30))
check("Wed 3pm (market open) -> Tuesday", cal.last_close_date(ny(2026, 9, 30, 15)) == dt.date(2026, 9, 29))
check("Saturday -> Friday", cal.last_close_date(ny(2026, 10, 3, 12)) == dt.date(2026, 10, 2))
check("Monday 8am -> previous Friday", cal.last_close_date(ny(2026, 10, 5, 8)) == dt.date(2026, 10, 2))
check("Thanksgiving evening -> Wednesday", cal.last_close_date(ny(2026, 11, 26, 20)) == dt.date(2026, 11, 25))
check("Day after Labor Day 8am -> Friday before", cal.last_close_date(ny(2026, 9, 8, 8)) == dt.date(2026, 9, 4))
check("quote Saturday -> dated Friday", cal.quote_date(ny(2026, 10, 3, 10)) == dt.date(2026, 10, 2))
check("quote Monday 11am (intraday) -> Monday", cal.quote_date(ny(2026, 10, 5, 11)) == dt.date(2026, 10, 5))
check("quote on Christmas -> Dec 24", cal.quote_date(ny(2026, 12, 25, 18)) == dt.date(2026, 12, 24))
check("sessions Fri->Mon = 1", cal.trading_days_between(dt.date(2026, 10, 2), dt.date(2026, 10, 5)) == 1)
check("sessions across Thanksgiving = 1", cal.trading_days_between(dt.date(2026, 11, 25), dt.date(2026, 11, 27)) == 1)
check("ahead counts as 0", cal.trading_days_between(dt.date(2026, 10, 5), dt.date(2026, 10, 2)) == 0)
check("bad ISO -> None", cal.parse_iso("yesterday") is None and cal.parse_iso(None) is None)


# ------------------------------------------------------------------------
section("2. Series encode / decode")
dates = ["2026-09-24", "2026-09-25", "2026-09-28", "2026-09-29", "2026-09-30"]
vals = [10.0, 10.5, 10.25, 10.75, 11.0]
enc = fh.encode(dates, vals)
check("encode stores real day offsets", enc["d"] == [0, 1, 4, 5, 6] and enc["to"] == "2026-09-30")
check("decode round-trips", fh.decode(enc) == (dates, vals))
old_fmt = {"from": "2026-09-24", "to": "2026-09-30", "c": vals}
d2, v2 = fh.decode(old_fmt)
check("old format without 'd' rebuilds trading dates", d2 == dates and v2 == vals, d2)
bad_d = dict(enc, d=[0, 1, 2])
check("wrong-length 'd' falls back instead of crashing", fh.decode(bad_d)[1] == vals)
check("garbage entry decodes to empty", fh.decode({"c": "nope"}) == ([], []) and fh.decode(None) == ([], []))
d3, v3 = fh._clean(["2026-09-30", "2026-09-29", "2026-09-30", "bad", "2026-09-28", "2026-09-27"],
                   [5, 4, 6, 9, True, float("nan")])
check("clean: sorts, de-dupes (last wins), drops junk/bool/NaN", d3 == ["2026-09-29", "2026-09-30"] and v3 == [4.0, 6.0], (d3, v3))


# ------------------------------------------------------------------------
section("3. Quote top-up")
def run_topup(hist, quotes):
    json.dump(quotes, open("prices.json", "w"))
    n = fh.top_up_from_quotes(hist)
    return n, hist

last = cal.last_close_date()
lastiso = last.isoformat()
prev = cal.prev_trading_day(last)
fetched = dt.datetime.combine(last, dt.time(17, 30), tzinfo=NY).astimezone(dt.timezone.utc)
stamp = fetched.strftime("%Y-%m-%dT%H:%M:%SZ")

h = {"AAA": fh.encode([prev.isoformat()], [100.0]),
     "BBB": fh.encode([prev.isoformat(), lastiso], [50.0, 51.0])}
n, h = run_topup(h, {"AAA": 101.5, "BBB": 99.0, "CCC": 7.0, "_fetched_at": stamp})
check("appends today's quote to a chart missing today", h["AAA"]["c"][-1] == 101.5 and h["AAA"]["to"] == lastiso)
check("leaves a chart that already has today alone", h["BBB"]["c"][-1] == 51.0)
check("starts a chart for a ticker with none", h["CCC"]["c"] == [7.0])
check("reports how many it added", n == 2, n)

n, h2 = run_topup({"AAA": fh.encode([prev.isoformat()], [100.0])},
                  {"AAA": True, "_fetched_at": stamp})
check("boolean quote ignored", n == 0)
n, _ = run_topup({}, {"AAA": "12.5", "BBB": -3, "CCC": 0, "_fetched_at": stamp})
check("string / negative / zero quotes ignored", n == 0)
n, _ = run_topup({}, {"AAA": 10.0, "_fetched_at": "2026-01-02T21:00:00Z"})
check("quote from an old day is not stamped as today", n == 0)
n, _ = run_topup({}, {"AAA": 10.0})
check("no _fetched_at -> no top-up", n == 0)
open("prices.json", "w").write("{corrupt")
check("corrupt prices.json -> no crash", fh.top_up_from_quotes({}) == 0)
open("prices.json", "w").write("[1,2,3]")
check("prices.json not a dict -> no crash", fh.top_up_from_quotes({}) == 0)


# ------------------------------------------------------------------------
section("4. History file robustness")
open(fh.HISTORY_PATH, "w").write("var FF_HISTORY = {\"AAPL\": {\"from\"")   # truncated
check("truncated history.js loads as empty", fh.load_history() == {})
open(fh.HISTORY_PATH, "w").write("[]")
check("wrong prefix loads as empty", fh.load_history() == {})
open(fh.HISTORY_PATH, "w").write("var FF_HISTORY = [1,2];\n")
check("history that is not an object loads as empty", fh.load_history() == {})
h = {"AAA": fh.encode(dates, vals)}
check("save writes a fresh file", fh.save_history(h, {}) is True)
check("save skips identical data", fh.save_history(h, fh.load_history()) is False)
check("no leftover temp file", not os.path.exists(fh.HISTORY_PATH + ".tmp"))


# ------------------------------------------------------------------------
section("5. build.py: prices, dates, ^TNX, track record")
import build  # noqa: E402

def write_hist(series):
    out = dict(series)
    with open(os.path.join("docs", "history.js"), "w") as f:
        f.write("var FF_HISTORY = " + json.dumps(out) + ";\n")

companies = [{"t": "AAA", "price": 1.0}, {"t": "BBB", "price": 2.0}, {"t": "CCC", "price": 3.0}]
write_hist({"AAA": fh.encode([prev.isoformat(), lastiso], [10.0, 11.0]),
            "BBB": fh.encode(["2025-01-02", "2025-01-03"], [5.0, 6.0])})        # BBB stale
json.dump({"BBB": 7.5, "_fetched_at": stamp}, open("prices.json", "w"))
build.apply_live_prices(companies)
a, b_, c_ = companies
check("price = chart's last close", a["price"] == 11.0 and a["pd"] == lastiso)
check("stale chart skipped, fresh quote used", b_["price"] == 7.5 and b_["pd"] == stamp[:10])
check("nothing available -> estimate kept, no date", c_["price"] == 3.0 and c_["pd"] is None)
check("price/chart agreement check passes", build.check_price_chart_agreement(companies) == [])

meta = {}
build.stamp_date(meta, [{"pd": lastiso}, {"pd": lastiso}, {"pd": prev.isoformat()}, {"pd": None}])
check("site date = most common price date", meta["price_date"] == lastiso and meta["price_lag"] == 0)
meta = {}
build.stamp_date(meta, [{"pd": None}])
check("no market prices -> flagged stale", meta["price_lag"] >= 1 and meta["price_date"] is None)

for raw, want in ((41.2, 0.0412), (4.12, 0.0412), (0.3, None), (500, None), (True, None)):
    write_hist({"^TNX": {"from": lastiso, "to": lastiso, "c": [raw]}})
    got = build.current_risk_free()
    ok = (got is None and want is None) or (got is not None and want is not None and abs(got - want) < 1e-9)
    check(f"^TNX {raw!r} -> {want}", ok, got)

# Track record must accumulate, not overwrite.
tr = build.TRACK_RECORD_PATH
with open(tr, "w") as f:
    f.write('var FF_TRACK_RECORD = [{"date":"2026-09-01","ticker":"OLD","from":"Buy","to":"Hold"}];\n')
old_data = os.path.join(work, "old_data.js")
with open(old_data, "w") as f:
    f.write("const FF_DATA = " + json.dumps({"companies": [
        {"t": "AAA", "rating": "Buy", "price": 10.0}]}) + ";\n")
build.log_rating_changes(old_data, [{"t": "AAA", "n": "Aaa", "rating": "Sell", "price": 20.0, "fv": 5.0}])
text = open(tr).read()
log = json.loads(text[len("var FF_TRACK_RECORD = "):].rstrip().rstrip(";\n"))
check("track record keeps old entries and adds new", [e["ticker"] for e in log] == ["OLD", "AAA"], log)


# ------------------------------------------------------------------------
section("6. Freshness alarm")
import check_freshness as cf  # noqa: E402

def write_data(meta):
    with open(cf.DATA_PATH, "w") as f:
        f.write("const FF_DATA = " + json.dumps({"companies": [], "meta": meta}) + ";\n")

def alarm(*args):
    r = subprocess.run([sys.executable, "check_freshness.py", *args], capture_output=True, text=True)
    return r.returncode, r.stdout

write_data({"price_date": lastiso})
check("current site passes strict check", alarm("--fail-behind", "1")[0] == 0)
write_data({"price_date": prev.isoformat()})
check("one session behind fails strict check", alarm("--fail-behind", "1")[0] == 1)
check("one session behind passes lenient check", alarm("--fail-behind", "2")[0] == 0)
write_data({"price_date": "2026-08-24"})
check("weeks behind fails lenient check", alarm("--fail-behind", "2")[0] == 1)
check("report-only mode never fails", alarm()[0] == 0)
os.remove(cf.DATA_PATH)
for p in ("docs/history.js",):
    if os.path.exists(p):
        os.remove(p)
check("no data at all fails the check", alarm("--fail-behind", "1")[0] == 1)
open(cf.DATA_PATH, "w").write("const FF_DATA = {broken")
check("corrupt data.js fails the check, no crash", alarm("--fail-behind", "1")[0] == 1)

gh_out = os.path.join(work, "gh_out.txt")
write_data({"price_date": lastiso})
env = dict(os.environ, GITHUB_OUTPUT=gh_out)
subprocess.run([sys.executable, "check_freshness.py", "--github-output"], env=env, capture_output=True)
check("writes fresh=true for the workflow", "fresh=true" in open(gh_out).read())


# ------------------------------------------------------------------------
shutil.rmtree(work, ignore_errors=True)
print("\n" + "=" * 68)
print(f"PASSED {len(PASS)}   FAILED {len(FAIL)}")
if FAIL:
    print("Failed: " + "; ".join(FAIL))
print("=" * 68)
sys.exit(1 if FAIL else 0)
