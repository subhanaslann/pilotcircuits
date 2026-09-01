/**
 * W-01 · The kit case, as an object.
 *
 * One case. Not a shut picture and an open picture — **one model tree, and a
 * number**. `buildCase(slabs, p)` is a pure function of how far open the case is
 * and returns the whole thing, back to front, ready to paint. Every frame of the
 * animation is that function called again with a different `p`, so there is no
 * state at which the case could be two different objects, and nothing anywhere
 * chooses between two versions of a part.
 *
 * ## The object
 *
 * A compact industrial tool case: charcoal, soft-cornered, wide and shallow,
 * with a heavy body and a thin lid.
 *
 *   * **The silhouette is one curve.** `roundedRect` is called once per ring and
 *     everything — body, lid, cavity, the lid's recess, the frame around it — is
 *     that outline at a different inset. The lid's edge follows the body's the
 *     whole way round because it is the same curve, and the corners roll rather
 *     than break.
 *   * **The lid is a shell.** Six per cent of the width thick, with a narrow
 *     raised frame around a recessed inner panel that is a real depth below it,
 *     not a darker rectangle painted on.
 *   * **The hinge is real.** Two barrels at a quarter and three quarters of the
 *     width, and the lid turns about the line through their centres. Nothing
 *     translates, nothing scales, and the leaves stay attached because they are
 *     built from the same axis the lid turns about.
 *   * **The latch is a draw latch.** A plate on the body, a lever on its own
 *     pivot, a keeper on the lid. The lever lets go before the lid moves and
 *     catches again after it has seated, because that is the order in which the
 *     parts of a latch can physically do their jobs.
 *
 * ## Why the corners can be round here
 *
 * A fillet is a fan of flat quads, and outlining every one of them draws the
 * tessellation instead of the shape. So faces carry `inkEdges`: a band quad is
 * stroked only along the edges that lie on a real edge of the object, never
 * along the seams between neighbours, and the true silhouette is drawn once as
 * the convex hull of the solid's own projected points. Curvature is then carried
 * by shading, which is what carries it on a real object.
 *
 * ## What is a drawing and what is a fact
 *
 * The case states nothing. Which parts are in it comes from the catalogue, and
 * their names are printed as text beside the case by the screen that uses it. A
 * person who cannot see the illustration still gets the whole inventory.
 */

import {
  BOTH_EDGES,
  NEAR_EDGE,
  NO_EDGES,
  artMatrix,
  bandsBetween,
  boxFaces,
  circleProfile,
  facing,
  flip,
  litValue,
  pathOf,
  pivoted,
  pointsOf,
  ringY,
  roundedRect,
  shade,
  v,
  type Facet,
  type P3,
  type Poly,
  type Profile,
  type Pt,
} from "./case-render";

/* --- One part of the kit --------------------------------------------------- */

/**
 * A part, as the case needs it: a footprint, a height, and the box the drawing
 * of its top face is laid out in. The drawing itself stays in the `.tsx` that
 * owns it — this file is geometry, and geometry has no JSX in it.
 */
export interface Slab {
  key: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** The part's own sides, one step down from the colour of its top. */
  side: string;
  /** Loose hardware, which lies on the liner rather than standing on it. */
  flat?: boolean;
  artW: number;
  artH: number;
}

/* --- The object, in world units -------------------------------------------- */

/**
 * The proportions, as ratios of the width, which is the only number here chosen
 * freely. A tool case is wide, about half as deep as it is wide, and its body
 * carries roughly three quarters of the closed height.
 */
const W = 68;
const D = 0.515 * W;
const HW = W / 2;
const HD = D / 2;
/** The plan corner radius — five per cent of the width. */
const R = 0.05 * W;
/** Segments to a corner. Four is where the facets stop being countable. */
const SEG = 4;

