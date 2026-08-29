import { PITCH, layout, part } from "@/lib/circuit/geometry";
import type { CircuitNode } from "@/lib/circuit/graph";
import { material as m } from "@/components/illustration/spec";

/**
 * C-07 · Ultrasonic distance sensor
 *
 * Two transducer cans and a four-pin header. The pin names are printed on the
 * board itself, exactly as they are on the real part — this is what the user
 * reads when the agent says "the Echo pin".
 */
export function UltrasonicSensor({
  pins,
  showLabels,
  highlighted,
}: {
  pins: CircuitNode[];
  showLabels: boolean;
  highlighted?: string[];
}) {
  const { x, y } = layout.ultrasonic;
  const { width, height, eye } = part.ultrasonic;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={PITCH * 0.4}
        fill={m.pcbBlue}
        stroke={m.pcbBlueEdge}
        strokeWidth={1}
      />

      {[x + width * 0.26, x + width * 0.74].map((cx) => (
        <g key={cx}>
          <circle
            cx={cx}
            cy={y + height / 2}
            r={eye / 2}
            fill={m.metalDark}
            stroke={m.canRim}
            strokeWidth={1.2}
          />
          <circle
            cx={cx}
            cy={y + height / 2}
            r={eye / 2 - PITCH * 0.5}
            fill="none"
            stroke={m.canRing}
            strokeWidth={0.8}
          />
          {[0, 1, 2].map((ring) => (
            <circle
              key={ring}
              cx={cx}
              cy={y + height / 2}
              r={eye / 2 - PITCH * 1 - ring * PITCH * 0.6}
              fill="none"
              stroke={m.canGroove}
              strokeWidth={0.6}
            />
          ))}
        </g>
      ))}

      {/* Oscillator between the cans. */}
      <rect
        x={x + width / 2 - PITCH * 1.2}
        y={y + height / 2 - PITCH * 0.8}
        width={PITCH * 2.4}
        height={PITCH * 1.6}
        rx={1}
        fill={m.ceramic}
      />

      {/* Header strip. */}
      <rect
        x={pins[0].x - PITCH * 0.7}
        y={y + height - PITCH * 0.5}
        width={PITCH * 4.4}
        height={PITCH * 1.2}
        rx={2}
        fill={m.shell}
      />

      {pins.map((pin) => {
        const active = highlighted?.includes(pin.id);
        return (
          <g key={pin.id}>
            <circle
              cx={pin.x}
              cy={pin.y}
              r={PITCH * 0.3}
              fill={m.shellDeep}
              stroke={active ? "var(--color-accent)" : m.gold}
              strokeWidth={active ? 1.6 : 0.9}
            />
            {showLabels ? (
              <text
                x={pin.x}
                y={y + height - PITCH * 1.1}
                textAnchor="middle"
                className="fill-white font-mono"
                style={{ fontSize: PITCH * 0.58 }}
              >
                {pin.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}
