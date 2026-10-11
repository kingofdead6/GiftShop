/**
 * A tiny "3D printer" on a 2D canvas.
 *
 * Each object is a stack of layers, exactly like an FDM print. A layer is a
 * closed loop whose radius comes from a vertical profile and a surface
 * modulation (crumples, lemon pores, ribs, waves). Only the front half of each
 * loop is drawn, back to front, shaded per segment from a real surface normal,
 * so textures read as relief rather than as stripes.
 *
 * No WebGL, no dependency: ~100 layers x 56 segments, batched by brightness
 * into a handful of strokes per layer, runs at 60fps on a mid-range phone.
 */

const TAU = Math.PI * 2;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Shapes. `profile(t)` is the radius at height t in [0, 1]; `mod(a, t)` is a
 * radial multiplier around the loop. Units are arbitrary: the renderer fits
 * the object to the canvas.
 */
export const SHAPES = {
  kraft: {
    nom: 'Vase Sac Kraft',
    height: 2.0,
    layers: 96,
    profile: (t) => 0.78 + 0.04 * Math.sin(t * 3.2) + 0.06 * smooth(0.9, 1, t),
    mod: (a, t) => {
      // Rounded square cross-section, then crumples.
      const c = Math.abs(Math.cos(a)) ** 4 + Math.abs(Math.sin(a)) ** 4;
      const sq = c ** -0.25 * 0.86;
      const crumple =
        0.045 * Math.sin(5 * a + 9 * t) +
        0.035 * Math.sin(9 * a - 14 * t + 1.3) +
        0.025 * Math.sin(14 * a + 23 * t + 2.1) +
        0.03 * Math.sin(3 * a + 31 * t + 0.4) +
        0.02 * Math.sin(21 * a - 37 * t);
      const rim = smooth(0.94, 1, t) * 0.05 * Math.sin(11 * a);
      return sq * (1 + crumple + rim);
    },
  },
  citron: {
    nom: 'Vase Citron',
    height: 1.55,
    layers: 84,
    profile: (t) => {
      const body = 0.95 * Math.sin(Math.PI * (0.06 + 0.86 * t)) ** 0.75;
      return Math.max(0.24, body) + 0.05 * smooth(0.95, 1, t);
    },
    mod: (a, t) =>
      1 +
      0.014 * Math.sin(41 * a + 3 * t) * Math.sin(57 * t) +
      0.011 * Math.sin(29 * a - 71 * t + 1.7) +
      0.008 * Math.sin(67 * a + 43 * t),
  },
  cactus: {
    nom: 'Pot Cactus',
    height: 1.5,
    layers: 80,
    profile: (t) => {
      const top = t > 0.7 ? Math.sqrt(Math.max(0, 1 - ((t - 0.7) / 0.32) ** 2)) : 1;
      return Math.max(0.22, 0.78 * top) * (1 - 0.06 * smooth(0, 0.1, 0.1 - t));
    },
    mod: (a) => 0.84 + 0.16 * Math.abs(Math.cos(4 * a)) ** 0.6,
  },
  sculpte: {
    nom: 'Vase Sculpté',
    height: 2.3,
    layers: 104,
    profile: (t) => 0.5 + 0.32 * Math.sin(Math.PI * Math.min(1, t * 1.15)) - 0.12 * smooth(0.75, 1, t) + 0.14 * smooth(0.9, 1, t),
    mod: (a, t) => 1 + 0.13 * Math.sin(5 * a + t * 5.5),
  },
  vague: {
    nom: 'Lampe Vague',
    height: 2.1,
    layers: 104,
    glow: true,
    profile: (t) => 0.7 + 0.08 * Math.sin(Math.PI * t) - 0.1 * smooth(0.85, 1, t),
    mod: (a, t) => 1 + 0.05 * Math.sin(30 * t + 2.2 * Math.sin(3 * a)) + 0.012 * Math.sin(24 * a),
  },
  flamme: {
    nom: 'Lampe Flamme',
    height: 2.3,
    layers: 104,
    glow: true,
    profile: (t) => Math.max(0.05, 0.82 * Math.sin(Math.PI * t ** 0.72) ** 0.9 * (1 - 0.15 * t)),
    mod: (a, t) => 1 + 0.2 * Math.sin(3 * a + t * 7),
  },
};

// ── Colour helpers ───────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const LEVELS = 14;