const BASE_H = 0.271 * W;
const LID_H = 0.091 * W;
/** The seam. Thin enough to be a joint, wide enough to be seen. */
const GAP = 0.018 * BASE_H;
/** Sheet thickness — the wall you can see the edge of at the rim. */
const T = 1.85;

/** The floor of the cavity, and the card liner laid on it. */
const FLOOR = BASE_H - 2.1;
const REST = FLOOR - 0.55;

/** The lid's two planes: outer top, and the face that meets the rim. */
const LB = -GAP;
const LT = LB - LID_H;
/** The lid's raised outer frame, and how far its inner panel sits above it. */
const FRAME = 4.4;
const PANEL_D = 1.7;

/** How far the lid swings. A tool case stops a little past upright. */
export const OPEN_DEG = 104;

/**
 * The hinge line.
 *
 * Outside the back wall by the radius of the barrel and level with the seam,
 * which is the only place it can be: the lid's back-bottom corner then sweeps
 * *away* from the body instead of into it, and the leaves stay put because both
 * of them are built around this same line.
 */
const HINGE_R = 1.15;
const HINGE = { y: LB, z: -HD - HINGE_R } as const;
const HINGE_X = [-0.25 * W, 0.25 * W];
const HINGE_HALF = 2.7;
/** How far the leaves reach forward from the barrel onto the rim and the lid. */
const LEAF = 4.6;

/* --- Material -------------------------------------------------------------- */

/**
 * Charcoal, matte, industrial. Nothing here is chrome and nothing is black: the
 * hardware separates from the body by a step in value, not by turning to metal,
 * and the deepest shadow in the picture is still blue.
 */
const tone = {
  body: "#49515D",
  lid: "#535C68",
  /** The break along the top edge, which is the only place light collects. */
  edge: "#6C7683",
  /**
   * The rim faces straight up and so takes the light square on. It has to be
   * pulled *down* to compensate — left at a value that reads as steel on a
   * vertical wall it comes out as a white line drawn round the open box, which
   * is the brightest thing in the picture and the least interesting.
   */
  rim: "#5A6470",
  /** Pressed into the body, where a panel only ever loses light. */
  recess: "#3F4753",
  /** The lid's inner panel, which faces the room and gains a little. */
  lidPanel: "#586170",
  lining: "#8A302B",
  liningDeep: "#70241F",
  liner: "#EFE6D2",
  hardware: "#79848F",
  hardwareDeep: "#59626E",
  shadow: "#141C26",
} as const;

/** The line every real edge is drawn with. */
export const INK = "#141B23";

/* --- Assembly -------------------------------------------------------------- */

/**
 * `at` forces a face's value instead of deriving it — used only where a part is
 * so small or so oddly turned that Lambert reads as a hole rather than a shape.
 */
function face(
  q: Poly,
  base: string,
  extra: Partial<Facet> & { at?: number } = {},
): Facet {
  const { at, ...rest } = extra;
  const lit = at ?? litValue(q);
  return {
    points: pointsOf(q),
    fill: shade(base, lit),
    ink: true,
    lit,
    ...rest,
  };
}

/** The body's outline at a given inset. Every ring in the case is one of these. */
const plan = (inset: number): Profile =>
  roundedRect(HW - inset, HD - inset, R - inset, SEG);

/** A ring of a plate standing on a vertical face: `a` across, `b` down. */
const ringZ = (p: Profile, cx: number, cy: number, z: number): Poly =>
  p.map((q) => v(cx + q.a, cy + q.b, z));

/** A ring of the hinge barrel, on its own axis. */
const ringBarrel = (p: Profile, x: number): Poly =>
  p.map((q) => v(x, HINGE.y + q.a, HINGE.z + q.b));

/** The convex hull of some projected points — a convex solid's true outline. */
function hullOf(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (source: Pt[]) => {
    const out: Pt[] = [];
    for (const q of source) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0)
        out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return [...half(p), ...half([...p].reverse())];
}

