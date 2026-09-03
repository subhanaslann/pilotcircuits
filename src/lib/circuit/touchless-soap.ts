import { PITCH, framing, mm, part } from "@/lib/circuit/geometry";
import {
  PX,
  boxOf,
  frame,
  ledPins,
  pin as pinAt,
  resistorPins,
  sensorPins,
  servoPins,
  unoPins,
  headerExit,
} from "@/lib/circuit/wokwi";
import type {
  CircuitNode,
  CircuitScene,
  Connection,
  MechanicalState,
  NodeId,
} from "@/lib/circuit/graph";
import { maybeNode } from "@/lib/circuit/graph";
import type {
  Placement,
  PlacementSpec,
  PlacementTopology,
  TerminalId,
} from "@/lib/circuit/placement";
import {
  anchorsFor,
  attach,
  attachmentOf,
  isFlexible,
} from "@/lib/circuit/placement";
import {
  assignCables,
  cablePairs,
  type CablePair,
} from "@/lib/circuit/cable-joins";
import type { KitId } from "@/lib/projects/catalog";

/**
 * Chapter five · The Touchless Soap Dispenser.
 *
 * ## What is new: something that moves, and two pins that work as a pair
 *
 * Four chapters have driven lights. This one drives a **motor**, and the two
 * facts that come with it are the whole of the chapter.
 *
 * **A servo is told a position, not a state.** The pin it listens on has to be
 * able to hold a value between on and off — chapter one's lesson, arriving a
 * second time on a part where getting it wrong does not dim a lamp, it stops
 * the pump moving at all. `pwmPins` is chapter one's own list and this chapter
 * reads it rather than keeping a second copy.
 *
 * **Trigger and echo are one measurement across two pins.** The board sends a
 * pulse out of one and times how long it takes to come back on the other, and
 * the two are not interchangeable in either direction: the sensor prints
 * `Trig` and `Echo` beside them, so swapping them is a mistake a person can see
 * and the model reports.
 *
 * ## Two modules, and the reason the model has them
 *
 * Both the sensor and the servo are `flexible` parts with a declared case — the
 * shape chapter three introduced. For the servo it is not a convenience: its
 * three leads leave the case's LEFT edge on a 9.5 px pitch, stacked
 * vertically, so plugging it into a breadboard would put all three in one
 * column, which is one node and a dead short. A servo goes on the end of its
 * own cable and stands where it stands, which is what this draws.
 *
 * That is §12's first open item — "separating the body
 * from the lead positions, needed for parts with flying leads (the servo)" —
 * and this is the chapter it was written for.
 *
 * ## `mechanical` is on a bench somebody builds, for the first time
 *
 * `servoAngle` / `expectedAngle` have existed since the capstone and have only
 * ever run on a build the author laid out. Here they are at rest and equal: no
 * gesture on this bench can mount a horn crooked, so a build that is wired
 * right has a horn that is on straight, and `checksMechanical` on the servo
 * step asserts exactly that. What the run does with them is turn the pump.
 *
 * `board.GND` is **GND1**, on the digital header — chapters one, two and
 * three's choice, and the opposite of four's and six's. Everything this build
 * reads or drives is on the digital side; only `5V` is not, and that one cable
 * crosses the board.
 */

/* --- Where the bench is --------------------------------------------------- */

/** Chapters two and three's desk. Four turned it over; five turns it back. */
export const soapBreadboardAt = { x: 150, y: 175 } as const;
export const soapBoardAt = { x: 300, y: 440 } as const;

/**
 * Where the distance sensor stands.
 *
 * Above the breadboard with its four pins hanging off the bottom edge, so all
 * four leads run DOWN — the same constraint chapter three's motion sensor has,
 * for the same reason: the pins are on the case's bottom edge and a lead going
 * up would be drawn across the module's own face.
 */
export const soapSensorAt = { x: 330, y: 40 } as const;

/**
 * Where the servo stands.
 *
 * To the right of everything, because its three leads leave the case's LEFT
 * edge and therefore have to run left. Clear of the breadboard's plastic in x
 * and of the Uno in y — a case with a wire drawn across it is the one thing
 * this bench has to avoid, and for a part whose leads come out sideways that is
 * a question of which side it stands on.
 */
export const soapServoAt = { x: 500, y: 200 } as const;

/**
 * Every hole on both of the Uno's headers.
 *
 * The digital header because this chapter reads two pins and drives two more,
 * and the power header because `5V` is on it. A0–A5 stay out: they are chapter
 * four's subject and no step, finding or sentence here has anything to say
 * about them.
 */
const BOARD_PINS: Array<[NodeId, keyof typeof unoPins, string]> = [
  ["board.D13", "D13", "D13"], ["board.D12", "D12", "D12"],
  ["board.D11", "D11", "D11"], ["board.D10", "D10", "D10"],
  ["board.D9", "D9", "D9"],    ["board.D8", "D8", "D8"],
  ["board.D7", "D7", "D7"],    ["board.D6", "D6", "D6"],
  ["board.D5", "D5", "D5"],    ["board.D4", "D4", "D4"],
  ["board.D3", "D3", "D3"],    ["board.D2", "D2", "D2"],
  ["board.D1", "D1", "D1"],    ["board.D0", "D0", "D0"],
  /* GND1 — the digital side. See the header. */
  ["board.GND", "GND1", "GND"],
  ["board.IOREF", "IOREF", "IOREF"],
  ["board.RESET", "RESET", "RESET"],
  ["board.3V3", "3V3", "3V3"],
  ["board.5V", "5V", "5V"],
  ["board.GND2", "GND2", "GND"],
  ["board.GND3", "GND3", "GND"],
  ["board.VIN", "VIN", "VIN"],
];

