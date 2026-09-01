import { PITCH, framing, mm, part } from "@/lib/circuit/geometry";
import {
  PX,
  boxOf,
  frame,
  ledPins,
  pin as pinAt,
  resistorPins,
  soilPins,
  unoPins,
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
 * Chapter four · The Plant Guardian.
 *
 * ## What is new: a pin that answers with a number
 *
 * Chapter three put a pin the board READS on the bench, and the answer it gave
 * was one of two things. This chapter asks the same pin a harder question and
 * gets back a number between 0 and 1023 — and then the whole build turns on a
 * value the person picks out of that range themselves.
 *
 * Two facts follow, and they are the whole of what this chapter adds.
 *
 * **The analog header is on the board.** `unoPins` has carried `A0`–`A5` since
 * the first chapter and no build has ever turned one into a node: `board.A0`
 * did not exist anywhere in this product. It does now, and all six are offered,
 * because the lesson is *which kind of pin can report a number* and that is
 * only a lesson if the wrong kind is reachable. A probe wired to `D2` is a made
 * join, a green tick from every connection test there is, and a build that can
 * only ever say wet or dry.
 *
 * **The desk is upside down, and that is the reason.** Every chapter so far put
 * the Uno below the breadboard, because everything it needed was on the digital
 * header along the board's top edge. This chapter needs three holes on the
 * OTHER header — `5V`, a `GND` and `A0` — and one on the digital one. So the
 * board turns over: the power header faces the breadboard and the lamp's cable
 * is the single one that crosses it. What turning it over buys is ONE crossing
 * instead of three — not three short cables, which is what this paragraph used
 * to say and is not true of any of them: the supply is 66 units, the signal
 * 165, and the ground 248, that last one running down the breadboard's margin
 * because one rail is at the top of the board and the other is at the bottom.
 * Chapter three made the same trade the other way round, with `5V` as its one
 * crossing.
 *
 * `board.GND` is therefore **GND2**, on the power header — the capstone's
 * choice and the opposite of chapters one, two and three. The address is the
 * same in all five files and the hole is not.
 *
 * ## The probe is a module on flying leads
 *
 * Chapter three's shape, for chapter three's reasons, and one more of its own:
 * this board is 23 x 98 mm, which is 90 x 385 scene units — a stick a third
 * again as long as the Uno. Nothing that size plugs into a breadboard; it
 * stands in a pot with three wires running back to the bench, and that is what
 * `flexible` plus a declared case position draws.
 */

/* --- Where the bench is --------------------------------------------------- */

/**
 * The board on TOP this time. See the header: three of this chapter's four
 * board holes are on the power header, which is the Uno's bottom edge.
 */
export const plantBoardAt = { x: 300, y: 120 } as const;
export const plantBreadboardAt = { x: 150, y: 400 } as const;

/**
 * Where the probe stands — a fact about the desk, not about the build.
 *
 * To the right of everything, with its header level with the `+` rail so the
 * power lead is a horizontal run and the other two fan down from it. Clear of
 * the Uno in x, which it has to be: the board is 385 units long and it hangs
 * straight down through the whole height of the bench.
 */
export const plantProbeAt = { x: 620, y: 377 } as const;

/**
 * Every hole on both of the Uno's headers, and this time that includes A0–A5.
 *
 * Chapter one's stated reason, one chapter further along: a lesson about which
 * pin can report a number is only a lesson if a pin that cannot is reachable.
 * The whole digital header is here for the lamp, the whole power header for the
 * supply, and the six analog holes because they are what this chapter is about.
 */
const BOARD_PINS: Array<[NodeId, keyof typeof unoPins, string]> = [
  ["board.D13", "D13", "D13"], ["board.D12", "D12", "D12"],
  ["board.D11", "D11", "D11"], ["board.D10", "D10", "D10"],
  ["board.D9", "D9", "D9"],    ["board.D8", "D8", "D8"],
  ["board.D7", "D7", "D7"],    ["board.D6", "D6", "D6"],
  ["board.D5", "D5", "D5"],    ["board.D4", "D4", "D4"],
  ["board.D3", "D3", "D3"],    ["board.D2", "D2", "D2"],
  ["board.D1", "D1", "D1"],    ["board.D0", "D0", "D0"],
  ["board.GND1", "GND1", "GND"],
  ["board.IOREF", "IOREF", "IOREF"],
  ["board.RESET", "RESET", "RESET"],
  ["board.3V3", "3V3", "3V3"],
  ["board.5V", "5V", "5V"],
  /* GND2 — the power side, because this chapter's supply leaves from there.
     The digital header's GND1 is offered under its own id and grouped with it
     below: an Uno prints GND three times and means it. */
  ["board.GND", "GND2", "GND"],
  ["board.GND3", "GND3", "GND"],
  ["board.VIN", "VIN", "VIN"],
  ["board.A0", "A0", "A0"], ["board.A1", "A1", "A1"],
  ["board.A2", "A2", "A2"], ["board.A3", "A3", "A3"],
  ["board.A4", "A4", "A4"], ["board.A5", "A5", "A5"],
];

const boardNodes: Record<NodeId, CircuitNode> = Object.fromEntries(
  BOARD_PINS.map(([id, source, label]) => [
    id,
    {
      id,
      kind: "board-pin" as const,
      label,
      ...pinAt(plantBoardAt, unoPins[source]),
    },
  ]),
);

/**
 * The six holes that can answer with a number.
 *
 * Chapter one's `pwmPins` one chapter on, and the same kind of fact: a pin's
 * ability is a property of the board rather than of the sketch, so the run
 * reads it from here instead of keeping a second copy.
 */
export const analogPins: readonly NodeId[] = [
  "board.A0",
  "board.A1",
  "board.A2",
  "board.A3",
  "board.A4",
  "board.A5",
];

/* --- The breadboard's 360 holes ------------------------------------------- */

const ROWS_TOP = ["a", "b", "c", "d", "e"] as const;
const ROWS_BOTTOM = ["f", "g", "h", "i", "j"] as const;

const columns = Array.from(
  { length: part.breadboard.columns },
  (_, i) => i + 1,
);

const bbOriginX = plantBreadboardAt.x + PITCH;
const bbOriginY = plantBreadboardAt.y + PITCH * 2;
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
    col,
    x: columnX(col),
    y: posRailY,
  };
  bbNodes[`bb.neg${col}`] = {
    id: `bb.neg${col}`,
    kind: "breadboard-hole",
    label: `−${col}`,
    row: "-",
    col,
    x: columnX(col),
    y: negRailY,
  };
}

