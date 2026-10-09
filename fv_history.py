"""Fair value over time, so the charts can show how the model's view moved.

WHAT IS RECORDED

docs/fv-history.js holds, per company, the fair value each time it moved by
1% or more (a step series: the value holds until the next point), plus a short
list of MODEL UPDATES -- the dates the model itself was revised by hand. The
chart draws the fair value as steps and marks each update, so a visitor can
tell "the price moved" apart from "the model was revised".

MODEL UPDATES

Add one line to MODEL_UPDATES when you revise the model (new assumptions, a
methodology change, a big review). The next build stamps it with that day's
date and it becomes "update 2", "update 3"... Never edit or remove old lines:
they are history.

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
PATH = os.path.join(HERE, "docs", "fv-history.js")
PREFIX = "var FF_FV_HISTORY = "

MODEL_UPDATES = [
    "October 2026 review: corrected share counts, splits and net debt; every write-up refreshed",
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


def load():
    try:
        raw = open(PATH).read()
        body = json.loads(raw[raw.index("{"):].rstrip().rstrip(";"))
        if isinstance(body, dict) and "s" in body:
            return body
    except (OSError, ValueError):
        pass
    return None


def _git(*args):
    return subprocess.run(["git", *args], cwd=HERE, capture_output=True, text=True, timeout=120)


def backfill():
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
    for day in sorted(by_day):
        for t, v in by_day[day].items():
            _add(hist["s"].setdefault(t, {}), day, v)
        hist["to"] = day
    return hist, len(by_day)


def record(companies, meta):
    """Add today's fair values. Returns a one-line summary for the build log."""
    day = _iso(meta.get("price_date") or dt.date.today())
    hist = load()
    note = ""
    if hist is None:
        hist, days = backfill()
        note = f" (rebuilt {days} past days from git history)" if days else " (starting today)"

    # Stamp any model update this build is the first to see.
    while len(hist["updates"]) < len(MODEL_UPDATES):
        n = len(hist["updates"]) + 1
        hist["updates"].append({"n": n, "d": day, "label": MODEL_UPDATES[n - 1]})
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

    tmp = PATH + ".tmp"
    with open(tmp, "w") as f:
        f.write(PREFIX + json.dumps(hist, separators=(",", ":")) + ";\n")
    os.replace(tmp, PATH)
    pts = sum(len(s.get("p", [])) for s in hist["s"].values())
    return (f"Fair value history: {len(hist['s'])} companies, {pts} points, "
            f"{len(hist['updates'])} model update(s){note}")
