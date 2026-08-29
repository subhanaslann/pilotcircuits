import { PITCH, layout, part } from "@/lib/circuit/geometry";
import type { CircuitNode } from "@/lib/circuit/graph";
import { material as m } from "@/components/illustration/spec";

/**
 * C-06 · Breadboard
 *
 * Half-size board at its real proportions. Every hole is an addressable node
 * rather than a repeating `<pattern>`, because a wire end has to be able to
 * name the hole it sits in — `bb.e12` — and the agent has to be able to point
 * at it.
 */
export function Breadboard({
  holes,
  showLabels,
}: {
  holes: CircuitNode[];
  showLabels: boolean;
}) {
  const { x, y } = layout.breadboard;
  const { width, height, channel } = part.breadboard;

  const rails = holes.filter((h) => h.row === "+" || h.row === "-");
  const banks = holes.filter((h) => h.row !== "+" && h.row !== "-");

  return (
    <g>
      <rect
        x={x}
        y={y - PITCH * 2}
        width={width}
        height={height + PITCH * 4}
        rx={PITCH * 0.6}
        fill={m.plasticWhite}
        stroke="var(--color-border-strong)"
        strokeWidth={1}
      />

      {/* Centre channel. */}
      <rect
        x={x + PITCH * 0.5}
        y={y + PITCH * 2 + 5 * PITCH}
        width={width - PITCH}
        height={channel}
        rx={2}
        fill={m.cream}
      />

      {/* Rail guide lines: red for +, dark for −. Colour is not the only cue —
          the rail is also labelled at both ends. */}
      <line
        x1={x + PITCH * 0.6}
        y1={y - PITCH * 1.3}
        x2={x + width - PITCH * 0.6}
        y2={y - PITCH * 1.3}
        stroke="var(--color-wire-power)"
        strokeWidth={0.8}
        opacity={0.55}
      />
      <line
        x1={x + PITCH * 0.6}
        y1={y + height + PITCH * 1.3}
        x2={x + width - PITCH * 0.6}
        y2={y + height + PITCH * 1.3}
        stroke="var(--color-wire-ground)"
        strokeWidth={0.8}
        opacity={0.55}
      />

      {banks.map((hole) => (
        <rect
          key={hole.id}
          x={hole.x - PITCH * 0.2}
          y={hole.y - PITCH * 0.2}
          width={PITCH * 0.4}
          height={PITCH * 0.4}
          rx={0.8}
          fill={m.creamEdge}
        />
      ))}

      {rails.map((hole) => (
        <circle
          key={hole.id}
          cx={hole.x}
          cy={hole.y}
          r={PITCH * 0.2}
          fill={m.creamEdge}
        />
      ))}

      {showLabels ? (
        <>
          <text
            x={x - PITCH * 0.8}
            y={y - PITCH * 1.1}
            textAnchor="end"
            className="fill-[var(--color-wire-power)] font-mono"
            style={{ fontSize: PITCH * 0.7 }}
          >
            +
          </text>
          <text
            x={x - PITCH * 0.8}
            y={y + height + PITCH * 1.6}
            textAnchor="end"
            className="fill-[var(--color-wire-ground)] font-mono"
            style={{ fontSize: PITCH * 0.7 }}
          >
            −
          </text>
        </>
      ) : null}
    </g>
  );
}