const nodeGrid: Record<NodeId, CircuitNode> = { ...bbNodes, ...boardNodes };

/**
 * The 388 holes a lead may go into, ordered the way they read on screen.
 *
 * Both banks, both rails and both headers — nothing is left out, because
 * nothing here is out of reach. Sorted by screen x then y, which is the
 * ArrowRight order: the Uno's header counts *down* from left to right, so any
 * other sort sends the arrow keys travelling backwards.
 */
export const plantCandidates: NodeId[] = [
  ...ROWS_TOP.flatMap((row) => columns.map((col) => `bb.${row}${col}`)),
  ...ROWS_BOTTOM.flatMap((row) => columns.map((col) => `bb.${row}${col}`)),
  ...columns.map((col) => `bb.pos${col}`),
  ...columns.map((col) => `bb.neg${col}`),
  ...BOARD_PINS.map(([id]) => id),
].sort(
  (a, b) => nodeGrid[a].x - nodeGrid[b].x || nodeGrid[a].y - nodeGrid[b].y,
);

/**
 * The two holes the sketch names, and the sketch's own constants.
 *
 * `const int PROBE = A0, LAMP = 9;`. `A0` because it is the first of the six
 * and the one a beginner's sketch always reaches for. `D9` is NOT the nearest
 * digital pin to the lamp's column and this file used to claim it was: with the
 * board turned over the digital header is its far edge, and `D13` is nearer
 * (421 against 440). `D9` is the pin chapters one and four's lamp has always
 * been on, which is worth more than nineteen units — the fourth time a person
 * builds this lamp, the pin it is driven from should have stopped being a new
 * fact.
 */
export const plantPins = {
  sense: "board.A0",
  lamp: "board.D9",
} as const;

/* --- Where a part sits, given what one of its leads is attached to --------- */

type Point = { x: number; y: number };

/**
 * Chapter one's number, with its SIGN turned over.
 *
 * A part held up by another part's lead stands off it by 14 mm, and chapter one
 * says what the sign is for: it "is the difference between a part standing in
 * the board and a part lying across it" — the part goes the way the board is
 * NOT. Every chapter before this one has the Uno below the breadboard, so away
 * is up and the number is negative. Here the Uno is above, so away is down.
 *
 * Copied unchanged it would have lifted a hung part towards the board it is
 * supposed to be clear of, and it would have done it silently: the gap between
 * the board's bottom edge and the plastic is wide enough that nothing throws.
 */
const STANDOFF = mm(14);

function ledOriginFrom(
  anchor: Point,
  end: "cathode" | "anode",
  intoHole: boolean,
) {
  const drop = intoHole ? 0 : STANDOFF;
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
  const drop = intoHole ? 0 : STANDOFF;
  return {
    x: anchor.x - px[0] * PX,
    y: anchor.y - px[1] * PX + drop,
  };
}

/**
 * Chapter two's slack, turned over with the desk.
 *
 * A cable end seated on the breadboard dangles UP toward the board, and one
 * seated on the header reaches DOWN — the opposite of every chapter before
 * this, because here the Uno is the thing above.
 */
const WIRE_SLACK = { x: PITCH * 2, y: PITCH * 5 } as const;

const slackFrom = (seat: CircuitNode): Point => ({
  x: seat.x + WIRE_SLACK.x,
  y: seat.y + (seat.id.startsWith("bb.") ? -WIRE_SLACK.y : WIRE_SLACK.y),
});

/* --- The graph ------------------------------------------------------------ */