const boardNodes: Record<NodeId, CircuitNode> = Object.fromEntries(
  BOARD_PINS.map(([id, source, label]) => [
    id,
    {
      id,
      kind: "board-pin" as const,
      label,
      exit: headerExit(source),
      ...pinAt(soapBoardAt, unoPins[source]),
    },
  ]),
);

/* --- The breadboard's 360 holes ------------------------------------------- */

const ROWS_TOP = ["a", "b", "c", "d", "e"] as const;
const ROWS_BOTTOM = ["f", "g", "h", "i", "j"] as const;

const columns = Array.from(
  { length: part.breadboard.columns },
  (_, i) => i + 1,
);

const bbOriginX = soapBreadboardAt.x + PITCH;
const bbOriginY = soapBreadboardAt.y + PITCH * 2;
const columnX = (col: number) => bbOriginX + (col - 1) * PITCH;

const bbNodes: Record<NodeId, CircuitNode> = {};

const addBank = (rows: readonly string[], firstRowY: number) => {
  rows.forEach((row, r) => {
    for (const col of columns) {
      const id = `bb.${row}${col}`;
      bbNodes[id] = {
        id,
        kind: "breadboard-hole",
        label: `${row.toUpperCase()}${col}`,
        row,
        col,
        x: columnX(col),
        y: firstRowY + r * PITCH,
      };
    }
  });
};

addBank(ROWS_TOP, bbOriginY);
addBank(ROWS_BOTTOM, bbOriginY + 5 * PITCH + part.breadboard.channel);

const BANK_TOP = bbOriginY;
const BANK_BOTTOM = bbOriginY + 9 * PITCH + part.breadboard.channel;

/** Chapter two's centring, for chapter two's reason. */
const RAIL_OFFSET =
  (part.breadboard.height - PITCH * 3 - (BANK_BOTTOM - BANK_TOP)) / 2;

const posRailY = BANK_TOP - RAIL_OFFSET;
const negRailY = BANK_BOTTOM + RAIL_OFFSET;

for (const col of columns) {
  bbNodes[`bb.pos${col}`] = {
    id: `bb.pos${col}`,
    kind: "breadboard-hole",
    label: `+${col}`,
    row: "+",
    exit: "up",
    col,
    x: columnX(col),
    y: posRailY,
  };
  bbNodes[`bb.neg${col}`] = {
    id: `bb.neg${col}`,
    kind: "breadboard-hole",
    label: `−${col}`,
    row: "-",
    exit: "down",
    col,
    x: columnX(col),
    y: negRailY,
  };
}

const nodeGrid: Record<NodeId, CircuitNode> = { ...bbNodes, ...boardNodes };

/** The 382 holes a lead may go into, ordered the way they read on screen. */
export const soapCandidates: NodeId[] = [
  ...ROWS_TOP.flatMap((row) => columns.map((col) => `bb.${row}${col}`)),
  ...ROWS_BOTTOM.flatMap((row) => columns.map((col) => `bb.${row}${col}`)),
  ...columns.map((col) => `bb.pos${col}`),
  ...columns.map((col) => `bb.neg${col}`),
  ...BOARD_PINS.map(([id]) => id),
].sort(
  (a, b) => nodeGrid[a].x - nodeGrid[b].x || nodeGrid[a].y - nodeGrid[b].y,
);

/**
 * The four holes the sketch names, and the sketch's own constants.
 *
 * `const int TRIG = 8, ECHO = 7, PUMP = 9, LAMP = 13;`. `D9` for the pump
 * because it is marked `~`: a servo is told an angle, and only the pins that
 * can hold a value between on and off can say one. The other three are ordinary
 * digital pins and are chosen so that the four cables and leads reaching the
 * header do not cross each other.
 */
export const soapPins = {
  trig: "board.D8",
  echo: "board.D7",
  pump: "board.D9",
  lamp: "board.D13",
} as const;

/* --- Where a part sits, given what one of its leads is attached to --------- */

type Point = { x: number; y: number };

/** Chapter one's number and chapter one's reason. See `traffic-light.ts`. */
const STANDOFF = mm(14);

function ledOriginFrom(
  anchor: Point,
  end: "cathode" | "anode",
  intoHole: boolean,
) {
  const drop = intoHole ? 0 : -STANDOFF;
  return {
    x: anchor.x - ledPins[end][0] * PX,
    y: anchor.y - ledPins[end][1] * PX + drop,
  };
}

/** The resistor runs LEFTWARD from its anchor: `in` is the drawing's RIGHT pin. */
function resistorOriginFrom(
  anchor: Point,
  end: "in" | "out",
  intoHole: boolean,
) {
  const px = end === "in" ? resistorPins.right : resistorPins.left;
  const drop = intoHole ? 0 : -STANDOFF;
  return {
    x: anchor.x - px[0] * PX,
    y: anchor.y - px[1] * PX + drop,
  };
}

/** Chapter two's slack: a loose cable end hangs toward the other board. */
const WIRE_SLACK = { x: PITCH * 2, y: PITCH * 5 } as const;

const slackFrom = (seat: CircuitNode): Point => ({
  x: seat.x + WIRE_SLACK.x,
  y: seat.y + (seat.id.startsWith("bb.") ? WIRE_SLACK.y : -WIRE_SLACK.y),
});

/* --- The graph ------------------------------------------------------------ */

