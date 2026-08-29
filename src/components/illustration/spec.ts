/**
 * Batch 6 · The illustration contract.   ·   Batch 7 · The shared palette.
 *
 * Seven project scenes and ten component marks are being drawn by hand, one at
 * a time. Drawn that way without a written contract they end up as seventeen
 * separate styles, and the measure this batch is judged by is that they look
 * like they came from **one hand**. So the contract is written first and every
 * drawing imports from here.
 *
 * ## Geometry
 *
 * One box, one stroke scale. A mark at 48 units renders between 40 and 48 CSS
 * pixels; `strokeWidth` is expressed in box units so it stays a hairline at any
 * of those sizes.
 *
 * ## Why these colours
 *
 * Not a new palette. Batch 3 already decided what this product's hardware looks
 * like — a green board, a blue servo, a cream breadboard, a beige resistor —
 * and those hexes were in `canvas/parts/`. A component mark that used different
 * greens from the board on the canvas would be a second opinion about the same
 * object. So the physical colours were lifted from there verbatim and named
 * once, here.
 *
 * **They were lifted by copying, and Batch 7 closed that.** For one batch all
 * twenty-four material colours stood in two files at once: `servoBlue`
 * `#2C6CD6` was written here *and* in `micro-servo.tsx`. Identical, so nothing
 * looked wrong — but change the servo's blue on the canvas and the icon would
 * not follow, and the icon's whole reason for existing is that it *is* the blue
 * of the servo on the board. It would have gone on quietly lying. Now the
 * canvas parts, the desk and the marks all read from this file, which is why a
 * file under `illustration/` is imported by `canvas/`: it stopped being the
 * illustration's palette and became the workshop's.
 *
 * This is the same exception the canvas takes to the colour rule: `tokens.ts`
 * governs the interface, and an interface token cannot say what colour a
 * resistor is. Anything the *interface* contributes — a highlight, a callout,
 * a ring — still comes from `--color-*`.
 *
 * ## What a mark is not
 *
 * `canvas/parts/` is not reusable here and the reverse is also true. Those are
 * scene parts on a real measuring system (a breadboard pitch is 2.54 mm = 10
 * scene units); a drawing copied down from there is unreadable at 44px. These
 * are marks: fewer details, thicker relative strokes, no pin-level accuracy.
 * The palette is shared. The drawings are not.
 */

/** Every component mark is drawn in this box. */
export const ICON_BOX = 48;

/** Hairline at the mark scale. Contours and legs share it. */
export const ICON_STROKE = 1.4;

/** A heavier line for a mark's outer silhouette, so it holds at 40px. */
export const ICON_STROKE_BOLD = 1.8;

/**
 * The physical palette.
 *
 * Each entry names a material rather than a part, because several parts share
 * one: the USB shell and the board's pin headers are the same brushed metal,
 * and a servo horn and a button cap are the same moulded white.
 */
export const material = {
  /** The microcontroller's PCB (`uno-board.tsx`). */
  pcbGreen: "#0F5D52",
  pcbGreenEdge: "#0A473F",
  /** The sensor's PCB (`ultrasonic.tsx`) — a different maker, a different blue. */
  pcbBlue: "#1B4F9C",
  pcbBlueEdge: "#143C78",
  /** The servo's case (`micro-servo.tsx`). */
  servoBlue: "#2C6CD6",
  servoBlueEdge: "#1F55AC",
  /** Horn, button cap, breadboard highlight. */
  plasticWhite: "#F2F4F6",
  /** The horn itself: the same moulding, one step out of the light. */
  hornWhite: "#E8EBEE",
  /** The breadboard body (`breadboard.tsx`). */
  cream: "#E3E7EB",
  creamEdge: "#C4CBD2",
  /** Pin headers, USB shell, jumper legs. */
  metal: "#B7BFC7",
  metalEdge: "#8F98A1",
  metalDark: "#8A9099",
  /** A transducer can's machined face, and the two rings turned into it. */
  canRim: "#5F666E",
  canRing: "#6E757D",
  canGroove: "#767D85",
  /** The ceramic block between the two cans. */
  ceramic: "#C8CDD3",
  /** A through-hole part's tinned leg — LED, resistor, anything with wire ends. */
  leg: "#9AA3AC",
  /** The resistor's body (`resistor.tsx`). */
  beige: "#D9C7A7",
  beigeEdge: "#B9A785",
  /** 220Ω: red–red–brown, gold tolerance. The bands are the value. */
  bandRed: "#C1272D",
  bandBrown: "#7B4B2A",
  /** The barrier arm, as a mark draws it. */
  cardboard: "#B48D61",
  cardboardEdge: "#AC8659",
  /** The same arm on the canvas, where the mat's light falls across it. */
  armLight: "#D9B382",
  armLightEdge: "#B8925F",
  /** Connector housings, chip packages, button caps. */
  shell: "#14181D",
  shellDeep: "#0B0E12",
  /** Moulded black one step off the shell: barrel jack, socket bodies. */
  shellSoft: "#23282E",
  /** The microcontroller package itself. */
  chip: "#1B2027",
  /** LED domes (`led.tsx`). */
  ledRed: "#DB3B41",
  ledGreen: "#22A45D",
  /** The same domes unlit: a lens with nothing behind it. */
  ledRedDim: "#EFB0B2",
  ledGreenDim: "#9ED3B6",
  /** Exposed contacts and resistor bands. */
  gold: "#C9A227",
} as const;

