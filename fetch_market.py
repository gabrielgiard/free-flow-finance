"""Fetch the homepage market figures into market.json (Twelve Data)."""
import json, os, sys, time, urllib.request

API = "https://api.twelvedata.com/quote?symbol={}&apikey={}"

TARGETS = [
    ("spx",   ["SPX", "GSPC", "US500"],  "S&P 500"),
    ("ndx",   ["IXIC", "NDX", "US100"],  "Nasdaq"),
    ("vix",   ["VIX"],                   "VIX"),
    ("brent", ["BRENT", "UKOIL", "BZ"],  "Brent crude"),
    ("rf",    ["TNX", "US10Y"],          "10-year Treasury"),
]
PAUSE = 8.0


def get(symbol, key):
    try:
        with urllib.request.urlopen(API.format(symbol, key), timeout=20) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        return None, type(e).__name__
    if isinstance(data, dict) and data.get("status") == "error":
        return None, data.get("message", "error")[:60]
    for field in ("close", "price", "previous_close"):
        raw = data.get(field)
        if raw not in (None, "", "0"):
            try:
                v = float(raw)
                if v > 0:
                    return v, None
            except (TypeError, ValueError):
                pass
    return None, "no usable value"


def main():
    key = os.environ.get("TWELVEDATA_API_KEY")
    if not key:
        print("TWELVEDATA_API_KEY not set — skipping, nothing breaks.")
        return 0
    out = {}
    for meta_key, symbols, label in TARGETS:
        for sym in symbols:
            val, err = get(sym, key)
            if val is not None:
                out[meta_key] = round(val) if meta_key in ("spx", "ndx") else round(val, 2)
                print(f"  OK   {label:20s} {sym:6s} {out[meta_key]}")
                break
            print(f"  ..   {label:20s} {sym:6s} {err}")
            time.sleep(PAUSE)
        else:
            print(f"  MISS {label:20s} keeping stored value")
        time.sleep(PAUSE)
    if not out:
        print("\nNothing fetched — homepage keeps its stored numbers.")
        return 0
    out["asof_iso"] = time.strftime("%Y-%m-%d", time.gmtime())
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "market.json")
    with open(path, "w") as f:
        json.dump(out, f, indent=2, sort_keys=True)
    print(f"\nWrote market.json — {len(out) - 1} of {len(TARGETS)} updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
