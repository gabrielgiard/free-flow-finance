# Publishing FreeFlow Finance — step by step

No prior GitHub experience needed. Read one step, do it, move on.
Total time: about 20 minutes.

You do NOT need to install Python or anything else. Everything runs on
GitHub's computers.

---

## Part 1 — Get the site online (10 minutes)

### Step 1. Make a GitHub account
Go to **github.com/signup**. Use an email you check. Pick a username you
don't mind people seeing — it becomes part of your web address.

### Step 2. Unzip the file
Double-click `freeflow-finance-repo.zip`. You'll get a folder with these
items inside:

    companies/     docs/     .github/
    build.py       engine.py     fetch_prices.py
    README.md      .gitignore

### Step 3. Make the folder show hidden files
`.github` starts with a dot, so your computer hides it by default.

- **Mac:** open the folder, press **Command + Shift + .** (period)
- **Windows:** in the folder, click **View** → **Show** → **Hidden items**

You should now see `.github` appear. If it doesn't, don't worry — Step 8
covers it.

### Step 4. Create the repository
1. On GitHub, click the **+** in the top-right corner → **New repository**
2. Repository name: `freeflow-finance`
3. Select **Public** (required — Pages is only free on public repos)
4. Leave every checkbox unticked
5. Click **Create repository**

### Step 5. Upload your files
On the new empty page, click the link **"uploading an existing file"**.

Open your unzipped folder, select **everything inside it** (Command+A on
Mac, Ctrl+A on Windows), and drag it all onto the GitHub page.

⚠️ Drag the *contents*, not the folder itself. GitHub should list
`build.py`, `engine.py`, `companies`, `docs` and so on — not one single
folder name.

Wait for the uploads to finish, then click **Commit changes** at the bottom.

### Step 6. Turn on GitHub Pages
1. Click **Settings** (top of your repository)
2. Click **Pages** in the left sidebar
3. Under *Source*, choose **Deploy from a branch**
4. Branch: **main** — Folder: **/docs** — click **Save**

### Step 7. Visit your website
Wait about a minute, then refresh the Pages settings screen. A green box
appears with your address:

    https://YOUR-USERNAME.github.io/freeflow-finance/

**That's your website. It's live. Send it to people.**

If you see a 404, wait two more minutes and refresh — the first build is
the slow one.

---

## Part 2 — Make prices update automatically (10 minutes)

Optional. Your site works fine without this — prices just stay frozen at
22 July 2026 until you update them yourself.

### Step 8. Check the workflow file uploaded
In your repository, look for a folder called `.github`.

**If you see it:** skip to Step 9.

**If it's missing**, create it manually:
1. Click **Add file** → **Create new file**
2. In the filename box, type exactly:
   `.github/workflows/update-prices.yml`
   (typing the slashes creates the folders automatically)
3. Open `update-prices.yml` from your unzipped folder in TextEdit or
   Notepad, copy everything, paste it into the big box on GitHub
4. Click **Commit changes**

### Step 9. Get a free Finnhub key
1. Go to **finnhub.io** and sign up (free, email only)
2. On your dashboard, copy the **API key** — a long string of letters
   and numbers

### Step 10. Store the key safely on GitHub
1. In your repository: **Settings** → **Secrets and variables** →
   **Actions**
2. Click **New repository secret**
3. Name: `FINNHUB_API_KEY` — typed exactly like that, capitals included
4. Secret: paste your key
5. Click **Add secret**

This keeps your key private. Never paste it into a file.

### Step 11. Test it now
Don't wait for the overnight run — check it works:

1. Click the **Actions** tab
2. If asked to enable workflows, click the green button
3. Click **Update prices and rebuild site** in the left sidebar
4. Click **Run workflow** → **Run workflow**
5. Wait ~2 minutes and refresh

**Green tick** = working. It now runs itself every weekday after the US
market closes, and your site updates on its own.

**Red X** = click into it to see the error. Usually the secret name is
misspelled — it must be exactly `FINNHUB_API_KEY`.

### Step 12. About the charts
Company pages have a price chart with your fair value drawn across it. It
won't be there on day one, and that's normal.

Every run of the workflow records that day's closing price. After two or
three weeks of daily runs you'll have a readable chart, and it keeps
growing from there. The workflow also tries a free service called Stooq
that can fill in a year of history all at once — if that works you'll see
full charts almost immediately, but it isn't guaranteed and nothing
depends on it.

Until then each page says *"Price chart is still gathering data."* and
everything else — the valuation, the model, the comparables — works
normally. You don't need to do anything.

---

## Common problems

**"404 — There isn't a GitHub Pages site here"**
Pages isn't pointed at `/docs`. Redo Step 6 and check the folder
dropdown says `/docs`, not `/ (root)`.

**Site loads but is blank or says "Loading coverage universe…"**
`docs/data.js` didn't upload. Open the `docs` folder on GitHub — you
should see six files including `data.js` at around 344 KB. If it's
missing, upload it on its own.

**The workflow emails me that it failed**
Harmless — your site keeps working on the last good prices. Either fix
the API key (Step 10) or switch the workflow off: Actions tab → select
the workflow → **⋯** → **Disable workflow**.

**Charts are empty**
Expected at first — see Step 12. They fill in as the daily job runs. This
is not a fault and needs no fixing.

**Everything worked but prices look unchanged**
Normal on weekends and holidays. Also, eight non-US companies (LVMH,
L'Oréal, Nestlé, Siemens, Samsung, Reliance, Tencent, BYD) are not
covered by Finnhub's free tier and keep their stored prices on purpose.

---

## Changing things later

**Edit any file:** click it on GitHub, click the pencil icon, edit,
click Commit changes. Your site rebuilds in about a minute.

**Add a company:** see the "Adding a new company" section of `README.md`.
There's an annotated template with every field explained.

**Update the market context** (the numbers along the top of the
homepage): edit `build.py`, find the `META` block near the top, change
the figures and the `asof` date.

**Change how often prices update:** edit
`.github/workflows/update-prices.yml` and change the `cron` line.
`30 22 * * MON-FRI` is every weekday; `30 22 * * MON,WED,FRI` is every
other day.

---

## One habit worth keeping

The site carries a disclaimer saying it's educational and not investment
advice. Leave it there. Real research firms carry longer ones — it's a
mark of doing this properly, not an apology.
