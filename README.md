# FreeFlow Finance

An independent equity research library covering 100 global companies. Every
company gets a full company overview, a ten-year financial model, a discounted
cash flow valuation, a comparable-companies set, an investment thesis, key
risks, and a target price — all generated from one consistent model so the
companies are actually comparable to each other.

Built by Gabriel Giard.

**Not investment advice.** This is an educational project. See the disclaimer in
the site footer.

---

## How it fits together

```
companies/*.py     your assumptions          <- this is the actual analytical work
      |
      v
fetch_prices.py    today's share prices      -> prices.json
fetch_history.py   a year of closes,         -> docs/history.js
                   plus index/commodity         market.json
                   levels
      |
      v
build.py           runs the DCF on all 100,  -> docs/data.js
                   overlays live prices and
                   market levels
      |
      v
docs/              the website (plain HTML/CSS/JS, no framework)
```

Both fetch steps run *before* `build.py`, because the build reads what they
produce. If either fetch fails, the build carries on using the last good
values rather than showing gaps.

The website does no math. It only displays what `build.py` produces. That
separation is deliberate: it means you can change a growth assumption, re-run
one command, and the fair value, upside, rating, sector medians and comps
tables all update together.

---

## Quick start

```bash
python build.py          # regenerate docs/data.js
open docs/index.html     # view the site locally
```

There is no build tool, no npm install, no framework. Python 3.9+ and a browser
is the whole toolchain.

---

## Putting it online (GitHub Pages, free)

1. Create a new **public** repository on GitHub called `freeflow-finance`.
2. Upload everything in this folder (or `git push` it).
3. Go to **Settings → Pages**.
4. Under *Source*, choose **Deploy from a branch**, set branch to `main` and
   folder to **`/docs`**, then Save.
5. Wait about a minute. Your site is live at
   `https://<your-username>.github.io/freeflow-finance/`

The `/docs` folder is why the site files live where they do — it is the one
layout GitHub Pages serves without any extra configuration.

---

## Automatic daily price updates

`.github/workflows/update-prices.yml` refreshes every price and chart and
rebuilds the site each weekday evening, without you touching anything.

**Setup (one time):**

