import { PITCH } from "@/lib/circuit/geometry";
import type { NodeId, NodeKind } from "@/lib/circuit/graph";

/**
 * The arithmetic of aiming, pulled out of React so it can be asserted.
 *
 * Every one of this product's reported hit-testing failures — "placing
 * components doesn't work", "you can't work with the pin you meant", "it
 * removed the part and I only nudged it" — is a number in this file, and until
 * now the only way to see any of them was to render a frame and squint. None of
 * it needs a DOM, a pointer or a component; all of it needs a test.
 *
 * ## Two spaces, and which facts live in which
 *
 * The bench is drawn at true physical scale, so **scene units are millimetres**
 * (one unit is 0.254 mm, a 0.1" pitch is exactly 10) and they do not change
 * when the person zooms. **CSS pixels** are what the hand works in, and they
 * do change: at `zoom.min` a header hole is 3.96 px across and at zoom 3 it is
 * 30 px.
 *
 * A fact about the *board* belongs in scene units. A fact about the *hand* —
 * how far a finger slips before a press is a drag, how near is near enough to
 * count as aiming at something — belongs in CSS pixels and has to be divided by
 * the zoom before it can be compared to anything on the bench.
 *
 * Getting that backwards is the whole of the diagnosis. The old catch radius
 * was `PITCH * 4` — a scene-unit constant standing in for a screen fact — which
 * is 4.04 header holes in every direction at every zoom, containing nine of the
 * fifteen candidates. And the old drag threshold was `PITCH * 0.4` compared in
 * scene units, which is 1.6 CSS px at `zoom.min`: below mouse jitter, so an
 * intended *click* became a drag and committed wherever the pointer happened to
 * be.
 */

export interface Point {
  x: number;
  y: number;
}

/** How near the aim point has to be to a candidate, in CSS px. */
export const CATCH_PX = 12;

/**
 * How far past the catch a release still counts as a miss rather than a
 * removal.
 *
 * A drop that lands on nothing used to mean *let this lead go*, which made the
 * failure mode of a mis-aim silent destruction: nudge a seated resistor one
 * hole sideways, miss, and the part goes back in the box with no undo. So a
 * release is read as three different intentions by distance — on it, near it,
 * or away from it — and only the third is a removal.
 */
export const RELEASE_FACTOR = 3;

/**
 * The smallest a candidate may be allowed to be, in CSS px, once you are
 * holding something.
 *
 * WCAG 2.5.8 asks for 24 CSS px between adjacent targets. Chapter one's header
 * holes are 9.8958 scene units apart, so at the zoom the whole board fits in —
 * which is the zoom parts are placed at, because it is the opening view — they
 * are **9 px apart**. A person aiming at one of fifteen targets 9 px apart is
 * being asked for a precision no pointer has, and the honest answer is not a
 * bigger catch radius (which cannot help: the boundary between two holes is
 * half the gap however wide the radius is) but a closer look.
 */
export const MIN_TARGET_PX = 24;

/** Travel before a press is a drag rather than a click, in CSS px. */
export const SLOP_MOUSE_PX = 5;
/** Android's `ViewConfiguration.touchSlop` is 8dp; a finger is not a mouse. */
export const SLOP_TOUCH_PX = 10;

/**
 * How much nearer a rival has to be before the aim jumps to it.
 *
 * Without this the mark flickers between two candidates 22 CSS px apart while
 * the hand is still. With it the current target keeps the aim until something
 * is clearly closer, which is what a magnet does.
 */
export const STICKY = 0.74;

/**
 * Two candidates this close to equidistant are not a choice a pointer can make.
 *
 * `nearest()` used to answer with whichever won by a rounding error — `d <=
 * distance` handed a dead heat to whichever candidate was sorted later. It
 * answers `ambiguous` now and the caller does not commit; the seat picker keeps
 * the choice, which can name both.
 *
 * Deliberately narrow. With the aim point taken from the lead rather than the
 * pointer, a release 4% off the bisector of two holes is a release that
 * genuinely aimed at one of them, and turning that into a prompt would be the
 * interface second-guessing an answer it has.
 */
