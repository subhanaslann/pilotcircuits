/**
 * W-01 · A very small perspective renderer.
 *
 * ## Why this exists instead of CSS 3D
 *
 * The case was built once as a CSS 3D scene — real faces, real `perspective`,
 * a real `rotateX` on the hinge — and it was right about the geometry and wrong
 * about the medium. **CSS 3D has no depth buffer.** The browser sorts whole
 * elements by a single depth value and paints them in that order, and which
 * order it arrives at depends on how the page happens to be composited: the
 * closed case was solid at a device pixel ratio of 1 and see-through at 2,
 * because at 2 the compositor took a different path and the inside of the box
 * started painting over its own lid. There is no property that fixes that. It is
 * the limit of the technique.
 *
 * So the projection is done here, in about two hundred lines, and the result is
 * emitted as ordinary SVG polygons. What that buys:
 *
 *   * **The paint order is ours.** The camera is fixed, so the correct back-to-
 *     front order of this object is known and written down once
 *     (`case-geometry.ts`). No sorting heuristic, no dependence on the raster
 *     path, the same picture at every pixel ratio.
 *   * **Contours.** Every polygon is a `path` and can be stroked — along all of
 *     its edges or only the ones that are real edges of the object, which is
 *     what lets a rounded corner be tessellated without the tessellation
 *     showing.
 *   * **Real lighting.** Each face's value comes from its own normal against one
 *     light, so a sloped panel lands between its neighbours by itself instead of
 *     being guessed at.
 *   * **A continuous hinge.** The lid angle is a number; the geometry is rebuilt
 *     from it. Nothing is tweened between two pictures.
 *
 * ## The camera
 *
 * Right-handed with `y` pointing down and `z` toward the viewer, which is the
 * same convention CSS uses, so the earliest numbers carried over unchanged. The
 * world is yawed, then pitched, then divided by `F / (F − z)` — the pinhole CSS
 * itself implements for `perspective`.
 *
 * It never moves. Not while the lid swings, not between the shut and the open
 * picture: the frame is sized to the whole arc the lid sweeps, so the box can
 * stand still inside it.
 */

export interface P3 {
  x: number;
  y: number;
  z: number;
}

/** Any planar face. Rounded work produces quads; caps produce n-gons. */
export type Poly = P3[];
export type Quad = [P3, P3, P3, P3];

export interface Pt {
  x: number;
  y: number;
}

/** A two-stop fill, for a face's own falloff and for the shadow overlays. */
export interface Grad {
  from: string;
  to: string;
  /** Direction, in object-bounding-box units. Defaults to the light's. */
  dir?: [number, number, number, number];
  fromOpacity?: number;
  toOpacity?: number;
}

/** A face, ready to paint: a screen polygon, a fill, and how it is outlined. */
export interface Facet {
  /** The projected outline, in SVG user units. */
  points: Pt[];
  fill: string;
  /** Turned off for anything that is not a surface of the object. */
  ink: boolean;
  /**
   * Which edges carry a contour, by index — edge `i` runs from point `i` to
   * point `i + 1`. Omitted means all of them.
   *
   * This is the whole trick behind the rounded corners. A fillet is a fan of
   * flat quads, and outlining each one draws the tessellation instead of the
   * shape; outlining only the edges that lie along a real edge of the object
   * draws the shape and lets the shading carry the curve.
   */
  inkEdges?: number[];
  /** Draw as an open stroked polyline rather than a filled face. */
  line?: boolean;
  /** Set on the one face a part's drawing is laid on. */
  art?: { matrix: string; key: string };
  /** The light that reached this face, for artwork that cannot be tinted. */
  lit?: number;
  /** A softer edge for hardware, so rivets do not read as holes. */
  inkWidth?: number;
  /** The face's own falloff, or an overlay's ramp. */
  grad?: Grad;
  /** A soft dark spread outside the contour — contact shading, in effect. */
  halo?: boolean;
  /** For the few facets that are shading rather than surface. */
  opacity?: number;
  /** The id of a clip this facet is only visible through. */
  clip?: string;
}

