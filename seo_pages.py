"""Generate real, indexable HTML pages so search engines can find this library.

THE PROBLEM THIS SOLVES

The site is a single-page app routed on the URL fragment: /#/company/NVDA.
Everything after the # is, by specification, a pointer to a location *within*
one document. Search engines therefore see one page, not 234. Every company
write-up in this library is invisible to anyone searching "NVIDIA fair value"
or "is Palantir overvalued" — which is precisely the audience it is for.

THE FIX

At build time, write a genuine HTML file per company at

    docs/company/NVDA/index.html

Static hosts (GitHub Pages, Cloudflare Pages) serve that automatically for the
path /company/NVDA/. The file contains the research as real markup — no
JavaScript execution required to read it — plus the metadata search engines and
social platforms expect: title, description, canonical URL, Open Graph tags and
JSON-LD structured data.

The interactive app is untouched. Old #/ links keep working, and every static
page links into the app for the charts, screener and portfolio tools.
"""

import html
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, "docs")

# Set this to the domain you actually publish on. It drives canonical URLs and
# the sitemap, and getting it wrong is worse than leaving it out, because a
# canonical pointing at the wrong host tells Google to index somewhere else.
SITE_URL = "https://free-flow-finance.pages.dev"


def esc(s):
    return html.escape(str(s), quote=True)


def money(v):
    if not isinstance(v, (int, float)):
        return "N/M"
    if v <= 0:
        return "N/M"
    return f"${v:,.2f}"


def pct(v):
    return f"{v * 100:+.1f}%"


def meta_description(c):
    """The snippet shown in search results. Lead with the finding, not the brand.

    Google truncates around 155 characters, so the fair value and the verdict
    have to come first or they are cut off.
    """
    fv = money(c["fv"])
    if fv == "N/M":
        return (f"{c['n']} ({c['t']}) discounted cash flow analysis: financial "
                f"model, comparables and investment thesis. Free equity research.")
    return (f"Our DCF model values {c['n']} ({c['t']}) at {fv} against a "
            f"{money(c['price'])} share price — {pct(c['upside'])}. "
            f"Rated {c['rating']}. Full model, comparables and thesis.")


def page_title(c):
    fv = money(c["fv"])
    if fv == "N/M":
        return f"{c['n']} ({c['t']}) DCF Valuation & Analysis | FreeFlow Finance"
    return (f"{c['t']} Fair Value {fv} — {c['n']} DCF Valuation "
            f"| FreeFlow Finance")


def structured_data(c, sector_name):
    """JSON-LD. Describes the page as a research article about a company.

    Search engines use this to understand what the page is; it does not
    directly raise rankings but it does make rich results possible.
    """
    fv = c["fv"]
    body = (f"Discounted cash flow valuation of {c['n']} ({c['t']}), "
            f"{sector_name}. ")
    if isinstance(fv, (int, float)) and fv > 0:
        body += (f"Estimated fair value {money(fv)} per share versus a market "
                 f"price of {money(c['price'])}, implying {pct(c['upside'])}. "
                 f"Rating: {c['rating']}.")
    data = {
        "@context": "https://schema.org",
        "@type": "AnalysisNewsArticle",
        "headline": f"{c['n']} ({c['t']}) — Discounted Cash Flow Valuation",
        "description": meta_description(c),
        "articleBody": body,
        "about": {
            "@type": "Corporation",
            "name": c["n"],
            "tickerSymbol": c["t"],
        },
        "isAccessibleForFree": True,
        "author": {"@type": "Person", "name": "Gabriel Giard"},
        "publisher": {"@type": "Organization", "name": "FreeFlow Finance"},
        "mainEntityOfPage": f"{SITE_URL}/company/{c['t']}/",
    }
    return json.dumps(data, separators=(",", ":"))


