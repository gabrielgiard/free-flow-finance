"""Is the site showing the latest close? Answers yes or no, and can fail a run.

This exists because every past staleness incident was silent: each fetch
step was allowed to fail quietly so one bad source could not take the site
down, and the run still showed a green tick. Nobody found out until a
visitor did. Now the last step of every update asks one question -- does
docs/data.js hold the latest market close? -- and if not, the run goes red.
GitHub emails the repository owner whenever a scheduled run fails.

    python check_freshness.py                   # report only, always exits 0
    python check_freshness.py --fail-behind 1   # exit 1 if 1+ sessions behind
    python check_freshness.py --github-output   # also write fresh=true/false
                                                # for the workflow to read
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import market_calendar as cal  # noqa: E402

DATA_PATH = os.path.join(HERE, "docs", "data.js")
HISTORY_PATH = os.path.join(HERE, "docs", "history.js")


def _load_js(path, prefix):
    try:
        text = open(path).read()
    except FileNotFoundError:
        return None
    if not text.startswith(prefix):
        return None
    try:
        return json.loads(text[len(prefix):].rstrip().rstrip(";"))
    except json.JSONDecodeError:
        return None


def site_price_date():
    """The closing date the site's prices are from, or None if unknown."""
    data = _load_js(DATA_PATH, "const FF_DATA = ")
    if isinstance(data, dict):
        d = cal.parse_iso((data.get("meta") or {}).get("price_date"))
        if d:
            return d, "docs/data.js"
    # data.js built by an older build.py has no price_date. Fall back to the
    # most common chart end date, which is what those builds used as prices.
    hist = _load_js(HISTORY_PATH, "var FF_HISTORY = ")
    if isinstance(hist, dict):
        ends = [cal.parse_iso(e.get("to")) for k, e in hist.items()
                if not k.startswith("_") and isinstance(e, dict)]
        ends = [e for e in ends if e]
        if ends:
            return max(set(ends), key=lambda d: (ends.count(d), d)), "docs/history.js"
    return None, "nothing readable"


def main():
    args = sys.argv[1:]
    want = cal.last_close_date()
    have, source = site_price_date()
    lag = cal.trading_days_between(have, want) if have else 99

    if have is None:
        print(f"Could not read a price date ({source}). Treating the site as stale.")
    elif lag == 0:
        print(f"Up to date: the site shows the {have} close (from {source}).")
    else:
        print(f"BEHIND: the site shows the {have} close, but the latest close is "
              f"{want} — {lag} trading day{'s' if lag != 1 else ''} behind.")

    if "--github-output" in args and os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"fresh={'true' if lag == 0 else 'false'}\n")
            f.write(f"lag={lag}\n")

    if "--fail-behind" in args:
        try:
            limit = int(args[args.index("--fail-behind") + 1])
        except (IndexError, ValueError):
            limit = 1
        if lag >= limit:
            print(f"::error::Site prices are {lag} trading day(s) behind "
                  f"(showing {have}, latest close {want}). Open this run's log, "
                  f"look at the 'Fetch current prices' and 'Update chart history' "
                  f"steps for the cause.")
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
