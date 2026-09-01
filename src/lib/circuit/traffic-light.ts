import { PITCH, framing, mm, part } from "@/lib/circuit/geometry";
import {
  PX,
  boxOf,
  frame,
  ledPins,
  pin as pinAt,
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
 * Chapter two · The Traffic Light.
 *
 * ## The breadboard is the join
 *
 * Chapter one joined two parts by clipping their legs together on the board's
 * own header. Chapter two never does that: every lead goes into a hole, and two
 * leads are joined because they stand in the same column. `lightComplete`
 * therefore holds no lead-to-lead value at all — twenty leads, twenty holes,
 * twenty connections, one each.
 *
 * The breadboard is not scenery in this chapter, it *is* the join, and that
 * claim is written into the model rather than into prose: `NODE_GROUPS` says
 * the five holes down a column are one piece of metal, so the LED's short leg
 * in `F7` and the resistor's lead in `J7` are already connected and the panel
 * says so. A lead in the wrong ROW of the right column is not a fault here.
 * A lead one COLUMN over is.
 *
 * ## The four cables are parts
 *
 * Nothing a component owns spans the desk: a 220Ω resistor's leads are 61.25
 * scene units apart and an LED's are 10.42, against 32.4 units of desk between
 * the breadboard's bottom edge and the Uno's top, plus the 60 units of board
 * that stand between that edge and the digital header. So the four crossings —
 * three drive lines and one ground — are jumper cables, and a cable a person
 * has to pick up is a *part* rather than furniture. They are the first thing in
 * this product somebody places that the ladder does not count (`KitId`), and
 * they are the reason `PlacementTopology.flexible` exists: a cable has no rigid
 * body, so each of its ends is positioned from its own seat and neither may be
 * clipped onto a leg.
 *
 * There are only four because each resistor reaches the ground rail on its own
 * bent leg — it lies flat in row j and its hole is the `−` rail 87.6 units
 * (22.25 mm) below, which is an untrimmed 1/4 W lead and is exactly what it is.
 * A return cable per lamp would be three more parts and six more leads for a
 * picture that says less.
 *
 * ## `board.GND` is GND1, and that is the trap
 *
 * An Uno prints GND three times, and `unoPins` names them `GND1` (beside AREF,
 * on the digital header) and `GND2`/`GND3` (on the power header). This
 * chapter's ground cable leaves the digital side, so `board.GND` is **GND1** —
 * the same choice chapter one makes and the opposite of chapter six's, which
 * maps the identical id to `GND2` because its wiring leaves from the power
 * header. The address is the same in all three files and the hole is not, so
 * anybody copying a `BOARD_PINS` block between chapters has to re-decide this
 * one line rather than inherit it.
 */

/* --- Where the bench is ---------------------------------------------------
   Declared here, the way chapter one declares `lampBoardAt`, and NOT read from
   `layout`: `layout.breadboard` and `layout.board` are the capstone's desk and
   moving either of them would move a chapter it has nothing to do with.

   The breadboard sits ABOVE the Uno and the digital header (`unoPins` puts
   D0–D13 at py 9, the board's top edge) faces up at it. Stacked rather than
   side by side because the canvas region is wider than it is tall while this
   build is taller than it is wide: side by side the padded box is ~736 x 292
   and fits a 668 x 600 region at 0.91, stacked it is ~536 x 595 and fits at
   1.01. Stacking spends the width, which is the cheap axis.                  */

export const lightBreadboardAt = { x: 150, y: 175 } as const;
export const lightBoardAt = { x: 300, y: 440 } as const;

/**
 * Every hole in the Uno's digital header, for chapter one's stated reason
 * (`breathing-lamp.ts`): three addressable holes would be a placement gesture
 * with two possible answers — a toggle in a placement's clothing — and this
 * chapter's lesson is that the drive line for each lamp is a pin you chose.
 * That is only a lesson if the wrong pins are reachable.
 */
const BOARD_PINS: Array<[NodeId, keyof typeof unoPins, string]> = [
  ["board.D13", "D13", "D13"], ["board.D12", "D12", "D12"],
  ["board.D11", "D11", "D11"], ["board.D10", "D10", "D10"],
  ["board.D9", "D9", "D9"],    ["board.D8", "D8", "D8"],
  ["board.D7", "D7", "D7"],    ["board.D6", "D6", "D6"],
  ["board.D5", "D5", "D5"],    ["board.D4", "D4", "D4"],
  ["board.D3", "D3", "D3"],    ["board.D2", "D2", "D2"],
  ["board.D1", "D1", "D1"],    ["board.D0", "D0", "D0"],
  /* GND1 — see the header. Not GND2, which is what chapter six's identical id
     resolves to. */
  ["board.GND", "GND1", "GND"],
];

const boardNodes: Record<NodeId, CircuitNode> = Object.fromEntries(
  BOARD_PINS.map(([id, source, label]) => [
    id,
    {
      id,
      kind: "board-pin" as const,
      label,
      ...pinAt(lightBoardAt, unoPins[source]),
    },
  ]),
);

/* --- The breadboard's 360 holes -------------------------------------------
   All of them, emitted unconditionally and ONCE. `builds.ts` builds one scene
   per (lead x offered hole) at every `next dev` boot and every vitest import —
   3,900 of them for this chapter against chapter one's 60 — and each one is
   affordable only because it is a single spread of a record that already
   exists. Move this construction inside `lightSceneFrom` and the cost goes up
   by two orders of magnitude, silently, on the dev server.                   */

const ROWS_TOP = ["a", "b", "c", "d", "e"] as const;
const ROWS_BOTTOM = ["f", "g", "h", "i", "j"] as const;

const columns = Array.from(
  { length: part.breadboard.columns },
  (_, i) => i + 1,
);

const bbOriginX = lightBreadboardAt.x + PITCH;
const bbOriginY = lightBreadboardAt.y + PITCH * 2;
const columnX = (col: number) => bbOriginX + (col - 1) * PITCH;

const bbNodes: Record<NodeId, CircuitNode> = {};

const addBank = (rows: readonly string[], firstRowY: number) => {
  rows.forEach((row, r) => {
    for (const col of columns) {
      const id = `bb.${row}${col}`;
      bbNodes[id] = {
        id,
        kind: "breadboard-hole",
        /**
         * New in this chapter, and not decoration. Chapter six's holes carry no
         * label, so every reader — the correction callout, the step checklist,
         * the findings' `affected()` — falls back to the raw id. On the one
         * chapter whose corrections are all about holes, `bb.f7` printed where
         * the silkscreen belongs is a graph id leaking into a sentence, and an
         * arrow drawn from one blank to another is not a correction at all.
         */
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
/* The bottom bank starts five rows down plus the centre channel, so a hole's y
   is the plastic's own geometry rather than a number measured off a
   screenshot. */
addBank(ROWS_BOTTOM, bbOriginY + 5 * PITCH + part.breadboard.channel);

/** Row A down to row J: ten rows with the channel between them. */
const BANK_TOP = bbOriginY;
const BANK_BOTTOM = bbOriginY + 9 * PITCH + part.breadboard.channel;

/**
 * How far outside the bank block each rail sits.
 *
 * Chapter six puts its rails half a pitch outside `at.y` and `at.y + height`,
 * which places the whole hole grid in the top half of a 54 mm board and leaves
 * nine pitches of blank plastic under row J — with the ground rail floating at
 * the very edge, and every resistor reaching it down an 87-unit leg. On a
 * chapter about the board itself that is the first thing anybody sees.
 *
 * So this chapter centres the ten bank rows in the board instead, the way a
 * real half-size one is laid out, and derives the rails from that: the board is
 * still exactly `part.breadboard.height` tall, because `Breadboard` draws
 * fifteen units of plastic outside each rail. 36.3 units puts the rail a little
 * over 9 mm from row A, which is a real board's rail row plus its gap.
 *
 * Chapter six is untouched — it keeps its own expression, and its pin snapshot
 * says so.
 */
const RAIL_OFFSET =
  (part.breadboard.height - PITCH * 3 - (BANK_BOTTOM - BANK_TOP)) / 2;

const posRailY = BANK_TOP - RAIL_OFFSET;
const negRailY = BANK_BOTTOM + RAIL_OFFSET;

for (const col of columns) {
  /* `row` is exactly `"+"` and `"-"`: `Breadboard` splits rails from banks on
     that literal, and a rail hole spelled `"pos"` typechecks and then draws as
     a bank square in the middle of the plastic. The LABEL uses U+2212 rather
     than a hyphen, because it is printed beside the rail and read out loud. */
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

/**
 * Every node this build ever draws, built once.
 *
 * Spread into each scene rather than rebuilt, and never written to after this
 * line — the mutable module-level record chapter six keeps is exactly the thing
 * that makes its coordinates impossible to move.
 */
const nodeGrid: Record<NodeId, CircuitNode> = { ...bbNodes, ...boardNodes };

/**
 * The 195 holes a lead may go into, ordered the way they read on screen.
 *
 * The whole bottom bank, the whole ground rail, and the whole digital header —
 * which is where every meaningful mistake in this chapter lives: the wrong
 * column, the wrong rail hole, the drive cable one pin over.
 *
 * NOT the top bank (rows a–e), because the LED bodies stand over it and nothing
 * in this build reaches it, and NOT `bb.pos*`, because nothing here is powered.
 * Offering all 375 would be 7,500 boot scenes and 375 picker stops for two
 * regions no step ever names.
 *
 * Sorted by screen x then y for chapter one's reason: this array is the
 * ArrowRight order, and the Uno's header counts *down* from left to right, so
 * anything but a positional sort sends the arrow keys travelling backwards.
 * `live-workbench.tsx` re-sorts its targets by `grabPoint`; keeping this list
 * in the same order is what stops Home/End and the arrow keys disagreeing.
 */
export const lightCandidates: NodeId[] = [
  ...ROWS_BOTTOM.flatMap((row) => columns.map((col) => `bb.${row}${col}`)),
  ...columns.map((col) => `bb.neg${col}`),
  ...BOARD_PINS.map(([id]) => id),
].sort(
  (a, b) => nodeGrid[a].x - nodeGrid[b].x || nodeGrid[a].y - nodeGrid[b].y,
);

/**
 * The three holes the sketch writes to, and the sketch's own constants.
 *
 * Forced by the drawing rather than chosen: the signal columns are at x 230,
 * 340 and 430 (increasing) and the three header pins nearest the breadboard are
 * D13 (430.21), D12 (440.10), D11 (450) (increasing), so red→D13, amber→D12,
 * green→D11 is the only assignment whose four cables do not cross each other.
 * The sketch therefore counts down — `const int RED = 13, AMBER = 12,
 * GREEN = 11;` — and the run spec reads its pass condition from here.
 */
export const lightDrivePins = {
  red: "board.D13",
  yellow: "board.D12",
  green: "board.D11",
} as const;

/* --- Where a part sits, given what one of its leads is attached to --------- */

/** Anything with scene coordinates: a hole, or another part's lead. */
type Point = { x: number; y: number };

/**
 * A part held up by another part's lead stands OFF it by 14 mm, upwards.
 *
 * Chapter one's number and chapter one's reason: the join has to be a visible
 * 55-unit cable rather than two points on top of each other, and the sign is
 * the difference between a part standing in the board and a part lying across
 * it. What chapter two does NOT inherit is chapter one's *unconditional* rise
 * and its `RESISTOR_OVERHANG`. Both were tuned for the 47.5 px between GND1 and
 * D9 on one shared header row; here a part lies flat in a row of its own, on
 * plastic, where its body belongs.
 *
 * The `!intoHole` branches stay anyway, and must. `candidatesFor` still offers
 * a free LED or resistor lead as a target for another rigid part's lead and
 * `tryAttach` still accepts it — a reachable, legal state that keeps
 * `EXTRA_PREFIX` and `clearing` alive — and without a defined origin for it,
 * `builds.ts` finds a NaN and throws at boot on a pair nobody would ever make.
 */
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
 * The resistor runs LEFTWARD from its anchor, which is why `in` is the drawing's
 * RIGHT pin and `out` is its LEFT one.
 *
 * That inversion looks like a typo and it is the whole reason the picture works:
 * anchored at `bb.j{C}` with the body to the left, the resistor sits entirely to
 * the left of its group's signal column, and every drive cable arrives from the
 * right — every header pin is right of every breadboard column this build uses.
 * Turn the table round and three cables pass over three resistor bodies.
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

/**
 * Where the loose end of a half-placed cable hangs.
 *
 * Not decoration and not a default position: a lead with no node is filtered
 * straight out of the workbench's targets and gets no handle, which is a cable
 * you can start and cannot finish. Two pitches across and five along, toward
 * the other board — a cable seated on the breadboard dangles down to where the
 * Uno is, one seated on the header reaches up.
 */
const WIRE_SLACK = { x: PITCH * 2, y: PITCH * 5 } as const;

const slackFrom = (seat: CircuitNode): Point => ({
  x: seat.x + WIRE_SLACK.x,
  y: seat.y + (seat.id.startsWith("bb.") ? WIRE_SLACK.y : -WIRE_SLACK.y),
});

/* --- The graph ------------------------------------------------------------
   Twenty connections, one per lead, and EVERY ONE `medium: "leg"`. A wire end
   standing in a hole is the cable's own metal, exactly as an LED's leg in a
   hole is, and both are zero-length — `standsInTheBoard` draws nothing for
   them, which is right: a leg in a hole is not a wire.

   Two consequences of that, stated here so nobody "fixes" them:

     (a) `stepParts.jumpers` counts `medium !== "leg"` and is therefore 0 for
         every step in this chapter. Correct — the cables are PARTS here and
         appear as kit rows, not as a count of accessories under a step.
     (b) A cable's BODY is not a `Connection`, no more than a resistor's body
         is. It is art, drawn between its two lead nodes by the scene view. The
         only three joins this build ever draws as a line are the three
         resistor rail legs.

   Every terminal appears in exactly ONE entry and every entry has a distinct
   `from`. Both are load-bearing: `connectionFor` is decidable only under the
   first, and `diff`'s same-origin fallback cross-attributes under the second. */

const expected: Connection[] = [
  {
    id: "tl.c.gnd.pin",
    from: "wire.gnd.pin",
    to: "board.GND",
    role: "ground",
    label: "GND",
    medium: "leg",
  },
  {
    id: "tl.c.gnd.rail",
    from: "wire.gnd.rail",
    to: "bb.neg6",
    role: "ground",
    medium: "leg",
  },

  {
    id: "tl.c.red.cathode",
    from: "led.red.cathode",
    to: "bb.f7",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.red.anode",
    from: "led.red.anode",
    to: "bb.f8",
    role: "signal",
    medium: "leg",
  },
  {
    id: "tl.c.red.resin",
    from: "res.red.in",
    to: "bb.j7",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.red.resout",
    from: "res.red.out",
    to: "bb.neg1",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.red.row",
    from: "wire.red.row",
    to: "bb.h8",
    role: "signal",
    medium: "leg",
  },
  {
    id: "tl.c.red.pin",
    from: "wire.red.pin",
    to: "board.D13",
    role: "signal",
    label: "D13",
    medium: "leg",
  },

  {
    id: "tl.c.yellow.cathode",
    from: "led.yellow.cathode",
    to: "bb.f18",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.yellow.anode",
    from: "led.yellow.anode",
    to: "bb.f19",
    role: "signal",
    medium: "leg",
  },
  {
    id: "tl.c.yellow.resin",
    from: "res.yellow.in",
    to: "bb.j18",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.yellow.resout",
    from: "res.yellow.out",
    to: "bb.neg12",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.yellow.row",
    from: "wire.yellow.row",
    to: "bb.h19",
    role: "signal",
    medium: "leg",
  },
  {
    id: "tl.c.yellow.pin",
    from: "wire.yellow.pin",
    to: "board.D12",
    role: "signal",
    label: "D12",
    medium: "leg",
  },

  {
    id: "tl.c.green.cathode",
    from: "led.green.cathode",
    to: "bb.f27",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.green.anode",
    from: "led.green.anode",
    to: "bb.f28",
    role: "signal",
    medium: "leg",
  },
  {
    id: "tl.c.green.resin",
    from: "res.green.in",
    to: "bb.j27",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.green.resout",
    from: "res.green.out",
    to: "bb.neg21",
    role: "ground",
    medium: "leg",
  },
  {
    id: "tl.c.green.row",
    from: "wire.green.row",
    to: "bb.h28",
    role: "signal",
    medium: "leg",
  },
  {
    id: "tl.c.green.pin",
    from: "wire.green.pin",
    to: "board.D11",
    role: "signal",
    label: "D11",
    medium: "leg",
  },
];

/* --- The vocabulary -------------------------------------------------------
   Declared before `lightSceneFrom`, which reads it, and spread into
   `lightPlacement` below, which needs `lightSceneFrom`. One object holding both
   would be a module-init cycle, evaluated as `undefined` at import and
   discovered as a blank canvas.                                              */

export type TrafficTerminal =
  | "wire.gnd.pin"
  | "wire.gnd.rail"
  | "led.red.cathode"
  | "led.red.anode"
  | "res.red.in"
  | "res.red.out"
  | "wire.red.pin"
  | "wire.red.row"
  | "led.yellow.cathode"
  | "led.yellow.anode"
  | "res.yellow.in"
  | "res.yellow.out"
  | "wire.yellow.pin"
  | "wire.yellow.row"
  | "led.green.cathode"
  | "led.green.anode"
  | "res.green.in"
  | "res.green.out"
  | "wire.green.pin"
  | "wire.green.row";

/**
 * The parts, in the order the steps ask for them.
 *
 * Every terminal id is THREE dot-separated segments and each boundary is
 * load-bearing at a real call site: `findings.ts` matches owners on a leading
 * `led.green.` BEFORE a bare `led.`, `componentOf` and `partOf` match on a
 * TRAILING dot (`led.`, `res.`, `wire.`), `touchesStep` scopes a stray with
 * `id.slice(0, id.lastIndexOf("."))` — which gives `led.red`, `res.green`,
 * `wire.gnd`, so a stray belongs to ONE lamp rather than to all three — and the
 * scene view matches part prefixes with `startsWith`, which needs them pairwise
 * non-prefixing. `ledR.anode` would satisfy none of that and the finding it
 * produced would be swallowed in silence.
 */
const PARTS = [
  "wireGnd",
  "ledRed",
  "resRed",
  "wireRed",
  "ledYellow",
  "resYellow",
  "wireYellow",
  "ledGreen",
  "resGreen",
  "wireGreen",
] as const;

type TrafficPart = (typeof PARTS)[number];

export const lightTerminals: readonly TrafficTerminal[] = [
  "wire.gnd.rail", "wire.gnd.pin",
  "led.red.cathode", "led.red.anode", "res.red.in", "res.red.out",
  "wire.red.row", "wire.red.pin",
  "led.yellow.cathode", "led.yellow.anode", "res.yellow.in", "res.yellow.out",
  "wire.yellow.row", "wire.yellow.pin",
  "led.green.cathode", "led.green.anode", "res.green.in", "res.green.out",
  "wire.green.row", "wire.green.pin",
];

/** The node-id stem each part owns. One table, read by the positioning walk. */
const STEM = {
  wireGnd: "wire.gnd.",
  ledRed: "led.red.",
  resRed: "res.red.",
  wireRed: "wire.red.",
  ledYellow: "led.yellow.",
  resYellow: "res.yellow.",
  wireYellow: "wire.yellow.",
  ledGreen: "led.green.",
  resGreen: "res.green.",
  wireGreen: "wire.green.",
} as const satisfies Record<TrafficPart, string>;

/**
 * The four cables, each as the pair of ends it is.
 *
 * `a` is the end named first in `terminalsOf`, so the record, the anchor and
 * the drawing all agree on which end of a cable is "the" end.
 */
const WIRES = [
  { part: "wireGnd", a: "wire.gnd.rail", b: "wire.gnd.pin" },
  { part: "wireRed", a: "wire.red.row", b: "wire.red.pin" },
  { part: "wireYellow", a: "wire.yellow.row", b: "wire.yellow.pin" },
  { part: "wireGreen", a: "wire.green.row", b: "wire.green.pin" },
] as const satisfies readonly {
  part: TrafficPart;
  a: TrafficTerminal;
  b: TrafficTerminal;
}[];

const lightTopology: PlacementTopology = {
  parts: PARTS,
  terminals: lightTerminals,
  /* PRIORITY order, not a list: the first lead found in a hole anchors the
     part, and the first entry is also `anchorOf`, so the lead the origin
     geometry is written for and the lead a drag off the shelf commits are the
     same lead. Reordering any row silently moves that part's artwork. */
  terminalsOf: {
    wireGnd: ["wire.gnd.rail", "wire.gnd.pin"],
    ledRed: ["led.red.cathode", "led.red.anode"],
    resRed: ["res.red.in", "res.red.out"],
    wireRed: ["wire.red.row", "wire.red.pin"],
    ledYellow: ["led.yellow.cathode", "led.yellow.anode"],
    resYellow: ["res.yellow.in", "res.yellow.out"],
    wireYellow: ["wire.yellow.row", "wire.yellow.pin"],
    ledGreen: ["led.green.cathode", "led.green.anode"],
    resGreen: ["res.green.in", "res.green.out"],
    wireGreen: ["wire.green.row", "wire.green.pin"],
  },
  holes: lightCandidates,
  /* The four cables. `tryAttach` refuses `wireEnd` on either side of a
     cable-to-lead gesture because of this line, and `candidatesFor` offers a
     cable end nothing but holes. */
  flexible: ["wireGnd", "wireRed", "wireYellow", "wireGreen"],
};

export const lightEmpty = {
  "wire.gnd.rail": null,
  "wire.gnd.pin": null,
  "led.red.cathode": null,
  "led.red.anode": null,
  "res.red.in": null,
  "res.red.out": null,
  "wire.red.row": null,
  "wire.red.pin": null,
  "led.yellow.cathode": null,
  "led.yellow.anode": null,
  "res.yellow.in": null,
  "res.yellow.out": null,
  "wire.yellow.row": null,
  "wire.yellow.pin": null,
  "led.green.cathode": null,
  "led.green.anode": null,
  "res.green.in": null,
  "res.green.out": null,
  "wire.green.row": null,
  "wire.green.pin": null,
} satisfies Record<TrafficTerminal, NodeId | null> as Placement;

/**
 * Twenty leads, twenty holes, and not one lead-to-lead value.
 *
 * Trace the red lamp and the breadboard does the joining: `board.D13` —cable—
 * column 8 (`bb.h8` is `bb.f8`, the anode) → LED → column 7 (`bb.f7` is
 * `bb.j7`, the resistor's lead) → 220Ω → `bb.neg1`, which is `bb.neg6` —cable—
 * `board.GND`.
 *
 * Twenty distinct holes, so hole exclusivity holds; every one of them is in
 * `lightCandidates`, so every seat in the finished build is a seat the picker
 * offers. And because no join here is lead-to-lead, chapter one's hardest wall
 * — `tryAttach` refusing `leadNotFree` on an already-seated lead — is off the
 * happy path entirely, which is what makes `satisfying` four lines.
 *
 * The double `satisfies … as Placement` is the only spelling check there is:
 * `Placement`'s key type is `string`, so a typo compiles and draws nothing.
 */
export const lightComplete = {
  "wire.gnd.rail": "bb.neg6",
  "wire.gnd.pin": "board.GND",
  "led.red.cathode": "bb.f7",
  "led.red.anode": "bb.f8",
  "res.red.in": "bb.j7",
  "res.red.out": "bb.neg1",
  "wire.red.row": "bb.h8",
  "wire.red.pin": "board.D13",
  "led.yellow.cathode": "bb.f18",
  "led.yellow.anode": "bb.f19",
  "res.yellow.in": "bb.j18",
  "res.yellow.out": "bb.neg12",
  "wire.yellow.row": "bb.h19",
  "wire.yellow.pin": "board.D12",
  "led.green.cathode": "bb.f27",
  "led.green.anode": "bb.f28",
  "res.green.in": "bb.j27",
  "res.green.out": "bb.neg21",
  "wire.green.row": "bb.h28",
  "wire.green.pin": "board.D11",
} satisfies Record<TrafficTerminal, NodeId | null> as Placement;

/**
 * Nothing on this build moves; carried so every build answers the same shape.
 *
 * The two angles must never diverge: `scopeChecksMechanical` is true for scope
 * `"all"`, and a difference here would fabricate a servo finding naming
 * `servo.signal` on a bench that has no servo.
 */
export const lightAtRest: MechanicalState = { servoAngle: 0, expectedAngle: 0 };

/* --- Naming a join --------------------------------------------------------
   Which id a join gets decides whether the agent is talking about the join the
   sketch asks for or about one nobody asked for: `comparedTo`, `isResolved`,
   the success trace and `stepParts` all match on it.                         */

/** `graph.ts` recognises the `.x.` segment; this is chapter two's spelling. */
const EXTRA_PREFIX = "tl.x.";

/**
 * What a labelled join prints — the hole it actually reached, never the hole
 * the sketch wanted.
 *
 * Takes only the target, because in this chapter every label IS the address:
 * `GND`, `D13`, and the hole labels for anything that landed elsewhere. A
 * per-id branch here would print the sketch's intention over the person's
 * mistake, which is the one thing the panel exists not to do.
 */
function labelFor(target: CircuitNode): string {
  return target.label ?? target.id;
}

/**
 * Leads that are the same thing twice, **and stay attached to a body**.
 *
 * A 220Ω resistor has no polarity: its ends are one piece of wire and the model
 * named them `in` and `out` only because a record has to call them something.
 * Chapter one learned the hard way what happens when a convention is treated as
 * a fact — a lamp built with the resistor turned round, an electrically correct
 * circuit that lights up, was reported as four faults.
 *
 * The four M–M jumper cables are the same claim about four identical objects,
 * and they are deliberately NOT here. This chapter shipped with all eight ends
 * in one class, and it was the right claim said the wrong way: `sameJoin`
 * compares one endpoint against one endpoint, so with every end equivalent to
 * every other the eight expected SEATS were checked as a set and the four PAIRS
 * were never checked at all. Measured over the 8! = 40 320 ways of seating eight
 * ends in eight seats, every one of them verified as a finished build — 39 936
 * of them a different circuit, 118 of those passing every functional check, and
 * among them a red jumper running `board.D13` straight to `board.GND`: a digital
 * output shorted to ground, under the words "every check passed".
 *
 * Which cable is standing in for which is decided per placement instead
 * (`cable-joins.ts`), and the scene records that decision by handing each
 * expected connection's id to the lead making it. A moved cable is still
 * correct — nobody can tell four jumpers apart — and a wrong PAIRING is now a
 * finding.
 */
const SYMMETRIC: readonly (readonly TrafficTerminal[])[] = [
  ["res.red.in", "res.red.out"],
  ["res.yellow.in", "res.yellow.out"],
  ["res.green.in", "res.green.out"],
];

/**
 * The chapter's lesson, in the model instead of in prose.
 *
 * The five holes down a column are one strip of metal and the whole `−` rail is
 * another, so a lead in the wrong ROW of the right column is a MATCH and only a
 * lead in the wrong COLUMN is a fault. `sameJoin` tests both endpoints through
 * these in either direction, and `diff`, `extras` and `comparedTo` all route
 * through it — so the LED put in backwards is still two mismatches (its own
 * legs are not interchangeable, and columns 7 and 8 are different groups),
 * which is exactly right.
 *
 * The top bank and the `+` rail are deliberately absent: nothing in this build
 * can reach them, and every group is scanned per (expected x observed) pair.
 */
const NODE_GROUPS: readonly (readonly NodeId[])[] = [
  ...columns.map((col) => ROWS_BOTTOM.map((row) => `bb.${row}${col}`)),
  columns.map((col) => `bb.neg${col}`),
];

const INTERCHANGEABLE: readonly (readonly NodeId[])[] = [
  ...SYMMETRIC,
  ...NODE_GROUPS,
];

/**
 * Whether two holes are the same piece of metal — a column of the lower bank,
 * or the whole `−` rail.
 *
 * Read by the cable assignment and by `lightLines`, so "the same seat" has one
 * definition in this file rather than three.
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

/**
 * Which expected join each cable end is making, decided for all four cables at
 * once — see `cable-joins.ts`. An end absent from the map is a stray.
 */
function cableJoins(placement: Placement): Map<string, Connection> {
  return assignCables(
    WIRES,
    CABLE_PAIRS,
    (terminal) => attachmentOf(lightTopology, placement, terminal),
    sameNet,
  );
}

/** Every OTHER end that is the same piece of metal as this one. */
const matesOf = (terminal: TerminalId): TrafficTerminal[] =>
  SYMMETRIC.find((klass) =>
    klass.includes(terminal as TrafficTerminal),
  )?.filter((u) => u !== terminal) ?? [];

/**
 * Which net a hole belongs to: the board's header, the ground rail, the bank.
 *
 * `bb.pos*` is not a case because it is not in `holes` and `fits` asks this
 * only about holes — see there.
 */
const familyOf = (id: NodeId) =>
  id.startsWith("board.")
    ? "board"
    : id.startsWith("bb.neg")
      ? "rail"
      : "bank";

/**
 * Whether a lead sitting on `target` is the join `want` asks for.
 *
 * - A join the sketch aims at a HOLE is that join wherever it landed **in the
 *   same net**. Chapter one's literal rule was "any hole at all", which was
 *   true when there were fifteen of them and would let a lead in any of 195
 *   claim an expected id here. Family keeps chapter one's ONE-FINDING property
 *   — a cathode in `bb.f9` keeps `tl.c.red.cathode`, `sameJoin` fails on the
 *   column group, and the panel says "it is in F9, it belongs in F7" once
 *   instead of reporting a missing join and a stray for the same gesture —
 *   while still refusing to let a bank-aimed join be claimed by a lead sitting
 *   in the rail or in the header.
 * - A join the sketch aims at another LEAD has to be that same lead.
 *
 * The `isHole` test on the target is not redundant with the family test:
 * without it a lead clipped onto ANOTHER PART'S lead would be classified
 * "bank" by the fallback arm and would inherit an expected id, so `extras()` —
 * which filters out anything carrying one — would go blind on the join.
 */
function fits(want: Connection, named: NodeId, target: NodeId): boolean {
  const otherEnd = want.from === named ? want.to : want.from;
  return lightTopology.holes.includes(otherEnd)
    ? lightTopology.holes.includes(target) &&
        familyOf(target) === familyOf(otherEnd)
    : target === otherEnd;
}

function connectionFor(
  terminal: TrafficTerminal,
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
   * `sameJoin` reads the id as the scene's answer to "who is making this join",
   * and `comparedTo`, `isResolved` and `stepParts` all match by id. Without it
   * two loose ends of one class both fell back to the same expected connection
   * — reachable from the finished bench in five ordinary gestures, and
   * `extras()` went blind on both of them.
   */
  claimed: Set<string>,
): Connection {
  const isCableEnd = WIRES.some((w) => w.a === terminal || w.b === terminal);
  let want: Connection | undefined;

  if (isCableEnd) {
    /* A cable's join is a fact about its two seats together, and about what the
       other three cables are doing — see `cable-joins.ts`. `fits` and the mate
       loop below are for parts whose ends stay attached to a body. */
    want = cables.get(terminal);
  } else {
    /* Each of the remaining terminals appears in exactly one expected
       connection, which is what makes this decidable at all. */
    const own = expected.find((c) => c.from === terminal || c.to === terminal);
    want = own && fits(own, terminal, target) ? own : undefined;

    /* The symmetrical part, used the other way round — the resistor turned
       round.

       Its own entry is tried first, so a lead that landed one hole over keeps
       ITS OWN id and reports one finding rather than borrowing a neighbour's.
       Only when the terminal's own entry does not fit at all does it look at
       the ends that are the same piece of metal, and it may take one of theirs
       only if that end cannot currently make the join itself. That guard is the
       whole difference between "the resistor is in backwards, here are two
       correct joins" and "here is one id emitted twice". */
    if (!want) {
      for (const mate of matesOf(terminal)) {
        const theirs = expected.find((c) => c.from === mate || c.to === mate);
        if (!theirs || !fits(theirs, mate, target)) continue;
        const mateTarget = attachmentOf(lightTopology, placement, mate);
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
      /* Derived per connection, never hardcoded per branch: the label must name
         where the leg actually went. */
      ...(want.label !== undefined ? { label: labelFor(nodes[target]) } : {}),
    };
  }

  /* A join the sketch does not ask for. Minted from the lead that made it, so
     `clearing()` can slice the terminal back off, and so moving the same lead
     to a different wrong target leaves the finding open rather than resolving
     it and opening a second one. */
  return {
    id: `${EXTRA_PREFIX}${terminal}`,
    from: terminal,
    to: target,
    role: "idle",
    medium: "leg",
  };
}

export function lightSceneFrom(
  placement: Placement,
  mechanical: MechanicalState = lightAtRest,
): CircuitScene {
  if (process.env.NODE_ENV !== "production") {
    /* Every literal placement in this repo typechecks as `Placement`, because
       its key type is `string`. A part-keyed leftover would draw an empty board
       and throw nothing, so it is caught here instead of in review. */
    const stray = Object.keys(placement).filter(
      (key) => !lightTerminals.includes(key as TrafficTerminal),
    );
    if (stray.length)
      throw new Error(`lightSceneFrom: not a terminal — ${stray.join(", ")}`);
  }

  const nodes: Record<NodeId, CircuitNode> = { ...nodeGrid };

  /* 1 · POSITION THE RIGID PARTS. Walk out from the holes; a part with no path
        to one is in the kit and emits nothing. Every anchor's target already
        has coordinates when it is reached, because `anchorsFor` returns them in
        that order. */
  for (const a of anchorsFor(lightTopology, placement)) {
    /* A cable is not positioned from an anchor at all — it has no body to hang
       off one. Its ends come out of the record below, each from its own seat. */
    if (isFlexible(lightTopology, a.part)) continue;

    const anchor = nodes[a.target];
    if (!anchor) continue;

    const stem = STEM[a.part as TrafficPart];

    /* 2 · EMIT BOTH LEADS, whichever one anchors the part. `lightArtOrigins`
          reads a part's position back off its cathode / its `in` lead, so a
          part that emitted only its anchoring lead would silently stop being
          DRAWN the moment it was hung off the other one — the graph stays right
          and the picture goes blank. */
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
      /* `in` is the drawing's RIGHT pin — see `resistorOriginFrom`. */
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

  /* 3 · EMIT THE CABLE ENDS, straight from the record. An end that is seated IS
        its hole; the other end of a half-placed cable hangs on its slack, so
        there is something to take hold of and finish with. A cable end carries
        no label, because a jumper prints nothing on either end and `leadGlyph`
        says the same. */
  const seatOf = (id: NodeId | null | undefined) =>
    id ? nodes[id] : undefined;

  for (const w of WIRES) {
    const seats = [
      [w.a, seatOf(placement[w.a]), seatOf(placement[w.b])],
      [w.b, seatOf(placement[w.b]), seatOf(placement[w.a])],
    ] as const;
    for (const [end, own, far] of seats) {
      const at = own ?? (far ? slackFrom(far) : undefined);
      /* Neither end seated: the cable is still in the box. Or an end attached
         to something that is not a node at all, which only a hand-written
         literal can produce — invariant 3 keeps it absent rather than drawn to
         nowhere. */
      if (!at) continue;
      nodes[end] = { id: end, kind: "terminal", x: at.x, y: at.y };
    }
  }

  /* 4 · OBSERVE. Exactly the non-null entries, one `Connection` each. Nothing
        is manufactured: a join exists because a person made it, and for no
        other reason. */
  const observed: Connection[] = [];
  const claimed = new Set<string>();
  const cables = cableJoins(placement);
  for (const terminal of lightTerminals) {
    const target = placement[terminal];
    if (!target) continue;
    /* Invariant 3 — a join whose endpoints are not both on the bench is absent
       rather than drawn to nowhere. `prune` normally makes this unreachable; it
       stays because `lightSceneFrom` is also called with hand-written literals
       from the briefing film and the lab. */
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
export const trafficLight: CircuitScene = lightSceneFrom(lightComplete);

/* --- The spec ------------------------------------------------------------ */

/**
 * Where a free lead offers itself to a pointer and to the picker: half a pitch
 * up and half a pitch to the right, which is the centre of a lattice cell.
 *
 * Re-derived rather than inherited, because chapter one's answer cannot work
 * here. Chapter one lifts a terminal `PITCH * 1.5` straight up: its holes are
 * one row and "up" is empty. A breadboard is 10 units in BOTH axes, so any
 * purely vertical lift lands either on a hole or exactly midway between two of
 * them. The diagonal puts the mark 7.071 = hypot(5, 5) from all four
 * neighbours, which is the farthest any point on a square grid can be from all
 * of them.
 *
 * What that costs, measured rather than guessed, so nobody "fixes" the offset:
 * `minSpacing` over a mixed candidate set is 6.783 where chapter one's is
 * 9.896; `hitRadius(1, 6.783)` is `min(12, 3.052)` = 3.052 against chapter
 * one's 4.45 — smaller catchers, still strictly non-overlapping, which is what
 * the `spacing * 0.45` cap exists for; and `zoomToAim(k, 6.783)` = 24 / 6.783
 * = 3.538, above `zoom.max`, so every pick-up asks for the ceiling and is
 * clamped there.
 *
 * 6.783 and not the lattice's 7.071, because a free lead is never on the
 * lattice: `candidatesFor` offers only free leads, and a free lead stands one
 * pin span from its seated sibling's hole. The LED's two pins are 10 art px
 * apart, which is 10.4167 scene units at `PX = 25/24`, so the free anode is
 * 0.4167 off the grid and its lifted mark lands hypot(4.583, 5) = 6.783 from
 * the nearest hole. `drag-math.test.ts` pins the number.
 *
 * `aimOrigin` in the scene view stays the RAW node and never this point: the
 * lifted mark would put a seated lead 7 units from its own hole at rest and
 * read a barely-moved gesture as a miss.
 */
const GRAB_OFF = PITCH * 0.5;

export const lightGrabPoint = (n: CircuitNode) =>
  n.kind === "terminal"
    ? { x: n.x + GRAB_OFF, y: n.y - GRAB_OFF }
    : { x: n.x, y: n.y };

/**
 * Pull whatever is in the hole out of it first.
 *
 * `tryAttach` refuses an occupied hole, and this recipe has to reach the
 * finished build from any state the person can leave the bench in — so the
 * blocker, which is by definition a lead the sketch does not want there, is
 * pulled loose as part of the fix rather than left to make the fix a silent
 * no-op. Chapter one's helper, widened to twenty leads.
 */
function freeing(
  placement: Placement,
  terminal: TerminalId,
  hole: NodeId,
): Placement {
  return lightTerminals
    .filter((u) => u !== terminal && placement[u] === hole)
    .reduce((p, blocker) => attach(lightTopology, p, blocker, null), placement);
}

/* What a drag straight off the kit shelf commits. Each is the FIRST entry of
   its part's `terminalsOf` list, so the lead the anchor lands and the lead the
   drawing measures from are the same one. */
const LIGHT_ANCHOR = {
  wireGnd: "wire.gnd.rail",
  ledRed: "led.red.cathode",
  resRed: "res.red.in",
  wireRed: "wire.red.row",
  ledYellow: "led.yellow.cathode",
  resYellow: "res.yellow.in",
  wireYellow: "wire.yellow.row",
  ledGreen: "led.green.cathode",
  resGreen: "res.green.in",
  wireGreen: "wire.green.row",
} as const satisfies Record<TrafficPart, TrafficTerminal>;

/**
 * The jumper ghost's own housing point, in the pixels `ART_PINS` is written in.
 *
 * The cable has no Wokwi drawing to take a pin table from — its shelf art is
 * ours, a 30 x 50 scene-unit ghost — so the mark is the top housing's centre at
 * (15, 6) scene units, divided back out by `PX` so that `pinAt` returns it
 * unchanged. Written as the division rather than as 14.4 so the number a reader
 * has to check is the one the drawing uses.
 */
const JUMPER_HOUSING = [(PITCH * 1.5) / PX, (PITCH * 0.6) / PX] as const;

/**
 * Where each lead comes out of its part's own drawn box, in Wokwi's pixels.
 *
 * **`in` is `right` and `out` is `left`, deliberately** — the resistor is drawn
 * running leftward from its anchor so that no drive cable ever passes over a
 * resistor body. It reads as an inverted table; see `resistorOriginFrom` before
 * swapping it back.
 */
const ART_PINS: Record<TrafficTerminal, readonly [number, number]> = {
  "led.red.cathode": ledPins.cathode,
  "led.red.anode": ledPins.anode,
  "led.yellow.cathode": ledPins.cathode,
  "led.yellow.anode": ledPins.anode,
  "led.green.cathode": ledPins.cathode,
  "led.green.anode": ledPins.anode,
  "res.red.in": resistorPins.right,
  "res.red.out": resistorPins.left,
  "res.yellow.in": resistorPins.right,
  "res.yellow.out": resistorPins.left,
  "res.green.in": resistorPins.right,
  "res.green.out": resistorPins.left,
  "wire.gnd.rail": JUMPER_HOUSING,
  "wire.gnd.pin": JUMPER_HOUSING,
  "wire.red.row": JUMPER_HOUSING,
  "wire.red.pin": JUMPER_HOUSING,
  "wire.yellow.row": JUMPER_HOUSING,
  "wire.yellow.pin": JUMPER_HOUSING,
  "wire.green.row": JUMPER_HOUSING,
  "wire.green.pin": JUMPER_HOUSING,
};

/**
 * What the part itself prints beside a lead.
 *
 * An LED's two legs are a polarity and the part says so. A resistor's are one
 * piece of wire, and so are a jumper's two ends — a badge on either would be
 * the interface asserting a distinction the component does not make.
 */
const ART_LABELS: Partial<Record<TrafficTerminal, string>> = {
  "led.red.cathode": "−",
  "led.red.anode": "+",
  "led.yellow.cathode": "−",
  "led.yellow.anode": "+",
  "led.green.cathode": "−",
  "led.green.anode": "+",
};

export const lightPlacement: PlacementSpec = {
  ...lightTopology,
  componentOf: {
    /* The colour is the part, not a decoration on it: this chapter's whole
       subject is which lamp comes on when, so the box hands over three things
       a person can tell apart and the shelf has to draw and name them that
       way. `countedAs` maps all three back to the `led` the card counts. */
    ledRed: "ledRed",
    ledYellow: "ledYellow",
    ledGreen: "ledGreen",
    resRed: "resistor",
    resYellow: "resistor",
    resGreen: "resistor",
    /* Legal because `componentOf` is keyed by `KitId` rather than by
       `ComponentId`: the ladder still counts four components for this chapter
       and the bench still has ten things in it. */
    wireGnd: "jumper",
    wireRed: "jumper",
    wireYellow: "jumper",
    wireGreen: "jumper",
  } satisfies Record<TrafficPart, KitId>,
  anchorOf: LIGHT_ANCHOR,
  leadGlyph: (terminal) => ART_LABELS[terminal as TrafficTerminal],
  anchorMark: (partId) => {
    const terminal = LIGHT_ANCHOR[partId as TrafficPart];
    /* Placed at the origin: the answer is a point inside the part's own box,
       and the shelf draws that box at its own scale wherever it likes. The
       `label` key appears only where the part prints one, so the shelf's mark
       and `leadGlyph` can never disagree. */
    return {
      ...pinAt({ x: 0, y: 0 }, ART_PINS[terminal]),
      ...(ART_LABELS[terminal] ? { label: ART_LABELS[terminal] } : {}),
    };
  },
  empty: lightEmpty,
  complete: lightComplete,
  sceneFrom: lightSceneFrom,
  grabPoint: lightGrabPoint,
  sameNet,

  satisfying: (placement, connectionId) => {
    const want = expected.find((c) => c.id === connectionId);
    if (!want) return null;
    /* IDEMPOTENT BY ENDPOINT, and read through `attachmentOf` rather than
       through `placement[t]`: a join is stored once, on the lead that made it,
       so the one-directional guard chapter one shipped announced a join it had
       not made every time the edge lived on the other side. */
    if (attachmentOf(lightTopology, placement, want.from) === want.to)
      return null;
    /* One shape for all twenty, because `complete` holds no lead-to-lead value:
       every fix in this chapter is "put that lead in that hole", and chapter
       one's middle-join special case has nothing to be about. */
    return attach(
      lightTopology,
      freeing(placement, want.from, want.to),
      want.from,
      want.to,
    );
  },

  /** A removal, which `satisfying` cannot express. Demo control only. */
  clearing: (placement, connectionId, edge) => {
    if (!connectionId.startsWith(EXTRA_PREFIX)) return null;
    const terminal = connectionId.slice(EXTRA_PREFIX.length) as TerminalId;
    if (!lightTerminals.includes(terminal as TrafficTerminal)) return null;
    /* The finding is a snapshot. Only remove the join it actually named — the
       lead may hold something else by now, and a stale removal that fired
       anyway would undo the repair the person just made. `null` rather than an
       unchanged placement, so the caller can say "that join has moved" instead
       of announcing a removal that did not happen. */
    if (placement[terminal] !== edge.to && placement[terminal] !== edge.from)
      return null;
    return attach(lightTopology, placement, terminal, null);
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
  x: lightBoardAt.x - PITCH,
  y: lightBoardAt.y - PITCH,
  width: boxOf(frame.uno).width + PITCH * 2,
  height: boxOf(frame.uno).height + PITCH * 2,
};

/**
 * The plastic, not the hole grid.
 *
 * `part.breadboard.height` measures the two banks; the rails stand a further
 * two pitches clear at each end, which is why the box grows by `PITCH * 4`
 * before it is padded. Drawn: x 150..470, y 155..407.598.
 */
/* The plastic, plus a pitch of air. Derived from the rails for the same reason
   `Breadboard` draws it from them: the two have to be one fact, or a briefing
   frames a board whose edges are somewhere else. */
const breadboardBox: Box = {
  x: lightBreadboardAt.x - PITCH,
  y: posRailY - PITCH * 1.5 - PITCH,
  width: part.breadboard.width + PITCH * 2,
  height: negRailY - posRailY + PITCH * 3 + PITCH * 2,
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
 * idea of where a part is: what the leads are attached to is the only record,
 * so an origin is inverted from the terminal the walk produced rather than
 * stored beside it. Every lookup is `maybeNode` and never the throwing
 * `node()`: a part still in the kit has no node at all, and `undefined` is what
 * that looks like to the drawing.
 */
export function lightArtOrigins(scene: CircuitScene) {
  const originOf = (terminal: TrafficTerminal): Point | undefined => {
    const n = maybeNode(scene, terminal);
    if (!n) return undefined;
    const px = ART_PINS[terminal];
    return { x: n.x - px[0] * PX, y: n.y - px[1] * PX };
  };
  /* Both or neither: `lightSceneFrom` gives a half-placed cable's loose end its
     slack, so one end with a node and the other without cannot happen. */
  const endsOf = (
    a: TrafficTerminal,
    b: TrafficTerminal,
  ): CableEnds | undefined => {
    const na = maybeNode(scene, a);
    const nb = maybeNode(scene, b);
    return na && nb
      ? { a: { x: na.x, y: na.y }, b: { x: nb.x, y: nb.y } }
      : undefined;
  };

  return {
    board: lightBoardAt,
    breadboard: lightBreadboardAt,
    ledRed: originOf("led.red.cathode"),
    ledYellow: originOf("led.yellow.cathode"),
    ledGreen: originOf("led.green.cathode"),
    resRed: originOf("res.red.in"),
    resYellow: originOf("res.yellow.in"),
    resGreen: originOf("res.green.in"),
    wireGnd: endsOf("wire.gnd.rail", "wire.gnd.pin"),
    wireRed: endsOf("wire.red.row", "wire.red.pin"),
    wireYellow: endsOf("wire.yellow.row", "wire.yellow.pin"),
    wireGreen: endsOf("wire.green.row", "wire.green.pin"),
  };
}

/**
 * W-07 · what a vision result outlines. Only the parts that are on the bench.
 *
 * An ABSENT key means "still in the kit" and both the inspection panel and the
 * scene view depend on that, so nothing here emits a zero box for a part that
 * is not there.
 */
export function lightBoxesFor(scene: CircuitScene): Record<string, Box> {
  const at = lightArtOrigins(scene);
  const boxes: Record<string, Box> = {
    board: boardBox,
    breadboard: breadboardBox,
  };

  for (const id of ["ledRed", "ledYellow", "ledGreen"] as const) {
    const origin = at[id];
    if (!origin) continue;
    boxes[id] = {
      x: origin.x - PITCH,
      y: origin.y - PITCH,
      width: boxOf(frame.led).width + PITCH * 2,
      height: boxOf(frame.led).height + PITCH * 2,
    };
  }

  for (const id of ["resRed", "resYellow", "resGreen"] as const) {
    const origin = at[id];
    if (!origin) continue;
    /* Chapter one's asymmetric pad: the body is only 11.8 units tall, so a
       symmetrical pitch on the vertical draws a box that reads as a border on
       the part rather than as an annotation about it. */
    boxes[id] = {
      x: origin.x - PITCH,
      y: origin.y - PITCH * 1.6,
      width: boxOf(frame.resistor).width + PITCH * 2,
      height: boxOf(frame.resistor).height + PITCH * 3.2,
    };
  }

  for (const id of ["wireGnd", "wireRed", "wireYellow", "wireGreen"] as const) {
    const ends = at[id];
    if (!ends) continue;
    /* A cable has no drawn box of its own — it is exactly the span between its
       two ends, wherever the person left them. */
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
export const lightPartBox = lightBoxesFor(trafficLight) as {
  board: Box;
  breadboard: Box;
  ledRed: Box;
  ledYellow: Box;
  ledGreen: Box;
  resRed: Box;
  resYellow: Box;
  resGreen: Box;
  wireGnd: Box;
  wireRed: Box;
  wireYellow: Box;
  wireGreen: Box;
};

/**
 * What `fitView` should frame.
 *
 * **A constant, deliberately, even though the parts move.** `fitView`'s memo
 * depends on this box, so one derived from the live placement would rebuild the
 * viewport's observer on every seat and `Fit view` would frame a different
 * thing before and after each drop.
 *
 * **But the extent of every position the model can produce, not of the finished
 * build.** Chapter one shipped with a box taken from the finished lamp alone
 * and drew a just-placed LED off the top of the canvas with only its leg tips
 * showing. Four probe scenes cover everything reachable here: a part hung one
 * hop off another part's lead rises `STANDOFF` and, for an LED on a resistor's
 * free lead, reaches 6.875 units further left than the breadboard's own edge;
 * and a cable with one end seated puts the other end out on its slack, up from
 * the header or down from the plastic. Nothing hangs off something that is
 * itself hanging — `anchorsFor` cannot produce that cycle — and nothing hangs
 * off a cable at all, which `tryAttach` refuses as `wireEnd`.
 *
 * Computed result: `{ x: 93.125, y: 105, width: 542.623, height: 595 }`, which
 * opens at ~1.17 in an 828 x 700 region and ~1.0 in 668 x 600, against chapter
 * one's 1.56. A breadboard hole is then about 10 CSS px from its neighbour at
 * rest, and `closer()` jumps to the zoom ceiling on pick-up.
 */
const probes = [
  /* Each LED hung off its resistor's free lead — the leftmost thing this build
     can draw, because the resistor body already runs 61.25 units left of its
     own column. */
  lightBoxesFor(
    lightSceneFrom({
      ...lightEmpty,
      "res.red.in": "bb.j7",
      "res.yellow.in": "bb.j18",
      "res.green.in": "bb.j27",
      "led.red.cathode": "res.red.out",
      "led.yellow.cathode": "res.yellow.out",
      "led.green.cathode": "res.green.out",
    }),
  ),
  /* And the other way round: each resistor hung off its LED's free anode. */
  lightBoxesFor(
    lightSceneFrom({
      ...lightEmpty,
      "led.red.cathode": "bb.f7",
      "led.yellow.cathode": "bb.f18",
      "led.green.cathode": "bb.f27",
      "res.red.in": "led.red.anode",
      "res.yellow.in": "led.yellow.anode",
      "res.green.in": "led.green.anode",
    }),
  ),
  /* Every cable seated on the header with its far end on its slack, and then
     the same on the breadboard — the two directions `slackFrom` can send it. */
  lightBoxesFor(
    lightSceneFrom({
      ...lightEmpty,
      "wire.gnd.pin": "board.GND",
      "wire.red.pin": "board.D13",
      "wire.yellow.pin": "board.D12",
      "wire.green.pin": "board.D11",
    }),
  ),
  lightBoxesFor(
    lightSceneFrom({
      ...lightEmpty,
      "wire.gnd.rail": "bb.neg6",
      "wire.red.row": "bb.h8",
      "wire.yellow.row": "bb.h19",
      "wire.green.row": "bb.h28",
    }),
  ),
];

const fitBoxes = [
  ...Object.values(lightPartBox),
  ...probes.flatMap((set) => Object.values(set)),
];
const framed = framing(fitBoxes, PITCH * 4);

/** What `fitView` opens on — the padded extent. See `framing`. */
export const lightFitBox = framed.fit;

/**
 * What the briefing film frames — the same box with its padding clipped to the
 * mat, so the film never shows a strip of bare oak past the bench's edge.
 */
export const lightStageBox = framed.stage;

/**
 * Which board pin each lamp's drive line actually reaches.
 *
 * **Asked of the metal, not of the cable's name.** The obvious way to write
 * this is to look up `wire.red.pin` and read where it went, and it is wrong for
 * the reason this chapter's own cable rule states: the four jumpers are one
 * object, so somebody who drives the red lamp with the cable this file calls
 * "green" has built the right circuit. Read by name, that build fails a check
 * it passes — measured, 382 of the 384 correct layouts — and the person is told
 * a correct bench is wrong, with nothing in the panel to point at, which is the
 * one thing this product must never do.
 *
 * So it asks the physical question instead: *of the cable that reaches this
 * lamp's anode column, where does the other end land?* The column is named by
 * the finished build rather than typed out, and the net test is `NODE_GROUPS`,
 * so a cable one row up the same column answers the same way — which is true of
 * the board and is the whole of what this chapter teaches.
 *
 * `undefined` for a lamp no cable reaches yet. Chapter three's `nightLines` is
 * the same function; this is the one it was written from.
 */
export function lightLines(scene: CircuitScene): {
  red?: NodeId;
  yellow?: NodeId;
  green?: NodeId;
} {
  const landed = (terminal: TrafficTerminal) =>
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
    red: across(lightComplete["led.red.anode"]),
    yellow: across(lightComplete["led.yellow.anode"]),
    green: across(lightComplete["led.green.anode"]),
  };
}

/** Part numbers, printed on the parts and the same in every language. */
export const lightPartNumbers = {
  board: "Arduino Uno",
  breadboard: "Half-size",
  led: "5 mm LED",
  resistor: "220Ω",
  jumper: "M–M",
} as const;