def head(title, description, canonical, jsonld=None, depth=2):
    """Shared <head>. depth is how many directories deep the file sits, so the
    relative links to CSS and JS resolve."""
    up = "../" * depth
    ld = f'\n<script type="application/ld+json">{jsonld}</script>' if jsonld else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:site_name" content="FreeFlow Finance">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<link rel="stylesheet" href="{up}styles.css">{ld}
</head>"""


def chrome_header(depth=2):
    up = "../" * depth
    return f"""
<header class="site-header"><div class="header-row">
  <a class="brand" href="{up}">
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" style="width:34px;height:34px">
      <rect width="32" height="32" rx="9" fill="#241546"/>
      <path d="M5 20c4-6 8 6 12 0s7-6 10 0" stroke="#b9a3f5" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M5 24c4-5 8 5 12 0s7-5 10 0" stroke="#c9a227" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
    </svg>
    <span><span class="brand-name">FreeFlow Finance</span>
    <span class="brand-sub">Equity Research Library</span></span>
  </a>
  <nav class="main-nav">
    <a href="{up}">Home</a>
    <a href="{up}#/screener">Screener</a>
    <a href="{up}#/methodology">Methodology</a>
    <a href="{up}#/about">About</a>
  </nav>
</div></header>"""


def chrome_footer(depth=2):
    up = "../" * depth
    return f"""
<footer>
  <div class="wrap">
    <p style="font-size:13px;color:var(--text-dim);max-width:760px">
      <strong>Not investment advice.</strong> FreeFlow Finance is an independent
      educational research project. Company overviews, financial models,
      discounted cash flow valuations, comparable-company analyses, investment
      theses, risk assessments and target prices on this site are for
      educational purposes only, are generated using publicly available
      information and a single self-built model, and do not constitute
      investment, financial, tax or legal advice from a licensed professional.
      Always do your own research and consult a licensed financial adviser
      before making investment decisions.
    </p>
    <p style="font-size:13px;color:var(--text-dim);margin-top:14px">
      <a href="{up}" style="color:var(--lilac)">Explore all companies</a> ·
      <a href="{up}#/methodology" style="color:var(--lilac)">How the model works</a>
    </p>
  </div>
</footer>"""


def company_page(c, sectors, by_ticker):
    sector = next((s for s in sectors if s["k"] == c["sec"]), None)
    sector_name = sector["n"] if sector else c["sec"]
    canonical = f"{SITE_URL}/company/{c['t']}/"
    title = page_title(c)
    desc = meta_description(c)

    fv_txt = money(c["fv"])
    verdict = (f"<strong>{esc(fv_txt)}</strong> fair value versus "
               f"<strong>{money(c['price'])}</strong> in the market, "
               f"a difference of <strong>{pct(c['upside'])}</strong>"
               if fv_txt != "N/M" else
               "Fair value is not meaningful for this company — the model "
               "produces a negative equity value")

    bulls = "".join(f"<li>{esc(b)}</li>" for b in c.get("bull", []))
    risks = "".join(f"<li>{esc(r)}</li>" for r in c.get("risks", []))
    segs = "".join(
        f"<tr><td>{esc(s[0])}</td><td class='num'>{s[1]}%</td></tr>"
        for s in c.get("segs", []))
    peers = " · ".join(
        f'<a href="../{esc(p)}/">{esc(p)}</a>'
        for p in c.get("peers", []) if p in by_ticker)

    model_rows = "".join(
        f"<tr><td>Year {i+1}</td><td class='num'>${y['rev']:,.1f}B</td>"
        f"<td class='num'>${y['fcf']:,.1f}B</td></tr>"
        for i, y in enumerate(c.get("model", [])[:5]))

    return f"""{head(title, desc, canonical, structured_data(c, sector_name))}
