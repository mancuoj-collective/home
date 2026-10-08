// Dev-only: render a page with N fake repos to dist/fake.html, to check how
// the layout behaves as the list grows.  node scripts/fake.mjs [n]
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { renderIndex } from "../src/template.js";
import { buildCollective } from "../figure/collective.js";

const n = Number(process.argv[2] ?? 12);
const POOL = [
  ["tasu", "A terminal todo list that ages.", "Rust", "#dea584"],
  ["kilo-rs", "用现代 Rust 重写 kilo 文本编辑器", "Rust", "#dea584"],
  ["rustlings", "第 101 次入门 Rust", "Rust", "#dea584"],
  ["dotfiles", "my machines, declaratively", "Shell", "#89e051"],
  ["notes", "everything I keep forgetting", "TypeScript", "#3178c6"],
  ["anime-scraper", "a small crawler for a small site", "Go", "#00add8"],
  ["mancuoj.me", "the personal site", "Vue", "#41b883"],
  ["vite-plugin-x", "one more vite plugin", "JavaScript", "#f1e05a"],
  ["nn-from-scratch", "backprop, by hand", "Python", "#3572a5"],
  ["wasm-playground", "tiny wasm experiments", "Zig", "#ec915c"],
  ["cli-tools", "command line bits and pieces", "Rust", "#dea584"],
  ["home", "this page", "JavaScript", "#f1e05a"],
];
const repos = Array.from({ length: n }, (_, i) => {
  const p = POOL[i % POOL.length];
  return {
    name: `${p[0]}${i >= POOL.length ? "-" + (i + 1) : ""}`,
    url: `https://github.com/mancuoj-collective/${p[0]}`,
    desc: p[1],
    stars: (i * 7) % 12,
    lang: p[2],
    langColor: p[3],
  };
}).sort((a, b) => b.stars - a.stars);

const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const html = renderIndex({ org: "mancuoj collective", repos, css, figure: buildCollective(repos) });
await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
await writeFile(new URL(`../dist/fake-${n}.html`, import.meta.url), html);
console.log(`wrote dist/fake-${n}.html — ${repos.length} repos`);
