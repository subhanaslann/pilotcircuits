import { PITCH, layout, part } from "@/lib/circuit/geometry";
import {
  ledPins,
  pin as pinAt,
  sensorPins,
  servoPins,
  unoPins,
  headerExit,
} from "@/lib/circuit/wokwi";
import type { CircuitNode, CircuitScene, Connection, NodeId } from "@/lib/circuit/graph";

/**
 * Batch 3 · The Smart Parking Barrier scene.
 *
 * Every addressable point in the build, plus the connection graph the sketch
 * defines and the one the demo currently observes. The two differ in exactly
 * one place — Echo sits on D6 where the sketch reads D7 — which is the whole
 * first teaching moment of the product.
 */

const nodes: Record<NodeId, CircuitNode> = {};

const add = (n: CircuitNode) => {
  nodes[n.id] = n;
};

/* --- Board ---------------------------------------------------------------
   Digital header along the top edge, power header along the bottom. Positions
   come from the drawing's own pin table rather than from a pitch multiplied
   out here, so the hole a wire ends in is the hole that is drawn — including
   the real gap between D7 and D8, which a computed run of fourteen would have
   quietly closed.                                                            */

/** Our address on the left, the name Wokwi's table uses on the right. */
const BOARD_PINS: Array<[NodeId, keyof typeof unoPins, string]> = [
  ["board.D13", "D13", "D13"], ["board.D12", "D12", "D12"],
  ["board.D11", "D11", "D11"], ["board.D10", "D10", "D10"],
  ["board.D9", "D9", "D9"],    ["board.D8", "D8", "D8"],
  ["board.D7", "D7", "D7"],    ["board.D6", "D6", "D6"],
  ["board.D5", "D5", "D5"],    ["board.D4", "D4", "D4"],
  ["board.D3", "D3", "D3"],    ["board.D2", "D2", "D2"],
  ["board.D1", "D1", "D1"],    ["board.D0", "D0", "D0"],
  ["board.5V", "5V", "5V"],
  ["board.3V3", "3V3", "3V3"],
  ["board.VIN", "VIN", "VIN"],
  /* The header prints GND twice on the power side; the build uses both. */
  ["board.GND", "GND2", "GND"],
  ["board.GND2", "GND3", "GND"],
];

BOARD_PINS.forEach(([id, source, label]) => {
  add({
    id,
    kind: "board-pin",
    label,
    exit: headerExit(source),
    ...pinAt(layout.board, unoPins[source]),
  });
});

/* --- Breadboard ----------------------------------------------------------
   Two banks of five rows (a–e, f–j) either side of the centre channel, plus
   the two power rails. Every hole is addressable so a wire end can name one.  */

const ROWS_TOP = ["a", "b", "c", "d", "e"];
const ROWS_BOTTOM = ["f", "g", "h", "i", "j"];
const bbOriginX = layout.breadboard.x + PITCH;
const bbOriginY = layout.breadboard.y + PITCH * 2;

ROWS_TOP.forEach((row, r) => {
  for (let col = 1; col <= part.breadboard.columns; col++) {
    add({
      id: `bb.${row}${col}`,
      kind: "breadboard-hole",
      row,
      col,
      x: bbOriginX + (col - 1) * PITCH,
      y: bbOriginY + r * PITCH,
    });
  }
});

ROWS_BOTTOM.forEach((row, r) => {
  for (let col = 1; col <= part.breadboard.columns; col++) {
    add({
      id: `bb.${row}${col}`,
      kind: "breadboard-hole",
      row,
      col,
      x: bbOriginX + (col - 1) * PITCH,
      y: bbOriginY + 5 * PITCH + part.breadboard.channel + r * PITCH,
    });
  }
});