/* --- The bench ----------------------------------------------------------- */

/**
 * The cutting mat's five greys, lightest line to darkest ground.
 *
 * Two drawings assign them differently. At 1:1 the mat is the full-bleed
 * ground under the whole build; at 160 × 100 it is a small shape on a white
 * card, and it sits one step darker there with the canvas's mat body playing
 * its grid. Same five values either way — which is the part that has to be
 * written once. Which grey plays which part stays each drawing's own call.
 */
const matGrey = {
  darkest: "#333E46",
  body: "#3E4A53",
  line: "#4E5C66",
  lineMajor: "#5A6872",
  bevel: "#55646E",
} as const;

/**
 * C-02 · The desk the canvas draws: an oak bench with a cutting mat on it.
 *
 * The mat is not decoration — its printed grid *is* the product's technical
 * grid, so the ruler is part of the scene rather than an overlay on top of it.
 */
export const bench = {
  oak: "#C6A177",
  /** Three plank tones, so the boards read as boards rather than as a field. */
  plankHigh: "#CBA478",
  plankMid: "#C89F72",
  plankLow: "#C2996C",
  /* The seam and the grain are the same two browns the cardboard arm is drawn
     in, to the digit. Written once. */
  seam: material.cardboardEdge,
  grain: material.cardboard,
  grainDeep: "#B08960",
  /** The mat's contact shadow on the wood. */
  shadow: "#5C4526",

  /** Also what the wrong-pin mark punches through: the mat, showing. */
  mat: matGrey.body,
  matGrid: matGrey.line,
  matGridMajor: matGrey.lineMajor,
  matBevel: matGrey.bevel,
  /** The hanging holes a real mat has. */
  matHole: matGrey.darkest,

  /**
   * Text printed straight onto the scene: pin names, part labels.
   *
   * Not `--color-ink-*`. Those are tuned to read on the app's white ground and
   * this text sits on a dark mat, so an interface token here would be the
   * wrong contrast in the wrong direction.
   */
  label: "#C6D0D8",
  /** The board's own pin names, a shade brighter than a part's label. */
  labelStrong: "#DCE3E8",
} as const;

/* --- Project scenes ------------------------------------------------------ */

/**
 * P-02 · The frame every project scene is drawn in.
 *
 * 8:5, which is the proportion a card banner wants at both card widths in the
 * grid. Fixed before the seven were drawn, so none of them is composed for a
 * shape the layout later takes away.
 */
export const SCENE_W = 160;
export const SCENE_H = 100;

/** Hairline at scene scale — thinner than a mark's, because the frame is wider. */
export const SCENE_STROKE = 1.2;

/**
 * The ground all seven share: the workbench's own cutting mat.
 *
 * This is the single strongest thing holding the set together. Seven bespoke
 * scenes could drift in a dozen ways, but every one of them is a few parts laid
 * out on the same dark mat the canvas draws (`desk-surface.tsx`) — so a project
 * illustration reads as a photograph of this product's bench rather than as
 * clip art about electronics.
 */
export const scene = {
  mat: matGrey.darkest,
  matEdge: matGrey.line,
  matGrid: matGrey.body,
  /**
   * What a build senses with.
   *
   * The one interface colour that appears inside a scene, and it comes from a
   * token rather than the material palette because sensing is not a material —
   * C-23 already draws sonar rings in teal on the canvas, so a scene that drew
   * them in anything else would be inventing a second signal for the same act.
   */
  sense: "var(--color-teal)",
} as const;
