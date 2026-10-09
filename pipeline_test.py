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

# ------------------------------------------------------------------------
section("0. Every script the workflow runs can start")
# fetch_fundamentals.py once imported names that fetch_prices.py no longer
# had. It crashed on every run for weeks and nobody saw, because the workflow
# swallowed the error. Importing each script here catches that class of bug.
import importlib  # noqa: E402
for mod in ("market_calendar", "fetch_prices", "fetch_history", "fetch_fundamentals",
            "build", "check_freshness", "seo_pages", "engine", "og_cards"):
    try:
        importlib.import_module(mod)
        check(f"{mod}.py imports", True)
    except Exception as e:
        check(f"{mod}.py imports", False, f"{type(e).__name__}: {e}")
r = subprocess.run([sys.executable, "fetch_fundamentals.py"], capture_output=True, text=True,
                   env={k: v for k, v in os.environ.items() if k != "FINNHUB_API_KEY"})
check("fetch_fundamentals.py runs with no key", r.returncode == 0, r.stderr[-200:])

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
section("5b. Fundamentals guards (ADR share counts, net debt)")
# TSMC: the feed returned 25.9bn Taiwan shares while the price is per ADR
# (1 ADR = 5 shares). That made the fair value 5x too low on the live site.
def run_fund(companies, fund, hist):
    json.dump(fund, open("fundamentals.json", "w"))
    write_hist(hist)
    build.apply_fundamentals(companies)
    return companies

h_px = lambda px: fh.encode([lastiso], [px])
from build import load_companies as _lc  # noqa: E402
lib_pre = {c["t"]: c for c in _lc()}
cos = [
    {"t": "TSM",  "sec": "semis",      "price": 380.0, "shares": 5.19, "netdebt": -55.0, "rev": 145.0},
    {"t": "BABA", "sec": "global",     "price": 140.0, "shares": 2.35, "netdebt": -25.0, "rev": 140.0},
    {"t": "AAPL", "sec": "software",   "price": 250.0, "shares": 15.0, "netdebt": 0.0,   "rev": 400.0},
    {"t": "JPM",  "sec": "financials", "price": 300.0, "shares": 2.80, "netdebt": 0.0,   "rev": 170.0},
    {"t": "XOM",  "sec": "energy",     "price": 110.0, "shares": 4.30, "netdebt": 30.0,  "rev": 340.0},
    {"t": "NVDA", "sec": "semis",      "price": 195.0, "shares": 24.4, "netdebt": -50.0, "rev": 213.0},
    {"t": "BKNG", "sec": "software",   "price": 5400.0, "shares": 0.032, "netdebt": 10.0, "rev": 24.5},
]
fund = {
    "TSM":  {"shares": 25.93, "mcap": 2365.0, "rev": 148.8, "netdebt": -60.0},  # ADR mismatch, mcap known
    "BABA": {"shares": 18.80, "rev": 135.0},                                    # 8x, no mcap
    "AAPL": {"shares": 14.6, "mcap": 3650.0, "rev": 410.0, "netdebt": 5.0},     # normal buyback
    "JPM":  {"shares": 2.75, "netdebt": 380.0},                                 # bank: keep zero
    "XOM":  {"netdebt": 400.0},                                                 # impossible swing
    "NVDA": {"netdebt": 222.0, "shares": 24.2},                                 # EV-minus-mcap noise
    "BKNG": {"shares": 0.81},                                                   # 25-for-1 split
    "_fetched_at": stamp,
}
hist5 = {"TSM": h_px(456.0), "BABA": h_px(107.0), "AAPL": h_px(250.0),
         "JPM": h_px(300.0), "XOM": h_px(110.0), "NVDA": h_px(228.0), "BKNG": h_px(161.0)}
res = {c["t"]: c for c in run_fund([dict(c) for c in cos], fund, hist5)}
check("ADR share count re-based to market cap / price (TSM ~5.19bn)", abs(res["TSM"]["shares"] - 2365 / 456) < 0.01,
      res["TSM"]["shares"])