<body>
{chrome_header()}
<main class="wrap" style="padding:40px 0 60px">

  <nav aria-label="Breadcrumb" style="font-size:13px;color:var(--text-dim);margin-bottom:22px">
    <a href="../../" style="color:var(--lilac)">Home</a> /
    <a href="../../sector/{esc(c['sec'])}/" style="color:var(--lilac)">{esc(sector_name)}</a> /
    <span>{esc(c['t'])}</span>
  </nav>

  <h1 style="font-family:var(--font-display);font-size:38px;line-height:1.1;margin-bottom:10px">
    {esc(c['n'])} <span style="color:var(--lilac)">({esc(c['t'])})</span>
  </h1>
  <p style="color:var(--text-dim);font-size:14px;margin-bottom:26px">
    {esc(c.get('exch',''))} · {esc(c.get('hq',''))} · Founded {esc(c.get('founded',''))}
    · CEO {esc(c.get('ceo',''))}
  </p>

  <div class="card" style="margin-bottom:32px">
    <h2 style="font-size:19px;margin-bottom:12px">Valuation summary</h2>
    <p style="font-size:16px;line-height:1.6">{verdict}. Rated
      <strong>{esc(c['rating'])}</strong>.</p>
    <table class="ff-table" style="margin-top:18px">
      <tbody>
        <tr><td>Fair value per share</td><td class="num">{esc(fv_txt)}</td></tr>
        <tr><td>Current share price</td><td class="num">{money(c['price'])}</td></tr>
        <tr><td>Upside / downside</td><td class="num">{pct(c['upside'])}</td></tr>
        <tr><td>Bear case</td><td class="num">{money(c.get('fv_bear'))}</td></tr>
        <tr><td>Bull case</td><td class="num">{money(c.get('fv_bull'))}</td></tr>
        <tr><td>Discount rate (WACC)</td><td class="num">{c['wacc']*100:.1f}%</td></tr>
        <tr><td>Terminal growth</td><td class="num">{c['tg']*100:.2f}%</td></tr>
        <tr><td>Market capitalisation</td><td class="num">${c['mcap']:,.0f}B</td></tr>
        <tr><td>EV / Sales</td><td class="num">{c['ev_sales']:.1f}x</td></tr>
      </tbody>
    </table>
  </div>

  <h2 style="font-size:22px;margin:0 0 12px">About {esc(c['n'])}</h2>
  <p style="line-height:1.7;color:var(--text-muted);margin-bottom:30px">{esc(c.get('desc',''))}</p>

  <div class="two-col" style="gap:34px;margin-bottom:34px">
    <div>
      <h2 style="font-size:19px;margin-bottom:12px">Investment case</h2>
      <ul style="line-height:1.7;color:var(--text-muted);padding-left:20px">{bulls}</ul>
    </div>
    <div>
      <h2 style="font-size:19px;margin-bottom:12px">Key risks</h2>
      <ul style="line-height:1.7;color:var(--text-muted);padding-left:20px">{risks}</ul>
    </div>
  </div>

  <h2 style="font-size:19px;margin-bottom:12px">Revenue by segment</h2>
  <table class="ff-table" style="margin-bottom:30px"><tbody>{segs}</tbody></table>

  <h2 style="font-size:19px;margin-bottom:12px">Five-year forecast</h2>
  <table class="ff-table" style="margin-bottom:30px">
    <thead><tr><th></th><th class="num">Revenue</th><th class="num">Free cash flow</th></tr></thead>
    <tbody>{model_rows}</tbody>
  </table>

  <h2 style="font-size:19px;margin-bottom:12px">What the street says</h2>
  <p style="line-height:1.7;color:var(--text-muted);margin-bottom:30px">{esc(c.get('street',''))}</p>

  <p style="color:var(--text-dim);font-size:14px;margin-bottom:30px">
    <strong style="color:var(--text)">Comparable companies:</strong> {peers}
  </p>

  <p style="margin-bottom:10px">
    <a class="btn btn-violet" href="../../#/company/{esc(c['t'])}">
      Open the interactive model, price chart and sensitivity grid →</a>
  </p>