/* --- The camera ----------------------------------------------------------- */

const YAW = (25 * Math.PI) / 180;
const PITCH = (-44 * Math.PI) / 180;
/** The focal distance, in world units. Smaller bows the near edges. */
const FOCAL = 340;
/** World units to SVG user units. */
export const SCALE = 8.39;
/**
 * Where the world origin — the centre of the box's rim — lands in the viewBox.
 *
 * Not the centre of the frame, and not fitted to the shut case either. Both this
 * and `SCALE` are solved against the union of every silhouette the case has
 * across the whole arc, overshoot included, so the frame holds the *movement*
 * rather than the object: the open lid reaches about 36 world units above the
 * rim and the box only 19 below it, so the origin sits low and the room the lid
 * will need is reserved above it from the start. Shut, the case therefore stands
 * in the lower part of its frame with that room empty, which is the price of the
 * box never moving on screen when it opens — and that stillness is the point.
 */
export const ORIGIN = { x: 475, y: 465 };
/** The viewBox those two numbers were solved for. */
export const VIEWBOX = { w: 880, h: 760 };

const cy = Math.cos(YAW);
const sy = Math.sin(YAW);
const cp = Math.cos(PITCH);
const sp = Math.sin(PITCH);

/** World → camera. Yaw about `y`, then pitch about `x`. */
function toCamera(p: P3): P3 {
  const x = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  return {
    x,
    y: p.y * cp - z1 * sp,
    z: p.y * sp + z1 * cp,
  };
}

/** Camera → screen, with the same pinhole `perspective` uses. */
export function project(p: P3): Pt & { z: number } {
  const c = toCamera(p);
  const s = FOCAL / (FOCAL - c.z);
  return {
    x: ORIGIN.x + c.x * s * SCALE,
    y: ORIGIN.y + c.y * s * SCALE,
    z: c.z,
  };
}

/**
 * The world direction that points at the camera — the gradient of the camera's
 * own `z`. A face whose normal has a positive dot with this is turned toward the
 * viewer, which is how the outer shell gets its back half culled.
 */
export const VIEW: P3 = { x: -sy * cp, y: sp, z: cy * cp };

/* --- Light ---------------------------------------------------------------- */

/** One source, high and to the front-left. Normalised. */
const LIGHT = (() => {
  const l = { x: -0.58, y: -0.74, z: 0.34 };
  const m = Math.hypot(l.x, l.y, l.z);
  return { x: l.x / m, y: l.y / m, z: l.z / m };
})();

/**
 * How much of a surface's colour survives with the light square behind it.
 *
 * Higher than it was, because the case is painted charcoal now rather than bare
 * steel. On a light body a turned-away face could afford to lose most of its
 * value; on a dark one the same falloff lands on black, and a dark grey in shade
 * still has to read as painted metal rather than as a hole.
 */
const AMBIENT = 0.46;

