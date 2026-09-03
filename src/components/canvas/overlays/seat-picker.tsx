"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PITCH } from "@/lib/circuit/geometry";
import type { CircuitNode, NodeId } from "@/lib/circuit/graph";
import { bench } from "@/components/illustration/spec";
import { nearestTarget, type Point } from "@/components/canvas/drag-math";

/** A press is a press, not a pan, until it has travelled this far in CSS px. */
const PRESS_SLOP = 6;

/**
 * The dark ground every mark in here is drawn on top of.
 *
 * The same value the kit shelf's anchor badge uses, for the same reason: these
 * marks land on white breadboard plastic, on a blue PCB and on the dark mat
 * within one gesture, and no single light colour clears 3:1 on all three.
 */
export const MARK_GROUND = "#10161C";

/**
 * The caret asking to be looked at — the SVG equivalent of `scrollIntoView`.
 *
 * There is no scroll container anywhere on this bench: the pan and the zoom are
 * a CSS transform on a `<g>` inside `CanvasViewport`, so when the arrow walk
 * moves focus onto a `<g>` that is off screen the browser has nothing to
 * scroll and does nothing at all. Measured on the 1440x900 well: after picking
 * a lead up, `closer()` frames the candidates at the 2.43x zoom `zoomToAim`
 * demands and centres rather than fits that box, so 240 of chapter three's 381
 * candidates, 223 of chapter four's 387 and 28 of chapter two's 194 are
 * outside the well. A person walking with ArrowDown was selecting holes that
 * were not on the screen, with `Fit view` — which undoes the very zoom the
 * precision needs — as the only way back.
 *
 * It travels as a context rather than as a prop because the two ends are three
 * files apart and the ones in between are not ours to change: the picker is
 * rendered by `breadboard-bench.tsx` and `lamp-scene.tsx`, which are drawings
 * and have no camera, and the handle lives in the region that owns the well.
 * Absent — the briefing's film, the inspection's frozen frame — the walk simply
 * does not move the view, which is right for a picture.
 *
 * **Only the walk asks.** The mount used to ask as well, from the effect that
 * follows the caret, and on a zoomed breadboard chapter the answer was a pan
 * nobody wanted: a lead attached to nothing opened the caret on index 0 — the
 * board's top-left hole — and the well was brought 609 CSS px across to it,
 * under the hand that had just pressed a leg in column 19 (measured on Chrome
 * 152, chapter two, at 300%). The picker mounts on pointer DOWN, so that pan
 * landed in the middle of a drag as often as under a click. The camera now
 * moves only from the key handlers that move the caret, and the caret opens
 * beside the lead — see `near`.
 */
type KeepCaretInView = (caret: DOMRect, at: { x: number; y: number }) => void;

/**
 * What the camera's owner lends the picker: the pan for a keyboard walk, and
 * the middle of the visible well — where the walk starts for a lead that stands
 * nowhere yet, a kit part picked off the shelf by keyboard, instead of at the
 * board's top-left hole.
 */
interface CaretViewValue {
  keepInView: KeepCaretInView;
  centre?: () => Point | undefined;
}

const CaretView = createContext<CaretViewValue | null>(null);

/**
 * Supplied by whatever owns the camera. See `KeepCaretInView`.
 *
 * `caret` is where the mark is on the screen right now; `at` is the same point
 * in scene units, which is what a camera can actually be pointed at. The
 * provider decides whether the caret is visible at all — only it knows what is
 * painted over the well.
 */
export function CaretViewport({
  keepInView,
  centre,
  children,
}: {
  keepInView: KeepCaretInView;
  centre?: () => Point | undefined;
  children: ReactNode;
}) {
  return <CaretView value={{ keepInView, centre }}>{children}</CaretView>;
}

/**
 * One candidate's mark: a dark halo with the light ring drawn inside it.
 *
 * A plain function rather than a component because it is called up to 387 times
 * per render and returns two nodes; there is no state here for a component to
 * hold.
 */
