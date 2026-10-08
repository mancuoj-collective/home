// Renders the static index.html. The only drawing is a plain static line figure
// (the hairline figure's rest pose, inlined as SVG — no JS, no read-out).

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// large counts get a compact form (1.2k), small ones stay exact
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const fmt = (n) => (n < 1000 ? String(n) : compact.format(n));

const FIGURE = `<svg class="fig" viewBox="42 118 318 206" role="img" aria-label="Five modules on a pallet">
          <g><g><path class="sil" d="M47.28 169.5L48.27 167.02L51.08 164.91L80.5 150.2L84.72 148.79L89.69 148.29L94.67 148.79L98.88 150.2L348.92 275.22L351.73 277.32L352.72 279.81L352.72 295.57L351.73 298.06L348.92 300.17L319.5 314.88L315.28 316.29L310.31 316.78L305.33 316.29L301.12 314.88L51.08 189.86L48.27 187.75L47.28 185.26Z"></path><path class="nf lo" d="M348.56 279.81L347.89 281.5L345.98 282.94L316.56 297.64L313.69 298.6L310.31 298.94L306.93 298.6L304.06 297.64L54.02 172.63L52.11 171.19L51.44 169.5"></path></g><g><path class="sil" d="M66.32 137.98L66.76 136.88L68 135.96L85.65 127.13L87.5 126.51L89.69 126.29L91.88 126.51L93.74 127.13L111.39 135.96L112.63 136.88L113.06 137.98L113.06 169.5L112.63 170.6L111.39 171.53L93.74 180.35L91.88 180.97L89.69 181.19L87.5 180.97L85.65 180.35L68 171.53L66.76 170.6L66.32 169.5Z"></path><path class="nf lo" d="M110.72 137.98L110.46 138.63L109.73 139.17L92.08 148L90.98 148.37L89.69 148.49L88.4 148.37L87.3 148L69.65 139.17L68.92 138.63L68.66 137.98"></path></g><g><path class="sil" d="M121.48 143.04L121.91 141.95L123.15 141.02L140.8 132.19L142.66 131.57L144.85 131.36L147.03 131.57L148.89 132.19L166.54 141.02L167.78 141.95L168.22 143.04L168.22 197.08L167.78 198.17L166.54 199.1L148.89 207.93L147.03 208.55L144.85 208.76L142.66 208.55L140.8 207.93L123.15 199.1L121.91 198.17L121.48 197.08Z"></path><path class="nf lo" d="M165.88 143.04L165.62 143.69L164.89 144.23L147.24 153.06L146.14 153.43L144.85 153.55L143.55 153.43L142.46 153.06L124.81 144.23L124.07 143.69L123.82 143.04"></path></g><g><path class="sil" d="M176.63 184.13L177.07 183.03L178.31 182.1L195.96 173.28L197.81 172.66L200 172.44L202.19 172.66L204.04 173.28L221.69 182.1L222.93 183.03L223.37 184.13L223.37 224.66L222.93 225.75L221.69 226.68L204.04 235.5L202.19 236.12L200 236.34L197.81 236.12L195.96 235.5L178.31 226.68L177.07 225.75L176.63 224.66Z"></path><path class="nf lo" d="M221.03 184.13L220.77 184.77L220.04 185.32L202.39 194.15L201.29 194.51L200 194.64L198.71 194.51L197.61 194.15L179.96 185.32L179.23 184.77L178.97 184.13"></path></g><g><path class="sil hi" d="M231.78 175.68L232.22 174.58L233.46 173.66L251.11 164.83L252.97 164.21L255.15 163.99L257.34 164.21L259.2 164.83L276.85 173.66L278.09 174.58L278.52 175.68L278.52 252.23L278.09 253.33L276.85 254.26L259.2 263.08L257.34 263.7L255.15 263.92L252.97 263.7L251.11 263.08L233.46 254.26L232.22 253.33L231.78 252.23Z"></path><path class="nf lo" d="M276.18 175.68L275.93 176.32L275.19 176.87L257.54 185.7L256.45 186.06L255.15 186.19L253.86 186.06L252.76 185.7L235.11 176.87L234.38 176.32L234.12 175.68"></path></g><g><path class="sil" d="M286.94 230.27L287.37 229.18L288.61 228.25L306.26 219.43L308.12 218.81L310.31 218.59L312.5 218.81L314.35 219.43L332 228.25L333.24 229.18L333.68 230.27L333.68 279.81L333.24 280.91L332 281.83L314.35 290.66L312.5 291.28L310.31 291.5L308.12 291.28L306.26 290.66L288.61 281.83L287.37 280.91L286.94 279.81Z"></path><path class="nf lo" d="M331.34 230.27L331.08 230.92L330.35 231.47L312.7 240.29L311.6 240.66L310.31 240.79L309.02 240.66L307.92 240.29L290.27 231.47L289.54 230.92L289.28 230.27"></path></g></g>
        </svg>`;

function row(repo) {
  const lang = repo.lang ? `<i class="dot" style="--c:${repo.langColor || "currentColor"}"></i>` : "";
  const desc = repo.desc ? `<span class="ds" title="${esc(repo.desc)}">${esc(repo.desc)}</span>` : `<span class="ds"></span>`;
  return `        <li>
          <a class="row" href="${esc(repo.url)}" target="_blank" rel="noopener noreferrer">
            <span class="nm" title="${esc(repo.name)}">${esc(repo.name)}</span>
            ${desc}
            <span class="meta">${lang}<span class="st">${fmt(repo.stars)}</span></span>
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
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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
      <div class="figure">${FIGURE}</div>

      <header class="head">
        <span class="name"><b>mancuoj collective</b></span>
        <span class="count">${fmt(repos.length)} repos</span>
      </header>

${
    repos.length
      ? `      <ol class="list" aria-label="Public repositories">
${items}
      </ol>`
      : `      <p class="empty">No public repositories yet.</p>`
  }

      <footer class="foot">
        <a href="https://github.com/mancuoj-collective" target="_blank" rel="noopener noreferrer">github.com/mancuoj-collective</a>
        <span class="stars">★ ${fmt(total)}</span>
      </footer>
    </main>
  </body>
</html>
`;
}
