"use client";

import { useMemo, type ReactNode } from "react";
import type {
  CircuitNode,
  CircuitScene,
  Highlight,
  NodeId,
} from "@/lib/circuit/graph";
import { cn } from "@/lib/utils/cn";
import { comparedTo, maybeNode, node } from "@/lib/circuit/graph";
import { lampArtOrigins } from "@/lib/circuit/breathing-lamp";
import { DeskSurface } from "@/components/canvas/desk-surface";
import { UnoBoard } from "@/components/canvas/parts/uno-board";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import {
  Wire,
  WireLabels,
  type PlacedWireLabel,
} from "@/components/canvas/wire";
import { placeWireLabels } from "@/lib/circuit/routing";
import {
  CorrectionCallout,
  TargetPinMark,
  WrongPinMark,
} from "@/components/canvas/overlays/pin-rings";
import { SeatPicker } from "@/components/canvas/overlays/seat-picker";
import {
  CarriedLeadMark,
  LeadPicker,
} from "@/components/canvas/overlays/lead-picker";
import { usePartDrag } from "@/components/canvas/use-part-drag";
import type { Aim } from "@/components/canvas/drag-math";
import { PITCH } from "@/lib/circuit/geometry";
import { boxOf, frame } from "@/lib/circuit/wokwi";
import { bench } from "@/components/illustration/spec";
import type { PartId, TerminalId } from "@/lib/circuit/placement";

/**
 * What a lead already on the bench can be done to.
 *
 * Absent on every view that is not the live workbench — the briefing's
 * assembly, the reference and the inspection camera all draw this build, and a
 * draggable part in a *photograph* is a control that cannot honour itself.
 *
 * Every question here is answered by the placement model, once, in
 * `live-workbench.tsx`. None of it is worked out from the drawing: which part a
 * lead belongs to, what holds a part up and what is hanging off it are all
 * facts about what is attached to what, and this file has never been allowed to
 * hold a second opinion about that.
 */
export interface BenchHandling {
  toScene: (clientX: number, clientY: number) => { x: number; y: number };
  /** Where a target offers itself. The same answer the picker draws its marks at. */
  aimAt: (target: CircuitNode) => { x: number; y: number };
  /** `Move the LED's long leg` — the name on one lead handle. */
  nameFor: (terminal: TerminalId) => string;
  /** `−`, `+`, or nothing where a part's two ends are the same thing. */
  glyphFor: (terminal: TerminalId) => string | undefined;
  /**
   * A part was **clicked**, and which of its leads is being moved is now a
   * question rather than an assumption.
   *
   * Only from the body, and only from a click: a drag off the body still
   * carries `anchorOf`, because a drag has already started and there is nothing
   * to ask — the hand is holding the part and the geometry says which lead that
   * grip commits.
   */
  onChoosePart: (part: PartId) => void;
  /** The two leads of that part, in the order the scene draws them. */
  leadsOf: (part: PartId) => readonly TerminalId[];
  /** Which part a lead belongs to — for the lift, and for the drag's grip. */
  partOf: (terminal: TerminalId) => PartId | undefined;
  /** The lead that holds a part up. What dragging the part's body commits. */
  anchorOf: (part: PartId) => TerminalId | undefined;
  /** Which parts travel when this one does, for the lift. */
  dependentsOf: (part: PartId) => readonly PartId[];
  /** The leads with nothing attached to them, either way round. */
  free: ReadonlySet<TerminalId>;
  onPick: (terminal: TerminalId) => void;
  /** The press turned out to be a click, and the picker now owns the choice. */
  onSettle: (terminal: TerminalId) => void;
  /** Where this lead may go, asked at the press — see `usePartDrag.targetsFor`. */
  candidatesFor: (terminal: TerminalId) => readonly CircuitNode[];
  onHover: (target: NodeId | null) => void;
  /**
   * Let go of a lead, with what the release actually was.
   *
   * Not `target | null`: a release that landed on nothing used to mean *this
   * lead is loose*, unconditionally, so the failure mode of a mis-aim was
   * silent destruction. `Aim` tells a hole from a near miss from a deliberate
   * lift-away, and only the last of those takes the part off the bench.
   */
  onRelease: (terminal: TerminalId, aim: Aim) => void;
  /** The viewport's zoom, so a screen fact can be turned into a bench one. */
  scale: () => number;
}

