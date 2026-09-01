import type { ReactElement, ReactNode } from "react";
import type { ProjectId } from "@/lib/projects/catalog";
import {
  SCENE_H,
  SCENE_STROKE,
  SCENE_W,
  material as m,
  scene as g,
} from "@/components/illustration/spec";

/**
 * P-02 · Project illustration set · P-09 · Hero
 *
 * Six scenes, one per chapter, drawn rather than composed — each build gets its
 * own arrangement instead of the same parts shuffled around. They are declared
 * in ladder order, so reading down the file is reading up the curriculum: three
 * parts and a glow at the top, the whole barrier at the bottom.
 *
 * The set is held together by three things, decided before any of them was
 * drawn (`spec.ts`):
 *
 *   **One ground.** Every scene is a few parts laid out on the workbench's own
 *   cutting mat, the same mat `desk-surface.tsx` draws under the canvas. That
 *   alone makes a project illustration read as this product's bench rather than
 *   as clip art about electronics.
 *
 *   **One point of view.** From above, always — a pot is a circle, a bottle is
 *   a rounded rectangle with a cap. The moment one scene tilted into three
 *   quarters the set would have two opinions about where the viewer stands.
 *
 *   **One level of detail.** Two to four recognisable parts and at most one
 *   mark for what the build *does* — a sonar arc, a pool of light, a drop.
 *   Nothing is drawn to pin accuracy; that is what the canvas is for.
 *
 * `smartParkingBarrier` doubles as P-09: the hero on the detail page is this
 * drawing at a larger size, not a second illustration that could disagree with
 * it.
 */

interface SceneProps {
  /** Rendered width. Height follows the 8:5 frame. */
  width?: number;
  className?: string;
}

function Scene({
  width = 160,
  className,
  children,
}: SceneProps & { children: ReactNode }) {
  return (
    <svg
      width={width}
      height={(width / SCENE_W) * SCENE_H}
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x={0}
        y={0}
        width={SCENE_W}
        height={SCENE_H}
        rx={6}
        fill={g.mat}
        stroke={g.matEdge}
        strokeWidth={SCENE_STROKE}
      />
      {/* The mat's printed grid, at the density the canvas uses. */}
      <g opacity={0.5}>
        {[20, 40, 60, 80, 100, 120, 140].map((x) => (
          <line
            key={`v${x}`}
            x1={x}
            y1={2}
            x2={x}
            y2={SCENE_H - 2}
            stroke={g.matGrid}
            strokeWidth={0.8}
          />
        ))}
        {[20, 40, 60, 80].map((y) => (
          <line
            key={`h${y}`}
            x1={2}
            y1={y}
            x2={SCENE_W - 2}
            y2={y}
            stroke={g.matGrid}
            strokeWidth={0.8}
          />
        ))}
      </g>
      {children}
    </svg>
  );
}

/** The board, from above, at scene scale. Every project has one. */
function Board({ x, y, w = 40 }: { x: number; y: number; w?: number }) {
  const h = w * 0.72;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        fill={m.pcbGreen}
        stroke={m.pcbGreenEdge}
        strokeWidth={SCENE_STROKE}
      />
      <rect
        x={x + 4}
        y={y + 3}
        width={w - 8}
        height={2.6}
        rx={1.1}
        fill={m.shell}
      />
      <rect
        x={x + 4}
        y={y + h - 5.6}
        width={w - 8}
        height={2.6}
        rx={1.1}
        fill={m.shell}
      />
      <rect
        x={x + w * 0.3}
        y={y + h * 0.38}
        width={w * 0.4}
        height={h * 0.26}
        rx={1.4}
        fill={m.shellDeep}
      />
    </g>
  );
}

/** The sensor board: two eyes, the shape the whole product is built around. */
function Sensor({
  x,
  y,
  w = 30,
  rotate = 0,
}: {
  x: number;
  y: number;
  w?: number;
  rotate?: number;
}) {
  const h = w * 0.55;
  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill={m.pcbBlue}
        stroke={m.pcbBlueEdge}
        strokeWidth={SCENE_STROKE}
      />
      {[0.3, 0.7].map((f) => (
        <circle
          key={f}
          cx={x + w * f}
          cy={y + h / 2}
          r={h * 0.3}
          fill={m.metalDark}
          stroke={m.pcbBlueEdge}
          strokeWidth={SCENE_STROKE}
        />
      ))}
    </g>
  );
}

/** A lit LED seen from above: a bright disc with a halo. */
function LedGlow({
  x,
  y,
  tone = m.ledGreen,
  r = 4,
}: {
  x: number;
  y: number;
  tone?: string;
  r?: number;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={r * 2.4} fill={tone} opacity={0.16} />
      <circle cx={x} cy={y} r={r * 1.5} fill={tone} opacity={0.28} />
      <circle cx={x} cy={y} r={r} fill={tone} />
    </g>
  );
}

