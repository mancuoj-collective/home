# mancuoj-collective · home

A single static page that indexes the public repositories of
[`mancuoj-collective`](https://github.com/mancuoj-collective) — name, description,
language and star count — in a fine-line Swiss lattice.

The page is built from data fetched from the GitHub API **at build time**, so the
deployed output is fully static (no client-side requests, no tokens).

- Live: <https://collective.mancuoj.me>
- Netlify project: `mancuoj-collective`

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

Deployment is handled by **Netlify's Git integration** — no CI. Pushing to `main`
triggers a build on Netlify (using `netlify.toml`: `node scripts/build.js` →
`dist/`), and the result is published to the custom domain.

The repository link is a one-time setup:

1. Netlify → project `mancuoj-collective` → **Project configuration → Build & deploy →
   Continuous deployment → Link repository**.
2. Pick `mancuoj-collective/home`, production branch `main`.

After that, every push auto-deploys. `collective.mancuoj.me` is attached to the
project and covered by the existing `*.mancuoj.me` certificate.

### Refreshing star counts

Because the build only runs on push, stars refresh on each push. If you want a
guaranteed periodic refresh with no push, add a **build hook**
(Project configuration → Build & deploy → Build hooks) and POST to it from any
cron — for example a tiny GitHub Actions `schedule` workflow that only runs
`curl -X POST <hook>`. (Netlify's own Scheduled Functions require a Pro plan.)

## Layout

```
src/styles.css      the whole design (light + dark, self-hosted Syne)
src/template.js     HTML renderer, no dependencies
scripts/build.js    fetch org repos + org meta → dist/index.html
scripts/serve.js    tiny local static server
public/             font, license, favicon, Netlify _headers
netlify.toml        build command + publish dir + Node version
```

Fonts: [Syne](https://fonts.google.com/specimen/Syne), SIL OFL 1.1
(`public/syne-OFL.txt`).