/**
 * The outline of a convex solid, as one stroked path.
 *
 * This is what replaces outlining every facet. A rounded box is convex, so its
 * screen silhouette is exactly the hull of its projected vertices — no sorting,
 * no edge-adjacency table, and correct at every angle the lid passes through.
 */
const outlineOf = (rings: Poly[], width = 1.7): Facet => ({
  points: hullOf(rings.flatMap(pointsOf)),
  fill: "none",
  ink: true,
  line: true,
  inkWidth: width,
  halo: true,
});

/* --- The choreography ------------------------------------------------------ */

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** How far the lid lifts off its seal before the hinge takes over. */
const CRACK = 1.9;

/**
 * The lid's angle at a given openness.
 *
 * Three overlapping windows of one parameter: the seal breaks by about two
 * degrees between 0.08 and 0.18, the hinge does the work between 0.12 and 0.90,
 * and the last tenth is the pause the lid settles in. Deliberately **monotone** —
 * the overshoot and the closing knock belong to time rather than to the object
 * and are added by the drive, because an angle that rises and falls with `p`
 * cannot be reversed mid-swing without a jump.
 */
export function lidAngle(p: number): number {
  const crack = CRACK * easeInOutCubic(ramp(p, 0.08, 0.18));
  const swing = (OPEN_DEG - CRACK) * easeInOutCubic(ramp(p, 0.12, 0.9));
  return crack + swing;
}

/** How far the latch has let go: 0 hooked over the keeper, 1 swung clear. */
export const latchRelease = (p: number): number =>
  easeInOutCubic(ramp(p, 0, 0.115));

/* --- The cavity ------------------------------------------------------------ */

/**
 * The mouth of the box, as a clip.
 *
 * Everything inside the case is only visible through it. Painting order alone
 * nearly gets there — the shell is laid down after the cavity — but "nearly" is
 * not a property an illustration can ship with: a part lying against the front
 * wall, or a liner a hair wider than its floor, walks out over the outside of
 * the box. Clipping the interior to the rim is both the fix and the truth.
 */
export const CAVITY_CLIP = "cp-case-cavity";
/** The lid's recess, which moves, so its clip is rebuilt every frame. */
export const LID_CLIP = "cp-case-lid";
export const cavityMouth = (): Poly => ringY(plan(T), 0);

/* --- Fitting the kit ------------------------------------------------------- */

/**
 * The kit, moved onto this tray.
 *
 * The parts were laid out against an older, deeper box. Rather than re-place ten
 * things by hand — they are somebody else's drawing and the brief is explicit
 * that they are not being redesigned — the whole arrangement is scaled as one,
 * evenly in both directions so nothing is squashed, and centred in the tray.
 */
function fitted(slabs: readonly Slab[]): Slab[] {
  if (slabs.length === 0) return [];
  const usableW = W - 2 * T - 2.6;
  const usableD = D - 2 * T - 2.6;

  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const s of slabs) {
    x0 = Math.min(x0, s.x - s.w / 2);
    x1 = Math.max(x1, s.x + s.w / 2);
    z0 = Math.min(z0, s.z - s.d / 2);
    z1 = Math.max(z1, s.z + s.d / 2);
  }
  const k = Math.min(usableW / (x1 - x0), usableD / (z1 - z0), 1);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;

  return slabs.map((s) => ({
    ...s,
    x: (s.x - cx) * k,
    z: (s.z - cz) * k,
    w: s.w * k,
    d: s.d * k,
    h: s.h * k,
  }));
}

/* --- The body -------------------------------------------------------------- */

/**
 * The body's vertical profile, as insets from the widest ring.
 *
 * Read down the list and you have the section: a narrow break along the top edge
 * where the light collects, a straight wall for most of the height, and a wider
 * roll at the bottom that sets the case down on the bench instead of ending it
 * on a corner.
 */
