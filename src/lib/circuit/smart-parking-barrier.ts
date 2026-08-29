import { PITCH, layout, part } from "@/lib/circuit/geometry";
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
   Digital header along the top edge, power header along the bottom. Pin
   spacing is the standard 0.1", so wires land on real coordinates.          */

const DIGITAL = [
  "D13", "D12", "D11", "D10", "D9", "D8",
  "D7", "D6", "D5", "D4", "D3", "D2", "D1", "D0",
];

DIGITAL.forEach((label, index) => {
  add({
    id: `board.${label}`,
    kind: "board-pin",
    label,
    x: layout.board.x + part.board.width - PITCH * 1.5 - index * PITCH,
    y: layout.board.y + part.board.digitalY,
  });
});

const POWER = ["5V", "3V3", "GND", "VIN"];
POWER.forEach((label, index) => {
  add({
    id: `board.${label}`,
    kind: "board-pin",
    label,
    /* Second GND is addressed separately below. */
    x: layout.board.x + PITCH * 4 + index * PITCH,
    y: layout.board.y + part.board.powerY,
  });
});

add({
  id: "board.GND2",
  kind: "board-pin",
  label: "GND",
  x: layout.board.x + PITCH * 4 + 4 * PITCH,
  y: layout.board.y + part.board.powerY,
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

/* Power rails: one + and one − line, top and bottom. */
for (let col = 1; col <= part.breadboard.columns; col++) {
  add({
    id: `bb.pos${col}`,
    kind: "breadboard-hole",
    row: "+",
    col,
    x: bbOriginX + (col - 1) * PITCH,
    y: layout.breadboard.y - PITCH * 0.5,
  });
  add({
    id: `bb.neg${col}`,
    kind: "breadboard-hole",
    row: "-",
    col,
    x: bbOriginX + (col - 1) * PITCH,
    y: layout.breadboard.y + part.breadboard.height + PITCH * 0.5,
  });
}

/* --- Component terminals ------------------------------------------------- */

const SENSOR_PINS = ["vcc", "trig", "echo", "gnd"] as const;
const SENSOR_LABELS = { vcc: "VCC", trig: "Trig", echo: "Echo", gnd: "GND" };

SENSOR_PINS.forEach((pin, index) => {
  add({
    id: `sensor.${pin}`,
    kind: "terminal",
    label: SENSOR_LABELS[pin],
    x: layout.ultrasonic.x + part.ultrasonic.width / 2 - PITCH * 1.5 + index * PITCH,
    y: layout.ultrasonic.y + part.ultrasonic.height,
  });
});

const SERVO_PINS = ["signal", "power", "ground"] as const;
const SERVO_LABELS = { signal: "SIG", power: "5V", ground: "GND" };

SERVO_PINS.forEach((pin, index) => {
  add({
    id: `servo.${pin}`,
    kind: "terminal",
    label: SERVO_LABELS[pin],
    x: layout.servo.x - PITCH,
    y: layout.servo.y + part.servo.height / 2 - PITCH + index * PITCH,
  });
});

(["green", "red"] as const).forEach((colour) => {
  const origin = colour === "green" ? layout.ledGreen : layout.ledRed;
  add({
    id: `led.${colour}.anode`,
    kind: "terminal",
    label: "+",
    x: origin.x,
    y: origin.y + part.led.legLength,
  });
  add({
    id: `led.${colour}.cathode`,
    kind: "terminal",
    label: "−",
    x: origin.x + PITCH,
    y: origin.y + part.led.legLength,
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
