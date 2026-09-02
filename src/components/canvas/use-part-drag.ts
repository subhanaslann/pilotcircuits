"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { CircuitNode, NodeId } from "@/lib/circuit/graph";
import {
  carriedFrom,
  hitRadius,
  minSpacing,
  race,
  slopFor,
  snapRadius,
  travelled,
  type Aim,
  type AimTarget,
  type Point,
} from "@/components/canvas/drag-math";

/**
 * Picking something up and putting it down — the one gesture, wherever it
 * starts.
 *
 * Two surfaces raise it: the kit shelf, where a part is lifted off a shelf in
 * region pixels, and the bench, where a lead already attached to something is
 * lifted in scene units. They are the same act and they must not drift apart,
 * because the person moving a resistor lead from `D8` to `D9` and the person
 * taking the resistor out of the box are doing the same thing to the same build.
 *
 * ## What the caller decides, and what this decides
 *
 * This one owns *the gesture*: what counts as a drag rather than a click, where
 * the pointer is, which target it is over, and what kind of release it was. The
 * caller owns *the meaning*: `onDrop` is handed an id and an `Aim`, and a shelf
 * and a bench answer that differently — `away` means "still in the box" up
 * there and "this lead is loose" down here.
 *
 * The id is opaque on purpose. It was a `PartId` while a part went into a hole;
 * it is a `TerminalId` now that a lead does, and this file learned nothing
 * either time, because it has never needed to know what it is carrying.
 *
 * ## The press is on the element; everything after it is on the window
 *
 * Only `pointerdown` is bound to the thing you grab. Move, release and cancel
 * are listened for on `window` while a gesture is in flight.
 *
 * This is not belt-and-braces. It used to rely on `setPointerCapture`, and on
 * the bench that quietly did not hold: the press landed on an SVG lead handle,
 * the pick re-rendered the whole layer around it, and **no move or release ever
 * came back**. So the gesture never ended — `gesture.current` stayed set for
 * ever, the lead stayed in hand, and the next press was answered by a stale
 * record of the last one. Every drag that started on a lead handle failed in
 * exactly that way, which is most of what "arranging the wires does not work"
 * looks like from the outside.
 *
 * The window is the only listener that cannot be taken away by anything the
 * drag itself causes to re-render, unmount or stop hit-testing. It also gets
 * the release for free when the pointer leaves the canvas, the window or the
 * document — three cases the element handlers never saw.
 *
 * ## A release the window never sees
 *
 * One case it does not get: a mouse button let go over another application.
 * Alt-Tab in the middle of a carry, release there, come back — no `pointerup`
 * and no `pointercancel` ever reach this window, so the gesture stayed live,
 * the lead followed the cursor with no button down, and the next click
 * anywhere on the page was read as the drop. Off the board that is `away`,
 * which is the removal, and nobody chose it. So a mouse move that arrives with
 * `buttons` at zero ends the gesture the way a cancel does, and so does the
 * window losing focus. Neither is a drop: the part goes back where it was.
 *
 * ## Two spaces, and the mistake that lived in the seam
 *
 * The gesture is measured in **CSS pixels** and the board is measured in
 * **scene units**, and the two are related by a zoom the person changes at
 * will. Everything about the hand — the drag threshold, how near counts as
 * near — is a screen fact and is divided by the zoom before it is compared to
 * anything on the bench. `drag-math.ts` holds all of it and is unit-tested;
 * this file holds only the pointer plumbing.
 *
 * It used to be the other way round. `CATCH = PITCH * 4` and `slop = PITCH *
 * 0.4` were scene-unit constants standing in for screen facts: the threshold
 * was 1.6 CSS px at `zoom.min` — below mouse jitter, so an intended click
 * became a drag and committed blind — and the catch was four holes wide at
 * every zoom.
 *
 * ## One press, two frames
 *
 * `locate` and `toScene` both answer in a space anchored to the canvas region,
 * and that region **moves while a gesture is in flight**. Pressing a lead puts
 * it in hand, and a lead in hand puts `Leave it loose` / `Back in the kit` in
 * the sentence above the bench — one more row, 48 CSS px of it, so the canvas
 * below is pushed down and shortened between the press and the release.
 *
 * The travel was measured across that seam: the press was converted to scene
 * units *once*, at pointer-down, and every later event was converted against a
 * frame 48 px lower. The difference read as 28 scene units of upward hand
 * movement nobody made — nearly three header holes, past `RELEASE_FACTOR`'s
 * bound — so **every** drag of a lead already on the bench resolved as `away`,
 * which is the removal. Nudge a seated LED one hole sideways and it went back
 * in the box. That is what "the wiring does not work" is, from the outside.
 *
 * So only `fromClient` is kept, and both halves of the travel are asked of the
 * frame that is current at the moment they are compared (`framed`, and the
 * `toScene` inside `aimFrom`). A gesture is then immune to anything that moves
 * or resizes the region under it — this header, the dock, a window resize —
 * and `aimOrigin` needs no such care, because it is a position on the bench and
 * the bench does not move when the furniture around it does.
 *
 * ## Where the aim comes from
 *
 * From the **lead being committed**, never from the raw pointer. `aimOrigin`
 * gives the scene position that lead is drawn at when the gesture starts; the
 * pointer's travel is added to it. Without that, off the kit shelf the part's
 * whole box was centred on the cursor while the lead that landed was
 * `anchorOf`, a constant hole-and-a-bit away; and on the bench a transparent
 * rect covered the part's whole box, so where inside the LED you grabbed
 * decided which hole it went into.
 *
 * ## Why the gesture is in a ref
 *
 * Press, move and release can all land in one task — a flick, a coalesced
 * burst — and a handler reading React state out of its render closure would see
 * `null` for every move that arrived before the commit, and let go of a part
 * with no idea it had travelled. The ref answers *what is happening*; the state
 * exists so the drawing follows the cursor.
 */

