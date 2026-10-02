"""Preview cards: the picture that appears when someone shares a company link.

WHAT THIS DOES

iMessage, WhatsApp, LinkedIn, X and Discord show a link with a picture when
the page names one in an og:image tag. This script draws that picture for
every company (1200x630, the size all of them expect) into docs/og/, plus one
for the homepage. seo_pages.py then points each company page at its card.

WHY CARDS ARE NOT REDRAWN EVERY DAY

Prices move every day, but 234 new images a day would add about 10 MB a day
to the repository forever. Sharing apps keep a preview for days anyway, so a
daily redraw would not even be seen. A card is redrawn only when what it says
has really changed:

  * the rating changed,
  * the fair value moved by more than 2%, or
  * the upside moved by more than 2 percentage points.

Every card carries the date its numbers are from, so a card is never wrong
about its own numbers, only up to a few days older than the site.

docs/og/cards.json remembers what each card shows. Its "v" field goes into the
image address (NVDA.jpg?v=2026-10-01) so apps fetch the new picture when a
card is redrawn instead of showing the one they cached.

Needs Pillow (pip install pillow). Without it the build carries on and the
pages simply have no picture.
"""

import datetime as dt
import json
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "docs", "og")
FONT_DIR = os.path.join(HERE, "og_fonts")
MANIFEST = os.path.join(OUT_DIR, "cards.json")

# Bump this when the card design changes: every card is redrawn once.
DESIGN = 1

FV_MOVE = 0.02      # redraw when fair value moves more than 2%
UP_MOVE = 0.02      # ...or the upside moves more than 2 percentage points

W, H = 1200, 630
S = 2               # draw at 2x and shrink, so shapes have smooth edges

INK = (6, 5, 12)
TEXT = (241, 238, 248)
MUTED = (189, 181, 212)
DIM = (141, 133, 168)
LILAC = (185, 163, 245)
GOLD = (228, 201, 122)
GREEN = (79, 183, 135)
RED = (221, 107, 127)
AMBER = (212, 163, 68)

RATING_COLOR = {"Strong Buy": GREEN, "Buy": GREEN, "Hold": AMBER,
                "Reduce": RED, "Sell": RED}

_fonts = {}


def font(name, size):
    key = (name, size)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(os.path.join(FONT_DIR, name), size * S)
    return _fonts[key]


SERIF = "Newsreader-Medium.ttf"
SANS = "PlexSans-Regular.ttf"
SANS_MED = "PlexSans-Medium.ttf"
MONO = "PlexMono-Regular.ttf"
MONO_MED = "PlexMono-Medium.ttf"


# --------------------------------------------------------------- drawing --

def money(v):
    return f"${v:,.0f}" if v >= 1000 else f"${v:,.2f}"


def signed_pct(u):
    s = f"{abs(u) * 100:.1f}%"
    return ("+" if u >= 0 else "−") + s


def nice_date(iso):
    d = dt.date.fromisoformat(iso)
    return f"{d.strftime('%b')} {d.day}, {d.year}"


_bg = []