export function normalOf(q: Poly): P3 {
  const last = q[q.length - 1];
  const a = { x: q[1].x - q[0].x, y: q[1].y - q[0].y, z: q[1].z - q[0].z };
  const b = { x: last.x - q[0].x, y: last.y - q[0].y, z: last.z - q[0].z };
  const n = {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
  const m = Math.hypot(n.x, n.y, n.z) || 1;
  return { x: n.x / m, y: n.y / m, z: n.z / m };
}

/** Whether a face is turned toward the camera. Negative means culled. */
export function facing(q: Poly): number {
  const n = normalOf(q);
  return n.x * VIEW.x + n.y * VIEW.y + n.z * VIEW.z;
}

/**
 * The colour a shadow tends toward.
 *
 * Not black. Multiplying a charcoal body down to nothing is the fastest way to
 * lose an illustration's material: steel in shade is blue, not absent.
 */
const SHADOW = { r: 0x1c, g: 0x24, b: 0x30 };

/** `#rrggbb` at `v` of its value, blending to `SHADOW` down and white up. */
export function shade(hex: string, value: number): string {
  const n = parseInt(hex.slice(1), 16);
  const src = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const mix = (c: number, target: number, t: number) =>
    Math.max(0, Math.min(255, Math.round(c + (target - c) * t)));

  let out: number[];
  if (value >= 1) {
    const t = Math.min(1, (value - 1) / 0.42) * 0.5;
    out = src.map((c) => mix(c, 255, t));
  } else {
    const t = Math.min(1, 1 - value) * 0.92;
    out = [
      mix(src[0], SHADOW.r, t),
      mix(src[1], SHADOW.g, t),
      mix(src[2], SHADOW.b, t),
    ];
  }
  return `#${((out[0] << 16) | (out[1] << 8) | out[2]).toString(16).padStart(6, "0")}`;
}

/**
 * The value a face earns from its own normal.
 *
 * Lambert against the one light, lifted by the ambient term, and then nudged for
 * whether the face is turned up or down — a horizontal surface catches the sky
 * as well as the lamp, and without that the lid's top and the box's front sit
 * closer together than they do on a real object.
 */
export function litValue(q: Poly): number {
  const n = normalOf(q);
  const lambert = Math.max(0, n.x * LIGHT.x + n.y * LIGHT.y + n.z * LIGHT.z);
  const sky = Math.max(0, -n.y) * 0.14;
  return Math.min(1.3, AMBIENT + (1 - AMBIENT) * lambert + sky);
}

/* --- Geometry helpers ----------------------------------------------------- */

export const v = (x: number, y: number, z: number): P3 => ({ x, y, z });

/** A box, as its six faces, keyed by which way each one looks. */
export function boxFaces(
  cx: number,
  top: number,
  cz: number,
  w: number,
  h: number,
  d: number,
): Record<"top" | "bottom" | "front" | "back" | "left" | "right", Quad> {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = top;
  const y1 = top + h;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  return {
    top: [v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1)],
    bottom: [v(x0, y1, z1), v(x1, y1, z1), v(x1, y1, z0), v(x0, y1, z0)],
    front: [v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1)],
    back: [v(x1, y0, z0), v(x0, y0, z0), v(x0, y1, z0), v(x1, y1, z0)],
    left: [v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0)],
    right: [v(x1, y0, z1), v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1)],
  };
}

/* --- Rounded prisms ------------------------------------------------------- */

/**
 * A closed outline in the plane a prism is swept through, as `(a, b)` pairs.
 *
 * The winding matters and is fixed: swept in the positive direction of the third
 * axis, these come out with their normals pointing away from the solid, which is
 * what `facing` and `litValue` both assume.
 */
export type Profile = { a: number; b: number }[];

/**
 * A rectangle with rounded corners, `seg` segments to each corner.
 *
 * Everything about the case's silhouette comes from this one function. The body,
 * the lid, the cavity, the lid's recess and its frame are the same outline at
 * different insets, which is why the lid's edge follows the body's exactly the
 * whole way round: they are literally the same curve.
 */
export function roundedRect(
  ha: number,
  hb: number,
  r: number,
  seg: number,
): Profile {
  const rr = Math.max(0.1, Math.min(r, ha, hb));
  const ca = ha - rr;
  const cb = hb - rr;
  const centres: [number, number][] = [
    [ca, cb],
    [ca, -cb],
    [-ca, -cb],
    [-ca, cb],
  ];
  const out: Profile = [];
  for (let c = 0; c < 4; c++) {
    const start = ((90 - 90 * c) * Math.PI) / 180;
    for (let s = 0; s <= seg; s++) {
      const t = start - (s / seg) * (Math.PI / 2);
      out.push({
        a: centres[c][0] + rr * Math.cos(t),
        b: centres[c][1] + rr * Math.sin(t),
      });
    }
  }
  return out;
}

