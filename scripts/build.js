import { mkdir, writeFile, cp, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderIndex } from "../src/template.js";
import { buildCollective } from "../figure/collective.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist");

const ORG = "mancuoj-collective";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

// The repo that builds this page — never list the page itself.
const EXCLUDE = new Set(["home"]);

// Shorter labels keep the language column tight.
const LANG_LABELS = { JavaScript: "JS", TypeScript: "TS" };

// GitHub linguist colors, trimmed to the languages this org actually uses.
const LANG_COLORS = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Rust: "#dea584",
  Go: "#00add8",
  Python: "#3572a5",
  Vue: "#41b883",
  Lua: "#000080",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Shell: "#89e051",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  Dart: "#00b4ab",
  Zig: "#ec915c",
  Ruby: "#701516",
  Nix: "#7e7eff",
};

const TIMEOUT_MS = 15_000;
const ATTEMPTS = 3;

// Filled from the first GitHub response: shows whether GITHUB_TOKEN is in use
// (5000/h authenticated vs 60/h anonymous).
let apiRate = "";

// fetch with a timeout, retrying transient failures (network, 429, 5xx).
// Set GITHUB_TOKEN in the Netlify environment to raise the API rate limit.
async function ghFetch(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "mancuoj-collective-home",
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  };

  let lastErr;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      lastErr = new Error(`GitHub API ${res.status} ${res.statusText}`);
    } catch (err) {
      lastErr = err;
    }
    if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, attempt * 500));
  }
  throw lastErr;
}

async function getOrg() {
  // Non-critical: the page falls back to the org id.
  try {
    const res = await ghFetch(`https://api.github.com/orgs/${ORG}`);
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

async function getRepos() {
  const repos = [];
  let url = `https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100&sort=pushed&direction=desc`;

  for (;;) {
    const res = await ghFetch(url);

    if (!apiRate) {
      const limit = res.headers.get("x-ratelimit-limit");
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (limit) apiRate = `${remaining}/${limit} left${TOKEN ? "" : " (anonymous)"}`;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GitHub API ${res.status} ${res.statusText}\n${body}`);
    }

    repos.push(...(await res.json()));

    const next = (res.headers.get("link") || "").match(/<([^>]+)>;\s*rel="next"/);
    if (!next) break;
    url = next[1];
  }

  // De-dupe defensively, then rank by stars, then last code push.
  const seen = new Set();
  return repos
    .filter((r) => !seen.has(r.id) && seen.add(r.id))
    .filter((r) => !EXCLUDE.has(r.name))
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      desc: r.description || "",
      stars: r.stargazers_count ?? 0,
      lang: LANG_LABELS[r.language] || r.language || "",
      langColor: LANG_COLORS[r.language] || null,
      pushed: Date.parse(r.pushed_at) || 0,
    }))
    .sort((a, b) => b.stars - a.stars || b.pushed - a.pushed);
}

async function build() {
  const [org, css] = await Promise.all([
    getOrg(),
    readFile(join(root, "src", "styles.css"), "utf8"),
  ]);

  const repos = await getRepos();
  const html =
    `<!-- github api: ${apiRate || "unknown"} -->\n` +
    renderIndex({
      org: org.name || ORG,
      repos,
      css,
      figure: buildCollective(repos),
    });

  // Rebuild dist from scratch, so files deleted from public/ leave the site.
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await Promise.all([
    writeFile(join(out, "index.html"), html),
    cp(join(root, "public"), out, { recursive: true }),
  ]);

  console.log(
    `built dist/index.html — ${repos.length} repos, ${repos.reduce((s, r) => s + r.stars, 0)} stars · github api ${apiRate || "unknown"}`,
  );
}

build().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
