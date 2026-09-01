import { PITCH, framing, mm } from "@/lib/circuit/geometry";
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
  onBench,
} from "@/lib/circuit/placement";

/**
 * Chapter one · The Breathing Lamp.
 *
 * Three parts and no breadboard, which is the whole reason this is the first
 * chapter: the circuit still fits on the board's own header. Outgrowing it is
 * chapter two's lesson and it is a lesson of its own, not a given.
 *
 * ## Why the resistor has to bridge the gap
 *
 * A lamp that *breathes* needs a PWM pin, and on an Uno there is no PWM pin
 * next to a ground — the classic "LED straight into the header" trick is D13
 * and GND, and D13 can only blink. So the LED cannot span both holes on its own
 * legs, and something has to reach across the 47.5 px between `GND.1` and `D9`.
 * That something is the resistor, which this chapter needs anyway.
 *
 * That is not a workaround, it is the chapter: the part a beginner is most
 * tempted to leave out is the one part holding the circuit together, and here
 * you can see it doing it.
 *
 * ## The fault is nobody's but yours
 *
 * There used to be one written down here: the resistor's free lead started in
 * **D8** where the sketch writes to **D9**, so the lamp blinked instead of
 * breathing. It was a good fault and it was a lie — the agent found a mistake
 * the person had not made.
 *
 * The lesson survives it, because the mistake is still available. Every hole
 * along the digital header is a seat a lead can go into, only some of them are
 * behind a PWM output, and putting the lead one hole over is exactly as easy
 * as it is on a real board. What the product used to stage, it now waits for.
 *
 * ## Every join is an act
 *
 * There used to be a second lie, quieter than the first. The middle join —
 * the LED's long leg to the resistor's near lead — was pushed into `observed`
 * the moment both parts happened to be on the bench, so the one connection this
 * chapter is *about* was the one connection the learner never made. The
 * placement is keyed by lead now, and `lampSceneFrom` emits exactly the
 * attachments it is given: three joins in the finished lamp, three acts.
 *
 * So the scene is a **function of what each lead is attached to**
 * (`lampSceneFrom`), and the graph follows the attachments rather than the
 * other way round.
 */

/* --- Where the board sits -------------------------------------------------
   The one thing nobody places: it is the substrate, and every seat in this
   build is a hole in it.                                                     */

export const lampBoardAt = { x: 380, y: 430 } as const;

/**
 * Every hole a lead can go into.
 *
 * The whole digital header, not the two the sketch happens to name. Three
 * addressable holes would be a placement gesture with two possible answers —
 * a toggle in a placement's clothing — and this chapter's lesson is precisely
 * that *some* pins can hold a value between on and off. That is only a lesson
 * if the wrong ones are reachable.
 */
const BOARD_PINS: Array<[NodeId, keyof typeof unoPins, string]> = [
  ["board.D13", "D13", "D13"], ["board.D12", "D12", "D12"],
  ["board.D11", "D11", "D11"], ["board.D10", "D10", "D10"],
  ["board.D9", "D9", "D9"],    ["board.D8", "D8", "D8"],
  ["board.D7", "D7", "D7"],    ["board.D6", "D6", "D6"],
  ["board.D5", "D5", "D5"],    ["board.D4", "D4", "D4"],
  ["board.D3", "D3", "D3"],    ["board.D2", "D2", "D2"],
  ["board.D1", "D1", "D1"],    ["board.D0", "D0", "D0"],
  ["board.GND", "GND1", "GND"],
];

/**
 * The six holes on an Uno that can hold a value between on and off.
 *
 * The chapter is about this list and nothing else, so it is stated here rather
 * than being implied by which hole the sketch happens to name: the functional
 * test asks whether the lamp *can* breathe, and that question has an answer for
 * every one of the fifteen holes a lead can go in — not just for D9.
 */
export const pwmPins: readonly NodeId[] = [
  "board.D3",
  "board.D5",
  "board.D6",
  "board.D9",
  "board.D10",
  "board.D11",
];

