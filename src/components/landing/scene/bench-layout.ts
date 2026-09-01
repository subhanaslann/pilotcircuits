import {
  pin,
  unoPins,
  sensorPins,
  servoPins,
  ledPins,
  resistorPins,
} from "@/lib/circuit/wokwi";

/**
 * S-01 · Where this screen puts the build.
 *
 * `geometry.ts`'s `layout` arranges the same six parts for the **workbench**,
 * where the job is wiring: parts spread out, every hole reachable, nothing
 * behind anything. This screen has a different job — someone who has never
 * seen the product has to look once and think *ah, a parking barrier* — and
 * that needs the machine, not the schematic.
 *
 * So the entry screen has its own arrangement, and it is two bands:
 *
 *   the rig      a strip of road cut from cardboard, a barrier on its kerb,
 *                the sensor watching the approach, a car coming up to it
 *   the bench    the breadboard, the board, the two LEDs and their resistors
 *
 * Nothing about the *parts* changes: the drawings are the Wokwi elements the
 * workbench uses and every pin below comes out of `pinInfo` through `pin()`.
 * Only where they sit is this screen's own, and that is the one thing a still
 * life is allowed to decide.
 *
 * The band order is not arbitrary either. The Uno's digital header runs along
 * its **top** edge, so the board is under the rig and its signals leave the
 * side facing the machine they drive. Turned the other way up, every sensor
 * and servo lead would have to travel around the board.
 */

export const FRAME = { width: 1180, height: 664 } as const;

/* --- The rig ------------------------------------------------------------- */

/** The cut cardboard the road is drawn on. It bleeds off both sides. */
export const BASE = { x: -20, y: -20, width: 1220, height: 392 } as const;

/** Asphalt, with a kerb up each side. Traffic runs left to right. */
export const ROAD = { top: 62, bottom: 248, kerb: 11 } as const;

/** Where the boom turns: on the near kerb, so it swings clear of the road. */
export const PIVOT = { x: 700, y: ROAD.bottom } as const;
export const BOOM = { length: 224, width: 15, closed: -90, open: 0 } as const;

/* --- Where each part stands ---------------------------------------------- */

/**
 * Top-left of each part's rendered box — the same corner `pinInfo` measures
 * from, which is what lets every wire end below be a plain addition.
 */
export const AT = {
  /** The servo is the barrier cabinet: on the verge, spindle at the kerb. */
  servo: { x: PIVOT.x - 95.28, y: PIVOT.y - 62.26 },
  /** Set into the verge below the road, looking up across it. */
  sensor: { x: 432, y: 262 },
  board: { x: 626, y: 386 },
  breadboard: { x: 196, y: 404 },
  /* Each LED sits above its own 220 Ω, and the resistor is the link between
     the cathode and the rail — not an ornament laid beside it. */
  ledGreen: { x: 230, y: 442 },
  ledRed: { x: 366, y: 442 },
  resistorGreen: { x: 230, y: 506 },
  resistorRed: { x: 366, y: 506 },
} as const;

/** Half-size board: thirty columns and a rail either side. */
export const BREADBOARD = {
  width: 320,
  height: 212.6,
  channel: 20,
  columns: 30,
  pitch: 10,
} as const;

const BB = AT.breadboard;
/**
 * Four rail rows, not two.
 *
 * A breadboard carries a pair top and bottom, and each pair is two rows of
 * holes: plus and minus, a tenth of an inch apart. Modelling one row per pair
 * forced every ground wire to travel the height of the board to reach the far
 * side, which is a run nobody makes and a line straight through the drawing.
 */
export const RAIL = {
  topPos: BB.y - BREADBOARD.pitch * 2.2,
  topNeg: BB.y - BREADBOARD.pitch * 1.2,
  botNeg: BB.y + BREADBOARD.height + BREADBOARD.pitch * 1.2,
  botPos: BB.y + BREADBOARD.height + BREADBOARD.pitch * 2.2,
  first: BB.x + 16,
} as const;

/** Centre of a rail hole, counting from one. */
const railHole = (col: number) => RAIL.first + (col - 1) * BREADBOARD.pitch;
const posAt = (col: number) => ({ x: railHole(col), y: RAIL.topPos });
const negAt = (col: number) => ({ x: railHole(col), y: RAIL.topNeg });
const negLow = (col: number) => ({ x: railHole(col), y: RAIL.botNeg });

/* --- Every wire end, from the parts' own pin tables ----------------------- */

