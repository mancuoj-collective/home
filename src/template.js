// Renders the static index.html. No runtime dependencies — the build step
// (scripts/build.js) feeds in already-fetched GitHub data.

const ARROW = `<svg class="ic-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.4 11.6 11.4 4.6M6.2 4.6h5.2v5.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
const STAR = `<svg class="ic-star" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .9l2.06 4.35 4.74.63-3.5 3.28.9 4.7L8 11.6l-4.2 2.26.9-4.7-3.5-3.28 4.74-.63z"/></svg>`;

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(repo, i) {
  const idx = String(i + 1).padStart(2, "0");
  const lang = repo.lang
    ? `<i class="dot" style="--dot:${repo.langColor || "currentColor"}"></i><span class="t">${esc(repo.lang)}</span>`
    : "";
  return `      <li class="repo">
        <a class="row" href="${esc(repo.url)}" target="_blank" rel="noopener noreferrer">
          <span class="idx">${idx}</span>
          <span class="name"><span class="t">${esc(repo.name)}</span>${ARROW}</span>
          <span class="desc"><span class="t">${esc(repo.desc)}</span></span>
          <span class="lang">${lang}</span>
          <span class="stars">${STAR}<b>${repo.stars}</b></span>
        </a>
      </li>`;
}

export function renderIndex({ org, motto, repos, css }) {
  const total = repos.reduce((sum, r) => sum + r.stars, 0);
  const items = repos.map(row).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${esc(org)} — an index of public repositories." />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0f0f0e" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="preload" href="syne.woff2" as="font" type="font/woff2" crossorigin />
    <title>${esc(org)}</title>

    <style>
${css}
    </style>
  </head>

  <body>
    <main class="sheet">
      <header class="masthead">
        <div class="brand">
          <h1 class="wordmark">
            <a href="https://github.com/mancuoj-collective" target="_blank" rel="noopener noreferrer">
              <span>mancuoj</span>
              <span>collective<span class="dot">.</span></span>
            </a>
          </h1>
          <span class="chip" aria-hidden="true"></span>
        </div>

        <div class="subhead">
          <p class="motto">${esc(motto)}</p>
          <p class="stats">
            <span>repos<b>${String(repos.length).padStart(2, "0")}</b></span>
            <span>stars<b>${String(total).padStart(2, "0")}</b></span>
          </p>
        </div>
      </header>

      <ol class="repos" aria-label="Public repositories">
${items}
      </ol>
    </main>
  </body>
</html>
`;
}