const expected: Connection[] = [
  {
    id: "tsd.c.power.pin",
    from: "wire.power.pin",
    to: "board.5V",
    role: "power",
    label: "5V",
    medium: "leg",
  },
  {
    id: "tsd.c.power.rail",
    from: "wire.power.rail",
    to: "bb.pos30",
    role: "power",
    medium: "leg",
  },
  {
    id: "tsd.c.ground.pin",
    from: "wire.ground.pin",
    to: "board.GND",
    role: "ground",
    label: "GND",
    medium: "leg",
  },
  {
    id: "tsd.c.ground.rail",
    from: "wire.ground.rail",
    to: "bb.neg30",
    role: "ground",
    medium: "leg",
  },

  {
    id: "tsd.c.sensor.vcc",
    from: "sensor.vcc",
    to: "bb.pos25",
    role: "power",
    medium: "leg",
  },
  {
    id: "tsd.c.sensor.trig",
    from: "sensor.trig",
    to: "board.D8",
    role: "signalAlt",
    label: "D8",
    medium: "leg",
  },
  {
    id: "tsd.c.sensor.echo",
    from: "sensor.echo",
    to: "board.D7",
    role: "signal",
    label: "D7",
    medium: "leg",
  },
  {
    id: "tsd.c.sensor.gnd",
    from: "sensor.gnd",
    to: "bb.neg28",
    role: "ground",
    medium: "leg",
  },

  {
    id: "tsd.c.servo.power",
    from: "servo.power",
    to: "bb.pos28",
    role: "power",
    medium: "leg",
  },
  {
    id: "tsd.c.servo.ground",
    from: "servo.ground",
    to: "bb.neg26",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tsd.c.servo.signal",
    from: "servo.signal",
    to: "board.D9",
    role: "signalAlt",
    label: "D9",
    medium: "leg",
  },

  {
    id: "tsd.c.led.cathode",
    from: "led.soap.cathode",
    to: "bb.f8",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tsd.c.led.anode",
    from: "led.soap.anode",
    to: "bb.f9",
    role: "signal",
    medium: "leg",
  },
  {
    id: "tsd.c.res.in",
    from: "res.soap.in",
    to: "bb.j8",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tsd.c.res.out",
    /* Six columns left of the lead in `bb.j8`: the resistor lies leftward from
       its anchor and its far lead comes out 61.25 units along, so the rail hole
       under it is column two. Any other column bends the leg sideways. */
    from: "res.soap.out",
    to: "bb.neg2",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tsd.c.lamp.row",
    from: "wire.lamp.row",
    to: "bb.h9",
    role: "signal",
    medium: "leg",
  },
  {
    id: "tsd.c.lamp.pin",
    from: "wire.lamp.pin",
    to: "board.D13",
    role: "signal",
    label: "D13",
    medium: "leg",
  },
];

/* --- The vocabulary ------------------------------------------------------- */

export type SoapTerminal =
  | "wire.power.rail"
  | "wire.power.pin"
  | "wire.ground.rail"
  | "wire.ground.pin"
  | "sensor.vcc"
  | "sensor.trig"
  | "sensor.echo"
  | "sensor.gnd"
  | "servo.power"
  | "servo.ground"
  | "servo.signal"
  | "led.soap.cathode"
  | "led.soap.anode"
  | "res.soap.in"
  | "res.soap.out"
  | "wire.lamp.row"
  | "wire.lamp.pin";

/**
 * The parts, in the order the steps ask for them.
 *
 * `sensor.` and `servo.` are the capstone's own stems, deliberately: the three
 * prefix ladders that name a part (`findings.componentOf`, `parts.partOf`,
 * `parts.partNameOf`) have answered for both since Batch 3, and this chapter's
 * ultrasonic sensor and micro servo are the same two objects. A terminal id is
 * unique within a build, so there is nothing to collide with — and the
 * capstone, which has no placement, never asks any of those questions of a
 * lead it owns.
 */
const PARTS = [
  "wirePower",
  "wireGround",
  "sensor",
  "servo",
  "ledSoap",
  "resSoap",
  "wireLamp",
] as const;

type SoapPart = (typeof PARTS)[number];

export const soapTerminals: readonly SoapTerminal[] = [
  "wire.power.rail", "wire.power.pin",
  "wire.ground.rail", "wire.ground.pin",
  "sensor.vcc", "sensor.gnd", "sensor.trig", "sensor.echo",
  "servo.power", "servo.ground", "servo.signal",
  "led.soap.cathode", "led.soap.anode",
  "res.soap.in", "res.soap.out",
  "wire.lamp.row", "wire.lamp.pin",
];

/** The node-id stem each RIGID part owns. Read by the positioning walk. */
const STEM = {
  ledSoap: "led.soap.",
  resSoap: "res.soap.",
} as const satisfies Partial<Record<SoapPart, string>>;

const WIRES = [
  { part: "wirePower", a: "wire.power.rail", b: "wire.power.pin" },
  { part: "wireGround", a: "wire.ground.rail", b: "wire.ground.pin" },
  { part: "wireLamp", a: "wire.lamp.row", b: "wire.lamp.pin" },
] as const satisfies readonly {
  part: SoapPart;
  a: SoapTerminal;
  b: SoapTerminal;
}[];

/**
 * The two modules: a body that stands still, and leads that do not.
 *
 * The servo is the reason this shape exists. Its three leads leave the case on
 * a 9.5 px vertical pitch, so a servo pushed into a breadboard would put all
 * three in one column — one strip of metal, and a short across its own supply.
 * Nobody does that on a desk either.
 */
