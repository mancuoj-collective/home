// Dev-only break-ui fixture. Renders the page with several datasets behind a
// Demo / Worst case / Empty / One / 40 rows toggle. Not part of the site.
//   node scripts/break.mjs   →   dist/dev.html?state=worst
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { layoutHtml, hoverCss } from "../src/template.js";
import { buildCollective } from "../figure/collective.js";

const ORG = "mancuoj collective";

// the real data
const DEMO = [
  { name: "tasu", url: "https://github.com/mancuoj-collective/tasu", desc: "A terminal todo list that ages.", stars: 1, lang: "Rust", langColor: "#dea584" },
  { name: "kilo-rs", url: "https://github.com/mancuoj-collective/kilo-rs", desc: "用现代 Rust 重写 kilo 文本编辑器", stars: 1, lang: "Rust", langColor: "#dea584" },
  { name: "rustlings", url: "https://github.com/mancuoj-collective/rustlings", desc: "第 101 次入门 Rust", stars: 1, lang: "Rust", langColor: "#dea584" },
];

// the worst realistic case, spread across the first rows
const WORST = [
  {
    name: "a-really-long-repository-name-that-runs-right-up-to-the-github-limit-of-one-hundred-characters",
    url: "https://github.com/mancuoj-collective/a-really-long-repository-name",
    desc: "A self-hosted dashboard for tracking, tagging and visualising everything you keep forgetting — plugins, themes, a REST API, a CLI, an MCP server and a browser extension.",
    stars: 1284, lang: "Jupyter Notebook", langColor: "#DA5B0B",
  },
  {
    name: "x", url: "https://github.com/mancuoj-collective/x",
    desc: "", stars: 0, lang: null, langColor: null,
  },
  {
    name: "🎉-party-cli", url: "https://github.com/mancuoj-collective/party-cli",
    desc: "https://github.com/mancuoj-collective/party-cli/blob/main/docs/getting-started/installation-and-configuration.md",
    stars: 99999, lang: "TypeScript", langColor: "#3178c6",
  },
  {
    name: "我的第一个仓库", url: "https://github.com/mancuoj-collective/first",
    desc: "一个用来记录每天学习笔记的小工具，支持标签、搜索和导出。",
    stars: 1234567, lang: "TypeScript", langColor: "#3178c6",
  },
  {
    name: "مشروع-تجريبي", url: "https://github.com/mancuoj-collective/demo",
    desc: "أداة صغيرة لتنظيم الملاحظات اليومية.",
    stars: 42, lang: "Go", langColor: "#00add8",
  },
  {
    name: "tags-and-things", url: "https://github.com/mancuoj-collective/tags-and-things",
    desc: "renders <b>bold</b> & <script>alert(1)</script> if you are not careful",
    stars: 7, lang: "HTML", langColor: "#e34c26",
  },
  {
    name: "long-reader", url: "https://github.com/mancuoj-collective/long-reader",
    desc: "A reading app that remembers where you stopped in every article, syncs across devices, and quietly exports everything to plain Markdown when you ask it to.",
    stars: 3, lang: "Rust", langColor: "#dea584",
  },
  {
    name: "emacs-configuration", url: "https://github.com/mancuoj-collective/emacs-configuration",
    desc: "my editor, after fifteen years", stars: 1, lang: "Emacs Lisp", langColor: "#c065db",
  },
];

const ONE = [DEMO[0]];

const LANGS = [
  ["Rust", "#dea584"], ["TypeScript", "#3178c6"], ["Go", "#00add8"],
  ["Python", "#3572a5"], ["JavaScript", "#f1e05a"], ["Zig", "#ec915c"],
];
const MANY = Array.from({ length: 40 }, (_, i) => {
  const [lang, langColor] = LANGS[i % LANGS.length];
  return {
    name: `project-${i + 1}`,
    url: `https://github.com/mancuoj-collective/project-${i + 1}`,
    desc: i % 4 === 0 ? "" : `a small tool that does one thing well (#${i + 1})`,
    stars: (i * 137) % 9999,
    lang, langColor,
  };
});

const STATES = { demo: DEMO, worst: WORST, empty: [], one: ONE, many: MANY };
const LABEL = { demo: "Demo data", worst: "Worst case", empty: "Empty", one: "One", many: "40 rows" };

const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
// hover rules for the largest dataset; unused indices are harmless
const hover = hoverCss(Array.from({ length: 48 }, () => ({})));

const rendered = Object.fromEntries(
  Object.entries(STATES).map(([k, repos]) => [k, layoutHtml({ org: ORG, repos, figure: buildCollective(repos) })]),
);

const json = JSON.stringify(rendered).replace(/</g, "\\u003c");

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>break-ui · mancuoj collective</title>
<style>
${css}
${hover}
#devbar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:2px;padding:3px;border-radius:999px;background:#8b8b8b;box-shadow:0 2px 12px rgba(0,0,0,.28);z-index:9999;font:12px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;max-width:calc(100vw - 24px);overflow-x:auto}
#devbar button{border:0;background:none;color:#fff;padding:7px 13px;border-radius:999px;cursor:pointer;white-space:nowrap}
#devbar button[aria-pressed="true"]{background:#fff;color:#111}
</style>
</head>
<body>
<svg class="fx" aria-hidden="true" width="0" height="0"><defs>
<filter id="glow" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="soft" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="bloom" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="8"/></filter>
</defs></svg>

<main class="wrap">
  <header class="top">
    <h1 class="brand"><a href="https://github.com/mancuoj-collective" target="_blank" rel="noopener noreferrer">mancuoj collective<span class="dot">.</span></a></h1>
  </header>
  <div class="layout" id="stage"></div>
</main>

<div id="devbar" role="group" aria-label="Fixture">
${Object.keys(STATES).map((k) => `  <button data-k="${k}">${LABEL[k]}</button>`).join("\n")}
</div>

<script>
const STATES = ${json};
const stage = document.getElementById("stage");
const bar = document.getElementById("devbar");
function show(k) {
  if (!(k in STATES)) k = "demo";
  stage.innerHTML = STATES[k];
  for (const b of bar.querySelectorAll("button")) b.setAttribute("aria-pressed", b.dataset.k === k);
  history.replaceState(null, "", "?state=" + k);
}
bar.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(b.dataset.k); });
show(new URLSearchParams(location.search).get("state") || "demo");
</script>
</body>
</html>
`;

await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
await writeFile(new URL("../dist/dev.html", import.meta.url), page);
console.log(`wrote dist/dev.html — states: ${Object.keys(STATES).join(", ")}`);
