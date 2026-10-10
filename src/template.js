// Renders the static index.html. The figure is drawn at build time (see
// figure/collective.js); hover states are wired in CSS with :has(), so the
// page ships without any JavaScript.

const STAR = `<svg class="ic-star" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .9l2.06 4.35 4.74.63-3.5 3.28.9 4.7L8 11.6l-4.2 2.26.9-4.7-3.5-3.28 4.74-.63z"/></svg>`;

// Absolute origin for the share card and canonical link (og:image must be absolute).
const SITE = "https://collective.mancuoj.me";

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(repo, i) {
  const dot = repo.lang
    ? `<i class="dot" style="--lang:${repo.langColor || "var(--line)"}"></i>`
    : "";
  return `        <li class="repo">
          <a class="row" data-i="${i}" href="${esc(repo.url)}" target="_blank" rel="noopener noreferrer">
            <span class="idx">${String(i + 1).padStart(2, "0")}</span>
            <span class="name">${dot}${esc(repo.name)}</span>
            <span class="desc">${esc(repo.desc)}</span>
            <span class="stars">${STAR}${repo.stars}</span>
          </a>
        </li>`;
}

// One rule per repository: hovering / focusing its row lights that floor,
// and hovering a floor echoes back onto its row.
export function hoverCss(repos) {
  return repos
    .map((_, i) => {
      const s = `[data-i="${i}"]`;
      return [
        `.wrap:has(.row${s}:hover) .bld${s},`,
        `.wrap:has(.row${s}:focus-visible) .bld${s},`,
        `.wrap:has(.bld${s}:hover) .bld${s} {`,
        `  --lit: 1; --pane: var(--accent); --pane-stroke: var(--accent-hi); --door: var(--accent);`,
        `}`,
        `.wrap:has(.bld${s}:hover) .row${s} .name { color: var(--accent); }`,
      ].join("\n");
    })
    .join("\n");
}

// The two-column body (index + figure). Exported so the dev-only break-ui
// fixture can swap datasets through the exact same rendering path.
export function layoutHtml({ org, repos, figure }) {
  const items = repos.map(row).join("\n");
  const list = repos.length
    ? `        <ol class="repos" aria-label="Public repositories">\n${items}\n        </ol>`
    : `        <p class="empty">No public repositories yet.</p>`;
  return `${list}

        <figure class="plate">
          <div class="plate-head">
            <span class="count"><b>${String(repos.length).padStart(2, "0")}</b> repos</span>
            <input class="theme-in" type="checkbox" id="theme" aria-label="Dark theme" title="Dark / light" />
          </div>
          <div class="fig" role="img" aria-label="${esc(org)} drawn as a tower with ${repos.length} floors.">
            <svg viewBox="${figure.viewBox}" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${figure.body}</svg>
          </div>
        </figure>`;
}

export function renderIndex({ org, repos, css, figure }) {
  const title = org;
  const desc = `${org} — repositories, stacked.`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${SITE}/" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="mancuoj collective" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${SITE}/" />
    <meta property="og:image" content="${SITE}/og.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(org)} drawn as a tower with ${repos.length} floors." />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${SITE}/og.png" />

    <meta name="theme-color" content="#0c0d0e" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#e9eaea" media="(prefers-color-scheme: light)" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="preload" href="syne.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="dm-mono-400.woff2" as="font" type="font/woff2" crossorigin />

    <script>
      // apply a remembered theme before first paint, so there is no flash
      try {
        const saved = localStorage.getItem("theme");
        if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
      } catch (e) {}
    </script>

    <style>
${css}
${hoverCss(repos)}
    </style>
  </head>

  <body>
    <svg class="fx" aria-hidden="true" width="0" height="0">
      <defs>
        <filter id="glow" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="soft" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="bloom" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
    </svg>

    <main class="wrap">
      <header class="top">
        <h1 class="brand">
          <a href="https://github.com/mancuoj-collective" target="_blank" rel="noopener noreferrer">mancuoj collective<span class="dot">.</span></a>
        </h1>
      </header>

      <div class="layout">
${layoutHtml({ org, repos, figure })}
      </div>
    </main>

    <script>
      // theme: follow the system by default, remember an explicit choice
      (function () {
        const root = document.documentElement;
        const box = document.querySelector(".theme-in");
        if (!box) return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const current = () => root.dataset.theme || (mq.matches ? "dark" : "light");
        const sync = () => { box.checked = current() === "dark"; };
        sync();
        mq.addEventListener("change", () => { if (!root.dataset.theme) sync(); });
        box.addEventListener("change", () => {
          const next = box.checked ? "dark" : "light";
          root.dataset.theme = next;
          try { localStorage.setItem("theme", next); } catch (e) {}
        });
      })();
    </script>
  </body>
</html>
`;
}
