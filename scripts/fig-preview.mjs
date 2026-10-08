// Dev-only: render the figure to a standalone .svg (tokens inlined, since
// librsvg doesn't resolve CSS var()) for a quick look.
//   node scripts/fig-preview.mjs [stars] [n] [litIndex]
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { buildCollective } from "../figure/collective.js";

const DARK = {
  bg: "#0c0d0e", panel: "#141516", edge: "#222426", line: "#474c50",
  detail: "#34383b", body: "#17181a", deck: "#1b1d1f", ink: "#868b8f",
  "ink-hi": "#e6e8e9", glass: "#0f1011",
  accent: "#ff5a3c", "accent-hi": "#ff9c82", "accent-dim": "rgba(255,90,60,0.14)",
};

const LIGHT = {
  bg: "#e9eaea", panel: "#f6f6f5", edge: "#d6d8d8", line: "#8e9397",
  detail: "#c3c6c8", body: "#ececeb", deck: "#f3f3f2", ink: "#6a6f73",
  "ink-hi": "#16181a", glass: "#dcdede",
  accent: "#e0361c", "accent-hi": "#ff6a4a", "accent-dim": "rgba(224,54,28,0.12)",
};

function resolve(css, tokens) {
  let out = css;
  for (let i = 0; i < 6; i++) {
    out = out.replace(/var\(\s*--([a-zA-Z-]+)\s*\)/g, (m, name) =>
      name === "lit" ? "0" : tokens[name] ?? "inherit",
    );
    out = out.replace(/var\(\s*--([a-zA-Z-]+)\s*,\s*([^)]*)\)/g, (m, name, fb) =>
      tokens[name] ?? fb,
    );
    if (!out.includes("var(")) break;
  }
  // librsvg can't parse calc(); fold simple arithmetic to a number
  out = out.replace(/calc\(([^()]+)\)/g, (m, expr) => {
    try {
      return String(Function(`return (${expr.replace(/%/g, "*0.01")})`)());
    } catch {
      return "0";
    }
  });
  return out;
}

const stars = Number(process.argv[2] ?? 1);
const n = Number(process.argv[3] ?? 3);
const lit = process.argv[4] === "unlit" ? undefined : process.argv[4];
const tokens = process.argv[5] === "light" ? LIGHT : DARK;
const repos = Array.from({ length: n }, () => ({ stars }));
const figure = buildCollective(repos);

let css = resolve(await readFile(new URL("../src/styles.css", import.meta.url), "utf8"), tokens);
if (lit !== undefined) {
  css += `
.bld[data-i="${lit}"] .pane { fill: ${tokens.accent}; stroke: ${tokens["accent-hi"]}; }
.bld[data-i="${lit}"] .halo { opacity: 0.42; }
.bld[data-i="${lit}"] .door { fill: ${tokens.accent}; }
`;
}

const [, , W, H] = figure.viewBox.split(" ").map(Number);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${figure.viewBox}" width="760" style="background:${tokens.bg}">
<style>
${css}
</style>
<defs>
  <filter id="glow" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="bloom" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="8"/></filter>
</defs>
<rect x="0" y="0" width="${W}" height="${H}" fill="${tokens.bg}"/>
${figure.body}
</svg>`;

const dir = "/tmp/fig-preview";
await mkdir(dir, { recursive: true });
const name = `fig-${tokens === LIGHT ? "light" : "dark"}${lit === undefined || lit === "unlit" ? "" : `-lit${lit}`}`;
await writeFile(`${dir}/${name}.svg`, svg);
console.log(`wrote ${dir}/${name}.svg (${figure.viewBox}, ${n} buildings, ${tokens === LIGHT ? "light" : "dark"}${lit === undefined || lit === "unlit" ? "" : `, lit ${lit}`})`);
