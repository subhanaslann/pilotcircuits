import { PITCH, part } from "@/lib/circuit/geometry";
import { bench, material as m } from "@/components/illustration/spec";

/**
 * C-09 · LED
 *
 * Polarity is drawn, not colour-coded: the anode leg is visibly longer and the
 * body carries the flat edge on the cathode side, exactly as on the real part.
 * A learner who cannot tell red from green still gets the leg right
 * (design-language.md, rule 7).
 */
export function Led({
  x,
  y,
  colour,
  lit = false,
  label,
}: {
  x: number;
  y: number;
  colour: "green" | "red";
  lit?: boolean;
  label?: string;
}) {
  const { diameter, legLength } = part.led;
  const r = diameter / 2;
  const body = colour === "green" ? m.ledGreen : m.ledRed;
  const dim = colour === "green" ? m.ledGreenDim : m.ledRedDim;

  return (
    <g>
      {/* Legs — anode long, cathode short. */}
      <line
        x1={x}
        y1={y + r * 0.4}
        x2={x}
        y2={y + legLength}
        stroke={m.leg}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <line
        x1={x + PITCH}
        y1={y + r * 0.4}
        x2={x + PITCH}
        y2={y + legLength * 0.66}
        stroke={m.leg}
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      {/* Dome with a flat on the cathode side. */}
      <path
        d={`M ${x - r + PITCH / 2} ${y + r * 0.5}
            A ${r} ${r} 0 1 1 ${x + r + PITCH / 2} ${y + r * 0.5}
            L ${x + r + PITCH / 2} ${y + r * 0.5}
            L ${x - r + PITCH / 2} ${y + r * 0.5} Z`}
        fill={lit ? body : dim}
        stroke={body}
        strokeWidth={1}
      />
      {/* Flat edge marker on the cathode. */}
      <line
        x1={x + r + PITCH / 2}
        y1={y + r * 0.5}
        x2={x + r + PITCH / 2}
        y2={y - r * 0.35}
        stroke={body}
        strokeWidth={1.8}
        strokeLinecap="round"
      />

      {lit ? (
        <circle
          cx={x + PITCH / 2}
          cy={y}
          r={r * 1.9}
          fill={body}
          opacity={0.18}
          className="motion-safe:animate-[cp-attention_1.8s_var(--ease-in-out-soft)_infinite]"
        />
      ) : null}

      {label ? (
        <text
          x={x + PITCH / 2}
          y={y - r * 1.4}
          textAnchor="middle"
          fill={bench.label}
          className="font-mono"
          style={{ fontSize: PITCH * 0.6 }}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
