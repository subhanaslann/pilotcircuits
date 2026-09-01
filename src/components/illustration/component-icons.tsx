import type { ReactElement, ReactNode } from "react";
import type { KitId } from "@/lib/projects/catalog";
import {
  ICON_BOX,
  ICON_STROKE,
  ICON_STROKE_BOLD,
  material as m,
} from "@/components/illustration/spec";

/**
 * P-06 · Component icon set
 *
 * Ten marks for the ten things a build in this library asks you to have.
 *
 * **One file on purpose.** These are small enough that the real risk is not
 * length but drift — ten separate files get ten slightly different stroke
 * weights and ten different levels of detail. Side by side in one file the set
 * is edited as a set, which is the only way it stays one hand's work.
 *
 * Seen from above, like the canvas: the product has one point of view of a
 * workbench and this is it. Colours come from `spec.ts`, which lifts them from
 * `canvas/parts/` — the servo mark is the blue of the servo on the board.
 *
 * `sensor` is generic. Distance, soil moisture, motion and temperature all get
 * this mark, so a legend of ten covers seven builds rather than growing an
 * entry per part.
 */

interface MarkProps {
  size?: number;
  className?: string;
}

function Svg({
  size = 40,
  className,
  children,
}: MarkProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${ICON_BOX} ${ICON_BOX}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** The microcontroller: PCB, USB shell on one edge, two header rows, a chip. */
export function BoardMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <rect
        x={7}
        y={11}
        width={34}
        height={26}
        rx={3}
        fill={m.pcbGreen}
        stroke={m.pcbGreenEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      {/* USB shell, the way you find the board's front edge. */}
      <rect
        x={4}
        y={15}
        width={7}
        height={8}
        rx={1.2}
        fill={m.metal}
        stroke={m.metalEdge}
        strokeWidth={ICON_STROKE}
      />
      {/* Header rows, top and bottom. */}
      {[14.5, 33.5].map((y) => (
        <rect
          key={y}
          x={13}
          y={y}
          width={25}
          height={3}
          rx={1.2}
          fill={m.shell}
        />
      ))}
      <rect x={18} y={21} width={13} height={7} rx={1.4} fill={m.shellDeep} />
    </Svg>
  );
}

/** The breadboard: centre channel, hole matrix, two power rails. */
export function BreadboardMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <rect
        x={5}
        y={10}
        width={38}
        height={28}
        rx={2.5}
        fill={m.cream}
        /* Contoured in metal rather than in its own edge tone: cream on a white
           card all but disappeared, and this mark has to hold at 24px. */
        stroke={m.metalEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      {/* The rails: the one place a breadboard carries colour. */}
      <line
        x1={8}
        y1={13.5}
        x2={40}
        y2={13.5}
        stroke={m.ledRed}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        opacity={0.6}
      />
      <line
        x1={8}
        y1={34.5}
        x2={40}
        y2={34.5}
        stroke={m.pcbBlue}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* The channel down the middle is what makes a breadboard one. */}
      <rect x={5} y={22.5} width={38} height={3} fill={m.creamEdge} />
      {[18, 29].map((y) =>
        [11, 17, 23, 29, 35].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} fill={m.metalEdge} />
        )),
      )}
    </Svg>
  );
}

/** Any sensor: a small blue board with two eyes and a pin row. */
export function SensorMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <rect
        x={7}
        y={12}
        width={34}
        height={22}
        rx={2.5}
        fill={m.pcbBlue}
        stroke={m.pcbBlueEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      {[17.5, 30.5].map((cx) => (
        <g key={cx}>
          <circle
            cx={cx}
            cy={21}
            r={6}
            fill={m.metalDark}
            stroke={m.pcbBlueEdge}
            strokeWidth={ICON_STROKE}
          />
          <circle cx={cx} cy={21} r={2.4} fill={m.shell} opacity={0.55} />
        </g>
      ))}
      <rect x={14} y={34} width={20} height={3} rx={1.2} fill={m.shell} />
    </Svg>
  );
}

