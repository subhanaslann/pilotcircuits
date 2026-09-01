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
import type { Aim } from "@/components/canvas/drag-math";
import { PITCH } from "@/lib/circuit/geometry";
import { boxOf, frame } from "@/lib/circuit/wokwi";
import { connector, wireRoles } from "@/lib/design/tokens";
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
const shelfScale = (component: KitId) => {
  const box = KIT_ART[component]?.box;
  return box ? Math.min(SHELF_SCALE, PART_HEIGHT / box.height) : SHELF_SCALE;
};

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
}: {
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
    onPick,
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

  const shelf = useRef<HTMLUListElement>(null);

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
      <div
        className="pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-5 border-b border-[#4E5C66] bg-[#333E46]/95 px-4"
        style={{ height: KIT_STRIP_HEIGHT }}
      >
        <span className="text-overline shrink-0 text-[#98A6B0] uppercase">
          {caption}
        </span>

        <ul
          ref={shelf}
          style={fade}
          className="flex min-w-0 flex-1 items-center gap-7 overflow-x-auto"
        >
          {parts.map((part) => (
            <li key={part.part} className="shrink-0">
              <button
                type="button"
                aria-label={part.name}
                /* The picture cannot always tell two rows apart — three lamps
                   are three `led`s to the catalogue and draw the same dome —
                   so the name the screen reader already gets is offered to the
                   pointer as well. A stopgap, not the fix; see `KIT_ART`. */
                title={part.name}
                className={cn(
                  "focus-visible:ring-focus duration-instant grid touch-none place-items-center rounded-lg p-1.5",
                  "cursor-grab transition-colors hover:bg-white/10 active:cursor-grabbing",
                  /* Off the shelf, not gone: the space stays, so the row does
                     not close up under the cursor mid-drag. */
                  held?.id === part.terminal && held.moved && "opacity-20",
                )}
                style={{ height: PART_HEIGHT + 12 }}
                {...bind(part.terminal)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onPick(part.terminal);
                }}
              >
                <PartArt
                  component={part.component}
                  uid={part.part}
                  mark={part.mark}
                />
              </button>
            </li>
          ))}
        </ul>
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
          style={carriedAt(held.at, carried, scale())}
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
): { left: number; top: number; transform?: string } {
  const kit = KIT_ART[part.component];
  if (!part.mark || !kit) {
    return { left: at.x, top: at.y, transform: "translate(-50%, -50%)" };
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
