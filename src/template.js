// Renders the static index.html. The one visual moment is the hairline figure,
// mounted client-side by figure.js; everything else is plain static HTML.

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(repo) {
  const lang = repo.lang ? `<i class="dot" style="--c:${repo.langColor || "currentColor"}"></i>` : "";
  return `        <li>
          <a class="row" href="${esc(repo.url)}" target="_blank" rel="noopener noreferrer">
            <span class="nm">${esc(repo.name)}</span>
            <span class="ds">${esc(repo.desc)}</span>
            <span class="meta">${lang}<span class="st">${repo.stars}</span></span>
          </a>
        </li>`;
}

export function renderIndex({ org, repos, css }) {
  const total = repos.reduce((sum, r) => sum + r.stars, 0);
  const items = repos.map(row).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${esc(org)} — public repositories." />
    <meta name="theme-color" content="#fbfbfa" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0e0e0d" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <title>${esc(org)}</title>

    <style>
${css}
    </style>
  </head>

  <body>
    <main class="sheet">
      <div class="figure">
        <div class="fig" data-figure></div>
        <div class="fig-read" data-figure-read>rest</div>
      </div>

      <header class="head">
        <span class="name"><b>mancuoj collective</b> — public repositories</span>
        <span class="count">${String(repos.length).padStart(2, "0")} repos</span>
      </header>

      <ol class="list" aria-label="Public repositories">
${items}
      </ol>

      <footer class="foot">
        <span>github.com/mancuoj-collective</span>
        <span class="stars">★ ${total}</span>
      </footer>
    </main>

    <script src="figure.js" defer></script>
  </body>
</html>
`;
}
