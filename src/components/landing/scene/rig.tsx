import { material } from "@/components/illustration/spec";
import {
  BASE,
  BOOM,
  FRAME,
  PIVOT,
  ROAD,
} from "@/components/landing/scene/bench-layout";

/**
 * S-01 · The barrier, cut from cardboard.
 *
 * The circuit answers the question *how is it wired*. This answers the one a
 * stranger asks first: *what is it?* Without it the bench is a servo turning a
 * stick over a cutting mat, a sensor pinging into an empty room and two LEDs
 * changing colour for nobody — six parts with nothing to act on. Every one of
 * them becomes legible the moment there is a road under them.
 *
 * It is cardboard rather than a rendered road because that is what it is: the
 * catalogue counts `cardboard` as the barrier's arm and says *you cut it
 * yourself*. So the layers are honest all the way down — the mat is the mat,
 * the base is a piece of card laid on it, and the asphalt is paint on the card.
 *
 * ## The stripes
 *
 * A plain tan bar reads as a lolly stick. Red and white blocks read as a boom
 * from across a car park, and they are the one detail that turns the servo's
 * rotation from *something is spinning* into *the gate is opening*.
 */

const KERB = "#CBD2D8";
const ASPHALT = "#31383F";
const ASPHALT_LIT = "#3A424A";
const PAINT = "#E8EDF1";

/**
 * Everything the barrier stands on, drawn before the parts.
 *
 * Split from the boom so the servo case can land between them: the cabinet is
 * screwed to the post and the boom is bolted to the cabinet's horn, and that
 * order has to be the drawing order or the plinth sits on top of the servo.
 */
export function RigGround({
  car,
  sonar,
}: {
  /** The car's centre along the road, or `null` when it is not on the bench. */
  car: number | null;
  /** How strongly the sensor is pinging, 0–1. */
  sonar: number;
}) {
  return (
    <g aria-hidden="true">
      <Base />
      <Road />
      {sonar > 0.02 ? <Sonar strength={sonar} /> : null}
      {car !== null ? <Car x={car} /> : null}
      <Post />
    </g>
  );
}

/** The boom, on top of the cabinet it is bolted to. */
export function RigBoom({ angle }: { angle: number }) {
  return (
    <g aria-hidden="true">
      <Boom angle={angle} />
    </g>
  );
}

/* --- The card it is all built on ----------------------------------------- */

function Base() {
  return (
    <g>
      <rect
        x={BASE.x}
        y={BASE.y + 6}
        width={BASE.width}
        height={BASE.height}
        fill="#101A20"
        opacity={0.34}
      />
      <rect
        x={BASE.x}
        y={BASE.y}
        width={BASE.width}
        height={BASE.height}
        fill={material.cardboard}
      />
      {/* The cut edge: corrugation showing along the front, which is the one
          face of a piece of card you actually see from above. */}
      <rect
        x={BASE.x}
        y={BASE.y + BASE.height - 7}
        width={BASE.width}
        height={7}
        fill={material.cardboardEdge}
      />
      <line
        x1={BASE.x}
        y1={BASE.y + BASE.height - 7}
        x2={BASE.x + BASE.width}
        y2={BASE.y + BASE.height - 7}
        stroke="#8E6C45"
        strokeWidth={1}
        opacity={0.6}
      />
    </g>
  );
}

