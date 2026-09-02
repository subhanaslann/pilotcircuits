"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ComponentIcon } from "@/components/illustration/component-icons";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import { PirSensor } from "@/components/canvas/parts/pir-sensor";
import { SoilProbe } from "@/components/canvas/parts/soil-probe";
import { UltrasonicSensor } from "@/components/canvas/parts/ultrasonic";
import { MicroServo } from "@/components/canvas/parts/micro-servo";
import { usePartDrag } from "@/components/canvas/use-part-drag";
import { useMascotCarrying } from "@/components/workbench/use-mascot-carrying";
import type { Aim } from "@/components/canvas/drag-math";
import { PITCH } from "@/lib/circuit/geometry";
import { boxOf, frame } from "@/lib/circuit/wokwi";
import { agent, connector, wireRoles } from "@/lib/design/tokens";
import type { CircuitNode, NodeId } from "@/lib/circuit/graph";
import type { PartId, TerminalId } from "@/lib/circuit/placement";
import type { KitId } from "@/lib/projects/catalog";
import { bench } from "@/components/illustration/spec";
import { cn } from "@/lib/utils/cn";

/**
 * The kit, pinned to the top of the bench.
 *
 * Every part still in the box, laid out on a shelf across the top edge of the
 * canvas well, picked up from there and dragged into a hole.
 *
 * ## Why it does not live in the scene
 *
 * It did, for one revision: a tray drawn on the mat above the board, in scene
 * units, panning and zooming with everything else. That is the more literal
 * bench and it is the wrong one, because the kit is not part of the circuit.
 * Zoom in on the header to place a lead and the box of parts you are placing
 * scrolls off the top of the screen.
 *
 * So it is furniture of the *region*, like the zoom buttons and the view
 * switch, and it stays put while the bench moves under it.
 *
 * ## The part is drawn once
 *
 * Batch 7's first rule — the same fact is never drawn twice — is what kept
 * dragging out of the rail: a gesture crossing from a 252px HTML panel into an
 * SVG needs a copy of the part in each. This strip pays it differently. The
 * part on the shelf and the part under the cursor are **one element**: it
 * leaves the shelf, travels over the canvas in this same layer, and the scene
 * draws it only once it is in a hole. There is never a frame with two of it.
 *
 * ## Shelf size on the shelf, board size over the board
 *
 * The two surfaces answer different questions. On the shelf the question is
 * *which part is this*, and a fixed size answers it at every zoom — a 220Ω
 * resistor drawn four pixels long because the camera is pulled back is not a
 * resistor, it is a dash. Over the bench the question is *does this go there*,
 * and that one can only be answered against the board underneath it: the LED
 * has to be the size it will be standing in the header, whatever the zoom, or
 * the person is judging a fit between two drawings at different scales.
 *
 * So the carried ghost is drawn at the canvas's own scale, hung from the lead
 * that lands, and the shelf is not. This used to be one size for both, on the
 * grounds that a true-scale ghost is illegible at the zoom the whole board fits
 * in. It is smaller there, and that is the honest thing for it to be — a part
 * on a board seen from far away is small.
 *
 * ## Three gestures, one commit
 *
 * **Drag** a part onto a hole; **click** it and then click a hole; or `Enter`
 * on it and use the arrows the seat picker owns. All three raise the same
 * `place` action, so nothing here is a second way for the build to change.
 *
 * ## A part comes out of the box whole, and lands on one lead
 *
 * The build is keyed by lead now, and this shelf is the one surface that is
 * still about parts: you do not pick a leg off a shelf, you pick up the LED.
 * So the row names the part and the gesture commits the part's **anchor lead**
 * — `spec.anchorOf`, decided by the build and never by this file, which is the
 * same lead the standoff geometry is written for and the one the steps name
 * first. Joining one lead onto another happens on the bench, where the other
 * part exists.
 */

/**
 * The jumper's box on the shelf: 30 x 50 scene units.
 *
 * Fifty and not a unit more. `SHELF_SCALE` below is **one number for the whole
 * catalogue**, taken off the tallest box in it — the LED's 52.083 — so a cable
 * drawn taller than an LED would shrink chapter one's shelf as a side effect of
 * chapter two joining the kit, and nothing would point at this line.
 */
const JUMPER_BOX = { width: PITCH * 3, height: PITCH * 5 };

/**
 * Both plugs on the box's centre line at x = 15; the cable leaves the top one
 * straight down, bows once right and once back left, and drops straight into
 * the bottom one. Its two ends sit four units *inside* the housings, so neither
 * end shows a butt joint where the stroke stops.
 *
 * Shallow on purpose — x never leaves 11…19. The whole drawing is about 38 CSS
 * pixels wide on the shelf, and a deeper bow at that size closes up into a blob
 * with a plug on each end.
 */
const CABLE = "M 15 4 C 15 14, 24 18, 15 25 C 6 32, 15 36, 15 46";