const expected: Connection[] = [
  {
    id: "pg.c.power.pin",
    from: "wire.power.pin",
    to: "board.5V",
    role: "power",
    label: "5V",
    medium: "leg",
  },
  {
    id: "pg.c.power.rail",
    from: "wire.power.rail",
    to: "bb.pos30",
    role: "power",
    medium: "leg",
  },
  {
    id: "pg.c.ground.pin",
    from: "wire.ground.pin",
    to: "board.GND",
    role: "ground",
    label: "GND",
    medium: "leg",
  },
  {
    id: "pg.c.ground.rail",
    from: "wire.ground.rail",
    to: "bb.neg30",
    role: "ground",
    medium: "leg",
  },

  {
    id: "pg.c.probe.vcc",
    from: "soil.vcc",
    to: "bb.pos26",
    role: "power",
    medium: "leg",
  },
  {
    id: "pg.c.probe.aout",
    from: "soil.aout",
    /* Row B, under the cable. See the note on `pg.c.signal.row` below. */
    to: "bb.b28",
    role: "signal",
    medium: "leg",
  },
  {
    id: "pg.c.probe.gnd",
    from: "soil.gnd",
    to: "bb.neg28",
    role: "ground",
    medium: "leg",
  },
  {
    id: "pg.c.signal.row",
    from: "wire.signal.row",
    /* Row A — the cable on top, the probe's lead in B under it.

       Chapter three seats each end in the row nearest the side it comes from:
       the module's lead nearest the module, the cable's end nearest the board.
       Here the board is ABOVE, so the cable's row is the opposite letter — A,
       not the E this chapter inherited when the desk turned over. From E the
       cable is drawn diagonally back across the whole bank, forty units of the
       plastic a person is about to plug things into, passing within two units
       of the empty holes at C29 and B30.

       Which of the two ends gets A is not a coin toss, and looking at it is the
       only way to see why. The probe stands to the RIGHT, so "nearest" says
       nothing about its row — the cable is the end with a side. Seat the cable
       in B and the two wires leave the column on crossing curves and draw an X
       in orange right beside the holes, because a cable rising steeply to `A0`
       and a strand running out flat to the probe start one row apart and swap
       over within thirty units. Seat the cable in A and they never meet: the
       cable climbs away, the probe's strand stays under it the whole way. */
    to: "bb.a28",
    role: "signal",
    medium: "leg",
  },
  {
    id: "pg.c.signal.pin",
    from: "wire.signal.pin",
    to: "board.A0",
    role: "signal",
    label: "A0",
    medium: "leg",
  },

  {
    id: "pg.c.led.cathode",
    from: "led.plant.cathode",
    to: "bb.f9",
    role: "ground",
    medium: "leg",
  },
  {
    id: "pg.c.led.anode",
    from: "led.plant.anode",
    to: "bb.f10",
    role: "signal",
    medium: "leg",
  },
  {
    id: "pg.c.res.in",
    from: "res.plant.in",
    to: "bb.j9",
    role: "ground",
    medium: "leg",
  },
  {
    id: "pg.c.res.out",
    from: "res.plant.out",
    /* Six columns left of the lead in `bb.j9`, which is arithmetic rather than
       a choice: the resistor lies leftward from its anchor and its far lead
       comes out 61.25 units along, so the rail hole under it is column three.
       Any other column bends the leg sideways across the plastic. */
    to: "bb.neg3",
    role: "ground",
    medium: "leg",
  },
  {
    id: "pg.c.lamp.row",
    from: "wire.lamp.row",
    to: "bb.h10",
    role: "signal",
    medium: "leg",
  },
  {
    id: "pg.c.lamp.pin",
    from: "wire.lamp.pin",
    to: "board.D9",
    role: "signal",
    label: "D9",
    medium: "leg",
  },
];

/* --- The vocabulary ------------------------------------------------------- */

export type PlantTerminal =
  | "wire.power.rail"
  | "wire.power.pin"
  | "wire.ground.rail"
  | "wire.ground.pin"
  | "soil.vcc"
  | "soil.aout"
  | "soil.gnd"
  | "wire.signal.row"
  | "wire.signal.pin"
  | "led.plant.cathode"
  | "led.plant.anode"
  | "res.plant.in"
  | "res.plant.out"
  | "wire.lamp.row"
  | "wire.lamp.pin";

/**
 * The parts, in the order the steps ask for them.
 *
 * The four cable ids are chapter three's, verbatim, and that is deliberate: a
 * terminal id is unique within a build and the LEAD NAMES are global, so two
 * chapters whose power cable means exactly the same thing should say it with
 * the same words rather than with two entries that have to be kept identical
 * by hand. The lamp and the resistor take a chapter of their own (`led.plant.`,
 * `res.plant.`) because a *reader* of these two files should never have to work
 * out which chapter a lead belongs to.
 */
const PARTS = [
  "wirePower",
  "wireGround",
  "probe",
  "wireSignal",
  "ledPlant",
  "resPlant",
  "wireLamp",
] as const;

type PlantPart = (typeof PARTS)[number];

export const plantTerminals: readonly PlantTerminal[] = [
  "wire.power.rail", "wire.power.pin",
  "wire.ground.rail", "wire.ground.pin",
  "soil.vcc", "soil.aout", "soil.gnd",
  "wire.signal.row", "wire.signal.pin",
  "led.plant.cathode", "led.plant.anode",
  "res.plant.in", "res.plant.out",
  "wire.lamp.row", "wire.lamp.pin",
];

