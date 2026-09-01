import type {
  CircuitNode,
  CircuitScene,
  MechanicalState,
  NodeId,
} from "@/lib/circuit/graph";
import type { KitId } from "@/lib/projects/catalog";

/**
 * What every lead is attached to, and what a build made of attached leads is.
 *
 * ## Why a lead and not a part
 *
 * A part does not go somewhere; each of its **leads** does. Keyed by part, the
 * record could say "the LED is in GND" and had no way at all to say "and its
 * long leg is clipped to the resistor" — so chapter one's middle join was
 * manufactured by the drawing code the moment both parts happened to be on the
 * bench, and the learner was congratulated for a join nobody made. Keyed by
 * lead, every join in the scene is an act somebody performed, and a join the
 * sketch does not ask for is sayable rather than invisible.
 *
 * ## Why a target and not a coordinate
 *
 * A lead's position is **what it is attached to**, never a pair of numbers, and
 * a part's position is resolved by walking out from the board holes across the
 * joins — still never a pair of numbers, and now a strictly larger claim, since
 * a part can be held up by another part. Storing pixels would put a fourth
 * coordinate system beside the three `wokwi.ts` reconciles — viewBox units,
 * 96dpi pixels, scene units — and it would be the first of the four to drift.
 *
 * It also makes the product's central claim cheap: `observed` is *derived* from
 * the attachments, so a lead in the wrong hole **is** a wrong connection. The
 * fault the agent finds is the one the person made, with no second record of it
 * anywhere.
 *
 * ## What a spec must not break
 *
 * Three invariants, none of them expressible in the type:
 *
 *   1. **`sceneFrom` reuses `expected`'s connection id for a join the sketch
 *      actually asks for** — the same lead reaching the same thing — and mints
 *      a stable id for any other. `comparedTo`, `isResolved`, the success trace
 *      and `stepParts` all match connections by id; a scene that invented a new
 *      id for a join the sketch names would break every one of them silently,
 *      and one that reused an expected id for a join it does not name would
 *      hide the mistake inside the report of a different one.
 *   2. **`mechanical` is carried through, never reset.** Harmless on a build
 *      with nothing that turns; the day this shape is reused for the capstone,
 *      resetting it would quietly un-turn the servo horn.
 *   3. **A connection whose endpoints are not both on the bench is simply
 *      absent from `observed`.** It is not a connection to nowhere. `diff()`
 *      then reports it as missing, which is the truth.
 */

/** Which part, in a build's own vocabulary: `"led"`, `"resistor"`. */
export type PartId = string;

/** One of a part's leads: `"led.cathode"`, `"res.in"`. */
export type TerminalId = NodeId;

/**
 * What each lead is attached to: a board hole, another part's free lead, or
 * `null` — nothing, the lead is loose.
 */
export type Placement = Readonly<Record<TerminalId, NodeId | null>>;

/**
 * A build's vocabulary, split out from the spec on purpose.
 *
 * A build declares its topology, uses it inside its own `sceneFrom`, and then
 * spreads it into the spec — which needs `sceneFrom`. Keeping the two in one
 * object would be a module-init cycle, evaluated as `undefined` at import and
 * discovered as a blank canvas.
 */
export interface PlacementTopology {
  /** The parts the person places, in the order the steps ask for them. */
  parts: readonly PartId[];
  /** Every placeable lead, in the order the steps ask for them. */
  terminals: readonly TerminalId[];
  /** A part's leads, in PRIORITY order — the first one seated in a hole anchors it. */
  terminalsOf: Readonly<Record<PartId, readonly TerminalId[]>>;
  /**
   * Every board hole a lead may go into, ordered the way they read on screen.
   *
   * The order is the arrow-key order, so it is left-to-right rather than by pin
   * number: an Uno's header counts *down* from left to right, and walking
   * `D0, D1, D2…` would send ArrowRight travelling leftwards across the board.
   */
  holes: readonly NodeId[];
  /**
   * Parts with no rigid body.
   *
   * Everything else here is a rigid body positioned from exactly one anchoring
   * lead: seat one end and the artwork says where the other one is. A cable is
   * two ends and some wire between them, and its ends are independent — so a
   * build positions each of them from its own seat, and neither of them may be
   * clipped to anything. Naming the exception here rather than in the drawing
   * is what lets `tryAttach` refuse the gesture out loud instead of accepting a
   * join the picture then cannot show.
   *
   * Absent on a build made only of rigid parts, which is every build before
   * chapter two.
   */
  flexible?: readonly PartId[];
}