/**
 * A jumper wire, as the box has it.
 *
 * The one kit drawing that is not the part's own canvas artwork, because a
 * cable has no canvas artwork: on the bench it is a path between two holes
 * (`wire.tsx`), and a shelf has no holes. So this is the thing actually in the
 * bag — two moulded housings and a cable between them, lying slack.
 *
 * Drawn in the signal role and not in a colour of its own. Four M–M jumpers are
 * one interchangeable object as far as the build is concerned, so a shelf that
 * gave them four colours would be promising a distinction the circuit then has
 * to pretend not to notice.
 */
function JumperGhost() {
  const role = wireRoles.signal;
  return (
    <g>
      {/* The same two strokes every cable on the bench is drawn with: the hue
          a quarter darker and a shade wider underneath, so a dark rim shows
          down both sides and a flat stroke reads as a round tube. `wire.tsx`
          has the argument — it is why a wire here needs no blur. */}
      <path
        d={CABLE}
        fill="none"
        stroke={role.edge}
        strokeWidth={role.width * 1.4}
        strokeLinecap="round"
      />
      <path
        d={CABLE}
        fill="none"
        stroke={role.stroke}
        strokeWidth={role.width}
        strokeLinecap="round"
      />
      <Plug cy={PITCH * 0.6} rib={-PITCH * 0.18} />
      <Plug cy={JUMPER_BOX.height - PITCH * 0.6} rib={PITCH * 0.18} />
    </g>
  );
}

/**
 * The moulded housing, at the numbers `Connector` in `wire.tsx` uses: the same
 * 0.56-pitch width, the same pitch of height, the same corner, the same latch
 * rib on the half away from the cable.
 *
 * Written out again rather than imported, because that one is drawn around a
 * `CircuitNode` at a bench coordinate and this one stands in a 30 x 50 box with
 * no scene under it. What has to agree is the silhouette, and the colour — the
 * part that would actually go wrong unnoticed — comes from the token both of
 * them read.
 */