export type { Point } from "@/components/canvas/drag-math";

/** Whatever the caller is moving, named in the caller's own vocabulary. */
type DragId = string;

export interface Held {
  id: DragId;
  /** The pointer, in whatever space `locate` speaks. */
  at: Point;
  /**
   * Where the press started, in `locate`'s space — **re-asked every event**,
   * never the value it had at the press.
   *
   * See "One press, two frames" above. `fromClient` is the record of the press;
   * this is that record read in the frame the drawing is being made in now, so
   * `at - from` is travel and nothing else.
   */
  from: Point;
  /** The same press, in CSS px — the only space a hand may be measured in. */
  fromClient: Point;
  /** Pointer minus the part's origin, in the current frame. */
  offset: Point;
  /** Where the committed lead sits in scene units, at the moment of the grab. */
  aimOrigin?: Point;
  /** Where the thing being dragged is drawn, in `locate`'s space. */
  origin?: Point;
  /** Which pointer this is, so a second finger cannot drive somebody else's drag. */
  pointerId: number;
  moved: boolean;
}

export function usePartDrag({
  locate,
  toScene,
  scale,
  targets,
  targetsFor,
  aimAt = (target) => ({ x: target.x, y: target.y }),
  aimOrigin,
  onPick,
  onSettle,
  onHover,
  onDrop,
}: {
  /** The pointer in the caller's own space — region pixels, or scene units. */
  locate: (clientX: number, clientY: number) => Point;
  /** The pointer in scene units, for asking which target it is over. */
  toScene: (clientX: number, clientY: number) => Point;
  /** The viewport's current zoom, so a screen fact can be turned into a bench one. */
  scale: () => number;
  /** Every place this drop may land: board holes, and free leads to join onto. */
  targets: readonly CircuitNode[];
  /**
   * The same list, asked for at the moment of the press.
   *
   * `targets` is derived from *what is in hand*, which the caller only knows
   * after `onPick` has been through a render — so between the press and that
   * render the list is empty, and a gesture whose press and release land in one
   * task resolves against no candidates at all and reads as *carried away*.
   * That is a real drag on a fast flick and it is every automated one.
   *
   * Asked for here, the gesture never waits for a render to know where the lead
   * may go. `targets` stays, because the picker keys an effect on that array's
   * identity and must keep getting the memoised one.
   */
  targetsFor?: (id: DragId) => readonly CircuitNode[];
  /**
   * Where a target offers itself, which is not always where it is.
   *
   * A board hole is aimed at where it is. A free lead is aimed at a point up its
   * leg, because a seated LED's long leg is 0.5208 scene units from `board.D13`
   * — one twentieth of a hole — and a race between two targets that close is
   * decided by rounding rather than by aim. Any precedence rule here would be
   * worse: whichever side won, the other target would be unreachable by pointer
   * at every zoom, and this chapter is about being able to choose the wrong
   * hole.
   */
  aimAt?: (target: CircuitNode) => Point;
  /**
   * Where the thing being committed is drawn now, in scene units.
   *
   * Omitted — which is what the kit shelf wants, where the part is not on the
   * bench yet and the cursor *is* the aim — the pointer stands in for it.
   */
  aimOrigin?: (id: DragId) => Point | undefined;
  /** The thing is in hand. Raised on press, before anything has moved. */
  onPick: (id: DragId) => void;
  /**
   * The press turned out to be a **click**: nothing travelled, nothing
   * committed, and the seat picker now owns the choice.
   *
   * Separate from `onPick` because that fires on pointer *down*, when it is not
   * yet known which gesture this is. Anything that would move the view has to
   * wait for this: a canvas that zooms on press yanks the board out from under
   * a drag that has already started, and the person is then aiming at a bench
   * that moved while they were reaching for it.
   */
  onSettle?: (id: DragId) => void;
  /** The target a release would land on right now, so the bench can mark it. */
  onHover: (target: NodeId | null) => void;
  /**
   * Let go, having travelled. A press that never moved is a pick-up and never
   * arrives here — it leaves the seat picker up instead, which is the precise
   * route and the one a keyboard shares.
   */
  onDrop: (id: DragId, aim: Aim) => void;
}) {
  const gesture = useRef<Held | null>(null);
  const [held, setHeld] = useState<Held | null>(null);
  const aimed = useRef<NodeId | null>(null);

  const offer = (list: readonly CircuitNode[]): AimTarget[] =>
    list.map((target) => ({ id: target.id, at: aimAt(target) }));

  const offered = offer(targets);
  const spacing = minSpacing(offered);

  /**
   * Everything the window listeners read, kept fresh without re-subscribing.
   *
   * They are attached once when a gesture starts; the props underneath them
   * change on every render. A ref is the honest way to say "use the current
   * one" — re-subscribing per render would detach and reattach mid-drag, which
   * is the class of failure this file was rewritten to end.
   */
  const live = useRef({
    locate,
    toScene,
    scale,
    offered,
    spacing,
    onSettle,
    onHover,
    onDrop,
  });
  /* Synced in an effect rather than written during render: a ref assigned in
     the render body is the hazard `react-hooks/refs` names, and this one is
     read by listeners that outlive the render that created them. An effect
     runs before the browser can deliver the next pointer event, which is the
     only ordering this needs. */
  useEffect(() => {
    live.current = {
      locate,
      toScene,
      scale,
      offered,
      spacing,
      onSettle,
      onHover,
      onDrop,
    };
  });

  /**
   * One unbiased race over everything on offer, run from the point the lead
   * will actually land on.
   *
   * The winner is the *nearest* candidate rather than the first one inside the
   * radius, so the boundary between two holes sits at exactly half the gap
   * however generous the radius is — which is the same precision a real 0.1"
   * header gives a hand. No kind test, no separate catch radius, no early
   * return for the near thing: two targets a fifth of a pitch apart are two
   * targets.
   *
   * Same-part exclusion is the CALLER's job. Filtering it here would mean
   * knowing which lead belongs to which part, which is build knowledge this
   * file must not acquire — `candidatesFor` has already left them out.
   */
  const aimFrom = (now: Held, clientX: number, clientY: number): Aim => {
    const l = live.current;
    const pointer = l.toScene(clientX, clientY);
    /* The press, re-asked in the frame this release is being read in — see
       "One press, two frames". `aimOrigin` needs no such treatment: it is
       already a position on the bench, and the bench does not move when the
       region around it does. */
    const point = now.aimOrigin
      ? carriedFrom(
          now.aimOrigin,
          now.fromClient,
          { x: clientX, y: clientY },
          l.toScene,
        )
      : pointer;
    return race(
      point,
      l.offered,
      snapRadius(l.scale(), l.spacing),
      aimed.current,
    );
  };

  /**
   * The press, and the grip on it, read in the frame that is current now.
   *
   * `locate` answers in a space anchored to a region that can move underneath a
   * gesture — see the header note. Both halves of the travel have to be asked
   * of the same frame or the difference between them is part shift and part
   * hand.
   */
  const framed = (now: Held, clientX: number, clientY: number): Held => {
    const l = live.current;
    const from = l.locate(now.fromClient.x, now.fromClient.y);
    return {
      ...now,
      at: l.locate(clientX, clientY),
      from,
      offset: now.origin
        ? { x: from.x - now.origin.x, y: from.y - now.origin.y }
        : { x: 0, y: 0 },
    };
  };

  /* Reported only when it changes: this runs on every pointer move, and the
     bench redraws when it is told. */
  const aim = (target: NodeId | null) => {
    if (aimed.current === target) return;
    aimed.current = target;
    live.current.onHover(target);
  };

  const put = (next: Held | null) => {
    gesture.current = next;
    setHeld(next);
  };

  const hasTravelled = (now: Held, event: globalThis.PointerEvent) =>
    now.moved ||
    travelled(
      now.fromClient,
      { x: event.clientX, y: event.clientY },
      slopFor(event.pointerType),
    );

  /**
   * The rest of the gesture, on the window — attached **synchronously in the
   * press**, never in an effect.
   *
   * Press, move and release can all land in one task: a flick, a coalesced
   * burst, or any automated pointer sequence. An effect keyed on "something is
   * in hand" does not run until React has committed the render the press
   * scheduled — by which time the moves and the release have already been
   * dispatched and missed. The gesture then never ends, and the lead is stuck
   * in hand exactly as it was when this relied on pointer capture.
   *
   * Capture phase, so a handler somewhere in the tree calling `stopPropagation`
   * — which several of them do, deliberately — cannot end a drag by accident.
   */
  const detach = useRef<(() => void) | null>(null);

  const listen = () => {
    detach.current?.();

    /* The gesture ending without a release — the browser's way, or the two
       cases below where the browser had no way to tell us. Not a drop: nothing
       is committed and the part goes back where it was. */
    const abandon = () => {
      release();
      aim(null);
      put(null);
    };

    const move = (event: globalThis.PointerEvent) => {
      const now = gesture.current;
      if (!now || now.pointerId !== event.pointerId) return;
      /* A mouse moving with no button held is a release this window never
         saw — see "A release the window never sees" above. Only a mouse: a
         finger or a pen lifted off gets a real `pointerup` or `pointercancel`,
         and a pen in hover reports zero buttons while it is genuinely being
         moved. */
      if (event.pointerType === "mouse" && event.buttons === 0) {
        abandon();
        return;
      }
      const moved = hasTravelled(now, event);
      if (moved) {
        const next = aimFrom(now, event.clientX, event.clientY);
        aim(next.kind === "target" ? next.id : null);
      }
      put({ ...framed(now, event.clientX, event.clientY), moved });
    };

    const up = (event: globalThis.PointerEvent) => {
      const now = gesture.current;
      if (!now || now.pointerId !== event.pointerId) return;
      release();
      /* Asked of the release itself: moves are coalesced and dropped, and a
         drop that trusted the last one would land wherever the browser last
         bothered to say. */
      if (hasTravelled(now, event)) {
        live.current.onDrop(now.id, aimFrom(now, event.clientX, event.clientY));
      } else {
        live.current.onSettle?.(now.id);
      }
      aim(null);
      put(null);
    };

    /* A cancelled pointer is not a drop. The part goes back where it was and
       nothing is committed — the browser took the gesture away, the person did
       not finish it. */
    const cancel = (event: globalThis.PointerEvent) => {
      const now = gesture.current;
      if (!now || now.pointerId !== event.pointerId) return;
      abandon();
    };

    /* The window losing focus altogether — Alt-Tab mid-carry — which the
       browser answers with no pointer event at all. Bound WITHOUT capture and
       checked against its target: an element blurring inside the page does
       pass a capturing window listener, and must not end a drag. */
    const blur = (event: FocusEvent) => {
      if (event.target !== window || !gesture.current) return;
      abandon();
    };

    const opts = { capture: true } as const;
    window.addEventListener("pointermove", move, opts);
    window.addEventListener("pointerup", up, opts);
    window.addEventListener("pointercancel", cancel, opts);
    window.addEventListener("blur", blur);

    const release = () => {
      window.removeEventListener("pointermove", move, opts);
      window.removeEventListener("pointerup", up, opts);
      window.removeEventListener("pointercancel", cancel, opts);
      window.removeEventListener("blur", blur);
      detach.current = null;
    };
    detach.current = release;
  };

  /* A drag interrupted by an unmount takes its listeners with it. */
  useEffect(() => () => detach.current?.(), []);

  /**
   * The press, and only the press.
   *
   * `origin` is where the part is drawn now, in `locate`'s space. Given, the
   * part keeps its grip on the cursor; omitted, it centres on it — which is
   * what the shelf wants, where the thing you grabbed is a button and not the
   * drawing's own origin.
   */
  const bind = (id: DragId, origin?: Point) => ({
    onPointerDown: (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      /* The viewport pans on any press that reaches it, and this one must not:
         the part moves, the bench stays. */
      event.stopPropagation();
      const point = live.current.locate(event.clientX, event.clientY);
      onPick(id);
      /* Before anything can be released: see `targetsFor`. */
      if (targetsFor) {
        const now = offer(targetsFor(id));
        live.current = {
          ...live.current,
          offered: now,
          spacing: minSpacing(now),
        };
      }
      listen();
      put({
        id,
        at: point,
        from: point,
        fromClient: { x: event.clientX, y: event.clientY },
        aimOrigin: aimOrigin?.(id),
        origin,
        pointerId: event.pointerId,
        offset: origin
          ? { x: point.x - origin.x, y: point.y - origin.y }
          : { x: 0, y: 0 },
        moved: false,
      });
    },
  });

  return { held, bind, hitRadius: hitRadius(scale(), spacing) };
}