export const P = {
  d2: pin(AT.board, unoPins.D2),
  d3: pin(AT.board, unoPins.D3),
  d6: pin(AT.board, unoPins.D6),
  d7: pin(AT.board, unoPins.D7),
  d8: pin(AT.board, unoPins.D8),
  d9: pin(AT.board, unoPins.D9),
  fiveVolt: pin(AT.board, unoPins["5V"]),
  boardGnd: pin(AT.board, unoPins.GND2),

  sensorVcc: pin(AT.sensor, sensorPins.vcc),
  sensorTrig: pin(AT.sensor, sensorPins.trig),
  sensorEcho: pin(AT.sensor, sensorPins.echo),
  sensorGnd: pin(AT.sensor, sensorPins.gnd),

  servoSignal: pin(AT.servo, servoPins.signal),
  servoPower: pin(AT.servo, servoPins.power),
  servoGnd: pin(AT.servo, servoPins.ground),

  greenAnode: pin(AT.ledGreen, ledPins.anode),
  greenCathode: pin(AT.ledGreen, ledPins.cathode),
  redAnode: pin(AT.ledRed, ledPins.anode),
  redCathode: pin(AT.ledRed, ledPins.cathode),

  greenR: pin(AT.resistorGreen, resistorPins.left),
  greenRail: pin(AT.resistorGreen, resistorPins.right),
  redR: pin(AT.resistorRed, resistorPins.left),
  redRail: pin(AT.resistorRed, resistorPins.right),
} as const;

export type WireRole = "power" | "ground" | "signal" | "signalAlt";

export interface Cable {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  role: WireRole;
  /** How far the cable bows, as a fraction of the run. Keeps bundles apart. */
  bow?: number;
}

/**
 * The eleven connections `smart-parking-barrier.ts` defines, routed for this
 * frame. `c.sensor.echo` is missing on purpose: it is the one that moves, and
 * `bench-view.tsx` draws it from the clock.
 */
export const CABLES: Cable[] = [
  /* Power out of the board and into the near end of the rails: a supply run
     that crosses the whole breadboard to reach a far hole is a supply run
     nobody would make, and it draws a line straight through the middle of the
     picture. */
  { id: "c.rail.pos", from: P.fiveVolt, to: posAt(29), role: "power", bow: 0.16 },
  { id: "c.rail.neg", from: P.boardGnd, to: negAt(29), role: "ground", bow: -0.1 },

  { id: "c.sensor.vcc", from: P.sensorVcc, to: posAt(25), role: "power", bow: 0.16 },
  { id: "c.sensor.gnd", from: P.sensorGnd, to: negAt(25), role: "ground", bow: 0.26 },
  { id: "c.sensor.trig", from: P.sensorTrig, to: P.d8, role: "signalAlt", bow: -0.16 },

  { id: "c.servo.signal", from: P.servoSignal, to: P.d9, role: "signalAlt", bow: 0.3 },
  { id: "c.servo.power", from: P.servoPower, to: posAt(21), role: "power", bow: 0.14 },
  { id: "c.servo.gnd", from: P.servoGnd, to: negAt(21), role: "ground", bow: 0.22 },

  { id: "c.led.green", from: P.greenAnode, to: P.d3, role: "signalAlt", bow: -0.18 },
  { id: "c.led.red", from: P.redAnode, to: P.d2, role: "power", bow: -0.14 },

  /* The 220 Ω is the link between each cathode and the negative rail, so these
     are the two short legs either side of it. Drawn as wiring rather than as a
     resistor lying decoratively nearby — it is one of the six counted parts. */
  { id: "c.led.green.gnd", from: P.greenCathode, to: P.greenR, role: "ground", bow: 0.24 },
  { id: "c.led.green.rail", from: P.greenRail, to: negLow(6), role: "ground", bow: 0.14 },
  { id: "c.led.red.gnd", from: P.redCathode, to: P.redR, role: "ground", bow: 0.24 },
  { id: "c.led.red.rail", from: P.redRail, to: negLow(20), role: "ground", bow: -0.14 },
];

/** The Echo cable, whose board end is the whole point of the sequence. */
export const ECHO = {
  from: P.sensorEcho,
  wrong: P.d6,
  right: P.d7,
  role: "signal" as const,
  bow: -0.14,
};

/**
 * A cable's path: out of its hole, a long easy bow, into the other.
 *
 * `routing.ts` draws the canvas's jumpers with a vertical exit and a sag, which
 * is right for the short hops between neighbouring holes it was written for.
 * The runs here are the length of the bench, and a sag that grows with span
 * would drop them through the breadboard. So the bow is perpendicular to the
 * run and set per cable, which is also how a bundle of four is kept legible.
 */
export function cablePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  bow = 0.2,
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  /* Perpendicular to the run, so the bow reads the same whichever way the
     cable happens to be pointing. */
  return `M ${from.x} ${from.y} Q ${mx - dy * bow} ${my + dx * bow} ${to.x} ${to.y}`;
}