const MODULES = [
  {
    part: "sensor",
    at: soapSensorAt,
    leads: [
      { terminal: "sensor.vcc", px: sensorPins.vcc },
      { terminal: "sensor.trig", px: sensorPins.trig },
      { terminal: "sensor.echo", px: sensorPins.echo },
      { terminal: "sensor.gnd", px: sensorPins.gnd },
    ],
  },
  {
    part: "servo",
    at: soapServoAt,
    leads: [
      { terminal: "servo.ground", px: servoPins.ground },
      { terminal: "servo.power", px: servoPins.power },
      { terminal: "servo.signal", px: servoPins.signal },
    ],
  },
] as const satisfies readonly {
  part: SoapPart;
  at: Point;
  leads: readonly { terminal: SoapTerminal; px: readonly [number, number] }[];
}[];

/**
 * What the scene prints ON a module's lead node — what the part prints itself.
 *
 * The HC-SR04's silkscreen says `VCC Trig Echo GND` and the servo's leads are a
 * colour code rather than a word, so the servo takes the two characters a badge
 * can hold. A glyph is at most two (`registry.test.ts` checks it), which is why
 * `Trig` and `Echo` become `T` and `E` on the badge and stay whole words in the
 * lead's own sentence.
 */
const MODULE_LABELS: Partial<Record<SoapTerminal, string>> = {
  "sensor.vcc": "+",
  "sensor.trig": "T",
  "sensor.echo": "E",
  "sensor.gnd": "−",
  "servo.power": "+",
  "servo.ground": "−",
  "servo.signal": "S",
};

const soapTopology: PlacementTopology = {
  parts: PARTS,
  terminals: soapTerminals,
  terminalsOf: {
    wirePower: ["wire.power.rail", "wire.power.pin"],
    wireGround: ["wire.ground.rail", "wire.ground.pin"],
    sensor: ["sensor.vcc", "sensor.gnd", "sensor.trig", "sensor.echo"],
    servo: ["servo.power", "servo.ground", "servo.signal"],
    ledSoap: ["led.soap.cathode", "led.soap.anode"],
    resSoap: ["res.soap.in", "res.soap.out"],
    wireLamp: ["wire.lamp.row", "wire.lamp.pin"],
  },
  holes: soapCandidates,
  flexible: ["wirePower", "wireGround", "wireLamp", "sensor", "servo"],
};

export const soapEmpty = {
  "wire.power.rail": null,
  "wire.power.pin": null,
  "wire.ground.rail": null,
  "wire.ground.pin": null,
  "sensor.vcc": null,
  "sensor.trig": null,
  "sensor.echo": null,
  "sensor.gnd": null,
  "servo.power": null,
  "servo.ground": null,
  "servo.signal": null,
  "led.soap.cathode": null,
  "led.soap.anode": null,
  "res.soap.in": null,
  "res.soap.out": null,
  "wire.lamp.row": null,
  "wire.lamp.pin": null,
} satisfies Record<SoapTerminal, NodeId | null> as Placement;

/**
 * Seventeen leads, seventeen holes, and not one lead-to-lead value.
 *
 * Trace the pump: `board.5V` —cable— `bb.pos30`, which is the whole `+` rail,
 * which is `bb.pos28` → the servo's red lead; its brown lead comes back to
 * `bb.neg26` on the `−` rail, which is `bb.neg30` —cable— `board.GND`; and its
 * orange lead goes straight to `board.D9`, which is marked `~`.
 *
 * Trace the measurement and there is no breadboard in it at all: the sensor's
 * `Trig` and `Echo` leads reach `D8` and `D7` on their own wire, which is what
 * a female-to-male jumper is for. Only its supply goes to the rails.
 */
export const soapComplete = {
  "wire.power.rail": "bb.pos30",
  "wire.power.pin": "board.5V",
  "wire.ground.rail": "bb.neg30",
  "wire.ground.pin": "board.GND",
  "sensor.vcc": "bb.pos25",
  "sensor.trig": "board.D8",
  "sensor.echo": "board.D7",
  "sensor.gnd": "bb.neg28",
  "servo.power": "bb.pos28",
  "servo.ground": "bb.neg26",
  "servo.signal": "board.D9",
  "led.soap.cathode": "bb.f8",
  "led.soap.anode": "bb.f9",
  "res.soap.in": "bb.j8",
  "res.soap.out": "bb.neg2",
  "wire.lamp.row": "bb.h9",
  "wire.lamp.pin": "board.D13",
} satisfies Record<SoapTerminal, NodeId | null> as Placement;

/**
 * The horn, at rest and where the sketch wants it — **equal, on purpose**.
 *
 * The capstone opens with these two a quarter turn apart because that is its
 * demo's second fault, and it can: an author put the horn on. Nothing on a
 * bench somebody builds mounts a horn, so a difference here would be a fault
 * with no gesture behind it and no way to fix it. What the run does with them
 * is turn the pump; what `checksMechanical` does with them is assert, on a
 * build that is wired right, that the horn is on straight.
 */
export const soapAtRest: MechanicalState = { servoAngle: 0, expectedAngle: 0 };

/* --- Naming a join -------------------------------------------------------- */

/** `graph.ts` recognises the `.x.` segment; this is chapter five's spelling. */
const EXTRA_PREFIX = "tsd.x.";

function labelFor(target: CircuitNode): string {
  return target.label ?? target.id;
}

/**
 * Leads that are the same thing twice, and stay attached to a body.
 *
 * The resistor's two ends. The three cables are decided per scene instead —
 * see `cable-joins.ts` and chapter three's copy of this note. Neither module's
 * leads are here: an HC-SR04 prints `VCC Trig Echo GND` on its own silkscreen
 * and a servo's three wires are a colour code every servo in the world shares,
 * so all seven are things a person can tell apart and getting one wrong has a
 * consequence.
 */
