"use client";

import type { ReactNode } from "react";
import type {
  CircuitNode,
  CircuitScene,
  Connection,
  Highlight,
  NodeId,
} from "@/lib/circuit/graph";
import type { PartId, TerminalId } from "@/lib/circuit/placement";
import type { WireRole } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";
import { comparedTo, maybeNode } from "@/lib/circuit/graph";
import { DeskSurface } from "@/components/canvas/desk-surface";
import { Breadboard } from "@/components/canvas/parts/breadboard";
import { UnoBoard } from "@/components/canvas/parts/uno-board";
import {
  Wire,
  WireLabels,
  type PlacedWireLabel,
  type WireTone,
} from "@/components/canvas/wire";
import { placeWireLabels } from "@/lib/circuit/routing";
import {
  CorrectionCallout,
  TargetPinMark,
  WrongPinMark,
} from "@/components/canvas/overlays/pin-rings";
import {
  MARK_GROUND,
  SeatPicker,
} from "@/components/canvas/overlays/seat-picker";
import {
  CarriedLeadMark,
  LeadPicker,
} from "@/components/canvas/overlays/lead-picker";
import { usePartDrag } from "@/components/canvas/use-part-drag";
import { PITCH } from "@/lib/circuit/geometry";
import { bench } from "@/components/illustration/spec";
import type { BenchHandling } from "@/components/canvas/lamp-scene";

/**
 * A breadboard bench, drawn — for whichever chapter is standing on it.
 *
 * This was `traffic-light-scene.tsx`, and every line of behaviour in it is
 * still chapter two's. What changed is that the six part names, the two boxes,
 * the four cables and the three lamp colours left the file: a chapter hands
 * over a `BenchSpec` and the view no longer knows what it is drawing. Chapters
 * three, four and five each write a table of parts instead of a nine-hundred
 * line component, and the one thing that must stay true of this change is that
 * **chapter two looks exactly as it did**.
 *
 * The layer order is every other view's — grid → substrate → parts → wires →
 * labels → handles → overlays — and the `BenchHandling` it consumes is chapter
 * one's, so somebody who learned to move a lead there has learned to move one
 * here. What is particular to a breadboard bench, and is why this is not the
 * lamp's view with a flag on it:
 *
 *   · **The breadboard is the join.** Nearly every connection on a bench like
 *     this is a lead standing in its own hole, which is a wire of no length at
 *     all; `standsInTheBoard` draws none of them. What a person sees is *parts
 *     in holes*, which is what a breadboard is.
 *   · **Some of the parts are cables.** A jumper's body is no more a
 *     `Connection` than a resistor's body is: it is art, drawn between the
 *     cable's own two lead nodes. Everything the model records about a cable is
 *     where its two ends are attached.
 *   · **And some are modules on flying leads.** A sensor or a servo has a case
 *     that stands where it stands and leads that go wherever they are put; the
 *     gap between the two is a drawn strand, which is art for the same reason a
 *     cable's body is.
 *   · **A cable bends and a leg does not.** Dragging a rigid part moves the
 *     whole part and everything hanging off it, because a leg is a fixed path
 *     inside an artwork. Dragging a cable end — or a module's lead — moves
 *     *that end*, and the rest stays where it was.
 */

/* --- What a chapter hands over -------------------------------------------- */

type Point = { x: number; y: number };

/**
 * Where the build's artwork sits, read back off the graph — never stored.
 *
 * The build's own `…ArtOrigins`, narrowed to what a drawing needs. A part's
 * position is what its leads are attached to and nothing else, so this is a
 * function of the scene rather than a record kept beside it.
 */
export interface BenchOrigins {
  /** Top-left of the Uno's artwork. */
  board: Point;
  /**
   * Left edge of the breadboard's plastic.
   *
   * Optional so that a build with no breadboard can use this view without
   * inventing a coordinate for one; absent means the plastic is not drawn.
   */
  breadboard?: Point;
  /**
   * Per part: the top-left of its box, or **absent while it is in the kit**.
   *
   * Absent is load-bearing — it is what "not on the bench" looks like to a
   * drawing, and the reason nothing here needs a second opinion about which
   * parts have been placed. A cable has no entry at all, ever: it has no box,
   * so there is no corner for one to be the top-left of.
   */
  parts: Readonly<Partial<Record<PartId, Point>>>;
}

/**
 * How a part behaves under a hand — a fact about the *picture*, which is why it
 * lives here and not on the placement spec.
 *
 * The model has its own `flexible`, and it answers a different question: what
 * may be clipped onto what. Two parts can share that answer and still be drawn
 * and dragged differently, which is exactly the case a module on leads makes.
 */