/** Brightness ramp for one colour, precomputed so a frame does no string work. */
function ramp(hex, glow) {
  const [r, g, b] = hexToRgb(hex);
  const out = [];
  for (let i = 0; i < LEVELS; i++) {
    const k = i / (LEVELS - 1);
    const lit = glow ? 0.55 + 0.75 * k : 0.22 + 1.0 * k;
    // Highlights drift toward white so the top of the ramp looks like sheen.
    const spec = Math.max(0, k - 0.82) * 2.2;
    const ch = (c) => Math.round(Math.min(255, c * lit + (255 - c * lit) * spec));
    out.push(`rgb(${ch(r)},${ch(g)},${ch(b)})`);
  }
  return out;
}

const rampCache = new Map();
function getRamp(hex, glow) {
  const key = hex + (glow ? 'g' : '');
  if (!rampCache.has(key)) rampCache.set(key, ramp(hex, glow));
  return rampCache.get(key);
}

// Light from the upper left, slightly toward the viewer.
const L = (() => {
  const v = [-0.55, 0.55, 0.65];
  const m = Math.hypot(...v);
  return v.map((x) => x / m);
})();

const SEG = 56;

/**
 * Draw one frame.
 *
 * progress  0..1, how much of the object is printed (fractional layers draw a
 *           partial loop and place the nozzle on it)
 * rotation  radians, spins the surface pattern
 * tilt      0..0.5, how far the camera looks down
 */
