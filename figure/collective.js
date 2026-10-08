// The figure: "the collective" drawn as a single tower — one floor per
// repository, each floor's window band lighting up on hover. A tower keeps the
// drawing clean at any repository count, however many floors there are.
//
// Pure string builder — no DOM — so scripts/build.js can render it at build
// time and ship it as static markup. Hover states are wired in CSS with
// :has(), so the page itself stays JavaScript-free.
//
// Isometric kernel after iso-figure by Tolga Cohce (MIT).

const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);

function kernel(ox, oy) {
  const P = (x, y, z) => [(x - y) * C + ox, (x + y) * S - z + oy];
  const D3 = (x, y, z) => [(x - y) * C, (x + y) * S - z];
  const plane = (O, U, V) => {
    const o = P(...O);
    const u = D3(...U);
    const v = D3(...V);
    return `matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${o[0]} ${o[1]})`;
  };
  const TOP = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 1, 0]);
  const FRONT = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 0, -1]);
  const SIDE = (x, y, z) => plane([x, y, z], [0, -1, 0], [0, 0, -1]);
  const rect = (t, w, h, r = 0, cls = "face") =>
    `<g transform="${t}"><rect class="${cls}" width="${w}" height="${h}" rx="${r}"/></g>`;
  const box = (x, y, z, w, d, h, cls = "face") =>
    rect(SIDE(x + w, y + d, z + h), d, h, 0, cls) +
    rect(FRONT(x, y + d, z + h), w, h, 0, cls) +
    rect(TOP(x, y, z + h), w, d, 0, `${cls} top`);
  return { P, TOP, FRONT, SIDE, rect, box };
}

function frame(points, margin = 0.075) {
  const proj = points.map(([x, y, z]) => [(x - y) * C, (x + y) * S - z]);
  const xs = proj.map((p) => p[0]);
  const ys = proj.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const m = margin * Math.max(x1 - x0, y1 - y0);
  const w = x1 - x0 + 2 * m;
  const h = y1 - y0 + 2 * m;
  return { ...kernel(m - x0, m - y0), viewBox: `0 0 ${w.toFixed(1)} ${h.toFixed(1)}` };
}

// ---- geometry (arbitrary units; the frame normalises them) ----
const W = 104; // tower width  (x)
const D = 84; //  tower depth  (y)
const PAD = 34;
const BASE = 10; //  plate thickness
const LOBBY = 28; // lobby height
const ROOF = 9;
const PITCH = 15; // window pane pitch

// a grid of panes drawn in a face-local group (0,0 = face top-left)
function panes(w, h, inset = 5) {
  const iw = Math.max(6, w - inset * 2);
  const ih = Math.max(6, h - inset * 2);
  const cols = Math.max(2, Math.round(iw / PITCH));
  const rows = Math.max(1, Math.round(ih / PITCH));
  const pw = iw / cols;
  const ph = ih / rows;
  const g = 2;
  let s = "";
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++)
      s += `<rect class="pane" x="${(inset + c * pw + g / 2).toFixed(2)}" y="${(inset + r * ph + g / 2).toFixed(2)}" width="${(pw - g).toFixed(2)}" height="${(ph - g).toFixed(2)}"/>`;
  return s;
}

export function buildCollective(repos) {
  const n = Math.max(1, repos.length);
  // more floors ⇒ shorter floors, so a tall tower never runs away
  const FH = Math.max(26, Math.min(44, Math.round(150 / n)));
  const BW = W + PAD * 2;
  const BD = D + PAD * 2;
  const lobbyTop = BASE + LOBBY;
  const shaftTop = lobbyTop + n * FH;
  const mastZ = shaftTop + ROOF + 22;

  const K = frame([
    [0, 0, 0], [BW, 0, 0], [0, BD, 0], [BW, BD, 0],
    [0, 0, mastZ], [BW, 0, mastZ], [0, BD, mastZ], [BW, BD, mastZ],
  ]);
  const { P, TOP, FRONT, SIDE, box } = K;
  const x = PAD;
  const y = PAD;

  // ---- ground plate ----
  let body = box(0, 0, 0, BW, BD, BASE, "face");
  body += `<g transform="${TOP(0, 0, BASE)}">` +
    `<rect class="detail" x="9" y="9" width="${BW - 18}" height="${BD - 18}" rx="4"/>` +
    [[14, 14], [BW - 14, 14], [14, BD - 14], [BW - 14, BD - 14]].map(([sx, sy]) => `<circle class="detail" cx="${sx}" cy="${sy}" r="3.2"/>`).join("") +
  `</g>`;

  // ---- lobby ----
  body += box(x, y, BASE, W, D, LOBBY, "face");
  body += `<g transform="${TOP(x, y, lobbyTop)}"><rect class="detail" x="8" y="8" width="${W - 16}" height="${D - 16}" rx="3"/></g>`;
  body += `<g transform="${FRONT(x, y + D, lobbyTop)}">` +
    `<rect class="glass" x="10" y="7" width="${W - 20}" height="${LOBBY - 14}" rx="2"/>` +
  `</g>`;
  body += `<g transform="${SIDE(x + W, y + D, lobbyTop)}">` +
    `<rect class="glass" x="8" y="7" width="${D - 16}" height="${LOBBY - 14}" rx="2"/>` +
  `</g>`;
  // the entrance sits on the front face, over the glass
  body += `<g transform="${FRONT(x, y + D, BASE + 20)}"><rect class="door" x="${W / 2 - 9}" y="0" width="18" height="20" rx="1"/></g>`;

  // ---- floors: one .bld per repository, painted bottom → top ----
  for (let i = 0; i < n; i++) {
    const z = lobbyTop + i * FH;
    const face = (t, w) =>
      `<g class="face-group" transform="${t}">` +
        `<rect class="halo" x="-3" y="-3" width="${w + 6}" height="${FH + 6}" rx="3"/>` +
        `<g class="win">${panes(w, FH)}</g>` +
      `</g>`;
    body += `<g class="bld" data-i="${i}">` +
      box(x, y, z, W, D, FH, "face") +
      face(FRONT(x, y + D, z + FH), W) +
      face(SIDE(x + W, y + D, z + FH), D) +
    `</g>`;
  }

  // ---- roof, mast, beacon ----
  body += box(x + 5, y + 5, shaftTop, W - 10, D - 10, ROOF, "face");
  body += `<g transform="${TOP(x + 5, y + 5, shaftTop + ROOF)}"><rect class="detail" x="6" y="6" width="${W - 22}" height="${D - 22}" rx="2"/></g>`;
  body += box(x + W / 2 - 2, y + D / 2 - 2, shaftTop + ROOF, 4, 4, 20, "face");
  const bp = P(x + W / 2, y + D / 2, shaftTop + ROOF + 26);
  body += `<circle class="beacon-halo" cx="${bp[0].toFixed(1)}" cy="${bp[1].toFixed(1)}" r="7" filter="url(#bloom)"/>` +
    `<circle class="beacon" cx="${bp[0].toFixed(1)}" cy="${bp[1].toFixed(1)}" r="2.1" filter="url(#glow)"/>`;

  return { viewBox: K.viewBox, body };
}