export type BenchBody<Live> =
  /**
   * A rigid component: one body, legs that cannot bend. Travels whole with
   * everything hanging off it, reaches `PartHandle`, and is gripped by its box.
   */
  | {
      kind: "rigid";
      /** The grab rect, and the origin a drag keeps its grip on. */
      box: { width: number; height: number };
      draw: (at: Point, live: Live, part: PartId) => ReactNode;
    }
  /**
   * A two-ended cable: no body at all. Each end is seated on its own, only the
   * end in hand moves, it never reaches `PartHandle`, and its body is art drawn
   * between its own two lead nodes.
   */
  | {
      kind: "cable";
      /**
       * The two ends, in the order the build's `terminalsOf` names them, so
       * this and the anchor agree about which end of a cable is "the" end.
       */
      ends: readonly [TerminalId, TerminalId];
      role: WireRole;
    }
  /**
   * A module whose case stands still and whose leads do not: a PIR on jumpers,
   * a soil probe on a cable, a servo. `docs/bench-parts.md` §12's first open
   * item, closed the cheap way — the case is a constant the build declares, so
   * there is nothing about it for the placement model to hold.
   *
   * It drags like a cable (only the lead in hand moves) and draws like a rigid
   * part (there is a body), and the gap between the two is one strand per lead.
   */
  | {
      kind: "module";
      /**
       * Its leads, in the order the build's `terminalsOf` names them.
       *
       * Written down rather than asked of `handling.leadsOf`, because the
       * strands have to be drawn on the views that have no handling at all —
       * the briefing film, the compare pane, the inspection camera — and a
       * module whose wires appeared only on the live bench would be a different
       * part in the picture a person is shown first.
       */
      leads: readonly TerminalId[];
      /**
       * The case's own box.
       *
       * Present for the same reason a rigid part's is: without it the case is a
       * picture, and a picture is indistinguishable from a missed press. Click
       * a lamp and you are asked which lead; click the largest object on the
       * bench and the canvas pans. A drag off the case still commits the
       * anchor lead — the case itself never moves, which `carriedTo` enforces.
       */
      box: { width: number; height: number };
      /** Where a lead leaves the case, given the case's own origin. */
      rootOf: (terminal: TerminalId, at: Point) => Point | undefined;
      /**
       * What each strand is drawn as — per lead, not per part.
       *
       * A cable has one role because it is one wire. A module's leads are three
       * different wires and a real one colours them: red to power, brown to
       * ground, orange to the pin that carries the answer. Drawing all three
       * the same would throw away the one cue on the bench that says which of
       * them is which without reading a label.
       */
      roleOf: (terminal: TerminalId) => WireRole;
      draw: (at: Point, live: Live, part: PartId) => ReactNode;
    };

export interface BenchPart<Live> {
  /** The build's own `PartId` — the same word `handling.partOf` answers. */
  id: PartId;
  body: BenchBody<Live>;
}

export interface BenchSpec<Live = void> {
  origins: (scene: CircuitScene) => BenchOrigins;
  /**
   * Every part, **in paint order**, which is behaviour rather than tidiness: a
   * rigid part's grab rect covers its whole box, so a part drawn later sits
   * over its neighbour's rect. Chapter two draws its resistors before its
   * lamps for exactly that reason — an LED lies in the row above and its rect
   * would otherwise swallow the resistor beneath it.
   */
  parts: readonly BenchPart<Live>[];
  /**
   * Print the addresses a person is told out loud: `F7`, `−1`.
   *
   * On for a chapter whose corrections are holes, which is every chapter that
   * has a breadboard so far — but it is `Breadboard`'s own flag and a build
   * that names pins instead should be able to say so.
   */
  holeAddresses?: boolean;
}

/* One array, not a fresh one per render: `SeatPicker` keys an effect on this
   array's identity, and every view but the live bench has nothing to offer. */
const NO_TARGETS: CircuitNode[] = [];

/**
 * What a press on a part's **body** is carrying, as a drag id.
 *
 * Chapter one's tag, and it is needed for the same reason: a press on a lead
 * handle already says which lead and a press on the body does not, so a drag
 * resolves the tag to `anchorOf` and a *click* asks which lead instead of
 * assuming one.
 */
const BODY = "part:";
const bodyOf = (id: string) =>
  id.startsWith(BODY) ? id.slice(BODY.length) : undefined;

const STILL = { x: 0, y: 0 };

