import { PITCH } from "@/lib/circuit/geometry";
import type { CircuitNode } from "@/lib/circuit/graph";
import { bench } from "@/components/illustration/spec";

/**
 * C-14 · C-15 · C-16 — the correction overlay.
 *
 * The hard case this is built for: D6 and D7 are *adjacent* pins, 2.54 mm
 * apart. Two rings with two labels and an arrow between them collapse into an
 * unreadable knot at that spacing — which is exactly what the first attempt
 * did.
 *
 * So the marks on the pins stay tiny and carry no text, and the words move out
 * to a single callout above the header with a leader line to each pin. This is
 * how a technical drawing annotates something too small to label in place.
 *
 * The two pins are told apart by shape, not colour alone (rule 7): the wrong
 * one is a filled disc — something is there — and the right one is an open
 * ring with a crosshair — a destination. *
 * ## None of this is a control
 *
 * Every mark and every leader line in this file is an annotation the agent is
 * making about the build, and SVG's default `visiblePainted` made all of them
 * hit targets — drawn last, so on top of the very things they are pointing at.
 * The callout is an opaque 200 x 34-unit pill sitting seven pitches above the
 * header, which is precisely the band a part standing off the board occupies:
 * show a correction on chapter one's canonical fault and the resistor, both its
 * lead handles and the holes underneath it went behind a label, and the only
 * pointer control left was the panel's own button. An overlay that explains a
 * mistake must not be the thing that stops you fixing it.
 */

export function WrongPinMark({ pin }: { pin: { x: number; y: number } }) {
  return (
    <g className="motion-safe:motion-pop" style={{ pointerEvents: "none" }}>
      <circle
        cx={pin.x}
        cy={pin.y}
        r={PITCH * 0.82}
        fill="var(--color-wire-error)"
        className="motion-safe:animate-[cp-attention_1.8s_var(--ease-in-out-soft)_infinite]"
      />
      <circle cx={pin.x} cy={pin.y} r={PITCH * 0.3} fill={bench.mat} />
    </g>
  );
}

export function TargetPinMark({ pin }: { pin: { x: number; y: number } }) {
  const r = PITCH * 0.82;
  return (
    <g className="motion-safe:motion-pop" style={{ pointerEvents: "none" }}>
      <circle
        cx={pin.x}
        cy={pin.y}
        r={r}
        fill="none"
        stroke="var(--color-wire-target)"
        strokeWidth={2.2}
      />
      {/* Crosshair arms, kept inside the pin pitch so they never touch the
          neighbouring pin. */}
      {[
        [pin.x, pin.y - r - PITCH * 0.34, pin.x, pin.y - r - PITCH * 0.04],
        [pin.x, pin.y + r + PITCH * 0.04, pin.x, pin.y + r + PITCH * 0.34],
      ].map(([x1, y1, x2, y2], index) => (
        <line
          key={index}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="var(--color-wire-target)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/**
 * The callout: one box, both pin names, and the move between them. Leader lines
 * drop to each pin, so the words are legible and the targets stay precise.
 */
export function CorrectionCallout({
  wrong,
  target,
  wrongAt,
  targetAt,
  subject,
}: {
  wrong: CircuitNode;
  target: CircuitNode;
  /**
   * Where each pin's mark actually is, which is not always where its node is.
   *
   * A free lead offers itself a pitch and a half up its leg — that is where the
   * ring is drawn, where the picker's mark is, and where the drag aims — so a
   * leader line drawn to the node instead would arrive 15 scene units below the
   * thing it is pointing at, every time.
   */
  wrongAt?: { x: number; y: number };
  targetAt?: { x: number; y: number };
  /** What is being moved, e.g. "Echo". */
  subject: string;
}) {
  const from = wrongAt ?? wrong;
  const to = targetAt ?? target;
  const midX = (from.x + to.x) / 2;
  /* Sit above the header, clear of the pin labels. */
  const boxY = Math.min(from.y, to.y) - PITCH * 7.2;
  const boxH = PITCH * 3.4;
  const boxW = PITCH * 20;
  const boxX = midX - boxW / 2;
  const baseY = boxY + boxH;

  const textY = boxY + boxH / 2 + PITCH * 0.55;

  return (
    <g className="motion-safe:motion-pop" style={{ pointerEvents: "none" }}>
      {/* Leader lines. */}
      {[
        { key: wrong.id, pin: from, tone: "var(--color-wire-error)" },
        { key: target.id, pin: to, tone: "var(--color-wire-target)" },
      ].map(({ key, pin, tone }) => (
        <path
          key={key}
          d={`M ${pin.x} ${pin.y - PITCH * 1.5} L ${pin.x} ${baseY + PITCH * 1.1} L ${
            pin.x < midX ? boxX + PITCH * 3 : boxX + boxW - PITCH * 3
          } ${baseY}`}
          fill="none"
          stroke={tone}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      ))}

      <rect
        x={boxX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={boxH / 2}
        fill="var(--color-surface)"
        stroke="var(--color-wire-error)"
        strokeWidth={1.4}
      />

      {/* Warning glyph. */}
      <g transform={`translate(${boxX + PITCH * 1.9} ${boxY + boxH / 2})`}>
        <path
          d={`M 0 ${-PITCH * 0.75} L ${PITCH * 0.82} ${PITCH * 0.62} L ${-PITCH * 0.82} ${PITCH * 0.62} Z`}
          fill="none"
          stroke="var(--color-wire-error)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <line
          x1={0}
          y1={-PITCH * 0.18}
          x2={0}
          y2={PITCH * 0.18}
          stroke="var(--color-wire-error)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </g>

      <text
        x={boxX + PITCH * 3.4}
        y={textY}
        className="font-mono"
        fill="var(--color-ink)"
        style={{ fontSize: PITCH * 1.15, letterSpacing: "0.01em" }}
      >
        {subject}
      </text>

      <text
        x={boxX + boxW - PITCH * 1.6}
        y={textY}
        textAnchor="end"
        className="font-mono"
        style={{ fontSize: PITCH * 1.15, letterSpacing: "0.01em" }}
      >
        <tspan fill="var(--color-wire-error)">{wrong.label}</tspan>
        <tspan fill="var(--color-ink-tertiary)"> → </tspan>
        <tspan fill="var(--color-wire-target)" style={{ fontWeight: 600 }}>
          {target.label}
        </tspan>
      </text>
    </g>
  );
}