const SYMMETRIC: readonly (readonly SoapTerminal[])[] = [
  ["res.soap.in", "res.soap.out"],
];

/** Chapter three's groups, and its reasons. */
const NODE_GROUPS: readonly (readonly NodeId[])[] = [
  ...columns.map((col) => ROWS_TOP.map((row) => `bb.${row}${col}`)),
  ...columns.map((col) => ROWS_BOTTOM.map((row) => `bb.${row}${col}`)),
  columns.map((col) => `bb.pos${col}`),
  columns.map((col) => `bb.neg${col}`),
  ["board.GND", "board.GND2", "board.GND3"],
];

/** Whether two holes are the same piece of metal. */
const sameNet = (a: NodeId, b: NodeId) =>
  a === b || NODE_GROUPS.some((g) => g.includes(a) && g.includes(b));

/** The three cables, as the three PAIRS of connections they are meant to make. */
const CABLE_PAIRS: readonly CablePair[] = cablePairs(WIRES, expected);

const matesOf = (terminal: TerminalId): SoapTerminal[] =>
  SYMMETRIC.find((klass) =>
    klass.includes(terminal as SoapTerminal),
  )?.filter((u) => u !== terminal) ?? [];

/** Which net a hole belongs to: the headers, either rail, either bank. */
const familyOf = (id: NodeId) =>
  id.startsWith("board.")
    ? "board"
    : id.startsWith("bb.neg") || id.startsWith("bb.pos")
      ? "rail"
      : "bank";

function fits(want: Connection, named: NodeId, target: NodeId): boolean {
  const otherEnd = want.from === named ? want.to : want.from;
  return soapTopology.holes.includes(otherEnd)
    ? soapTopology.holes.includes(target) &&
        familyOf(target) === familyOf(otherEnd)
    : target === otherEnd;
}

/** Which expected join each cable end is making — decided for all at once. */
function cableJoins(placement: Placement): Map<string, Connection> {
  return assignCables(
    WIRES,
    CABLE_PAIRS,
    (terminal) => attachmentOf(soapTopology, placement, terminal),
    sameNet,
  );
}

function connectionFor(
  terminal: SoapTerminal,
  target: NodeId,
  nodes: Record<NodeId, CircuitNode>,
  placement: Placement,
  cables: Map<string, Connection>,
  claimed: Set<string>,
): Connection {
  const isCableEnd = WIRES.some((w) => w.a === terminal || w.b === terminal);
  let want: Connection | undefined;

  if (isCableEnd) {
    want = cables.get(terminal);
  } else {
    const own = expected.find((c) => c.from === terminal || c.to === terminal);
    want = own && fits(own, terminal, target) ? own : undefined;

    if (!want) {
      for (const mate of matesOf(terminal)) {
        const theirs = expected.find((c) => c.from === mate || c.to === mate);
        if (!theirs || !fits(theirs, mate, target)) continue;
        const mateTarget = attachmentOf(soapTopology, placement, mate);
        if (!mateTarget || !fits(theirs, mate, mateTarget)) {
          want = theirs;
          break;
        }
      }
    }
  }

  if (want && claimed.has(want.id)) want = undefined;

  if (want) {
    claimed.add(want.id);
    return {
      id: want.id,
      from: terminal,
      to: target,
      role: want.role,
      medium: "leg",
      ...(want.label !== undefined ? { label: labelFor(nodes[target]) } : {}),
    };
  }

  return {
    id: `${EXTRA_PREFIX}${terminal}`,
    from: terminal,
    to: target,
    role: "idle",
    medium: "leg",
  };
}

/**
 * What this scene says is the same piece of metal: a resistor's two ends, and
 * the board's own nets. The cable assignment is deliberately not here — see
 * chapter three's copy of this note.
 */
const INTERCHANGEABLE: readonly (readonly NodeId[])[] = [
  ...SYMMETRIC,
  ...NODE_GROUPS,
];