function Road() {
  const top = ROAD.top;
  const bottom = ROAD.bottom;

  return (
    <g>
      {/* Kerbs first, so the asphalt laps over their inner edge. */}
      <rect x={BASE.x} y={top - ROAD.kerb} width={BASE.width} height={ROAD.kerb} fill={KERB} />
      <rect x={BASE.x} y={bottom} width={BASE.width} height={ROAD.kerb} fill={KERB} />

      <rect x={BASE.x} y={top} width={BASE.width} height={bottom - top} fill={ASPHALT} />
      {/* A band of lighter tarmac down the middle: without it a 190-unit strip
          of one flat grey reads as a hole in the card rather than a surface. */}
      <rect
        x={BASE.x}
        y={top + 26}
        width={BASE.width}
        height={bottom - top - 52}
        fill={ASPHALT_LIT}
        opacity={0.55}
      />
      <line x1={BASE.x} y1={top + 1} x2={BASE.x + BASE.width} y2={top + 1} stroke="#20262B" strokeWidth={2} />
      <line x1={BASE.x} y1={bottom - 1} x2={BASE.x + BASE.width} y2={bottom - 1} stroke="#20262B" strokeWidth={2} />

      {/* Centre line, dashed, and a stop line the car pulls up to. */}
      <line
        x1={BASE.x}
        y1={(top + bottom) / 2}
        x2={BASE.x + BASE.width}
        y2={(top + bottom) / 2}
        stroke={PAINT}
        strokeWidth={3}
        strokeDasharray="34 26"
        opacity={0.72}
      />
      {/* The stop line, well back from the boom: a car pulls up to it, and a
          line painted under the barrier would be a line the boom lands on. */}
      <rect x={PIVOT.x - 210} y={top + 6} width={7} height={bottom - top - 12} fill={PAINT} opacity={0.8} />

      {/* An arrow painted on the tarmac: which way the traffic runs, said once
          and never in words. */}
      <g opacity={0.5} fill={PAINT}>
        <rect x={148} y={(top + bottom) / 2 - 46} width={58} height={7} rx={3.5} />
        <path d={`M 206 ${(top + bottom) / 2 - 42.5} l -14 -9 v 18 z`} />
      </g>
    </g>
  );
}

/* --- The barrier --------------------------------------------------------- */

/** A cardboard plinth under the servo, screwed to the verge. */
function Post() {
  const x = PIVOT.x - 76;
  const y = PIVOT.y + 4;
  return (
    <g>
      <rect x={x + 2} y={y + 5} width={152} height={62} rx={4} fill="#101A20" opacity={0.3} />
      <rect x={x} y={y} width={152} height={62} rx={4} fill={material.cardboard} stroke={material.cardboardEdge} strokeWidth={1.2} />
      <rect x={x} y={y + 50} width={152} height={12} rx={4} fill={material.cardboardEdge} />
      {[x + 14, x + 138].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={y + 24} r={5} fill="#9A7A52" />
          <path d={`M ${cx - 3.2} ${y + 24} h 6.4`} stroke="#6B5334" strokeWidth={1.4} />
        </g>
      ))}
    </g>
  );
}

/**
 * The boom.
 *
 * Drawn from the spindle outward so the rotation is a single transform about
 * the point the horn actually turns on. Red and white in 26-unit blocks, a
 * rounded tip, and a short counterweight tail behind the pivot — the three
 * things that make a rectangle read as a barrier.
 */
function Boom({ angle }: { angle: number }) {
  const blocks = Math.ceil(BOOM.length / 26);
  const half = BOOM.width / 2;
  /* Lifted, the boom throws its shadow further: the only cue in a top-down
     drawing that says it has come off the road. */
  const lift = Math.min(1, Math.abs(angle - BOOM.closed) / 90);
  const drop = 3 + lift * 9;

  const bar = (fill: string, stroke: string, dy = 0, opacity = 1) => (
    <g transform={`translate(0 ${dy})`} opacity={opacity}>
      <rect x={-34} y={-half} width={34} height={BOOM.width} rx={3} fill={stroke} />
      <rect x={0} y={-half} width={BOOM.length} height={BOOM.width} rx={half} fill={fill} stroke={stroke} strokeWidth={1.1} />
    </g>
  );

  return (
    <g
      style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
        transition: "transform var(--duration-deliberate) var(--ease-out-soft)",
      }}
      className="motion-reduce:transition-none"
    >
      <g transform={`translate(${PIVOT.x} ${PIVOT.y})`}>
        {bar("#101A20", "#101A20", drop, 0.32)}
        {bar("#F2F4F6", "#C0C6CC")}

        {/* The blocks. Every other one, so the tip always ends on red. */}
        <g>
          {Array.from({ length: blocks }, (_, i) =>
            i % 2 === 0 ? (
              <rect
                key={i}
                x={i * 26}
                y={-half}
                width={Math.min(26, BOOM.length - i * 26)}
                height={BOOM.width}
                rx={i === 0 ? half : 0}
                fill="#D8383E"
              />
            ) : null,
          )}
          <rect
            x={BOOM.length - 26}
            y={-half}
            width={26}
            height={BOOM.width}
            rx={half}
            fill={blocks % 2 === 1 ? "#D8383E" : "#F2F4F6"}
          />
        </g>
        <rect x={0} y={-half} width={BOOM.length} height={BOOM.width} rx={half} fill="none" stroke="#A8AEB4" strokeWidth={1.1} />

        {/* The counterweight, and the collar that clamps the boom to the horn. */}
        <rect x={-34} y={-half - 3} width={26} height={BOOM.width + 6} rx={3} fill="#5A6069" />
        <circle r={11} fill="#8C939B" stroke="#5A6069" strokeWidth={1.4} />
        <circle r={4} fill="#3B4149" />
      </g>
    </g>
  );
}

