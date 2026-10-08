/**
 * Modules: a pallet of seven crates of different heights. The pointer picks the
 * crate under it; it rises to full height and takes the bright edge, and its
 * neighbours rise less, staggered outwards. At rest the crates form a skyline,
 * the tallest lit. The slider is the reach, in crates.
 *
 * The pattern: discrete items on a ground plane. A static hit test along the
 * resting centres, tweens with a stagger by distance, and a rest that is a
 * composition.
 */
const {
  Cam, facing, fit, prism, proj, rings, tween, tset, tval, tdone,
  mk, pointer, put, register, disposer, solid,
} = HL;

const N = 5, FOOT = 14, STEP = 30, BASE = 7, LIFT = 30;
const H0 = [14, 24, 18, 34, 22];
const PEAK = 3;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value, over = -1;

  const X1 = (N - 1) * STEP + FOOT, Y1 = FOOT, HMAX = Math.max(...H0) + LIFT;
  const C = Cam(45, 0.5, 2.6);
  fit(C, [
    [-6, -6, -BASE], [X1 + 6, Y1 + 6, -BASE], [X1 + 6, -6, -BASE], [-6, Y1 + 6, -BASE],
    [0, 0, HMAX],
  ], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-6, -6, X1 + 6, Y1 + 6, 5, 1.6);
  put(solid(g), prism(P, front, pr, pi, -BASE, 0));

  // back to front: ascending x + y
  const crates = [];
  for (let i = 0; i < N; i++) {
    const x0 = i * STEP;
    const [ring, inner] = rings(x0, 0, x0 + FOOT, Y1, 2.2, 0.9);
    crates.push({ i, ring, inner, el: solid(g), h: tween(H0[i]), drawn: NaN });
  }

  // hit: the nearest resting centre along screen x, tested against the rest pose
  const cx = crates.map((_, i) => P(i * STEP + FOOT / 2, Y1 / 2, H0[i]));
  const sxMin = Math.min(...cx.map((p) => p[0])) - 14, sxMax = Math.max(...cx.map((p) => p[0])) + 14;
  const syMin = Math.min(...cx.map((p) => p[1])) - 44, syMax = P(X1 / 2, Y1, 0)[1] + 30;

  const liftAt = (a, i) => {
    if (a < 0) return 0;
    const u = Math.abs(i - a) / R;
    if (u >= 1) return 0;
    const f = 1 - u;
    return LIFT * f * f * (3 - 2 * f);
  };

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const c of crates) {
      const h = Math.max(0.5, tval(c.h, now));
      if (h !== c.drawn) { c.drawn = h; put(c.el, prism(P, front, c.ring, c.inner, 0, h)); }
      if (!tdone(c.h, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  function setActive(a) {
    if (a === over) return;
    const from = a >= 0 ? a : over, now = performance.now();
    over = a;
    crates.forEach((c, i) => tset(c.h, H0[i] + liftAt(a, i), now, Math.abs(i - from) * 45));
    const bright = a >= 0 ? a : PEAK;
    crates.forEach((c, i) => c.el.sil.classList.toggle("hi", i === bright));
    read.textContent = a < 0 ? "rest" : `module ${a + 1}`;
    B.wake();
  }

  const hit = ([x, y]) => {
    if (x < sxMin || x > sxMax || y < syMin || y > syMax) return -1;
    let best = 0, bd = Infinity;
    for (let i = 0; i < N; i++) { const d = Math.abs(cx[i][0] - x); if (d < bd) { bd = d; best = i; } }
    return best;
  };

  crates.forEach((c, i) => c.el.sil.classList.toggle("hi", i === PEAK));
  read.textContent = "rest";

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over >= 0) setActive(over); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "modules",
  means: "Five modules on a pallet: the one under the pointer rises, and its neighbours rise less.",
  rules: [1, 2, 5, 9],
  range: [1, 2, 3.2],
  mount,
});