export interface PlacementSpec extends PlacementTopology {
  /**
   * Which kit component each part is — what the rail shows and names.
   *
   * `KitId` rather than `ComponentId`, because a bench holds things the ladder
   * does not count: chapter two's four jumper cables are placed exactly the
   * way its LEDs are, and a shelf that could not name them would be a shelf
   * you can take a part off and not be told what you are holding.
   */
  componentOf: Readonly<Record<PartId, KitId>>;
  /** The lead a part committed straight off the kit shelf lands on. */
  anchorOf: Readonly<Record<PartId, TerminalId>>;
  /**
   * Where that lead comes out of the part's own drawn box, and what the part
   * prints beside it.
   *
   * The kit shelf commits **one** of a part's leads and the shelf drew the
   * whole part, so there was nothing on screen saying which of an LED's two
   * legs was about to land in the hole under the cursor. The person aims, and
   * the answer arrives after they let go.
   *
   * In the part's box in scene units, so the shelf can put a mark on it without
   * knowing anything about this build's parts — the same box `componentOf`
   * names the artwork for. `label` is what is printed on the component itself
   * (`−`, `+`), omitted where the two ends are the same thing and naming one
   * would be a distinction the part does not make.
   */
  anchorMark: (part: PartId) => { x: number; y: number; label?: string };
  /**
   * What the part prints beside one of its leads — `−`, `+`.
   *
   * `undefined` where the part makes no such distinction: a 220Ω resistor's
   * two ends are one piece of wire (`CircuitScene.interchangeable` says so out
   * loud), and a badge calling one of them `A` would be the interface asserting
   * a difference the component does not have.
   *
   * Not the node's `label`: that is what the *scene* prints, and for the
   * resistor it is `220Ω` on both ends — four characters, identical, and no
   * help at all to somebody choosing between them.
   */
  leadGlyph: (terminal: TerminalId) => string | undefined;
  /** Nothing on the bench. */
  empty: Placement;
  /** Every lead where the sketch says it belongs. */
  complete: Placement;
  sceneFrom: (
    placement: Placement,
    mechanical: MechanicalState,
  ) => CircuitScene;
  /**
   * The placement that makes one EXPECTED connection true.
   *
   * **A demo control, not a learner's affordance.** This used to be what "I
   * fixed it" committed: the button reached over and made the finding true, so
   * a person who had done nothing was told they had put it right, and the one
   * claim the product rests on — *the thing on screen is the thing on your
   * desk* — was broken by the panel that exists to defend it. The learner's
   * button is a read now (`check`), and this is reachable only from the demo
   * menu, which says out loud that it is driving the build.
   *
   * Not `holeFor(connectionId)`: chapter one's middle join runs from the LED's
   * leg to the resistor's and names no hole at all. Asking for the hole would
   * have no answer; asking for the placement always does.
   *
   * `null` means declined — an id this build does not name, or a join that is
   * already true. A caller cannot tell that from a returned-unchanged record.
   */
  satisfying: (placement: Placement, connectionId: string) => Placement | null;
  /**
   * The placement that removes one UNEXPECTED join.
   *
   * Takes the endpoints, not just the id: a finding is a snapshot, and by the
   * time "I removed it" runs the lead it names may hold something else. A
   * removal that cannot check what it is removing is a destructive command with
   * a stale argument.
   */
  clearing: (
    placement: Placement,
    connectionId: string,
    edge: { from: NodeId; to: NodeId },
  ) => Placement | null;
  /** Where a FREE lead offers itself to the pointer and to the keyboard. */
  grabPoint: (node: CircuitNode) => { x: number; y: number };
  /**
   * Whether two holes are one piece of metal — a breadboard column, a rail, or
   * the board's several `GND`s.
   *
   * Every build with a breadboard already knows this and used it privately, to
   * decide a cable's join and to read the sketch's lines off the metal. It is
   * on the spec because two questions outside those files need the same answer:
   * `shortedParts` below, and the boot assertion that checks an author's own
   * `complete`.
   *
   * Absent on a build where every hole is its own net — chapter one, whose
   * fifteen header holes are fifteen nodes.
   */
  sameNet?: (a: NodeId, b: NodeId) => boolean;
}