/* --- What the barrier is for --------------------------------------------- */

/** Seen from above, because that is how the whole bench is seen. */
function Car({ x }: { x: number }) {
  const w = 132;
  const h = 84;
  const y = (ROAD.top + ROAD.bottom) / 2 - h / 2 + 22;

  return (
    <g transform={`translate(${x - w / 2} ${y})`}>
      <rect x={3} y={5} width={w} height={h} rx={16} fill="#0C1318" opacity={0.36} />
      <rect x={0} y={0} width={w} height={h} rx={16} fill="#B9C3CE" stroke="#8F9BA8" strokeWidth={1.2} />
      {/* Roof, inset, with the windscreen at the leading edge. */}
      <rect x={w * 0.2} y={h * 0.16} width={w * 0.46} height={h * 0.68} rx={9} fill="#8E9AA7" />
      <rect x={w * 0.66} y={h * 0.2} width={w * 0.12} height={h * 0.6} rx={5} fill="#6E7B89" />
      <rect x={w * 0.14} y={h * 0.22} width={w * 0.07} height={h * 0.56} rx={4} fill="#6E7B89" />
      {/* Headlamps lead, tail lamps follow. */}
      {[h * 0.2, h * 0.8].map((cy) => (
        <rect key={`f${cy}`} x={w - 12} y={cy - 6} width={8} height={12} rx={3} fill="#F5EBC8" />
      ))}
      {[h * 0.2, h * 0.8].map((cy) => (
        <rect key={`r${cy}`} x={4} y={cy - 5} width={6} height={10} rx={3} fill="#C05A57" />
      ))}
      {/* Wheels, just proud of the body. */}
      {[
        [w * 0.24, -4],
        [w * 0.24, h - 6],
        [w * 0.72, -4],
        [w * 0.72, h - 6],
      ].map(([cx, cy], i) => (
        <rect key={i} x={cx} y={cy} width={22} height={10} rx={4} fill="#2A3138" />
      ))}
    </g>
  );
}

/**
 * The sonar, leaving the transducer and opening up across the road.
 *
 * Teal, because C-23 already draws sensing in teal on the canvas and the scene
 * does not invent a second signal for the same act. Three fronts on one delay,
 * so it reads as one thing travelling rather than three rings blinking.
 */
function Sonar({ strength }: { strength: number }) {
  const cx = 470;
  const cy = ROAD.bottom + 6;

  return (
    <g opacity={strength} className="motion-reduce:hidden">
      {[0, 1, 2].map((ring) => (
        <g
          key={ring}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: `cp-ping 1.5s var(--ease-out-soft) ${ring * 0.5}s infinite`,
          }}
        >
          <path
            d={`M ${cx - 96} ${cy - 14} A 104 104 0 0 1 ${cx + 96} ${cy - 14}`}
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth={3.4}
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
}

/** The mat everything is laid on: the bench's own surface, full bleed. */
export function Mat() {
  return (
    <g aria-hidden="true">
      <rect width={FRAME.width} height={FRAME.height} rx={12} fill="#3E4A53" />
      <g stroke="#4A5862" strokeWidth={0.8}>
        {Array.from({ length: Math.ceil(FRAME.width / 25) }, (_, i) => (
          <line key={`v${i}`} x1={i * 25} y1={0} x2={i * 25} y2={FRAME.height} />
        ))}
        {Array.from({ length: Math.ceil(FRAME.height / 25) }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 25} x2={FRAME.width} y2={i * 25} />
        ))}
      </g>
      <g stroke="#55636D" strokeWidth={1.1}>
        {Array.from({ length: Math.ceil(FRAME.width / 125) }, (_, i) => (
          <line key={`V${i}`} x1={i * 125} y1={0} x2={i * 125} y2={FRAME.height} />
        ))}
        {Array.from({ length: Math.ceil(FRAME.height / 125) }, (_, i) => (
          <line key={`H${i}`} x1={0} y1={i * 125} x2={FRAME.width} y2={i * 125} />
        ))}
      </g>
    </g>
  );
}