const boardNodes: Record<NodeId, CircuitNode> = Object.fromEntries(
  BOARD_PINS.map(([id, source, label]) => [
    id,
    {
      id,
      kind: "board-pin" as const,
      label,
      ...pinAt(lampBoardAt, unoPins[source]),
    },
  ]),
);

/**
 * The holes, ordered the way they read on screen.
 *
 * Wokwi's header runs D0 at x=255.5 down to D13 at x=125, so pin number
 * increases *leftwards*. Sorting by number would send ArrowRight travelling
 * left across the board.
 */
export const lampCandidates: NodeId[] = BOARD_PINS.map(([id]) => id).sort(
  (a, b) => boardNodes[a].x - boardNodes[b].x,
);

/* --- Where a part sits, given what one of its leads is attached to ---------
   Each part is placed backwards from its own anchoring lead and from nothing
   else. The resistor used to be positioned from the LED's anode, which was true
   of the finished build and impossible for a half-built one: a person can seat
   the resistor before the LED, and geometry that needs a part that is not there
   cannot be drawn. What is new is that the anchor may itself be another part's
   lead — which `anchorsFor` resolves in an order that guarantees it already has
   coordinates by the time it is read here.                                    */

/** Anything with scene coordinates: a board hole, or another part's lead. */
type Point = { x: number; y: number };

/**
 * The overhang, which is why it is two and a half pitches rather than a token
 * one.
 *
 * Zero would put the free lead exactly on its hole and the leg would have no
 * length to bend in. One pitch — which this was — put the *far* lead back over
 * the LED's dome, so the join to the anode crossed the one part the frame is
 * of: three things in forty units of header, and a reader cannot tell which leg
 * belongs to what. Two and a half puts the far lead just clear of a seated
 * LED's anode, so one leg leaves the LED going straight up and the other comes
 * down into the hole, and neither crosses a part.
 */
const RESISTOR_OVERHANG = PITCH * 2.5;

/**
 * A part held up by another part's lead stands OFF it by 14 mm, on the side
 * that keeps it clear of the board.
 *
 * The LED hangs legs-down from a hole, so `drop` is zero when the lead IS in
 * the header — the part is standing in the board and its cathode *is* the hole.
 * Held by a resistor lead instead, it must go UP: every resistor lead floats
 * 49.23 units above the header row (`mm(14)` up to the resistor's origin, less
 * the 5.8854 its own pins sit below that origin), and dropping the LED 55.12
 * below one lands its dome across the `AREF GND 13 12` silkscreen with a
 * connector housing planted on top of it. The sign is the whole difference
 * between a part standing on a board and a part lying across it.
 */
function ledOriginFrom(
  anchor: Point,
  end: "cathode" | "anode",
  intoHole: boolean,
) {
  const drop = intoHole ? 0 : -mm(14);
  return {
    x: anchor.x - ledPins[end][0] * PX,
    y: anchor.y - ledPins[end][1] * PX + drop,
  };
}

/**
 * The resistor stands off the board by 14 mm, which is the least that clears
 * the dome of an LED standing in the header beside it, so both legs read as
 * legs and no part of the body is over the silkscreen.
 *
 * Only a lead going DOWN into the header bends sideways: the overhang is what
 * gives the leg its length to bend in and what keeps the far lead clear of a
 * seated LED's dome. A lead joined to another lead drops straight, and the
 * 14 mm rise is what makes that join a visible 49.23-unit cable rather than two
 * points on top of each other.
 *
 * The rise is measured to the **origin**, not to the lead tip: subtracting
 * `resistorPins[end][1] * PX` as well would look like a correction and would
 * move `lampPartBox`, `lampFitBox` and every briefing frame by 5.8854 units.
 */
function resistorOriginFrom(
  anchor: Point,
  end: "left" | "right",
  intoHole: boolean,
) {
  const lean = intoHole
    ? end === "right"
      ? RESISTOR_OVERHANG
      : -RESISTOR_OVERHANG
    : 0;
  return {
    x: anchor.x + lean - resistorPins[end][0] * PX,
    y: anchor.y - mm(14),
  };
}