const BODY_RINGS = [
  { y: 0, inset: 0.5 },
  { y: 0.55, inset: 0 },
  { y: BASE_H - 3.1, inset: 0 },
  { y: BASE_H - 1.2, inset: 0.95 },
  { y: BASE_H - 0.32, inset: 2.25 },
  { y: BASE_H, inset: 3.1 },
] as const;

/** Which of those bands is which surface, and where it carries a contour. */
const BODY_BANDS: { tone: string; edges: number[] }[] = [
  { tone: tone.edge, edges: NEAR_EDGE },
  { tone: tone.body, edges: NO_EDGES },
  { tone: tone.body, edges: NO_EDGES },
  { tone: tone.body, edges: NO_EDGES },
  { tone: tone.body, edges: NO_EDGES },
];

/** The lid's section, the same way: a rolled top edge over a straight wall. */
const LID_RINGS = [
  { y: LT, inset: 1.55 },
  { y: LT + 0.62, inset: 0.62 },
  { y: LT + 1.55, inset: 0 },
  { y: LB, inset: 0 },
] as const;

const LID_BANDS: { tone: string; edges: number[] }[] = [
  { tone: tone.lid, edges: NO_EDGES },
  { tone: tone.lid, edges: NO_EDGES },
  { tone: tone.lid, edges: NO_EDGES },
];

/* --- Building -------------------------------------------------------------- */

function buildBody(out: Facet[]): void {
  const rings = BODY_RINGS.map((r) => ringY(plan(r.inset), r.y));

  for (let i = 0; i < BODY_BANDS.length; i++) {
    const band = BODY_BANDS[i];
    for (const q of bandsBetween(rings[i], rings[i + 1])) {
      if (facing(q) <= 0) continue;
      out.push(face(q, band.tone, { inkEdges: band.edges, inkWidth: 1.4 }));
    }
  }

  out.push(outlineOf(rings));

  /* One shallow pressed panel low on the front. Industrial, and only just
     there: the old case carried two big framed rectangles and read as a chest
     of drawers because of them. */
  recess(out, {
    ha: 25,
    hb: 2.9,
    r: 1.4,
    cx: 0,
    cy: BASE_H - 6.1,
    z: HD,
    depth: 0.45,
    tone: tone.recess,
  });

  /* Where the case meets the bench. The last centimetre of a standing object
     gets no bounce, and without it the box reads as floating however good the
     shadow under it is. */
  const contact = bandsBetween(
    ringY(plan(0.4), BASE_H - 3.4),
    ringY(plan(2.6), BASE_H - 0.4),
  );
  for (const q of contact) {
    if (facing(q) <= 0) continue;
    out.push({
      points: pointsOf(q),
      fill: tone.shadow,
      ink: false,
      opacity: 0.2,
      grad: {
        from: tone.shadow,
        to: tone.shadow,
        dir: [0, 1, 0, 0],
        fromOpacity: 0.85,
        toOpacity: 0,
      },
    });
  }
}

/**
 * A rounded rectangular recess pressed into a face that looks down `+z`.
 *
 * The floor is drawn a little smaller than the mouth — a draft angle, which a
 * pressing would have anyway and which is also what keeps the floor's projection
 * inside the mouth's. A plane set back from another projects offset from it, and
 * a floor drawn at the mouth's own size climbs out over the lip.
 */
function recess(
  out: Facet[],
  spec: {
    ha: number;
    hb: number;
    r: number;
    cx: number;
    cy: number;
    z: number;
    depth: number;
    tone: string;
  },
): void {
  const draft = spec.depth * 1.4;
  const mouth = ringZ(
    roundedRect(spec.ha, spec.hb, spec.r, 3),
    spec.cx,
    spec.cy,
    spec.z,
  );
  const floor = ringZ(
    roundedRect(spec.ha - draft, spec.hb - draft, spec.r, 3),
    spec.cx,
    spec.cy,
    spec.z - spec.depth,
  );
  for (const q of bandsBetween(floor, mouth)) {
    if (facing(q) <= 0) continue;
    out.push(face(q, spec.tone, { inkEdges: NO_EDGES, inkWidth: 1.2 }));
  }
  out.push(
    face(flip(floor), spec.tone, {
      inkWidth: 1.3,
      grad: {
        from: shade(spec.tone, 0.72),
        to: shade(spec.tone, 0.96),
        dir: [0, 0, 0.35, 1],
      },
    }),
  );
}