/** Sonar or radar: arcs leaving a face. The product's own gesture. */
function Arcs({
  cx,
  cy,
  from = 26,
  step = 11,
  count = 3,
  tone = g.sense,
}: {
  cx: number;
  cy: number;
  from?: number;
  step?: number;
  count?: number;
  tone?: string;
}) {
  return (
    <g>
      {Array.from({ length: count }).map((_, index) => {
        const r = from + index * step;
        return (
          <path
            key={r}
            d={`M ${cx - r * 0.72} ${cy - r * 0.5} A ${r} ${r} 0 0 1 ${cx + r * 0.72} ${cy - r * 0.5}`}
            fill="none"
            stroke={tone}
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={0.55 - index * 0.13}
          />
        );
      })}
    </g>
  );
}

/** A jumper run between two points, drawn the way the canvas draws cable. */
function Run({ d, tone }: { d: string; tone: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={tone}
      strokeWidth={2}
      strokeLinecap="round"
      opacity={0.9}
    />
  );
}

/* --- The seven ----------------------------------------------------------- */

/**
 * Chapter one. Three parts and no breadboard: the LED is in the board's own
 * header, which is exactly what makes this the first chapter. The subject is
 * the glow, and the glow is drawn mid-breath rather than fully on — a lamp that
 * is *going* somewhere reads as a lamp with a program behind it.
 */
export function BreathingLampScene(props: SceneProps) {
  return (
    <Scene {...props}>
      <circle cx={110} cy={50} r={30} fill="#F2D98B" opacity={0.13} />
      <circle cx={110} cy={50} r={19} fill="#F2D98B" opacity={0.2} />
      <Board x={16} y={32} w={40} />
      {/* The resistor, in line with the leg, because in this chapter it is not
          a detail — it is the reason the LED survives its first minute. */}
      <g>
        <rect
          x={64}
          y={47}
          width={22}
          height={7}
          rx={3.4}
          fill={m.beige}
          stroke={m.beigeEdge}
          strokeWidth={SCENE_STROKE}
        />
        <rect x={69} y={47} width={2.4} height={7} fill={m.bandRed} />
        <rect x={73} y={47} width={2.4} height={7} fill={m.bandRed} />
        <rect x={77} y={47} width={2.4} height={7} fill={m.bandBrown} />
      </g>
      <rect x={56} y={49.4} width={8} height={2.2} rx={1.1} fill={m.leg} />
      <rect x={86} y={49.4} width={12} height={2.2} rx={1.1} fill={m.leg} />
      <LedGlow x={110} y={50} tone="#F2D98B" r={7} />
    </Scene>
  );
}

/**
 * Chapter two. The circuit has outgrown the board's own header, so it moves on
 * to the breadboard — and the breadboard is drawn as the subject rather than as
 * furniture, because moving on to it is the lesson. Three domes, one lit: a
 * sequence is a thing with a *current* member.
 */
export function TrafficLightScene(props: SceneProps) {
  return (
    <Scene {...props}>
      <Board x={12} y={34} w={34} />
      {/* The breadboard: a slab with the centre channel that makes it one. */}
      <rect
        x={58}
        y={22}
        width={86}
        height={56}
        rx={4}
        fill={m.cream}
        stroke={m.creamEdge}
        strokeWidth={SCENE_STROKE}
      />
      <rect x={58} y={47} width={86} height={6} fill={m.creamEdge} opacity={0.5} />
      <Run d="M 46 44 C 54 40, 56 34, 66 33" tone={m.ledRed} />
      <Run d="M 46 50 C 54 50, 58 50, 66 50" tone={m.beige} />
      <Run d="M 46 56 C 54 60, 56 66, 66 67" tone={m.ledGreen} />
      <circle cx={101} cy={33} r={6} fill={m.ledRedDim} />
      <LedGlow x={101} y={50} tone="#E8B33C" r={6} />
      <circle cx={101} cy={67} r={6} fill={m.ledGreenDim} />
    </Scene>
  );
}

/** P-09 too: the hero is this drawing, larger. */
export function SmartParkingBarrierScene(props: SceneProps) {
  return (
    <Scene {...props}>
      <Run d="M 60 40 C 78 34, 92 44, 104 44" tone={m.pcbBlue} />
      <Run d="M 60 46 C 78 52, 92 56, 104 52" tone={m.ledRed} />
      <Board x={104} y={30} w={44} />
      <Sensor x={30} y={34} w={30} />
      {/* The gate, lifted: the moment the build exists for. */}
      <g>
        <rect
          x={20}
          y={62}
          width={62}
          height={7}
          rx={2}
          fill={m.cardboard}
          stroke={m.cardboardEdge}
          strokeWidth={SCENE_STROKE}
        />
        {[28, 40, 52, 64, 74].map((x) => (
          <path
            key={x}
            d={`M ${x} 69 L ${x + 4} 62`}
            stroke={m.cardboardEdge}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        ))}
      </g>
      <circle
        cx={16}
        cy={65.5}
        r={5}
        fill={m.servoBlue}
        stroke={m.servoBlueEdge}
        strokeWidth={SCENE_STROKE}
      />
      {/* The car that made it lift, waiting under the arm. */}
      <rect
        x={92}
        y={74}
        width={26}
        height={17}
        rx={4}
        fill="#C7CFD8"
        stroke="#9AA5B1"
        strokeWidth={SCENE_STROKE}
      />
      <rect x={96} y={78} width={18} height={4} rx={1.4} fill="#8D98A4" />
      <LedGlow x={128} y={78} r={3.4} />
    </Scene>
  );
}