1. Sign up at [finnhub.io](https://finnhub.io) and copy your free API key.
   Optionally do the same at [twelvedata.com](https://twelvedata.com).
2. In your repo: **Settings → Secrets and variables → Actions → New repository
   secret**. Add `FINNHUB_API_KEY` (and `TWELVEDATA_API_KEY` if you have one).
3. Go to the **Actions** tab and enable workflows if prompted.

**When it runs** (times are New York):

| Run       | Time     | What it does                                              |
| --------- | -------- | --------------------------------------------------------- |
| Main      | 5:23pm   | Fetches prices and a year of charts, rebuilds, commits    |
| Backup    | 7:47pm   | Only does anything if the main run didn't land            |
| Last try  | 11:13pm  | Same, and turns the run **red** if the site is still behind |

GitHub sometimes delays or drops scheduled runs when it is busy, which is why
there are three. A backup that finds today's close already on the site stops
in about thirty seconds. A red run means the site is behind, and GitHub emails
you about failed scheduled runs, so staleness can no longer go unnoticed.

You can also run it by hand: **Actions → Update prices and rebuild site → Run
workflow**. A manual run always does the full update.

**How a price gets onto the page:**

1. `fetch_prices.py` gets one quote per company (Finnhub → Twelve Data → Yahoo).
2. `fetch_history.py` re-downloads a full year of daily closes for every
   company from Yahoo (Twelve Data as backup), every run. Where both fail, it
   adds that day's quote to the existing chart, properly dated.
3. `build.py` sets each price to the chart's last close, so the price and the
   chart beside it always agree, and dates the site by those closes.
4. `check_freshness.py` confirms the site shows the latest market close.

**Tests:** `python pipeline_test.py` (update pipeline, no network needed) and
`python crash_test.py` (valuation engine).

### Why prices aren't fetched in the browser

Finnhub allows browser requests, but that would put your API key in the page
source where anyone could copy it and burn through your quota. Fetching on a
schedule in GitHub Actions keeps the key in encrypted Secrets, and has the
bonus that the site stays a plain static file that loads instantly.

### Running it locally

```bash
export FINNHUB_API_KEY=your_key_here    # macOS / Linux
python fetch_prices.py
python fetch_history.py                 # --test checks the sources and exits
python build.py
python check_freshness.py               # is the site on the latest close?
```

---

## Price charts

Each company page shows up to a year of daily closes, with today's DCF fair
value as a gold dashed line and a bracket at the right edge showing the gap
between the two (green for upside, red for downside). Drag or hover to read any
day's close; ranges from one month to a year. Foreign listings (LVMH, L'Oréal,
Nestlé, Siemens, Samsung, Reliance) come from Yahoo using exchange suffixes and
are converted to US dollars, see `FOREIGN` in `fetch_history.py`.

---

## What updates automatically, and what doesn't

**Every weekday:**
- All share prices (Finnhub)
- Every rating and upside percentage, since those derive from price

**Every Monday, and on any manual run:**
- Revenue, share count and net debt for all 200 companies (`fetch_fundamentals.py`)

Run `python fetch_fundamentals.py --dry-run` before trusting it. That prints
every figure the feed disagrees with by more than 5x and would refuse to apply,
which is the fastest way to spot a units problem or a bad response.

**Search visibility**

`seo_pages.py` writes a real HTML file per company and sector at build time:

```
docs/company/NVDA/index.html   ->  /company/NVDA/
docs/sector/semis/index.html   ->  /sector/semis/
docs/sitemap.xml
docs/robots.txt
```

The app routes on the URL fragment (`/#/company/NVDA`). Everything after `#`
is a pointer within one document, so search engines see a single page rather
than 234. These static files carry the research as real markup, plus title,
description, canonical URL, Open Graph tags and JSON-LD.

**Set `SITE_URL` in `seo_pages.py` to your real domain before publishing.**
A canonical pointing at the wrong host tells Google to index elsewhere.

After deploying, submit the sitemap in Google Search Console. Indexing usually
takes one to three weeks to start showing traffic.

**Crash testing**

`crash_test.py` runs 42 adversarial checks against the recalibration engine:
hostile values, wrong types, extreme growth, rate shocks, corrupt files,
partial data, unknown tickers, and repeated runs to catch drift. Run it after
any change to `build.py` or `engine.py`:

```
python crash_test.py
```

It found three real bugs during development: a 1e12 revenue producing a $2.4m
per-share fair value, NaN propagating silently into published valuations, and a
bear case printing above the base case when the year-five margin was under 1%.

**Automatic model recalibration:**
- **WACC** moves with the ten-year Treasury yield (fetched as `^TNX`). Each
  company keeps its own risk premium; only the common base rate moves, so the
  relative risk ranking between companies is preserved.
- **Starting FCF margin** is rebased to reported free cash flow over reported
  revenue.
- Both run through guard rails: anything moving more than 15 percentage points,
  or producing a WACC below terminal growth, is reported and rejected.

Falling rates raise every fair value in the library. That is arithmetic, not an
improvement in the businesses — the methodology page states this explicitly.

**Manual, by design:**
- **Growth rates, margins, WACC, terminal growth.** These are your analysis.
  They should change when you revisit a company, not when a feed updates. Fair
  values are meant to be stable; only price should move day to day.
- **Everything written in prose** — the thesis, risks, catalysts and street
  view. No feed can write those.



**Automatic, every run:**

- All 100 share prices (Finnhub)
- S&P 500, Nasdaq, VIX, Brent crude, 10-year Treasury yield (`market.json`)
- The "Data as of" date on the homepage, restamped from the freshest figure
- Every rating and upside percentage, since those derive from price

**Manual, by design:**

- **Fed funds target** — a policy rate the Fed sets at its meetings, not
  something that trades. There's no price to look up. Update it in `META` in
  `build.py` after an FOMC decision, roughly eight times a year.
- **Your DCF assumptions** — revenue growth, margins, WACC, terminal growth.
  These are your analysis and should change when you revisit a company, not
  daily. Fair values are supposed to be stable; only the price should move.

---

## The three tools

**Stock screener** (`#/screener`) — filter all 100 companies on sector, rating,
minimum upside, market cap, EV/Sales, FCF yield, or net-cash-only, then sort by
any column. Everything runs client-side over the same model output, so the
comparisons are consistent.

**Portfolio tracker** (`#/portfolio`) — add holdings with share count and cost
basis. Shows the usual profit-and-loss plus something a normal tracker can't:
the portfolio valued at *your own DCF fair values*, and its weighted upside.
Positions are stored in the visitor's browser via `localStorage` — nothing is
sent anywhere, because there is no server. Clearing browser data clears them.

**Market map** (`#/map`, and a band on the homepage; `docs/map.js`) — every company
as one tile in a squarified treemap, grouped by sector. Area is market value, colour
is the gap between price and fair value under whichever model is selected (it can also
show the 1-day, 1-month and 1-year price move). Hover for the numbers, click to open
the company; on a phone each sector gets its own full-width block and the first tap
shows the numbers. The green and red are shifted toward teal and coral on purpose: the
site's standard pair is nearly indistinguishable to red-green colour-blind readers, and
on a map colour carries the whole message. `node map_test.js` checks the layout (areas
proportional, nothing overlapping, everything inside its sector) on the real library.

**The Daily Ten** (`#/play`, `docs/play.js`) — ten companies a day, the same ten for
everyone: is each priced below or above our DCF fair value? The player sees an
analyst's starting clues (growth, cash margin, price against sales and against the
sector), makes the call, and gets the model's answer and one line of why. Scores,
streaks and a spoiler-free share text; a practice mode that does not touch the streak.
The set is seeded from the date, skips anything within 10% of fair value, and always
holds between three and seven undervalued names so one-note guessing loses. Saved in
the visitor's browser only. `node play_test.js` pins those rules down over a year of days.

