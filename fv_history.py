"""Fair value over time, so the charts can show how the model's view moved.

WHAT IS RECORDED

The history travels inside docs/data.js (as FF_DATA.fvh), which every
version of the daily workflow already saves -- it used to be a separate
docs/fv-history.js, which an older workflow file never committed, so the
history silently vanished after every run. It holds, per company, the fair value each time it moved by
1% or more (a step series: the value holds until the next point), plus a short
list of MODEL UPDATES -- the dates the model itself was revised by hand. The
chart draws the fair value as steps and marks each update, so a visitor can
tell "the price moved" apart from "the model was revised".

MODEL UPDATES

Add one line to MODEL_UPDATES when you revise the model (new assumptions, a
methodology change, a big review): (date it went live, what changed). Leave
the date as None and the next build stamps it with that day. On the charts
the original model is "model update 1" and each line here adds one. Never
edit or remove old lines: they are history.

WHERE THE PAST COMES FROM

The first time this runs on GitHub, the history file does not exist yet. The
workflow checks out the full git history, and every past daily commit contains
the docs/data.js the site published that day -- so the fair values the site
actually showed are rebuilt from those commits. Nothing is estimated. Run
locally without git history, it simply starts from today.
"""

import datetime as dt
import json
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "docs", "data.js")
LEGACY_PATH = os.path.join(HERE, "docs", "fv-history.js")

MODEL_UPDATES = [
    ("2026-10-12", "October 2026 review: corrected share counts, splits and net debt; every write-up refreshed"),
]

MOVE = 0.01          # record a new point when fair value moves 1% or more
KEEP_DAYS = 3 * 366  # history kept on the site
MAX_COMMITS = 1500   # backfill limit


def _iso(d):
    return d.isoformat() if isinstance(d, dt.date) else str(d)[:10]


def _fv(c):
    v = c.get("fv")
    return round(float(v), 2) if isinstance(v, (int, float)) and v > 0 else 0.0


def _add(series, day, v, pin=False):
    """Append one observation to {"p": [[iso, v], ...]} using the step rule.
    pin: always keep a point on this day (a model update starts a segment)."""
    pts = series.setdefault("p", [])
    if pin and (not pts or pts[-1][0] != day):
        pts.append([day, v])
        return
    if pts and pts[-1][0] == day:
        pts[-1][1] = v
        # collapse if it now equals the point before (never on an update day)
        if not pin and len(pts) > 1 and not _moved(pts[-2][1], v):
            pts.pop()
        return
    if not pts or _moved(pts[-1][1], v):
        pts.append([day, v])


def _moved(old, new):
    if (old > 0) != (new > 0):
        return True
    return old > 0 and abs(new / old - 1) >= MOVE


def _valid(h):
    return isinstance(h, dict) and isinstance(h.get("s"), dict) and isinstance(h.get("updates", []), list)


def load():
    """The history the site last published: inside data.js, or the old
    standalone file if that is all there is. None means start fresh."""
    for path, pick in ((DATA_PATH, lambda b: b.get("fvh")), (LEGACY_PATH, lambda b: b)):
        try:
            raw = open(path).read()
            body = json.loads(raw[raw.index("{"):].rstrip().rstrip(";"))
            h = pick(body) if isinstance(body, dict) else None
            if _valid(h):
                h.setdefault("updates", [])
                return h
        except (OSError, ValueError):
            continue
    return None


def _git(*args):
    return subprocess.run(["git", *args], cwd=HERE, capture_output=True, text=True, timeout=120)


def backfill(pin_days=()):
    """Rebuild the record from every past published docs/data.js in git."""
    hist = {"updates": [], "s": {}, "to": None}
    try:
        log = _git("log", "--format=%H %cs", "--", "docs/data.js")
    except (OSError, subprocess.SubprocessError):
        return hist, 0
    if log.returncode != 0 or not log.stdout.strip():
        return hist, 0
    commits = [ln.split() for ln in log.stdout.strip().splitlines()][:MAX_COMMITS][::-1]
    by_day = {}
    for sha, cdate in commits:              # oldest first; later commits win the day
        try:
            r = _git("show", f"{sha}:docs/data.js")
            if r.returncode != 0:
                continue
            raw = r.stdout
            data = json.loads(raw[raw.index("{"):].rstrip().rstrip(";"))
            day = data.get("meta", {}).get("price_date") or cdate
            by_day[day] = {c["t"]: _fv(c) for c in data.get("companies", []) if "t" in c}
        except (ValueError, KeyError, subprocess.SubprocessError):
            continue
    days = sorted(by_day)
    # an update starts a segment on the first published day on or after it
    pin_days = {next((x for x in days if x >= d), None) for d in pin_days} - {None}
    for day in days:
        for t, v in by_day[day].items():
            _add(hist["s"].setdefault(t, {}), day, v, pin=day in pin_days)
        hist["to"] = day
    return hist, len(by_day)


def record(companies, meta):
    """Add today's fair values. Returns (history, one-line summary); the build
    puts the history into data.js. Call it BEFORE data.js is overwritten, so
    the previous history can be read from it."""
    day = _iso(meta.get("price_date") or dt.date.today())
    hist = load()
    note = ""
    if hist is None:
        hist, days = backfill({d for d, _ in MODEL_UPDATES if d and d <= day})
        note = f" (rebuilt {days} past days from git history)" if days else " (starting today)"

    # Stamp any model update this build is the first to see.
    while len(hist["updates"]) < len(MODEL_UPDATES):
        n = len(hist["updates"]) + 1
        d, label = MODEL_UPDATES[n - 1]
        hist["updates"].append({"n": n, "d": d if d and d <= day else day, "label": label})
    new_update = any(u["d"] == day for u in hist["updates"])

    live = set()
    for c in companies:
        t = c["t"]
        live.add(t)
        s = hist["s"].setdefault(t, {})
        v = _fv(c)
        _add(s, day, v, pin=new_update)   # every update starts a segment
    for t in [t for t in hist["s"] if t not in live]:
        hist["s"].pop(t)

    cutoff = (dt.date.fromisoformat(day) - dt.timedelta(days=KEEP_DAYS)).isoformat()
    for s in hist["s"].values():
        pts = s.get("p", [])
        old = [p for p in pts if p[0] < cutoff]
        if old:
            s["p"] = [[cutoff, old[-1][1]]] + [p for p in pts if p[0] >= cutoff]
    hist["to"] = max(hist.get("to") or day, day)

    pts = sum(len(s.get("p", [])) for s in hist["s"].values())
    return hist, (f"Fair value history: {len(hist['s'])} companies, {pts} points, "
                  f"{len(hist['updates'])} model update(s){note}")