/**
 * Power rails: one `+` and one `−` line, top and bottom.
 *
 * **Centred in the board, which is a change to a chapter this file otherwise
 * freezes.** These two rows used to sit half a pitch outside `layout.breadboard`
 * and `+ height`, which put all ten bank rows in the top half of a 54 mm board
 * and left nine pitches of blank plastic under row J, with the ground rail
 * floating at the very edge and every wire reaching it down an 87-unit run.
 * `Breadboard` draws the plastic from the rails it is handed, so the body came
 * out 252.6 units tall against a real half-size board's 212.6.
 *
 * Chapter two fixed that for itself and left this one alone, and the difference
 * was visible walking between the two benches. This is the same arithmetic,
 * applied here: ten bank rows centred, the rails derived from them, and the
 * board exactly `part.breadboard.height` tall because `Breadboard` draws
 * fifteen units of plastic outside each rail.
 *
 * The pin snapshot in `builds.ts` was regenerated in the same change. Nothing
 * about the CONNECTIONS moved — `BARRIER_SNAPSHOT` is untouched — and the six
 * rail holes this build wires into are the only coordinates that differ.
 */
const BANK_TOP = bbOriginY;
const BANK_BOTTOM = bbOriginY + 9 * PITCH + part.breadboard.channel;
const RAIL_OFFSET =
  (part.breadboard.height - PITCH * 3 - (BANK_BOTTOM - BANK_TOP)) / 2;

for (let col = 1; col <= part.breadboard.columns; col++) {
  add({
    id: `bb.pos${col}`,
    kind: "breadboard-hole",
    row: "+",
    exit: "up",
    col,
    x: bbOriginX + (col - 1) * PITCH,
    y: BANK_TOP - RAIL_OFFSET,
  });
  add({
    id: `bb.neg${col}`,
    kind: "breadboard-hole",
    row: "-",
    exit: "down",
    col,    x: bbOriginX + (col - 1) * PITCH,
    y: BANK_BOTTOM + RAIL_OFFSET,
  });
}

/* --- Component terminals ------------------------------------------------- */

/**
 * Batch 8 · S-01 · What this build is actually made of.
 *
 * Part numbers, not part names: `HC-SR04` is what is printed on the board and
 * it reads the same in every language, so it belongs here beside the graph
 * rather than in the dictionary (rule 13). The entry screen states the kit in
 * one line and the sensor's own silkscreen is drawn from the same three
 * strings, so the drawing cannot label a part the build does not use.
 */
export const partNumbers = {
  board: "Arduino Uno",
  sensor: "HC-SR04",
  servo: "SG90",
  /* The three the entry screen never had to name, added when this chapter got
     its briefing: a part act prints the number off the build rather than out
     of the dictionary, so all six parts owe one. */
  breadboard: "Half-size",
  led: "5 mm LED",
  resistor: "220Ω",
} as const;

const SENSOR_PINS = ["vcc", "trig", "echo", "gnd"] as const;
const SENSOR_LABELS = { vcc: "VCC", trig: "Trig", echo: "Echo", gnd: "GND" };

SENSOR_PINS.forEach((pin) => {
  add({
    id: `sensor.${pin}`,
    kind: "terminal",
    label: SENSOR_LABELS[pin],
    ...pinAt(layout.ultrasonic, sensorPins[pin]),
  });
});

const SERVO_PINS = ["signal", "power", "ground"] as const;
const SERVO_LABELS = { signal: "SIG", power: "5V", ground: "GND" };

SERVO_PINS.forEach((pin) => {
  add({
    id: `servo.${pin}`,
    kind: "terminal",
    label: SERVO_LABELS[pin],
    ...pinAt(layout.servo, servoPins[pin]),
  });
});

(["green", "red"] as const).forEach((colour) => {
  const origin = colour === "green" ? layout.ledGreen : layout.ledRed;
  /* Anode right, cathode left — the way the drawing has them. */
  add({
    id: `led.${colour}.anode`,
    kind: "terminal",
    label: "+",
    ...pinAt(origin, ledPins.anode),
  });
  add({
    id: `led.${colour}.cathode`,
    kind: "terminal",
    label: "−",
    ...pinAt(origin, ledPins.cathode),
  });
});

