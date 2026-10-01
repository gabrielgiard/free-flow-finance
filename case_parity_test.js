// The "Your case" sliders run a JavaScript copy of engine.py in the browser.
// With the sliders on the model's own assumptions it must show exactly the
// fair value the site publishes -- otherwise the page would contradict
// itself. This checks every company, for base, bull and bear.
//
//     node case_parity_test.js
//
// Run it after build.py, and after any change to engine.py or docs/case.js.

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const docs = path.join(__dirname, 'docs');
const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(docs, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(docs, 'case.js'), 'utf8'), ctx);

const result = vm.runInContext(`(() => {
  const bad = [];
  let worst = 0, n = 0;
  for (const c of FF_DATA.companies) {
    const sc = FF_ENGINE.scenarios(c);
    for (const [name, js, py] of [['base', sc.base, c.fv], ['bull', sc.bull, c.fv_bull], ['bear', sc.bear, c.fv_bear]]) {
      const diff = Math.abs(Math.round(js * 100) / 100 - py);
      worst = Math.max(worst, diff);
      n++;
      if (diff > 0.005) bad.push(c.t + ' ' + name + ': js ' + js.toFixed(4) + ' vs published ' + py);
    }
    const r = FF_ENGINE.rate(sc.base / c.price - 1);
    if (r !== c.rating) bad.push(c.t + ' rating: js ' + r + ' vs published ' + c.rating);
  }
  return { companies: FF_DATA.companies.length, checks: n, worst, bad };
})()`, ctx);

console.log(`Checked ${result.companies} companies (${result.checks} fair values + ratings).`);
console.log(`Largest difference: $${result.worst.toFixed(4)}`);
if (result.bad.length) {
  console.log(`MISMATCHES (${result.bad.length}):`);
  result.bad.slice(0, 20).forEach(b => console.log('  ' + b));
  process.exit(1);
}
console.log('PASS: the browser engine matches the published model to the cent.');