export function BreadboardBenchView<Live = void>({
  spec,
  live,
  scene,
  showLabels,
  highlight,
  entering,
  targets,
  picking,
  onSeat,
  onRemove,
  onCancelPick,
  choosing,
  onPickLead,
  onCancelChoose,
  handling,
  reference,
  successTrace,
}: {
  /** The chapter's own parts, and how to draw them. */
  spec: BenchSpec<Live>;
  /**
   * Whatever this build's parts are drawn *doing* — which of three lamps is
   * alight, whether one is, where a horn is pointing.
   *
   * Handed to `draw` untouched and never read here. A named `lamps` prop on a
   * view every chapter shares would be chapter two's vocabulary spoken over
   * chapter five's bench.
   */
  live: Live;
  scene: CircuitScene;
  showLabels: boolean;
  highlight?: Highlight;
  /**
   * A part that has just arrived, drawn coming down onto the bench.
   *
   * `PartId` and not a union of one chapter's parts: the briefing's assembly
   * names a beat's arriving part in the build's own vocabulary, and a cable is
   * one of the things that arrives.
   */
  entering?: PartId;
  targets?: CircuitNode[];
  picking?: {
    lead: TerminalId;
    blocked?: readonly CircuitNode[];
    attached?: NodeId;
    hover?: NodeId;
    aimAt: (target: CircuitNode) => { x: number; y: number };
    nameFor: (target: CircuitNode) => string;
    release?: string;
  };
  onSeat?: (target: NodeId) => void;
  onRemove?: () => void;
  onCancelPick?: () => void;
  choosing?: PartId;
  onPickLead?: (terminal: TerminalId) => void;
  onCancelChoose?: () => void;
  /** Moving a lead that is already on the bench. Live workbench only. */
  handling?: BenchHandling;
  reference?: CircuitScene;
  successTrace?: string[];
}) {
  const differences = reference ? comparedTo(scene, reference) : [];
  /* `comparedTo` iterates the REFERENCE, so a join the sketch never named is
     structurally invisible to it and would fall through to `dimmed` — the
     neutral grey that reads as "correct, and not what we are discussing" about
     the one connection nobody asked for. */
  const differing = new Set(differences.map((c) => c.id));
  if (reference) {
    for (const got of scene.observed) {
      if (!reference.observed.some((want) => want.id === got.id))
        differing.add(got.id);
    }
  }

  /**
   * **A part standing in a hole is already drawn; the drawing of it is the
   * part.**
   *
   * Chapter one's rule, and a breadboard bench is made of the case it was
   * written for: nearly every join here is a lead in its own hole, which is a
   * connection with no length at all. Handed to the router, each one drew a
   * moulded plug housing stacked on the part's own base with a pill planted on
   * top of it — one per lead, across a breadboard.
   *
   * Suppress a join whose two ends are the **same point**, and nothing else. A
   * leg bent a whole hole sideways is a different build and is drawn.
   */
  const standsInTheBoard = (from: Point, to: Point) =>
    Math.hypot(to.x - from.x, to.y - from.y) < PITCH * 0.6;

  /* Where the parts are is read back off the graph, not kept beside it: what
     each lead is attached to is the only record. A part with no path to a hole
     has no origin and is not drawn — which is what "still in the kit" looks
     like to a drawing. */
  const at = spec.origins(scene);
  /* Where the finished build puts things. The compare view needs it for the
     parts that are not on the bench yet — which, on the state these chapters
     open in, is all of them. */
  const refAt = reference ? spec.origins(reference) : undefined;

  const bodyOfPart = new Map(spec.parts.map((p) => [p.id, p.body] as const));
  const kindOf = (part: PartId | undefined) =>
    part ? bodyOfPart.get(part)?.kind : undefined;
  /** Whole-part travel is the rigid body's alone. */
  const travelsWhole = (part: PartId | undefined) => kindOf(part) === "rigid";

  /**
   * The origins a drag can keep its grip on.
   *
   * Rigid parts only, and the two exclusions are the same fact said twice: a
   * cable has no drawn box, and a module's box does not move — so neither of
   * them is something a hand takes hold of by its middle. Their leads grip
   * their own nodes instead, which is where they are.
   */
  const gripAt: Record<PartId, Point | undefined> = {};
  for (const p of spec.parts) {
    if (p.body.kind === "rigid") gripAt[p.id] = at.parts[p.id];
  }

  const noop = () => {};

  /**
   * The lead a drag id commits.
   *
   * Identity for a lead handle; `anchorOf` for a part's body — the lead the
   * standoff geometry is written around, which is what dragging a part by its
   * middle has always committed.
   */
  const leadOf = (id: string): TerminalId => {
    const part = bodyOf(id);
    return (part ? handling?.anchorOf(part) : undefined) ?? id;
  };

  const { held, bind, hitRadius } = usePartDrag({
    locate: (clientX, clientY) =>
      handling?.toScene(clientX, clientY) ?? { x: 0, y: 0 },
    toScene: handling?.toScene ?? (() => ({ x: 0, y: 0 })),
    scale: handling?.scale ?? (() => 1),
    targets: targets ?? NO_TARGETS,
    targetsFor: handling ? (id) => handling.candidatesFor(leadOf(id)) : undefined,
    aimAt: handling?.aimAt,
    /* The aim comes from the tip of the lead being committed, never from the
       pointer and never from `aimAt` — which lifts a lead half a pitch off its
       own hole and would read a barely-moved gesture as a miss. */
    aimOrigin: (id) => {
      const n = maybeNode(scene, leadOf(id));
      return n ? { x: n.x, y: n.y } : undefined;
    },
    onPick: (id) => handling?.onPick(leadOf(id)),
    onSettle: (id) => {
      const part = bodyOf(id);
      if (part) handling?.onChoosePart(part);
      else handling?.onSettle(id);
    },
    onHover: handling?.onHover ?? noop,
    onDrop: (id, aim) => handling?.onRelease(leadOf(id), aim),
  });

  const heldLead = held ? leadOf(held.id) : undefined;
  const heldPart = heldLead ? handling?.partOf(heldLead) : undefined;
  const moving = heldPart
    ? [heldPart, ...(handling?.dependentsOf(heldPart) ?? [])]
    : [];
  const delta = held?.moved
    ? { x: held.at.x - held.from.x, y: held.at.y - held.from.y }
    : undefined;

  /**
   * How far a lead has travelled from where the graph still says it is.
   *
   * **The one place a breadboard bench parts company with chapter one's drag.**
   * A leg is a fixed-length path inside an artwork and cannot bend, so a rigid
   * part travels whole and every part hanging off it travels with it. A cable
   * is two ends and some wire, and a module is a case and three leads: the end
   * in your hand moves and everything else stays plugged in where it was.
   * Moving them all would drag a seated end out of its hole with no gesture to
   * account for it, and then snap it back on the drop.
   */
  const shiftOf = (id: NodeId, part: PartId | undefined) => {
    if (!delta || !part || !moving.includes(part)) return STILL;
    /* Asked of the part IN HAND, not of the part this node belongs to. A cable
       or a module travels by one lead, and anything that were ever hanging off
       it would have to travel by that lead too — reading the drawn part's own
       kind would move a rigid dependent the whole delta while only one end of
       its holder had moved. Unreachable today (`tryAttach` refuses a join to a
       flexible lead) and a trap for the chapter that changes that. */
    return travelsWhole(heldPart) ? delta : heldLead === id ? delta : STILL;
  };

  /** Where a rigid part is drawn: its resolved origin, or the cursor while carried. */
  const carriedTo = (part: PartId, origin: Point) => {
    if (!held || !delta || !moving.includes(part)) return origin;
    /* A module's case is a constant. It is on the bench or it is not; it is
       never in the air, however many of its leads are. */
    if (!travelsWhole(part)) return origin;
    return part === heldPart
      ? { x: held.at.x - held.offset.x, y: held.at.y - held.offset.y }
      : { x: origin.x + delta.x, y: origin.y + delta.y };
  };

  /** The same lead, drawn where the hand has it rather than where it was. */
  const carriedEnd = (n: CircuitNode, part: PartId) => {
    const shift = shiftOf(n.id, part);
    return shift.x || shift.y
      ? { ...n, x: n.x + shift.x, y: n.y + shift.y }
      : n;
  };

  /**
   * What is in the air, as node-id prefixes: a rigid part being carried makes
   * no joins, because both ends of a join move with the part that owns them and
   * the graph will not know until the drop.
   *
   * The stems are taken from the parts' own leads rather than from a second
   * table of prefixes — `led.red.cathode` minus its last segment is
   * `led.red.`, the same slice `findings.ts` takes to name a lead's owner. For
   * a cable or a module it is the dragged lead alone: nothing else moved, and
   * every other join is still the truth.
   */
  const lifted = delta
    ? moving.flatMap((part) => {
        if (!travelsWhole(heldPart)) return heldLead ? [heldLead] : [];
        const lead = handling?.leadsOf(part)[0];
        return lead ? [lead.slice(0, lead.lastIndexOf(".") + 1)] : [];
      })
    : undefined;

  const inTheAir = (connection: Connection) =>
    lifted?.some(
      (stem) =>
        connection.from.startsWith(stem) || connection.to.startsWith(stem),
    ) ?? false;

  /**
   * The joins that actually draw, resolved before the render.
   *
   * Built up here rather than inside the map, because the pills have to be
   * placed against **each other** and a wire cannot see its neighbours. Sorted
   * with the subject last, so it crosses over the drained ones rather than
   * under them.
   */
  const wires = [...scene.observed]
    .sort((a, b) => {
      const rank = (c: Connection) =>
        highlight?.connectionId === c.id ? 1 : 0;
      return rank(a) - rank(b);
    })
    .flatMap((connection) => {
      /* A join can outlive the part it was made with — the graph is rebuilt
         when something moves, and a render can land between. */
      const from = maybeNode(scene, connection.from);
      const to = maybeNode(scene, connection.to);
      if (!from || !to) return [];
      if (inTheAir(connection)) return [];
      /* **Before the highlight, on purpose.** The join the agent is pointing at
         on a bench like this is almost always a lead standing in a hole, and
         there is no cable there to paint red — painting one would put back
         exactly the stacked housings `standsInTheBoard` exists to remove. What
         says it instead is the vocabulary `WrongPinMark` already speaks: a disc
         on the hole, with the callout above it. */
      if (standsInTheBoard(from, to)) return [];

      const isSubject = highlight?.connectionId === connection.id;
      const dimmed =
        (Boolean(highlight?.connectionId) && !isSubject) ||
        (Boolean(reference) && !differing.has(connection.id));
      return [
        {
          connection,
          from,
          to,
          state: (isSubject
            ? "mismatch"
            : dimmed
              ? "dimmed"
              : "normal") as WireTone,
          /* Only a connection carrying its OWN label prints, and there is no
             fall-back to the role's noun: the few joins with any length on a
             bench like this are components' own legs reaching a rail, and a
             column of pills reading `Ground` down one rail would name the
             wire's colour rather than anything a person is deciding. */
          named:
            showLabels &&
            Boolean(connection.label) &&
            !dimmed &&
            !highlight?.connectionId &&
            !differing.has(connection.id),
        },
      ];
    });

  /**
   * Each cable, as the two points it runs between.
   *
   * `undefined` where the cable is still in the box. One end seated is enough —
   * a build gives a half-placed cable's loose end its slack, so there is
   * something to see and something to take hold of and finish with.
   */
  const endsOf = (
    ends: readonly [TerminalId, TerminalId],
    graph: CircuitScene = scene,
  ) => {
    const a = maybeNode(graph, ends[0]);
    const b = maybeNode(graph, ends[1]);
    return a && b ? { a, b } : undefined;
  };

  /** The joins a lead is currently making, by id. */
  const joinsFrom = (terminals: readonly TerminalId[]) =>
    scene.observed.filter((c) => terminals.includes(c.from));

  /**
   * The art between a part and where its leads went: a cable's own body, or a
   * module's strands.
   *
   * Neither is a `Connection`, no more than a resistor's body is. What the
   * model records about them is where their ends are attached, and nothing
   * else; this is the picture of that.
   */
  const strands: {
    key: string;
    part: PartId;
    from: CircuitNode;
    to: CircuitNode;
    role: WireRole;
    state: WireTone;
    trace: boolean;
  }[] = [];

  for (const p of spec.parts) {
    const body = p.body;
    if (body.kind === "cable") {
      const ends = endsOf(body.ends);
      if (!ends) continue;
      const joins = joinsFrom(body.ends);
      strands.push({
        key: p.id,
        part: p.id,
        from: carriedEnd(ends.a, p.id),
        to: carriedEnd(ends.b, p.id),
        role: body.role,
        /* Drained to grey when the compare view has nothing to say about this
           cable, exactly as a matched wire is. Never `mismatch`, though: the
           body is the PART, and a misplaced part is marked at the hole it
           reached and not tinted — chapter one does not paint the LED red
           either. Where it belongs is said by the ghost below. */
        state: (reference && !joins.some((c) => differing.has(c.id))
          ? "dimmed"
          : "normal") as WireTone,
        /* The success pulse has to have something to run along. The join it
           names — a cable end standing in `D13` — is zero length and draws
           nothing, and the cable is the only thing on screen that is the shape
           of a signal going somewhere. */
        trace: joins.some((c) => successTrace?.includes(c.id)),
      });
      continue;
    }
    if (body.kind !== "module") continue;

    /* A module's case is only on the bench once one of its leads is, which is
       exactly what an absent origin says. */
    const origin = at.parts[p.id];
    if (!origin) continue;
    for (const terminal of body.leads) {
      const node = maybeNode(scene, terminal);
      const root = body.rootOf(terminal, origin);
      if (!node || !root) continue;
      /* A lead that has not been seated yet IS its own root — the build hangs
         it at the point it leaves the case, so there is something real to take
         hold of. There is no wire between those two points and none is drawn:
         handed to the router, a zero-length strand puts a moulded plug housing
         on a bare pin, which is a cable that is not there.
         Measured on the endpoint that is DRAWN and not on the stored one: the
         moment such a lead is picked up it HAS moved, and testing the graph's
         node instead would leave the ring travelling across the bench with no
         wire behind it until the drop. */
      const end = carriedEnd(node, p.id);
      if (standsInTheBoard(root, end)) continue;
      const joins = joinsFrom([terminal]);
      strands.push({
        key: `${p.id}:${terminal}`,
        part: p.id,
        from: { id: `${terminal}.root`, kind: "terminal", ...root },
        to: end,
        role: body.roleOf(terminal),
        state: (reference && !joins.some((c) => differing.has(c.id))
          ? "dimmed"
          : "normal") as WireTone,
        trace: joins.some((c) => successTrace?.includes(c.id)),
      });
    }
  }

  /* Where the finished build's cables run, for the compare view.
     Without them that view shows almost nothing: nearly every join on a bench
     like this is a lead standing in a hole, so `comparedTo`'s routes are all
     zero-length and all filtered out below. */
  interface Ghost {
    key: string;
    from: CircuitNode;
    to: CircuitNode;
    role: WireRole;
    label?: string;
  }

  const refStrands: Ghost[] = [];
  if (reference) {
    for (const p of spec.parts) {
      const body = p.body;
      if (body.kind === "cable") {
        const ends = endsOf(body.ends, reference);
        /* Only where the bench does not already agree: a ghost drawn over a
           cable that is exactly where it belongs is an annotation about
           nothing. */
        const differs = differences.some((want) =>
          body.ends.includes(want.from),
        );
        if (!ends || !differs) continue;
        /* The pin the sketch names, taken off the reference's own connection —
           `GND`, `D13`. It is the whole of what this annotation has to say, and
           the ghost cable's own path is the one place it fits. */
        const label = reference.observed.find(
          (c) => body.ends.includes(c.from) && c.label,
        )?.label;
        refStrands.push({
          key: p.id,
          from: ends.a,
          to: ends.b,
          role: body.role,
          ...(label ? { label } : {}),
        });
        continue;
      }
      if (body.kind !== "module") continue;
      /* A module's case does not move, so its ghost is one strand per lead the
         bench has in the wrong place — drawn from the same point on the case
         the real one leaves, to the seat the sketch asks for.
         Read from the REFERENCE when the module is still in the box, exactly as
         the cable branch above does: a compare view that says nothing at all
         about the part the chapter is named after is the one state it has to be
         useful in. */
      const origin = at.parts[p.id] ?? refAt?.parts[p.id];
      if (!origin) continue;
      for (const want of differences) {
        if (!body.leads.includes(want.from)) continue;
        const root = body.rootOf(want.from, origin);
        const seat = maybeNode(reference, want.to);
        if (!root || !seat) continue;
        refStrands.push({
          key: `${p.id}:${want.from}`,
          from: { id: `${want.from}.root`, kind: "terminal", ...root },
          to: seat,
          role: body.roleOf(want.from),
          ...(want.label ? { label: want.label } : {}),
        });
      }
    }
  }

  /* The reference routes that actually draw. The same guard as the bench, and
     the reference needs it more: in a finished build every lead IS its hole, so
     an unguarded reference route is a dashed stub under a pill lying across the
     board's own silkscreen — on every bench where the part is not placed yet,
     which is the state these chapters open in. */
  const refRoutes = differences.flatMap((want) => {
    if (!reference) return [];
    const from = maybeNode(reference, want.from);
    const to = maybeNode(reference, want.to);
    return from && to && !standsInTheBoard(from, to) ? [{ want, from, to }] : [];
  });

  /**
   * Every pill in this view, placed in one pass so that none covers another.
   *
   * One pass over what is there and what belongs there **together**, the way
   * `circuit-scene.tsx` does it and never per wire: a pill cannot see its
   * neighbours, and these builds fan several cables onto adjacent header pins.
   * Draw order is the tie-break, so it is the order the drawing is made in —
   * current first, annotation second.
   */
  const subjects = [
    ...wires
      .filter((wire) => wire.named)
      .map((wire) => ({
        key: wire.connection.id,
        from: wire.from,
        to: wire.to,
        text: wire.connection.label!,
        /* The pill sits on the path that is drawn, and a leg's path is not a
           jumper's — nine units apart at this size. */
        medium: wire.connection.medium,
        tone: wire.state,
      })),
    ...(showLabels
      ? refRoutes
          .filter(({ want }) => Boolean(want.label))
          .map(({ want, from, to }) => ({
            key: `ref-${want.id}`,
            from,
            to,
            text: want.label!,
            medium: want.medium,
            tone: "target" as WireTone,
          }))
      : []),
    ...(showLabels
      ? refStrands
          .filter(({ label }) => Boolean(label))
          .map(({ key, from, to, label }) => ({
            key: `ref-${key}`,
            from,
            to,
            text: label!,
            medium: "jumper" as const,
            tone: "target" as WireTone,
          }))
      : []),
  ];
  const labelAt = placeWireLabels(subjects);
  const labels: PlacedWireLabel[] = subjects.map((subject) => ({
    key: subject.key,
    ...labelAt[subject.key],
    text: subject.text,
    tone: subject.tone,
  }));

  /**
   * One handle per lead the scene draws.
   *
   * Sorted left to right and then down rather than taken in `scene.nodes` order
   * — that order is the anchor walk's, which part holds which one up, and
   * nobody reads a bench in it. The same order the candidate list is sorted in,
   * so the two keyboard routes onto this bench agree about what "next" means.
   */
  const leads = handling
    ? Object.values(scene.nodes)
        .filter(
          (n) => n.kind === "terminal" && handling.partOf(n.id) !== undefined,
        )
        .sort((a, b) => a.x - b.x || a.y - b.y)
    : [];

  /* The same answer the picker draws its marks at and the drag aims at. Without
     `handling` — the reference, the briefing, the inspection camera — a node is
     its own mark, which is what those views have always drawn. */
  const markAt = (n: CircuitNode) => handling?.aimAt(n) ?? { x: n.x, y: n.y };

  /* While the question "which lead" is on screen, the thing being asked about
     has to stay a picture. */
  const asking = Boolean(choosing && handling);
  const chosenLeads =
    choosing && handling
      ? handling
          .leadsOf(choosing)
          .map((id) => maybeNode(scene, id))
          .filter((n) => n !== undefined)
      : [];

  const errorPin = highlight?.errorPin
    ? maybeNode(scene, highlight.errorPin)
    : undefined;
  const targetPin = highlight?.targetPin
    ? maybeNode(scene, highlight.targetPin)
    : undefined;

  const inert = (part: PartId) =>
    asking || (Boolean(picking && onSeat) && heldPart !== part);

  /* Where the lead in hand stands: its own node, which the scene carries
     exactly when its part is on the bench. A lead still in the kit stands
     nowhere, and the picker then opens on its first candidate as it always
     did. See `SeatPicker.near` for what opening there cost with a bench lead
     in hand. */
  const pickedNode = picking ? maybeNode(scene, picking.lead) : undefined;

  return (
    <>
      <DeskSurface />

      {/* The plastic, and every hole the build emits — including regions that
          are drawn and never offered. What may be aimed at is the candidate
          list's answer, and it is a shorter list than this one. */}
      {at.breadboard ? (
        <Breadboard
          at={at.breadboard}
          addresses={spec.holeAddresses ?? false}
          holes={Object.values(scene.nodes).filter(
            (n) => n.kind === "breadboard-hole",
          )}
          showLabels={showLabels}
        />
      ) : null}

      <UnoBoard at={at.board} />

      {/* Every part with a body, in the spec's own paint order — which is the
          order that decides whose grab rect sits over whose. A cable appears
          here as nothing: its body is drawn in the strand layer below.

          No label over a part, either. The hole it stands in is printed on the
          board under it, and a label naming a hole a part is not in is the one
          thing a canvas of real proportions must never do. */}
      {spec.parts.map((p) => {
        if (p.body.kind === "cable") return null;
        const draw = p.body.draw;
        const origin = at.parts[p.id];
        if (!origin) {
          /* Still in the box. The compare view draws it where it belongs —
             three dashed strands converging on bare desk would be an
             annotation about nothing — and every other view draws nothing,
             which is what "still in the kit" looks like. */
          const ghost = refAt?.parts[p.id];
          return ghost ? (
            <g key={p.id} opacity={0.32} style={{ pointerEvents: "none" }}>
              {draw(ghost, live, p.id)}
            </g>
          ) : null;
        }
        return (
          <PartHandle
            key={p.id}
            part={p.id}
            box={p.body.box}
            /* A module's case is a constant, and `carriedTo` says so: it hands
               the origin straight back for anything that does not travel
               whole. So the case answers a press without ever moving under
               one, and the drag it starts commits its anchor lead. */
            at={carriedTo(p.id, origin)}
            entering={entering === p.id}
            handling={handling}
            inert={inert(p.id)}
            bind={bind}
          >
            {(pos) => draw(pos, live, p.id)}
          </PartHandle>
        );
      })}

      {/* **A cable's body is art, not a join.** No more a `Connection` than a
          resistor's body is: it is drawn between the cable's own two lead
          nodes, which buys the sag and both moulded housings from the drawing
          the rest of the product already uses. It is never in `scene.observed`
          — what the model records about a cable is where its two ends are
          attached, and nothing else. A module's strands are the same claim
          about the same kind of object. */}
      {strands.map((strand) => (
        <g
          key={strand.key}
          className={entering === strand.part ? "motion-settle" : undefined}
        >
          <Wire
            connection={{
              id: `art.${strand.key}`,
              from: strand.from.id,
              to: strand.to.id,
              role: strand.role,
              medium: "jumper",
            }}
            from={strand.from}
            to={strand.to}
            state={strand.state}
            trace={strand.trace}
          />
        </g>
      ))}

      {wires.map((wire) => (
        <Wire
          key={wire.connection.id}
          connection={wire.connection}
          from={wire.from}
          to={wire.to}
          state={wire.state}
          trace={successTrace?.includes(wire.connection.id)}
        />
      ))}

      {/* The finished build, laid over the top. An annotation rather than a
          cable, so it belongs above the build: under it, a route one hole away
          from the real one would be hidden by that very one. */}
      {refStrands.map((ghost) => (
        <Wire
          key={`ref-${ghost.key}`}
          connection={{
            id: `ref.${ghost.key}`,
            from: ghost.from.id,
            to: ghost.to.id,
            role: ghost.role,
            medium: "jumper",
          }}
          from={ghost.from}
          to={ghost.to}
          state="target"
        />
      ))}
      {refRoutes.map(({ want, from, to }) => (
        <Wire
          key={`ref-${want.id}`}
          connection={want}
          from={from}
          to={to}
          state="target"
        />
      ))}

      {/* Above every cable and below the lead handles — a pill over a handle is
          a `role="button"` you cannot press, and a jumper across a pill is a
          pill you cannot read. */}
      <WireLabels labels={labels} />

      {/* Every lead you can take hold of, in one layer after every part. SVG
          paints and tabs in document order and each part's transparent grab
          rect is the last child of its own group, so handles written inline
          would sit under the part next to them and would tab in part order
          rather than reading order.

          Gated on `handling` exactly as `PartHandle` is: the briefing's
          `aria-hidden` svg sits over an `inert` region, and twenty focusable
          buttons in it would be a keyboard trap in a chapter's first thirty
          seconds. */}
      {handling
        ? leads.map((n) => {
            const part = handling.partOf(n.id);
            /* The ring is where you would pinch the lead, so it goes where the
               lead goes — including the half of a cable that is not moving. */
            const shift = shiftOf(n.id, part);
            const aim = handling.aimAt(n);
            const x = aim.x + shift.x;
            const y = aim.y + shift.y;
            return (
              <g
                key={n.id}
                role="button"
                /* While the picker is up it owns the keyboard, and every free
                   lead it offers has a mark at exactly this point — two stops
                   with two different names on one pixel otherwise. Not
                   unmounted: `onPick` fires on pointer DOWN, so a handle that
                   disappeared when something was in hand would take the pointer
                   capture of the drag that just started with it. */
                tabIndex={asking || (picking && onSeat) ? -1 : 0}
                aria-label={handling.nameFor(n.id)}
                style={
                  asking || (picking && onSeat)
                    ? { pointerEvents: "none" }
                    : undefined
                }
                className="group cursor-grab outline-none active:cursor-grabbing"
                /* A cable end's grip is the end itself: it has no drawn box to
                   keep its hold on, and where it is IS where its seat is. The
                   same is true of a module's lead, whose case is a constant.
                   `gripAt` has no entry for either, which is the same fact said
                   in the table. */
                {...bind(n.id, part ? gripAt[part] : undefined)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  handling.onPick(n.id);
                }}
              >
                {/* A generous invisible target that still cannot reach its
                    neighbour: on a bench like this the marks are a diagonal
                    half-pitch apart, and `hitRadius` is capped at 45% of that. */}
                <circle cx={x} cy={y} r={hitRadius} fill="transparent" />
                {/* Rule 7: a loose lead is an open ring; an attached one is
                    nothing at all — the part standing in the hole already says
                    so. Gone entirely while the picker is up, because every free
                    lead it offers has a diamond at exactly this point and a
                    ring drawn under one is two marks at one radius. */}
                {/* Dark under light, the same pair the picker's candidates
                    use, and for the same measurement: `bench.label` alone at
                    0.55 is 1.21:1 on breadboard plastic — an open ring nobody
                    can see is not an affordance. The halo is drawn first and
                    slightly wider, so the light ring reads on white plastic and
                    on the board's blue alike. */}
                {[
                  /* Written out rather than built from a value: Tailwind reads
                     the SOURCE for class names, so an interpolated
                     `[stroke-width:${n}]` is a class it never generates — the
                     exact shape of the `ring-focus` bug this batch fixed. */
                  {
                    paint: MARK_GROUND,
                    width: 3,
                    focus:
                      "group-focus-visible:opacity-100 group-focus-visible:[stroke-width:4]",
                  },
                  {
                    paint: bench.label,
                    width: 1.2,
                    focus:
                      "group-focus-visible:opacity-100 group-focus-visible:[stroke-width:2.2]",
                  },
                ].map((ring) => (
                  <circle
                    key={ring.paint}
                    cx={x}
                    cy={y}
                    r={PITCH * 0.42}
                    fill="none"
                    stroke={ring.paint}
                    strokeWidth={ring.width}
                    opacity={
                      handling.free.has(n.id) &&
                      !asking &&
                      !(picking && onSeat) &&
                      heldLead !== n.id
                        ? 0.55
                        : 0
                    }
                    className={ring.focus}
                  />
                ))}
                {/* **This is the one in your hand**, whichever way it got there
                    — dragged, or picked out of the part with the chooser. It
                    stays marked until it lands, or the holes that appear next
                    are the answer to a question with no visible subject. */}
                {(heldLead === n.id && held?.moved) || picking?.lead === n.id ? (
                  <CarriedLeadMark
                    at={{ x, y }}
                    glyph={handling.glyphFor(n.id)}
                  />
                ) : null}
              </g>
            );
          })
        : null}

      {/* Which end of this part am I moving — asked before where it goes, and
          never at the same time as it. */}
      {asking && handling && onPickLead ? (
        <LeadPicker
          leads={chosenLeads}
          aimAt={handling.aimAt}
          glyphFor={handling.glyphFor}
          nameFor={handling.nameFor}
          onPick={onPickLead}
          onCancel={onCancelChoose ?? (() => {})}
        />
      ) : null}

      {/* Under the agent's marks: if the agent is pointing at a hole while a
          lead is in your hand, what it is saying about that hole outranks the
          fact that you could put something there. */}
      {picking && onSeat ? (
        <SeatPicker
          /* One mount per lead in hand: the picker decides where its caret
             opens once, from `attached` and `near`, and a lead picked while
             another was already in hand has to get that decision too. */
          key={picking.lead}
          targets={targets ?? NO_TARGETS}
          blocked={picking.blocked}
          attached={picking.attached}
          near={pickedNode ? { x: pickedNode.x, y: pickedNode.y } : undefined}
          hover={picking.hover}
          carried={Boolean(held?.moved)}
          aimAt={picking.aimAt}
          hitRadius={hitRadius}
          nameFor={picking.nameFor}
          onSeat={onSeat}
          onRelease={onRemove}
          releaseLabel={picking.release}
          onCancel={onCancelPick ?? (() => {})}
        />
      ) : null}

      {/* The agent points at holes, and a hole's occupant can be taken off the
          bench between the finding and the frame that draws it. Marked where
          the mark IS and not where the node is: a lead offers itself half a
          pitch off its own hole, and these were the one representation of a
          terminal still drawn at the raw node. */}
      {errorPin ? <WrongPinMark pin={markAt(errorPin)} /> : null}
      {targetPin ? <TargetPinMark pin={markAt(targetPin)} /> : null}
      {errorPin && targetPin ? (
        <CorrectionCallout
          wrong={errorPin}
          target={targetPin}
          wrongAt={markAt(errorPin)}
          targetAt={markAt(targetPin)}
          /* The address printed on the thing, not a translated noun: this
             renders in `font-mono` beside `F9 → F7`, and a locale string here
             would be the one place the callout stopped speaking the board's
             own language. */
          subject={highlight?.subject ?? errorPin.label ?? errorPin.id}
        />
      ) : null}
    </>
  );
}