/* --- The graph -----------------------------------------------------------
   `expected` is what the sketch defines. `observed` is identical except for
   the Echo wire, which lands on D6.                                          */

const expected: Connection[] = [
  {
    id: "c.sensor.vcc",
    from: "sensor.vcc",
    to: "bb.pos4",
    role: "power",
    label: "5V",
  },
  {
    id: "c.sensor.gnd",
    from: "sensor.gnd",
    to: "bb.neg4",
    role: "ground",
    label: "GND",
  },
  {
    id: "c.sensor.trig",
    from: "sensor.trig",
    to: "board.D8",
    role: "signalAlt",
    label: "Trig → D8",
  },
  {
    id: "c.sensor.echo",
    from: "sensor.echo",
    to: "board.D7",
    role: "signal",
    label: "Echo → D7",
  },
  {
    id: "c.servo.signal",
    from: "servo.signal",
    to: "board.D9",
    role: "signalAlt",
    label: "SIG → D9",
  },
  { id: "c.servo.power", from: "servo.power", to: "bb.pos20", role: "power" },
  { id: "c.servo.gnd", from: "servo.ground", to: "bb.neg20", role: "ground" },
  {
    id: "c.led.green",
    from: "led.green.anode",
    to: "board.D3",
    role: "signalAlt",
    label: "Green → D3",
  },
  {
    id: "c.led.red",
    from: "led.red.anode",
    to: "board.D2",
    role: "signalAlt",
    label: "Red → D2",
  },
  { id: "c.rail.pos", from: "board.5V", to: "bb.pos1", role: "power" },
  { id: "c.rail.neg", from: "board.GND", to: "bb.neg1", role: "ground" },
];

/** The demo's starting state: Echo one pin off. */
const observed: Connection[] = expected.map((c) =>
  c.id === "c.sensor.echo"
    ? { ...c, to: "board.D6", label: "Echo → D6" }
    : c,
);

export const smartParkingBarrier: CircuitScene = {
  nodes,
  expected,
  observed,
  mechanical: { servoAngle: 0, expectedAngle: 90 },
};

/** Applies the first correction — the state after "I fixed it". */
export function withEchoFixed(scene: CircuitScene): CircuitScene {
  return {
    ...scene,
    observed: scene.observed.map((c) =>
      c.id === "c.sensor.echo"
        ? { ...c, to: "board.D7", label: "Echo → D7" }
        : c,
    ),
  };
}

/** Applies the second correction — the state after "I remounted it". */
export function withServoRemounted(scene: CircuitScene): CircuitScene {
  return {
    ...scene,
    mechanical: { ...scene.mechanical, servoAngle: scene.mechanical.expectedAngle },
  };
}

/**
 * Batch 7 · The two faults, put back.
 *
 * The scene above already ships with both — a fresh session is the first frame
 * of the demo. These are for the demo controls (W-10), which have to be able to
 * *return* to that frame after a fix without reloading the page, so that a
 * filmed take can be started again from any point.
 *
 * They are the exact inverses of the two corrections, and they are here rather
 * than in the menu for the same reason `withEchoFixed` is: what this build's
 * mistakes are is a fact about the build, not about the control that triggers
 * them.
 */

/** Puts the Echo wire back one pin off. */
export function withEchoMisplaced(scene: CircuitScene): CircuitScene {
  return {
    ...scene,
    observed: scene.observed.map((c) =>
      c.id === "c.sensor.echo"
        ? { ...c, to: "board.D6", label: "Echo → D6" }
        : c,
    ),
  };
}

/** Puts the horn back a quarter turn out. */
export function withHornTurned(scene: CircuitScene): CircuitScene {
  return {
    ...scene,
    mechanical: { ...scene.mechanical, servoAngle: 0 },
  };
}