/**
 * Which nodes belong to which part.
 *
 * Chapter one's own table, and it earns its place: a part being carried is
 * *off* the bench, so the joins it makes have to go with it — a resistor lifted
 * out of `D9` that leaves its cable behind, still drawn into the hole, is a
 * wire to nothing. The graph does not know a part is in the air (it is rebuilt
 * on the drop, which is the point), so the drawing works it out here.
 */
const PART_NODES: Record<PartId, string> = {
  led: "led.",
  resistor: "res.",
};

const PART_BOX: Record<PartId, { width: number; height: number }> = {
  led: boxOf(frame.led),
  resistor: boxOf(frame.resistor),
};

/* One array, not a fresh one per render: `SeatPicker` keys an effect on this
   array's identity, and every view but the live bench has nothing to offer. */
const NO_TARGETS: CircuitNode[] = [];

/**
 * What a press on a part's **body** is carrying, as a drag id.
 *
 * `usePartDrag`'s id is opaque by contract, and this is the one place that
 * needs two kinds of it: a press on a lead handle already says which lead, and
 * a press on the body does not. Tagging the body lets one gesture serve both —
 * a drag resolves the tag to `anchorOf` and behaves exactly as it always has,
 * and a *click* is answered by asking which lead instead of assuming one.
 *
 * A prefix rather than a second `usePartDrag`: two hooks would mean two `held`
 * states, and the drawing below reads one to decide what is in the air.
 */
const BODY = "part:";
const bodyOf = (id: string) =>
  id.startsWith(BODY) ? id.slice(BODY.length) : undefined;

const STILL = { x: 0, y: 0 };

/**
 * Chapter one, drawn.
 *
 * The same layer order as the capstone — grid → substrate → parts → wires →
 * labels → handles → overlays — with three parts instead of six and no
 * breadboard. It is a
 * separate component rather than a flag on the capstone's scene because the two
 * builds have different *parts*, and a scene view that took a list of which
 * ones to draw would be a switch statement wearing a prop.
 *
 * What is shared is everything that matters: the wire router, the pin marks and
 * the correction callout are the same code, so a learner meeting a misplaced
 * lead here meets the identical vocabulary in chapter six.
 */