export function soapSceneFrom(
  placement: Placement,
  mechanical: MechanicalState = soapAtRest,
): CircuitScene {
  if (process.env.NODE_ENV !== "production") {
    const stray = Object.keys(placement).filter(
      (key) => !soapTerminals.includes(key as SoapTerminal),
    );
    if (stray.length)
      throw new Error(`soapSceneFrom: not a terminal — ${stray.join(", ")}`);
  }

  const nodes: Record<NodeId, CircuitNode> = { ...nodeGrid };

  /* 1 · POSITION THE RIGID PARTS — the lamp and its resistor. */
  for (const a of anchorsFor(soapTopology, placement)) {
    if (isFlexible(soapTopology, a.part)) continue;

    const anchor = nodes[a.target];
    if (!anchor) continue;

    const stem = STEM[a.part as keyof typeof STEM];
    if (!stem) continue;

    if (stem.startsWith("led.")) {
      const at = ledOriginFrom(
        anchor,
        a.terminal === `${stem}cathode` ? "cathode" : "anode",
        a.intoHole,
      );
      nodes[`${stem}cathode`] = {
        id: `${stem}cathode`,
        kind: "terminal",
        label: "−",
        ...pinAt(at, ledPins.cathode),
      };
      nodes[`${stem}anode`] = {
        id: `${stem}anode`,
        kind: "terminal",
        label: "+",
        ...pinAt(at, ledPins.anode),
      };
    } else {
      const at = resistorOriginFrom(
        anchor,
        a.terminal === `${stem}in` ? "in" : "out",
        a.intoHole,
      );
      nodes[`${stem}in`] = {
        id: `${stem}in`,
        kind: "terminal",
        label: "220Ω",
        ...pinAt(at, resistorPins.right),
      };
      nodes[`${stem}out`] = {
        id: `${stem}out`,
        kind: "terminal",
        label: "220Ω",
        ...pinAt(at, resistorPins.left),
      };
    }
  }

  const seatOf = (id: NodeId | null | undefined) =>
    id ? nodes[id] : undefined;

  /* 2 · EMIT THE CABLE ENDS, straight from the record. */
  for (const w of WIRES) {
    const seats = [
      [w.a, seatOf(placement[w.a]), seatOf(placement[w.b])],
      [w.b, seatOf(placement[w.b]), seatOf(placement[w.a])],
    ] as const;
    for (const [end, own, far] of seats) {
      const at = own ?? (far ? slackFrom(far) : undefined);
      if (!at) continue;
      nodes[end] = { id: end, kind: "terminal", x: at.x, y: at.y };
    }
  }

  /* 3 · EMIT THE MODULE LEADS. Seated, a lead IS its hole; loose, it hangs at
        the point it leaves the case. Nothing at all while the module is still
        in the kit. */
  for (const m of MODULES) {
    if (!m.leads.some((lead) => placement[lead.terminal])) continue;
    for (const lead of m.leads) {
      const seat = seatOf(placement[lead.terminal]);
      const at = seat ?? pinAt(m.at, lead.px);
      nodes[lead.terminal] = {
        id: lead.terminal,
        kind: "terminal",
        label: MODULE_LABELS[lead.terminal],
        x: at.x,
        y: at.y,
      };
    }
  }

  /* 4 · OBSERVE. Exactly the non-null entries, one `Connection` each. */
  const observed: Connection[] = [];
  const claimed = new Set<string>();
  const cables = cableJoins(placement);
  for (const terminal of soapTerminals) {
    const target = placement[terminal];
    if (!target) continue;
    if (!nodes[terminal] || !nodes[target]) continue;
    observed.push(
      connectionFor(terminal, target, nodes, placement, cables, claimed),
    );
  }

  return {
    nodes,
    expected,
    observed,
    mechanical,
    interchangeable: INTERCHANGEABLE,
  };
}

/** The finished build: every lead where the sketch says it belongs. */
export const touchlessSoap: CircuitScene = soapSceneFrom(soapComplete);

/* --- The spec ------------------------------------------------------------- */

/** Chapter two's diagonal half-pitch, for chapter two's reason. */
const GRAB_OFF = PITCH * 0.5;

export const soapGrabPoint = (n: CircuitNode) =>
  n.kind === "terminal"
    ? { x: n.x + GRAB_OFF, y: n.y - GRAB_OFF }
    : { x: n.x, y: n.y };

function freeing(
  placement: Placement,
  terminal: TerminalId,
  hole: NodeId,
): Placement {
  return soapTerminals
    .filter((u) => u !== terminal && placement[u] === hole)
    .reduce((p, blocker) => attach(soapTopology, p, blocker, null), placement);
}

const SOAP_ANCHOR = {
  wirePower: "wire.power.rail",
  wireGround: "wire.ground.rail",
  sensor: "sensor.vcc",
  servo: "servo.power",
  ledSoap: "led.soap.cathode",
  resSoap: "res.soap.in",
  wireLamp: "wire.lamp.row",
} as const satisfies Record<SoapPart, SoapTerminal>;

/** Chapter two's jumper ghost housing point, in the pixels `ART_PINS` uses. */
const JUMPER_HOUSING = [(PITCH * 1.5) / PX, (PITCH * 0.6) / PX] as const;

const ART_PINS: Record<SoapTerminal, readonly [number, number]> = {
  "led.soap.cathode": ledPins.cathode,
  "led.soap.anode": ledPins.anode,
  "res.soap.in": resistorPins.right,
  "res.soap.out": resistorPins.left,
  "sensor.vcc": sensorPins.vcc,
  "sensor.trig": sensorPins.trig,
  "sensor.echo": sensorPins.echo,
  "sensor.gnd": sensorPins.gnd,
  "servo.power": servoPins.power,
  "servo.ground": servoPins.ground,
  "servo.signal": servoPins.signal,
  "wire.power.rail": JUMPER_HOUSING,
  "wire.power.pin": JUMPER_HOUSING,
  "wire.ground.rail": JUMPER_HOUSING,
  "wire.ground.pin": JUMPER_HOUSING,
  "wire.lamp.row": JUMPER_HOUSING,
  "wire.lamp.pin": JUMPER_HOUSING,
};

/** What the part itself prints beside a lead. */
const ART_LABELS: Partial<Record<SoapTerminal, string>> = {
  "led.soap.cathode": "−",
  "led.soap.anode": "+",
  ...MODULE_LABELS,
};