export const AMBIGUOUS = 1.08;

/**
 * The floor under the snap radius, in scene units.
 *
 * Below about 0.6 of a pitch the magnet stops feeling like one: a drop has to
 * land inside the hole rather than near it, which is a demand no pointer can
 * meet at 40% zoom, where a hole is 3.96 CSS px across.
 *
 * This is safe to be generous about **only** because the winner is the nearest
 * candidate rather than the first one inside the radius. A wide radius cannot
 * choose a wrong neighbour; it can only decide that a far release still counts
 * as aiming at the board — which is exactly what `RELEASE_FACTOR` is for.
 */
const MIN_SNAP = PITCH * 0.6;

export interface AimTarget {
  id: NodeId;
  /** Where the target offers itself, in scene units — not always where it is. */
  at: Point;
  /** A hole or a pin seats a lead; a `terminal` is another lead, offered as a mark. */
  kind?: NodeKind;
}

/**
 * The closest two candidates get, in scene units.
 *
 * The catch radius is capped at half of this, so it can never reach a
 * neighbour: two candidates one pitch apart give a 4.95-unit catch, and the
 * boundary between them lands at exactly 50% of the gap rather than at the 29%
 * an overlapping pair of hit circles produced.
 *
  * **Two spacings, two questions.** The catch radius is bounded by the closest
 * pair of *everything on offer*, marks included, because a click resolves by
 * the catcher it lands in rather than by the nearest candidate: two catchers
 * that overlapped would hand a click near one hole to the mark beside it. So a
 * free lead's lifted mark — 6.783 from the nearest hole on the breadboard, and
 * exactly 5.0 when a resistor stands in the Uno header (`res.red.in` in `D3`
 * puts the free `res.red.out` mark 5 units above `D8`) — still shrinks every
 * catcher on the board while it is on offer. This is `minSpacing`.
 *
 * The pick-up zoom asks a different question: how close must the view be for
 * the *grid* to be aimable. It reads `gridSpacing`, the closest pair of seats
 * alone, so a mark 5 units from a pin no longer sends every click pick-up to
 * `zoom.max` — measured before this: 1986 of chapter two's 2340 one-lead-seated
 * states did. Per-candidate catchers, which would let the grid keep its wider
 * catch beside a mark, are the next step; `drag-math.test.ts` pins both.
 */
export function minSpacing(targets: readonly AimTarget[]): number {
  let best = Infinity;
  for (let i = 0; i < targets.length; i += 1) {
    for (let j = i + 1; j < targets.length; j += 1) {
      const d = Math.hypot(
        targets[i].at.x - targets[j].at.x,
        targets[i].at.y - targets[j].at.y,
      );
      if (d > 0 && d < best) best = d;
    }
  }
  return Number.isFinite(best) ? best : PITCH;
}

/**
 * The closest two *seats* get — the hole grid, with every lead's mark left out.
 *
 * What the pick-up zoom reads: 10 on a breadboard, 9.8958 in the Uno header.
 * A list with fewer than two seats (chapter one's in-air join offers only
 * leads) falls back to `minSpacing`, which is then the only spacing there is.
 */
export function gridSpacing(targets: readonly AimTarget[]): number {
  const seats = targets.filter((target) => target.kind !== "terminal");
  return seats.length >= 2 ? minSpacing(seats) : minSpacing(targets);
}

/** A screen-space distance in scene units at the current zoom. */
export const inScene = (px: number, scale: number) => px / Math.max(scale, 0.01);

/**
 * How near counts as aiming at the board at all.
 *
 * A constant 24 CSS px across wherever there is room for one, and never less
 * than 0.6 of a pitch — so the magnet holds at every zoom, including the ones
 * where a hole is four pixels wide.
 *
 * **Precision does not come from this number.** It comes from `race` picking
 * the *nearest* candidate rather than the first one inside the radius, which
 * puts the boundary between two holes at exactly half the gap however wide the
 * radius is. That is the same precision a real 0.1" header gives a hand, and it
 * is why this can afford to be generous where the old `PITCH * 4` could not:
 * that constant did not choose a wrong neighbour either, but it did mean a
 * release four holes clear of the board still landed in one — so a nudge that
 * missed was indistinguishable from a deliberate removal.
 */