export function LampSceneView({
  scene,
  showLabels,
  highlight,
  lit = false,
  breathing = false,
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
  scene: CircuitScene;
  showLabels: boolean;
  highlight?: Highlight;
  /** Whether the sketch is driving the pin. */
  lit?: boolean;
  /** Swelling and fading rather than simply on — what a PWM pin buys. */
  breathing?: boolean;
  /**
   * A part that has just arrived, drawn coming down onto the bench.
   *
   * Here rather than in a second view of its own: the briefing's assembly and
   * the person dropping a part into a hole are the same event seen twice, and
   * a second component drawing this build would be the second opinion about it
   * that this file exists to prevent.
   *
   * `PartId`, not this build's own two parts spelled into a type. The value
   * comes from an `AssemblyBeat`, which two chapters now share — and a beat
   * naming a part this view does not draw is answered by drawing nothing,
   * which is what the comparisons below already do.
   */
  entering?: PartId;
  /**
   * Everywhere the lead in hand may go: board holes, and the free leads of
   * parts already on the bench.
   *
   * Given rather than worked out. This file used to build its own list of
   * holes, which was a second answer to "where may this go" the day the answer
   * stopped being "any hole" — a lead of the same part, or one that already has
   * something clipped to it, is not on offer, and only the placement knows.
   * The drag and the picker are handed the **same** array for the same reason —
   * and the same *identity*: the picker keys an effect on it, so a caller that
   * rebuilds this list per render snatches the keyboard selection back to the
   * first hole mid-choice.
   */
  targets?: CircuitNode[];
  /**
   * A lead is in the person's hand, and every target is offering itself.
   *
   * The canvas does not decide *which* lead — the rail and the lead handles do,
   * because that is where you take hold of one. All this knows is that
   * something is being placed, what it is attached to now if anything, and what
   * to call each target out loud.
   */
  picking?: {
    /** The lead itself, so the bench can keep it marked while you aim. */
    lead: TerminalId;
    /** Leads that would be targets if they were free — see `SeatPicker`. */
    blocked?: readonly CircuitNode[];
    /** Whichever side stored the edge — a hole, or the lead it is joined to. */
    attached?: NodeId;
    /** The target a dragged lead would land on, marked while it is over one. */
    hover?: NodeId;
    aimAt: (target: CircuitNode) => { x: number; y: number };
    nameFor: (target: CircuitNode) => string;
    /** What Delete does, for the picker to say. `Leave the long leg loose`. */
    release?: string;
  };
  onSeat?: (target: NodeId) => void;
  /** Delete: leave this lead loose. Whether it is offered is the caller's call. */
  onRemove?: () => void;
  onCancelPick?: () => void;
  /**
   * A part was clicked and the question on screen is *which of its leads*.
   *
   * The part, not the leads: which leads it has is the placement's answer
   * (`leadsOf`), and a caller passing its own list would be a second opinion
   * about what a part is made of.
   */
  choosing?: PartId;
  onPickLead?: (terminal: TerminalId) => void;
  onCancelChoose?: () => void;
  /** Moving a lead that is already on the bench. Live workbench only — see above. */
  handling?: BenchHandling;
  reference?: CircuitScene;
  successTrace?: string[];
}) {
  const differences = useMemo(
    () => (reference ? comparedTo(scene, reference) : []),
    [scene, reference],
  );
  const differing = useMemo(() => {
    const ids = new Set(differences.map((c) => c.id));
    /* `comparedTo` iterates the REFERENCE, so a join the sketch never named is
       structurally invisible to it and would fall through to `dimmed` — the
       neutral grey that reads as "correct, and not what we are discussing"
       about the one connection nobody asked for. */
    if (reference) {
      for (const got of scene.observed) {
        if (!reference.observed.some((want) => want.id === got.id)) ids.add(got.id);
      }
    }
    return ids;
  }, [differences, reference, scene]);

  /**
   * **A part standing in a hole is already drawn; the drawing of it is the
   * part.**
   *
   * The LED's cathode *is* the ground hole once it is seated — its node is at
   * `board.GND` — so `bl.c.cathode` is a connection with no length at all.
   * Handing the router two coincident points drew a moulded connector housing
   * stacked on the LED's base with a `GND` pill planted on top of it.
   *
   * So: suppress a join whose two ends are the **same point**, and nothing
   * else.
   *
   * It used to suppress more, and the extra clause was a lie the bench told.
   * The rule was "nothing lies between the leg and the hole it claims", which
   * is true of `led.anode → board.D13` (0.52 units, the part standing there)
   * *and* of `led.anode → board.D12` — a leg bent a whole hole sideways, which
   * is a different build. Two reachable placements, one picture, on the exact
   * mistake this chapter is about. The clause was written when every join was
   * drawn as a fat jumper with two plug housings, and a housing on a
   * neighbouring hole covered it; a leg is a thin line now and can simply be
   * drawn.
   */
  const standsInTheBoard = (from: CircuitNode, to: CircuitNode) =>
    Math.hypot(to.x - from.x, to.y - from.y) < PITCH * 0.6;

  /* The reference routes that actually draw, resolved before the render.

     The same guard as the bench, and the reference needs it more: in the
     finished lamp `led.cathode` IS `board.GND`, so `bl.c.cathode` is a
     connection with no length at all. Drawn, it is a 9-unit dashed stub under a
     `GND` pill lying across the board's own `AREF GND 13 12` silkscreen — on
     every bench where the LED is not seated yet, which is the state this
     chapter opens in. A reference connection whose two ends are one point is
     not an annotation about a missing cable; it is the drawing of a part
     standing in a hole, and it goes with its label. */
  const refRoutes = reference
    ? differences
        .map((want) => ({
          want,
          from: node(reference, want.from),
          to: node(reference, want.to),
        }))
        .filter(({ from, to }) => !standsInTheBoard(from, to))
    : [];

  const refLabelled = showLabels
    ? refRoutes.filter(({ want }) => Boolean(want.label))
    : [];
  const refLabelAt = placeWireLabels(
    refLabelled.map(({ want, from, to }) => ({
      key: `ref-${want.id}`,
      from,
      to,
      text: want.label!,
      /* The pill has to sit on the route that is drawn, and every route in
         this chapter is a leg — a jumper's curve puts it nine units off it. */
      medium: want.medium,
    })),
  );
  const refLabels: PlacedWireLabel[] = refLabelled.map(({ want }) => ({
    key: `ref-${want.id}`,
    ...refLabelAt[`ref-${want.id}`],
    text: want.label!,
    tone: "target",
  }));

  /* Where the parts are is read back off the graph, not kept beside it: what
     each lead is attached to is the only record. A part with no path to a board
     hole has no origin, and is not drawn. */
  const at = lampArtOrigins(scene);
  const artAt: Record<PartId, { x: number; y: number } | undefined> = {
    led: at.led,
    resistor: at.resistor,
  };

  /**
   * Carrying a lead that is already on the bench.
   *
   * The same gesture the kit shelf raises, and the same commit — what differs
   * is only what a drop off every target means. Up there it means the part is
   * still in the box; here it means the lead is loose, which is the only way
   * back and has to be as easy as putting it in.
   */
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
    targetsFor: handling
      ? (id) => handling.candidatesFor(leadOf(id))
      : undefined,
    aimAt: handling?.aimAt,
    /**
     * The aim comes from the **tip of the lead being committed** — not from the
     * pointer, and not from the ring you grabbed.
     *
     * A part's whole box is grabbable — an LED is two legs a pitch wide and a
     * lens, and nobody catches a leg with a pointer — so where inside that box
     * the press landed used to decide which hole the part went into, by up to
     * two and a half pitches. The lead's own position is the honest origin, and
     * `carriedTo` adds the pointer's travel to it, so the leg you can see going
     * into the header is the thing the drop is measured from.
     *
     * The tip and not `aimAt`, which lifts a lead `GRAB_RISE` up its leg. That
     * lift is a fact about *targets*: a free lead has to offer itself somewhere
     * other than its own node or it and the hole 0.52 units beneath it are one
     * target — and 1.5 pitches up the leg is where a second lead is physically
     * clipped on anyway. It is not a fact about the thing in your hand. Used as
     * the origin it put a seated lead 15 units from its own hole at rest, so a
     * gesture that barely moved read as a miss, and one that drifted upwards
     * read as *take the part off the bench*.
     */
    aimOrigin: (id) => {
      const n = maybeNode(scene, leadOf(id));
      return n ? { x: n.x, y: n.y } : undefined;
    },
    onPick: (id) => handling?.onPick(leadOf(id)),
    /**
     * The press turned out to be a click.
     *
     * On a lead handle that is "this lead, now where does it go"; on a part's
     * body it is the question this whole overlay exists for, and answering it
     * with `anchorOf` was the bench choosing a leg on the person's behalf.
     */
    onSettle: (id) => {
      const part = bodyOf(id);
      if (part) handling?.onChoosePart(part);
      else handling?.onSettle(id);
    },
    onHover: handling?.onHover ?? noop,
    onDrop: (id, aim) => handling?.onRelease(leadOf(id), aim),
  });

  /* What is in the air. A lead is dragged, but a leg is a fixed-length path
     inside the artwork and neither `Led` nor `Resistor` can bend one — so
     dragging a lead drags the whole part, and every part hanging off that one
     travels with it. Left behind, a hung part would be drawn at a lead it is no
     longer anywhere near, floating, and then snap on the drop. */
  const heldLead = held ? leadOf(held.id) : undefined;
  const heldPart = heldLead ? handling?.partOf(heldLead) : undefined;
  const moving = heldPart
    ? [heldPart, ...(handling?.dependentsOf(heldPart) ?? [])]
    : [];
  const delta = held?.moved
    ? { x: held.at.x - held.from.x, y: held.at.y - held.from.y }
    : undefined;

  /** Where a part is drawn: its resolved origin, or the cursor while carried. */
  const carriedTo = (part: PartId, origin: { x: number; y: number }) => {
    if (!held || !delta || !moving.includes(part)) return origin;
    return part === heldPart
      ? { x: held.at.x - held.offset.x, y: held.at.y - held.offset.y }
      : { x: origin.x + delta.x, y: origin.y + delta.y };
  };

  /* A part in the air makes no joins. */
  const lifted = delta ? moving.map((part) => PART_NODES[part]) : undefined;

  /**
   * One handle per lead the scene draws.
   *
   * Sorted left to right rather than taken in `scene.nodes` order: that order
   * is the anchor walk's — which part holds which one up — and nobody reads a
   * bench in that order. Tab order is reading order.
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

  /* The chooser's badges and leader lines stand over the part they belong to,
     and the part's own grab rect covers its whole box — so while the question
     is on screen, the thing being asked about is a picture. Same rule the seat
     picker already imposes, for the same reason. */
  const asking = Boolean(choosing && handling);
  /* Where the lead in hand stands: its own node, which the scene carries
     exactly when its part is on the bench. A lead still in the kit stands
     nowhere, and the picker then opens on its first candidate as it always
     did. See `SeatPicker.near`. */
  const pickedNode = picking ? maybeNode(scene, picking.lead) : undefined;
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

  return (
    <>
      <DeskSurface />

      <UnoBoard at={at.board} />

      {/* The two parts stand in the header, so they are drawn after the board
          and their legs disappear into it. */}
      {at.resistor ? (
        <PartHandle
          part="resistor"
          at={carriedTo("resistor", at.resistor)}
          entering={entering === "resistor"}
          handling={handling}
          inert={
            asking || (Boolean(picking && onSeat) && heldPart !== "resistor")
          }
          bind={bind}
        >
          {(pos) => <Resistor x={pos.x} y={pos.y} ohms={220} />}
        </PartHandle>
      ) : null}
      {/* No label over the LED. It used to print `D9`, which was the pin the
          *resistor* reaches — and once the parts move, a label naming a hole
          the part is not in is the one thing a canvas of real proportions must
          never do. The joins name themselves off the graph instead. */}
      {at.led ? (
        <PartHandle
          part="led"
          at={carriedTo("led", at.led)}
          entering={entering === "led"}
          handling={handling}
          inert={asking || (Boolean(picking && onSeat) && heldPart !== "led")}
          bind={bind}
        >
          {(pos) => (
            <Led
              x={pos.x}
              y={pos.y}
              colour="red"
              lit={lit}
              breathing={breathing}
            />
          )}
        </PartHandle>
      ) : null}

      {[...scene.observed]
        .sort((a, b) => {
          const rank = (c: typeof a) =>
            highlight?.connectionId === c.id ? 1 : 0;
          return rank(a) - rank(b);
        })
        .map((connection) => {
          /* A join can outlive the part it was made with — the graph is
             rebuilt when something moves, and a render can land between. */
          const from = maybeNode(scene, connection.from);
          const to = maybeNode(scene, connection.to);
          if (!from || !to) return null;

          /* Both ends of a join move with the part that owns them, and the
             graph will not know until the drop. Draw nothing rather than a
             cable running to where the part used to be. */
          if (
            lifted?.some(
              (prefix) =>
                connection.from.startsWith(prefix) ||
                connection.to.startsWith(prefix),
            )
          ) {
            return null;
          }

          /* The part is standing in that hole — see `standsInTheBoard`.

             **Before the highlight, on purpose.** The unasked-for join this
             chapter is about is `led.anode → board.D13` with the cathode in
             GND, and the anode's node IS D13: the "wire" is 0.52 units long.
             There is no cable there to paint red, and painting one would put
             back exactly the two stacked housings the guard above exists to
             remove. What says it instead is the vocabulary `WrongPinMark`
             already speaks — an `--color-wire-error` disc on the hole, with
             every other cable drained to grey around it, which is the same
             device D6 asks for when the anode goes into D7. A join with a
             cable draws that cable red; a join that is a part standing in a
             hole is marked on the hole. Both are the error colour, and which
             one you get is decided by whether there is anything to draw. */
          if (standsInTheBoard(from, to)) return null;

          const isSubject = highlight?.connectionId === connection.id;
          const dimmed =
            (Boolean(highlight?.connectionId) && !isSubject) ||
            (Boolean(reference) && !differing.has(connection.id));
          return (
            <Wire
              key={connection.id}
              connection={connection}
              from={from}
              to={to}
              state={isSubject ? "mismatch" : dimmed ? "dimmed" : "normal"}
              /* **No labels on what is actually there**, which is why nothing
                 on the bench is handed to `WireLabels` below.
                 `uno-board.tsx` settled this for the board's own pins and it
                 is the same argument one level out: the board prints all
                 nineteen names itself, in the right places, so `220Ω → D9`
                 was a second copy of `~9` — and this chapter's parts stand in
                 a 40-unit stretch of header, so the pill covered the build it
                 was captioning. The words go out to a single callout when the
                 agent has something to say (`pin-rings.tsx`), and nowhere
                 else. The reference route below keeps its label, because that
                 one is an annotation about a join that is *not* there. */
              trace={successTrace?.includes(connection.id)}
            />
          );
        })}

      {refRoutes.map(({ want, from, to }) => (
        <Wire
          key={`ref-${want.id}`}
          connection={want}
          from={from}
          to={to}
          state="target"
        />
      ))}

      {/* The words the reference routes carry, above every cable and below the
          lead handles — a pill over a handle is a `role="button"` you cannot
          press, and a jumper across a pill is a pill you cannot read. Chapter
          one prints at most one of these, but it is the capstone's layer and it
          does not get a second set of rules. */}
      <WireLabels labels={refLabels} />

      {/* Every lead you can take hold of, in one layer after both parts.
          SVG paints and tabs in document order, the resistor is drawn before
          the LED, and the LED's transparent grab rect is the last child of its
          own group and covers both its tips — so handles written inline would
          sit *under* it and would tab in part order rather than reading order.

          Gated on `handling` exactly as `PartHandle` is: the briefing's
          `aria-hidden` svg sits over an `inert` region, and four focusable
          buttons in it would be a keyboard trap in the chapter's first thirty
          seconds. */}
      {handling
        ? leads.map((n) => {
            const part = handling.partOf(n.id);
            /* The ring is where you would pinch the leg, so it goes where the
               leg goes: a handle left behind at the node the graph still
               reports would be the same floating artifact `carriedTo` exists
               to prevent, one layer up. */
            const shift =
              part && delta && moving.includes(part) ? delta : STILL;
            const aim = handling.aimAt(n);
            const x = aim.x + shift.x;
            const y = aim.y + shift.y;
            return (
              <g
                key={n.id}
                role="button"
                /* While the picker is up it owns the keyboard, and every free
                   lead it is offering has a mark at exactly this point — so
                   leaving these focusable would put two stops with two
                   different names on one pixel, which is the thing `aimAt`
                   exists to prevent one layer down. Not unmounted: `onPick`
                   fires on pointer DOWN, so a handle that disappeared when
                   something was in hand would take the pointer capture of the
                   drag that just started with it. */
                tabIndex={asking || (picking && onSeat) ? -1 : 0}
                aria-label={handling.nameFor(n.id)}
                /* And it must not take the *pointer* either, for the same
                   reason and on the same condition: while the picker is up
                   every free lead it offers has a catcher at exactly this
                   point, and two overlapping transparent circles are resolved
                   by paint order rather than by aim. The handle stays mounted
                   — `onPick` fires on pointer DOWN, so unmounting it would
                   take the capture of the drag that just started with it — and
                   simply stops being in the way. */
                style={
                  asking || (picking && onSeat)
                    ? { pointerEvents: "none" }
                    : undefined
                }
                className="group cursor-grab outline-none active:cursor-grabbing"
                {...bind(n.id, part ? artAt[part] : undefined)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  handling.onPick(n.id);
                }}
              >
                {/* A generous invisible target — but never one that reaches
                    its neighbour. `PITCH * 0.7` was 31.7 CSS px across on
                    centres 22.4 px apart at the opening fit, so every catcher
                    overlapped the next by 9 px and paint order, not aim,
                    decided which one a press landed on. `hitRadius` is capped
                    at 45% of the real candidate spacing, so it cannot. */}
                <circle cx={x} cy={y} r={hitRadius} fill="transparent" />
                {/* Rule 7: a loose lead is an open ring; an attached one is
                    nothing at all — the wire, or the part standing in the
                    hole, already says so. The focus ring is drawn whatever the
                    state, because four focusable controls with no visible
                    focus is four Tab presses with nothing on screen changing.

                    Gone entirely while the picker is up, on the same condition
                    that took the tab stop away: every free lead it offers has a
                    diamond at exactly this point, and a ring drawn under it
                    turns the one distinction that tells a hole target from a
                    lead target without colour into a ring with a diamond
                    inscribed in it — two marks at one radius, merging outright
                    at 40%. While the picker owns the choice, it owns the
                    marks. */}
                <circle
                  cx={x}
                  cy={y}
                  r={PITCH * 0.42}
                  fill="none"
                  stroke={bench.label}
                  strokeWidth={1.2}
                  opacity={
                    handling.free.has(n.id) &&
                    !asking &&
                    !(picking && onSeat) &&
                    heldLead !== n.id
                      ? 0.55
                      : 0
                  }
                  className="group-focus-visible:opacity-100 group-focus-visible:[stroke-width:2.2]"
                />
                {/* **This is the one in your hand**, whichever way it got
                    there.

                    Dragging: a drag moves the whole part — a leg cannot bend —
                    so both ends travel and nothing said which of them the
                    release was about to commit.

                    Choosing: answering *which lead* used to close the question
                    and leave nothing behind, so the fifteen holes that appeared
                    next were the answer to a question with no visible subject.
                    The lead you picked stays marked until it lands. */}
                {(heldLead === n.id && held?.moved) ||
                picking?.lead === n.id ? (
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

      {/* Under the agent's marks: if the agent is pointing at a pin while a
          lead is in your hand, what it is saying about that pin outranks the
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
          /* A pointer is carrying this lead exactly when a gesture on the
             bench has travelled. Anything else — a click, the rail, the
             keyboard — is the picker owning the choice, and then the candidates
             are the thing the person is looking for and must be legible.

             Not plumbed from the kit shelf, which runs its own gesture in its
             own layer: up there a release on nothing means the part is still
             in the box, so there is nothing for the dimming to warn about. */
          carried={Boolean(held?.moved)}
          aimAt={picking.aimAt}
          hitRadius={hitRadius}
          nameFor={picking.nameFor}
          onSeat={onSeat}
          /* Passed straight through: whether letting go is on offer is a
             question about the placement — a lead with something clipped ONTO
             it is not free either — and it is answered where the placement is
             read, not from what this happens to be drawing. */
          onRelease={onRemove}
          releaseLabel={picking.release}
          onCancel={onCancelPick ?? (() => {})}
        />
      ) : null}

      {/* The agent points at terminals, and a terminal can be taken off the
          bench between the finding and the frame that draws it.

          Marked where the mark IS, not where the node is. A free lead offers
          itself a pitch and a half up its leg — `grabPoint`'s whole reason —
          and these were the one representation of a terminal still drawn at the
          raw node, so the agent's crosshair landed exactly 15 scene units below
          every affordance it was telling you to use. */}
      {errorPin ? <WrongPinMark pin={markAt(errorPin)} /> : null}
      {targetPin ? <TargetPinMark pin={markAt(targetPin)} /> : null}
      {errorPin && targetPin ? (
        <CorrectionCallout
          wrong={errorPin}
          target={targetPin}
          wrongAt={markAt(errorPin)}
          targetAt={markAt(targetPin)}
          /* The pin's own silkscreen word, not a translated noun: `subject`
             renders in `font-mono` beside `D8 → D9`, and `wiringFinding` fills
             it from the same `label`. A locale string here would be the one
             place the callout stopped speaking the board's language — and it
             would have to fit the same 13 mono characters. */
          subject={highlight?.subject ?? errorPin.label ?? errorPin.id}
        />
      ) : null}
    </>
  );
}

/**
 * One placed part, as something you can pick back up — and nothing else.
 *
 * A drag handle with no keyboard contract of its own. It used to be a
 * `role="button"` that answered Enter by handing the part to the seat picker,
 * which was honest while a part went into a hole. It is not any more: a control
 * called `Move the LED` that commits one *lead* — and answers Delete by
 * relocating the part rather than putting it away — is a name and an effect
 * that disagree, on the one gesture the chapter is about. The keyboard route is
 * the lead handles and the rail, both of which name exactly what they commit.
 *
 * So the body drags the lead that is holding the part up, which is what
 * dragging a part on a desk does, and the artwork is hidden from the
 * accessibility tree: it has no name to give and its two leads have their own.
 *
 * With no `handling` it is a plain `<g>` and the part is a picture again —
 * which is what the reference, the briefing and the camera get.
 */
function PartHandle({
  part,
  at,
  entering,
  handling,
  inert,
  bind,
  children,
}: {
  part: PartId;
  at: { x: number; y: number };
  entering: boolean;
  handling?: BenchHandling;
  /**
   * Something is already in hand, so this is a picture for the moment.
   *
   * A part's grab rect covers its whole box and the lead handles go
   * pointer-inert while the picker is up — but this one did not, so pressing an
   * occupied hole while holding a different lead fell through to the part
   * standing in it and silently swapped what you were carrying. A gesture that
   * changes its own subject halfway through is not a gesture anybody can aim.
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
     render can land between the two. A picture is the right answer to that,
     not a drag that would commit a lead nobody is holding. */
  const anchor = handling?.anchorOf(part);
  if (!handling || !anchor) {
    return (
      <g className={entering ? "motion-settle" : undefined}>{children(at)}</g>
    );
  }

  const box = PART_BOX[part];

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
          wide and a lens, and nobody catches a leg with a pointer. */}
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