/** A circle, wound so that swept along `x` its faces look outward. */
export function circleProfile(r: number, seg: number): Profile {
  const out: Profile = [];
  for (let i = 0; i < seg; i++) {
    const t = (2 * Math.PI * i) / seg;
    out.push({ a: -r * Math.sin(t), b: r * Math.cos(t) });
  }
  return out;
}

/** A profile placed at a height: `a` across, `b` front-to-back. */
export const ringY = (p: Profile, y: number): Poly =>
  p.map((q) => v(q.a, y, q.b));

/** A profile placed at an `x`: `a` down, `b` front-to-back. */
export const ringX = (p: Profile, x: number): Poly =>
  p.map((q) => v(x, q.a, q.b));

/**
 * The quads between two rings of the same profile.
 *
 * Wound so quad `i` reads: near ring point `i`, near ring point `i + 1`, far
 * ring point `i + 1`, far ring point `i`. Edge 0 therefore lies along the near
 * ring and edge 2 along the far one, which is what `NEAR_EDGE` and `FAR_EDGE`
 * name — and the two vertical edges between them, the tessellation seams, are
 * the ones that must never be inked.
 */
export function bandsBetween(near: Poly, far: Poly): Quad[] {
  const out: Quad[] = [];
  for (let i = 0; i < near.length; i++) {
    const j = (i + 1) % near.length;
    out.push([near[i], near[j], far[j], far[i]]);
  }
  return out;
}

/** Which edge of a band quad lies along which of its two rings. */
export const NEAR_EDGE = [0];
export const FAR_EDGE = [2];
export const BOTH_EDGES = [0, 2];
export const NO_EDGES: number[] = [];

/** Turn a face about a line running along `x` through `(py, pz)`. */
export function pivoted(q: Poly, degrees: number, py: number, pz: number): Poly {
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return q.map((p) => {
    const dy = p.y - py;
    const dz = p.z - pz;
    return v(p.x, dy * c - dz * s + py, dy * s + dz * c + pz);
  });
}

export const pointsOf = (q: Poly): Pt[] => q.map(project);

/**
 * The same face, wound the other way.
 *
 * Profiles and `boxFaces` both wind so a normal points *out* of the solid, which
 * is what an exterior wants. The inside of the case is the same shape seen from
 * within, and a wall whose normal points away from the room it encloses gets no
 * light at all — which is exactly how the cavity came out the first time: black.
 */
export const flip = (q: Poly): Poly => [...q].reverse();

export const pathOf = (pts: Pt[], close = true): string =>
  `${pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("")}${close ? "Z" : ""}`;

/** Only the named edges of a polygon, as one path of separate strokes. */
export function edgePathOf(pts: Pt[], edges: number[]): string {
  return edges
    .map((i) => {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      return `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
    })
    .join("");
}

/** How far away a face is, for the rare place order has to be worked out. */
export const depthOf = (q: Poly): number =>
  q.reduce((sum, p) => sum + toCamera(p).z, 0) / q.length;

/**
 * The affine that lays a drawing on a projected quad.
 *
 * A projected rectangle is a general quadrilateral and an SVG transform is
 * affine, so this fits the drawing to three of the four corners and lets the
 * fourth carry the error. Over a part a couple of centimetres across, seen from
 * this distance, that error is well under a pixel — and the alternative, a
 * per-face `foreignObject` with its own perspective, brings back exactly the
 * compositing problem this renderer exists to avoid.
 */
export function artMatrix(pts: Pt[], aw: number, ah: number): string {
  const [p0, p1, , p3] = pts;
  const a = (p1.x - p0.x) / aw;
  const b = (p1.y - p0.y) / aw;
  const c = (p3.x - p0.x) / ah;
  const d = (p3.y - p0.y) / ah;
  return `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${p0.x.toFixed(2)} ${p0.y.toFixed(2)})`;
}