function buildCavity(out: Facet[], slabs: readonly Slab[], deg: number): void {
  const inside = (f: Facet): Facet => ({ ...f, clip: CAVITY_CLIP });
  const mouth = cavityMouth();
  const floorRing = ringY(plan(T), FLOOR);

  /* Wound floor-first so the normals point into the room rather than out of the
     solid: a wall facing away from the space it encloses gets no light at all. */
  for (const q of bandsBetween(floorRing, mouth)) {
    if (facing(q) <= 0) continue;
    out.push(inside(face(q, tone.lining, { inkEdges: NEAR_EDGE, inkWidth: 1.3 })));
  }
  out.push(inside(face(flip(floorRing), tone.liningDeep, { ink: false })));

  /* Where the walls meet the floor. Occlusion, drawn: the corner of a box is
     never as bright as either surface that makes it. */
  const skirt = bandsBetween(floorRing, ringY(plan(T), FLOOR - 3.2));
  for (const q of skirt) {
    if (facing(q) <= 0) continue;
    out.push(
      inside({
        points: pointsOf(q),
        fill: tone.shadow,
        ink: false,
        grad: {
          from: tone.shadow,
          to: tone.shadow,
          dir: [0, 1, 0, 0],
          fromOpacity: 0.42,
          toOpacity: 0,
        },
      }),
    );
  }

  /* The card liner the kit is laid on. */
  out.push(inside(face(flip(ringY(plan(T + 1.3), REST + 0.05)), tone.liner)));

  for (const part of fitted(slabs)) {
    const b = boxFaces(part.x, REST - part.h, part.z, part.w, part.h, part.d);
    if (!part.flat) {
      out.push(inside(face(b.left, part.side, { inkWidth: 1.2 })));
      out.push(inside(face(b.front, part.side, { inkWidth: 1.2 })));
    }
    const topPts = pointsOf(b.top);
    out.push({
      points: topPts,
      fill: "none",
      ink: !part.flat,
      inkWidth: 1.2,
      lit: litValue(b.top),
      clip: CAVITY_CLIP,
      art: { matrix: artMatrix(topPts, part.artW, part.artH), key: part.key },
    });
  }

  /* The lid's own shadow on the kit. Real: it is cast by the thing overhead, so
     it lifts as the lid rises and is gone by the time the lid is upright. */
  const shut = clamp01(1 - deg / 62);
  if (shut > 0.01) {
    out.push(
      inside({
        points: pointsOf(mouth),
        fill: tone.shadow,
        ink: false,
        opacity: 0.5 * shut,
      }),
    );
  }
}

/** The rim: the wall's own thickness, seen from above. */
function buildRim(out: Facet[]): void {
  for (const q of bandsBetween(cavityMouth(), ringY(plan(0.5), 0))) {
    out.push(face(q, tone.rim, { inkEdges: BOTH_EDGES, inkWidth: 1.4 }));
  }
}

/* --- The hinge ------------------------------------------------------------- */

/**
 * A leaf: a thin plate reaching forward from the barrel, either onto the rim or
 * onto the underside of the lid. Both are built from the hinge line, so they
 * cannot come apart from the barrel or from each other.
 */
function leaf(z0: number, y0: number, hx: number, thickness: number): Poly[] {
  const b = boxFaces(hx, y0, (HINGE.z + z0) / 2, 5.2, thickness, z0 - HINGE.z);
  return [b.top, b.front, b.left, b.right];
}

