import { PX, boxOf, frame } from "@/lib/circuit/wokwi";

/**
 * Batch 3 · Scene geometry.
 *
 * One scene unit = 0.254 mm, so a breadboard's 0.1" pitch is exactly 10 units.
 * Every part below is drawn at its real proportion, because the user compares
 * what is on screen with what is on their desk — a breadboard drawn at the
 * wrong ratio breaks that comparison, and with it the whole premise of
 * "move the yellow wire from D6 to D7".
 *
 * The bought parts take their size from the Wokwi drawings rather than from a
 * datasheet retyped here, so a part's footprint and its artwork can never
 * disagree. The breadboard is still ours — see `@/lib/circuit/wokwi`.
 */

/** 2.54 mm — the pitch every through-hole part shares. */
export const PITCH = 10;

/** Millimetres to scene units. */
export const mm = (value: number) => (value / 2.54) * PITCH;

export const scene = {
  width: 1200,
  height: 820,
} as const;

/** Real part dimensions, in scene units. */
export const part = {
  /** Includes the USB shell and the barrel jack overhanging the PCB's left. */
  board: boxOf(frame.uno),
  breadboard: {
    /** Half-size: 30 columns, two 5-hole banks, plus power rails. */
    columns: 30,
    width: 30 * PITCH + PITCH * 2,
    height: mm(54),
    /** Vertical gap between the two banks. */
    channel: PITCH * 2,
  },
  ultrasonic: boxOf(frame.sensor),
  servo: {
    ...boxOf(frame.servo),
    /**
     * Spindle to the tip of the single horn.
     *
     * Measured off the drawing: the horn's spline sits at y=59.77 in the
     * servo's own pixel space and the arm reaches y=0.23, so 59.5 px of it
     * stands clear of the centre.
     */
    horn: 59.5 * PX,
  },
  led: boxOf(frame.led),
  resistor: boxOf(frame.resistor),
  barrierArm: {
    length: mm(70),
    width: mm(6),
  },
} as const;

/**
 * Where each part sits.
 *
 * Arranged the way the parts actually land on a desk: breadboard and board
 * side by side with the sensor bridging them above, and the servo out to the
 * right where its arm has room to swing. Spreading them to the corners of the
 * scene would be tidier to draw and useless to build from — the wires would
 * cross the whole board and stop resembling the ones in front of the user.
 */
export const layout = {
  breadboard: { x: 150, y: 430 },
  board: { x: 560, y: 440 },
  ultrasonic: { x: 300, y: 250 },
  servo: { x: 610, y: 230 },
  ledGreen: { x: 300, y: 470 },
  ledRed: { x: 350, y: 470 },
} as const;

/** Zoom limits for the viewport. */
export const zoom = {
  min: 0.4,
  max: 3,
  /** Pin and wire labels appear above this scale. */
  labelThreshold: 0.8,
} as const;

/**
 * W-07 · The outline a vision result draws around a part.
 *
 * Derived from the same `layout` and `part` the drawings use, so a detection
 * box cannot drift off the thing it claims to have detected. Padded by a
 * pitch, because a box drawn exactly on a silhouette reads as a border on the
 * part rather than as an annotation about it.
 */
const PAD = PITCH;

export const partBox = {
  board: {
    x: layout.board.x - PAD,
    y: layout.board.y - PAD,
    width: part.board.width + PAD * 2,
    height: part.board.height + PAD * 2,
  },
  breadboard: {
    x: layout.breadboard.x - PAD,
    y: layout.breadboard.y - PITCH * 2 - PAD,
    width: part.breadboard.width + PAD * 2,
    height: part.breadboard.height + PITCH * 4 + PAD * 2,
  },
  sensor: {
    x: layout.ultrasonic.x - PAD,
    y: layout.ultrasonic.y - PAD,
    width: part.ultrasonic.width + PAD * 2,
    height: part.ultrasonic.height + PAD * 2,
  },
  servo: {
    x: layout.servo.x - PITCH * 2 - PAD,
    y: layout.servo.y - PAD,
    width: part.servo.width + PITCH * 4 + PAD * 2,
    height: part.servo.height + PAD * 2,
  },
  ledGreen: {
    x: layout.ledGreen.x - PAD,
    y: layout.ledGreen.y - PAD,
    width: part.led.width + PAD * 2,
    height: part.led.height + PAD * 2,
  },
  ledRed: {
    x: layout.ledRed.x - PAD,
    y: layout.ledRed.y - PAD,
    width: part.led.width + PAD * 2,
    height: part.led.height + PAD * 2,
  },
} as const;

export type PartBoxId = keyof typeof partBox;

/**
 * Where the servo horn turns, and how far the arm reaches from it.
 *
 * Both the drawing and the inspection's crop need these, and a crop computed
 * from its own idea of where the spindle is would drift off the arm the first
 * time the servo moved on the bench.
 */
export const spindle = {
  x: layout.servo.x + 91.467 * PX,
  y: layout.servo.y + 59.773 * PX,
} as const;

/** Spindle to the far end of the arm: the horn, less its overlap, plus the arm. */
export const armReach =
  part.servo.horn - PITCH + part.barrierArm.length;

/**
 * W-08 · The frame the inspection's angle comparison is cropped to.
 *
 * Wide enough for the arm at both the angle the sketch sends and the one the
 * horn is actually fitted at — the whole point of the comparison is that both
 * fit in one picture, with a pitch or two of air past each tip.
 */
export const hornFrame = {
  x: spindle.x - PITCH * 15,
  y: spindle.y - PITCH * 11,
  width: armReach + PITCH * 22,
  height: armReach + PITCH * 18,
} as const;
