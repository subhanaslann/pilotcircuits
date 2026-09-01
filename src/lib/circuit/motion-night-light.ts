import { PITCH, mm, part } from "@/lib/circuit/geometry";
import {
  PX,
  boxOf,
  frame,
  ledPins,
  pin as pinAt,
  pirPins,
  resistorPins,
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
 * Chapter three · The Motion Night Light.
 *
 * ## What is new: a part that reads the room, and a rail that carries power
 *
 * Chapters one and two drive things. This is the first chapter that *listens*:
 * a pin the sketch reads rather than writes, and a lamp whose state is a
 * consequence of what came back. Two facts about the bench follow from that,
 * and they are the whole of what this chapter adds to chapter two's model.
 *
 * **The `+` rail is live.** Nothing before this needed 5 V — chapter two's
 * three lamps are driven straight off the digital header and its `+` rail is
 * drawn and never offered. A sensor has to be powered, so both rails carry a
 * cable from the board now, and both are addressable.
 *
 * **The sensor is a module on flying leads.** Its three pins hang below a case
 * that is 94 x 96 scene units — nine and a half columns wide and most of a
 * bank tall — so a module plugged straight into the board would stand over the
 * rows either side of it and over the rail above them. On a real bench nobody
 * does that either: an HC-SR501 goes on the end of three jumpers and the module
 * itself sits where it can see the room. So `pir` is declared `flexible` — each
 * of its three leads is positioned from its own seat and none of them may be
 * clipped to another part's lead — and its BODY stands at `nightSensorAt`,
 * which is a fact about the desk rather than about the placement.
 *
 * That is the split `docs/bench-parts.md` §12 asks for, in its cheapest form:
 * `flexible` already meant "each end is positioned from its own seat and
 * nothing clips to it", which is exactly true of a module on leads. What it did
 * not have was a body, and a body that never moves needs no model at all — the
 * drawing reads it from here. Chapters four and five use the same shape for the
 * soil probe and for the servo, whose leads fly for the same reason.
 *
 * ## `board.GND` is GND1 again, and there are now three of them
 *
 * The ground cable leaves the digital header, so `board.GND` is **GND1** — the
 * same choice chapters one and two make. But this chapter also reaches the
 * power header for `5V`, and that header prints GND twice more; all three holes
 * are one piece of metal on a real board, so all three are offered and all
 * three are in one `interchangeable` group. A ground cable in `GND3` is a
 * correct circuit and the panel says so.
 *
 * ## The desk is chapter two's desk
 *
 * `nightBreadboardAt` and `nightBoardAt` are chapter two's numbers exactly.
 * Somebody arriving here has just built the traffic light; a bench that had
 * rearranged itself would make them find the board again for no reason. What
 * moved is what is ON it.
 *
 * The one cable that crosses the Uno is `wire.power` — 5 V lives on the power
 * header, which is the board's far edge from the breadboard, so the cable
 * leaves underneath the board and comes up the right-hand side of it. That is
 * what it looks like on a desk, and it is the reason the pin it lands on is at
 * the far right of the rail: it then crosses the digital header between `D10`
 * and `D9`, where nothing in this chapter is plugged in, rather than over `D13`
 * or `D2`, which are the two holes it uses.
 */

/* --- Where the bench is --------------------------------------------------- */

/** Chapter two's, to the unit. See the header. */
export const nightBreadboardAt = { x: 150, y: 175 } as const;
export const nightBoardAt = { x: 300, y: 440 } as const;

/**
 * Where the sensor's case stands — a fact about the desk, not about the build.
 *
 * Above and to the right of the breadboard, in the air over the Uno's right
 * shoulder, so that all three of its leads run DOWN and to the left. That
 * direction is forced: the pins hang off the bottom edge of the case, so a lead
 * running up would be drawn across the module's own face.
 *
 * The height is chosen against the `+` rail rather than by eye — pins at 155.8
 * against a rail at 158.7 makes the power lead a horizontal run of 68 units,
 * and the case then clears the breadboard's plastic by nothing at all, which is
 * exactly how close a module sits to the board it is wired into.
 */
export const nightSensorAt = { x: 480, y: 60 } as const;

/**
 * Every hole on both of the Uno's headers.
 *
 * Chapter one's stated reason, one header wider: three addressable holes would
 * be a placement gesture with two possible answers, and this chapter's lesson —
 * the pin the sketch *reads* is a pin you chose, and it is not the pin the lamp
 * is on — is only a lesson if the wrong pins are reachable. The power header is
 * offered for the same reason: a sensor wired to `3V3` is the mistake this
 * chapter's step three is about, and it has to be makeable.
 *
 * A0–A5 are deliberately absent. They are on this header and they are chapter
 * FOUR's subject; offering them here would put six holes on the bench that no
 * step, no finding and no sentence in this chapter has anything to say about.
 */
const BOARD_PINS: Array<[NodeId, keyof typeof unoPins, string]> = [
  ["board.D13", "D13", "D13"], ["board.D12", "D12", "D12"],
  ["board.D11", "D11", "D11"], ["board.D10", "D10", "D10"],
  ["board.D9", "D9", "D9"],    ["board.D8", "D8", "D8"],
  ["board.D7", "D7", "D7"],    ["board.D6", "D6", "D6"],
  ["board.D5", "D5", "D5"],    ["board.D4", "D4", "D4"],
  ["board.D3", "D3", "D3"],    ["board.D2", "D2", "D2"],
  ["board.D1", "D1", "D1"],    ["board.D0", "D0", "D0"],
  /* GND1 — the digital side, as in chapters one and two. */
  ["board.GND", "GND1", "GND"],
  ["board.IOREF", "IOREF", "IOREF"],
  ["board.RESET", "RESET", "RESET"],
  ["board.3V3", "3V3", "3V3"],
  ["board.5V", "5V", "5V"],
  /* The power header's two, offered under their own ids and grouped with GND1
     below: an Uno prints GND three times and means it. */
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
      ...pinAt(nightBoardAt, unoPins[source]),
    },
  ]),
);