</main>
{chrome_footer()}
</body></html>"""


def sector_page(s, companies):
    canonical = f"{SITE_URL}/sector/{s['k']}/"
    title = f"{s['n']} — DCF Valuations for {s['count']} Companies | FreeFlow Finance"
    desc = (f"Discounted cash flow valuations and fair value estimates for "
            f"{s['count']} {s['n'].lower()} companies, all built with one "
            f"consistent model. Free equity research.")
    rows = "".join(
        f"<tr><td><a href='../../company/{esc(c['t'])}/'>{esc(c['t'])}</a></td>"
        f"<td><a href='../../company/{esc(c['t'])}/'>{esc(c['n'])}</a></td>"
        f"<td class='num'>{money(c['price'])}</td>"
        f"<td class='num'>{money(c['fv'])}</td>"
        f"<td class='num'>{pct(c['upside'])}</td>"
        f"<td>{esc(c['rating'])}</td></tr>"
        for c in sorted(companies, key=lambda x: -x["mcap"]))
    return f"""{head(title, desc, canonical)}
<body>
{chrome_header()}
<main class="wrap" style="padding:40px 0 60px">
  <nav aria-label="Breadcrumb" style="font-size:13px;color:var(--text-dim);margin-bottom:20px">
    <a href="../../" style="color:var(--lilac)">Home</a> / <span>{esc(s['n'])}</span>
  </nav>
  <h1 style="font-family:var(--font-display);font-size:36px;margin-bottom:12px">{esc(s['n'])}</h1>
  <p style="color:var(--text-muted);max-width:760px;line-height:1.7;margin-bottom:28px">{esc(s.get('d',''))}</p>
  <table class="ff-table">
    <thead><tr><th>Ticker</th><th>Company</th><th class="num">Price</th>
      <th class="num">Fair value</th><th class="num">Upside</th><th>Rating</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>
  <p style="margin-top:26px">
    <a class="btn btn-violet" href="../../#/sector/{esc(s['k'])}">Open the interactive sector view →</a>
  </p>
</main>
{chrome_footer()}
</body></html>"""


def generate(data):
    """Write every static page, the sitemap and robots.txt."""
    companies = data["companies"]
    sectors = data["sectors"]
    by_ticker = {c["t"]: c for c in companies}
    written = 0

    for c in companies:
        # A ticker like BRK.B is fine in a path; 005930 is fine too. Anything
        # with a slash would not be, so guard against it.
        if "/" in c["t"] or "\\" in c["t"]:
            continue
        d = os.path.join(DOCS, "company", c["t"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w") as f:
            f.write(company_page(c, sectors, by_ticker))
        written += 1

    for s in sectors:
        d = os.path.join(DOCS, "sector", s["k"])
        os.makedirs(d, exist_ok=True)
        members = [c for c in companies if c["sec"] == s["k"]]
        with open(os.path.join(d, "index.html"), "w") as f:
            f.write(sector_page(s, members))
        written += 1

    # ---- sitemap ------------------------------------------------------
    import time
    today = time.strftime("%Y-%m-%d")
    urls = [f"{SITE_URL}/"]
    urls += [f"{SITE_URL}/sector/{s['k']}/" for s in sectors]
    urls += [f"{SITE_URL}/company/{c['t']}/" for c in companies
             if "/" not in c["t"]]
    body = "".join(
        f"<url><loc>{esc(u)}</loc><lastmod>{today}</lastmod>"
        f"<changefreq>daily</changefreq>"
        f"<priority>{'1.0' if u.endswith('/') and u.count('/') == 3 else '0.8'}</priority>"
        f"</url>" for u in urls)
    with open(os.path.join(DOCS, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                + body + "</urlset>")

    with open(os.path.join(DOCS, "robots.txt"), "w") as f:
        f.write("User-agent: *\nAllow: /\n\n"
                f"Sitemap: {SITE_URL}/sitemap.xml\n")

    print(f"SEO: wrote {written} static pages, sitemap.xml ({len(urls)} URLs), robots.txt")
    return written
