// The figure: "the collective" drawn as a rack of modules, one per repository.
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
  const D = (x, y, z) => [(x - y) * C, (x + y) * S - z];
  const plane = (O, U, V) => {
    const o = P(...O);
    const u = D(...U);
    const v = D(...V);
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
  return { P, D, TOP, FRONT, SIDE, rect, box };
}

// Frame the scene from its extreme 3D corners; the viewBox is the tight
// projection plus a margin, so the svg scales fluidly with width:100%.
function frame(points, margin = 0.08) {
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

// ---- geometry (units are arbitrary; the frame normalises them) ----
const W = 164; // module width  (x)
const D = 106; // module depth  (y)
const H = 42; //  module height (z)
const GAP = 5; //  seam between stacked modules
const BASE = 10; // ground plate thickness
const PADX = 24;
const PADY = 24;
const BW = W + PADX * 2;
const BD = D + PADY * 2;

export function buildCollective(repos) {
  const n = Math.max(1, repos.length);
  const topZ = BASE + n * (H + GAP);
  const K = frame([
    [0, 0, 0], [BW, 0, 0], [0, BD, 0], [BW, BD, 0],
    [0, 0, topZ], [BW, 0, topZ], [0, BD, topZ], [BW, BD, topZ],
  ]);
  const { TOP, FRONT, rect, box } = K;

  const x = PADX;
  const y = PADY;

  // ground plate: a hairline inset near its rim, plus a screw at each corner
  let body = box(0, 0, 0, BW, BD, BASE, "face");
  body += `<g transform="${TOP(0, 0, BASE)}"><rect class="detail" x="9" y="9" width="${BW - 18}" height="${BD - 18}" rx="4"/></g>`;
  for (const [sx, sy] of [[13, 13], [BW - 13, 13], [13, BD - 13], [BW - 13, BD - 13]]) {
    body += `<g transform="${TOP(sx, sy, BASE)}"><circle class="detail" r="3.4"/></g>`;
  }
  // an always-on indicator on the plate's front edge
  body += `<g transform="${FRONT(0, BD, BASE)}"><rect class="power" x="16" y="3.3" width="3.4" height="3.4" rx="1.2"/></g>`;

  for (let i = 0; i < n; i++) {
    const z = BASE + i * (H + GAP);
    const front = FRONT(x, y + D, z + H);
    const top = TOP(x, y, z + H);
    const ledY = (H - 6) / 2;

    body +=
      `<g class="mod" data-i="${i}">` +
        box(x, y, z, W, D, H, "face") +
        // top face: a hairline vent
        `<g transform="${top}"><rect class="detail" x="14" y="14" width="${W - 28}" height="${D - 28}" rx="3"/></g>` +
        // front face: recessed screen, content lines, an LED, and the lit overlay
        `<g transform="${front}">` +
          `<rect class="screen" x="12" y="9" width="124" height="${H - 18}" rx="2"/>` +
          `<line class="detail" x1="20" y1="17" x2="88" y2="17"/>` +
          `<line class="detail" x1="20" y1="23" x2="58" y2="23"/>` +
          `<rect class="led" x="146" y="${ledY}" width="6" height="6" rx="2"/>` +
          `<g class="hot">` +
            `<rect class="halo" x="5" y="-2" width="138" height="${H + 4}" rx="6"/>` +
            `<rect class="beam" x="12" y="9" width="124" height="${H - 18}" rx="2"/>` +
            `<rect class="led-on" x="146" y="${ledY}" width="6" height="6" rx="2"/>` +
          `</g>` +
        `</g>` +
      `</g>`;
  }

  return { viewBox: K.viewBox, body };
}