function buildHinges(out: Facet[], deg: number): void {
  const barrel = circleProfile(HINGE_R, 8);

  for (const hx of HINGE_X) {
    /* The lid's leaf, turning with the lid about the barrel's own centre. */
    for (const q of leaf(-HD + LEAF, LB - 0.55, hx, 0.55)) {
      const turned = pivoted(q, deg, HINGE.y, HINGE.z);
      if (facing(turned) <= 0) continue;
      out.push(face(turned, tone.hardwareDeep, { inkWidth: 1.1 }));
    }

    /* The barrel. Painted after the leaves it joins, because at the axis it is
       the part of the hinge nearest the eye. */
    const near = ringBarrel(barrel, hx - HINGE_HALF);
    const far = ringBarrel(barrel, hx + HINGE_HALF);
    const rings = [near, far];
    for (const q of bandsBetween(near, far)) {
      if (facing(q) <= 0) continue;
      out.push(face(q, tone.hardware, { inkEdges: NO_EDGES, inkWidth: 1 }));
    }
    out.push(outlineOf(rings, 1.2));

    /* The body's leaf, lying on the back of the rim. */
    for (const q of leaf(-HD + LEAF, -0.55, hx, 0.55)) {
      if (facing(q) <= 0) continue;
      out.push(face(q, tone.hardwareDeep, { inkWidth: 1.1 }));
    }
  }
}

/* --- The lid --------------------------------------------------------------- */

/** Paints the lid and hands back the clip its recess is seen through. */
function buildLid(out: Facet[], deg: number): string {
  const turn = (q: Poly) => pivoted(q, deg, HINGE.y, HINGE.z);
  const rings = LID_RINGS.map((r) => turn(ringY(plan(r.inset), r.y)));
  const shell: Facet[] = [];

  /* The outer shell. */
  for (let i = 0; i < LID_BANDS.length; i++) {
    const band = LID_BANDS[i];
    for (const q of bandsBetween(rings[i], rings[i + 1])) {
      if (facing(q) <= 0) continue;
      shell.push(face(q, band.tone, { inkEdges: band.edges, inkWidth: 1.4 }));
    }
  }

  const cap = turn(flip(ringY(plan(LID_RINGS[0].inset), LT)));
  const outward = facing(cap) > 0;
  if (outward) {
    shell.push(
      face(cap, tone.lid, {
        grad: {
          from: shade(tone.lid, 1.1),
          to: shade(tone.lid, 0.9),
          dir: [0.1, 0, 0.75, 1],
        },
      }),
    );
  }

  /* The underside: a narrow raised frame around a panel set a real depth into
     the lid, so the edge of the panel occludes and shades rather than being a
     darker rectangle drawn on a flat face.

     The inside of the recess is clipped to its own opening. It has to be: the
     panel is a plane 1.7 units behind the mouth, so it projects offset from it,
     and without the clip it walks out over the lip that ought to be hiding it. */
  const seam = turn(ringY(plan(0), LB));
  const opening = turn(ringY(plan(FRAME), LB));
  const panel = turn(ringY(plan(FRAME), LB - PANEL_D));
  const within = (f: Facet): Facet => ({ ...f, clip: LID_CLIP });

  for (const q of bandsBetween(seam, opening)) {
    if (facing(q) <= 0) continue;
    shell.push(face(q, tone.lid, { inkEdges: BOTH_EDGES, inkWidth: 1.4 }));
  }
  for (const q of bandsBetween(opening, panel)) {
    if (facing(q) <= 0) continue;
    shell.push(within(face(q, tone.recess, { inkEdges: NO_EDGES, inkWidth: 1.2 })));
  }
  if (facing(panel) > 0) {
    shell.push(
      within(
        face(panel, tone.lidPanel, {
          inkWidth: 1.3,
          grad: {
            from: shade(tone.lidPanel, 0.82),
            to: shade(tone.lidPanel, 1.04),
            dir: [0.15, 0, 0.8, 1],
          },
        }),
      ),
    );
  }

  shell.push(outlineOf(rings));
  buildKeeper(shell, turn);

  /**
   * The handle is a child of the lid and travels with it, so past the angle
   * where the lid's outer face turns away it is genuinely *behind* the lid and
   * has to be painted before it. That is a change of order, not of existence:
   * nothing is switched off, and the swap lands on the one angle where the lid's
   * top is edge-on and the handle overlaps its outline hardly at all.
   */
  const handle: Facet[] = [];
  buildHandle(handle, turn);
  if (outward) out.push(...shell, ...handle);
  else out.push(...handle, ...shell);

  return pathOf(pointsOf(opening));
}

