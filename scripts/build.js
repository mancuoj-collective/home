import { mkdir, writeFile, cp, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderIndex } from "../src/template.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist");

const ORG = "mancuoj-collective";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

// The repo that builds this page — never list the page itself.
const EXCLUDE = new Set(["home"]);

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

async function getRepos() {
  const repos = [];
  let url = `https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100&sort=pushed&direction=desc`;

  for (;;) {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "mancuoj-collective-home",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });

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
      lang: r.language || "",
      langColor: LANG_COLORS[r.language] || null,
      pushed: Date.parse(r.pushed_at) || 0,
    }))
    .sort((a, b) => b.stars - a.stars || b.pushed - a.pushed);
}

async function build() {
  const [org, css] = await Promise.all([
    fetch(`https://api.github.com/orgs/${ORG}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    }).then((r) => (r.ok ? r.json() : {})),
    readFile(join(root, "src", "styles.css"), "utf8"),
  ]);

  const repos = await getRepos();
  const html = renderIndex({
    org: org.name || ORG,
    motto: org.description || `${ORG} — public repositories.`,
    repos,
    css,
  });

  await mkdir(out, { recursive: true });
  await Promise.all([
    writeFile(join(out, "index.html"), html),
    cp(join(root, "public"), out, { recursive: true }),
  ]);

  console.log(
    `built dist/index.html — ${repos.length} repos, ${repos.reduce((s, r) => s + r.stars, 0)} stars`,
  );
}

build().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
