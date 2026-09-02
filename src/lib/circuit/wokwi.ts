/**
 * The bridge between Wokwi's drawings and our scene.
 *
 * Two things have to agree or the whole canvas lies: where a part is drawn, and
 * where the graph says its pins are. Upstream those already agree — each Wokwi
 * element ships a `pinInfo` table measured against its own rendered box — so
 * the safest thing we can do is derive both from that one table rather than
 * re-measure the artwork by eye. Everything below exists to turn Wokwi's units
 * into ours exactly once.
 *
 * Three coordinate systems meet here:
 *
 *   - **viewBox units** — what the SVG paths are written in. Millimetres for
 *     the board, the sensor and the resistor; CSS pixels for the servo and the
 *     LED. Never assume; each frame states its own.
 *   - **CSS pixels at 96dpi** — what `pinInfo` is measured in, against the
 *     element's *rendered* box (its `width`/`height` attributes), not its
 *     viewBox.
 *   - **scene units** — ours. One is 0.254 mm, so a 0.1" pitch is exactly 10.
 *
 * @see https://github.com/wokwi/wokwi-elements (MIT)
 */

/**
 * One CSS pixel in scene units.
 *
 * A pixel is 25.4/96 mm and a scene unit is 0.254 mm, so the ratio is exactly
 * 25/24 — written as a fraction rather than 1.0417 because it is exact and the
 * error would otherwise accumulate across a 30-column breadboard.
 */
export const PX = 25 / 24;

/** CSS pixels per millimetre, at 96dpi. */
const PX_PER_MM = 96 / 25.4;

export interface WokwiFrame {
  /** `viewBox`, verbatim: min-x, min-y, width, height. */
  viewBox: readonly [number, number, number, number];
  /**
   * The element's rendered box in CSS pixels — its `width`/`height` attributes
   * converted to px. This is the box `pinInfo` is measured against.
   */
  box: readonly [number, number];
}

/** Declares a frame whose width/height attributes are in millimetres. */
const mmFrame = (
  viewBox: readonly [number, number, number, number],
  widthMm: number,
  heightMm: number,
): WokwiFrame => ({
  viewBox,
  box: [widthMm * PX_PER_MM, heightMm * PX_PER_MM],
});

/**
 * Every part the canvas draws that has a pin table.
 *
 * Most of them are Wokwi's. Three are ours — the breadboard, the jumper wires
 * and the soil probe — and the reasons differ: Wokwi has no breadboard element
 * (open since 2020, wokwi/wokwi-elements#31) and draws its wires in the closed
 * simulator, while a capacitive soil moisture probe is simply not in the
 * upstream catalogue at all. A frame declared here is a frame this file
 * reconciles, whoever drew it.
 */
export const frame = {
  /** `-4` on the viewBox is the USB shell and the barrel jack overhanging. */
  uno: mmFrame([-4, 0, 72.58, 53.34], 72.58, 53.34),
  sensor: mmFrame([0, 0, 45, 25], 45, 25),
  /**
   * Chapter three's motion sensor, ported in the same pass as this table.
   *
   * Upstream states its box in millimetres and its viewBox in what those
   * millimetres come to at 96dpi, so the two are the same number to four
   * places and `fit` returns a scale of 1. Declared through `mmFrame` anyway,
   * because the ATTRIBUTES are millimetres and a frame that lied about its own
   * units would be the one thing this file exists to stop.
   */
  pir: mmFrame([0, 0, 90.7, 92.4], 24, 24.448),
  /**
   * Chapter four's probe — ours, and the one frame here with no upstream.
   *
   * 23 x 98 mm is the real board (a capacitive v1.2), stated as pixels in the
   * viewBox and as millimetres in the box so the two agree by construction, the
   * way every ported frame's do. It is a long thin thing beside a 68 mm Arduino
   * and that is what it is: the whole point of drawing at real proportions is
   * that a person can compare the screen with their desk.
   */
  soil: mmFrame([0, 0, 86.93, 370.39], 23, 98),
  resistor: mmFrame([0, 0, 15.645, 3], 15.645, 3),
  servo: { viewBox: [0, 0, 170.08, 119.55], box: [170.08, 119.55] },
  led: { viewBox: [-10, -5, 35.456, 39.618], box: [40, 50] },
} as const satisfies Record<string, WokwiFrame>;

/**
 * How an SVG with no `preserveAspectRatio` actually lands in its box: scaled
 * uniformly to fit, then centred. Only the LED's box is a different shape from
 * its viewBox, but the rule is applied to all of them so a future part with a
 * mismatched box cannot silently draw a pin's-width off.
 */
function fit(f: WokwiFrame) {
  const [, , vbW, vbH] = f.viewBox;
  const [boxW, boxH] = f.box;
  const scale = Math.min(boxW / vbW, boxH / vbH);
  return {
    scale,
    offsetX: (boxW - vbW * scale) / 2,
    offsetY: (boxH - vbH * scale) / 2,
  };
}

/**
 * Places a part's artwork so the top-left of its rendered box sits at `at`.
 *
 * The same corner `pinInfo` is measured from, which is what lets `pin()` below
 * be a plain addition.
 */