def background():
    """Ink with the site's violet glow, top left, and a faint gold one."""
    if _bg:
        return _bg[0].copy()
    small = Image.new("RGB", (W // 4, H // 4), INK)
    g = ImageDraw.Draw(small)
    g.ellipse((-90, -120, 190, 110), fill=(52, 30, 112))
    g.ellipse((230, 120, 400, 230), fill=(40, 30, 22))
    small = small.filter(ImageFilter.GaussianBlur(38))
    _bg.append(small.resize((W * S, H * S), Image.BICUBIC))
    return _bg[0].copy()


def text(d, xy, s, f, fill, anchor="la"):
    d.text((xy[0] * S, xy[1] * S), s, font=f, fill=fill, anchor=anchor)


def width(s, f):
    return f.getlength(s) / S


def logo(d, x, y, size=44):
    k = size / 32
    d.rounded_rectangle((x * S, y * S, (x + size) * S, (y + size) * S),
                        radius=9 * k * S, fill=(36, 21, 70))

    def wave(y0, amp, col, w):
        pts = []
        for i in range(41):
            t = i / 40
            px = 5 + 22 * t
            py = y0 - amp * math.sin(t * 2 * math.pi)
            pts.append(((x + px * k) * S, (y + py * k) * S))
        d.line(pts, fill=col, width=round(w * k * S), joint="curve")

    wave(20, 3.4, LILAC, 2.2)
    wave(24, 2.8, (160, 132, 52), 1.6)


def fit_name(name, max_w):
    """Largest size at which the name fits on one line, else two lines."""
    for size in (72, 66, 60):
        if width(name, font(SERIF, size)) <= max_w:
            return size, [name]
    for size in (60, 54, 48):
        f = font(SERIF, size)
        words, lines, cur = name.split(), [], ""
        for w_ in words:
            trial = (cur + " " + w_).strip()
            if width(trial, f) <= max_w or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w_
        lines.append(cur)
        if len(lines) <= 2 and all(width(l, f) <= max_w for l in lines):
            return size, lines
    f = font(SERIF, 48)
    s = name
    while width(s + "…", f) > max_w and len(s) > 4:
        s = s[:-1]
    return 48, [s.rstrip() + "…"]


def frame(d, right_note):
    logo(d, 64, 52)
    text(d, (122, 74), "FreeFlow Finance", font(SERIF, 30), TEXT, "lm")
    text(d, (W - 64, 74), right_note, font(MONO, 19), DIM, "rm")
    text(d, (64, H - 50), "free-flow-finance.pages.dev", font(MONO, 19), LILAC, "lm")
    text(d, (W - 64, H - 50), "Model output, not investment advice", font(SANS, 17), DIM, "rm")


def pill(d, x, y, label, col):
    f = font(MONO_MED, 21)
    tw = width(label, f)
    h, pad, dot = 40, 18, 9
    w = pad + dot + 10 + tw + pad
    bg = tuple(round(INK[i] + (col[i] - INK[i]) * 0.16) for i in range(3))
    d.rounded_rectangle((x * S, y * S, (x + w) * S, (y + h) * S), radius=h / 2 * S, fill=bg)
    cy = y + h / 2
    d.ellipse(((x + pad) * S, (cy - dot / 2) * S, (x + pad + dot) * S, (cy + dot / 2) * S), fill=col)
    text(d, (x + pad + dot + 10, cy), label, f, col, "lm")
    return w


def company_card(c, asof):
    img = background()
    d = ImageDraw.Draw(img)
    frame(d, f"DCF valuation · {nice_date(asof)}")

    # Ticker and rating
    tf = font(MONO_MED, 30)
    text(d, (64, 168), c["t"], tf, LILAC, "lm")
    pill(d, 64 + width(c["t"], tf) + 22, 148, c["rating"], RATING_COLOR.get(c["rating"], MUTED))

    # Company name
    size, lines = fit_name(c["n"], W - 128)
    f = font(SERIF, size)
    y = 206
    for line in lines:
        text(d, (62, y), line, f, TEXT, "la")
        y += size * 1.08

    # Numbers panel
    top, bot = 386, 548
    panel = Image.new("RGBA", img.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((64 * S, top * S, (W - 64) * S, bot * S), radius=26 * S,
                         fill=(255, 255, 255, 13), outline=(255, 255, 255, 34), width=S)
    img = Image.alpha_composite(img.convert("RGBA"), panel)
    d = ImageDraw.Draw(img)

    fv, price, up = c["fv"], c["price"], c["upside"]
    meaningful = isinstance(fv, (int, float)) and fv > 0
    lab, val = font(SANS_MED, 17), font(MONO_MED, 50)
    cols = [64 + 40, 64 + 40 + 370, 64 + 40 + 740]
    ly, vy = top + 42, top + 104
    if meaningful:
        cells = [("OUR FAIR VALUE", money(fv), GOLD),
                 ("SHARE PRICE", money(price), TEXT),
                 ("UPSIDE" if up >= 0 else "DOWNSIDE", signed_pct(up), GREEN if up >= 0 else RED)]
    else:
        cells = [("OUR FAIR VALUE", "Not meaningful", GOLD),
                 ("SHARE PRICE", money(price), TEXT),
                 ("WHY", "Debt > value", MUTED)]
    for x, (l, v, col) in zip(cols, cells):
        text(d, (x, ly), l, lab, DIM, "lm")
        vf = val if width(v, val) < 330 else font(MONO_MED, 34)
        text(d, (x, vy), v, vf, col, "lm")
    for x in cols[1:]:
        d.line(((x - 30) * S, (top + 30) * S, (x - 30) * S, (bot - 30) * S),
               fill=(255, 255, 255, 30), width=S)

    return img.convert("RGB").resize((W, H), Image.LANCZOS)


def site_card(meta):
    img = background()
    d = ImageDraw.Draw(img)
    frame(d, "Equity research library")
    n = meta.get("n_companies", 0)
    text(d, (62, 200), "What is it really worth?", font(SERIF, 76), TEXT, "la")
    text(d, (64, 310), f"Free DCF valuations for {n} companies,", font(SANS, 30), MUTED, "la")
    text(d, (64, 352), "one consistent model, updated every market day.", font(SANS, 30), MUTED, "la")
    x = 64
    for label, col in (("Strong Buy", GREEN), ("Hold", AMBER), ("Sell", RED)):
        x += pill(d, x, 452, label, col) + 14
    return img.convert("RGB").resize((W, H), Image.LANCZOS)


# ---------------------------------------------------------- change logic --

def needs_redraw(c, old, path):
    """Whether a company's card no longer matches the site closely enough."""
    if not old or not os.path.exists(path) or old.get("design") != DESIGN:
        return True
    if old.get("rating") != c["rating"] or old.get("n") != c["n"]:
        return True
    fv, ofv = c["fv"], old.get("fv")
    ok_now = isinstance(fv, (int, float)) and fv > 0
    ok_then = isinstance(ofv, (int, float)) and ofv > 0
    if ok_now != ok_then:
        return True
    if ok_now and abs(fv / ofv - 1) > FV_MOVE:
        return True
    return abs(c["upside"] - old.get("up", 0)) > UP_MOVE


def load_manifest():
    try:
        with open(MANIFEST) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def card_date(meta):
    """The date the card's numbers are from: the price date the build stamps,
    else the human 'asof' text, else today."""
    if meta.get("price_date"):
        return meta["price_date"]
    try:
        return dt.datetime.strptime(meta.get("asof", ""), "%d %B %Y").date().isoformat()
    except ValueError:
        return dt.date.today().isoformat()


def generate(data):
    """Draw the cards that need it. Returns the manifest seo_pages reads."""
    os.makedirs(OUT_DIR, exist_ok=True)
    meta = data.get("meta", {})
    asof = card_date(meta)
    man = load_manifest()
    cards = man.get("cards", {})
    drawn = kept = 0

    for c in data["companies"]:
        t = c["t"]
        if "/" in t or "\\" in t:
            continue
        path = os.path.join(OUT_DIR, f"{t}.jpg")
        if not needs_redraw(c, cards.get(t), path):
            kept += 1
            continue
        company_card(c, asof).save(path, "JPEG", quality=86, optimize=True, progressive=True)
        cards[t] = {"design": DESIGN, "v": asof, "rating": c["rating"], "n": c["n"],
                    "fv": c["fv"], "up": round(c["upside"], 4)}
        drawn += 1

    # Remove cards for companies no longer covered.
    live = {c["t"] for c in data["companies"]}
    for t in [t for t in cards if t not in live]:
        cards.pop(t)
        try:
            os.remove(os.path.join(OUT_DIR, f"{t}.jpg"))
        except OSError:
            pass

    site_path = os.path.join(OUT_DIR, "site.jpg")
    site = man.get("site", {})
    n = meta.get("n_companies")
    if site.get("design") != DESIGN or site.get("n") != n or not os.path.exists(site_path):
        site_card(meta).save(site_path, "JPEG", quality=88, optimize=True, progressive=True)
        site = {"design": DESIGN, "n": n, "v": asof}

    man = {"cards": cards, "site": site}
    tmp = MANIFEST + ".tmp"
    with open(tmp, "w") as f:
        json.dump(man, f, indent=0, sort_keys=True, separators=(",", ":"))
    os.replace(tmp, MANIFEST)
    print(f"Preview cards: redrew {drawn}, {kept} still accurate")
    return man


if __name__ == "__main__":
    import sys
    sys.path.insert(0, HERE)
    with open(os.path.join(HERE, "docs", "data.js")) as f:
        raw = f.read()
    data = json.loads(raw[raw.index("{"):].rstrip().rstrip(";"))
    generate(data)
