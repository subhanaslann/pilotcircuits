import { PITCH, layout, part } from "@/lib/circuit/geometry";
import type { CircuitNode } from "@/lib/circuit/graph";
import { bench, material as m } from "@/components/illustration/spec";

/**
 * C-03 · C-04 · C-05 — the board, its headers, and their labels.
 *
 * A generic UNO-compatible board drawn at its real 68.6 × 53.4 mm, with the
 * headers on the standard 0.1" pitch. Silkscreen is reduced to what the build
 * actually needs: pin names. Everything else a real board prints would be noise
 * a learner has to look past.
 */
export function UnoBoard({
  pins,
  showLabels,
  highlighted,
  dimOtherLabels = false,
}: {
  /** Board pins from the scene graph, already positioned. */
  pins: CircuitNode[];
  showLabels: boolean;
  /** Pin ids drawn with a brighter ring — the agent is talking about these. */
  highlighted?: string[];
  /** During a correction, only the named pins keep a readable label. */
  dimOtherLabels?: boolean;
}) {
  const { x, y } = layout.board;
  const { width, height } = part.board;

  return (
    <g>
      {/* Board substrate. */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={PITCH * 0.8}
        fill={m.pcbGreen}
        stroke={m.pcbGreenEdge}
        strokeWidth={1}
      />
      {/* Mounting holes. */}
      {[
        [x + PITCH * 1.4, y + PITCH * 1.4],
        [x + width - PITCH * 1.4, y + PITCH * 1.4],
        [x + PITCH * 1.4, y + height - PITCH * 1.4],
        [x + width - PITCH * 1.4, y + height - PITCH * 1.4],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={PITCH * 0.5}
          fill="var(--color-surface-sunken)"
          stroke={m.pcbGreenEdge}
          strokeWidth={0.8}
        />
      ))}

      {/* USB socket, left edge. */}
      <rect
        x={x - PITCH * 1.2}
        y={y + PITCH * 3}
        width={PITCH * 2.4}
        height={PITCH * 5}
        rx={2}
        fill={m.metal}
        stroke={m.metalEdge}
        strokeWidth={0.8}
      />
      {/* Barrel jack, left edge lower. */}
      <rect
        x={x - PITCH * 1.2}
        y={y + height - PITCH * 8}
        width={PITCH * 2.6}
        height={PITCH * 4}
        rx={PITCH * 0.6}
        fill={m.shellSoft}
      />

      {/* Microcontroller. */}
      <rect
        x={x + width / 2 - PITCH * 4}
        y={y + height / 2 - PITCH * 1.6}
        width={PITCH * 8}
        height={PITCH * 3.2}
        rx={1.5}
        fill={m.chip}
      />

      {/* Header strips behind the pins. */}
      <rect
        x={x + PITCH}
        y={y + part.board.digitalY - PITCH * 0.7}
        width={width - PITCH * 2}
        height={PITCH * 1.4}
        rx={2}
        fill={m.shell}
      />
      <rect
        x={x + PITCH * 3}
        y={y + part.board.powerY - PITCH * 0.7}
        width={PITCH * 7}
        height={PITCH * 1.4}
        rx={2}
        fill={m.shell}
      />

      {/* Pins. */}
      {pins.map((pin) => {
        const active = highlighted?.includes(pin.id);
        return (
          <g key={pin.id}>
            <circle
              cx={pin.x}
              cy={pin.y}
              r={PITCH * 0.32}
              fill={m.shellDeep}
              stroke={active ? "var(--color-accent)" : m.gold}
              strokeWidth={active ? 1.6 : 0.9}
            />
            {showLabels && pin.label ? (
              <text
                x={pin.x}
                y={pin.y - PITCH * 0.9}
                textAnchor="middle"
                fill={bench.labelStrong}
                className="font-mono"
                style={{ fontSize: PITCH * 0.62, letterSpacing: "0.02em" }}
                opacity={dimOtherLabels && !active ? 0.28 : 1}
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