check("ADR's revenue still applied (it's a correct total)", res["TSM"]["rev"] == 148.8)
check("8x share jump with no market cap rejected (BABA keeps 2.35bn)", res["BABA"]["shares"] == 2.35, res["BABA"]["shares"])
check("normal buyback still applied (AAPL 15.0 -> 14.6bn)", res["AAPL"]["shares"] == 14.6, res["AAPL"]["shares"])
check("bank net debt stays at zero by design", res["JPM"]["netdebt"] == 0.0, res["JPM"]["netdebt"])
check("bank share count still updates", res["JPM"]["shares"] == 2.75)
check("impossible net-debt swing rejected (XOM keeps 30)", res["XOM"]["netdebt"] == 30.0, res["XOM"]["netdebt"])
check("NVIDIA's +$222bn 'net debt' rejected (keeps net cash)", res["NVDA"]["netdebt"] == -50.0, res["NVDA"]["netdebt"])
check("NVIDIA's small share-count change still applied", res["NVDA"]["shares"] == 24.2)
check("stock split accepted (BKNG 0.032 -> 0.81bn at 1/25th the price)", res["BKNG"]["shares"] == 0.81, res["BKNG"]["shares"])
check("BKNG stored data updated for its April 2026 split", abs(lib_pre["BKNG"]["shares"] - 0.81) < 0.01
      and lib_pre["BKNG"]["price"] < 1000)

# Stored share counts must match reality: price x shares should be a sane
# market cap for its revenue. ADI (4.96bn) and ORLY (8.6bn) were 10x typos.
from build import load_companies  # noqa: E402
lib = {c["t"]: c for c in load_companies()}
check("ADI stored share count fixed (0.485bn, not 4.96)", abs(lib["ADI"]["shares"] - 0.485) < 0.01)
check("ORLY stored share count fixed (0.81bn, not 8.6)", abs(lib["ORLY"]["shares"] - 0.81) < 0.01)
odd = [t for t, c in lib.items() if c["rev"] > 1 and c["price"] * c["shares"] / c["rev"] > 100]
check("no stored company implies over 100x price/sales (catches 10x typos)", not odd, odd)


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
section("Preview cards for shared links")
import copy  # noqa: E402
import og_cards  # noqa: E402
import seo_pages as sp  # noqa: E402
from PIL import Image  # noqa: E402

raw = open(os.path.join(SRC, "docs", "data.js")).read()
full = json.loads(raw[raw.index("{"):].rstrip().rstrip(";"))
pick = {c["t"]: c for c in full["companies"] if c["t"] in ("NVDA", "IBM", "MSTR")}
mini = {"meta": {"price_date": "2026-10-01", "n_companies": 3},
        "companies": [copy.deepcopy(pick[t]) for t in ("NVDA", "IBM", "MSTR")],
        "sectors": full["sectors"]}
shutil.rmtree(og_cards.OUT_DIR, ignore_errors=True)
jpg = lambda t: os.path.join(og_cards.OUT_DIR, f"{t}.jpg")
man = og_cards.generate(mini)
check("a card per company plus the homepage card",
      all(os.path.exists(jpg(t)) for t in ("NVDA", "IBM", "MSTR", "site")))
im = Image.open(jpg("NVDA"))
check("cards are 1200x630, the size sharing apps expect", im.size == (1200, 630), im.size)
check("cards are small (<120 KB)", os.path.getsize(jpg("NVDA")) < 120_000, os.path.getsize(jpg("NVDA")))
check("negative-value company still gets a card", os.path.exists(jpg("MSTR")))

stamp = lambda t: os.path.getmtime(jpg(t))
before = {t: stamp(t) for t in ("NVDA", "IBM", "MSTR")}
mini["meta"]["price_date"] = "2026-10-02"
nv = mini["companies"][0]
nv["price"] *= 1.008; nv["upside"] -= 0.01
og_cards.generate(mini)
check("small daily moves do not redraw (keeps the repo small)",
      all(stamp(t) == before[t] for t in before))
check("...and keep the old version stamp",
      og_cards.load_manifest()["cards"]["NVDA"]["v"] == "2026-10-01")
