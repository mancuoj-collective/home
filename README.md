# mancuoj-collective · home

A single static page that indexes the public repositories of
[`mancuoj-collective`](https://github.com/mancuoj-collective) — name, description,
language and star count — in a fine-line Swiss lattice.

Stars are captured **at build time** by fetching the GitHub API, and the site is
**rebuilt on a schedule** (every 6 hours) by GitHub Actions, so the numbers stay
current without any client-side requests or tokens.

## Local

```sh
bun run build     # fetch GitHub data → dist/index.html
bun run preview   # build, then serve dist/ at http://localhost:4321
```

Set `GITHUB_TOKEN` (or `GH_TOKEN`) to raise the API rate limit while building:

```sh
GITHUB_TOKEN=$(gh auth token) bun run build
```

## Deploy

Pushing to `main` builds and publishes `dist/` to GitHub Pages via
`.github/workflows/deploy.yml`. To enable it once:

1. Push this repo to `github.com/mancuoj-collective/home`.
2. **Settings → Pages → Source: GitHub Actions**.

It will be served at `https://mancuoj-collective.github.io/home/`. To serve at the
org root instead, name the repository `mancuoj-collective.github.io`.

The `schedule` trigger re-runs the build every 6 hours; `workflow_dispatch` lets
you refresh on demand.

## Layout

```
src/styles.css      the whole design (light + dark, self-hosted Syne)
src/template.js     HTML renderer, no dependencies
scripts/build.js    fetch org repos + org meta → dist/index.html
scripts/serve.js    tiny local static server
public/             font + license + favicon, copied into dist/
```

Fonts: [Syne](https://fonts.google.com/specimen/Syne), SIL OFL 1.1
(`public/syne-OFL.txt`).