/* --- Reading the record --------------------------------------------------- */

/** Which part a lead belongs to, or `undefined` if it is not a lead at all. */
export function partOf(
  t: PlacementTopology,
  terminal: TerminalId,
): PartId | undefined {
  return t.parts.find((part) => t.terminalsOf[part]?.includes(terminal));
}

export function isHole(t: PlacementTopology, id: NodeId): boolean {
  return t.holes.includes(id);
}

/** Whether a part is drawn end by end rather than from one anchor. */
export function isFlexible(
  t: PlacementTopology,
  part: PartId | undefined,
): boolean {
  return part !== undefined && (t.flexible ?? []).includes(part);
}

/** Every lead attached TO this one. At most one, under `attach`. */
export function inbound(
  t: PlacementTopology,
  p: Placement,
  terminal: TerminalId,
): TerminalId[] {
  return t.terminals.filter((u) => p[u] === terminal);
}

/** Free = nothing attached FROM it and nothing attached TO it. */
export function isFree(
  t: PlacementTopology,
  p: Placement,
  terminal: TerminalId,
): boolean {
  return p[terminal] == null && inbound(t, p, terminal).length === 0;
}

/**
 * What this lead is joined to, whichever side stored the edge.
 *
 * A join is stored once, on the lead that made it. That is a fact about the
 * record and not about the desk — so nothing above this line is allowed to read
 * `p[terminal]` and conclude a lead is unattached.
 */
export function attachmentOf(
  t: PlacementTopology,
  p: Placement,
  terminal: TerminalId,
): NodeId | undefined {
  return p[terminal] ?? inbound(t, p, terminal)[0];
}

/** A part whose own two ends have ended up on one piece of metal. */
export interface PartShort {
  part: PartId;
  /** The two leads, in the order `terminalsOf` names them. */
  terminals: [TerminalId, TerminalId];
  /** What each of them is in. The same net, not necessarily the same hole. */
  at: [NodeId, NodeId];
}

/**
 * Parts with both ends in one net — the rule `bench-parts.md` §12 asks for.
 *
 * ## Why this is not `extras()`' job
 *
 * Put both ends of a resistor on the `−` rail and `extras()` says nothing, and
 * it is right not to: the rail is one node, so the end that is not in the bank
 * genuinely IS making the join the sketch asks for. There is no unexpected
 * connection to report. What is wrong is a step further back — the component is
 * shorted out, current goes round it rather than through it, and the lamp it
 * was protecting is on bare supply.
 *
 * `diff` cannot see it either, for the same reason, so a `complete` that shorts
 * a part gives `0` mismatches and `0` extras and every assertion in the repo
 * passes on it. That is why this is a rule of its own rather than a widening of
 * either: neither of those two questions has this answer in it.
 *
 * Reads attachments rather than the scene, because a short is a fact about
 * where the leads are and holds whether or not the part is drawn. A lead
 * clipped to its own part's other lead counts too — `tryAttach` refuses that
 * gesture as `sameCircuitPart`, but an author's literal does not go through
 * `tryAttach`, and this is one of the two callers that exists to check one.
 */
export function shortedParts(
  /* A `PlacementSpec`, or any topology that can answer the net question. */
  t: PlacementTopology & Pick<PlacementSpec, "sameNet">,
  placement: Placement,
): PartShort[] {
  const sameNet = t.sameNet ?? ((a: NodeId, b: NodeId) => a === b);
  const shorts: PartShort[] = [];
  for (const part of t.parts) {
    const leads = t.terminalsOf[part] ?? [];
    for (let i = 0; i < leads.length; i += 1) {
      for (let j = i + 1; j < leads.length; j += 1) {
        const [a, b] = [leads[i]!, leads[j]!];
        const at = attachmentOf(t, placement, a);
        const to = attachmentOf(t, placement, b);
        if (at === undefined || to === undefined) continue;
        if (at === b || to === a || sameNet(at, to)) {
          shorts.push({ part, terminals: [a, b], at: [at, to] });
        }
      }
    }
  }
  return shorts;
}

/* --- Writing the record --------------------------------------------------- */

