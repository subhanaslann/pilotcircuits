import { part } from "@/lib/circuit/geometry";
import { material as m } from "@/components/illustration/spec";

/**
 * C-10 · Resistor
 *
 * 220Ω: red–red–brown, gold tolerance. The bands are the value, so they are
 * drawn accurately — a learner can read the part the same way they read the one
 * in their hand.
 */
const BANDS_220 = [m.bandRed, m.bandRed, m.bandBrown, m.gold];

export function Resistor({
  x,
  y,
  rotate = 0,
}: {
  x: number;
  y: number;
  /** Degrees, about the body centre. */
  rotate?: number;
}) {
  const { bodyWidth, bodyHeight, legLength } = part.resistor;

  return (
    <g
      style={{
        transform: `rotate(${rotate}deg)`,
        transformOrigin: `${x + bodyWidth / 2}px ${y}px`,
      }}
    >
      <line
        x1={x - legLength}
        y1={y}
        x2={x}
        y2={y}
        stroke={m.leg}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <line
        x1={x + bodyWidth}
        y1={y}
        x2={x + bodyWidth + legLength}
        y2={y}
        stroke={m.leg}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <rect
        x={x}
        y={y - bodyHeight / 2}
        width={bodyWidth}
        height={bodyHeight}
        rx={bodyHeight / 2}
        fill={m.beige}
        stroke={m.beigeEdge}
        strokeWidth={0.7}
      />
      {BANDS_220.map((colour, index) => (
        <rect
          key={index}
          x={x + bodyWidth * (0.16 + index * 0.19)}
          y={y - bodyHeight / 2}
          width={bodyWidth * 0.09}
          height={bodyHeight}
          fill={colour}
        />
      ))}
    </g>
  );
}