nv["upside"] -= 0.03
og_cards.generate(mini)
m2 = og_cards.load_manifest()["cards"]
check("a 3-point upside move redraws the card", stamp("NVDA") != before["NVDA"] and m2["NVDA"]["v"] == "2026-10-02")
check("other cards untouched", stamp("IBM") == before["IBM"])
mini["companies"][1]["rating"] = "Strong Buy" if pick["IBM"]["rating"] != "Strong Buy" else "Sell"
og_cards.generate(mini)
check("a rating change redraws the card", og_cards.load_manifest()["cards"]["IBM"]["rating"] == mini["companies"][1]["rating"])
mini["companies"][1]["fv"] *= 1.03
mini["companies"][1]["upside"] += 0.005
v_before = os.path.getmtime(jpg("IBM"))
og_cards.generate(mini)
check("a 3% fair-value move redraws the card", os.path.getmtime(jpg("IBM")) != v_before)
mini["companies"] = mini["companies"][:2]
og_cards.generate(mini)
check("a dropped company's card is deleted", not os.path.exists(jpg("MSTR"))
      and "MSTR" not in og_cards.load_manifest()["cards"])

cards = sp.load_cards()
page = sp.company_page(mini["companies"][0], mini["sectors"], {c["t"]: c for c in mini["companies"]}, cards)
check("company page names its card, with a version so apps refetch",
      'og:image" content="https://free-flow-finance.pages.dev/og/NVDA.jpg?v=2026-10-02"' in page)
check("company page has the twitter image too", 'twitter:image' in page)
check("shared case links are forwarded into the app", "location.replace('../../#/company/NVDA'" in page)
page_none = sp.company_page(pick["MSTR"], mini["sectors"], {}, cards)
check("no card -> no broken image tag", "og:image" not in page_none)
check("seo_pages never needs Pillow", "PIL" not in open("seo_pages.py").read())
check("homepage names the site card", "og/site.jpg" in open("docs/index.html").read())


# ------------------------------------------------------------------------
section("October 2026 news review")
import re as _re  # noqa: E402
from build import load_companies as _lc  # noqa: E402
cos = _lc()
tk = {c["t"] for c in cos}
check("acquired / delisted companies removed (EA, WBD, ANSS)", not ({"EA", "WBD", "ANSS"} & tk))
check("Fiserv is listed under its current ticker", "FISV" in tk and "FI" not in tk)
check("every company has 3 thesis points and 3 risks",
      all(len(c["bull"]) == 3 and len(c["risks"]) == 3 for c in cos),
      [c["t"] for c in cos if len(c["bull"]) != 3 or len(c["risks"]) != 3])
items = [(c["t"], n) for c in cos for n in c.get("news", [])]
check("most companies carry recent developments", sum(1 for c in cos if c.get("news")) > 180)
check("every news item is dated inside the review window",
      all(_re.match(r"2026-(0[89]|10)-\d\d$", n["d"]) for _, n in items))
check("every news item links to an https source",
      all(n["u"].startswith("https://") for _, n in items))
check("at most four news items a company", all(len(c.get("news", [])) <= 4 for c in cos))
import fetch_prices as _fp  # noqa: E402
check("Marsh keeps quoting if its ticker changed", _fp.QUOTE_ALIASES.get("MMC") == "MRSH")

stale = os.path.join("docs", "company", "ZZZZ")
os.makedirs(stale, exist_ok=True)
open(os.path.join(stale, "index.html"), "w").write("old")
keep = os.path.join("docs", "company", "KEEPME")
os.makedirs(keep, exist_ok=True)
open(os.path.join(keep, "index.html"), "w").write("x")
open(os.path.join(keep, "notes.txt"), "w").write("someone's file")
pages = set(os.listdir(os.path.join("docs", "company")))
check("a broken company list never wipes the pages", sp.prune_company_pages(set()) == []
      and os.path.exists(stale))
