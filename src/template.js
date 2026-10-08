// Renders the static index.html. The figure is drawn at build time (see
// figure/collective.js); hover states are wired in CSS with :has(), so the
// page ships without any JavaScript.

const STAR = `<svg class="ic-star" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .9l2.06 4.35 4.74.63-3.5 3.28.9 4.7L8 11.6l-4.2 2.26.9-4.7-3.5-3.28 4.74-.63z"/></svg>`;

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(repo, i) {
  const lang = repo.lang
    ? `<span class="lang"><i class="dot" style="--lang:${repo.langColor || "var(--line)"}"></i>${esc(repo.lang)}</span>`
    : "";
  return `        <li class="repo">
          <a class="row" data-i="${i}" href="${esc(repo.url)}" target="_blank" rel="noopener noreferrer">
            <span class="idx">${String(i + 1).padStart(2, "0")}</span>
            <span class="name">${esc(repo.name)}</span>
            <span class="desc">${esc(repo.desc)}</span>
            <span class="meta">${lang}<span class="stars">${STAR}${repo.stars}</span></span>
          </a>
        </li>`;
}

// One rule per repository: hovering / focusing its row lights that module,
// and hovering the module echoes back onto the row.
function hoverCss(repos) {
  return repos
    .map((_, i) => {
      const s = `[data-i="${i}"]`;
      return [
        `.wrap:has(.row${s}:hover) .mod${s} .hot,`,
        `.wrap:has(.row${s}:focus-visible) .mod${s} .hot { opacity: 1; }`,
        `.wrap:has(.mod${s}:hover) .row${s} .name { color: var(--accent); text-shadow: 0 0 16px var(--accent-dim); }`,
      ].join("\n");
    })
    .join("\n");
}

export function renderIndex({ org, repos, css, figure }) {
  const total = repos.reduce((sum, r) => sum + r.stars, 0);
  const items = repos.map(row).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${esc(org)} — an index of public repositories." />
    <meta name="theme-color" content="#0c0d0e" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="preload" href="syne.woff2" as="font" type="font/woff2" crossorigin />
    <title>${esc(org)}</title>

    <style>
${css}
${hoverCss(repos)}
    </style>
  </head>

  <body>
    <svg class="fx" aria-hidden="true" width="0" height="0">
      <defs>
        <filter id="glow" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="soft" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="bloom" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
    </svg>

    <main class="wrap">
      <header class="top">
        <h1 class="brand">
          <a href="https://github.com/mancuoj-collective" target="_blank" rel="noopener noreferrer">mancuoj collective<span class="dot">.</span></a>
        </h1>
        <p class="stats">
          <span>repos<b>${String(repos.length).padStart(2, "0")}</b></span>
          <span>stars<b>${String(total).padStart(2, "0")}</b></span>
        </p>
      </header>

      <div class="layout">
${
    repos.length
      ? `        <ol class="repos" aria-label="Public repositories">
${items}
        </ol>`
      : `        <p class="empty">No public repositories yet.</p>`
  }

        <figure class="plate">
          <figcaption class="cap"><span class="hi">the collective</span><span>hover a repository</span></figcaption>
          <div class="fig" role="img" aria-label="${esc(org)} drawn as ${repos.length} stacked modules on a plate.">
            <svg viewBox="${figure.viewBox}" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${figure.body}</svg>
          </div>
        </figure>
      </div>

      <footer class="foot">
        <a href="https://github.com/mancuoj-collective" target="_blank" rel="noopener noreferrer">github.com/mancuoj-collective</a>
        <span class="tot">${STAR}${total}</span>
      </footer>
    </main>
  </body>
</html>
`;
}