/* --- The breadboard's 360 holes -------------------------------------------
   Chapter two's construction, and its reason: built ONCE at module scope and
   spread into each scene. `builds.ts` builds one scene per (lead x offered
   hole) at every boot — 15 x 382 here — and each one is affordable only
   because it is a single spread of a record that already exists.             */

const ROWS_TOP = ["a", "b", "c", "d", "e"] as const;
const ROWS_BOTTOM = ["f", "g", "h", "i", "j"] as const;

const columns = Array.from(
  { length: part.breadboard.columns },
  (_, i) => i + 1,
);

const bbOriginX = nightBreadboardAt.x + PITCH;
const bbOriginY = nightBreadboardAt.y + PITCH * 2;
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
 * The 382 holes a lead may go into, ordered the way they read on screen.
 *
 * Both banks, both rails and both headers. Chapter two offered one bank and one
 * rail because nothing in it could reach the others; here the sensor's leads
 * come down into the TOP bank while the lamp stands in the bottom one, and the
 * `+` rail is the first live power in the product — so the only region left out
 * is the one nothing can reach, and there isn't one.
 *
 * Sorted by screen x then y, which is the ArrowRight order. The Uno's header
 * counts *down* from left to right, so any other sort sends the arrow keys
 * travelling backwards.
 */