export function snapRadius(scale: number, spacing: number): number {
  return Math.max(inScene(CATCH_PX, scale), Math.min(spacing, MIN_SNAP));
}

/**
 * The drawn hit areas, which DO have to be capped.
 *
 * A mark is a control and paint order decides which of two overlapping ones
 * receives a click — so unlike the snap radius, two of these touching is a
 * target you cannot reach by pointer. The bench and the picker drew `PITCH *
 * 0.7` circles on 9.9-unit spacing: 31.7 CSS px across at the opening fit, on
 * centres 22.4 px apart, so every catcher overlapped its neighbour by 9 px and
 * the boundary between them sat at 29% of the gap rather than 50%.
 */
export function hitRadius(scale: number, spacing: number): number {
  return Math.max(
    Math.min(inScene(CATCH_PX, scale), spacing * 0.45),
    PITCH * 0.2,
  );
}

export type Aim =
  | { kind: "target"; id: NodeId }
  /** Two candidates too close to tell apart. `near` is the marginally closer. */
  | { kind: "ambiguous"; near: NodeId }
  /** Near the targets and on none of them. A miss, not a removal. */
  | { kind: "miss" }
  /** Away from everything. This is what "let go of it" looks like. */
  | { kind: "away" };

/**
 * One unbiased race, run from the point the lead will actually land on.
 *
 * The bias this replaces was not in the comparison — that was already fair —
 * but in what was compared. `nearest()` measured from the raw **pointer**,
 * while the thing being committed was a lead drawn somewhere else entirely:
 * off the kit shelf the whole part box was centred on the cursor and the lead
 * that got seated was `anchorOf`, a constant hole-and-a-bit away; on the bench
 * a transparent rect covered the part's whole 41.7 × 52.1 box, so where inside
 * the LED you happened to grab decided which hole it went into, by up to two
 * and a half pitches. Aiming at the hole you can see landed you in the next one
 * along, which is the complaint exactly as it was reported.
 *
 * `sticky` is the target the aim was on a moment ago. Ties are broken by
 * distance and never by array order: the old `d <= distance` handed a dead heat
 * to whichever candidate was sorted later, which put every boundary at 29% of
 * the gap instead of 50%.
 */
export function race(
  aim: Point,
  targets: readonly AimTarget[],
  radius: number,
  sticky?: NodeId | null,
): Aim {
  const ranked = targets
    .map((t) => ({ t, d: Math.hypot(t.at.x - aim.x, t.at.y - aim.y) }))
    .sort((a, b) => a.d - b.d);

  const best = ranked[0];
  if (!best) return { kind: "away" };
  if (best.d > radius * RELEASE_FACTOR) return { kind: "away" };
  if (best.d > radius) return { kind: "miss" };

  const held = sticky ? ranked.find((r) => r.t.id === sticky) : undefined;
  if (held && held.d <= radius && best.d >= STICKY * held.d) {
    return { kind: "target", id: held.t.id };
  }

  const runnerUp = ranked[1];
  if (runnerUp && runnerUp.d <= radius && runnerUp.d < AMBIGUOUS * best.d) {
    return { kind: "ambiguous", near: best.t.id };
  }
  return { kind: "target", id: best.t.id };
}

/**
 * The candidate nearest a point — no radius, no verdict, just the closest one.
 *
 * Where a keyboard walk starts once a lead is picked up. The picker used to
 * open on index 0 whenever the lead in hand was attached to nothing — the
 * board's top-left hole — and then bring the view to it, which on a zoomed
 * chapter two is 600 CSS px away from the lead under the cursor. `race` is not
 * the right question here: it answers *whether* a release counts, and a walk
 * has to start somewhere however far the nearest hole is.
 *
 * Asked of the lead's own node rather than of its lifted mark. On a breadboard
 * the mark sits half a pitch up and half a pitch right of the leg, which puts
 * it nearer the NEXT column's hole than the one the leg is standing over —
 * `bb.f20` for a leg over `bb.f19`. The node is where the leg is.
 *
 * Ties go to the earlier candidate in the list, which is reading order.
 */