export function drawPrint(ctx, w, h, opts) {
  const {
    shape: shapeKey,
    color = '#C49A6C',
    progress = 1,
    rotation = 0,
    tilt = 0.26,
    nozzle = false,
    rail = false,
    glow: glowOpt,
    padding = 0.12,
  } = opts;
  const shape = SHAPES[shapeKey] || SHAPES.kraft;
  const glow = glowOpt ?? shape.glow;
  const N = shape.layers;
  const shades = getRamp(color, glow);

  // Fit: widest radius x2 across, height plus the tilt ellipse down.
  let maxR = 0;
  for (let i = 0; i <= 20; i++) maxR = Math.max(maxR, shape.profile(i / 20));
  maxR *= 1.22;
  const availW = w * (1 - padding * 2);
  const availH = h * (1 - padding * 2);
  const s = Math.min(availW / (2 * maxR), availH / (shape.height + 2 * maxR * tilt));
  const cx = w / 2;
  const baseY = h / 2 + ((shape.height + 2 * maxR * tilt) * s) / 2 - maxR * tilt * s;

  const layerPx = (shape.height * s) / N;
  const done = Math.max(0, Math.min(N, progress * N));
  const full = Math.floor(done);
  const frac = done - full;

  // Floor shadow.
  ctx.save();
  const sh = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, maxR * s * 1.25);
  sh.addColorStop(0, glow ? 'rgba(255,170,90,0.28)' : 'rgba(0,0,0,0.22)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, maxR * s * 1.25, maxR * s * 1.25 * tilt, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Lamp halo, behind everything.
  if (glow && done > 0) {
    const topY = baseY - (done / N) * shape.height * s;
    const midY = (baseY + topY) / 2;
    const rad = Math.max(shape.height * s * 0.9, 1);
    const halo = ctx.createRadialGradient(cx, midY, 0, cx, midY, rad);
    const [r, g, b] = hexToRgb(color);
    halo.addColorStop(0, `rgba(${r},${g},${b},${0.35 * Math.min(1, done / N + 0.2)})`);
    halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, layerPx * 1.18);

  const eps = 0.002;
  const radius = (a, t) => shape.profile(t) * shape.mod(a + rotation, t);

  const buckets = Array.from({ length: LEVELS }, () => []);

  const point = (a, t) => {
    const r = radius(a, t);
    return [cx + r * Math.cos(a) * s, baseY - t * shape.height * s + r * Math.sin(a) * s * tilt];
  };

  const brightness = (a, t, i) => {
    const r = radius(a, t);
    const dra = (radius(a + eps, t) - radius(a - eps, t)) / (2 * eps);
    const drt = (radius(a, t + eps) - radius(a, t - eps)) / (2 * eps) / shape.height;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    // Tangents of the surface P(a, y) = (r cos a, y, r sin a).
    const ta = [dra * ca - r * sa, 0, dra * sa + r * ca];
    const ty = [drt * ca, 1, drt * sa];
    // n = ta x ty, oriented outward.
    let n = [ta[1] * ty[2] - ta[2] * ty[1], ta[2] * ty[0] - ta[0] * ty[2], ta[0] * ty[1] - ta[1] * ty[0]];
    if (n[0] * ca + n[2] * sa < 0) n = n.map((x) => -x);
    const m = Math.hypot(...n) || 1;
    const d = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / m;
    let b = 0.18 + 0.82 * Math.max(0, d);
    // Rim of the silhouette darkens, like a real curved surface.
    b *= 0.75 + 0.25 * Math.abs(n[2] / m);
    // Every other layer a touch darker: the visible print lines.
    if (i % 2) b *= 0.93;
    return Math.max(0, Math.min(LEVELS - 1, Math.round(b * (LEVELS - 1))));
  };

  const drawLayer = (i, aEnd = Math.PI, aStart = 0) => {
    const t = i / (N - 1);
    for (const bkt of buckets) bkt.length = 0;
    const steps = Math.max(2, Math.ceil(((aEnd - aStart) / Math.PI) * (SEG / 2)));
    let prev = point(aStart, t);
    for (let k = 1; k <= steps; k++) {
      const a = aStart + ((aEnd - aStart) * k) / steps;
      const p = point(a, t);
      const lvl = brightness(a - (aEnd - aStart) / steps / 2, t, i);
      buckets[lvl].push(prev[0], prev[1], p[0], p[1]);
      prev = p;
    }
    for (let lvl = 0; lvl < LEVELS; lvl++) {
      const seg = buckets[lvl];
      if (!seg.length) continue;
      ctx.strokeStyle = shades[lvl];
      ctx.beginPath();
      for (let j = 0; j < seg.length; j += 4) {
        ctx.moveTo(seg[j], seg[j + 1]);
        ctx.lineTo(seg[j + 2], seg[j + 3]);
      }
      ctx.stroke();
    }
  };

  // The opening sits on the topmost finished layer: interior fill, then the
  // back wall seen from inside.
  const topIndex = Math.min(full, N) - 1;
  const drawOpening = (i) => {
    const t = i / (N - 1);
    ctx.beginPath();
    for (let k = 0; k <= SEG; k++) {
      const [x, y] = point((k / SEG) * TAU, t);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = glow ? shades[LEVELS - 1] : shades[1];
    ctx.fill();
    // Back half of the rim, seen from inside: dim.
    ctx.strokeStyle = glow ? shades[LEVELS - 3] : shades[3];
    ctx.beginPath();
    for (let k = 0; k <= SEG / 2; k++) {
      const [x, y] = point(Math.PI + (k / (SEG / 2)) * Math.PI, t);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  for (let i = 0; i < full; i++) {
    if (i === topIndex) drawOpening(i);
    drawLayer(i);
  }

  // The layer being printed right now. The nozzle runs a full loop; only the
  // front half is visible on the object.
  let nozzleAt = null;
  if (frac > 0 && full < N) {
    const a = frac * TAU;
    drawLayer(full, Math.min(a, Math.PI));
    if (a > Math.PI) {
      ctx.globalAlpha = 0.5;
      drawLayer(full, a, Math.PI);
      ctx.globalAlpha = 1;
    }
    nozzleAt = point(a, full / (N - 1));
  }

  if (rail && nozzleAt) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, nozzleAt[1] - 34);
    ctx.lineTo(w, nozzleAt[1] - 34);
    ctx.stroke();
  }

  if (nozzle && nozzleAt) {
    const [x, y] = nozzleAt;
    // Glow at the tip.
    const g = ctx.createRadialGradient(x, y, 0, x, y, 18);
    g.addColorStop(0, 'rgba(255,120,40,0.9)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, TAU);
    ctx.fill();
    // Hotend block and nozzle cone.
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - 15, y - 40, 30, 22);
    ctx.fillStyle = '#d9d4cb';
    ctx.fillRect(x - 15, y - 40, 30, 3);
    ctx.fillStyle = '#c9a34e';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 18);
    ctx.lineTo(x + 6, y - 18);
    ctx.lineTo(x + 1.5, y - 3);
    ctx.lineTo(x - 1.5, y - 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff6a2a';
    ctx.beginPath();
    ctx.arc(x, y - 2, 2, 0, TAU);
    ctx.fill();
  }

  return { layer: Math.min(N, Math.ceil(done)), total: N, nozzle: nozzleAt };
}

/** Size a canvas to its CSS box at device pixel ratio. Returns the CSS size. */
export function fitCanvas(canvas, maxDpr = 2) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
