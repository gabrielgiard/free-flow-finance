/* FreeFlow Finance — downloadable Excel model, one company at a time.

   The workbook rebuilds the website's own DCF in live Excel formulas, so a
   reader can change any assumption and watch the value move, and can check
   every number the site prints. It follows the structure of a banking DCF:
   scenario blocks for bear, base and bull with a case selector, a ten-year
   projection discounted with the mid-year convention, a Gordon-growth
   terminal value, the bridge from enterprise value to value per share, and
   three sensitivity tables in which every cell recomputes the whole DCF.

   Sheets
     DCF        the model, with the sensitivity tables at the bottom
     WACC       a CAPM cross-check of the discount rate (switchable)
     Comps      the peer set with operating metrics, multiples and quartiles
     Workings   the cash-flow paths the sensitivity tables discount
     Notes      sources, method and the colour key

   Colour key: blue text = an input, black = a formula, green = a link to
   another sheet. Inputs sit on light grey; the answer sits on mid blue.

   The builder is pure (it is handed ExcelJS and the data), so the same code
   runs in the browser and in xlsx_test.js, which recalculates the files in
   LibreOffice and checks them against the site's own numbers. ExcelJS is
   loaded from the CDN only when someone clicks the download button. */

const FF_XLSX = (() => {
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  const RF = 0.0515, RF_NOTE = 'Source: 10-year US Treasury constant-maturity yield, 5.15% on 13 Nov 2026 (ycharts.com, I:10YTCMR). Update to today\'s yield.';
  const ERP = 0.055;
  const COL = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];   // B = latest, C..L = years 1..10
  const YR = n => COL[n];                                                  // year n (1..10) -> column letter

  // ----------------------------------------------------------- styling ---
  const BLUE = 'FF0000FF', BLACK = 'FF000000', GREEN = 'FF008000', WHITE = 'FFFFFFFF';
  const F_HDR = 'FF1F4E79', F_SUB = 'FFD9E1F2', F_IN = 'FFF2F2F2', F_OUT = 'FFBDD7EE';
  const fill = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
  const thin = { style: 'thin', color: { argb: 'FFA6A6A6' } };
  const med = { style: 'medium', color: { argb: 'FF1F4E79' } };

  function S(ws) {
    const put = (addr, v, o = {}) => {
      const cell = ws.getCell(addr);
      cell.value = typeof v === 'string' && v.startsWith('=') ? { formula: v.slice(1) } : v;
      const kind = o.kind || (typeof v === 'string' && v.startsWith('=') ? (v.includes('!') ? 'link' : 'calc') : (typeof v === 'number' ? 'input' : 'text'));
      const color = kind === 'input' ? BLUE : kind === 'link' ? GREEN : BLACK;
      cell.font = { name: 'Calibri', size: 11, color: { argb: o.color || color }, bold: !!o.bold, italic: !!o.italic };
      if (kind === 'input' && !o.nofill) cell.fill = fill(F_IN);
      if (o.fill) cell.fill = fill(o.fill);
      if (o.fmt) cell.numFmt = o.fmt;
      if (o.note) cell.note = o.note;
      if (o.align) cell.alignment = { horizontal: o.align, vertical: 'middle', wrapText: !!o.wrap };
      else if (o.wrap) cell.alignment = { wrapText: true, vertical: 'top' };
      return cell;
    };
    const header = (row, text, from = 'A', to = 'L') => {
      put(`${from}${row}`, text, { kind: 'text', color: WHITE, bold: true, fill: F_HDR });
      if (from !== to) ws.mergeCells(`${from}${row}:${to}${row}`);
      ws.getRow(row).height = 20;
    };
    const sub = (row, labels, from = 0, wrap = false) => {      // light-blue column header row
      labels.forEach((l, i) => {
        const col = String.fromCharCode(65 + from + i);
        put(`${col}${row}`, l, { kind: 'text', bold: true, fill: F_SUB, align: i ? 'center' : 'left', wrap });
      });
      if (wrap) ws.getRow(row).height = 32;
    };
    const box = (r1, r2, c1 = 'A', c2 = 'L') => {   // medium border around a section
      const a = c1.charCodeAt(0), b = c2.charCodeAt(0);
      for (let r = r1; r <= r2; r++) for (let k = a; k <= b; k++) {
        const cell = ws.getCell(`${String.fromCharCode(k)}${r}`);
        const bd = Object.assign({}, cell.border || {});
        if (r === r1) bd.top = med; if (r === r2) bd.bottom = med;
        if (k === a) bd.left = med; if (k === b) bd.right = med;
        cell.border = bd;
      }
    };
    return { put, header, sub, box };
  }

  const PCT = '0.0%;(0.0%);"-"', PCT2 = '0.00%', PS = '$#,##0.00;($#,##0.00);"-"', X = '0.0"x";(0.0"x");"-"';
  const money = rev => rev < 1 ? '#,##0.000;(#,##0.000);"-"' : rev < 20 ? '#,##0.00;(#,##0.00);"-"' : '#,##0.0;(#,##0.0);"-"';

  function caseInputs(c) {
    // Exactly the scenario rules of engine.scenarios() and FF_ENGINE.scenarios().
    const bearM1 = Math.min(c.m1, Math.max(c.m1 - 0.020, 0));
    const bullW = c.wacc - 0.005;
    return {
      bear: { g: c.growth.map(g => g - 0.030), m1: bearM1, w: c.wacc + 0.005, tg: Math.max(c.tg - 0.005, 0) },
      base: { g: c.growth.slice(), m1: c.m1, w: c.wacc, tg: c.tg },
      bull: { g: c.growth.map(g => g + 0.030), m1: c.m1 + 0.020, w: bullW, tg: Math.min(c.tg + 0.0025, bullW - 0.005) },
    };
  }

  function stamp(ctx) {
    const d = ctx.date ? new Date(ctx.date) : new Date();
    return isNaN(d) ? String(ctx.date || '') : d.toISOString().slice(0, 10);
  }

  // ================================================================ DCF ===
  function sheetDCF(wb, c, ctx) {
    const ws = wb.addWorksheet('DCF', { views: [{ state: 'frozen', xSplit: 1, ySplit: 3, showGridLines: false }] });
    const { put, header, sub, box } = S(ws);
    const M = money(c.rev);
    ws.getColumn('A').width = 46;
    COL.forEach(k => { ws.getColumn(k).width = 13; });
    const src = ctx.source || 'FreeFlow Finance data file';
    const day = stamp(ctx);

    put('A1', `${c.n} (${c.t}) — Discounted Cash Flow Model`, { kind: 'text', bold: true, color: WHITE, fill: F_HDR });
    ws.mergeCells('A1:L1'); ws.getRow(1).height = 24; ws.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: WHITE } };
    put('A2', `${ctx.sectorName || c.sec} · Prices as of ${c.pd || day} · US$ billions except per-share figures · Built from free-flow-finance.pages.dev on ${day}`, { kind: 'text', italic: true });
    ws.mergeCells('A2:L2');
    put('A3', 'Blue = input you can change · Black = formula · Green = link to another sheet · Mid-blue = the answer', { kind: 'text', italic: true, color: 'FF595959' });
    ws.mergeCells('A3:L3');

    put('A5', 'Scenario  (1 = Bear, 2 = Base, 3 = Bull)', { kind: 'text', bold: true });
    put('B5', ctx.scenario || 2, { fmt: '0', align: 'center', note: 'Pick 1, 2 or 3. Every assumption in the "Selected case" block switches to that scenario.' });
    ws.getCell('B5').dataValidation = { type: 'list', allowBlank: false, formulae: ['"1,2,3"'] };
    put('C5', '=CHOOSE($B$5,"Bear","Base","Bull")', { bold: true });
    put('A6', 'Discount rate  (1 = FreeFlow, 2 = CAPM)', { kind: 'text', bold: true });
    put('B6', ctx.rate || 1, { fmt: '0', align: 'center', note: 'FreeFlow sets each company\'s discount rate from its risk profile. Choose 2 to use the CAPM build on the WACC sheet instead.' });
    ws.getCell('B6').dataValidation = { type: 'list', allowBlank: false, formulae: ['"1,2"'] };
    put('C6', '=CHOOSE($B$6,"FreeFlow rate","CAPM")', { bold: true });
    box(5, 6, 'A', 'C');

    // ---- market data
    header(8, 'MARKET DATA & STARTING POINT');
    put('A9', 'Share price ($)', { kind: 'text' });
    put('B9', c.price, { fmt: PS, note: `Source: ${src}, last close${c.pd ? ' ' + c.pd : ''}. The website refreshes it every market day.` });
    put('A10', 'Diluted shares outstanding (billions)', { kind: 'text' });
    put('B10', c.shares, { fmt: '#,##0.000', note: `Source: ${src}; refreshed weekly from company filings via Finnhub.` });
    put('A11', 'Market value of equity', { kind: 'text' }); put('B11', '=B9*B10', { fmt: M });
    put('A12', 'Net debt (negative = net cash)', { kind: 'text' });
    put('B12', c.netdebt, { fmt: M, note: `Source: ${src}. Total debt less cash and short-term investments, US$ billions.${c.sec === 'financials' ? ' Banks and insurers are valued on equity, so their deposits and operating debt are not netted here.' : ''}` });
    put('A13', 'Enterprise value at market', { kind: 'text' }); put('B13', '=B11+B12', { fmt: M });
    put('A14', 'Revenue, last twelve months', { kind: 'text' });
    put('B14', c.rev, { fmt: M, note: `Source: ${src}; trailing twelve months, refreshed weekly from company filings via Finnhub.` });
    put('A15', 'Free cash flow margin today (starting point)', { kind: 'text' });
    put('B15', c.m0, { fmt: PCT, note: 'Source: FreeFlow model input, recalibrated weekly from reported free cash flow (operating cash flow less capital spending) over revenue.' });
    put('A16', 'Free cash flow, last twelve months', { kind: 'text' }); put('B16', '=B14*B15', { fmt: M });
    box(8, 16);

    // ---- scenario blocks
    header(18, 'SCENARIO ASSUMPTIONS (years 1–5; years 6–10 fade automatically)');
    const ci = caseInputs(c);
    const blocks = [['bear', 'BEAR CASE', 19], ['base', 'BASE CASE', 26], ['bull', 'BULL CASE', 33]];
    const why = {
      bear: 'Bear case: revenue growth 3 points lower each year, year-5 margin 2 points lower, discount rate 0.5 point higher, terminal growth 0.5 point lower. Same rules as the website.',
      base: 'Base case: the FreeFlow model\'s own assumptions for this company.',
      bull: 'Bull case: revenue growth 3 points higher each year, year-5 margin 2 points higher, discount rate 0.5 point lower, terminal growth 0.25 point higher (kept at least 0.5 point below the discount rate). Same rules as the website.',
    };
    for (const [k, title, r] of blocks) {
      put(`A${r}`, title, { kind: 'text', bold: true, fill: F_SUB });
      ws.mergeCells(`A${r}:G${r}`);
      sub(r + 1, ['Assumption', '', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']);
      put(`A${r + 2}`, 'Revenue growth', { kind: 'text' });
      ci[k].g.forEach((g, i) => put(`${YR(i + 1)}${r + 2}`, g, { fmt: PCT, note: i === 0 ? why[k] : undefined }));
      put(`A${r + 3}`, 'Free cash flow margin reached in year 5', { kind: 'text' });
      put(`G${r + 3}`, ci[k].m1, { fmt: PCT, note: 'The margin glides in a straight line from today\'s level to this one over five years, then holds.' });
      put(`A${r + 4}`, 'Discount rate (WACC)', { kind: 'text' });
      put(`C${r + 4}`, ci[k].w, { fmt: PCT, note: k === 'base' ? 'Source: FreeFlow model input. Set per company from its risk profile; see the WACC sheet for a CAPM cross-check.' : undefined });
      put(`A${r + 5}`, 'Terminal growth rate (after year 10)', { kind: 'text' });
      put(`C${r + 5}`, ci[k].tg, { fmt: PCT, note: k === 'base' ? 'Source: FreeFlow model input. Long-run growth after year 10; should not exceed long-run nominal GDP growth.' : undefined });
      box(r, r + 5, 'A', 'G');
    }

    // ---- consolidation column: the selected case
    put('A40', 'SELECTED CASE (feeds the model)', { kind: 'text', bold: true, color: WHITE, fill: F_HDR });
    ws.mergeCells('A40:G40');
    put('H40', '=C5&" case"', { bold: true });
    sub(41, ['Assumption', '', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']);
    put('A42', 'Revenue growth', { kind: 'text' });
    for (let i = 1; i <= 5; i++) { const k = YR(i); put(`${k}42`, `=CHOOSE($B$5,${k}21,${k}28,${k}35)`, { fmt: PCT }); }
    put('A43', 'Free cash flow margin reached in year 5', { kind: 'text' }); put('G43', '=CHOOSE($B$5,G22,G29,G36)', { fmt: PCT });
    put('A44', 'Discount rate, FreeFlow', { kind: 'text' }); put('C44', '=CHOOSE($B$5,C23,C30,C37)', { fmt: PCT });
    put('A45', 'Terminal growth rate', { kind: 'text' }); put('C45', '=CHOOSE($B$5,C24,C31,C38)', { fmt: PCT });
    put('A46', 'Discount rate used (FreeFlow or CAPM, per cell B6)', { kind: 'text' });
    put('C46', '=IF($B$6=2,WACC!$B$23,C44)', { fmt: PCT, kind: 'link' });
    put('A47', 'Discount rate applied (≥ terminal growth + 1 point)', { kind: 'text' });
    put('C47', '=MAX(C46,C45+0.01)', { fmt: PCT, note: 'Guard rail shared with the website: if the discount rate came within 1 point of terminal growth, the Gordon formula would explode.' });
    box(40, 47, 'A', 'H');

    // ---- projection
    header(49, 'TEN-YEAR CASH FLOW PROJECTION (US$ billions)');
    sub(50, ['', 'Latest', ...Array.from({ length: 10 }, (_, i) => `Year ${i + 1}`)]);
    put('A51', 'Stage', { kind: 'text', italic: true });
    for (let n = 1; n <= 10; n++) put(`${YR(n)}51`, n <= 5 ? 'Explicit' : 'Fade', { kind: 'text', italic: true, align: 'center' });
    put('A52', 'Revenue growth', { kind: 'text' });
    put('A53', 'Revenue', { kind: 'text', bold: true });
    put('A54', 'Free cash flow margin', { kind: 'text' });
    put('A55', 'Free cash flow', { kind: 'text', bold: true });
    put('A56', 'Discount period (mid-year convention)', { kind: 'text' });
    put('A57', 'Discount factor', { kind: 'text' });
    put('A58', 'Present value of free cash flow', { kind: 'text', bold: true });
    put('B53', '=B14', { fmt: M });
    put('B54', '=B15', { fmt: PCT });
    put('B55', '=B53*B54', { fmt: M });
    for (let n = 1; n <= 10; n++) {
      const k = YR(n), p = YR(n - 1);
      put(`${k}52`, n <= 5 ? `=${k}42` : `=$G$42+($C$45-$G$42)*${n - 5}/5`, { fmt: PCT });
      put(`${k}53`, `=${p}53*(1+${k}52)`, { fmt: M, bold: true });
      put(`${k}54`, n <= 5 ? `=$B$15+($G$43-$B$15)*${n}/5` : '=$G$43', { fmt: PCT });
      put(`${k}55`, `=${k}53*${k}54`, { fmt: M, bold: true });
      if (n === 1) put('C56', 0.5, { fmt: '0.0', note: 'Mid-year convention: cash arrives through the year, so year 1 is discounted half a year, year 2 one and a half, and so on.' });
      else put(`${k}56`, `=${p}56+1`, { fmt: '0.0' });
      put(`${k}57`, `=1/(1+$C$47)^${k}56`, { fmt: '0.0000' });
      put(`${k}58`, `=${k}55*${k}57`, { fmt: M });
    }
    box(49, 58);

    // ---- terminal value
    header(60, 'TERMINAL VALUE (Gordon growth on year-10 free cash flow)');
    put('A61', 'Free cash flow in year 11', { kind: 'text' }); put('B61', '=L55*(1+C45)', { fmt: M });
    put('A62', 'Terminal value at year 10', { kind: 'text' }); put('B62', '=B61/(C47-C45)', { fmt: M });
    put('A63', 'Discount factor (period 9.5)', { kind: 'text' }); put('B63', '=1/(1+C47)^L56', { fmt: '0.0000' });
    put('A64', 'Present value of terminal value', { kind: 'text', bold: true }); put('B64', '=B62*B63', { fmt: M, bold: true });
    put('A65', 'Implied exit multiple (TV ÷ year-10 free cash flow)', { kind: 'text' }); put('B65', '=IF(L55>0,B62/L55,"n/m")', { fmt: X });
    box(60, 65);

    // ---- valuation summary
    header(67, 'VALUATION SUMMARY');
    const rows = [
      [68, 'Sum of present values, years 1–10', '=SUM(C58:L58)', M],
      [69, 'Present value of terminal value', '=B64', M],
      [70, 'Enterprise value', '=B68+B69', M, true],
      [71, 'Less: net debt', '=B12', M],
      [72, 'Equity value', '=B70-B71', M, true],
      [73, 'Diluted shares (billions)', '=B10', '#,##0.000'],
    ];
    for (const [r, l, f, fmt, b] of rows) { put(`A${r}`, l, { kind: 'text', bold: !!b }); put(`B${r}`, f, { fmt, bold: !!b }); }
    put('A74', 'IMPLIED VALUE PER SHARE', { kind: 'text', bold: true, fill: F_OUT });
    put('B74', '=B72/B73', { fmt: PS, bold: true, fill: F_OUT });
    ws.getCell('B74').font = { name: 'Calibri', size: 13, bold: true, color: { argb: BLACK } };
    put('C74', '=C5&" case"', { italic: true });
    put('A75', 'Current share price', { kind: 'text' }); put('B75', '=B9', { fmt: PS });
    put('A76', 'Upside / (downside)', { kind: 'text', bold: true }); put('B76', '=IF(B74>0,B74/B75-1,-1)', { fmt: PCT, bold: true });
    put('A77', 'Rating on the FreeFlow scale', { kind: 'text' });
    put('B77', '=IF(B74<=0,"Sell",IF(B76>=0.3,"Strong Buy",IF(B76>=0.12,"Buy",IF(B76>=-0.12,"Hold",IF(B76>=-0.3,"Reduce","Sell")))))', { bold: true, note: 'FreeFlow scale: Strong Buy ≥ +30%, Buy ≥ +12%, Hold within ±12%, Reduce down to −30%, Sell below.' });
    put('A78', 'Terminal value as a share of enterprise value', { kind: 'text' });
    put('B78', '=IF(B70>0,B69/B70,"n/m")', { fmt: PCT, note: 'Typical range 50–70%. Above 75% means most of the value depends on what happens after year 10.' });
    put('A79', 'Check: the website\'s base-case value', { kind: 'text', italic: true });
    put('B79', c.fv, { fmt: PS, note: `Source: free-flow-finance.pages.dev, ${c.t} page, base case with the FreeFlow rate, ${day}.` });
    put('C79', '=IF(AND($B$5=2,$B$6=1),ROUND(B74-B79,2),"switch to base")', { fmt: '0.00;(0.00);"-"', italic: true, note: 'With scenario 2 and the FreeFlow rate this should read "-" (no difference). The site shows the value after rounding to the cent.' });
    box(67, 79, 'A', 'C');

    // ---- sensitivity tables
    header(81, 'SENSITIVITY ANALYSIS — every cell recomputes the full ten-year DCF; the shaded centre cell is the selected case');
    const grids = [
      { r: 83, title: 'Value per share: discount rate (rows) × terminal growth (columns)', corner: 'WACC ↓  g →' },
      { r: 92, title: 'Value per share: revenue growth, change to every year (rows) × year-5 free cash flow margin (columns)', corner: 'Growth Δ ↓  margin →' },
      { r: 101, title: 'Value per share: beta (rows) × risk-free rate (columns), CAPM discount rate from the WACC sheet', corner: 'Beta ↓  Rf →' },
    ];
    const W = 'Workings', ND = '$B$12', SH = '$B$10';
    const per = `${W}!$C$3:$L$3`;
    grids.forEach((g, gi) => {
      put(`A${g.r}`, g.title, { kind: 'text', bold: true }); ws.mergeCells(`A${g.r}:G${g.r}`);
      put(`A${g.r + 1}`, g.corner, { kind: 'text', bold: true, fill: F_SUB, align: 'center' });
      for (let j = 0; j < 5; j++) {
        const col = COL[j + 1], d = j - 2;   // C..G
        if (gi === 0) put(`${col}${g.r + 1}`, `=MAX($C$45+${d * 0.0025},0)`, { fmt: PCT2, bold: true, fill: F_SUB, align: 'center' });
        if (gi === 1) put(`${col}${g.r + 1}`, `=$G$43+${d * 0.02}`, { fmt: PCT, bold: true, fill: F_SUB, align: 'center' });
        if (gi === 2) put(`${col}${g.r + 1}`, `=WACC!$B$4+${d * 0.005}`, { fmt: PCT2, bold: true, fill: F_SUB, align: 'center', kind: 'link' });
      }
      for (let i = 0; i < 5; i++) {
        const r = g.r + 2 + i, d = i - 2;
        if (gi === 0) put(`B${r}`, `=$C$46+${d * 0.005}`, { fmt: PCT2, bold: true, fill: F_SUB, align: 'center' });
        if (gi === 1) put(`B${r}`, d * 0.02, { fmt: '+0.0%;-0.0%;0.0%', bold: true, fill: F_SUB, align: 'center', nofill: true, color: BLUE });
        if (gi === 2) put(`B${r}`, `=WACC!$B$6+${d * 0.2}`, { fmt: '0.00', bold: true, fill: F_SUB, align: 'center', kind: 'link' });
        for (let j = 0; j < 5; j++) {
          const col = COL[j + 1];
          let f;
          if (gi === 0) {
            const row = 6 + j;                                         // Workings row with g_j's cash-flow path
            const w = `MAX($B${r},${col}$${g.r + 1}+0.01)`, gg = `${col}$${g.r + 1}`;
            f = `=(SUMPRODUCT(${W}!$C$${row}:$L$${row}/(1+${w})^${per})+${W}!$L$${row}*(1+${gg})/(${w}-${gg})/(1+${w})^${W}!$L$3-${ND})/${SH}`;
          } else if (gi === 1) {
            const row = 16 + (i * 5 + j) * 2;                           // FCF row of path (i, j) on Workings
            f = `=(SUMPRODUCT(${W}!$C$${row}:$L$${row}/(1+$C$47)^${per})+${W}!$L$${row}*(1+$C$45)/($C$47-$C$45)/(1+$C$47)^${W}!$L$3-${ND})/${SH}`;
          } else {
            const wc = `(WACC!$B$19*(${col}$${g.r + 1}+$B${r}*WACC!$B$5)+WACC!$B$20*(${col}$${g.r + 1}+WACC!$B$10)*(1-WACC!$B$12))`;
            const w = `MAX(${wc},$C$45+0.01)`;
            f = `=(SUMPRODUCT($C$55:$L$55/(1+${w})^$C$56:$L$56)+$L$55*(1+$C$45)/(${w}-$C$45)/(1+${w})^$L$56-${ND})/${SH}`;
          }
          const cell = put(`${col}${r}`, f, { fmt: PS, align: 'center', kind: 'calc' });
          if (i === 2 && j === 2) { cell.fill = fill(F_OUT); cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BLACK } }; }
        }
      }
      ws.addConditionalFormatting({
        ref: `C${g.r + 2}:G${g.r + 6}`,
        rules: [{ type: 'colorScale', priority: 1, cfvo: [{ type: 'min' }, { type: 'percentile', value: 50 }, { type: 'max' }],
          color: [{ argb: 'FFF8696B' }, { argb: 'FFFFFFFF' }, { argb: 'FF63BE7B' }] }],
      });
      box(g.r + 1, g.r + 6, 'B', 'G');
    });
    put('A108', 'Table 3 uses the CAPM build on the WACC sheet, so its centre equals the main model only when cell B6 is set to 2.', { kind: 'text', italic: true, color: 'FF595959' });
    ws.mergeCells('A108:L108');
    return ws;
  }

  // =========================================================== Workings ===
  function sheetWorkings(wb) {
    const ws = wb.addWorksheet('Workings', { views: [{ showGridLines: false }] });
    const { put, header, sub } = S(ws);
    ws.getColumn('A').width = 44; COL.forEach(k => { ws.getColumn(k).width = 12; });
    header(1, 'SENSITIVITY WORKINGS — the cash-flow paths each sensitivity cell discounts (all formulas, nothing to edit here)');
    sub(2, ['', 'Latest', ...Array.from({ length: 10 }, (_, i) => `Year ${i + 1}`)]);
    put('A3', 'Discount period', { kind: 'text' });
    for (let n = 1; n <= 10; n++) put(`${YR(n)}3`, `=DCF!${YR(n)}56`, { fmt: '0.0' });
    put('A5', 'Table 1 — free cash flow for each terminal growth rate', { kind: 'text', bold: true });
    for (let j = 0; j < 5; j++) {          // only years 6-10 depend on terminal growth (the fade)
      const r = 6 + j, gcell = `DCF!$${COL[j + 1]}$84`;
      put(`A${r}`, `=“g = ”&TEXT(${gcell},"0.00%")`.replace(/[“”]/g, '"'), { kind: 'link' });
      put(`B${r}`, '=DCF!$B$14', { fmt: '#,##0.000' });
      let prev = 'B';
      for (let n = 1; n <= 10; n++) {
        const k = YR(n);
        if (n <= 5) put(`${k}${r}`, `=DCF!${k}55`, { fmt: '#,##0.000' });
        else {
          // revenue path in the fade depends on g, so rebuild revenue for years 6-10 in place:
          // revenue_n = revenue_5 × Π (1 + g5 + (g − g5)·k/5), FCF = revenue × year-5 margin
          const fac = Array.from({ length: n - 5 }, (_, q) => `(1+DCF!$G$42+(${gcell}-DCF!$G$42)*${q + 1}/5)`).join('*');
          put(`${k}${r}`, `=DCF!$G$53*${fac}*DCF!$G$43`, { fmt: '#,##0.000' });
        }
        prev = k;
      }
    }
    put('A13', 'Table 2 — revenue and free cash flow for each growth change and margin', { kind: 'text', bold: true });
    let r = 15;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const dg = `DCF!$B$${94 + i}`, m1 = `DCF!$${COL[j + 1]}$93`;
      put(`A${r}`, `="Revenue, growth "&TEXT(${dg},"+0.0%;-0.0%;0.0%")&", margin "&TEXT(${m1},"0.0%")`, { kind: 'link' });
      put(`A${r + 1}`, '   Free cash flow', { kind: 'text' });
      put(`B${r}`, '=DCF!$B$14', { fmt: '#,##0.000' });
      for (let n = 1; n <= 10; n++) {
        const k = YR(n), p = YR(n - 1);
        const g = n <= 5 ? `(DCF!${k}$42+${dg})` : `(DCF!$G$42+${dg}+(DCF!$C$45-DCF!$G$42-${dg})*${n - 5}/5)`;
        put(`${k}${r}`, `=${p}${r}*(1+${g})`, { fmt: '#,##0.000' });
        const m = n <= 5 ? `(DCF!$B$15+(${m1}-DCF!$B$15)*${n}/5)` : m1;
        put(`${k}${r + 1}`, `=${k}${r}*${m}`, { fmt: '#,##0.000' });
      }
      r += 2;
    }
    return ws;
  }

  // =============================================================== WACC ===
  function sheetWACC(wb, c) {
    const ws = wb.addWorksheet('WACC', { views: [{ showGridLines: false }] });
    const { put, header, box } = S(ws);
    ws.getColumn('A').width = 52; ws.getColumn('B').width = 14; ws.getColumn('C').width = 70;
    header(1, `${c.t} — COST OF CAPITAL (CAPM cross-check)`, 'A', 'C');
    header(3, 'COST OF EQUITY', 'A', 'C');
    put('A4', 'Risk-free rate (10-year US Treasury)', { kind: 'text' }); put('B4', RF, { fmt: PCT2, note: RF_NOTE });
    put('A5', 'Equity risk premium', { kind: 'text' }); put('B5', ERP, { fmt: PCT2, note: 'Assumption: 5.5%, the middle of the 5.0–6.0% range most practitioners use.' });
    put('A6', 'Beta', { kind: 'text' });
    put('A7', 'Cost of equity (CAPM)', { kind: 'text', bold: true }); put('B7', '=B4+B6*B5', { fmt: PCT2, bold: true });
    header(9, 'COST OF DEBT', 'A', 'C');
    put('A10', 'Credit spread over the risk-free rate', { kind: 'text' }); put('B10', 0.015, { fmt: PCT2, note: 'Assumption: 1.5 points, a typical investment-grade spread. Replace with the company\'s own bond spread.' });
    put('A11', 'Pre-tax cost of debt', { kind: 'text' }); put('B11', '=B4+B10', { fmt: PCT2 });
    put('A12', 'Tax rate', { kind: 'text' }); put('B12', 0.21, { fmt: PCT, note: 'Assumption: 21% US federal statutory rate. Use the company\'s effective rate if it differs.' });
    put('A13', 'After-tax cost of debt', { kind: 'text', bold: true }); put('B13', '=B11*(1-B12)', { fmt: PCT2, bold: true });
    header(15, 'CAPITAL STRUCTURE (market values)', 'A', 'C');
    put('A16', 'Market value of equity', { kind: 'text' }); put('B16', '=DCF!B11', { fmt: '#,##0.00', kind: 'link' });
    put('A17', 'Net debt (net cash counts as zero debt)', { kind: 'text' }); put('B17', '=MAX(DCF!B12,0)', { fmt: '#,##0.00', kind: 'link' });
    put('A18', 'Capital employed', { kind: 'text' }); put('B18', '=B16+B17', { fmt: '#,##0.00' });
    put('A19', 'Equity weight', { kind: 'text' }); put('B19', '=B16/B18', { fmt: PCT });
    put('A20', 'Debt weight', { kind: 'text' }); put('B20', '=B17/B18', { fmt: PCT });
    header(22, 'RESULT', 'A', 'C');
    put('A23', 'WACC from CAPM', { kind: 'text', bold: true, fill: F_OUT }); put('B23', '=B19*B7+B20*B13', { fmt: PCT2, bold: true, fill: F_OUT });
    put('A24', 'FreeFlow discount rate (base case)', { kind: 'text' }); put('B24', '=DCF!C30', { fmt: PCT2, kind: 'link' });
    put('A25', 'Beta implied by the FreeFlow rate', { kind: 'text' }); put('B25', '=((B24-B20*B13)/B19-B4)/B5', { fmt: '0.00' });
    put('A26', 'CAPM minus FreeFlow', { kind: 'text' }); put('B26', '=ROUND(B23-B24,4)', { fmt: '+0.00%;-0.00%;0.00%' });
    // Default beta: the one the FreeFlow rate implies, so both routes start from the same place.
    const nd = Math.max(c.netdebt, 0), mc = c.price * c.shares, we = mc / (mc + nd || 1), wd = 1 - we;
    const kd = (RF + 0.015) * (1 - 0.21);
    const beta = Math.round((((c.wacc - wd * kd) / (we || 1)) - RF) / ERP * 100) / 100;
    put('B6', beta, { fmt: '0.00', note: 'Defaults to the beta implied by FreeFlow\'s discount rate (row 25), so the CAPM route starts where the website does. Replace it with a measured 5-year monthly beta to test the rate.' });
    put('C4', 'Today\'s yield. Update it when rates move.', { kind: 'text', italic: true, color: 'FF595959' });
    put('C6', 'Defaults to the beta FreeFlow\'s rate implies. Replace with a measured beta.', { kind: 'text', italic: true, color: 'FF595959' });
    put('C23', 'Used by the DCF when cell DCF!B6 is set to 2.', { kind: 'text', italic: true, color: 'FF595959' });
    put('C25', 'Below about 0.7 or above about 1.6 is unusual for a large company: worth a second look.', { kind: 'text', italic: true, color: 'FF595959' });
    box(3, 26, 'A', 'C');
    return ws;
  }

  // ============================================================== Comps ===
  function sheetComps(wb, c, peers, ctx) {
    const ws = wb.addWorksheet('Comps', { views: [{ state: 'frozen', xSplit: 2, ySplit: 3, showGridLines: false }] });
    const { put, header, sub, box } = S(ws);
    const eq = c.sec === 'financials';
    const soft = c.sec === 'software';
    const all = [c, ...peers];
    const n = all.length, first = 7, last = first + n - 1, p1 = first + 1;   // peers = rows p1..last
    ws.getColumn('A').width = 34; ws.getColumn('B').width = 9;
    'CDEFGHIJ'.split('').forEach(k => { ws.getColumn(k).width = 16; });
    put('A1', `${ctx.sectorName || c.sec} — comparable company analysis`, { kind: 'text', bold: true, color: WHITE, fill: F_HDR });
    ws.mergeCells('A1:J1');
    put('A2', `${c.t} against its ${peers.length} closest peers: ` + peers.map(p => p.t).join(' • '), { kind: 'text', italic: true }); ws.mergeCells('A2:J2');
    put('A3', `As of ${c.pd || stamp(ctx)} · US$ billions except per-share figures and ratios · statistics are for the peers only (row ${first} is the subject)`, { kind: 'text', italic: true });
    ws.mergeCells('A3:J3');

    header(5, 'OPERATING METRICS', 'A', 'J');
    sub(6, ['Company', 'Ticker', 'Revenue (LTM)', '5-yr revenue growth (model)', 'FCF margin (LTM)', 'Free cash flow (LTM)', ...(soft ? ['Rule of 40 (growth + margin)'] : [])], 0, true);
    all.forEach((p, i) => {
      const r = first + i, b = i === 0;
      put(`A${r}`, p.n, { kind: 'text', bold: b });
      put(`B${r}`, p.t, { kind: 'text', bold: b });
      put(`C${r}`, p.rev, { fmt: money(p.rev), note: i === 0 ? 'Source: FreeFlow data file; trailing twelve months, refreshed weekly from company filings via Finnhub. Same source for every row.' : undefined });
      put(`D${r}`, p.cagr5, { fmt: PCT, note: i === 0 ? 'Five-year compound growth in the FreeFlow model\'s forecast (not history), so every company is measured on the same forward basis.' : undefined });
      put(`E${r}`, p.m0, { fmt: PCT, note: i === 0 ? 'Free cash flow (operating cash flow less capital spending) over revenue, last twelve months.' : undefined });
      put(`F${r}`, `=C${r}*E${r}`, { fmt: money(p.rev) });
      if (soft) put(`G${r}`, `=D${r}+E${r}`, { fmt: PCT });
    });
    const stats = [['Maximum', 'MAX'], ['75th percentile', 'Q3'], ['Median', 'MEDIAN'], ['25th percentile', 'Q1'], ['Minimum', 'MIN']];
    const statF = (fn, col) => `=IF(COUNT(${col}${p1}:${col}${last})=0,"n/m",` + (fn === 'Q3' ? `QUARTILE(${col}${p1}:${col}${last},3)` : fn === 'Q1' ? `QUARTILE(${col}${p1}:${col}${last},1)` : `${fn}(${col}${p1}:${col}${last})`) + ')';
    let r0 = last + 2;
    stats.forEach(([l, fn], i) => {
      const r = r0 + i;
      put(`A${r}`, l, { kind: 'text', fill: F_IN, bold: fn === 'MEDIAN' });
      put(`B${r}`, '', { kind: 'text', fill: F_IN });
      for (const col of ['D', 'E', ...(soft ? ['G'] : [])]) put(`${col}${r}`, statF(fn, col), { fmt: PCT, fill: F_IN, bold: fn === 'MEDIAN' });
    });
    box(5, r0 + 4, 'A', 'J');

    const v0 = r0 + 7;
    header(v0, 'VALUATION MULTIPLES', 'A', 'J');
    const mlabel = eq ? 'Price / FCF' : 'EV / FCF';
    sub(v0 + 1, ['Company', 'Ticker', 'Share price', 'Shares (B)', 'Market value', 'Net debt', 'Enterprise value', eq ? 'Price / Sales' : 'EV / Sales', mlabel, 'FCF yield'], 0, true);
    const vf = v0 + 2, vl = vf + n - 1, vp1 = vf + 1;
    all.forEach((p, i) => {
      const r = vf + i, o = first + i, b = i === 0;
      put(`A${r}`, `=A${o}`, { bold: b }); put(`B${r}`, `=B${o}`, { bold: b });
      put(`C${r}`, p.price, { fmt: PS, note: i === 0 ? `Source: FreeFlow data file, last close${c.pd ? ' ' + c.pd : ''}. Same source for every row.` : undefined });
      put(`D${r}`, p.shares, { fmt: '#,##0.000' });
      put(`E${r}`, `=C${r}*D${r}`, { fmt: money(p.price * p.shares) });
      put(`F${r}`, p.netdebt, { fmt: money(Math.abs(p.netdebt) + 1) });
      put(`G${r}`, `=E${r}+F${r}`, { fmt: money(p.price * p.shares) });
      put(`H${r}`, `=IF(C${o}>0,${eq ? 'E' : 'G'}${r}/C${o},"n/m")`, { fmt: X });
      put(`I${r}`, eq ? `=IF(F${o}>0,E${r}/F${o},"n/m")` : `=IF(F${o}>0,G${r}/F${o},"n/m")`, { fmt: X });
      put(`J${r}`, `=F${o}/E${r}`, { fmt: PCT });
    });
    const s0 = vl + 2;
    const statV = (fn, col) => `=IF(COUNT(${col}${vp1}:${col}${vl})=0,"n/m",` + (fn === 'Q3' ? `QUARTILE(${col}${vp1}:${col}${vl},3)` : fn === 'Q1' ? `QUARTILE(${col}${vp1}:${col}${vl},1)` : `${fn}(${col}${vp1}:${col}${vl})`) + ')';
    stats.forEach(([l, fn], i) => {
      const r = s0 + i;
      put(`A${r}`, l, { kind: 'text', fill: F_IN, bold: fn === 'MEDIAN' });
      put(`B${r}`, '', { kind: 'text', fill: F_IN });
      put(`H${r}`, statV(fn, 'H'), { fmt: X, fill: F_IN, bold: fn === 'MEDIAN' });
      put(`I${r}`, statV(fn, 'I'), { fmt: X, fill: F_IN, bold: fn === 'MEDIAN' });
      put(`J${r}`, statV(fn, 'J'), { fmt: PCT, fill: F_IN, bold: fn === 'MEDIAN' });
    });
    box(v0, s0 + 4, 'A', 'J');

    // implied value from the peer multiples, at the 25th / median / 75th percentile
    const i0 = s0 + 7;
    const useFcf = c.ttm_fcf > 0;
    header(i0, `IMPLIED VALUE OF ${c.t} AT PEER MULTIPLES (trailing ${useFcf ? (eq ? 'price / FCF' : 'EV / FCF') : 'EV / sales, because free cash flow is not positive'})`, 'A', 'J');
    sub(i0 + 1, ['', '', '25th percentile', 'Median', '75th percentile']);
    const mc = useFcf ? 'I' : 'H', base = useFcf ? `F${first}` : `C${first}`;
    const statRow = { q1: s0 + 3, med: s0 + 2, q3: s0 + 1 };
    put(`A${i0 + 2}`, 'Peer multiple', { kind: 'text' });
    put(`A${i0 + 3}`, `× ${c.t} ${useFcf ? 'free cash flow' : 'revenue'} (LTM)`, { kind: 'text' });
    put(`A${i0 + 4}`, eq ? 'Implied equity value' : 'Implied enterprise value', { kind: 'text' });
    put(`A${i0 + 5}`, eq ? 'Less: nothing (equity basis)' : 'Less: net debt', { kind: 'text' });
    put(`A${i0 + 6}`, 'Implied equity value', { kind: 'text' });
    put(`A${i0 + 7}`, 'IMPLIED VALUE PER SHARE', { kind: 'text', bold: true, fill: F_OUT });
    put(`A${i0 + 8}`, `Upside / (downside) vs ${c.t} price`, { kind: 'text' });
    ['C', 'D', 'E'].forEach((col, k) => {
      const sr = [statRow.q1, statRow.med, statRow.q3][k];
      put(`${col}${i0 + 2}`, `=${mc}${sr}`, { fmt: X });
      put(`${col}${i0 + 3}`, `=${base}`, { fmt: money(c.rev) });
      put(`${col}${i0 + 4}`, `=IF(ISNUMBER(${col}${i0 + 2}),${col}${i0 + 2}*${col}${i0 + 3},"n/m")`, { fmt: money(c.rev) });
      put(`${col}${i0 + 5}`, eq ? 0 : `=F${vf}`, { fmt: money(c.rev), kind: eq ? 'calc' : undefined });
      put(`${col}${i0 + 6}`, `=IF(ISNUMBER(${col}${i0 + 4}),${col}${i0 + 4}-${col}${i0 + 5},"n/m")`, { fmt: money(c.rev) });
      put(`${col}${i0 + 7}`, `=IF(ISNUMBER(${col}${i0 + 6}),IF(${col}${i0 + 6}>0,${col}${i0 + 6}/D${vf},0),"n/m")`, { fmt: PS, bold: true, fill: F_OUT });
      put(`${col}${i0 + 8}`, `=IF(ISNUMBER(${col}${i0 + 7}),IF(${col}${i0 + 7}>0,${col}${i0 + 7}/C${vf}-1,"n/m"),"n/m")`, { fmt: PCT });
    });
    put(`A${i0 + 10}`, `The website's multiples value blends trailing, forward and growth-adjusted readings (${c.mx && c.mx.fv > 0 ? '$' + c.mx.fv.toFixed(2) : 'not meaningful'}). This sheet shows the trailing reading only, so that every number can be traced to a cell.`, { kind: 'text', italic: true, wrap: true, color: 'FF595959' });
    ws.mergeCells(`A${i0 + 10}:J${i0 + 11}`); ws.getRow(i0 + 10).height = 30;
    box(i0, i0 + 8, 'A', 'E');
    return ws;
  }

  // ============================================================== Notes ===
  function sheetNotes(wb, c, ctx) {
    const ws = wb.addWorksheet('Notes', { views: [{ showGridLines: false }] });
    const { put, header } = S(ws);
    ws.getColumn('A').width = 120;
    const lines = [
      ['h', 'ABOUT THIS WORKBOOK'],
      ['', `${c.n} (${c.t}). Built from FreeFlow Finance on ${stamp(ctx)}. Prices as of ${c.pd || 'the last close in the data file'}.`],
      ['', 'It rebuilds the website\'s DCF in live formulas: change any blue cell and the value per share, rating and sensitivity tables update.'],
      ['h', 'HOW THE MODEL WORKS'],
      ['', '1. Revenue grows at the five yearly rates in the selected case. In years 6–10 growth fades in a straight line from the year-5 rate to the terminal rate.'],
      ['', '2. Free cash flow = revenue × free cash flow margin. The margin glides from today\'s level to the year-5 target, then holds.'],
      ['', '   FreeFlow models free cash flow as one margin of sales (operating cash flow less capital spending) rather than building it from EBIT, tax, D&A, capex and working capital. That keeps 400 companies on one consistent basis, at the cost of detail.'],
      ['', '3. Cash flows are discounted at the selected discount rate with the mid-year convention (periods 0.5, 1.5 … 9.5).'],
      ['', '4. The terminal value is Gordon growth on year-11 free cash flow, discounted from period 9.5.'],
      ['', '5. Enterprise value less net debt gives equity value; divided by diluted shares, the value per share.'],
      ['', '6. Bear and bull cases move growth, margin, discount rate and terminal growth by the fixed amounts noted on the scenario blocks.'],
      ['h', 'SOURCES'],
      ['', 'Share prices: daily closes collected by the FreeFlow update job. Revenue, shares and net debt: company filings via Finnhub, refreshed weekly.'],
      ['', 'Growth, margins, discount rates and terminal growth: FreeFlow model assumptions, documented on the website\'s Methodology page.'],
      ['', RF_NOTE.replace('Source: ', 'Risk-free rate: ')],
      ['h', 'KNOWN DIFFERENCES FROM THE WEBSITE'],
      ['', 'The website never shows a bear value above the base value or a bull value below it; in rare edge cases this workbook can, because it shows the raw arithmetic.'],
      ['', 'The website\'s multiples model blends trailing, forward and growth-adjusted readings; the Comps sheet shows the trailing reading only.'],
      ['h', 'COLOUR KEY'],
      ['', 'Blue text on grey: inputs. Black text: formulas. Green text: links to another sheet. Mid-blue fill: the answer and the base case in each sensitivity table.'],
      ['h', 'IMPORTANT'],
      ['', 'For education and research. Not investment advice. A model is a set of opinions with arithmetic attached; check the inputs before relying on any output.'],
    ];
    let r = 1;
    for (const [k, t] of lines) {
      if (k === 'h') { r++; header(r, t, 'A', 'A'); }
      else put(`A${r}`, t, { kind: 'text', wrap: true });
      r++;
    }
    return ws;
  }

  // ============================================================== build ===
  function build(ExcelJS, c, peers, ctx = {}) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'FreeFlow Finance';
    wb.title = `${c.t} DCF model`;
    wb.calcProperties.fullCalcOnLoad = true;
    sheetDCF(wb, c, ctx);
    sheetWACC(wb, c);
    sheetComps(wb, c, peers, ctx);
    sheetWorkings(wb);
    sheetNotes(wb, c, ctx);
    // Print each sheet one page wide, landscape, so a printed model reads like a model.
    wb.worksheets.forEach(ws => { ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } }; });
    wb.views = [{ activeTab: 0 }];
    return wb;
  }

  function fileName(c, ctx = {}) { return `${c.t.replace(/[^A-Za-z0-9.]/g, '')}_DCF_Model_${stamp(ctx)}.xlsx`; }

  // --------------------------------------------------------- browser ---
  let loading = null;
  function loadLib() {
    if (typeof window !== 'undefined' && window.ExcelJS) return Promise.resolve(window.ExcelJS);
    if (!loading) loading = new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = CDN; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = () => window.ExcelJS ? ok(window.ExcelJS) : no(new Error('ExcelJS did not load'));
      s.onerror = () => { loading = null; no(new Error('Could not reach the spreadsheet library. Check the connection and try again.')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  async function download(c, peers, ctx) {
    const ExcelJS = await loadLib();
    const wb = build(ExcelJS, c, peers, ctx);
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName(c, ctx);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  return { build, download, fileName, caseInputs, CDN, RF };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = FF_XLSX;