export const soapPlacement: PlacementSpec = {
  ...soapTopology,
  componentOf: {
    sensor: "sensor",
    servo: "servo",
    ledSoap: "led",
    resSoap: "resistor",
    wirePower: "jumper",
    wireGround: "jumper",
    wireLamp: "jumper",
  } satisfies Record<SoapPart, KitId>,
  anchorOf: SOAP_ANCHOR,
  leadGlyph: (terminal) => ART_LABELS[terminal as SoapTerminal],
  anchorMark: (partId) => {
    const terminal = SOAP_ANCHOR[partId as SoapPart];
    return {
      ...pinAt({ x: 0, y: 0 }, ART_PINS[terminal]),
      ...(ART_LABELS[terminal] ? { label: ART_LABELS[terminal] } : {}),
    };
  },
  empty: soapEmpty,
  complete: soapComplete,
  sceneFrom: soapSceneFrom,
  grabPoint: soapGrabPoint,
  sameNet,

  satisfying: (placement, connectionId) => {
    const want = expected.find((c) => c.id === connectionId);
    if (!want) return null;
    if (attachmentOf(soapTopology, placement, want.from) === want.to)
      return null;
    return attach(
      soapTopology,
      freeing(placement, want.from, want.to),
      want.from,
      want.to,
    );
  },

  clearing: (placement, connectionId, edge) => {
    if (!connectionId.startsWith(EXTRA_PREFIX)) return null;
    const terminal = connectionId.slice(EXTRA_PREFIX.length) as TerminalId;
    if (!soapTerminals.includes(terminal as SoapTerminal)) return null;
    if (placement[terminal] !== edge.to && placement[terminal] !== edge.from)
      return null;
    return attach(soapTopology, placement, terminal, null);
  },
};

/* --- Boxes ---------------------------------------------------------------- */

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const boardBox: Box = {
  x: soapBoardAt.x - PITCH,
  y: soapBoardAt.y - PITCH,
  width: boxOf(frame.uno).width + PITCH * 2,
  height: boxOf(frame.uno).height + PITCH * 2,
};

const breadboardBox: Box = {
  x: soapBreadboardAt.x - PITCH,
  y: posRailY - PITCH * 1.5 - PITCH,
  width: part.breadboard.width + PITCH * 2,
  height: negRailY - posRailY + PITCH * 3 + PITCH * 2,
};

const MODULE_BOX: Record<string, Box> = {
  sensor: {
    x: soapSensorAt.x - PITCH,
    y: soapSensorAt.y - PITCH,
    width: boxOf(frame.sensor).width + PITCH * 2,
    height: boxOf(frame.sensor).height + PITCH * 2,
  },
  servo: {
    x: soapServoAt.x - PITCH,
    y: soapServoAt.y - PITCH,
    width: boxOf(frame.servo).width + PITCH * 2,
    height: boxOf(frame.servo).height + PITCH * 2,
  },
};

interface CableEnds {
  a: Point;
  b: Point;
}

