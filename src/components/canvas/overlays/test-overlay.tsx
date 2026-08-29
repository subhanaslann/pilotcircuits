import { PITCH, layout, part } from "@/lib/circuit/geometry";

/**
 * C-23 · Functional test sequence
 *
 * The one moment the build stops being a diagram and behaves: a car rolls up to
 * the sensor, the sensor pings, the reading falls, and the gate answers. The
 * whole product exists to get the user here, so it is drawn in the scene's own
 * units and its own vector language rather than as an effect laid over the top.
 *
 * Everything is driven by props — no timers live here. The sequence is owned by
 * whoever is running the test, so the same overlay serves the lab's demo button
 * and, in Batch 7, `run_functional_test`.
 */
export function TestOverlay({
  approach,
  distanceCm,
  sensing = false,
}: {
  /** 0 keeps the car off the scene, 1 parks it in front of the sensor. */
  approach: number;
  /** The live reading beside the sensor. `null` hides the readout. */
  distanceCm: number | null;
  /** Draws the sonar rings leaving the transducers. */
  sensing?: boolean;
}) {
  const sensor = layout.ultrasonic;
  const { width, height } = part.ultrasonic;
  const centreX = sensor.x + width / 2;
  const faceY = sensor.y;

  /**
   * The car drives in from off-scene and parks in front of the sensor, inside
   * the mat. Its final distance is theatre, not scale: 18 cm at the scene's own
   * units is 709 of them, which would leave the car off screen entirely. The
   * reading is what the board says; the car is what the room looks like.
   */
  const carW = PITCH * 8.5;
  const carH = PITCH * 11;
  const parkedY = faceY - PITCH * 6 - carH;
  const startY = -carH - PITCH * 2;
  const carY = startY + (parkedY - startY) * Math.min(Math.max(approach, 0), 1);

  return (
    <g>
      {sensing
        ? [0, 1, 2].map((ring) => (
            <g
              key={ring}
              style={{
                transformOrigin: `${centreX}px ${faceY}px`,
                animation: `cp-ping 1.5s var(--ease-out-soft) ${ring * 0.5}s infinite`,
              }}
              className="motion-reduce:hidden"
            >
              <path
                d={`M ${centreX - PITCH * 9} ${faceY - PITCH * 1.5}
                    A ${PITCH * 10} ${PITCH * 10} 0 0 1 ${centreX + PITCH * 9} ${faceY - PITCH * 1.5}`}
                fill="none"
                stroke="var(--color-teal)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </g>
          ))
        : null}

      {approach > 0 ? (
        <g
          style={{
            transform: `translateY(${carY - startY}px)`,
            transformOrigin: "0 0",
            transition: "transform var(--duration-deliberate) linear",
          }}
          className="motion-reduce:transition-none"
        >
          <Car x={centreX - carW / 2} y={startY} width={carW} height={carH} />
        </g>
      ) : null}

      {distanceCm !== null ? (
        <Readout
          x={sensor.x + width + PITCH * 2.2}
          y={sensor.y + height / 2}
          value={distanceCm}
        />
      ) : null}
    </g>
  );
}

/** Seen from above, because that is how the whole scene is seen. */
function Car({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <g>
      <rect
        x={x + 1.5}
        y={y + 2.5}
        width={width}
        height={height}
        rx={PITCH * 1.6}
        fill="rgba(16,24,40,0.18)"
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={PITCH * 1.6}
        fill="#C7CFD8"
        stroke="#9AA5B1"
        strokeWidth={1}
      />
      {/* Windscreen at the leading edge, so the car reads as facing the sensor. */}
      <rect
        x={x + width * 0.16}
        y={y + height * 0.62}
        width={width * 0.68}
        height={height * 0.16}
        rx={PITCH * 0.5}
        fill="#7C8894"
      />
      <rect
        x={x + width * 0.18}
        y={y + height * 0.18}
        width={width * 0.64}
        height={height * 0.14}
        rx={PITCH * 0.45}
        fill="#8D98A4"
      />
      {/* Headlamps, facing the way it is travelling. */}
      {[x + width * 0.24, x + width * 0.76].map((cx) => (
        <circle
          key={cx}
          cx={cx}
          cy={y + height - PITCH * 0.9}
          r={PITCH * 0.5}
          fill="#F2E6C4"
        />
      ))}
    </g>
  );
}

/** `18 cm` — what the board says, so it is mono (rule 13). */
function Readout({ x, y, value }: { x: number; y: number; value: number }) {
  const w = PITCH * 7.2;
  const h = PITCH * 2.6;

  return (
    <g className="motion-safe:motion-pop">
      <rect
        x={x}
        y={y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill="var(--color-surface)"
        stroke="var(--color-teal-border)"
        strokeWidth={1}
      />
      <text
        x={x + w / 2}
        y={y + PITCH * 0.45}
        textAnchor="middle"
        className="font-mono"
        fill="var(--color-teal-hover)"
        style={{ fontSize: PITCH * 1.1, letterSpacing: "0.01em" }}
      >
        {value} cm
      </text>
    </g>
  );
}