/** The node-id stem each RIGID part owns. Read by the positioning walk. */
const STEM = {
  ledPlant: "led.plant.",
  resPlant: "res.plant.",
} as const satisfies Partial<Record<PlantPart, string>>;

const WIRES = [
  { part: "wirePower", a: "wire.power.rail", b: "wire.power.pin" },
  { part: "wireGround", a: "wire.ground.rail", b: "wire.ground.pin" },
  { part: "wireSignal", a: "wire.signal.row", b: "wire.signal.pin" },
  { part: "wireLamp", a: "wire.lamp.row", b: "wire.lamp.pin" },
] as const satisfies readonly {
  part: PlantPart;
  a: PlantTerminal;
  b: PlantTerminal;
}[];

/** The modules: a body that stands still, and leads that do not. */
const MODULES = [
  {
    part: "probe",
    at: plantProbeAt,
    leads: [
      { terminal: "soil.vcc", px: soilPins.vcc },
      { terminal: "soil.gnd", px: soilPins.gnd },
      { terminal: "soil.aout", px: soilPins.aout },
    ],
  },
] as const satisfies readonly {
  part: PlantPart;
  at: Point;
  leads: readonly { terminal: PlantTerminal; px: readonly [number, number] }[];
}[];

/**
 * What the scene prints ON a module's lead node — the three names the board
 * itself carries, in white on its silkscreen.
 *
 * `A` rather than `AOUT`: a badge holds two characters (`registry.test.ts`
 * checks it), and the board's own word does not fit on one. The full name is in
 * the lead's own sentence, which is where a word belongs.
 */
const MODULE_LABELS: Partial<Record<PlantTerminal, string>> = {
  "soil.vcc": "+",
  "soil.gnd": "−",
  "soil.aout": "A",
};

const plantTopology: PlacementTopology = {
  parts: PARTS,
  terminals: plantTerminals,
  terminalsOf: {
    wirePower: ["wire.power.rail", "wire.power.pin"],
    wireGround: ["wire.ground.rail", "wire.ground.pin"],
    probe: ["soil.vcc", "soil.gnd", "soil.aout"],
    wireSignal: ["wire.signal.row", "wire.signal.pin"],
    ledPlant: ["led.plant.cathode", "led.plant.anode"],
    resPlant: ["res.plant.in", "res.plant.out"],
    wireLamp: ["wire.lamp.row", "wire.lamp.pin"],
  },
  holes: plantCandidates,
  flexible: ["wirePower", "wireGround", "wireSignal", "wireLamp", "probe"],
};

export const plantEmpty = {
  "wire.power.rail": null,
  "wire.power.pin": null,
  "wire.ground.rail": null,
  "wire.ground.pin": null,
  "soil.vcc": null,
  "soil.aout": null,
  "soil.gnd": null,
  "wire.signal.row": null,
  "wire.signal.pin": null,
  "led.plant.cathode": null,
  "led.plant.anode": null,
  "res.plant.in": null,
  "res.plant.out": null,
  "wire.lamp.row": null,
  "wire.lamp.pin": null,
} satisfies Record<PlantTerminal, NodeId | null> as Placement;

/**
 * Fifteen leads, fifteen holes, and not one lead-to-lead value.
 *
 * Trace the lamp and the breadboard does the joining: `board.D9` —cable—
 * column 10 (`bb.h10` is `bb.f10`, the anode) → LED → column 9 (`bb.f9` is
 * `bb.j9`, the resistor's lead) → 220Ω → `bb.neg3`, which is the whole `−`
 * rail, which is `bb.neg30` —cable— `board.GND`.
 *
 * Trace the probe and the answer runs the other way: its `A` lead stands in
 * column 28 of the top bank, and `bb.e28` — the same column, four rows down —
 * is where the cable to `board.A0` starts. Its `+` and `−` leads reach the two
 * rails, which the two supply cables have made live.
 */
export const plantComplete = {
  "wire.power.rail": "bb.pos30",
  "wire.power.pin": "board.5V",
  "wire.ground.rail": "bb.neg30",
  "wire.ground.pin": "board.GND",
  "soil.vcc": "bb.pos26",
  "soil.aout": "bb.b28",
  "soil.gnd": "bb.neg28",
  "wire.signal.row": "bb.a28",
  "wire.signal.pin": "board.A0",
  "led.plant.cathode": "bb.f9",
  "led.plant.anode": "bb.f10",
  "res.plant.in": "bb.j9",
  "res.plant.out": "bb.neg3",
  "wire.lamp.row": "bb.h10",
  "wire.lamp.pin": "board.D9",
} satisfies Record<PlantTerminal, NodeId | null> as Placement;

/** Nothing on this build turns; carried so every build answers the same shape. */
export const plantAtRest: MechanicalState = { servoAngle: 0, expectedAngle: 0 };

/* --- Naming a join -------------------------------------------------------- */

/** `graph.ts` recognises the `.x.` segment; this is chapter four's spelling. */
const EXTRA_PREFIX = "pg.x.";