export function nearestTarget(
  at: Point,
  targets: readonly AimTarget[],
): NodeId | undefined {
  let best: { id: NodeId; d: number } | undefined;
  for (const target of targets) {
    const d = Math.hypot(target.at.x - at.x, target.at.y - at.y);
    if (!best || d < best.d) best = { id: target.id, d };
  }
  return best?.id;
}

/**
 * Where the lead being committed is, given where the pointer has travelled.
 *
 * The one function that keeps the drawing and the drop in step: the ghost is
 * drawn from the same offset, so the mark under the lead is the mark that
 * receives it.
 */
export const carriedTo = (origin: Point, from: Point, to: Point): Point => ({
  x: origin.x + (to.x - from.x),
  y: origin.y + (to.y - from.y),
});

/**
 * The same thing, asked of the **canvas as it is now** at both ends.
 *
 * `carriedTo` takes two points already in scene units, and the only honest way
 * to get them is to convert the press and the release through *one* frame. The
 * gesture used to convert the press at pointer-down and keep the answer: then
 * picking up a lead grew the sentence above the bench by a row of buttons, the
 * canvas was pushed 48 CSS px down the page, and every later event was read
 * against a frame the press had never seen. The difference — 28 scene units of
 * upward travel nobody made — put every release past `RELEASE_FACTOR`'s bound,
 * so dragging a seated lead one hole sideways answered `away` and put the part
 * back in the box.
 *
 * `toScene` is live, so both ends land in the same frame however the region has
 * moved. `origin` needs no conversion: it is already a position on the bench,
 * and the bench does not move when the furniture around it does.
 */
export const carriedFrom = (
  origin: Point,
  fromClient: Point,
  toClient: Point,
  toScene: (clientX: number, clientY: number) => Point,
): Point =>
  carriedTo(
    origin,
    toScene(fromClient.x, fromClient.y),
    toScene(toClient.x, toClient.y),
  );

/** Travel in CSS px, which is the only space a hand is measured in. */
export const travelled = (from: Point, to: Point, slopPx: number) =>
  Math.hypot(to.x - from.x, to.y - from.y) > slopPx;

export const slopFor = (pointerType: string) =>
  pointerType === "touch" ? SLOP_TOUCH_PX : SLOP_MOUSE_PX;

/**
 * The zoom at which the closest two candidates are `MIN_TARGET_PX` apart.
 *
 * `null` when the view is already close enough, which is the common case and
 * the one that must not move: rule 6 says never to undo a view the person
 * chose, and this is only ever allowed to *raise* the zoom, only at the moment
 * a part is picked up — which is a change the person just made — and only when
 * the bench would otherwise be asking for an impossible aim.
 */
export function zoomToAim(scale: number, spacing: number): number | null {
  if (spacing <= 0) return null;
  const needed = MIN_TARGET_PX / spacing;
  return scale < needed ? needed : null;
}

/**
 * Where a lead's own handle sits: on the lead, unless the lead is loose.
 *
 * The picker's marks and the drag's aim use `aimAt`, the lifted point — a
 * diagonal half-pitch off the hole on a breadboard, a pitch and a half up on
 * chapter one's header — so that a mark never lands on the lattice. The
 * handles copied that point, and a seated lead's handle was then never where
 * the lead was drawn. At the opening fit the miss sat inside `CATCH_PX`, so
 * nobody noticed; at `zoom.max`, which `closer()` jumps to on every click
 * pick-up, the breadboard's 7.071-unit lift is 21 CSS px from the hole against
 * a 12 px catcher. Measured on chapter two's ground jumper: a press on the
 * seated end reached the canvas underneath and panned it. A rigid part still
 * moves by its body; a cable has no body, so this was "the cables cannot be
 * moved" as it was reported.
 *
 * A loose lead keeps the lifted point: its ring is drawn there, and the ring
 * is the handle — what you can see is what you can press.
 */
export const handlePoint = <N extends Point>(
  n: N,
  free: boolean,
  aimAt: (n: N) => Point,
): Point => (free ? aimAt(n) : { x: n.x, y: n.y });