export const nightCandidates: NodeId[] = [
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
 * `const int PIR = 2, LAMP = 13;`. The sensor's line lands on D2 because that
 * is where its cable arrives from the breadboard's right-hand end, and the
 * lamp's on D13 because that is the header pin nearest the column it drives —
 * and because the two have to be far enough apart on the header that the power
 * cable, which crosses the board between them, lands on neither.
 */
export const nightPins = {
  sense: "board.D2",
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

/**
 * The resistor runs LEFTWARD from its anchor: `in` is the drawing's RIGHT pin.
 *
 * Chapter two's inversion, kept for chapter two's reason — the body then sits
 * entirely to the left of the column it stands in, and the lamp's drive cable,
 * which arrives from the header away to the right, never passes over it.
 */
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

/* --- The graph ------------------------------------------------------------
   Fifteen connections, one per lead, and every one `medium: "leg"` — a lead
   standing in a hole is its own metal and is drawn by the part being there,
   exactly as in chapter two. What is drawn as a line is the same two things:
   the resistor's bent leg into the rail, and the three cable and module bodies,
   which are art rather than connections.                                     */

const expected: Connection[] = [
  {
    id: "mnl.c.power.pin",
    from: "wire.power.pin",
    to: "board.5V",
    role: "power",
    label: "5V",
    medium: "leg",
  },
  {
    id: "mnl.c.power.rail",
    from: "wire.power.rail",
    to: "bb.pos30",
    role: "power",
    medium: "leg",
  },
  {
    id: "mnl.c.ground.pin",
    from: "wire.ground.pin",
    to: "board.GND",
    role: "ground",
    label: "GND",
    medium: "leg",
  },
  {
    id: "mnl.c.ground.rail",
    from: "wire.ground.rail",
    to: "bb.neg30",
    role: "ground",
    medium: "leg",
  },

  {
    id: "mnl.c.pir.vcc",
    from: "pir.vcc",
    to: "bb.pos27",
    role: "power",
    medium: "leg",
  },
  {
    id: "mnl.c.pir.out",
    from: "pir.out",
    to: "bb.a29",
    role: "signal",
    medium: "leg",
  },
  {
    id: "mnl.c.pir.gnd",
    from: "pir.gnd",
    to: "bb.neg25",
    role: "ground",
    medium: "leg",
  },
  {
    id: "mnl.c.signal.row",
    from: "wire.signal.row",
    to: "bb.e29",
    role: "signal",
    medium: "leg",
  },
  {
    id: "mnl.c.signal.pin",
    from: "wire.signal.pin",
    to: "board.D2",
    role: "signal",
    label: "D2",
    medium: "leg",
  },

  {
    id: "mnl.c.led.cathode",
    from: "led.night.cathode",
    to: "bb.f9",
    role: "ground",
    medium: "leg",
  },
  {
    id: "mnl.c.led.anode",
    from: "led.night.anode",
    to: "bb.f10",
    role: "signal",
    medium: "leg",
  },
  {
    id: "mnl.c.res.in",
    from: "res.night.in",
    to: "bb.j9",
    role: "ground",
    medium: "leg",
  },
  {
    id: "mnl.c.res.out",
    from: "res.night.out",
    /* Six columns left of the lead in `bb.j9`, which is not a choice: the
       resistor lies leftward from its anchor and its far lead comes out 61.25
       units along, so the rail hole under it is column three. Any other column
       bends the leg sideways across the plastic — chapter two's `bb.neg1`
       under `bb.j7` is the same arithmetic. */
    to: "bb.neg3",
    role: "ground",
    medium: "leg",
  },
  {
    id: "mnl.c.lamp.row",
    from: "wire.lamp.row",
    to: "bb.h10",
    role: "signal",
    medium: "leg",
  },
  {
    id: "mnl.c.lamp.pin",
    from: "wire.lamp.pin",
    to: "board.D13",
    role: "signal",
    label: "D13",
    medium: "leg",
  },
];

/* --- The vocabulary ------------------------------------------------------- */

export type NightTerminal =
  | "wire.power.rail"
  | "wire.power.pin"
  | "wire.ground.rail"
  | "wire.ground.pin"
  | "pir.vcc"
  | "pir.out"
  | "pir.gnd"
  | "wire.signal.row"
  | "wire.signal.pin"
  | "led.night.cathode"
  | "led.night.anode"
  | "res.night.in"
  | "res.night.out"
  | "wire.lamp.row"
  | "wire.lamp.pin";

/**
 * The parts, in the order the steps ask for them.
 *
 * Three dot-separated segments on every terminal, for chapter two's reasons:
 * `componentOf` and `partOf` match on a TRAILING dot (`led.`, `res.`, `wire.`,
 * `pir.`), `touchesStep` scopes a stray with `id.slice(0, id.lastIndexOf("."))`
 * — which gives `wire.power`, `led.night`, `pir` — and the scene view matches
 * part prefixes with `startsWith`, which needs them pairwise non-prefixing.
 *
 * `led.night` and `res.night` rather than chapter one's bare `led` / `res`: the
 * lead NAMES are global (`copy.build.leads` is keyed by terminal id across
 * every chapter), and this chapter's resistor reaches the ground rail where
 * chapter one's reaches a header hole. Sharing the id would mean sharing the
 * sentence, and one of the two would then be wrong.
 */
const PARTS = [
  "wirePower",
  "wireGround",
  "pir",
  "wireSignal",
  "ledNight",
  "resNight",
  "wireLamp",
] as const;

type NightPart = (typeof PARTS)[number];

export const nightTerminals: readonly NightTerminal[] = [
  "wire.power.rail", "wire.power.pin",
  "wire.ground.rail", "wire.ground.pin",
  "pir.vcc", "pir.out", "pir.gnd",
  "wire.signal.row", "wire.signal.pin",
  "led.night.cathode", "led.night.anode",
  "res.night.in", "res.night.out",
  "wire.lamp.row", "wire.lamp.pin",
];

/** The node-id stem each RIGID part owns. Read by the positioning walk. */
const STEM = {
  ledNight: "led.night.",
  resNight: "res.night.",
} as const satisfies Partial<Record<NightPart, string>>;

/**
 * The three cables, each as the pair of ends it is.
 *
 * `a` is the end named first in `terminalsOf`, so the record, the anchor and
 * the drawing all agree about which end of a cable is "the" end.
 */
const WIRES = [
  { part: "wirePower", a: "wire.power.rail", b: "wire.power.pin" },
  { part: "wireGround", a: "wire.ground.rail", b: "wire.ground.pin" },
  { part: "wireSignal", a: "wire.signal.row", b: "wire.signal.pin" },
  { part: "wireLamp", a: "wire.lamp.row", b: "wire.lamp.pin" },
] as const satisfies readonly {
  part: NightPart;
  a: NightTerminal;
  b: NightTerminal;
}[];

/**
 * The modules: a body that stands still, and leads that do not.
 *
 * The other half of `flexible`. A cable has two ends and nothing between them;
 * a module has three leads and a case, and the case is at `at` whether one lead
 * is seated or all three. A lead with no seat of its own hangs at the point it
 * leaves that case, which is where it is on a real one — so there is always
 * something to take hold of and finish with, and it is in the right place.
 */
const MODULES = [
  {
    part: "pir",
    at: nightSensorAt,
    leads: [
      { terminal: "pir.vcc", px: pirPins.vcc },
      { terminal: "pir.out", px: pirPins.out },
      { terminal: "pir.gnd", px: pirPins.gnd },
    ],
  },
] as const satisfies readonly {
  part: NightPart;
  at: Point;
  leads: readonly { terminal: NightTerminal; px: readonly [number, number] }[];
}[];

/**
 * What the scene prints ON a module's lead node.
 *
 * The same three characters, because they are the same fact — but reached
 * through a table of its own rather than through `ART_LABELS`, which is keyed
 * to what the KIT SHELF draws. A cable end has an art label of `undefined` and
 * a node label of `undefined`; the day those two answers differ for something,
 * one table would have to lie.
 */
const MODULE_LABELS: Partial<Record<NightTerminal, string>> = {
  "pir.vcc": "+",
  "pir.out": "D",
  "pir.gnd": "−",
};

const nightTopology: PlacementTopology = {
  parts: PARTS,
  terminals: nightTerminals,
  /* PRIORITY order: the first lead found in a hole anchors the part, and the
     first entry is also `anchorOf`. Reordering a row silently moves a part's
     artwork — or, for a module, decides which lead a drag off the shelf
     commits. */
  terminalsOf: {
    wirePower: ["wire.power.rail", "wire.power.pin"],
    wireGround: ["wire.ground.rail", "wire.ground.pin"],
    pir: ["pir.vcc", "pir.out", "pir.gnd"],
    wireSignal: ["wire.signal.row", "wire.signal.pin"],
    ledNight: ["led.night.cathode", "led.night.anode"],
    resNight: ["res.night.in", "res.night.out"],
    wireLamp: ["wire.lamp.row", "wire.lamp.pin"],
  },
  holes: nightCandidates,
  /* The three cables AND the sensor. `flexible` says two things and both are
     true of a module on leads: each end is positioned from its own seat, and
     nothing may be clipped to it or from it. What it does not say is anything
     about a body — a body that never moves is not part of the placement. */
  flexible: ["wirePower", "wireGround", "wireSignal", "wireLamp", "pir"],
};

export const nightEmpty = {
  "wire.power.rail": null,
  "wire.power.pin": null,
  "wire.ground.rail": null,
  "wire.ground.pin": null,
  "pir.vcc": null,
  "pir.out": null,
  "pir.gnd": null,
  "wire.signal.row": null,
  "wire.signal.pin": null,
  "led.night.cathode": null,
  "led.night.anode": null,
  "res.night.in": null,
  "res.night.out": null,
  "wire.lamp.row": null,
  "wire.lamp.pin": null,
} satisfies Record<NightTerminal, NodeId | null> as Placement;

/**
 * Fifteen leads, fifteen holes, and not one lead-to-lead value.
 *
 * Trace the lamp and the breadboard does the joining, exactly as in chapter
 * two: `board.D13` —cable— column 10 (`bb.h10` is `bb.f10`, the anode) → LED →
 * column 9 (`bb.f9` is `bb.j9`, the resistor's lead) → 220Ω → `bb.neg5`, which
 * is the whole `−` rail, which is `bb.neg30` —cable— `board.GND`.
 *
 * Trace the sensor and the same thing happens the other way round: the module's
 * OUT lead stands in column 29 of the TOP bank, and `bb.e29` — the same column,
 * four rows down — is where the cable to `board.D2` starts. The two banks are
 * separate nets; a lead that crossed the channel would be in the same picture
 * and a different circuit, which is what the top-bank group below says.
 *
 * The double `satisfies … as Placement` is the only spelling check there is:
 * `Placement`'s key type is `string`, so a typo compiles and draws nothing.
 */
export const nightComplete = {
  "wire.power.rail": "bb.pos30",
  "wire.power.pin": "board.5V",
  "wire.ground.rail": "bb.neg30",
  "wire.ground.pin": "board.GND",
  "pir.vcc": "bb.pos27",
  "pir.out": "bb.a29",
  "pir.gnd": "bb.neg25",
  "wire.signal.row": "bb.e29",
  "wire.signal.pin": "board.D2",
  "led.night.cathode": "bb.f9",
  "led.night.anode": "bb.f10",
  "res.night.in": "bb.j9",
  "res.night.out": "bb.neg3",
  "wire.lamp.row": "bb.h10",
  "wire.lamp.pin": "board.D13",
} satisfies Record<NightTerminal, NodeId | null> as Placement;

/** Nothing on this build turns; carried so every build answers the same shape. */
export const nightAtRest: MechanicalState = { servoAngle: 0, expectedAngle: 0 };

/* --- Naming a join -------------------------------------------------------- */

/** `graph.ts` recognises the `.x.` segment; this is chapter three's spelling. */
const EXTRA_PREFIX = "mnl.x.";

/** What a labelled join prints: the hole it reached, never the one it wanted. */
function labelFor(target: CircuitNode): string {
  return target.label ?? target.id;
}

/**
 * Leads that are the same thing twice, **and stay attached to a body**.
 *
 * A 220Ω resistor's two ends are one piece of wire and the model named them
 * `in` and `out` only because a record has to call them something.
 *
 * The four cables are the same claim about four identical objects, and they are
 * deliberately NOT here. A static class of all eight ends is what chapter two
 * carries, and from this chapter on it is a hole rather than a kindness: with
 * every end equivalent to every other, `sameJoin` checks the eight expected
 * seats as a SET and never checks the four pairs, so swapping the two supply
 * cables' rail ends puts 5 V on the `−` rail and verifies as a finished build.
 * `cable-joins.ts` decides which cable is playing which part instead, and
 * `sceneFrom` publishes that decision as a class of its own, per scene.
 *
 * The sensor's three leads are in neither. A module's leads are printed on its
 * case (`+`, `D`, `−`), the person can tell them apart, and putting 5 V into
 * the output is a real mistake with a real consequence.
 */
const SYMMETRIC: readonly (readonly NightTerminal[])[] = [
  ["res.night.in", "res.night.out"],
];

/**
 * The chapter's inherited lesson, plus the one it adds.
 *
 * Chapter two: the five holes down a column are one strip of metal. This
 * chapter has TWO banks in play — the module comes down into the top one and
 * the lamp stands in the bottom one — so each column is two groups, not one,
 * with the centre channel between them. A lead one row over is a match; a lead
 * across the channel is not, and that is a real breadboard's most common
 * silent mistake.
 *
 * The two rails are one group each, and the board's three GND holes are a
 * third: an Uno prints GND three times and means it, so a ground cable in
 * `GND3` is a correct circuit rather than a fault.
 */
const NODE_GROUPS: readonly (readonly NodeId[])[] = [
  ...columns.map((col) => ROWS_TOP.map((row) => `bb.${row}${col}`)),
  ...columns.map((col) => ROWS_BOTTOM.map((row) => `bb.${row}${col}`)),
  columns.map((col) => `bb.pos${col}`),
  columns.map((col) => `bb.neg${col}`),
  ["board.GND", "board.GND2", "board.GND3"],
];

/**
 * What this scene says is the same piece of metal, given what is on the bench.
 *
 * Two static halves — a resistor's two ends, and the board's own nets — plus
 * one that depends on the placement: **which cable is standing in for which**.
 * That last part cannot be static, and the whole of the supply-short hole is
 * what happens when it is: written down once for all eight ends, it says any
 * cable end may satisfy any cable seat, which checks the seats as a set.
 *
 * Emitted only where the assignment is not the identity, so a bench built the
 * obvious way publishes exactly the two static halves.
 */
const interchangeableFor = (
  cables: Map<string, Connection>,
): readonly (readonly NodeId[])[] => [
  ...SYMMETRIC,
  ...NODE_GROUPS,
  ...[...cables]
    .filter(([terminal, want]) => terminal !== want.from)
    .map(([terminal, want]) => [want.from, terminal]),
];

/** Every OTHER end that is the same piece of metal as this one. */
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

const matesOf = (terminal: TerminalId): NightTerminal[] =>
  SYMMETRIC.find((klass) =>
    klass.includes(terminal as NightTerminal),
  )?.filter((u) => u !== terminal) ?? [];

/**
 * Which net a hole belongs to: the headers, either rail, either bank.
 *
 * Both rails answer `"rail"` on purpose, and it is not sloppiness. The family
 * decides only whether a lead may CLAIM the expected id; `sameJoin` then
 * decides whether it is right. One family for both rails means a power lead
 * that went into the `−` rail keeps its own id and is reported once — "it is in
 * −12, it belongs in +30" — instead of as a missing join and a stray for the
 * same gesture. Two families would split the most instructive mistake in the
 * chapter into two findings.
 *
 * The same argument is why both banks answer `"bank"`: a lead across the
 * channel is one finding that names the hole it is in.
 */
const familyOf = (id: NodeId) =>
  id.startsWith("board.")
    ? "board"
    : id.startsWith("bb.neg") || id.startsWith("bb.pos")
      ? "rail"
      : "bank";

/** Chapter two's rule, unchanged. See `traffic-light.ts` for the argument. */
function fits(want: Connection, named: NodeId, target: NodeId): boolean {
  const otherEnd = want.from === named ? want.to : want.from;
  return nightTopology.holes.includes(otherEnd)
    ? nightTopology.holes.includes(target) &&
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
    (terminal) => attachmentOf(nightTopology, placement, terminal),
    sameNet,
  );
}

function connectionFor(
  terminal: NightTerminal,
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
        const mateTarget = attachmentOf(nightTopology, placement, mate);
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

export function nightSceneFrom(
  placement: Placement,
  mechanical: MechanicalState = nightAtRest,
): CircuitScene {
  if (process.env.NODE_ENV !== "production") {
    const stray = Object.keys(placement).filter(
      (key) => !nightTerminals.includes(key as NightTerminal),
    );
    if (stray.length)
      throw new Error(`nightSceneFrom: not a terminal — ${stray.join(", ")}`);
  }

  const nodes: Record<NodeId, CircuitNode> = { ...nodeGrid };

  /* 1 · POSITION THE RIGID PARTS — the lamp and its resistor, and nothing
        else. A cable has no body to hang off an anchor and a module's body does
        not hang off anything at all. */
  for (const a of anchorsFor(nightTopology, placement)) {
    if (isFlexible(nightTopology, a.part)) continue;

    const anchor = nodes[a.target];
    if (!anchor) continue;

    const stem = STEM[a.part as keyof typeof STEM];
    if (!stem) continue;

    /* 2 · EMIT BOTH LEADS, whichever one anchors the part: `nightArtOrigins`
          reads a part's position back off its cathode / its `in` lead, so a
          part that emitted only its anchoring lead would stop being DRAWN the
          moment it was hung off the other one. */
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

  /* 3 · EMIT THE CABLE ENDS, straight from the record. An end that is seated IS
        its hole; the other end of a half-placed cable hangs on its slack. A
        cable end carries no label, because a jumper prints nothing on either
        end and `leadGlyph` says the same. */
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

  /* 4 · EMIT THE MODULE LEADS. Seated, a lead IS its hole; loose, it hangs at
        the point it leaves the case — which needs no slack rule, because a
        module's leads have somewhere real to be. Nothing at all while the whole
        module is still in the kit: a case with three leads reaching nowhere is
        a part on the bench that nobody has put there. */
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

  /* 5 · OBSERVE. Exactly the non-null entries, one `Connection` each. Nothing
        is manufactured: a join exists because a person made it. */
  const observed: Connection[] = [];
  const claimed = new Set<string>();
  const cables = cableJoins(placement);
  for (const terminal of nightTerminals) {
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
    interchangeable: interchangeableFor(cables),
  };
}

/** The finished build: every lead where the sketch says it belongs. */
export const motionNightLight: CircuitScene = nightSceneFrom(nightComplete);

/* --- The spec ------------------------------------------------------------- */

/** Chapter two's diagonal half-pitch, for chapter two's reason. */
const GRAB_OFF = PITCH * 0.5;

export const nightGrabPoint = (n: CircuitNode) =>
  n.kind === "terminal"
    ? { x: n.x + GRAB_OFF, y: n.y - GRAB_OFF }
    : { x: n.x, y: n.y };

/** Pull whatever is in the hole out of it first. Chapter one's helper. */
function freeing(
  placement: Placement,
  terminal: TerminalId,
  hole: NodeId,
): Placement {
  return nightTerminals
    .filter((u) => u !== terminal && placement[u] === hole)
    .reduce((p, blocker) => attach(nightTopology, p, blocker, null), placement);
}

/* What a drag straight off the kit shelf commits. Each is the FIRST entry of
   its part's `terminalsOf` list. */
const NIGHT_ANCHOR = {
  wirePower: "wire.power.rail",
  wireGround: "wire.ground.rail",
  pir: "pir.vcc",
  wireSignal: "wire.signal.row",
  ledNight: "led.night.cathode",
  resNight: "res.night.in",
  wireLamp: "wire.lamp.row",
} as const satisfies Record<NightPart, NightTerminal>;

/** Chapter two's jumper ghost housing point, in the pixels `ART_PINS` uses. */
const JUMPER_HOUSING = [(PITCH * 1.5) / PX, (PITCH * 0.6) / PX] as const;

/** Where each lead comes out of its part's own drawn box, in Wokwi's pixels. */
const ART_PINS: Record<NightTerminal, readonly [number, number]> = {
  "led.night.cathode": ledPins.cathode,
  "led.night.anode": ledPins.anode,
  "res.night.in": resistorPins.right,
  "res.night.out": resistorPins.left,
  "pir.vcc": pirPins.vcc,
  "pir.out": pirPins.out,
  "pir.gnd": pirPins.gnd,
  "wire.power.rail": JUMPER_HOUSING,
  "wire.power.pin": JUMPER_HOUSING,
  "wire.ground.rail": JUMPER_HOUSING,
  "wire.ground.pin": JUMPER_HOUSING,
  "wire.signal.row": JUMPER_HOUSING,
  "wire.signal.pin": JUMPER_HOUSING,
  "wire.lamp.row": JUMPER_HOUSING,
  "wire.lamp.pin": JUMPER_HOUSING,
};

/**
 * What the part itself prints beside a lead.
 *
 * An LED's two legs are a polarity and the part says so. A resistor's are one
 * piece of wire, and so are a jumper's two ends. The sensor prints `+`, `D` and
 * `−` on its own silkscreen, in white, right beside the three pins — so those
 * three characters are the part's, not ours, and they are the reason its leads
 * are not interchangeable.
 */
const ART_LABELS: Partial<Record<NightTerminal, string>> = {
  "led.night.cathode": "−",
  "led.night.anode": "+",
  "pir.vcc": "+",
  "pir.out": "D",
  "pir.gnd": "−",
};

export const nightPlacement: PlacementSpec = {
  ...nightTopology,
  componentOf: {
    /* `sensorMotion` rather than `sensor`: the ladder counts one `sensor` and
       three different chapters sense three different things, so the KIT id is
       the one that says which drawing the shelf hands over. `countedAs` maps it
       back to the `sensor` the card counts. */
    pir: "sensorMotion",
    ledNight: "led",
    resNight: "resistor",
    wirePower: "jumper",
    wireGround: "jumper",
    wireSignal: "jumper",
    wireLamp: "jumper",
  } satisfies Record<NightPart, KitId>,
  anchorOf: NIGHT_ANCHOR,
  leadGlyph: (terminal) => ART_LABELS[terminal as NightTerminal],
  anchorMark: (partId) => {
    const terminal = NIGHT_ANCHOR[partId as NightPart];
    return {
      ...pinAt({ x: 0, y: 0 }, ART_PINS[terminal]),
      ...(ART_LABELS[terminal] ? { label: ART_LABELS[terminal] } : {}),
    };
  },
  empty: nightEmpty,
  complete: nightComplete,
  sceneFrom: nightSceneFrom,
  grabPoint: nightGrabPoint,

  satisfying: (placement, connectionId) => {
    const want = expected.find((c) => c.id === connectionId);
    if (!want) return null;
    if (attachmentOf(nightTopology, placement, want.from) === want.to)
      return null;
    return attach(
      nightTopology,
      freeing(placement, want.from, want.to),
      want.from,
      want.to,
    );
  },

  /** A removal, which `satisfying` cannot express. Demo control only. */
  clearing: (placement, connectionId, edge) => {
    if (!connectionId.startsWith(EXTRA_PREFIX)) return null;
    const terminal = connectionId.slice(EXTRA_PREFIX.length) as TerminalId;
    if (!nightTerminals.includes(terminal as NightTerminal)) return null;
    if (placement[terminal] !== edge.to && placement[terminal] !== edge.from)
      return null;
    return attach(nightTopology, placement, terminal, null);
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
  x: nightBoardAt.x - PITCH,
  y: nightBoardAt.y - PITCH,
  width: boxOf(frame.uno).width + PITCH * 2,
  height: boxOf(frame.uno).height + PITCH * 2,
};

/** The plastic, plus a pitch of air — derived from the rails, as `Breadboard`
 *  draws it from them. */
const breadboardBox: Box = {
  x: nightBreadboardAt.x - PITCH,
  y: posRailY - PITCH * 1.5 - PITCH,
  width: part.breadboard.width + PITCH * 2,
  height: negRailY - posRailY + PITCH * 3 + PITCH * 2,
};

/** The sensor's case, which is where the sensor is. Its leads are elsewhere. */
const sensorBox: Box = {
  x: nightSensorAt.x - PITCH,
  y: nightSensorAt.y - PITCH,
  width: boxOf(frame.pir).width + PITCH * 2,
  height: boxOf(frame.pir).height + PITCH * 2,
};

/** A cable's two ends, which is the whole of where a cable "is". */
interface CableEnds {
  a: Point;
  b: Point;
}

/**
 * Where each part's artwork sits, read back off the scene.
 *
 * The drawing and the vision overlay both need it, and neither may keep its own
 * idea of where a part is. Every lookup is `maybeNode` and never the throwing
 * `node()`: a part still in the kit has no node at all.
 */
export function nightArtOrigins(scene: CircuitScene) {
  const originOf = (terminal: NightTerminal): Point | undefined => {
    const n = maybeNode(scene, terminal);
    if (!n) return undefined;
    const px = ART_PINS[terminal];
    return { x: n.x - px[0] * PX, y: n.y - px[1] * PX };
  };
  const endsOf = (
    a: NightTerminal,
    b: NightTerminal,
  ): CableEnds | undefined => {
    const na = maybeNode(scene, a);
    const nb = maybeNode(scene, b);
    return na && nb
      ? { a: { x: na.x, y: na.y }, b: { x: nb.x, y: nb.y } }
      : undefined;
  };
  /**
   * Where a module's case is, which is a constant — and `undefined` while it is
   * still in the kit.
   *
   * The same shape every other part answers in, deliberately: a drawing asks
   * "where is this part" and gets a point or nothing, and the fact that this
   * particular point never moves is the build's business rather than the
   * drawing's. Presence is read off the leads, because a case with nothing
   * plugged in is a part nobody has taken out of the box.
   */
  const moduleAt = (part: NightPart): Point | undefined => {
    const m = MODULES.find((entry) => entry.part === part);
    if (!m) return undefined;
    return m.leads.some((lead) => maybeNode(scene, lead.terminal))
      ? (m.at as Point)
      : undefined;
  };

  return {
    board: nightBoardAt as Point,
    breadboard: nightBreadboardAt as Point,
    pir: moduleAt("pir"),
    ledNight: originOf("led.night.cathode"),
    resNight: originOf("res.night.in"),
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

/**
 * W-07 · what a vision result outlines. Only the parts that are on the bench.
 *
 * An ABSENT key means "still in the kit", and both the inspection panel and the
 * scene view depend on that.
 */
export function nightBoxesFor(scene: CircuitScene): Record<string, Box> {
  const at = nightArtOrigins(scene);
  const boxes: Record<string, Box> = {
    board: boardBox,
    breadboard: breadboardBox,
  };

  if (at.pir) {
    /* The case AND wherever its leads have got to, the way a cable's box is the
       span between its two ends. A box that stopped at the case would frame a
       picture whose own wires run off the edge of it — which is what the
       briefing's sensor screen did, with the power strand cut in half at the
       frame boundary. */
    boxes.pir = spanning(
      sensorBox,
      MODULES.flatMap((m) =>
        m.leads
          .map((lead) => maybeNode(scene, lead.terminal))
          .filter((n) => n !== undefined),
      ),
    );
  }

  if (at.ledNight) {
    boxes.ledNight = {
      x: at.ledNight.x - PITCH,
      y: at.ledNight.y - PITCH,
      width: boxOf(frame.led).width + PITCH * 2,
      height: boxOf(frame.led).height + PITCH * 2,
    };
  }

  if (at.resNight) {
    /* Chapter one's asymmetric pad: the body is only 11.8 units tall, so a
       symmetrical pitch on the vertical draws a box that reads as a border on
       the part rather than as an annotation about it. */
    boxes.resNight = {
      x: at.resNight.x - PITCH,
      y: at.resNight.y - PITCH * 1.6,
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
export const nightPartBox = nightBoxesFor(motionNightLight) as {
  board: Box;
  breadboard: Box;
  pir: Box;
  ledNight: Box;
  resNight: Box;
  wirePower: Box;
  wireGround: Box;
  wireSignal: Box;
  wireLamp: Box;
};

/**
 * What `fitView` should frame.
 *
 * **A constant, deliberately, even though the parts move** — `fitView`'s memo
 * depends on this box, so one derived from the live placement would frame a
 * different thing before and after each drop. But the extent of every position
 * the model can produce, not of the finished build: chapter one shipped with a
 * box taken from the finished lamp alone and drew a just-placed LED off the top
 * of the canvas.
 *
 * Four probes cover everything reachable. The lamp hung off its resistor's free
 * lead and the resistor hung off the lamp's are the two `STANDOFF` cases; a
 * cable with one end seated puts the other out on its slack, up from the header
 * or down from the plastic. The sensor needs no probe — its case is a constant
 * and its loose leads sit ON that case, so `sensorBox` is already its extent.
 */
const probes = [
  nightBoxesFor(
    nightSceneFrom({
      ...nightEmpty,
      "res.night.in": "bb.j9",
      "led.night.cathode": "res.night.out",
    }),
  ),
  nightBoxesFor(
    nightSceneFrom({
      ...nightEmpty,
      "led.night.cathode": "bb.f9",
      "res.night.in": "led.night.anode",
    }),
  ),
  nightBoxesFor(
    nightSceneFrom({
      ...nightEmpty,
      "wire.power.pin": "board.5V",
      "wire.ground.pin": "board.GND",
      "wire.signal.pin": "board.D2",
      "wire.lamp.pin": "board.D13",
    }),
  ),
  nightBoxesFor(
    nightSceneFrom({
      ...nightEmpty,
      "wire.power.rail": "bb.pos30",
      "wire.ground.rail": "bb.neg30",
      "wire.signal.row": "bb.e29",
      "wire.lamp.row": "bb.h10",
    }),
  ),
  /* And the sensor on the bench at all, which the four above do not put there:
     its box is a constant, but it only EXISTS once a lead is seated. */
  nightBoxesFor(nightSceneFrom({ ...nightEmpty, "pir.vcc": "bb.pos27" })),
];

/**
 * The two extremes of the offered holes, in screen order.
 *
 * `nightCandidates` is sorted by x, so these are the leftmost and rightmost seats
 * anything can be put in. Every rigid lead is probed in both, because a
 * resistor anchored in column one runs 61 units further left than its own hole
 * and an LED hung off its free lead another 16 — neither of which any probe
 * written around the sketch's own columns can reach. Chapter one shipped a fit
 * box taken from the finished build alone and drew a just-placed part off the
 * edge of the canvas; this is that lesson, applied to the axis it did not
 * appear on.
 */
const EDGES = [nightCandidates[0], nightCandidates[nightCandidates.length - 1]] as const;

const edgeProbes = [
  "led.night.cathode",
  "led.night.anode",
  "res.night.in",
  "res.night.out",
].flatMap((terminal) =>
  EDGES.map((hole) =>
    nightBoxesFor(nightSceneFrom({ ...nightEmpty, [terminal]: hole })),
  ),
);

const fitBoxes = [
  ...Object.values(nightPartBox),
  ...probes.flatMap((set) => Object.values(set)),
  ...edgeProbes.flatMap((set) => Object.values(set)),
];
const PAD = PITCH * 4;

export const nightFitBox = {
  x: Math.min(...fitBoxes.map((b) => b.x)) - PAD,
  y: Math.min(...fitBoxes.map((b) => b.y)) - PAD,
  width:
    Math.max(...fitBoxes.map((b) => b.x + b.width)) -
    Math.min(...fitBoxes.map((b) => b.x)) +
    PAD * 2,
  height:
    Math.max(...fitBoxes.map((b) => b.y + b.height)) -
    Math.min(...fitBoxes.map((b) => b.y)) +
    PAD * 2,
} as const;

/**
 * Which board pin each of the sketch's two lines actually reaches.
 *
 * **Asked of the metal, not of the cable's name.** The obvious way to write
 * this is to look up `wire.signal.pin` and read where it went, which is what
 * chapter two does — and it is wrong here for the reason this chapter's own
 * `SYMMETRIC` group states: the four cables are one interchangeable object, so
 * somebody who takes the cable this file calls "the lamp's" and uses it for the
 * sensor has built the right circuit. Read by name, that build fails a check it
 * passes, and the person is told a correct bench is wrong — which is the one
 * thing this product must never do.
 *
 * So it asks the physical question instead: *of the cable that reaches this
 * net, where does the other end land?* Both nets are named by the finished
 * build rather than typed out, and the net test is `NODE_GROUPS`, so a cable
 * one row up the same column answers the same way — which is true of the board
 * and is the whole of what chapter two taught.
 *
 * `undefined` for a line no cable makes yet. Only meaningful on a bench whose
 * wiring is otherwise right, which is why the run puts it in a row of its own
 * behind `wiring`.
 */
export function nightLines(scene: CircuitScene): {
  sense?: NodeId;
  lamp?: NodeId;
} {
  const landed = (terminal: NightTerminal) =>
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
    sense: across(nightComplete["pir.out"]),
    lamp: across(nightComplete["led.night.anode"]),
  };
}

/**
 * Where each of the sensor's leads leaves its case, given where the case is.
 *
 * Exported because the DRAWING needs it and the drawing may not keep its own
 * copy: a strand runs from this point to wherever the lead actually went, and a
 * second table of pin offsets in the scene file is the drift `wokwi.ts` exists
 * to prevent. One fact, read from the same `ART_PINS` the shelf's anchor mark
 * is read from.
 */
export function nightLeadRoot(
  terminal: TerminalId,
  at: { x: number; y: number },
): { x: number; y: number } | undefined {
  const px = ART_PINS[terminal as NightTerminal];
  return px && terminal.startsWith("pir.") ? pinAt(at, px) : undefined;
}

/** Part numbers, printed on the parts and the same in every language. */
export const nightPartNumbers = {
  board: "Arduino Uno",
  breadboard: "Half-size",
  sensor: "HC-SR501",
  led: "5 mm LED",
  resistor: "220Ω",
  jumper: "M–M",
} as const;