/**
 * One placed part, as something you can pick back up — and nothing else.
 *
 * Chapter one's handle, and deliberately the same one: a drag handle with no
 * keyboard contract of its own, because a control called `Move the LED` that
 * commits one *lead* would be a name and an effect that disagree. The keyboard
 * route is the lead handles and the rail, both of which name what they commit.
 *
 * **Only a part with a body that moves reaches here.** A cable has none, and a
 * module's case does not travel — both are taken hold of by their leads. The
 * `box` is handed in rather than looked up, so a part with nothing to grip
 * cannot reach this at all: there is no table left to read `undefined` out of.
 *
 * With no `handling` it is a plain `<g>` and the part is a picture again —
 * which is what the reference, the briefing and the camera get.
 */
function PartHandle({
  part,
  box,
  at,
  entering,
  handling,
  inert,
  bind,
  children,
}: {
  part: PartId;
  box: { width: number; height: number };
  at: { x: number; y: number };
  entering: boolean;
  handling?: BenchHandling;
  /**
   * Something is already in hand, so this is a picture for the moment.
   *
   * A part's grab rect covers its whole box, and without this a press on an
   * occupied hole while holding a different lead falls through to the part
   * standing in it and silently swaps what you are carrying. A gesture that
   * changes its own subject halfway through is not one anybody can aim.
   */
  inert?: boolean;
  bind: (
    terminal: TerminalId,
    origin?: { x: number; y: number },
  ) => Record<string, unknown>;
  children: (at: { x: number; y: number }) => ReactNode;
}) {
  /* A drawn part always has an anchor — that is what put it on the bench — but
     the drawing is read off the graph and the anchor off the placement, and a
     render can land between the two. A picture is the right answer to that, not
     a drag that would commit a lead nobody is holding. */
  const anchor = handling?.anchorOf(part);
  if (!handling || !anchor) {
    return (
      <g className={entering ? "motion-settle" : undefined}>{children(at)}</g>
    );
  }

  return (
    <g
      aria-hidden
      className={cn(
        "cursor-grab active:cursor-grabbing",
        entering && "motion-settle",
      )}
      style={inert ? { pointerEvents: "none" } : undefined}
      /* The BODY, not the anchor lead. A drag resolves it to `anchorOf` and
         behaves exactly as it always has; a click asks which lead. */
      {...bind(BODY + part, at)}
    >
      {children(at)}
      {/* A grabbable target over the whole part: an LED is two legs a pitch
          wide and a lens, and nobody catches a leg with a pointer.

          It does not yield to the holes underneath it, and that is deliberate.
          On chapters three, four and five the LED's 41.7 × 52.1 box covers
          twelve holes — ten of them named by no step — and the dome itself
          hides two. None of the twelve is unreachable: `inert` turns every
          handle off the moment a lead is in hand, and `SeatPicker` paints after
          every part, so the marks sit on top of the dome exactly when they can
          be used. Shrinking the rect to the dome would cost the LED its grip —
          18 × 28 scene units, under 24 CSS px in one axis at the opening fit,
          on the part people pick up most — to fix nothing that is blocked. The
          honest lever is the model's: stop offering top-bank columns the
          sensor's leads never reach, the way chapter two avoided the whole
          question by not offering that bank at all. */}
      <rect
        x={at.x}
        y={at.y}
        width={box.width}
        height={box.height}
        fill="transparent"
      />
    </g>
  );
}