export function artTransform(
  f: WokwiFrame,
  at: { x: number; y: number },
): string {
  const [vbX, vbY] = f.viewBox;
  const { scale, offsetX, offsetY } = fit(f);
  const k = scale * PX;
  const x = at.x + offsetX * PX;
  const y = at.y + offsetY * PX;
  return `translate(${x} ${y}) scale(${k}) translate(${-vbX} ${-vbY})`;
}

/** A part's rendered box in scene units — what a vision overlay outlines. */
export function boxOf(f: WokwiFrame) {
  return { width: f.box[0] * PX, height: f.box[1] * PX };
}

/** A `pinInfo` coordinate, in scene units, for a part placed at `at`. */
export function pin(
  at: { x: number; y: number },
  px: readonly [number, number],
): { x: number; y: number } {
  return { x: at.x + px[0] * PX, y: at.y + px[1] * PX };
}

/* --- pinInfo, copied from the upstream elements ---------------------------
   Only the pins this build addresses. Copied rather than imported because the
   package is not a dependency: the artwork was ported, and a pin table that
   drifts from the drawing it belongs to is exactly the bug this file exists to
   prevent — so the two are carried over together, from the same commit.       */

/** wokwi-arduino-uno. The gap between D7 and D8 is real: the header is split. */
export const unoPins = {
  D0: [255.5, 9], D1: [246, 9], D2: [236.5, 9], D3: [227, 9],
  D4: [217.5, 9], D5: [208, 9], D6: [198.5, 9], D7: [189, 9],
  D8: [173, 9], D9: [163, 9], D10: [153.5, 9], D11: [144, 9],
  D12: [134.5, 9], D13: [125, 9],
  GND1: [115.5, 9], AREF: [106, 9],
  IOREF: [131, 191.5], RESET: [140.5, 191.5], "3V3": [150, 191.5],
  "5V": [160, 191.5], GND2: [169.5, 191.5], GND3: [179, 191.5],
  VIN: [188.5, 191.5],
  A0: [208, 191.5], A1: [217.5, 191.5], A2: [227, 191.5],
  A3: [236.5, 191.5], A4: [246, 191.5], A5: [255.5, 191.5],
} as const satisfies Record<string, readonly [number, number]>;

/**
 * Which way a cable leaves a header pin: out over the board's edge. The digital
 * header is the top edge of the art (`y` 9), the power and analog headers the
 * bottom (`y` 191.5), and a board placed anywhere on the desk keeps that.
 */
export function headerExit(source: keyof typeof unoPins): "up" | "down" {
  return unoPins[source][1] < 100 ? "up" : "down";
}

/** wokwi-hc-sr04 */
export const sensorPins = {
  vcc: [71.3, 94.5],
  trig: [81.3, 94.5],
  echo: [91.3, 94.5],
  gnd: [101.3, 94.5],
} as const satisfies Record<string, readonly [number, number]>;

/**
 * wokwi-pir-motion-sensor.
 *
 * The three pins hang BELOW the module — `y` is 92 against a 92.4-tall box —
 * and they are 9.74 px apart where a true 0.1" header is 9.6. That is the
 * drawing's own spacing and the pins follow it, exactly as the Uno's 9.5 px
 * header does: over the two gaps it comes to 20.29 scene units against the
 * breadboard's 20, which is a thirtieth of a hole and is why nothing but a
 * lead ever has to reconcile the two grids.
 */
export const pirPins = {
  vcc: [36.178, 92],
  out: [45.9175, 92],
  gnd: [55.6415, 92],
} as const satisfies Record<string, readonly [number, number]>;

/**
 * Our soil probe. Not `pinInfo` — there is no upstream element to copy it from,
 * so this table and `soil-probe.tsx` are the same fact written twice and have
 * to be changed together. The header sits in the board's left third at a
 * 0.1" pitch — see `soil-probe.tsx` for why it is not centred — and `y` is the
 * tip of the three posts, 6 px down from the top edge, which is where a female
 * jumper actually grips one.
 */
export const soilPins = {
  vcc: [14.4, 6],
  gnd: [24.0, 6],
  aout: [33.6, 6],
} as const satisfies Record<string, readonly [number, number]>;

/** wokwi-servo. The three leads leave the case on its left edge. */
export const servoPins = {
  ground: [0, 50],
  power: [0, 59.5],
  signal: [0, 69],
} as const satisfies Record<string, readonly [number, number]>;

/** wokwi-led, unflipped: anode right, cathode left. */
export const ledPins = {
  anode: [25, 42],
  cathode: [15, 42],
} as const satisfies Record<string, readonly [number, number]>;

/** wokwi-resistor */
export const resistorPins = {
  left: [0, 5.65],
  right: [58.8, 5.65],
} as const satisfies Record<string, readonly [number, number]>;

/**
 * The board header's real pitch, in scene units.
 *
 * Wokwi spaces its header pins 9.5px apart where a true 0.1" header is 9.6px,
 * so a run of pins drifts by about a fifth of a hole across the board. That is
 * invisible and it is *their* drawing, so the pins follow the artwork rather
 * than the ideal — but the breadboard, which we draw ourselves, stays on the
 * exact 10-unit grid. Nothing connects the two but wires, and a wire only needs
 * its two ends.
 */
export const HEADER_PITCH = 9.5 * PX;