function Plug({
  cy,
  rib,
}: {
  cy: number;
  /** Signed offset to the latch rib: outward, where the light catches it. */
  rib: number;
}) {
  const width = PITCH * 0.56;
  const height = PITCH;
  const cx = JUMPER_BOX.width / 2;
  return (
    <g>
      <rect
        x={cx - width / 2}
        y={cy - height / 2}
        width={width}
        height={height}
        rx={PITCH * 0.16}
        fill={connector.body}
      />
      <line
        x1={cx - width * 0.28}
        y1={cy + rib}
        x2={cx + width * 0.28}
        y2={cy + rib}
        stroke={connector.rib}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * What a kit part looks like on the shelf.
 *
 * The bench's own artwork at the bench's own proportions — a 220Ω resistor is
 * longer than an LED here because it is longer on the desk. A part with no
 * entry falls back to the rail's flat icon rather than vanishing: the person
 * still has to be able to pick it up, and that icon is the one the rail is
 * already using for it one panel to the left.
 *
 * ## One drawing per component, which is not one per row
 *
 * The key is the catalogue's word for the *artwork*, so three lamps are three
 * `led`s and three 220Ω resistors are three `resistor`s. For the resistors, and
 * for four identical M–M jumpers, that is simply true — they are interchangeable
 * parts and the build's own model says so, which is why the cable is not drawn
 * in four colours. For the lamps it is not true: a kit holding a red, an amber
 * and a green LED draws three red domes, and the only thing separating those
 * rows is the `name` the row already carries — read out by a screen reader, and
 * offered to the pointer as a tooltip. Telling them apart by sight needs the
 * *build* to say which variant a row is; nothing on `KitPart` carries that
 * today, and deriving a colour from the part id in here would push one build's
 * naming convention into a component every build shares.
 */
const KIT_ART: Partial<
  Record<
    KitId,
    {
      box: { width: number; height: number };
      /** `uid` is what keeps one row's SVG ids off another's — see `PartArt`. */
      art: (uid: string) => ReactNode;
    }
  >
> = {
  /* Chapter one's single LED, which has no colour to be told apart from. */
  led: {
    box: boxOf(frame.led),
    art: (uid) => <Led x={0} y={0} colour="red" uid={uid} />,
  },
  /* Chapter two's three, drawn in the colour that is printed on the part —
     which here is the part. Three identical red domes on the shelf make the one
     choice this chapter opens with a guess, and the model does not treat the
     three lamps as interchangeable, so the guess is then reported as a fault
     the person had no way to avoid. */
  ledRed: {
    box: boxOf(frame.led),
    art: (uid) => <Led x={0} y={0} colour="red" uid={uid} />,
  },
  ledYellow: {
    box: boxOf(frame.led),
    art: (uid) => <Led x={0} y={0} colour="yellow" uid={uid} />,
  },
  ledGreen: {
    box: boxOf(frame.led),
    art: (uid) => <Led x={0} y={0} colour="green" uid={uid} />,
  },
  /* Chapter three's sensor. The first module on this shelf, and the reason
     `shelfScale` is per part: its case is nearly twice an LED's height, and one
     scale over both would have drawn the LED at half the size it has been in
     every chapter so far. */
  sensorMotion: {
    box: boxOf(frame.pir),
    art: () => <PirSensor at={{ x: 0, y: 0 }} />,
  },
  /* Chapter four's probe, and the reason `shelfScale` is a `Math.min` rather
     than one number: this board is 385 scene units long, seven times an LED.
     Drawn at the shelf's own scale it would be five hundred pixels tall. */
  sensorMoisture: {
    box: boxOf(frame.soil),
    art: () => <SoilProbe at={{ x: 0, y: 0 }} />,
  },
  /* Chapter five's two. The servo is drawn with no arm for the reason its
     bench spec gives: the barrier plank is chapter six's part, not a servo's. */
  sensor: {
    box: boxOf(frame.sensor),
    art: () => <UltrasonicSensor at={{ x: 0, y: 0 }} />,
  },
  servo: {
    box: boxOf(frame.servo),
    art: () => (
      <MicroServo
        at={{ x: 0, y: 0 }}
        pins={[]}
        angle={0}
        showLabels={false}
        showArm={false}
      />
    ),
  },
  resistor: {
    box: boxOf(frame.resistor),
    art: () => <Resistor x={0} y={0} ohms={220} />,
  },
  jumper: { box: JUMPER_BOX, art: () => <JumperGhost /> },
};

/** How tall the tallest part in the catalogue is drawn, in CSS pixels. */
const PART_HEIGHT = 66;

/**
 * Pixels per scene unit on the shelf — the ruler every through-hole part is
 * drawn against, calibrated so a 5 mm LED fills the row.
 *
 * It was "the tallest registered box", which was the same number for as long as
 * the catalogue held nothing bigger than an LED. `shelfScale` below is what
 * happens when it does.
 *
 * Not "fit the tallest part still in the box", which is what this was for a
 * revision and which is wrong in a way that only shows up late: place the LED
 * and the resistor is suddenly the only thing left, so it becomes the tallest
 * thing left, and a 220Ω resistor is drawn a foot long. What the shelf is for
 * is recognising a part, and a part you recognised a moment ago must not
 * change size because a different one was used up.
 */
const SHELF_SCALE = PART_HEIGHT / boxOf(frame.led).height;

/**
 * What one part is actually drawn at: the shelf's scale, unless it is too big
 * to fit the row at it.
 *
 * `SHELF_SCALE` above used to be `PART_HEIGHT / the tallest registered box`,
 * which was the same number as long as the tallest thing in the catalogue was
 * a 5 mm LED. Chapter three puts a sensor module on the shelf, chapter four a
 * 98 mm soil probe and chapter five a servo — the probe alone is seven times an
 * LED, and one scale over all of them draws the LED at nine pixels. A shelf
 * whose whole job is *recognising a part* cannot afford that.
 *
 * So the rule is per part and static, which keeps the property the old comment
 * was really defending: **a part is drawn at the same size wherever it appears
 * and whatever else is in the box.** What it gives up is relative size between
 * a component and a module, and only there — every through-hole part is still
 * drawn against the same ruler as every other, so a 220Ω resistor is still a
 * sixth the height of the LED beside it.
 */
/**
 * How wide one part's drawing is allowed to get, in CSS pixels.
 *
 * `shelfScale` capped HEIGHT only, which is the right rule for a catalogue of
 * through-hole parts and the wrong one the moment a module joins it. An HC-SR04
 * is 45 x 25 mm: it fills the row's height at a scale that runs it 119px along,
 * and a micro servo runs 94. Chapter five's seven parts came to 710 CSS pixels
 * of shelf in the 597 the workshop column has at 1280 — five rows visible, the
 * LED, the resistor and a jumper (steps five and six) off the edge — and those
 * two modules were 236 of the excess.
 *
 * 80 is the resistor, near enough: 78px is the longest through-hole drawing in
 * the catalogue, so nothing that fitted before changes size, and a module is
 * capped at the width of the widest thing it is standing next to. What it gives
 * up is the module being drawn taller than the parts around it, which is not
 * what the shelf is for — the shelf is for recognising a part.
 *
 * This closes chapters three, four and five at 1280. It does not close chapter
 * two: ten rows do not fit on one line at any tile size that leaves a 220Ω
 * resistor looking like a resistor (ten tiles' padding plus nine gaps is
 * already 264 of the 597 before a single part is drawn). That chapter keeps the
 * measured edge fade and the shelf's own scrollbar. See `kit-strip.test.ts`.
 */
const MAX_ROW_PX = 80;

const shelfScale = (component: KitId) => {
  const box = KIT_ART[component]?.box;
  return box
    ? Math.min(SHELF_SCALE, PART_HEIGHT / box.height, MAX_ROW_PX / box.width)
    : SHELF_SCALE;
};

/**
 * A part's shelf drawing, measured — for the one other thing that draws it.
 *
 * The agent's ring picks a part off its tile and carries it (`agent-mascot.tsx`),
 * and to close on the anchor mark it needs the box the mark is written in and
 * the pixels per scene unit the tile draws that box at. `undefined` for a
 * component with no artwork of its own: the fallback icon has no box to find
 * a mark in, and the ring then comes for the tile and carries nothing rather
 * than carrying a guess.
 */
export function shelfArt(
  component: KitId,
): { box: { width: number; height: number }; scale: number } | undefined {
  const kit = KIT_ART[component];
  return kit ? { box: kit.box, scale: shelfScale(component) } : undefined;
}

/** What separates two rows, in CSS pixels — Tailwind's `gap-4` on the `<ul>`. */
export const KIT_SHELF_GAP = 16;

/** The `p-1.5` a row's button carries on each side, in CSS pixels. */
const KIT_SHELF_ROW_PAD = 12;

/**
 * How wide one row of the shelf is, in CSS pixels, padding included.
 *
 * Exported for the test that keeps the shelf inside the workshop column at
 * 1280. Nothing renders through it — it is the same arithmetic the row's own
 * `PartArt` does, said once so a test can ask the question without a DOM.
 */
export function shelfRowWidth(component: KitId): number {
  const box = KIT_ART[component]?.box;
  if (!box) return PART_HEIGHT + KIT_SHELF_ROW_PAD;
  return box.width * shelfScale(component) + KIT_SHELF_ROW_PAD;
}

/**
 * The shelf's height, in CSS pixels.
 *
 * Exported and fixed rather than left to the content, because the region's
 * other furniture — the zoom buttons, the view switch — has to stand clear of
 * it, and a bar that sized itself would have them overlapping the day a part
 * with a taller drawing joined the kit.
 */
export const KIT_STRIP_HEIGHT = 94;

/**
 * How far the shelf feathers out at an end it is running off.
 *
 * About half the narrowest row in the catalogue. Any less and the feather falls
 * in the gap between two parts, where it reads as a smudge on the strip rather
 * than as a part continuing past the edge.
 */
const SHELF_FADE = 24;

export interface KitPart {
  part: PartId;
  /** The lead this part lands on when it is dragged out of the box. */
  terminal: TerminalId;
  component: KitId;
  /** `Pick up the LED`, already in the reader's language — still the part. */
  name: string;
  /**
   * Where that lead is on the drawing, so the part can say which end lands.
   *
   * The gesture commits one lead and the shelf draws the whole part, so an LED
   * under the cursor was two legs and no answer to *which of these is going
   * into that hole* — the person aimed, let go, and found out afterwards. The
   * point comes from the build (`spec.anchorMark`); this file only draws it.
   */
  mark?: { x: number; y: number; label?: string };
  /**
   * Where this part's body will stand once it is placed, in **scene** units —
   * set only for a part whose body does not travel.
   *
   * A module is a case and some leads. `breadboard-bench.tsx`'s `carriedTo`
   * has always known that the case is a constant — *it is on the bench or it
   * is not; it is never in the air* — and this file did not, so the ghost hung
   * the whole box off the anchor mark under the cursor and the case jumped up
   * to its own length on release. The build is what knows; see
   * `declaredBodyAt`.
   */
  bodyAt?: { x: number; y: number };
}

export function KitStrip({
  caption,
  parts,
  targets,
  targetsFor,
  aimAt,
  toScene,
  onPick,
  onSettle,
  onHover,
  onSeat,
  onNear,
  scale,
  className,
  trailing,
  spotlight,
}: {
  /**
   * G-16 · what stands at the far end of the shelf: the coach.
   *
   * A slot rather than the figure itself, because what the coach is doing is
   * the session's answer and this is a shelf. It is a flex sibling of the
   * tile row and not something floated over it, so the tiles scroll under a
   * shorter row instead of sliding beneath the figure.
   */
  trailing?: ReactNode;
  /**
   * C-25 · the part `point_at` was asked about while it is still in the box.
   *
   * There is no hole on the bench to mark, so the mark goes around the tile,
   * and the shelf scrolls the tile into view first — a ring around a part
   * that is off the end of the shelf would be an answer nobody can see.
   */
  spotlight?: PartId;
  /** One word, printed on the shelf. */
  caption: string;
  /** Only what is still in the box. A placed part is drawn on the bench. */
  parts: readonly KitPart[];
  /**
   * Everywhere a part coming off the shelf may land, in scene units: the board
   * holes, **and** the free leads of parts already on the bench.
   *
   * The second half is not a flourish — a resistor already in `D9` can hold the
   * LED up, and a part positioned from another part's lead is exactly what the
   * placement model allows. Same-part conflicts need no filtering here: a part
   * still in the box has no lead on the bench to conflict with.
   */
  targets: readonly CircuitNode[];
  /** Where this part's anchor lead may go, asked at the press. */
  targetsFor?: (terminal: TerminalId) => readonly CircuitNode[];
  /**
   * Where a target offers itself, which is not always where it is. Handed in so
   * the shelf aims at the same points the bench and the picker draw.
   */
  aimAt?: (target: CircuitNode) => { x: number; y: number };
  toScene: (clientX: number, clientY: number) => { x: number; y: number };
  /** The viewport's zoom, so a screen fact can be turned into a bench one. */
  scale: () => number;
  onPick: (terminal: TerminalId) => void;
  /** The press turned out to be a click, and the picker now owns the choice. */
  onSettle?: (terminal: TerminalId) => void;
  /** The target a drop would land on right now, so the bench can mark it. */
  onHover: (target: NodeId | null) => void;
  onSeat: (terminal: TerminalId, target: NodeId) => void;
  /**
   * A release that reached the bench and landed on no hole.
   *
   * Not the same as a release that never left the shelf: the person aimed at
   * the board and missed, and saying nothing is what made a mis-aim look like a
   * gesture the interface had not noticed.
   */
  onNear?: (aim: Aim) => void;
  className?: string;
}) {
  const region = useRef<HTMLDivElement>(null);

  const local = (clientX: number, clientY: number) => {
    const rect = region.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  };

  /**
   * Where this layer's top-left is on the screen, taken at the press.
   *
   * `local` reads it off the ref on every pointer move, which it may: it runs
   * in a listener. The carried ghost cannot — its position is worked out while
   * rendering, and a ref read there is the hazard `react-hooks/refs` names. So
   * the one gesture that needs the layer's origin *during* a render takes it
   * once, when the part is picked up. Nothing moves this layer mid-drag: the
   * frame does not scroll and the rail beside it does not resize while a
   * pointer is down.
   */
  const [origin, setOrigin] = useState({ left: 0, top: 0 });

  /** A point in this layer, in the bench's own units. The inverse of `local`. */
  const sceneAt = (point: { x: number; y: number }) =>
    toScene(point.x + origin.left, point.y + origin.top);


  /* The shelf's answer to a release that landed on nothing: nothing. The part
     was in the box and it stays there — see `lamp-scene.tsx` for the bench's
     answer, which is the mirror of it, because down there a release out on the
     desk means the lead is loose.

     `aimOrigin` is omitted on purpose, and it is the one place omitting it is
     right: the part is not on the bench yet, so there is no drawn lead to
     measure from and the cursor genuinely is the aim. The ghost below is
     centred on the cursor to match, which is why the two agree. */
  const { held, bind } = usePartDrag({
    locate: local,
    toScene,
    scale,
    targets,
    targetsFor,
    aimAt,
    /* The press, and the one moment the layer's origin can be measured without
       reading a ref while rendering — see `origin`. */
    onPick: (terminal) => {
      const rect = region.current?.getBoundingClientRect();
      if (rect) setOrigin({ left: rect.left, top: rect.top });
      onPick(terminal);
    },
    onSettle,
    onHover,
    onDrop: (terminal, aim) => {
      if (aim.kind === "target") onSeat(terminal, aim.id);
      else if (aim.kind === "ambiguous" || aim.kind === "miss") onNear?.(aim);
    },
  });

  /* Keyed by the lead, because that is what the drag is carrying: the gesture
     commits `anchorOf`, so the id in hand is a terminal and a row that still
     compared parts would lose the part under the cursor mid-drag. */
  const carried = held?.moved
    ? parts.find((part) => part.terminal === held.id)
    : undefined;

  /* The part the AGENT has hold of, when `attach_lead` starts on this shelf.
     Its tile fades exactly as a person's own drag fades theirs — the ring is
     carrying the drawing, so the drawing leaves the box. Nothing about the
     person's gesture reads this. */
  const carriedByRing = useMascotCarrying();

  const shelf = useRef<HTMLUListElement>(null);

  /* Nearest edge, so a tile already in view does not move; instant under
     reduced motion, since the tile is the only thing a person needs and a
     smooth scroll is decoration on the way to it. */
  useEffect(() => {
    if (!spotlight) return;
    const tile = shelf.current?.querySelector<HTMLElement>(
      `[data-kit-part="${CSS.escape(spotlight)}"]`,
    );
    tile?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [spotlight]);

  /**
   * Which end of the shelf is running off the edge, if either.
   *
   * Ten rows is where this stopped being theoretical. Chapter one's kit is two
   * parts and always fits; chapter two's is three lamps, three resistors and
   * four cables — around 900 CSS pixels of shelf in a well that is often 600
   * wide — so four of them sit outside the strip, the row ends flush against
   * the edge, and nothing anywhere says there is more. `globals.css` already
   * answers exactly this for a vertical pane in `.scroll-fade`, and its comment
   * is the argument: a row clipped by a hard edge looks broken, a row fading
   * out reads as "there is more". That one is unconditional. This one is
   * measured, because a shelf holding two parts is not cut and must not be
   * drawn as though it were.
   */
  const [cut, setCut] = useState({ start: false, end: false });

  useEffect(() => {
    const el = shelf.current;
    if (!el) return;
    const read = () => {
      /* A pixel of slack at each end: a row that fits still reports a fraction
         of overflow at some browser zooms, and a fade blinking on and off at
         the edge of the arithmetic is worse than no fade at all. */
      const start = el.scrollLeft > 1;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      /* Same object back when nothing moved — this runs on every scroll event
         of a flung shelf, and a fresh object each time re-renders ten parts
         and whatever is under the cursor for no reason. */
      setCut((was) =>
        was.start === start && was.end === end ? was : { start, end },
      );
    };
    read();
    el.addEventListener("scroll", read, { passive: true });
    /* The strip is furniture of the *region* (see the header), so it resizes
       when the panel beside it does and not when the window does. */
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", read);
      observer.disconnect();
    };
    /* Placing a part takes a row out of the box: the content narrows without
       the shelf's own box changing, so neither the scroll nor the resize would
       fire and the fade would go on claiming a part that is no longer there.
       The count and not the array — `parts` is rebuilt every render, and
       re-attaching two listeners per frame is not what this is for. */
  }, [parts.length]);

  /* One gradient covering both ends, rather than a class per side: the two
     cases differ only in which stop is transparent, and the stops have to stay
     the same distance in from both edges or the shelf looks lopsided the
     moment it is scrolled to the middle. */
  const cutEnd = (off: boolean) => (off ? "transparent" : "black");
  const fade =
    cut.start || cut.end
      ? {
          maskImage:
            `linear-gradient(to right, ${cutEnd(cut.start)} 0,` +
            ` black ${SHELF_FADE}px,` +
            ` black calc(100% - ${SHELF_FADE}px),` +
            ` ${cutEnd(cut.end)} 100%)`,
        }
      : undefined;

  return (
    <div
      ref={region}
      className={cn("pointer-events-none absolute inset-0 z-10", className)}
    >
      {/* The shelf. Stuck to the top edge of the well, on the well's own dark
          ground rather than a panel of its own — the region has one raised
          surface and it is the board. */}
      {/* `focus-on-dark` is the whole of the fix for the ring in here, and it
          is on the container rather than on the row: the product's one focus
          ring is `--color-accent`, tuned for the app's `#f5f7f8` paper where it
          reads 3.82:1, and this shelf composites to `#3c474f`, where it is
          2.32:1 — under the 3:1 WCAG 1.4.11 and 2.4.11 both ask of a focus
          indicator, on the keyboard's entry point to the entire placement
          gesture. The utility re-points `--focus-ring-color`, which inherits,
          so the ten rows below say nothing about what they are standing on.
          Not on the region: the zoom toolbar and the view switch float on
          `bg-surface` twelve pixels underneath, and a white ring there would be
          the same bug the other way round. */}
      <div
        className="focus-on-dark pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-5 border-b border-[#4E5C66] bg-[#333E46]/95 px-4"
        style={{ height: KIT_STRIP_HEIGHT }}
      >
        {/* Lifted from `#98A6B0`, which read 3.81:1 on the shelf's composited
            `#3c474f`. `text-overline` is 11px and uppercase, which is normal
            text as far as WCAG is concerned, so 4.5:1 applies; this is
            5.13:1. */}
        <span className="text-overline shrink-0 text-[#B4C0C9] uppercase">
          {caption}
        </span>

        {/* `gap-4`, down from `gap-7`. See `MAX_ROW_PX`: 28px between ten rows
            is 252 of the 597 the shelf has at 1280, and 16 leaves the parts a
            clear 28px of whitespace between them anyway, since every tile
            carries 6px of padding on each side. */}
        <ul
          ref={shelf}
          style={fade}
          className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto"
        >
          {parts.map((part) => (
            <li key={part.part} className="relative shrink-0">
              <button
                type="button"
                aria-label={part.name}
                /* The picture cannot always tell two rows apart — three lamps
                   are three `led`s to the catalogue and draw the same dome —
                   so the name the screen reader already gets is offered to the
                   pointer as well. A stopgap, not the fix; see `KIT_ART`. */
                title={part.name}
                /* Named for the agent: `use-agent-mascot.ts` finds the tile a
                   carry starts on by this, scrolls it into view and measures
                   it, so the ring closes on the part where the person sees
                   it. */
                data-kit-part={part.part}
                className={cn(
                  "focus-visible:ring-focus duration-instant grid touch-none place-items-center rounded-lg p-1.5",
                  "cursor-grab transition-colors hover:bg-white/10 active:cursor-grabbing",
                  /* Off the shelf, not gone: the space stays, so the row does
                     not close up under the cursor mid-drag. The same fade
                     whether the hand is the person's or the agent's. */
                  ((held?.id === part.terminal && held.moved) ||
                    carriedByRing === part.part) &&
                    "opacity-20",
                )}
                style={{ height: PART_HEIGHT + 12 }}
                {...bind(part.terminal)}
                /* Both, in that order, exactly as the rail's kit rows do
                   (`live-workbench.tsx`'s `kit.onPick`). `onSettle` is raised
                   from `usePartDrag`'s pointer release and from nowhere else,
                   so a mouse click on this button took the closer look and
                   `Enter` on the same button did not — leaving the keyboard at
                   the opening fit, where the picker's marks are about nine CSS
                   pixels apart. Rule 14 claims the keyboard route is as precise
                   as the pointer's; this was the one entry point where it was
                   not. */
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onPick(part.terminal);
                  onSettle?.(part.terminal);
                }}
              >
                <PartArt
                  component={part.component}
                  uid={part.part}
                  mark={part.mark}
                />
              </button>
              {spotlight === part.part ? <TileSpotlight /> : null}
            </li>
          ))}
        </ul>
        {trailing ? <div className="shrink-0 pl-1">{trailing}</div> : null}
      </div>

      {/* The part in hand, over the bench — **at the size it will be when it
          lands**, and hanging from the lead that lands. See the header note. */}
      {carried && held ? (
        <div
          /* Translucent, and it has to be: the aim off this shelf is the
             cursor, the mark that answers it is drawn on the hole under the
             cursor, and an opaque part carried in a layer above the canvas
             covers the one piece of feedback the gesture has. A person aiming
             at a hole they cannot see is aiming at nothing. */
          className="pointer-events-none absolute opacity-80 drop-shadow-[0_8px_14px_rgba(8,14,20,0.55)]"
          /* The cursor in scene units, which only a module's ghost reads. The
             region's own rect is what turns its layer coordinates back into
             client ones; `toScene` does the rest. */
          style={carriedAt(held.at, carried, scale(), sceneAt(held.at))}
        >
          <PartArt
            component={carried.component}
            /* The row it came from is still on the shelf, dimmed but drawn, so
               this is a second copy of it in the same document and cannot
               carry the same ids. */
            uid={`held-${carried.part}`}
            mark={carried.mark}
            scale={scale()}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * One part, at a size in pixels derived from its box in scene units.
 *
 * `scale` is CSS pixels per scene unit: omitted on the shelf, where the answer
 * is this part's own `shelfScale`; the canvas's own zoom once the part is over
 * the bench. **Not defaulted in the parameter list** — a default there is
 * indistinguishable from a value the caller passed, and it made the shelf draw
 * every part at the LED's scale however tall it was.
 */
function PartArt({
  component,
  uid,
  mark,
  scale,
}: {
  component: KitId;
  /**
   * Unique to this drawing, in this document.
   *
   * Some of the bench artwork builds SVG filter ids out of a string
   * (`led-artwork.tsx`) and ids are document-global, so three LED rows and the
   * one under the cursor cannot all answer to `led-red`: the last definition
   * wins and the others light with its blur radius. The part id separates the
   * rows and the carried copy takes a prefix, because it is a fifth drawing of
   * a row that is still on the shelf.
   */
  uid: string;
  mark?: { x: number; y: number; label?: string };
  /** Omitted on the shelf, where the answer is this part's own shelf scale. */
  scale?: number;
}) {
  const kit = KIT_ART[component];
  /* The fallback icon is not this part's drawing, so a point measured against
     the part's box would land somewhere arbitrary on it. */
  if (!kit) return <ComponentIcon id={component} size={PART_HEIGHT} />;

  const base = shelfScale(component);
  const drawn = scale ?? base;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${kit.box.width} ${kit.box.height}`}
      width={kit.box.width * drawn}
      height={kit.box.height * drawn}
      className="block overflow-visible"
    >
      {kit.art(uid)}
      {mark ? <AnchorMark {...mark} scale={drawn} base={base} /> : null}
    </svg>
  );
}

/**
 * The same drawing, riding in the agent's ring.
 *
 * `PartArt` for a layer that is itself an `<svg>`: a nested `<svg>` placed by
 * `x`/`y` rather than an HTML element placed by CSS, hung from the anchor
 * mark exactly as the person's own carried ghost is (`carriedAt`) — the mark
 * is where the ring has closed, so the leg the ring holds is the leg that
 * lands. `scale` is pixels per scene unit and changes across the travel: the
 * tile's own scale as it leaves the shelf, the bench's zoom as it arrives,
 * because over the bench the question is *does this go there*, and that is
 * only answerable against the board underneath at the board's own size.
 *
 * Nothing for a component with no artwork; see `shelfArt`.
 */
export function CarriedPartArt({
  component,
  uid,
  mark,
  at,
  scale,
}: {
  component: KitId;
  uid: string;
  mark?: { x: number; y: number; label?: string };
  /** Where the mark goes, in the layer's pixels. */
  at: { x: number; y: number };
  scale: number;
}) {
  const kit = KIT_ART[component];
  if (!kit) return null;
  const grip = mark ?? { x: kit.box.width / 2, y: kit.box.height / 2 };

  return (
    <svg
      aria-hidden="true"
      x={at.x - grip.x * scale}
      y={at.y - grip.y * scale}
      width={kit.box.width * scale}
      height={kit.box.height * scale}
      viewBox={`0 0 ${kit.box.width} ${kit.box.height}`}
      overflow="visible"
    >
      {kit.art(uid)}
      {mark ? (
        <AnchorMark {...mark} scale={scale} base={shelfScale(component)} />
      ) : null}
    </svg>
  );
}

/**
 * Which end of this part is going into the hole.
 *
 * Drawn in the part's own box, so the sizes are given in CSS pixels and divided
 * by the scale the part is drawn at — a mark measured in scene units would be a
 * different size
 * on an LED than on a resistor, and this is a piece of interface rather than a
 * piece of hardware.
 *
 * The dark halo under the dot and behind the glyph is load-bearing: this lands
 * on the LED's red dome, on a beige resistor body and on the dark shelf, and a
 * single light colour is invisible on at least one of them.
 */
/** Under the mark, so it reads on a red dome, a beige body and a dark shelf. */
const MARK_GROUND = "#10161C";

/**
 * Where the carried part is drawn, given where the pointer is.
 *
 * **Hung from the lead that lands, not centred on the cursor.** Off this shelf
 * the aim *is* the pointer (`usePartDrag` gets no `aimOrigin`, because the part
 * is not on the bench yet and there is no drawn lead to measure from), so the
 * anchor lead goes exactly where the cursor is — and now that the part is drawn
 * at the board's own scale, drawing it centred put the LED's short leg 17.7
 * scene units above the hole it was about to go into. Two pitches of daylight
 * between the picture and the drop, at the one moment somebody is aiming.
 *
 * `mark` is the same point the badge is drawn on, so the leg you can see going
 * into the header is the leg that lands there. Without one — a component with
 * no artwork of its own — it falls back to centring, which is all the cursor
 * can honestly claim about a part it cannot measure.
 */
function carriedAt(
  at: { x: number; y: number },
  part: KitPart,
  scale: number,
  /** Where the cursor is in scene units, for the one part kind that needs it. */
  aim?: { x: number; y: number },
): { left: number; top: number; transform?: string } {
  const kit = KIT_ART[part.component];
  if (!part.mark || !kit) {
    return { left: at.x, top: at.y, transform: "translate(-50%, -50%)" };
  }
  /* **A module's case does not travel**, so the ghost does not carry it. The
     case is drawn where the build declares it and the cursor carries the anchor
     lead alone — which is what the bench does mid-drag (`carriedTo`) and what
     the drop actually commits. Hung off the cursor instead, the ghost promised
     a case in one place and delivered it up to a body length away: PIR 97.7
     scene units, micro servo 124.8, soil probe 225.

     The aim is still the cursor and the hole under it is still marked by the
     picker — that is the feedback the gesture has, and it is unchanged. What
     changes is that the picture of the part stops disagreeing with it. */
  if (part.bodyAt && aim) {
    return {
      left: at.x + (part.bodyAt.x - aim.x) * scale,
      top: at.y + (part.bodyAt.y - aim.y) * scale,
    };
  }
  return {
    left: at.x - part.mark.x * scale,
    top: at.y - part.mark.y * scale,
  };
}

function AnchorMark({
  x,
  y,
  label,
  scale,
  base,
}: {
  x: number;
  y: number;
  label?: string;
  scale: number;
  /** This part's own shelf scale — the size the badge is calibrated at. */
  base: number;
}) {
  /**
   * The mark is interface, so it is measured in CSS pixels — but it is never
   * allowed to be *bigger* relative to the part than it is on the shelf.
   *
   * A constant pixel size on a part drawn at 40% zoom is a 13px badge on a
   * 21px LED, which is a sticker with a component behind it. Capped at 1, it
   * keeps its shelf size wherever there is room and shrinks with the part where
   * there is not — measured against the part's OWN shelf scale, since a module
   * and an LED are no longer drawn at the same one.
   */
  const px = (value: number) => (value * Math.min(1, scale / base)) / scale;
  const badge = px(11);
  return (
    <g>
      <circle cx={x} cy={y} r={px(3.6)} fill={MARK_GROUND} opacity={0.85} />
      <circle cx={x} cy={y} r={px(1.9)} fill={bench.label} />
      {label ? (
        <>
          {/* A plate under the glyph rather than a stroke around it. An
              outlined `−` is a bar with a heavier bar drawn round it, and at
              this size the outline closes over the glyph and prints a solid
              dash of the halo colour — which is what it did. */}
          <rect
            x={x - badge / 2}
            y={y - px(8) - badge / 2}
            width={badge}
            height={badge}
            rx={px(3.4)}
            fill={MARK_GROUND}
            opacity={0.92}
          />
          <text
            x={x}
            y={y - px(8)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={px(10)}
            fontWeight={700}
            fill={bench.label}
          >
            {label}
          </text>
        </>
      ) : null}
    </g>
  );
}

/**
 * C-25 · the ring's docked pose, around a tile.
 *
 * `point_at` on a part still in the box has no hole to close on, so the mark
 * is left on the shelf instead: the same open ring and the four arms the
 * flying ring grows when it lands, stretched to the tile's rounded box. Sized
 * in percentages, because a tile is as wide as its part — a resistor is twice
 * an LED — and this must not know which. The rect's box is a CSS geometry
 * property (SVG 2), which is what lets it be `100% − 3px` without measuring.
 * Not a control, like every other mark the agent leaves: the button under it
 * is still the thing to pick up.
 */
function TileSpotlight() {
  const box = {
    x: 1.5,
    y: 1.5,
    rx: 10,
    style: { width: "calc(100% - 3px)", height: "calc(100% - 3px)" },
  } as const;
  const arms = [
    { x: "50%", y: -7.5, width: 2.4, height: 6, transform: "translate(-1.2 0)" },
    { x: "50%", y: "100%", width: 2.4, height: 6, transform: "translate(-1.2 1.5)" },
    { x: -7.5, y: "50%", width: 6, height: 2.4, transform: "translate(0 -1.2)" },
    { x: "100%", y: "50%", width: 6, height: 2.4, transform: "translate(1.5 -1.2)" },
  ] as const;
  return (
    <svg
      aria-hidden="true"
      className="motion-safe:motion-pop pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <rect {...box} fill="none" stroke={agent.halo} strokeWidth={5} opacity={0.45} />
      <rect {...box} fill="none" stroke={agent.mark} strokeWidth={2.4} />
      {arms.map((arm, index) => (
        <rect key={index} {...arm} rx={1.2} fill={agent.mark} />
      ))}
    </svg>
  );
}
