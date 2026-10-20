// Build: concatenates src/NN-*.js (sorted) into game.js wrapped in an IIFE,
// escapes "//" inside long base64 string literals (the restriction checker
// rejects any "//<alnum>" even inside data URIs), then reports sizes.
// Usage: node tools/build.mjs [--quiet] [--out path/to/out.js]  (default out: game.js)
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const argv = process.argv;
const quiet = argv.includes('--quiet');
// the repo root (this file lives in tools/)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nm = p => pathToFileURL(resolve(root, 'node_modules', p)).href;
const { minify } = await import(nm('@swc/core/index.js')).then(m => m.default || m);
const { checkRestrictions } = await import(nm('@platanus/arcade-dev-ui-26/dist/check-restrictions.js'));
const srcDir = resolve(root, 'src');
const files = readdirSync(srcDir).filter(f => /^\d\d-.*\.js$/.test(f)).sort();

const escapeLongStrings = code =>
  code.replace(/(['"`])([A-Za-z0-9+/=:;,._\-]{120,})\1/g, (m, q, body) => q + body.replace(/\/(?=\/)/g, '/\\') + q);

const parts = [];
const report = [];
for (const f of files) {
  const code = escapeLongStrings(readFileSync(resolve(srcDir, f), 'utf8'));
  parts.push(`// ---- ${f} ----\n${code.trim()}\n`);
  let min = 0;
  try { min = Buffer.byteLength((await minify(code, { compress: true, mangle: true })).code); } catch (e) { min = -1; }
  report.push([f, Buffer.byteLength(code), min]);
}

const header = `// ARRIVALS: LA INVASIÓN — Platanus Hack 26 Caracas Arcade Challenge
// Built from the src/ modules. Edit src/, not this file.
`;
const out = `${header}(() => {\n'use strict';\n${parts.join('\n')}\n})();\n`;
const outPath = argv.includes('--out') ? resolve(argv[argv.indexOf('--out') + 1]) : resolve(root, 'game.js');
writeFileSync(outPath, out);
console.log('wrote ' + outPath);

if (!quiet) {
  console.log('module                      raw      min(standalone)');
  for (const [f, raw, min] of report) console.log(`${f.padEnd(26)} ${String(raw).padStart(7)} ${String(min).padStart(9)}`);
}
const res = await checkRestrictions(outPath);
for (const r of res.results) console.log(`${r.passed ? 'OK  ' : 'FAIL'} ${r.name}: ${r.message}${r.details && !r.passed ? '\n     ' + r.details.split('\n').slice(0, 8).join('\n     ') : ''}`);
console.log(`TOTAL minified: ${res.minifiedSize} bytes (${(res.minifiedSize / 1024).toFixed(2)} KB / 50 KB) — ${res.passed ? 'PASS' : 'FAIL'}`);
process.exit(res.passed ? 0 : 1);
