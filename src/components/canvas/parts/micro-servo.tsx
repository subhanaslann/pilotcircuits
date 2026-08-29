import { PITCH, layout, part } from "@/lib/circuit/geometry";
import type { CircuitNode } from "@/lib/circuit/graph";
import { bench, material as m } from "@/components/illustration/spec";

/**
 * C-08 · Micro servo   ·   C-12 · Barrier arm
 *
 * The horn rotates with `angle`, and the cardboard arm is attached to it — so
 * a servo mounted 90° out shows a barrier pointing the wrong way, which is the
 * product's second teaching moment. The rotation transition is what makes the
 * "preview correct angle" action legible (design-language.md, rule 6).
 */
export function MicroServo({
  pins,
  angle,
  showLabels,
  showArm = true,
  tone = "solid",
}: {
  pins: CircuitNode[];
  /** Horn angle in degrees; 0 is the closed barrier. */
  angle: number;
  showLabels: boolean;
  showArm?: boolean;
  /** `ghost` draws the expected position behind the real one. */
  tone?: "solid" | "ghost";
}) {
  const { x, y } = layout.servo;
  const { width, height, horn } = part.servo;
  const spindle = { x: x + width * 0.72, y: y + height / 2 };
  const ghost = tone === "ghost";

  return (
    <g opacity={ghost ? 0.45 : 1}>
      {!ghost ? (
        <>
          {/* Body. */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={PITCH * 0.3}
            fill={m.servoBlue}
            stroke={m.servoBlueEdge}
            strokeWidth={1}
          />
          {/* Mounting tabs. */}
          <rect
            x={x - PITCH * 0.9}
            y={y + height * 0.25}
            width={PITCH * 0.9}
            height={height * 0.5}
            fill={m.servoBlue}
          />
          <rect
            x={x + width}
            y={y + height * 0.25}
            width={PITCH * 0.9}
            height={height * 0.5}
            fill={m.servoBlue}
          />
          {/* Gearbox cap. */}
          <circle
            cx={spindle.x}
            cy={spindle.y}
            r={PITCH * 1.5}
            fill={m.plasticWhite}
            stroke={m.creamEdge}
            strokeWidth={1}
          />
          {/* Lead wires. */}
          {pins.map((pin, index) => (
            <path
              key={pin.id}
              d={`M ${x} ${y + height / 2} C ${x - PITCH * 1.5} ${y + height / 2}, ${x - PITCH * 2} ${pin.y}, ${pin.x} ${pin.y}`}
              fill="none"
              stroke={
                ["var(--color-wire-signal)", "var(--color-wire-power)", "var(--color-wire-ground)"][index]
              }
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          ))}
          {pins.map((pin) => (
            <g key={pin.id}>
              <circle cx={pin.x} cy={pin.y} r={PITCH * 0.25} fill={m.shellDeep} />
              {showLabels ? (
                <text
                  x={pin.x - PITCH * 0.6}
                  y={pin.y + PITCH * 0.25}
                  textAnchor="end"
                  fill={bench.label}
                  className="font-mono"
                  style={{ fontSize: PITCH * 0.55 }}
                >
                  {pin.label}
                </text>
              ) : null}
            </g>
          ))}
        </>
      ) : null}

      {/* Horn + arm, rotating about the spindle. */}
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: `${spindle.x}px ${spindle.y}px`,
          transition: "transform var(--duration-deliberate) var(--ease-out-soft)",
        }}
        className="motion-reduce:transition-none"
      >
        <rect
          x={spindle.x - PITCH * 0.5}
          y={spindle.y - PITCH * 0.5}
          width={horn}
          height={PITCH}
          rx={PITCH * 0.5}
          fill={ghost ? "var(--color-success)" : m.hornWhite}
          stroke={ghost ? "var(--color-success)" : m.metal}
          strokeWidth={1}
        />
        {showArm ? (
          <rect
            x={spindle.x + horn - PITCH}
            y={spindle.y - part.barrierArm.width / 2}
            width={part.barrierArm.length}
            height={part.barrierArm.width}
            rx={1.5}
            fill={ghost ? "var(--color-success)" : m.armLight}
            stroke={ghost ? "var(--color-success)" : m.armLightEdge}
            strokeWidth={1}
          />
        ) : null}
        <circle
          cx={spindle.x}
          cy={spindle.y}
          r={PITCH * 0.45}
          fill={ghost ? "var(--color-success)" : m.metalEdge}
        />
      </g>
    </g>
  );
}