function candidateMark({
  lead,
  x,
  y,
  r,
  stroke,
  opacity,
}: {
  /** A free lead, drawn as a diamond, rather than a hole drawn as a ring. */
  lead: boolean;
  x: number;
  y: number;
  r: number;
  stroke: number;
  opacity: number;
}) {
  /* Same radius for both shapes, so the two read as one family at one size; a
     different shape, so which one you are on is legible without colour and at
     40% zoom. */
  const shape = (paint: string, width: number, alpha: number) =>
    lead ? (
      <polygon
        points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`}
        fill="none"
        stroke={paint}
        strokeWidth={width}
        opacity={alpha}
      />
    ) : (
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={paint}
        strokeWidth={width}
        opacity={alpha}
      />
    );

  return (
    <>
      {shape(MARK_GROUND, stroke + 1.8, opacity * 0.9)}
      {shape(bench.label, stroke, opacity)}
    </>
  );
}

/**
 * The targets as the rows they are drawn in.
 *
 * Chapter one offers fifteen holes in one line of header, and stepping them one
 * at a time is the whole route. Chapter two offers a hundred and ninety-five:
 * five rows of thirty, a thirty-hole ground rail, and the Uno's header. Walked
 * flat that is about a hundred and fifty ArrowRight presses to cross the board
 * — a keyboard route on paper, which is worse than none, because it is the
 * route rule 14 says has to be as precise as the pointer's.
 *
 * So where a target knows its address, the arrows walk the grid instead: left
 * and right along the row it is in, up and down to the same column of the row
 * next to it. The rows are ordered by where they are on screen, so "down" is
 * down — for chapter two that is `f` … `j`, then the ground rail, then the
 * header, which is the order the eye crosses the bench in.
 *
 * A target with no address — every board pin, and a free lead hanging in the
 * air off another part — goes in one family at the END rather than being filed
 * into a row by its y alone: the header is below the whole breadboard on this
 * bench, and a lead in the air is in no row by construction.
 *
 * Never empty, and the reduce below depends on that: a family exists only
 * because something was put in it.
 */
function familiesOf(targets: readonly CircuitNode[]): CircuitNode[][] {
  const rows = new Map<string, CircuitNode[]>();
  const offGrid: CircuitNode[] = [];

  for (const target of targets) {
    if (target.row === undefined || target.col === undefined) {
      offGrid.push(target);
      continue;
    }
    const row = rows.get(target.row);
    if (row) row.push(target);
    else rows.set(target.row, [target]);
  }

  /* The same order the list itself is in — left to right, then down — so the
     two ways of walking these marks never disagree about what "next" is. */
  const reading = (a: CircuitNode, b: CircuitNode) => a.x - b.x || a.y - b.y;
  const families = [...rows.values()]
    .map((row) => [...row].sort(reading))
    .sort((a, b) => a[0].y - b[0].y);

  if (offGrid.length) families.push([...offGrid].sort(reading));
  return families;
}

/** The target one step along the row, or one row across from this one. */
function neighbourOf(
  families: CircuitNode[][],
  from: CircuitNode,
  along: number,
  across: number,
): CircuitNode | undefined {
  const here = families.findIndex((family) =>
    family.some((member) => member.id === from.id),
  );
  if (here === -1) return undefined;

  if (across === 0) {
    const row = families[here];
    const at = row.findIndex((member) => member.id === from.id);
    return row[(at + along + row.length) % row.length];
  }

  /* Wrapping, like the flat walk it replaces: an arrow that does nothing at
     the edge of the board reads as the bench ignoring the press, and there is
     nothing else for those two keys to mean here. */
  const next = families[(here + across + families.length) % families.length];
  /* Straight down the column where there is one, and by distance where there
     is not — the header has no columns, and its pins do not line up with the
     breadboard's. */
  return (
    next.find((member) => member.col !== undefined && member.col === from.col) ??
    next.reduce((best, member) =>
      Math.abs(member.x - from.x) < Math.abs(best.x - from.x) ? member : best,
    )
  );
}

/**
 * Choosing where the lead in your hand goes.
 *
 * ## The marks carry no words
 *
 * A candidate is a quiet hollow mark and nothing else. `uno-board.tsx` records
 * why: the board prints all nineteen of its pin names itself, in the right
 * places, and a second copy turns `3V3 5V GND GND VIN` into one illegible
 * smear — which is exactly what fifteen labelled candidates one pitch apart
 * would be. The name of the target under the cursor is said in the *accessible*
 * name, where it costs the drawing nothing, and the sentence above the canvas
 * says what you are doing.
 *
 * And it is deliberately **not** `TargetPinMark`. That mark already means "the
 * pin this wire belongs on" — a claim the agent makes about a mistake. A
 * candidate is a different fact: any of these is allowed, including the wrong
 * one, because being able to choose the wrong hole is the entire point.
 *
 * ## Two kinds of target, two shapes
 *
 * A lead may go into a hole in the header, or onto a free lead of another part.
 * Those are different acts with different sentences, so they are different
 * shapes rather than two shades of the same one (rule 7): a ring for a hole, a
 * diamond for a lead. Both are drawn at `aimAt`, which is where the target
 * *offers* itself and not always where it is — a seated LED's free long leg is
 * half a scene unit from `board.D13`, so marking it at its own node would put
 * two roving-tabindex stops, with two different names, on one pixel.
 *
 * ## Rule 14's bill, paid here
 *
 * Dragging is the gesture this replaces for anybody who cannot drag, so it
 * carries the full keyboard contract rather than a partial one: a roving
 * tabindex over the targets in the order they read on screen, arrows to walk
 * them — along the row and between rows where the targets have an address, see
 * `familiesOf` — Home and End, Enter or Space to commit, Escape to put the lead
 * back down without committing, and Delete to let go of whatever is holding it.
 * Delete leaves the lead **loose**; the part goes back to the kit only when
 * that was its last path to a board hole, which the placement decides and this
 * overlay never has to know. Focus moves here when the lead is picked up and
 * goes back to where the gesture started when it is committed, so the person is
 * never left with the caret nowhere.
 */
export function SeatPicker({
  targets,
  blocked = [],
  attached,
  near,
  hover,
  carried = false,
  aimAt,
  hitRadius,
  nameFor,
  onSeat,
  onRelease,
  releaseLabel,
  onCancel,
}: {
  /** Every place this lead may go, in the order they read on screen. */
  targets: CircuitNode[];
  /**
   * Leads of other parts that would be targets **if they were free**.
   *
   * Normally this overlay draws nothing it cannot receive — offering an
   * occupied hole "would draw a mark the model refuses, which is a target you
   * can aim at and cannot hit". A hole is one of fifteen identical things and
   * nobody misses one; a *part's lead* is the specific thing somebody is
   * reaching for, and its absence reads as the bench being broken. Chapter one
   * reaches that state on its most likely wrong turn — both of the LED's legs
   * pushed into the header — and then "connect the resistor to the LED" has no
   * mark anywhere and no reason given.
   *
   * So these are drawn struck through and inert: not a target, an account of
   * one. The words are in the sentence above the canvas.
   */
  blocked?: readonly CircuitNode[];
  /** What this lead is attached to now, whichever side stored the edge. */
  attached?: NodeId;
  /**
   * Where the lead in hand stands on the bench, in scene units — its own node,
   * not its lifted mark.
   *
   * Where the caret opens when the lead is attached to nothing: the candidate
   * nearest this point, so a keyboard walk from a free leg standing over `F19`
   * starts at `F19` rather than at `F1`, and the mark left bright while a
   * pointer carries the lead over nothing is the hole beside it rather than
   * the corner of the board. Omitted for a lead still in the kit, which stands
   * nowhere; the caret then opens on the first candidate as it always did.
   */
  near?: Point;
  /**
   * The target a lead being dragged would land on.
   *
   * The pointer is the only thing that knows this, and the pointer may be up in
   * the kit strip — so it is told rather than worked out here. Drawn the same
   * way the keyboard's own position is, because they are the same fact reached
   * two ways: *this is the one you are about to choose*.
   */
  hover?: NodeId;
  /**
   * Whether the lead is being **carried by a pointer** right now, as opposed to
   * simply being in hand while this owns the choice.
   *
   * The two states look identical from in here — `hover` is `undefined` in both
   * — and they mean opposite things, so the dimming below asked the wrong
   * question. A person who *clicked* a lead was shown fifteen candidates at a
   * quarter opacity: a 1.2-wide hairline of `#C6D0D8` over a dark board, which
   * is not a target anybody can see, let alone choose between. The one route in
   * this product that is precise at every zoom and on every input device was
   * being drawn as if it were not there.
   *
   * Dropping back is a thing to say about a **drag**, and only about a drag:
   * it means *let go here and this lead comes loose*. Nothing is at stake when
   * a pointer is merely resting, and the marks are what the person is looking
   * for.
   */
  carried?: boolean;
  /** Where each target offers itself — the same answer the drag uses. */
  aimAt: (target: CircuitNode) => { x: number; y: number };
  /**
   * How wide a mark's invisible catcher may be, in scene units.
   *
   * Handed in rather than fixed here, because it depends on the zoom and on how
   * close together these particular candidates are. A constant `PITCH * 0.7`
   * made every catcher overlap its neighbours, and two overlapping catchers are
   * resolved by SVG's last-painted-wins — so the right-hand one always owned
   * the overlap and the boundary between two holes sat at 29% of the gap.
   */
  hitRadius: number;
  /**
   * The accessible name for one target — `Put the LED's long leg in D9`.
   *
   * The node, not its label: only the node knows a hole from a lead, and the
   * two resistor leads print the identical `220Ω`, so a name built from the
   * label alone would give two candidates one accessible name.
   */
  nameFor: (target: CircuitNode) => string;
  onSeat: (id: NodeId) => void;
  /** Delete and Backspace. Means "leave this lead loose", not "back in the kit". */
  onRelease?: () => void;
  /**
   * What Delete does, said out loud — `Leave the LED's long leg loose`.
   *
   * The gesture had no name anywhere: not on screen, not in an accessible name,
   * not in the live region, and it is the only route of any kind to undoing a
   * join without dropping the lead on bare desk. It rides on every mark rather
   * than on a control of its own because there is no control — the key is the
   * affordance, so it is named where the key is pressed, beside the shortcut
   * itself.
   */
  releaseLabel?: string;
  onCancel: () => void;
}) {
  /**
   * The selection is a target, not a position in a list.
   *
   * The list is rebuilt whenever the parent renders and it changes shape as the
   * build does — a lead stops being a candidate the moment something joins onto
   * it — so an index held in state would quietly come to mean a different hole.
   * Held by id and re-derived, it clamps rather than resets: the selection
   * survives every render that does not remove the thing it is on, and only
   * falls home when that thing genuinely stops being on offer.
   *
   * It opens on whatever the lead is attached to, so moving one hole over
   * starts from where the lead is rather than from the end of the board — and
   * for a lead attached to nothing, on the candidate nearest where it stands
   * (`near`), for the same reason. Index 0 is the board's top-left hole, and a
   * walk that starts there from a leg in column 19 is not a walk from the
   * lead. Decided once, on mount: the bench keys this overlay by the lead in
   * hand, so a different lead is a different mount.
   */
  const view = useContext(CaretView);
  const [activeId, setActiveId] = useState<NodeId | undefined>(() => {
    if (attached) return attached;
    /* A lead on the bench opens beside itself; one that stands nowhere yet —
       a kit part taken by keyboard — opens at the middle of what is on screen,
       which is where the person was looking. */
    const from = near ?? view?.centre?.();
    return from
      ? nearestTarget(
          from,
          targets.map((target) => ({ id: target.id, at: aimAt(target) })),
        )
      : undefined;
  });
  const at = targets.findIndex((target) => target.id === activeId);
  const home = targets.findIndex((target) => target.id === attached);
  const active = at !== -1 ? at : home !== -1 ? home : 0;

  const refs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    /* The list shrinks as well as grows — a lead stops being a candidate the
       moment something joins onto it — and an entry left past the end of the
       new list is a `<g>` that is no longer in the document, sitting at an
       index the next render can hand to the `.focus()` below. Focusing a
       detached node does nothing at all, so the caret stays wherever it was
       with nothing on screen to say why. */
    refs.current.length = targets.length;
  }, [targets]);

  /* Focus follows the caret. The camera does NOT follow it from here — see
     `bring`, and the note on `KeepCaretInView` for what happened when it did. */
  useEffect(() => {
    refs.current[active]?.focus();
  }, [active]);

  /**
   * Bring the view to the candidate the walk is about to land on.
   *
   * Called from the key handlers below and from nowhere else. Every candidate
   * is already in the document, so the mark's box can be read here, before the
   * render that moves the caret onto it — and reading it here rather than in
   * an effect keyed on `active` is what keeps the mount, a pointer press on a
   * mark, and a list that reshaped under the caret from moving the camera.
   * Only a person pressing an arrow key has asked for the view to follow.
   */
  const bring = (index: number) => {
    const node = refs.current[index];
    const target = targets[index];
    if (!node || !target || !view) return;
    view.keepInView(node.getBoundingClientRect(), aimAt(target));
  };

  const move = (to: number) => {
    const index = (to + targets.length) % targets.length;
    setActiveId(targets[index]?.id);
    bring(index);
  };

  /**
   * The rows, where these targets are laid out in rows at all.
   *
   * Asked of the targets rather than of the build: a breadboard hole knows its
   * own address and a header pin has none to know, which is exactly the
   * distinction the walk needs. Chapter one's fifteen pins produce no grid, so
   * it falls through to the flat walk below — which is its whole route and must
   * not change under it.
   */
  const grid = targets.some((target) => target.col !== undefined)
    ? familiesOf(targets)
    : undefined;

  /**
   * One arrow press. `along` is left/right, `across` is up/down.
   *
   * Off the grid the two collapse back into a single step through the list,
   * which is what the four arrows have always done here.
   */
  const step = (index: number, along: number, across: number) => {
    const from = targets[index];
    if (!grid || !from) return move(index + along + across);
    const next = neighbourOf(grid, from, along, across) ?? from;
    setActiveId(next.id);
    bring(targets.findIndex((target) => target.id === next.id));
  };

  /**
   * Where the press started, so a press that travelled cannot also commit —
   * and where its release is heard, which is not on the mark.
   *
   * These marks tile the header edge to edge while a lead is in hand, and the
   * press on one of them is let through to the viewport underneath on purpose:
   * the viewport pans on any press that reaches it, and a header with no
   * pannable pixel in it is a trap. What is withheld is the commit, which a
   * press that travelled more than `PRESS_SLOP` never gets.
   *
   * The viewport answers every press it receives with `setPointerCapture`, and
   * a captured pointer's release — **and the `click` that follows it** — is
   * dispatched to the capturing element, not to whatever is under the pointer.
   * So the mark's `onClick` never fired for a pointer at all. Measured on
   * Chrome 152: `pointerdown` on the mark's catcher, `pointerup` on the
   * viewport's svg, `click` on the viewport's svg. What the person saw was
   * that pressing a hole moved the caret onto it — mousedown moves focus, and
   * `onFocus` moves the caret — and seated nothing until they pressed Enter, a
   * key nobody with a mouse in their hand had been told about. The comment
   * that stood here said the opposite: that capture kept the mark as the
   * target of the release. It does not; it takes the release away.
   *
   * So the release is listened for on `window` in the capture phase, the one
   * place a captured pointer's `pointerup` still passes — exactly as
   * `use-part-drag.ts` hears the end of a drag, and for the same reason. The
   * commit is made from the release: same pointer, within the slop of the
   * press. `onClick` stays for an activation that had no pointer — a screen
   * reader's own click — and is told when a release has already answered, so
   * a browser that does not retarget the click cannot seat the lead twice.
   */
  const press = useRef<{
    id: NodeId;
    pointerId: number;
    x: number;
    y: number;
    /** The release has already committed; the click that follows it is spent. */
    answered: boolean;
  } | null>(null);

  /* Read by a window listener attached at the press and outliving the render
     that attached it — the same shape as `use-part-drag.ts`'s `live`. */
  const latest = useRef(onSeat);
  useEffect(() => {
    latest.current = onSeat;
  });

  const detach = useRef<(() => void) | null>(null);

  const listen = () => {
    detach.current?.();
    const opts = { capture: true } as const;
    const up = (event: globalThis.PointerEvent) => {
      const from = press.current;
      if (!from || from.pointerId !== event.pointerId) return;
      release();
      if (
        Math.hypot(event.clientX - from.x, event.clientY - from.y) > PRESS_SLOP
      ) {
        press.current = null;
        return;
      }
      from.answered = true;
      /* The click, where one comes, is dispatched in the same turn as the
         release; a record still standing after that would refuse the next
         pointerless activation. */
      setTimeout(() => {
        if (press.current === from) press.current = null;
      }, 0);
      latest.current(from.id);
    };
    const cancel = (event: globalThis.PointerEvent) => {
      const from = press.current;
      if (!from || from.pointerId !== event.pointerId) return;
      release();
      press.current = null;
    };
    const release = () => {
      window.removeEventListener("pointerup", up, opts);
      window.removeEventListener("pointercancel", cancel, opts);
      detach.current = null;
    };
    window.addEventListener("pointerup", up, opts);
    window.addEventListener("pointercancel", cancel, opts);
    detach.current = release;
  };

  /* A press interrupted by an unmount takes its listeners with it. */
  useEffect(() => () => detach.current?.(), []);

  const commit = (target: NodeId, event: React.MouseEvent) => {
    const from = press.current;
    press.current = null;
    if (from?.answered) return;
    /* No press at all is an activation from the accessibility tree — a screen
       reader's own click, which has nothing to travel. */
    if (
      from &&
      (from.id !== target ||
        Math.hypot(event.clientX - from.x, event.clientY - from.y) >
          PRESS_SLOP)
    ) {
      return;
    }
    onSeat(target);
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => step(index, 1, 0),
      ArrowDown: () => step(index, 0, 1),
      ArrowLeft: () => step(index, -1, 0),
      ArrowUp: () => step(index, 0, -1),
      /* Both ends of the LIST, not of the row: they are the one pair of keys
         that is about the whole of what is on offer, and on a board they are
         the way back to the far corner without crossing it. */
      Home: () => move(0),
      End: () => move(targets.length - 1),
      Enter: () => onSeat(targets[index].id),
      " ": () => onSeat(targets[index].id),
      Escape: onCancel,
      Delete: () => onRelease?.(),
      Backspace: () => onRelease?.(),
    };
    const handler = keys[event.key];
    if (!handler) return;
    event.preventDefault();
    event.stopPropagation();
    handler();
  };

  return (
    <g>
      {/* Drawn first, under everything that *can* be chosen. */}
      {blocked.map((lead) => {
        const { x, y } = aimAt(lead);
        const r = PITCH * 0.42;
        return (
          <g key={`blocked-${lead.id}`} aria-hidden style={{ pointerEvents: "none" }}>
            <polygon
              points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`}
              fill="none"
              stroke={bench.label}
              strokeWidth={1.2}
              opacity={0.3}
            />
            {/* The bar is what makes it a refusal rather than a faint target —
                shape, not opacity alone (rule 7). */}
            <line
              x1={x - r * 1.15}
              y1={y + r * 1.15}
              x2={x + r * 1.15}
              y2={y - r * 1.15}
              stroke={bench.label}
              strokeWidth={1.2}
              strokeLinecap="round"
              opacity={0.45}
            />
          </g>
        );
      })}
      {targets.map((target, index) => {
        const here = target.id === attached;
        const aimed = target.id === hover;
        const marked = aimed || index === active;
        /* Something is being carried and nothing is under the aim: every
           candidate drops back so the bench reads as "release here and this
           lead comes loose" rather than as a row of equally-live targets none
           of which is selected. Not while the choice is simply open — see
           `carried`. */
        const adrift = carried && hover === undefined && index !== active;
        const { x, y } = aimAt(target);
        const r = PITCH * 0.42;
        return (
          <g
            key={target.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            role="button"
            tabIndex={index === active ? 0 : -1}
            aria-label={nameFor(target)}
            aria-current={here ? "true" : undefined}
            /* Only when letting go is actually on offer: a shortcut announced
               on a lead that is holding nothing would name a key that does
               nothing. */
            aria-keyshortcuts={
              onRelease && releaseLabel ? "Delete" : undefined
            }
            className="group cursor-pointer outline-none"
            onPointerDown={(event) => {
              /* The release commits now — see `press` — so a button that is
                 not the primary one must not start a press at all: a right
                 click used to reach nothing because `click` never follows it,
                 and its `pointerup` would. */
              if (event.button !== 0 || !event.isPrimary) return;
              press.current = {
                id: target.id,
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                answered: false,
              };
              listen();
            }}
            onClick={(event) => commit(target.id, event)}
            onFocus={() => setActiveId(target.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {/* SVG's own way of describing an element, so the sentence rides
                on the mark being read rather than in a stray text node the
                group would announce on its own. */}
            {onRelease && releaseLabel ? <desc>{releaseLabel}</desc> : null}
            {/* A generous invisible target that still cannot reach its
                neighbour — see `hitRadius`. */}
            <circle cx={x} cy={y} r={hitRadius} fill="transparent" />
            {/* **Two strokes, dark under light**, and it is not a flourish.
                `bench.label` was chosen against chapter one's Uno, where it
                reads 5.07:1 on `#1B4F9C`. On every breadboard chapter the marks
                land on the board's `plasticWhite` `#F2F4F6` and its `#C4CBD2`
                holes, where the same colour is **1.42:1** and **1.05:1** — and
                179 of chapter two's 194 candidates, and 359 of the 381–387 on
                chapters three to five, are on that plastic. So the only
                keyboard route into a hole was drawn in a colour nobody can see
                on the surface it is drawn on.
                No single colour can fix it: clearing 3:1 on `#F2F4F6` needs a
                luminance at or under 0.262 and clearing it on `#1B4F9C` needs
                0.34 or more. So the mark carries its own dark ground the way
                the shelf's anchor badge and `MascotRing` already do, and the
                pair reads on white plastic (16.5:1 for the halo) and on the
                board (5.07:1 for the ring) without either of them knowing what
                is underneath. */}
            {candidateMark({
              lead: target.kind === "terminal",
              x,
              y,
              r,
              /* Opacity, not colour, still carries `adrift` — a pointer
                 carrying a lead over nothing. The halo fades with the mark, so
                 the quiet state stays quiet. */
              stroke: marked ? 2.2 : 1.6,
              opacity: marked ? 1 : adrift ? 0.25 : 0.85,
            })}
            {/* **The keyboard's own ring**, and only on the one candidate that
                can hold focus — the roving tabindex above means no other ever
                does, so this costs two nodes on a bench that draws up to 387
                candidates.
                It replaces a 0.6-unit stroke delta that was also what a
                *pointer hover* looked like: two different things wearing one
                mark, and the quieter of them the one WCAG 2.4.11 is about. Same
                dark-under-light pair as the mark, one radius out, so it reads
                as a ring around the caret rather than as a heavier caret. */}
            {index === active ? (
              <g className="opacity-0 group-focus-visible:opacity-100">
                <circle
                  cx={x}
                  cy={y}
                  r={r + PITCH * 0.26}
                  fill="none"
                  stroke={MARK_GROUND}
                  strokeWidth={3.4}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={r + PITCH * 0.26}
                  fill="none"
                  stroke={bench.label}
                  strokeWidth={1.6}
                />
              </g>
            ) : null}
            {/* **Where it would land** — a filled dot, the mark of a choice
                about to be made. */}
            {aimed ? (
              <circle cx={x} cy={y} r={PITCH * 0.16} fill={bench.label} />
            ) : null}
            {/* **Where it already is** — a small square, a different SHAPE and
                not a different shade (rule 7).

                These two were the same filled dot, so "you are over the hole
                you are already in, and releasing does nothing" and "you are
                over a new hole, and releasing moves it" were pixel-identical.
                Two gestures with opposite outcomes are not allowed to look the
                same, and the one that changes nothing is the one a person then
                reports as the interface ignoring them. */}
            {here && !aimed ? (
              <rect
                x={x - PITCH * 0.15}
                y={y - PITCH * 0.15}
                width={PITCH * 0.3}
                height={PITCH * 0.3}
                fill={bench.label}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
}