/** The handle: a short, thick, rounded bar on two compact feet. */
function buildHandle(out: Facet[], turn: (q: Poly) => Poly): void {
  const footTop = LT;
  const footH = 1.9;
  const barH = 2.9;
  const barTop = footTop - footH - barH;

  for (const fx of [-8.6, 8.6]) {
    const p = roundedRect(2.3, 1.75, 0.8, 2);
    const top = p.map((q) => v(fx + q.a, footTop - footH, q.b));
    const bottom = p.map((q) => v(fx + q.a, footTop, q.b));
    for (const q of bandsBetween(top, bottom)) {
      const t = turn(q);
      if (facing(t) <= 0) continue;
      out.push(face(t, tone.hardwareDeep, { inkEdges: NEAR_EDGE, inkWidth: 1.1 }));
    }
  }

  /* The bar, rounded in section and swept across. `roundedRect` winds for a
     sweep down `y`; swept along `x` instead it comes out inside-out, so the far
     end leads. */
  const section = roundedRect(barH / 2, 1.6, 1.05, 3);
  const cy = barTop + barH / 2;
  const left = turn(section.map((q) => v(-11.6, cy + q.a, q.b)));
  const right = turn(section.map((q) => v(11.6, cy + q.a, q.b)));

  let seen = false;
  for (const q of bandsBetween(right, left)) {
    if (facing(q) <= 0) continue;
    seen = true;
    out.push(face(q, tone.hardware, { inkEdges: NO_EDGES, inkWidth: 1 }));
  }
  for (const cap of [left, flip(right)]) {
    if (facing(cap) <= 0) continue;
    seen = true;
    out.push(face(cap, tone.hardwareDeep, { inkEdges: NO_EDGES }));
  }
  if (seen) out.push(outlineOf([left, right], 1.3));
}

/** The keeper the latch hooks over, on the front of the lid. */
function buildKeeper(out: Facet[], turn: (q: Poly) => Poly): void {
  const p = roundedRect(4.6, 1.5, 0.6, 2);
  const near = ringZ(p, 0, LB - LID_H / 2 - 0.4, HD + 0.5);
  const far = ringZ(p, 0, LB - LID_H / 2 - 0.4, HD - 0.05);
  for (const q of bandsBetween(near, far)) {
    const t = turn(q);
    if (facing(t) <= 0) continue;
    out.push(face(t, tone.hardwareDeep, { inkEdges: NEAR_EDGE, inkWidth: 1 }));
  }
  const cap = turn(flip(near));
  if (facing(cap) > 0) out.push(face(cap, tone.hardware, { inkWidth: 1.1 }));
}

/* --- The latch ------------------------------------------------------------- */

/** Where the lever turns: on the plate, just above the middle of it. */
const LATCH_PIVOT = { y: 3.9, z: HD + 0.62 } as const;
const LATCH_DEG = 19;