/**
 * Why a write did not happen.
 *
 * Named rather than boolean because each one is a different sentence on screen.
 * A gesture the model declines is a thing the person did, and until these
 * existed the only account of it was the part springing back in silence — which
 * is indistinguishable from the gesture not having been noticed at all.
 */
export type Refusal =
  /** Something else is already in that hole. */
  | "holeTaken"
  /** Both ends of one part cannot meet. */
  | "sameCircuitPart"
  /** That lead already has something clipped to it. */
  | "leadNotFree"
  /** A cable end goes in a hole; nothing clips to it and it clips to nothing. */
  | "wireEnd";

/**
 * The result of asking to move a lead — the shape `attach` could never have.
 *
 * `attach` returned `Placement` on success and the *same* `Placement` on every
 * refusal, so no caller could tell them apart: the session logged "You put the
 * LED's short leg in D9" for a drop the model had just declined, and the person
 * watched the part spring back under a sentence saying it had not. Three of the
 * five reported symptoms are that one missing distinction.
 */
export type AttachResult =
  | { kind: "attached"; placement: Placement }
  /** The lead is already exactly there. Nothing to write and nothing to say. */
  | { kind: "unchanged" }
  | { kind: "refused"; reason: Refusal };

/**
 * The store-once rule, enforced on the write — and now able to say no out loud.
 *
 * ## Hole exclusivity
 *
 * A hole holds one lead. This used to be checked only against the *same part*
 * ("a part cannot be shorted to itself"), which left two different parts' leads
 * legally sharing one hole in the Uno's header — a build that cannot exist on a
 * desk, that the drawing renders as two legs in one 1 mm hole, and that
 * `connectionFor` then awards the *expected* connection id, so `verifyStep`
 * ticked green on it. The sibling test is now the special case rather than the
 * only case.
 */
export function tryAttach(
  t: PlacementTopology,
  p: Placement,
  terminal: TerminalId,
  target: NodeId | null,
): AttachResult {
  const cleared: Record<TerminalId, NodeId | null> = Object.fromEntries(
    inbound(t, p, terminal).map((u) => [u, null]),
  );

  if (target === null) {
    if (p[terminal] == null && inbound(t, p, terminal).length === 0) {
      return { kind: "unchanged" };
    }
    return {
      kind: "attached",
      placement: { ...p, ...cleared, [terminal]: null },
    };
  }

  if (attachmentOf(t, p, terminal) === target) return { kind: "unchanged" };

  if (isHole(t, target)) {
    /* Whose lead is in that hole, ignoring this one — the lead being moved is
       allowed to be put back where it already is (that is `unchanged` above,
       and it must not be reported as the hole being taken by itself). */
    const occupied = inbound(t, p, target).some((u) => u !== terminal);
    if (occupied) return { kind: "refused", reason: "holeTaken" };
  } else {
    /* A cable, on either side of the gesture. A flexible part is drawn from its
       two seats and from nothing else, so a cable end hanging off a leg — or a
       leg hanging off a cable end — is a join with no picture: the model would
       accept it, `anchorsFor` would call the part anchored, and the drawing
       would have to invent a body to hang it from. Refused ahead of the two
       tests below, because "both ends of one part cannot meet" and "that lead
       is taken" are both the wrong sentence for it. */
    if (isFlexible(t, partOf(t, terminal)) || isFlexible(t, partOf(t, target))) {
      return { kind: "refused", reason: "wireEnd" };
    }
    /* A lead of the same part is a short, one step further along than two
       leads in one hole. */
    if (partOf(t, target) === partOf(t, terminal)) {
      return { kind: "refused", reason: "sameCircuitPart" };
    }
    /* One edge per lead, so `inbound` can never return two and the drawing can
       never have to decide which of them holds a part up. */
    if (!isFree(t, p, target)) {
      return { kind: "refused", reason: "leadNotFree" };
    }
  }
  return {
    kind: "attached",
    placement: { ...p, ...cleared, [terminal]: target },
  };
}

/**
 * `tryAttach`, for the callers that genuinely have nothing to say about a
 * refusal: the assertion block, `candidatesFor`'s hypothetical release, and the
 * spec recipes. Everything a person can reach goes through `tryAttach`.
 */
export function attach(
  t: PlacementTopology,
  p: Placement,
  terminal: TerminalId,
  target: NodeId | null,
): Placement {
  const result = tryAttach(t, p, terminal, target);
  return result.kind === "attached" ? result.placement : p;
}