function labelFor(target: CircuitNode): string {
  return target.label ?? target.id;
}

/**
 * Leads that are the same thing twice, **and stay attached to a body**.
 *
 * The resistor's two ends are one piece of wire. The four cables are four
 * identical objects and are deliberately NOT here — see chapter three's copy of
 * this note and `cable-joins.ts`: a static class of all eight ends makes
 * `sameJoin` check the eight seats as a set and never check the four pairs,
 * which is how a supply short verifies as a finished build. Which cable is
 * playing which part is decided per scene instead.
 *
 * The probe's three leads are in neither: the board prints `+`, `GND` and
 * `AOUT` beside them, so a person can tell them apart, and putting five volts
 * into the output is a mistake with a consequence.
 */
const SYMMETRIC: readonly (readonly PlantTerminal[])[] = [
  ["res.plant.in", "res.plant.out"],
];

/**
 * Chapter three's groups, and its reasons: a column is one strip of metal, the
 * two banks are separate nets with the channel between them, each rail is one
 * net end to end, and the board's three `GND` holes are a fourth.
 */
const NODE_GROUPS: readonly (readonly NodeId[])[] = [
  ...columns.map((col) => ROWS_TOP.map((row) => `bb.${row}${col}`)),
  ...columns.map((col) => ROWS_BOTTOM.map((row) => `bb.${row}${col}`)),
  columns.map((col) => `bb.pos${col}`),
  columns.map((col) => `bb.neg${col}`),
  ["board.GND", "board.GND1", "board.GND3"],
];

/**
 * What this scene says is the same piece of metal: a resistor's two ends, and
 * the board's own nets. Both static, and deliberately — see chapter three's
 * copy of this note for why the cable assignment is NOT published here.
 */
const INTERCHANGEABLE: readonly (readonly NodeId[])[] = [
  ...SYMMETRIC,
  ...NODE_GROUPS,
];

/**
 * Whether two holes are the same piece of metal — a column, a rail, or the
 * board's three `GND`s.
 *
 * Read by `cableJoinFor` and by the line reading below, so "the same seat" has
 * one definition in this file rather than three.
 */
const sameNet = (a: NodeId, b: NodeId) =>
  a === b || NODE_GROUPS.some((g) => g.includes(a) && g.includes(b));

/**
 * The four cables, as the four PAIRS of connections they are meant to make.
 *
 * Derived from `WIRES` and `expected`, so it cannot come to disagree with
 * either. See `cable-joins.ts` for why a cable's join is decided from both of
 * its seats at once and not from the end's own name.
 */
const CABLE_PAIRS: readonly CablePair[] = cablePairs(WIRES, expected);

const matesOf = (terminal: TerminalId): PlantTerminal[] =>
  SYMMETRIC.find((klass) =>
    klass.includes(terminal as PlantTerminal),
  )?.filter((u) => u !== terminal) ?? [];

/**
 * Which net a hole belongs to: the headers, either rail, either bank.
 *
 * Chapter three's three families, for chapter three's reason — the family
 * decides only whether a lead may CLAIM its expected id, and `sameJoin` then
 * decides whether it is right, so one family per region keeps the most
 * instructive mistakes to one finding each.
 */
const familyOf = (id: NodeId) =>
  id.startsWith("board.")
    ? "board"
    : id.startsWith("bb.neg") || id.startsWith("bb.pos")
      ? "rail"
      : "bank";

function fits(want: Connection, named: NodeId, target: NodeId): boolean {
  const otherEnd = want.from === named ? want.to : want.from;
  return plantTopology.holes.includes(otherEnd)
    ? plantTopology.holes.includes(target) &&
        familyOf(target) === familyOf(otherEnd)
    : target === otherEnd;
}

/**
 * Which expected join each cable end is making, decided for all four cables at
 * once — see `cable-joins.ts`. An end absent from the map is a stray.
 */
function cableJoins(placement: Placement): Map<string, Connection> {
  return assignCables(
    WIRES,
    CABLE_PAIRS,
    (terminal) => attachmentOf(plantTopology, placement, terminal),
    sameNet,
  );
}