/** A rounded plate standing proud of the front wall. */
function proudPlate(
  out: Facet[],
  spec: {
    profile: Profile;
    cx: number;
    cy: number;
    from: number;
    to: number;
    tone: string;
    capTone?: string;
    move?: (q: Poly) => Poly;
  },
): void {
  const move = spec.move ?? ((q: Poly) => q);
  const near = ringZ(spec.profile, spec.cx, spec.cy, spec.to);
  const far = ringZ(spec.profile, spec.cx, spec.cy, spec.from);
  for (const q of bandsBetween(near, far)) {
    const t = move(q);
    if (facing(t) <= 0) continue;
    out.push(face(t, spec.tone, { inkEdges: NEAR_EDGE, inkWidth: 1 }));
  }
  const cap = move(flip(near));
  if (facing(cap) > 0) {
    out.push(face(cap, spec.capTone ?? spec.tone, { inkWidth: 1.2 }));
  }
}

function buildLatch(out: Facet[], release: number): void {
  /* The mounting plate, bolted to the body and going nowhere. */
  proudPlate(out, {
    profile: roundedRect(5.4, 3.6, 1.3, 3),
    cx: 0,
    cy: 4.6,
    from: HD - 0.05,
    to: HD + 0.42,
    tone: tone.hardwareDeep,
  });

  /**
   * The lever. It turns about its pivot and then draws forward and down, which
   * is the order the two motions have to happen in: a draw latch unhooks by
   * swinging out and only then has room to drop off the keeper.
   */
  const swing = -LATCH_DEG * release;
  const move = (q: Poly): Poly =>
    pivoted(q, swing, LATCH_PIVOT.y, LATCH_PIVOT.z).map((p: P3) =>
      v(p.x, p.y + 0.85 * release, p.z + 0.45 * release),
    );

  proudPlate(out, {
    profile: roundedRect(3.5, 4.9, 1.1, 3),
    cx: 0,
    cy: 0.7,
    from: HD + 0.46,
    to: HD + 0.96,
    tone: tone.hardware,
    move,
  });
  /* The finger pull pressed into the lever's face. */
  proudPlate(out, {
    profile: roundedRect(2.1, 1.15, 0.5, 2),
    cx: 0,
    cy: 3.5,
    from: HD + 0.96,
    to: HD + 0.78,
    tone: tone.hardwareDeep,
    move,
  });
}

/* --- Everything, in the order it is laid down ------------------------------ */

/**
 * Written out rather than sorted: the camera never moves, so the correct order
 * is a property of the object and belongs in one readable list.
 *
 * The lid goes last at every angle. It stands above the body the whole way
 * through its arc — shut it is on top of it, upright it is above and behind it —
 * so it never needs to change sides, and the case never has a frame where the
 * paint order flips under the viewer.
 */
export interface CaseScene {
  facets: Facet[];
  /** Clip outlines, by id, for the two places the interior has to be masked. */
  clips: Record<string, string>;
}

export function buildCase(
  slabs: readonly Slab[],
  p: number,
  extraDeg = 0,
): CaseScene {
  const deg = Math.max(0, lidAngle(p) + extraDeg);
  const facets: Facet[] = [];

  buildHinges(facets, deg);
  buildCavity(facets, slabs, deg);
  buildRim(facets);
  buildBody(facets);
  const lidClip = buildLid(facets, deg);
  buildLatch(facets, latchRelease(p));

  return {
    facets,
    clips: {
      [CAVITY_CLIP]: pathOf(pointsOf(cavityMouth())),
      [LID_CLIP]: lidClip,
    },
  };
}

/** The bench shadow's footprint, so the component does not have to guess it. */
export function benchShadow(): { cx: number; cy: number; rx: number; ry: number } {
  const ring = pointsOf(ringY(plan(1.4), BASE_H));
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const q of ring) {
    x0 = Math.min(x0, q.x);
    x1 = Math.max(x1, q.x);
    y0 = Math.min(y0, q.y);
    y1 = Math.max(y1, q.y);
  }
  return {
    cx: (x0 + x1) / 2,
    cy: (y0 + y1) / 2 + 6,
    rx: (x1 - x0) / 2 + 46,
    ry: (y1 - y0) / 2 + 26,
  };
}