/** Pull a lead out of whatever holds it, whichever side the edge is stored on. */
export function detach(
  t: PlacementTopology,
  p: Placement,
  terminal: TerminalId,
): Placement {
  return attach(t, p, terminal, null); // `attach` already clears inbound
}

/* --- Walking out from the board ------------------------------------------- */

export interface Anchor {
  part: PartId;
  /** The part's own lead that holds it up. */
  terminal: TerminalId;
  /** A board hole id, or another part's terminal id. */
  target: NodeId;
  intoHole: boolean;
}

/**
 * Which parts are on the bench, and what holds each one up — in an order in
 * which every anchor's target is already positioned when it is reached.
 *
 * A part not in the returned list has no path to a board hole: it is in the
 * kit. That is the whole of the position model, and it is why nothing else in
 * the codebase is allowed to decide whether a part is on the bench by looking
 * at one of its leads.
 *
 * Cycle-freedom is structural rather than checked: pass 2 only anchors a part
 * whose target part is already anchored, `seen` admits each part once, and the
 * outer loop is bounded by the number of parts.
 */
export function anchorsFor(t: PlacementTopology, p: Placement): Anchor[] {
  const order: Anchor[] = [];
  const seen = new Set<PartId>();
  const take = (a: Anchor) => {
    seen.add(a.part);
    order.push(a);
  };

  /* Pass 1 — a lead in a hole fixes its part. Holes outrank joins, always:
     the board is the one thing in the scene that cannot move, and a part with
     a lead in it is standing in the board however else it is also touched. */
  for (const part of t.parts) {
    for (const terminal of t.terminalsOf[part] ?? []) {
      const target = p[terminal];
      if (target && isHole(t, target)) {
        take({ part, terminal, target, intoHole: true });
        break;
      }
    }
  }

  /* Pass 2 — relax across joins, in BOTH directions, because a join is stored
     once and the lead that stored it is not necessarily the hanging one. */
  for (let round = 0; round < t.parts.length; round += 1) {
    let grew = false;
    for (const part of t.parts) {
      if (seen.has(part)) continue;
      for (const terminal of t.terminalsOf[part] ?? []) {
        const out = p[terminal];
        if (out && !isHole(t, out) && seen.has(partOf(t, out) ?? "")) {
          take({ part, terminal, target: out, intoHole: false });
          grew = true;
          break;
        }
        const back = t.terminals.find(
          (u) =>
            p[u] === terminal &&
            partOf(t, u) !== part &&
            seen.has(partOf(t, u) ?? ""),
        );
        if (back) {
          take({ part, terminal, target: back, intoHole: false });
          grew = true;
          break;
        }
      }
    }
    if (!grew) break;
  }
  return order;
}

export function onBench(
  t: PlacementTopology,
  p: Placement,
  part: PartId,
): boolean {
  return anchorsFor(t, p).some((a) => a.part === part);
}

export function partsInKit(t: PlacementTopology, p: Placement): PartId[] {
  const bench = new Set(anchorsFor(t, p).map((a) => a.part));
  return t.parts.filter((part) => !bench.has(part));
}

/**
 * Stated once, here: **the placement never carries an edge the scene will not
 * draw.**
 *
 * A join between two parts that have lost every path to a board hole is not
 * remembered — putting one of them back must not resurrect the other part and a
 * connection nobody made this time round. Every writer goes through this, so
 * the record and the drawing cannot disagree about which joins exist.
 */
export function prune(t: PlacementTopology, p: Placement): Placement {
  const bench = new Set(anchorsFor(t, p).map((a) => a.part));
  const offBench = (id: NodeId) =>
    !isHole(t, id) && !bench.has(partOf(t, id) ?? "");
  const next: Record<TerminalId, NodeId | null> = { ...p };
  for (const terminal of t.terminals) {
    const target = next[terminal];
    if (!target) continue;
    if (!bench.has(partOf(t, terminal) ?? "") || offBench(target))
      next[terminal] = null;
  }
  return next;
}