**Compare** (`#/compare/NVDA/AMD`, `docs/compare.js`) — two companies through the
identical model: a short answer in sentences (which the model prefers, who grows
faster, who is more profitable, what each costs), both share prices from a common start
of 100, and the inputs side by side. One ticker in the address picks its closest peer.
Every company page has a Compare button. `node compare_test.js`.

**Glossary** (`#/learn`, `docs/glossary.js`) — the first time a term of art (WACC, free
cash flow, EV / Sales...) appears in a section it gets a faint dotted underline; hover,
focus or tap for a two-sentence card. Never inside links, buttons, headings, charts or
table bodies, and a switch on the glossary page turns it off. To add a term, add an
entry to `GLOSSARY`. `node glossary_test.js`.

**Monte Carlo simulation** (bottom of the Portfolio page, `docs/montecarlo.js`) —
plays out thousands of possible futures for the portfolio and draws them as a fan
(a 5th-to-95th percentile band, the middle half, the median), with the chance of
ending lower, the chance of a 20% fall along the way, the average of the worst
1-in-20 outcomes, and which holding the risk really comes from. How it works:

- Daily returns for every holding come from the last year of closes in `history.js`
  (days matched across holdings; a holding with under 60 days is stood in for by the
  S&P 500, and the page says so).
- The co-movement table is shrunk toward a constant-correlation matrix with the
  Ledoit-Wolf (2004) intensity, because one year of data cannot pin down a 20-by-20
  table. Paths are simulated monthly with correlated normal shocks ("Bell curve") or
  by reshuffling real month-long windows of the past year ("Replay").
- Every stock is given the same assumed return, 8% a year (`DEFAULTS.baseDrift`),
  and the shocks are calibrated so the simulated average equals it exactly. The past
  year's own average return is deliberately not used.
- The dashed gold line is a scenario, not a forecast: the same futures with each stock
  also drifting toward our fair value, half the gap over three years, at most 10% a year.
- The random numbers are seeded from the tickers, so a portfolio shows the same picture
  on every visit; "Run it again" changes the seed.

`node montecarlo_test.js` checks the engine against cases with known answers (a
single stock against the lognormal formulas, independent stocks against vol/sqrt(2),
the drift calibration, shrinkage against a known covariance, seeds, edge cases) and
is also run by `pipeline_test.py`.

**Financial analysis** (a tab on every company page) — margin quality, leverage,
capital structure, common-size revenue, and where each metric ranks against its
own sector. Deliberately *not* a fabricated three-statement model: this library
doesn't hold filed income statements for 100 companies, and inventing them would
be worse than useless. Every figure traces to a model input or a market price.

---

## Adding a new company

1. Open the right file in `companies/` (or create a new one).
2. Copy an existing entry and edit it. The fields, in order:

```python
C("TICK", "Company Name Inc.", "semis",         # ticker, name, sector key
  "City, Country", 1998, "CEO Name", "Nasdaq",  # HQ, founded, CEO, exchange
  145.00,      # current share price ($)
  2.50,        # diluted shares outstanding (billions)
  -12.0,       # net debt ($B) — NEGATIVE means net cash
  48.0,        # trailing twelve month revenue ($B)
  [0.18, 0.15, 0.12, 0.10, 0.08],   # revenue growth, years 1-5 (exactly 5)
  0.22,        # current free cash flow margin
  0.26,        # target FCF margin by year 5
  0.095,       # WACC (discount rate) — must be above terminal growth
  0.028,       # terminal growth rate
  "One paragraph on founding, leadership, and what they actually sell.",
  [("Segment A", 60), ("Segment B", 40)],        # revenue mix, sums to ~100
  ["Bull point one.", "Bull point two.", "Bull point three."],
  ["Risk one.", "Risk two.", "Risk three."],
  "What the Street broadly thinks and where the debate sits.",
  "Catalyst one, catalyst two, catalyst three.",
  (4, 5, 4, 5)),   # scores 1-5: quality, growth, balance sheet, moat
```

3. If you created a new file, import it in `load_companies()` in `build.py`.
4. Run `python build.py`. Validation will tell you plainly if anything is wrong
   — duplicate tickers, an unknown sector, the wrong number of growth values,
   a WACC below terminal growth, or segments that don't sum to ~100%.
5. Add the ticker to `SKIP` in `fetch_prices.py` if it isn't US-listed.

Sector keys: `semis`, `software`, `health`, `financials`, `consumer`,
`energy`, `industrials`, `autos`, `global`, `frontier`.

To add a whole new sector, append an entry to the `SECTORS` list in `build.py`
and add a matching icon to `SECTOR_ICONS` in `docs/charts.js`.

---

## Keeping the model honest

A few things worth revisiting periodically, since prices update automatically
but judgement does not:

- **The "as of" date.** Update `META` in `build.py` when you refresh the market
  context figures (risk-free rate, Brent, index levels) shown on the homepage.
- **Your assumptions.** Prices move daily; revenue and margin forecasts should
  be revisited after earnings, not left for a year.
- **Fair values are supposed to be stable.** Only the price should move day to
  day. Since upside is `fair value ÷ price`, ratings update on their own while
  your targets hold until you deliberately revise a model. That is how real
  research desks work.

---

## Methodology

Two-stage unlevered DCF, applied identically to every company:

1. **Years 1–5** — explicit revenue forecast, with the FCF margin gliding from
   today's level to a year-5 target.
2. **Years 6–10** — growth fades in a straight line to the terminal rate.
3. **Discounting** — mid-year convention, at each company's WACC.
4. **Terminal value** — Gordon Growth on year-10 free cash flow.
5. **Equity bridge** — subtract net debt, divide by diluted shares.
6. **Rating** — assigned mechanically from upside, with fixed thresholds:
   Strong Buy ≥ +30%, Buy +12% to +30%, Hold −12% to +12%,
   Reduce −30% to −12%, Sell < −30%.

Banks use a simplified variant — net revenue as the top line, distributable net
income as the margin, net debt set to zero — because a conventional FCF DCF
breaks when debt is the raw material rather than the financing. This is flagged
on the Financials sector page and in every bank's comps table.

## File map

| Path                  | What it is                                  |
| --------------------- | ------------------------------------------- |
| `engine.py`           | The DCF math: projection, discounting, scenarios, sensitivity grid |
| `build.py`            | Loads companies, validates, runs the model, writes `docs/data.js` |
| `fetch_prices.py`     | Pulls live quotes from Finnhub into `prices.json` |
| `fetch_history.py`    | Builds chart history from Stooq into `docs/history.js` |
| `companies/`          | Your assumptions, one file per sector group |
| `docs/index.html`     | Page shell, header, footer, disclaimer      |
| `docs/styles.css`     | Design system                                |
| `docs/charts.js`      | Hand-built SVG charts and formatters        |
| `docs/views.js`       | Page renderers                               |
| `docs/app.js`         | Router, search, table sorting, tabs         |
| `docs/data.js`        | Generated — do not edit by hand             |
| `docs/history.js`     | Generated — price history for the charts    |