gone = sp.prune_company_pages(pages - {"ZZZZ", "KEEPME"})
check("page of a company no longer covered is removed", gone == ["ZZZZ"] and not os.path.exists(stale))
check("a folder holding anything else is left alone", os.path.exists(os.path.join(keep, "notes.txt")))


# ------------------------------------------------------------------------
section("Fair value history on the charts")
import fv_history as fh2  # noqa: E402
def fake(day, fvs):
    return {"meta": {"price_date": day},
            "companies": [{"t": t, "fv": v} for t, v in fvs.items()]}
def pts(t):
    return fh2.load()["s"][t]["p"]

# Rebuild the past from git, the way the first run on GitHub will.
if os.path.exists(fh2.PATH):
    os.remove(fh2.PATH)
g = lambda *a: subprocess.run(["git", *a], cwd=work, capture_output=True, text=True)
g("init", "-q"); g("config", "user.email", "t@t"); g("config", "user.name", "t")
for day, fvs in (("2026-09-01", {"AAA": 100.0, "BBB": 50.0}),
                 ("2026-09-02", {"AAA": 100.4, "BBB": 50.0}),      # <1%: no new point
                 ("2026-09-03", {"AAA": 110.0, "BBB": -5.0})):     # BBB goes N/M
    open("docs/data.js", "w").write("const FF_DATA = " + json.dumps(fake(day, fvs)) + ";")
    g("add", "docs/data.js"); g("commit", "-qm", day)
saved_updates = fh2.MODEL_UPDATES
fh2.MODEL_UPDATES = ["first revision"]
msg = fh2.record([{"t": "AAA", "fv": 111.0}, {"t": "BBB", "fv": 52.0}], {"price_date": "2026-09-04"})
check("first run rebuilds the past from git history", "rebuilt 3 past days" in msg, msg)
check("small moves don't add points; real moves do",
      [p[0] for p in pts("AAA")] == ["2026-09-01", "2026-09-03", "2026-09-04"], pts("AAA"))
check("a fair value that stops being meaningful is recorded as 0", [p[1] for p in pts("BBB")][:2] == [50.0, 0.0], pts("BBB"))
u = fh2.load()["updates"]
check("a new model update is stamped with the day it goes live",
      u == [{"n": 1, "d": "2026-09-04", "label": "first revision"}], u)
check("every company starts a segment on the update day", pts("AAA")[-1] == ["2026-09-04", 111.0])

fh2.record([{"t": "AAA", "fv": 111.5}], {"price_date": "2026-09-05"})
check("after the update, small moves again add nothing", pts("AAA")[-1][0] == "2026-09-04")
check("companies that left coverage are dropped", "BBB" not in fh2.load()["s"])
fh2.MODEL_UPDATES = ["first revision", "second revision"]
fh2.record([{"t": "AAA", "fv": 111.5}], {"price_date": "2026-09-08"})
u = fh2.load()["updates"]
check("adding a line to MODEL_UPDATES creates update 2", [x["n"] for x in u] == [1, 2] and u[1]["d"] == "2026-09-08")
check("update 1 keeps its original date", u[0]["d"] == "2026-09-04")
fh2.record([{"t": "AAA", "fv": 112.0}], {"price_date": "2026-09-08"})
check("a second build the same day doesn't duplicate points",
      [p[0] for p in pts("AAA")].count("2026-09-08") == 1)
raw = open(fh2.PATH).read()
check("history file is valid for the browser", raw.startswith("var FF_FV_HISTORY = {") and raw.rstrip().endswith(";"))
fh2.MODEL_UPDATES = saved_updates
check("the page loads the history file", 'src="fv-history.js"' in open("docs/index.html").read())
check("the workflow commits the history file",
      "docs/fv-history.js" in open(".github/workflows/update-prices.yml").read())


# ------------------------------------------------------------------------
shutil.rmtree(work, ignore_errors=True)
print("\n" + "=" * 68)
print(f"PASSED {len(PASS)}   FAILED {len(FAIL)}")
if FAIL:
    print("Failed: " + "; ".join(FAIL))
print("=" * 68)
sys.exit(1 if FAIL else 0)