/* --- The graph -----------------------------------------------------------
   `expected` is what the sketch defines and never changes. `observed` is what
   the attachments produce, one connection per attached lead and not one more. */

const expected: Connection[] = [
  {
    id: "bl.c.cathode",
    from: "led.cathode",
    to: "board.GND",
    role: "ground",
    label: "GND",
    medium: "leg",
  },
  {
    id: "bl.c.anode",
    from: "led.anode",
    to: "res.in",
    role: "signal",
    medium: "leg",
  },
  {
    id: "bl.c.pin",
    from: "res.out",
    to: "board.D9",
    role: "signalAlt",
    label: "220Ω → D9",
    medium: "leg",
  },
];

/* --- The vocabulary -------------------------------------------------------
   Declared before `lampSceneFrom`, which reads it, and spread into
   `lampPlacement` below, which needs `lampSceneFrom`. One object holding both
   would be a module-init cycle.                                              */

export type LampTerminal =
  | "led.cathode"
  | "led.anode"
  | "res.in"
  | "res.out";

/** The parts this build is made of. */
const PARTS = ["led", "resistor"] as const;

export const lampTerminals: readonly LampTerminal[] = [
  "led.cathode",
  "led.anode",
  "res.in",
  "res.out",
];

const lampTopology: PlacementTopology = {
  parts: PARTS,
  terminals: lampTerminals,
  /* Priority order, not a list: the lead the standoff geometry was tuned for
     comes first, so a part with both leads in holes is anchored the way it is
     drawn today. Reordering `resistor` silently moves `lampPartBox`. */
  terminalsOf: {
    led: ["led.cathode", "led.anode"],
    resistor: ["res.out", "res.in"],
  },
  holes: lampCandidates,
};

export const lampEmpty = {
  "led.cathode": null,
  "led.anode": null,
  "res.in": null,
  "res.out": null,
} satisfies Record<LampTerminal, NodeId | null> as Placement;

export const lampComplete = {
  "led.cathode": "board.GND",
  /* The middle join, stored ONCE and on the lead the sketch names as `from`,
     so the emitted connection reads in the sketch's own direction. */
  "led.anode": "res.in",
  "res.in": null,
  "res.out": "board.D9",
} satisfies Record<LampTerminal, NodeId | null> as Placement;

/** Nothing on this build moves; carried so every build answers the same shape. */
export const lampAtRest: MechanicalState = { servoAngle: 0, expectedAngle: 0 };

/* --- Naming a join --------------------------------------------------------
   A connection's id is what `comparedTo`, `isResolved`, the success trace and
   `stepParts` all match on, so which id a join gets is not cosmetic: it decides
   whether the agent is talking about the join the sketch asks for or about one
   nobody asked for.                                                          */

/** `graph.ts` recognises the `.x.` segment; this is chapter one's spelling. */
const EXTRA_PREFIX = "bl.x.";

/** `GND` for the cathode join; `220Ω → D9` for the pin join. */
function labelFor(want: Connection, target: CircuitNode): string {
  return want.id === "bl.c.pin"
    ? `220Ω → ${target.label}`
    : (target.label ?? target.id);
}

/**
 * Leads that are the same thing twice.
 *
 * A 220Ω resistor has no polarity: its two leads are one component's two ends
 * and swapping them makes no electrical difference at all — the step text says
 * so out loud. The model named them `res.in` and `res.out` anyway, because a
 * record has to call them something, and then treated the names as facts: build
 * the lamp with the resistor turned round — an *electrically identical, correct
 * circuit* — and the panel reported four faults, two connections missing and
 * two the sketch does not ask for, on a build that lights up.
 *
 * So the names are a convention here, and this is the list of places the
 * convention is not allowed to be load-bearing.
 */
const INTERCHANGEABLE: readonly (readonly LampTerminal[])[] = [
  ["res.in", "res.out"],
];

const mateOf = (terminal: LampTerminal): LampTerminal | undefined =>
  INTERCHANGEABLE.find((klass) => klass.includes(terminal))?.find(
    (u) => u !== terminal,
  );

