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

`.github/workflows/update-prices.yml` refreshes prices and rebuilds the site on
a schedule, without you touching anything.

**Setup (one time):**

1. Sign up at [finnhub.io](https://finnhub.io) and copy your free API key.
2. In your repo: **Settings → Secrets and variables → Actions → New repository
   secret**.
3. Name it exactly `FINNHUB_API_KEY` and paste the key as the value.
4. Go to the **Actions** tab and enable workflows if prompted.

It now runs at 22:30 UTC every weekday (just after the US close), commits the
new prices, and GitHub Pages redeploys automatically.

**To change the frequency**, edit the `cron` line in the workflow:

| Schedule            | cron line                     |
| ------------------- | ----------------------------- |
| Every weekday       | `30 22 * * MON-FRI`           |
| Every other weekday | `30 22 * * MON,WED,FRI`       |
| Weekly (Fridays)    | `30 22 * * FRI`               |

You can also trigger a run by hand any time from the **Actions** tab →
*Update prices and rebuild site* → **Run workflow**.

### Why prices aren't fetched in the browser

Finnhub allows browser requests, but that would put your API key in the page
source where anyone could copy it and burn through your quota. Fetching on a
schedule in GitHub Actions keeps the key in encrypted Secrets, and has the
bonus that the site stays a plain static file that loads instantly.

### Running the fetch locally

```bash
export FINNHUB_API_KEY=your_key_here    # macOS / Linux
python fetch_prices.py
python build.py
```

### A note on coverage

Finnhub's free tier covers US-listed stocks, including ADRs — that is 92 of the
100 companies here. Eight names trade on foreign exchanges that need a paid
plan, so they are listed in `SKIP` at the top of `fetch_prices.py` and keep
their hardcoded prices: LVMH, L'Oréal, Nestlé, Siemens, Samsung, Reliance,
Tencent and BYD. If you upgrade, remove them from `SKIP` and add their Finnhub
symbols to `SYMBOL_MAP`.

---

## Price charts

Each company page shows a year of daily closes with your DCF fair value drawn
across it as a gold dashed line — so you can see at a glance whether the market
is trading above or below your target, and how that gap has moved. The homepage
market strip carries 90-day sparklines for the S&P, Nasdaq, VIX and Brent.

```bash
python fetch_history.py           # backfill a year, then append today
python fetch_history.py --test    # check 3 symbols and exit
python fetch_history.py --no-backfill   # append today only, skip Stooq
```

**Two sources, in this order of reliability:**

**Homepage market levels — FRED.** The S&P 500, Nasdaq, VIX, Brent crude and
10-year Treasury figures (and the sparklines under them) come from FRED, the
Federal Reserve Bank of St. Louis. No API key, official government source,
series IDs are listed in `FRED_SERIES` in `fetch_history.py`.

**Company price charts — two sources:**

1. **Accumulate from `prices.json`** — every scheduled run appends that day's
   close. This is the dependable path: it reuses the same free Finnhub quotes
   that already power the site. It starts empty and fills out a day at a time,
   so a chart becomes readable after two or three weeks of runs.
2. **Backfill from Stooq** (stooq.com) — *currently not working.* As of July
   2026 it returns "no data" for every symbol, so the year-of-history backfill
   fails and the accumulator does all the work. The code still tries it in case
   the service returns; it can't break anything if it doesn't. Run
   `python fetch_history.py --test` to check both sources.

**Why not Finnhub for history:** their `/stock/candle` endpoint was moved to the
premium tiers and returns 403 on a free key. Quotes are free; candles are not.

**Empty charts are expected at first.** Every company page works fully without
them — the valuation, comps and thesis don't depend on chart data. Six names
with foreign primary listings (LVMH, L'Oréal, Nestlé, Siemens, Samsung,
Reliance) are in `STOOQ_SKIP` and also in `fetch_prices.py`'s `SKIP`, so their
charts stay empty until you add a data source that covers those exchanges.

Run `python fetch_history.py --test` to check whether Stooq still responds.

---

## What updates automatically, and what doesn't

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