/** The servo: case, mounting tabs, and the horn that does the work. */
export function ServoMark(props: MarkProps) {
  return (
    <Svg {...props}>
      {/* Tabs first, so the case sits over them. */}
      <rect
        x={6}
        y={17}
        width={36}
        height={5}
        rx={1.4}
        fill={m.servoBlueEdge}
      />
      <rect
        x={12}
        y={13}
        width={24}
        height={24}
        rx={2.5}
        fill={m.servoBlue}
        stroke={m.servoBlueEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      {/* The horn: the one part of a servo that moves. */}
      <rect
        x={22.2}
        y={5}
        width={3.6}
        height={14}
        rx={1.6}
        fill={m.plasticWhite}
        stroke={m.creamEdge}
        strokeWidth={ICON_STROKE}
      />
      <circle
        cx={24}
        cy={19}
        r={4}
        fill={m.plasticWhite}
        stroke={m.creamEdge}
        strokeWidth={ICON_STROKE}
      />
      <circle cx={24} cy={19} r={1.3} fill={m.metalEdge} />
    </Svg>
  );
}

/**
 * The LED, drawn with its polarity: the anode leg is longer and the dome
 * carries a flat on the cathode side, exactly as C-09 draws it on the canvas.
 * Someone who cannot tell red from green still gets the leg right (rule 7).
 *
 * **Taller than it is wide.** Two earlier attempts drew a hemisphere on two
 * legs, and both read as a tree at every size this mark is used at. A 5mm LED
 * is a bullet — about 8.6mm of body over a 5mm width — so the silhouette is a
 * narrow column with a domed top, and that alone settles it. The flange under
 * the body and the highlight down one side finish the job: a canopy has
 * neither.
 */
export function LedMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <line
        x1={20}
        y1={28}
        x2={20}
        y2={44}
        stroke={m.metalEdge}
        strokeWidth={ICON_STROKE_BOLD}
        strokeLinecap="round"
      />
      <line
        x1={28}
        y1={28}
        x2={28}
        y2={37}
        stroke={m.metalEdge}
        strokeWidth={ICON_STROKE_BOLD}
        strokeLinecap="round"
      />
      {/* The body: straight sides, domed top — a bullet, not a canopy. */}
      <path
        d="M 17 28 L 17 16 A 7 7 0 0 1 31 16 L 31 28 Z"
        fill={m.ledGreen}
        stroke={m.pcbGreenEdge}
        strokeWidth={ICON_STROKE}
        strokeLinejoin="round"
      />
      {/* Plastic catches the light; a tree does not. */}
      <path
        d="M 20.5 26 L 20.5 17.5 A 3.5 3.5 0 0 1 23.5 13.8"
        fill="none"
        stroke={m.plasticWhite}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* The flat, on the cathode side. */}
      <line
        x1={31}
        y1={19}
        x2={31}
        y2={28}
        stroke={m.pcbGreenEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      <rect
        x={14.5}
        y={26.4}
        width={19}
        height={3.6}
        rx={1.4}
        fill={m.ledGreen}
        stroke={m.pcbGreenEdge}
        strokeWidth={ICON_STROKE}
      />
    </Svg>
  );
}

/** The resistor: beige body, three bands, leads either side. */
export function ResistorMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <line
        x1={4}
        y1={24}
        x2={44}
        y2={24}
        stroke={m.metalEdge}
        strokeWidth={ICON_STROKE_BOLD}
        strokeLinecap="round"
      />
      <rect
        x={13}
        y={17}
        width={22}
        height={14}
        rx={5}
        fill={m.beige}
        stroke={m.beigeEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      {[18, 22.5, 29].map((x, index) => (
        <rect
          key={x}
          x={x}
          y={17.6}
          width={2.4}
          height={12.8}
          fill={index === 2 ? m.gold : m.shell}
          opacity={index === 2 ? 1 : 0.8}
        />
      ))}
    </Svg>
  );
}

