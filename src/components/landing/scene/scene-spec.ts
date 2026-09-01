/**
 * S-01 · The entry screen's build, as a stage.
 *
 * ## Why this is a second drawing of the same object
 *
 * The entry screen used to show the workbench's own drawing with the pan and the
 * zoom taken away (`landing/build-still.tsx`, now gone), and the argument for it
 * was that a second illustration of one build is a second opinion which drifts
 * the first time a wire moves. That still holds for a *diagram*. This is not one.
 *
 * The workbench canvas is a working surface: orthographic, pannable, every node
 * a real terminal at a real pitch, laid out so that "move the yellow wire from
 * D6 to D7" means something with the board in front of you. The entry screen
 * needs the opposite — a photograph of a bench, seen slightly from above, where
 * the build is an object on a mat rather than a schematic. Cropping the canvas
 * to get that produced exactly what the reference rejects: a large dark card
 * with a small breadboard and an oversized board floating in it.
 *
 * So this is a still life, and it is kept honest by two rules:
 *
 *   1. **It never states a fact.** No pin names, no wire labels, no counts. It
 *      shows what the parts are and roughly how they sit together. Everything
 *      that can be *checked* — which pin, how many steps, what the agent found
 *      — is printed by the strip above it, from the graph.
 *   2. **Every material colour comes from `illustration/spec.ts`.** That file is
 *      the workshop's palette, and the reason it exists is that a servo drawn
 *      here in a different blue from the servo on the canvas would be two
 *      opinions about one object. Geometry is this drawing's own; matter is not.
 *
 * ## The frame
 *
 * 920 × 380, laid over a 760px column, so the mat runs 80px past the reading
 * measure on each side. The overhang is the whole point: a bench does not stop
 * where the text stops.
 */

export const SCENE = { width: 920, height: 356 } as const;

/** The mat: narrower at the back, running off both edges at the front. */
export const MAT = {
  top: 42,
  bottom: SCENE.height,
  topLeft: 110,
  topRight: 810,
  bottomLeft: 0,
  bottomRight: SCENE.width,
  /** The back corners are moulded, the front ones leave the frame. */
  radius: 9,
} as const;

/** The board everything else stands on. */
export const BOARD = {
  x: 125,
  y: 120,
  width: 652,
  height: 146,
} as const;

/**
 * Every row on the breadboard, in scene units.
 *
 * Written out rather than computed from a pitch, because the two things that
 * have to be true of them are not expressible as one number: the ten bank rows
 * share an exact pitch, and the rails sit at the pitch the *printed lines* need
 * so the red and blue stripes land outside their own holes rather than through
 * them.
 */
const ROW_PITCH = 8.1;
const bankTop = 158.6;
const bankBottom = 207.1;

export const ROWS = {
  pitch: ROW_PITCH,
  /** Printed stripes. */
  railLineTopPlus: 124.6,
  railLineTopMinus: 146.6,
  railLineBottomPlus: 246.6,
  railLineBottomMinus: 264.2,
  /** First hole row of each of the four banks. */
  railTop: 131.6,
  bankA: bankTop,
  bankF: bankBottom,
  railBottom: 250.6,
  /** The trough down the middle, where a chip straddles the two banks. */
  channel: { y: 194.2, height: 9.6 },
} as const;

/** 63 columns at a hair over a tenth of an inch, in this frame's units. */
export const COLUMNS = {
  pitch: 10,
  count: 63,
  /** Centre of the first column. */
  first: BOARD.x + 16,
} as const;

export const RAIL = {
  /** Ten groups of five, the way a full-size board prints them. */
  tile: 60,
  groups: 10,
  first: BOARD.x + 26,
} as const;

/* --- Where the parts stand ----------------------------------------------- */

export const ARDUINO = { x: 368, y: 54, width: 180, height: 100 } as const;
/* The sensor stands *in* the board rather than over its back edge: its legs
   reach the front bank, which is where an HC-SR04 is actually seated and what
   makes the four legs visible under it. */
export const SENSOR = { x: 186, y: 150, width: 136, height: 70 } as const;
export const SERVO = { x: 656, y: 96, width: 104, height: 82 } as const;

/**
 * The control's plate, in scene units.
 *
 * It lives here rather than in the component that draws it because the plate is
 * *part of the composition*: it rests on the breadboard's front-right corner,
 * and if the breadboard moves the control has to move with it. The control
 * itself is HTML — it is a link, and a link has to be focusable, hoverable and
 * openable in a new tab — so it is positioned from these numbers as
 * percentages of the same box the SVG uses.
 */
export const CONTROL = { x: 583, y: 236, width: 272, height: 80 } as const;

/**
 * The control's box as percentages of the scene, which is the form the HTML
 * needs. Written out rather than computed into a class name because Tailwind
 * reads class strings at build time and cannot see a value assembled at
 * runtime — so if a number above moves, these four move with it by hand.
 *
 *   left  583 / 920 = 63.37%      top    236 / 356 = 66.29%
 *   width 272 / 920 = 29.57%      height  80 / 356 = 22.47%
 */

/** The scene label, printed on the bench above the mat's back edge. */
export const LABEL = { x: 127, y: 26 } as const;

/* --- The mat's own colours ----------------------------------------------- */

/**
 * The cutting mat is the one surface in this drawing that is neither a material
 * from the workshop palette nor an interface token: it is the ground the whole
 * screen is composed against, and `--color-mat` is where it is declared. These
 * four are the grid printed on it, and they are local because nothing else in
 * the product prints a perspective grid.
 */
/**
 * The agent's own colour, on this ground.
 *
 * `--color-accent` is tuned to read on the app's white paper; on a cutting mat
 * in half-light it goes muddy, and over the board's green it nearly vanishes.
 * So it is lifted here, the same exception `bench.label` takes in
 * `illustration/spec.ts` for text printed on the mat.
 *
 * It is deliberately not in the material palette. Every other colour in this
 * drawing is a thing you could hold; the agent is not one of them, and the one
 * mark on this bench that belongs to the interface should not be reachable
 * from the same list as the servo's blue.
 */
export const AGENT = {
  mark: "#4D94FF",
  markDeep: "#2B6FD0",
} as const;

export const matInk = {
  faceTop: "#2F3D48",
  faceBottom: "#212C35",
  grid: "#455566",
  gridMajor: "#566B7C",
  edge: "#46545F",
} as const;