/** A box grown to contain some points, with a pitch of air around them. */
function spanning(box: Box, points: readonly Point[]): Box {
  if (!points.length) return box;
  const xs = [
    box.x,
    box.x + box.width,
    ...points.map((n) => n.x - PITCH),
    ...points.map((n) => n.x + PITCH),
  ];
  const ys = [
    box.y,
    box.y + box.height,
    ...points.map((n) => n.y - PITCH),
    ...points.map((n) => n.y + PITCH),
  ];
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Where each part's artwork sits, read back off the scene. */
export function soapArtOrigins(scene: CircuitScene) {
  const originOf = (terminal: SoapTerminal): Point | undefined => {
    const n = maybeNode(scene, terminal);
    if (!n) return undefined;
    const px = ART_PINS[terminal];
    return { x: n.x - px[0] * PX, y: n.y - px[1] * PX };
  };
  const endsOf = (a: SoapTerminal, b: SoapTerminal): CableEnds | undefined => {
    const na = maybeNode(scene, a);
    const nb = maybeNode(scene, b);
    return na && nb
      ? { a: { x: na.x, y: na.y }, b: { x: nb.x, y: nb.y } }
      : undefined;
  };
  const moduleAt = (part: SoapPart): Point | undefined => {
    const m = MODULES.find((entry) => entry.part === part);
    if (!m) return undefined;
    return m.leads.some((lead) => maybeNode(scene, lead.terminal))
      ? (m.at as Point)
      : undefined;
  };

  return {
    board: soapBoardAt as Point,
    breadboard: soapBreadboardAt as Point,
    sensor: moduleAt("sensor"),
    servo: moduleAt("servo"),
    ledSoap: originOf("led.soap.cathode"),
    resSoap: originOf("res.soap.in"),
    wirePower: endsOf("wire.power.rail", "wire.power.pin"),
    wireGround: endsOf("wire.ground.rail", "wire.ground.pin"),
    wireLamp: endsOf("wire.lamp.row", "wire.lamp.pin"),
  };
}

/** W-07 · what a vision result outlines. Only the parts that are on the bench. */
export function soapBoxesFor(scene: CircuitScene): Record<string, Box> {
  const at = soapArtOrigins(scene);
  const boxes: Record<string, Box> = {
    board: boardBox,
    breadboard: breadboardBox,
  };

  for (const m of MODULES) {
    if (!at[m.part]) continue;
    /* The case AND wherever its leads have got to, the way a cable's box is the
       span between its two ends: a box that stopped at the case would frame a
       part whose own wires run off the edge of it. */
    boxes[m.part] = spanning(
      MODULE_BOX[m.part],
      m.leads
        .map((lead) => maybeNode(scene, lead.terminal))
        .filter((n) => n !== undefined),
    );
  }

  if (at.ledSoap) {
    boxes.ledSoap = {
      x: at.ledSoap.x - PITCH,
      y: at.ledSoap.y - PITCH,
      width: boxOf(frame.led).width + PITCH * 2,
      height: boxOf(frame.led).height + PITCH * 2,
    };
  }

  if (at.resSoap) {
    boxes.resSoap = {
      x: at.resSoap.x - PITCH,
      y: at.resSoap.y - PITCH * 1.6,
      width: boxOf(frame.resistor).width + PITCH * 2,
      height: boxOf(frame.resistor).height + PITCH * 3.2,
    };
  }

  for (const id of ["wirePower", "wireGround", "wireLamp"] as const) {
    const ends = at[id];
    if (!ends) continue;
    boxes[id] = {
      x: Math.min(ends.a.x, ends.b.x) - PITCH,
      y: Math.min(ends.a.y, ends.b.y) - PITCH,
      width: Math.abs(ends.a.x - ends.b.x) + PITCH * 2,
      height: Math.abs(ends.a.y - ends.b.y) + PITCH * 2,
    };
  }

  return boxes;
}

/** The finished build's boxes — what a briefing frames, one part at a time. */
export const soapPartBox = soapBoxesFor(touchlessSoap) as {
  board: Box;
  breadboard: Box;
  sensor: Box;
  servo: Box;
  ledSoap: Box;
  resSoap: Box;
  wirePower: Box;
  wireGround: Box;
  wireLamp: Box;
};

/**
 * Which board pin each of the sketch's four lines actually reaches.
 *
 * The two the modules make on their own leads are read straight off the record
 * — a module's lead is not interchangeable with anything, so its own id is the
 * truth. The lamp's runs through a cable, so it is asked of the metal for the
 * reason `cable-joins.ts` gives.
 */
export function soapLines(scene: CircuitScene): {
  trig?: NodeId;
  echo?: NodeId;
  pump?: NodeId;
  lamp?: NodeId;
} {
  const landed = (terminal: SoapTerminal) =>
    scene.observed.find((c) => c.from === terminal)?.to;
  const reaches = (a: NodeId | undefined, b: NodeId) =>
    a !== undefined && sameNet(a, b);
  const across = (hole: NodeId | null | undefined) => {
    if (!hole) return undefined;
    for (const w of WIRES) {
      const a = landed(w.a);
      const b = landed(w.b);
      if (!a || !b) continue;
      if (reaches(a, hole)) return b;
      if (reaches(b, hole)) return a;
    }
    return undefined;
  };
  return {
    trig: landed("sensor.trig"),
    echo: landed("sensor.echo"),
    pump: landed("servo.signal"),
    lamp: across(landed("led.soap.anode")),
  };
}

/**
 * Where each module's leads leave their case, given where the case is.
 *
 * Exported because the drawing needs it and may not keep its own copy: a strand
 * runs from this point to wherever the lead went, and a second table of pin
 * offsets in the scene file is the drift `wokwi.ts` exists to prevent.
 */
export function soapLeadRoot(
  terminal: TerminalId,
  at: { x: number; y: number },
): { x: number; y: number; exit?: "up" | "down" } | undefined {
  const px = ART_PINS[terminal as SoapTerminal];
  const isModule =
    terminal.startsWith("sensor.") || terminal.startsWith("servo.");
  if (!px || !isModule) return undefined;
  /* The HC-SR04's pins are on the bottom edge of its board, so a strand leaves
     it downward. The servo's plug is on its side, and a side has no up or
     down here — its strands take the ordinary rule. */
  return terminal.startsWith("sensor.")
    ? { ...pinAt(at, px), exit: "down" }
    : pinAt(at, px);
}

/**
 * What `fitView` should frame — the extent of every position the model can
 * produce, not of the finished build.
 */
const EDGES = [soapCandidates[0], soapCandidates[soapCandidates.length - 1]] as const;

const edgeProbes = [
  "led.soap.cathode",
  "led.soap.anode",
  "res.soap.in",
  "res.soap.out",
].flatMap((terminal) =>
  EDGES.map((hole) => soapBoxesFor(soapSceneFrom({ ...soapEmpty, [terminal]: hole }))),
);

const probes = [
  soapBoxesFor(
    soapSceneFrom({
      ...soapEmpty,
      "res.soap.in": "bb.j8",
      "led.soap.cathode": "res.soap.out",
    }),
  ),
  soapBoxesFor(
    soapSceneFrom({
      ...soapEmpty,
      "led.soap.cathode": "bb.f8",
      "res.soap.in": "led.soap.anode",
    }),
  ),
  soapBoxesFor(
    soapSceneFrom({
      ...soapEmpty,
      "wire.power.pin": "board.5V",
      "wire.ground.pin": "board.GND",
      "wire.lamp.pin": "board.D13",
    }),
  ),
  soapBoxesFor(
    soapSceneFrom({
      ...soapEmpty,
      "wire.power.rail": "bb.pos30",
      "wire.ground.rail": "bb.neg30",
      "wire.lamp.row": "bb.h9",
    }),
  ),
  /* Each module on the bench at all: its case is a constant, but it only
     EXISTS once a lead is seated — and its box then spans its leads, which on
     this chapter reach the far side of the board. */
  soapBoxesFor(soapSceneFrom({ ...soapEmpty, "sensor.vcc": "bb.pos25" })),
  soapBoxesFor(soapSceneFrom({ ...soapEmpty, "servo.power": "bb.pos28" })),
];

const fitBoxes = [
  ...Object.values(soapPartBox),
  ...probes.flatMap((set) => Object.values(set)),
  ...edgeProbes.flatMap((set) => Object.values(set)),
];
const framed = framing(fitBoxes, PITCH * 4);

/** What `fitView` opens on — the padded extent. See `framing`. */
export const soapFitBox = framed.fit;

/**
 * What the briefing film frames — the same box with its padding clipped to the
 * mat, so the film never shows a strip of bare oak past the bench's edge.
 */
export const soapStageBox = framed.stage;

/** Part numbers, printed on the parts and the same in every language. */
export const soapPartNumbers = {
  board: "Arduino Uno",
  breadboard: "Half-size",
  sensor: "HC-SR04",
  servo: "SG90",
  led: "5 mm LED",
  resistor: "220Ω",
  jumper: "M–M",
} as const;