/** Jumper wires: two cables with moulded housings on the ends. */
export function JumperMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <path
        d="M 10 16 C 20 8, 28 24, 38 16"
        fill="none"
        stroke={m.ledRed}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M 10 32 C 20 24, 28 40, 38 32"
        fill="none"
        stroke={m.pcbBlue}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {[
        [8, 16],
        [40, 16],
        [8, 32],
        [40, 32],
      ].map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 3}
          y={y - 3.5}
          width={6}
          height={7}
          rx={1.4}
          fill={m.shell}
        />
      ))}
    </Svg>
  );
}

/** The USB cable: connector shell and the lead running off. */
export function UsbMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <path
        d="M 30 24 C 38 24, 38 36, 30 38 L 12 38"
        fill="none"
        stroke={m.shell}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <rect
        x={10}
        y={17}
        width={20}
        height={14}
        rx={2}
        fill={m.metal}
        stroke={m.metalEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      <rect x={13.5} y={21} width={13} height={6} rx={1} fill={m.shellDeep} />
      <rect x={15} y={22.5} width={4} height={3} fill={m.metal} />
    </Svg>
  );
}

/** The barrier arm: a card strip with its warning stripes. */
export function CardboardMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <rect
        x={5}
        y={19}
        width={38}
        height={10}
        rx={2}
        fill={m.cardboard}
        stroke={m.cardboardEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      {[12, 20, 28, 36].map((x) => (
        <path
          key={x}
          d={`M ${x} 29 L ${x + 4} 19`}
          stroke={m.cardboardEdge}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

/** The push button: cap on its base, seen from above. */
export function ButtonMark(props: MarkProps) {
  return (
    <Svg {...props}>
      <rect
        x={12}
        y={12}
        width={24}
        height={24}
        rx={2.5}
        fill={m.cream}
        stroke={m.creamEdge}
        strokeWidth={ICON_STROKE_BOLD}
      />
      {[
        [15, 15],
        [33, 15],
        [15, 33],
        [33, 33],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill={m.metalEdge} />
      ))}
      <circle
        cx={24}
        cy={24}
        r={7}
        fill={m.shell}
        stroke={m.shellDeep}
        strokeWidth={ICON_STROKE}
      />
      <circle cx={24} cy={24} r={4} fill={m.shellDeep} opacity={0.5} />
    </Svg>
  );
}

/**
 * What can be drawn, which is deliberately wider than what can be *counted*.
 *
 * `ComponentId` shrank to the six parts a chapter's list is allowed to name.
 * The kit still contains wire, and the barrier still swings a cardboard arm —
 * the workbench names both in its parts rail — so their marks stay. A drawing
 * vocabulary that could only draw the counted things would have nothing to
 * offer the one screen where the uncounted things are in your hands.
 */
export type MarkId = KitId;

const marks: Record<MarkId, (props: MarkProps) => ReactElement> = {
  board: BoardMark,
  breadboard: BreadboardMark,
  sensor: SensorMark,
  servo: ServoMark,
  led: LedMark,
  /* One mark, three ids. A mark is monochrome by design — it says *what* the
     part is and the row beside it says which one — so three tinted LEDs here
     would be a colour the legend cannot explain. The kit shelf draws the real
     artwork and that is where the colour belongs. */
  ledRed: LedMark,
  ledYellow: LedMark,
  ledGreen: LedMark,
  /* And the same for the three sensors, for the same reason plus one: the
     legend's entry is `sensor`, one mark, and a motion sensor drawn as a dome
     beside a distance sensor drawn as two cans would make the counted
     vocabulary look like three components rather than one. The shelf draws the
     part that is actually in the box; this says which KIND of thing it is. */
  sensorMotion: SensorMark,
  sensorMoisture: SensorMark,
  resistor: ResistorMark,
  jumper: JumperMark,
  cardboard: CardboardMark,
};

/**
 * The mark for a component id.
 *
 * Decorative by default: a strip of these on a card sits beside the part count
 * and the card names the project, so nothing is lost by hiding them from
 * assistive tech. Where a mark identifies a row on its own — the kit checklist
 * — the row's own label carries the name.
 */
export function ComponentIcon({
  id,
  size,
  className,
}: {
  id: MarkId;
  size?: number;
  className?: string;
}) {
  const Mark = marks[id];
  return <Mark size={size} className={className} />;
}