export function PlantGuardianScene(props: SceneProps) {
  return (
    <Scene {...props}>
      <Run d="M 62 52 C 78 46, 90 58, 100 54" tone={m.pcbBlue} />
      <Board x={100} y={38} w={40} />
      {/* The pot, from above: rim, soil, leaves. */}
      <circle
        cx={44}
        cy={52}
        r={26}
        fill={m.cardboard}
        stroke={m.cardboardEdge}
        strokeWidth={SCENE_STROKE}
      />
      <circle cx={44} cy={52} r={20} fill="#4A3B2C" />
      {/* Three leaves, contoured and spaced. Drawn without the outline they
          overlapped into a single green ring around the soil. */}
      {[
        [33, 45, -34],
        [55, 45, 34],
        [44, 63, 0],
      ].map(([cx, cy, rot]) => (
        <ellipse
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          rx={12}
          ry={6.5}
          fill={m.ledGreen}
          stroke={m.pcbGreenEdge}
          strokeWidth={SCENE_STROKE}
          transform={`rotate(${rot} ${cx} ${cy})`}
        />
      ))}
      {/* The probe, sunk into the soil. */}
      <g>
        <rect x={56} y={44} width={7} height={16} rx={1.6} fill={m.metal} />
        <rect x={57.5} y={30} width={4} height={16} rx={1.6} fill={m.pcbBlue} />
      </g>
      <LedGlow x={122} y={66} r={3.4} />
    </Scene>
  );
}

export function MotionNightLightScene(props: SceneProps) {
  return (
    <Scene {...props}>
      {/* The pool of light is the subject; everything else is the cause. */}
      <circle cx={112} cy={54} r={34} fill="#F5E6B8" opacity={0.14} />
      <circle cx={112} cy={54} r={22} fill="#F5E6B8" opacity={0.2} />
      <Run d="M 56 50 C 72 44, 84 58, 96 54" tone={m.ledRed} />
      <Board x={18} y={36} w={38} />
      <circle
        cx={112}
        cy={54}
        r={10}
        fill={m.cream}
        stroke={m.creamEdge}
        strokeWidth={SCENE_STROKE}
      />
      <LedGlow x={112} y={54} tone="#F2D98B" r={5} />
      {/* The motion sensor: a domed eye, watching. */}
      <circle
        cx={80}
        cy={24}
        r={9}
        fill={m.plasticWhite}
        stroke={m.creamEdge}
        strokeWidth={SCENE_STROKE}
      />
      <circle cx={80} cy={24} r={4.5} fill={m.metalDark} opacity={0.7} />
      <Arcs
        cx={80}
        cy={40}
        from={18}
        step={9}
        count={3}
        tone={m.plasticWhite}
      />
    </Scene>
  );
}



export function TouchlessSoapDispenserScene(props: SceneProps) {
  return (
    <Scene {...props}>
      <Run d="M 60 30 C 76 26, 88 38, 100 34" tone={m.pcbBlue} />
      <Board x={100} y={22} w={38} />
      <Sensor x={30} y={22} w={30} />
      <Arcs cx={45} cy={40} from={16} step={8} count={3} tone={g.sense} />
      {/* The bottle from above: body, collar, nozzle. */}
      <rect
        x={30}
        y={58}
        width={30}
        height={34}
        rx={6}
        fill={m.plasticWhite}
        stroke={m.creamEdge}
        strokeWidth={SCENE_STROKE}
      />
      <circle
        cx={45}
        cy={70}
        r={7}
        fill={m.cream}
        stroke={m.creamEdge}
        strokeWidth={SCENE_STROKE}
      />
      <rect
        x={62}
        y={64}
        width={22}
        height={7}
        rx={3}
        fill={m.servoBlue}
        stroke={m.servoBlueEdge}
        strokeWidth={SCENE_STROKE}
      />
      {/* One drop: the whole point, and the only motion in the frame. */}
      <path
        d="M 96 66 C 100 72, 100 76, 96 76 C 92 76, 92 72, 96 66 Z"
        fill={m.pcbBlue}
        opacity={0.7}
      />
    </Scene>
  );
}


const scenes: Record<ProjectId, (props: SceneProps) => ReactElement> = {
  breathingLamp: BreathingLampScene,
  trafficLight: TrafficLightScene,
  motionNightLight: MotionNightLightScene,
  plantGuardian: PlantGuardianScene,
  touchlessSoapDispenser: TouchlessSoapDispenserScene,
  smartParkingBarrier: SmartParkingBarrierScene,
};

/**
 * The scene for a project id.
 *
 * Decorative: the card names the project in words beside it, so nothing is lost
 * by hiding the drawing from assistive tech — and describing seven bench
 * layouts in alt text would be worse than silence.
 */
export function ProjectScene({
  id,
  width,
  className,
}: {
  id: ProjectId;
  width?: number;
  className?: string;
}) {
  const Drawing = scenes[id];
  return <Drawing width={width} className={className} />;
}
