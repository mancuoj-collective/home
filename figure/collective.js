// The figure: "the collective" drawn as a small skyline — one building per
// repository, each with a window grid that lights up on hover.
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
const W = 48; // building width  (x)
const D = 60; // building depth  (y)
const GAP = 16;
const PAD = 28;
const BASE = 10;
const PITCH = 15; // window pane pitch

// a grid of panes drawn in a face-local group (0,0 = face top-left)
function panes(w, h, inset = 5) {
  const iw = Math.max(6, w - inset * 2);
  const ih = Math.max(6, h - inset * 2);
  const cols = Math.max(2, Math.round(iw / PITCH));
  const rows = Math.max(2, Math.round(ih / PITCH));
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
  // taller = more stars, plus a stable stagger so the skyline reads as a row
  const heights = repos.map((r, i) => 78 + Math.min(r.stars || 0, 9) * 14 + (i % 3) * 18);
  const maxH = Math.max(...heights);
  const rowW = n * W + (n - 1) * GAP;
  const BW = rowW + PAD * 2;
  const BD = D + PAD * 2;
  const mastZ = BASE + maxH + 26;

  const K = frame([
    [0, 0, 0], [BW, 0, 0], [0, BD, 0], [BW, BD, 0],
    [0, 0, mastZ], [BW, 0, mastZ], [0, BD, mastZ], [BW, BD, mastZ],
  ]);
  const { P, TOP, FRONT, SIDE, box } = K;

  // ---- ground plate ----
  let body = box(0, 0, 0, BW, BD, BASE, "face");
  body += `<g transform="${TOP(0, 0, BASE)}">` +
    `<rect class="detail" x="9" y="9" width="${BW - 18}" height="${BD - 18}" rx="4"/>` +
    `<line class="detail" x1="12" y1="${BD - 12}" x2="${BW - 12}" y2="${BD - 12}"/>` +
    [[14, 14], [BW - 14, 14], [14, BD - 14], [BW - 14, BD - 14]].map(([sx, sy]) => `<circle class="detail" cx="${sx}" cy="${sy}" r="3.2"/>`).join("") +
  `</g>`;

  // ---- buildings, drawn left → right (far → near) ----
  let mastDone = false;
  for (let i = 0; i < n; i++) {
    const x = PAD + i * (W + GAP);
    const y = PAD;
    const h = heights[i];
    const zTop = BASE + h;
    const tallest = h === maxH && !mastDone;

    let b = box(x, y, BASE, W, D, h, "face");
    b += box(x + 3, y + 3, zTop, W - 6, D - 6, 5, "face"); // roof cap

    const face = (t, w) =>
      `<g class="face-group" transform="${t}">` +
        `<rect class="halo" x="-3" y="-3" width="${w + 6}" height="${h + 6}" rx="3"/>` +
        `<g class="win">${panes(w, h)}</g>` +
      `</g>`;
    b += face(FRONT(x, y + D, zTop), W);
    b += face(SIDE(x + W, y + D, zTop), D);

    // a doorway at the base of the front face
    b += `<g transform="${FRONT(x, y + D, BASE + 22)}"><rect class="door" x="${W / 2 - 7}" y="0" width="14" height="22" rx="1"/></g>`;

    if (tallest) {
      mastDone = true;
      b += box(x + W / 2 - 2, y + D / 2 - 2, zTop + 5, 4, 4, 16, "face");
      const bp = P(x + W / 2, y + D / 2, zTop + 22);
      b += `<circle class="beacon-halo" cx="${bp[0].toFixed(1)}" cy="${bp[1].toFixed(1)}" r="7" filter="url(#bloom)"/>` +
        `<circle class="beacon" cx="${bp[0].toFixed(1)}" cy="${bp[1].toFixed(1)}" r="2.1" filter="url(#glow)"/>`;
    }

    body += `<g class="bld" data-i="${i}">${b}</g>`;
  }

  return { viewBox: K.viewBox, body };
}