function connectionFor(
  terminal: PlantTerminal,
  target: NodeId,
  nodes: Record<NodeId, CircuitNode>,
  placement: Placement,
  /** What the cables were assigned, computed once for the whole scene. */
  cables: Map<string, Connection>,
  /**
   * Ids already taken by an earlier lead in this same scene.
   *
   * `connectionFor` is decidable only if every id is minted once: `diff`'s
   * same-origin fallback takes the first, `applyExpected` rewrites all of them,
   * and `comparedTo`, `isResolved` and `stepParts` all match by id. Two loose
   * ends of one interchangeable class could otherwise both fall back to the
   * same expected connection — reachable mid-build, which is exactly when the
   * panel is talking.
   */
  claimed: Set<string>,
): Connection {
  const isCableEnd = WIRES.some((w) => w.a === terminal || w.b === terminal);
  let want: Connection | undefined;

  if (isCableEnd) {
    /* A cable's join is a fact about its two seats together, and about what
       the other three cables are doing — see `cable-joins.ts`. `fits` and the
       mate loop below are for parts whose ends stay attached to a body. */
    want = cables.get(terminal);
  } else {
    const own = expected.find((c) => c.from === terminal || c.to === terminal);
    want = own && fits(own, terminal, target) ? own : undefined;

    if (!want) {
      for (const mate of matesOf(terminal)) {
        const theirs = expected.find((c) => c.from === mate || c.to === mate);
        if (!theirs || !fits(theirs, mate, target)) continue;
        const mateTarget = attachmentOf(plantTopology, placement, mate);
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

export function plantSceneFrom(
  placement: Placement,
  mechanical: MechanicalState = plantAtRest,
): CircuitScene {
  if (process.env.NODE_ENV !== "production") {
    const stray = Object.keys(placement).filter(
      (key) => !plantTerminals.includes(key as PlantTerminal),
    );
    if (stray.length)
      throw new Error(`plantSceneFrom: not a terminal — ${stray.join(", ")}`);
  }

  const nodes: Record<NodeId, CircuitNode> = { ...nodeGrid };

  /* 1 · POSITION THE RIGID PARTS — the lamp and its resistor, and nothing
        else. A cable has no body to hang off an anchor and a module's body does
        not hang off anything at all. */
  for (const a of anchorsFor(plantTopology, placement)) {
    if (isFlexible(plantTopology, a.part)) continue;

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
        the point it leaves the board. Nothing at all while the whole module is
        still in the kit. */
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
  for (const terminal of plantTerminals) {
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
export const plantGuardian: CircuitScene = plantSceneFrom(plantComplete);

/* --- The spec ------------------------------------------------------------- */

/** Chapter two's diagonal half-pitch, for chapter two's reason. */
const GRAB_OFF = PITCH * 0.5;

export const plantGrabPoint = (n: CircuitNode) =>
  n.kind === "terminal"
    ? { x: n.x + GRAB_OFF, y: n.y - GRAB_OFF }
    : { x: n.x, y: n.y };

function freeing(
  placement: Placement,
  terminal: TerminalId,
  hole: NodeId,
): Placement {
  return plantTerminals
    .filter((u) => u !== terminal && placement[u] === hole)
    .reduce((p, blocker) => attach(plantTopology, p, blocker, null), placement);
}

const PLANT_ANCHOR = {
  wirePower: "wire.power.rail",
  wireGround: "wire.ground.rail",
  probe: "soil.vcc",
  wireSignal: "wire.signal.row",
  ledPlant: "led.plant.cathode",
  resPlant: "res.plant.in",
  wireLamp: "wire.lamp.row",
} as const satisfies Record<PlantPart, PlantTerminal>;

/** Chapter two's jumper ghost housing point, in the pixels `ART_PINS` uses. */
const JUMPER_HOUSING = [(PITCH * 1.5) / PX, (PITCH * 0.6) / PX] as const;

const ART_PINS: Record<PlantTerminal, readonly [number, number]> = {
  "led.plant.cathode": ledPins.cathode,
  "led.plant.anode": ledPins.anode,
  "res.plant.in": resistorPins.right,
  "res.plant.out": resistorPins.left,
  "soil.vcc": soilPins.vcc,
  "soil.gnd": soilPins.gnd,
  "soil.aout": soilPins.aout,
  "wire.power.rail": JUMPER_HOUSING,
  "wire.power.pin": JUMPER_HOUSING,
  "wire.ground.rail": JUMPER_HOUSING,
  "wire.ground.pin": JUMPER_HOUSING,
  "wire.signal.row": JUMPER_HOUSING,
  "wire.signal.pin": JUMPER_HOUSING,
  "wire.lamp.row": JUMPER_HOUSING,
  "wire.lamp.pin": JUMPER_HOUSING,
};

/** What the part itself prints beside a lead. */
const ART_LABELS: Partial<Record<PlantTerminal, string>> = {
  "led.plant.cathode": "−",
  "led.plant.anode": "+",
  "soil.vcc": "+",
  "soil.gnd": "−",
  "soil.aout": "A",
};

export const plantPlacement: PlacementSpec = {
  ...plantTopology,
  componentOf: {
    probe: "sensorMoisture",
    ledPlant: "led",
    resPlant: "resistor",
    wirePower: "jumper",
    wireGround: "jumper",
    wireSignal: "jumper",
    wireLamp: "jumper",
  } satisfies Record<PlantPart, KitId>,
  anchorOf: PLANT_ANCHOR,
  leadGlyph: (terminal) => ART_LABELS[terminal as PlantTerminal],
  anchorMark: (partId) => {
    const terminal = PLANT_ANCHOR[partId as PlantPart];
    return {
      ...pinAt({ x: 0, y: 0 }, ART_PINS[terminal]),
      ...(ART_LABELS[terminal] ? { label: ART_LABELS[terminal] } : {}),
    };
  },
  empty: plantEmpty,
  complete: plantComplete,
  sceneFrom: plantSceneFrom,
  grabPoint: plantGrabPoint,
  sameNet,

  satisfying: (placement, connectionId) => {
    const want = expected.find((c) => c.id === connectionId);
    if (!want) return null;
    if (attachmentOf(plantTopology, placement, want.from) === want.to)
      return null;
    return attach(
      plantTopology,
      freeing(placement, want.from, want.to),
      want.from,
      want.to,
    );
  },

  clearing: (placement, connectionId, edge) => {
    if (!connectionId.startsWith(EXTRA_PREFIX)) return null;
    const terminal = connectionId.slice(EXTRA_PREFIX.length) as TerminalId;
    if (!plantTerminals.includes(terminal as PlantTerminal)) return null;
    if (placement[terminal] !== edge.to && placement[terminal] !== edge.from)
      return null;
    return attach(plantTopology, placement, terminal, null);
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
  x: plantBoardAt.x - PITCH,
  y: plantBoardAt.y - PITCH,
  width: boxOf(frame.uno).width + PITCH * 2,
  height: boxOf(frame.uno).height + PITCH * 2,
};

const breadboardBox: Box = {
  x: plantBreadboardAt.x - PITCH,
  y: posRailY - PITCH * 1.5 - PITCH,
  width: part.breadboard.width + PITCH * 2,
  height: negRailY - posRailY + PITCH * 3 + PITCH * 2,
};

/** The probe's board, which is where the probe is. Its leads are elsewhere. */
const probeBox: Box = {
  x: plantProbeAt.x - PITCH,
  y: plantProbeAt.y - PITCH,
  width: boxOf(frame.soil).width + PITCH * 2,
  height: boxOf(frame.soil).height + PITCH * 2,
};

interface CableEnds {
  a: Point;
  b: Point;
}

/** Where each part's artwork sits, read back off the scene. */
export function plantArtOrigins(scene: CircuitScene) {
  const originOf = (terminal: PlantTerminal): Point | undefined => {
    const n = maybeNode(scene, terminal);
    if (!n) return undefined;
    const px = ART_PINS[terminal];
    return { x: n.x - px[0] * PX, y: n.y - px[1] * PX };
  };
  const endsOf = (
    a: PlantTerminal,
    b: PlantTerminal,
  ): CableEnds | undefined => {
    const na = maybeNode(scene, a);
    const nb = maybeNode(scene, b);
    return na && nb
      ? { a: { x: na.x, y: na.y }, b: { x: nb.x, y: nb.y } }
      : undefined;
  };
  const moduleAt = (part: PlantPart): Point | undefined => {
    const m = MODULES.find((entry) => entry.part === part);
    if (!m) return undefined;
    return m.leads.some((lead) => maybeNode(scene, lead.terminal))
      ? (m.at as Point)
      : undefined;
  };

  return {
    board: plantBoardAt as Point,
    breadboard: plantBreadboardAt as Point,
    probe: moduleAt("probe"),
    ledPlant: originOf("led.plant.cathode"),
    resPlant: originOf("res.plant.in"),
    wirePower: endsOf("wire.power.rail", "wire.power.pin"),
    wireGround: endsOf("wire.ground.rail", "wire.ground.pin"),
    wireSignal: endsOf("wire.signal.row", "wire.signal.pin"),
    wireLamp: endsOf("wire.lamp.row", "wire.lamp.pin"),
  };
}

/** A box grown to contain some points, with a pitch of air around them. */
function spanning(box: Box, points: readonly Point[]): Box {
  if (!points.length) return box;
  const xs = [box.x, box.x + box.width, ...points.map((n) => n.x - PITCH)];
  const ys = [box.y, box.y + box.height, ...points.map((n) => n.y - PITCH)];
  const x2 = [...xs, ...points.map((n) => n.x + PITCH)];
  const y2 = [...ys, ...points.map((n) => n.y + PITCH)];
  const x = Math.min(...x2);
  const y = Math.min(...y2);
  return {
    x,
    y,
    width: Math.max(...x2) - x,
    height: Math.max(...y2) - y,
  };
}

/** W-07 · what a vision result outlines. Only the parts that are on the bench. */
export function plantBoxesFor(scene: CircuitScene): Record<string, Box> {
  const at = plantArtOrigins(scene);
  const boxes: Record<string, Box> = {
    board: boardBox,
    breadboard: breadboardBox,
  };

  if (at.probe) {
    /* The case AND wherever its leads have got to, the way a cable's box is the
       span between its two ends. A box that stopped at the case would frame a
       picture whose own wires run off the edge of it — which is what the
       briefing's sensor screen did, with the power strand cut in half at the
       frame boundary. */
    boxes.probe = spanning(
      probeBox,
      MODULES.flatMap((m) =>
        m.leads
          .map((lead) => maybeNode(scene, lead.terminal))
          .filter((n) => n !== undefined),
      ),
    );
  }

  if (at.ledPlant) {
    boxes.ledPlant = {
      x: at.ledPlant.x - PITCH,
      y: at.ledPlant.y - PITCH,
      width: boxOf(frame.led).width + PITCH * 2,
      height: boxOf(frame.led).height + PITCH * 2,
    };
  }

  if (at.resPlant) {
    boxes.resPlant = {
      x: at.resPlant.x - PITCH,
      y: at.resPlant.y - PITCH * 1.6,
      width: boxOf(frame.resistor).width + PITCH * 2,
      height: boxOf(frame.resistor).height + PITCH * 3.2,
    };
  }

  for (const id of ["wirePower", "wireGround", "wireSignal", "wireLamp"] as const) {
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
export const plantPartBox = plantBoxesFor(plantGuardian) as {
  board: Box;
  breadboard: Box;
  probe: Box;
  ledPlant: Box;
  resPlant: Box;
  wirePower: Box;
  wireGround: Box;
  wireSignal: Box;
  wireLamp: Box;
};

/**
 * Which board pin each of the sketch's two lines actually reaches.
 *
 * Chapter three's reading, and the argument for it is written out in
 * `nightLines`: the four cables are one interchangeable object, so asking
 * *which cable* went where would fail a build that is correct. This asks the
 * metal — of the cable that reaches this net, where does the other end land? —
 * and the nets are named by the finished build rather than typed out.
 */
export function plantLines(scene: CircuitScene): {
  sense?: NodeId;
  lamp?: NodeId;
} {
  const landed = (terminal: PlantTerminal) =>
    scene.observed.find((c) => c.from === terminal)?.to;
  const reaches = (a: NodeId | undefined, b: NodeId) =>
    a !== undefined && sameNet(a, b);
  const across = (hole: NodeId | null) => {
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
    sense: across(plantComplete["soil.aout"]),
    lamp: across(plantComplete["led.plant.anode"]),
  };
}

/**
 * What `fitView` should frame — the extent of every position the model can
 * produce, not of the finished build.
 */
const probes = [
  plantBoxesFor(
    plantSceneFrom({
      ...plantEmpty,
      "res.plant.in": "bb.j9",
      "led.plant.cathode": "res.plant.out",
    }),
  ),
  plantBoxesFor(
    plantSceneFrom({
      ...plantEmpty,
      "led.plant.cathode": "bb.f9",
      "res.plant.in": "led.plant.anode",
    }),
  ),
  plantBoxesFor(
    plantSceneFrom({
      ...plantEmpty,
      "wire.power.pin": "board.5V",
      "wire.ground.pin": "board.GND",
      "wire.signal.pin": "board.A0",
      "wire.lamp.pin": "board.D9",
    }),
  ),
  plantBoxesFor(
    plantSceneFrom({
      ...plantEmpty,
      "wire.power.rail": "bb.pos30",
      "wire.ground.rail": "bb.neg30",
      "wire.signal.row": "bb.e28",
      "wire.lamp.row": "bb.h10",
    }),
  ),
  /* And the probe on the bench at all: its box is a constant, but it only
     EXISTS once a lead is seated. */
  plantBoxesFor(plantSceneFrom({ ...plantEmpty, "soil.vcc": "bb.pos26" })),
];

/**
 * The two extremes of the offered holes, in screen order.
 *
 * `plantCandidates` is sorted by x, so these are the leftmost and rightmost seats
 * anything can be put in. Every rigid lead is probed in both, because a
 * resistor anchored in column one runs 61 units further left than its own hole
 * and an LED hung off its free lead another 16 — neither of which any probe
 * written around the sketch's own columns can reach. Chapter one shipped a fit
 * box taken from the finished build alone and drew a just-placed part off the
 * edge of the canvas; this is that lesson, applied to the axis it did not
 * appear on.
 */
const EDGES = [plantCandidates[0], plantCandidates[plantCandidates.length - 1]] as const;

const edgeProbes = [
  "led.plant.cathode",
  "led.plant.anode",
  "res.plant.in",
  "res.plant.out",
].flatMap((terminal) =>
  EDGES.map((hole) =>
    plantBoxesFor(plantSceneFrom({ ...plantEmpty, [terminal]: hole })),
  ),
);

const fitBoxes = [
  ...Object.values(plantPartBox),
  ...probes.flatMap((set) => Object.values(set)),
  ...edgeProbes.flatMap((set) => Object.values(set)),
];
const framed = framing(fitBoxes, PITCH * 4);

/** What `fitView` opens on — the padded extent. See `framing`. */
export const plantFitBox = framed.fit;

/**
 * What the briefing film frames — the same box with its padding clipped to the
 * mat, so the film never shows a strip of bare oak past the bench's edge.
 */
export const plantStageBox = framed.stage;

/**
 * Where each of the probe's leads leaves its board, given where the board is.
 *
 * Exported because the drawing needs it and may not keep its own copy: a strand
 * runs from this point to wherever the lead went, and a second table of pin
 * offsets in the scene file is the drift `wokwi.ts` exists to prevent.
 */
export function plantLeadRoot(
  terminal: TerminalId,
  at: { x: number; y: number },
): { x: number; y: number } | undefined {
  const px = ART_PINS[terminal as PlantTerminal];
  return px && terminal.startsWith("soil.") ? pinAt(at, px) : undefined;
}

/** Part numbers, printed on the parts and the same in every language. */
export const plantPartNumbers = {
  board: "Arduino Uno",
  breadboard: "Half-size",
  sensor: "Capacitive v1.2",
  led: "5 mm LED",
  resistor: "220Ω",
  jumper: "M–M",
} as const;