/**
 * Whether a lead sitting on `target` is the join `want` asks for.
 *
 * - A join the sketch aims at a HOLE is that join wherever it landed, so
 *   `bl.c.cathode` keeps saying "the LED is in D8, not GND" instead of being
 *   reported twice, once as missing and once as unasked-for.
 * - A join the sketch aims at another LEAD has to be the SAME lead. Kind alone
 *   is not enough: `bl.c.anode` names two terminals, so `res.in` joined to
 *   `led.cathode` would inherit its id, `diff` would report "+ is connected to
 *   −, it should be 220Ω" about a lead that is in a hole, and `extras()` —
 *   which filters out anything carrying an expected id — would go blind on the
 *   same connection.
 */
function fits(want: Connection, named: NodeId, target: NodeId): boolean {
  const otherEnd = want.from === named ? want.to : want.from;
  return lampTopology.holes.includes(otherEnd)
    ? lampTopology.holes.includes(target)
    : target === otherEnd;
}

function connectionFor(
  terminal: LampTerminal,
  target: NodeId,
  nodes: Record<NodeId, CircuitNode>,
  placement: Placement,
): Connection {
  /* Each of the four terminals appears in exactly one expected connection,
     which is what makes this decidable at all. */
  const own = expected.find((c) => c.from === terminal || c.to === terminal);
  let want = own && fits(own, terminal, target) ? own : undefined;

  /* The resistor, turned round.
     
     `res.in` in `D9` is the join the sketch calls `bl.c.pin` — it names
     `res.out`, but the two are the same piece of wire. The claim is allowed
     only when the lead the sketch *did* name cannot make it itself, so a
     resistor with both ends in holes still reports one right join and one
     stray rather than two connections with the same id. */
  if (!want) {
    const mate = mateOf(terminal);
    const theirs = mate
      ? expected.find((c) => c.from === mate || c.to === mate)
      : undefined;
    if (mate && theirs && fits(theirs, mate, target)) {
      const mateTarget = attachmentOf(lampTopology, placement, mate);
      if (!mateTarget || !fits(theirs, mate, mateTarget)) want = theirs;
    }
  }

  if (want) {
    return {
      id: want.id,
      from: terminal,
      to: target,
      role: want.role,
      medium: "leg",
      /* Derived per connection, never hardcoded per branch: the label must name
         where the leg actually went. */
      ...(want.label !== undefined
        ? { label: labelFor(want, nodes[target]) }
        : {}),
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

export function lampSceneFrom(
  placement: Placement,
  mechanical: MechanicalState = lampAtRest,
): CircuitScene {
  if (process.env.NODE_ENV !== "production") {
    /* Every literal placement in this repo typechecks as `Placement`, because
       its key type is `string`. A part-keyed leftover would draw an empty board
       and throw nothing, so it is caught here instead of in review. */
    const stray = Object.keys(placement).filter(
      (key) => !lampTerminals.includes(key as LampTerminal),
    );
    if (stray.length)
      throw new Error(`lampSceneFrom: not a terminal — ${stray.join(", ")}`);
  }

  const nodes: Record<NodeId, CircuitNode> = { ...boardNodes };

  /* 1 · POSITION. Walk out from the board holes; a part with no path to one is
        in the kit and emits nothing. Every anchor's target is already a node
        when it is reached, because `anchorsFor` returns them in that order. */
  for (const a of anchorsFor(lampTopology, placement)) {
    const anchor = nodes[a.target];
    if (!anchor) continue;
    const at =
      a.part === "led"
        ? ledOriginFrom(
            anchor,
            a.terminal === "led.cathode" ? "cathode" : "anode",
            a.intoHole,
          )
        : resistorOriginFrom(
            anchor,
            a.terminal === "res.out" ? "right" : "left",
            a.intoHole,
          );

    /* 2 · EMIT. BOTH leads, whichever one anchors the part — `lampArtOrigins`
          reads the part's position back off `led.cathode` / `res.in`, so a part
          that emitted only its anchoring lead would silently stop being drawn
          the moment it was hung off the other one. */
    if (a.part === "led") {
      nodes["led.cathode"] = {
        id: "led.cathode",
        kind: "terminal",
        label: "−",
        ...pinAt(at, ledPins.cathode),
      };
      nodes["led.anode"] = {
        id: "led.anode",
        kind: "terminal",
        label: "+",
        ...pinAt(at, ledPins.anode),
      };
    } else {
      nodes["res.in"] = {
        id: "res.in",
        kind: "terminal",
        label: "220Ω",
        ...pinAt(at, resistorPins.left),
      };
      nodes["res.out"] = {
        id: "res.out",
        kind: "terminal",
        label: "220Ω",
        ...pinAt(at, resistorPins.right),
      };
    }
  }

  /* 3 · OBSERVE. Exactly the non-null entries, one `Connection` each. Nothing
        is manufactured: a join exists because a person made it, and for no
        other reason. */
  const observed: Connection[] = [];
  for (const terminal of lampTerminals) {
    const target = placement[terminal];
    if (!target) continue;
    /* Invariant 3 — a join whose endpoints are not both on the bench is absent
       rather than drawn to nowhere. `prune` normally makes this unreachable;
       it stays because `lampSceneFrom` is also called with hand-written
       literals from the briefing and the lab. */
    if (!nodes[terminal] || !nodes[target]) continue;
    observed.push(connectionFor(terminal, target, nodes, placement));
  }

  return { nodes, expected, observed, mechanical, interchangeable: INTERCHANGEABLE };
}

/** The finished build: every part where the sketch says it belongs. */
export const breathingLamp: CircuitScene = lampSceneFrom(lampComplete);

/* --- The spec ------------------------------------------------------------ */

/**
 * Where a free lead offers itself to a pointer and to the picker.
 *
 * A pitch and a half up the leg, never the lead's own node. A seated LED's free
 * long leg sits 0.5208 scene units from `board.D13` — one twentieth of a hole —
 * and any hit test that puts the two in the same space decides this chapter's
 * central gesture by rounding, in whichever direction it happens to be biased.
 * Electrically the lead is still its node; this is only where you take hold of
 * it, and it is also where its mark is drawn, so aiming and reading agree.
 */
const GRAB_RISE = PITCH * 1.5;

export const lampGrabPoint = (n: CircuitNode) =>
  n.kind === "terminal" ? { x: n.x, y: n.y - GRAB_RISE } : { x: n.x, y: n.y };

/**
 * Pull whatever is in the hole out of it first.
 *
 * `tryAttach` refuses an occupied hole, and this recipe has to be able to reach
 * the finished lamp from any state the person can leave the bench in — so the
 * blocker, which is by definition a lead the sketch does not want there, is
 * pulled loose as part of the fix rather than left to make the fix a silent
 * no-op.
 *
 * Widened twice. First from "only the middle join's `res.in`" to both hole
 * branches, because the hazard was identical on each. Then from "another lead
 * of the SAME part" to any lead at all, when hole exclusivity stopped being a
 * sibling-only rule.
 */
function freeing(
  placement: Placement,
  terminal: LampTerminal,
  hole: NodeId,
): Placement {
  return lampTerminals
    .filter((u) => u !== terminal && placement[u] === hole)
    .reduce((p, blocker) => attach(lampTopology, p, blocker, null), placement);
}

/* What a drag straight off the kit shelf commits — the two leads the origin
   geometry is written for, and the two the steps name first. Named once,
   because `anchorMark` has to mark the same lead `anchorOf` lands. */
const LAMP_ANCHOR = {
  led: "led.cathode",
  resistor: "res.out",
} as const satisfies Record<(typeof PARTS)[number], LampTerminal>;

/** Where each lead comes out of its part's own drawn box, in Wokwi's pixels. */
const ART_PINS: Record<LampTerminal, readonly [number, number]> = {
  "led.cathode": ledPins.cathode,
  "led.anode": ledPins.anode,
  "res.in": resistorPins.left,
  "res.out": resistorPins.right,
};

/**
 * What the part itself prints beside a lead.
 *
 * The LED's two legs are a polarity and the part says so; the resistor's are
 * the same piece of wire twice (`INTERCHANGEABLE`), and putting `220Ω` on one
 * end would invent a distinction the component does not make.
 */
const ART_LABELS: Partial<Record<LampTerminal, string>> = {
  "led.cathode": "−",
  "led.anode": "+",
};

export const lampPlacement: PlacementSpec = {
  ...lampTopology,
  componentOf: { led: "led", resistor: "resistor" },
  anchorOf: LAMP_ANCHOR,
  leadGlyph: (terminal) => ART_LABELS[terminal as LampTerminal],
  anchorMark: (part) => {
    const terminal = LAMP_ANCHOR[part as keyof typeof LAMP_ANCHOR];
    /* Placed at the origin: the answer is a point inside the part's box, and
       the shelf draws that box at its own scale wherever it likes. */
    return {
      ...pinAt({ x: 0, y: 0 }, ART_PINS[terminal]),
      ...(ART_LABELS[terminal] ? { label: ART_LABELS[terminal] } : {}),
    };
  },
  empty: lampEmpty,
  complete: lampComplete,
  sceneFrom: lampSceneFrom,
  grabPoint: lampGrabPoint,

  satisfying: (placement, connectionId) => {
    const want = expected.find((c) => c.id === connectionId);
    if (!want) return null;
    /* IDEMPOTENT BY ENDPOINT: made from the other side, it is already true.
       Writing it again would record one physical join twice. */
    if (placement[want.from] === want.to || placement[want.to] === want.from)
      return null;

    if (want.id === "bl.c.cathode")
      return attach(
        lampTopology,
        freeing(placement, "led.cathode", "board.GND"),
        "led.cathode",
        "board.GND",
      );
    if (want.id === "bl.c.pin")
      return attach(
        lampTopology,
        freeing(placement, "res.out", "board.D9"),
        "res.out",
        "board.D9",
      );

    /* "I fixed it" always lands on the geometry this chapter is drawn for: the
       resistor hole-seated at D9, the LED hanging off it. Not merely "seat it
       if it is off the bench" — a resistor held up only by a join would be
       re-anchored by the fix and the finished lamp would be drawn floating. */
    let next = placement;
    if (next["res.out"] !== "board.D9")
      next = attach(
        lampTopology,
        freeing(next, "res.out", "board.D9"),
        "res.out",
        "board.D9",
      );
    if (!onBench(lampTopology, next, "led"))
      next = attach(lampTopology, next, "led.cathode", "board.GND");
    /* Let go of whatever is holding `res.in`, from EITHER side, or `attach`
       below refuses a lead it does not consider free. Unconditional, because a
       join is stored once on the lead that made it: an LED hung off `res.in`
       records the edge on `led.cathode`, so `next["res.in"]` is null while the
       lead is anything but free — and the guard that used to stand here read
       only that one direction. "I fixed it" then lit up, committed an
       identical placement, and announced a join it had not made, for ever.
       `attach(…, null)` clears both directions in one call. */
    next = attach(lampTopology, next, "res.in", null);
    return attach(lampTopology, next, "led.anode", "res.in");
  },

  /** A removal, which `satisfying` cannot express. Demo control only. */
  clearing: (placement, connectionId, edge) => {
    if (!connectionId.startsWith(EXTRA_PREFIX)) return null;
    const terminal = connectionId.slice(EXTRA_PREFIX.length) as TerminalId;
    if (!lampTerminals.includes(terminal as LampTerminal)) return null;
    /* The finding is a snapshot. Only remove the join it actually named — the
       lead may hold something else by now, and a stale removal that fired
       anyway would undo the repair the person just made. `null` rather than an
       unchanged placement, so the caller can say "that join has moved" instead
       of announcing a removal that did not happen. */
    if (placement[terminal] !== edge.to && placement[terminal] !== edge.from)
      return null;
    return attach(lampTopology, placement, terminal, null);
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
  x: lampBoardAt.x - PITCH,
  y: lampBoardAt.y - PITCH,
  width: boxOf(frame.uno).width + PITCH * 2,
  height: boxOf(frame.uno).height + PITCH * 2,
};

/**
 * Where each part's artwork sits, read back off the scene.
 *
 * The drawing and the vision overlay both need it, and neither may keep its own
 * idea of where a part is: what the leads are attached to is the only record, so
 * the origin is inverted from the terminal the walk produced rather than stored
 * beside it. Read off `led.cathode` and `res.in` whichever lead anchors the
 * part, which is why `lampSceneFrom` emits both.
 */
export function lampArtOrigins(scene: CircuitScene) {
  const cathode = maybeNode(scene, "led.cathode");
  const resIn = maybeNode(scene, "res.in");
  return {
    board: lampBoardAt,
    led: cathode
      ? {
          x: cathode.x - ledPins.cathode[0] * PX,
          y: cathode.y - ledPins.cathode[1] * PX,
        }
      : undefined,
    resistor: resIn
      ? {
          x: resIn.x - resistorPins.left[0] * PX,
          y: resIn.y - resistorPins.left[1] * PX,
        }
      : undefined,
  };
}

/** W-07 · what a vision result outlines. Only the parts that are on the bench. */
export function lampBoxesFor(scene: CircuitScene): Record<string, Box> {
  const at = lampArtOrigins(scene);
  const boxes: Record<string, Box> = { board: boardBox };

  if (at.led) {
    boxes.led = {
      x: at.led.x - PITCH,
      y: at.led.y - PITCH,
      width: boxOf(frame.led).width + PITCH * 2,
      height: boxOf(frame.led).height + PITCH * 2,
    };
  }
  if (at.resistor) {
    boxes.resistor = {
      x: at.resistor.x - PITCH,
      y: at.resistor.y - PITCH * 1.6,
      width: boxOf(frame.resistor).width + PITCH * 2,
      height: boxOf(frame.resistor).height + PITCH * 3.2,
    };
  }
  return boxes;
}

/** The finished build's boxes — what a briefing frames, one part at a time. */
export const lampPartBox = lampBoxesFor(breathingLamp) as {
  board: Box;
  led: Box;
  resistor: Box;
};

/**
 * What `fitView` should frame.
 *
 * The scene is 1200 x 820 because that is the room the capstone's six parts
 * need. Three parts use a third of it, and fitting to the whole desk opened
 * chapter one at 40% with the build the size of a stamp in the middle.
 *
 * **A constant, deliberately, even though the parts now move.** `fitView`'s
 * memo depends on this box, so a box derived from a live placement would
 * rebuild the viewport's observer every time something was seated — and
 * `Fit view` would frame a different thing before and after each placement.
 *
 * **But the extent of every position the model can produce, not of the finished
 * build.** A part held up by another part's lead stands 55 units clear of it,
 * which puts an LED hung off `res.in` 98.87 above where the finished lamp draws
 * it — above the top edge of a box taken from `lampPartBox` alone. Both the
 * opening fit and `Fit view` frame exactly this box, so the LED a person had
 * just placed was drawn off the top of the canvas with only its leg tips
 * showing, and its grab ring with it. One extra scene is enough to cover it:
 * everything else in this build hangs off a hole, and a part hung off a part
 * that is itself hanging is a cycle `anchorsFor` cannot produce.
 */
const hungFromLead = lampBoxesFor(
  lampSceneFrom({
    ...lampEmpty,
    "res.out": "board.D9",
    "led.cathode": "res.in",
  }),
);

const boxes = [
  ...Object.values(lampPartBox),
  ...Object.values(hungFromLead),
];
const framed = framing(boxes, PITCH * 4);

/** What `fitView` opens on — the padded extent. See `framing`. */
export const lampFitBox = framed.fit;

/**
 * What the briefing film frames — the same box with its padding clipped to the
 * mat, so the film never shows a strip of bare oak past the bench's edge.
 */
export const lampStageBox = framed.stage;

/** Part numbers, printed on the parts and the same in every language. */
export const lampPartNumbers = {
  board: "Arduino Uno",
  led: "5 mm LED",
  resistor: "220Ω",
} as const;