/**
 * Everywhere this lead may go: the holes, plus every FREE lead of a DIFFERENT
 * part that is on the bench.
 *
 * Computed against the placement with this lead already let go. Otherwise the
 * one place it is currently attached to is the one place it may not be put back
 * — `isFree` would see this lead's own edge and refuse — and a pointer released
 * over it would fall through to the nearest hole instead.
 *
 * `bench.has(...)` and the recomputation from `p0` are both load-bearing: a
 * lead belonging to a part in the kit has no node, and offering it hands the
 * picker a candidate with no coordinates.
 */
export function candidatesFor(
  t: PlacementTopology,
  p: Placement,
  terminal: TerminalId,
): NodeId[] {
  const p0 = attach(t, p, terminal, null);
  const part = partOf(t, terminal);
  const bench = new Set(anchorsFor(t, p0).map((a) => a.part));
  /* Cables are out of this on both sides, matching `tryAttach`'s `wireEnd`
     refusal: a flexible part's end has nowhere to go but a hole, and it is
     never a place for somebody else's lead to go. Offering either would draw a
     target the write refuses — the one thing §8 of `docs/bench-parts.md` says a
     picker must never do. */
  const leads = isFlexible(t, part)
    ? []
    : t.terminals.filter(
        (u) =>
          partOf(t, u) !== part &&
          !isFlexible(t, partOf(t, u)) &&
          bench.has(partOf(t, u) ?? "") &&
          isFree(t, p0, u),
      );
  /* A hole holds one lead, whosever it is — the same rule `tryAttach` enforces
     on the write. Offering an occupied hole as a candidate would draw a mark
     the model refuses, which is a target you can aim at and cannot hit. */
  const holes = t.holes.filter((h) => inbound(t, p0, h).length === 0);
  return [...holes, ...leads];
}

/* --- What a write actually did -------------------------------------------- */

/**
 * The consequences of one placement change, read off the two records.
 *
 * The session used to narrate a gesture from its own *arguments* — "you asked
 * to put this lead in D9, so I will say you put this lead in D9" — which is a
 * sentence about the intention rather than about the build. It survived a write
 * that was refused, and it stayed silent about everything the write knocked
 * over: a join stored on the other lead coming apart, a part losing its last
 * path to a hole and going back in the box, and a second part that was hanging
 * off *that* one going with it.
 *
 * So the sentences are derived from here instead. One reader, one truth, and a
 * consequence nobody asked about is exactly the thing that has to be said out
 * loud.
 */
export interface PlacementEffects {
  changed: boolean;
  /** The named lead went into a board hole. */
  seated?: { terminal: TerminalId; hole: NodeId };
  /** The named lead was clipped onto another part's lead. */
  joined?: { terminal: TerminalId; lead: TerminalId };
  /** The named lead ended up holding nothing. */
  loosened?: TerminalId;
  /**
   * Joins that came apart that the gesture did not name — the other side of a
   * store-once edge, and anything `prune` dropped.
   */
  brokeJoins: { from: TerminalId; to: NodeId }[];
  /** Parts that lost their last path to a board hole. */
  leftBench: PartId[];
  /** Parts that gained one. */
  enteredBench: PartId[];
}

export function effectsOf(
  t: PlacementTopology,
  before: Placement,
  after: Placement,
  /** The lead the gesture named, so the headline can be told from the fallout. */
  subject?: TerminalId,
): PlacementEffects {
  const moved = t.terminals.filter((u) => (before[u] ?? null) !== (after[u] ?? null));
  const wasOn = new Set(anchorsFor(t, before).map((a) => a.part));
  const nowOn = new Set(anchorsFor(t, after).map((a) => a.part));

  const effects: PlacementEffects = {
    changed: moved.length > 0,
    brokeJoins: [],
    leftBench: t.parts.filter((part) => wasOn.has(part) && !nowOn.has(part)),
    enteredBench: t.parts.filter((part) => !wasOn.has(part) && nowOn.has(part)),
  };

  if (subject) {
    const landed = after[subject] ?? null;
    if (landed && isHole(t, landed)) {
      effects.seated = { terminal: subject, hole: landed };
    } else if (landed) {
      effects.joined = { terminal: subject, lead: landed };
    } else if (attachmentOf(t, before, subject) !== undefined) {
      effects.loosened = subject;
    }
  }

  for (const u of moved) {
    if (u === subject) continue;
    const was = before[u];
    if (was && after[u] == null) effects.brokeJoins.push({ from: u, to: was });
  }
  return effects;
}
