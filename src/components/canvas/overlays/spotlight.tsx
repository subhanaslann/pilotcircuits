import { PITCH } from "@/lib/circuit/geometry";
import { agent } from "@/lib/design/tokens";

/**
 * C-25 · The spotlight: what `point_at` leaves on the bench.
 *
 * The ring is the agent's pointer, and it is an *actor* — it comes, closes on
 * the thing, and goes. `show_correction` already relies on that division: the
 * ring points and leaves, and what stays behind is the mark (C-14 / C-15) and
 * the callout, which say the same thing in a register that can be read a
 * minute later. This is the same division for a question that has no fault in
 * it — *where is the resistor?* — so the residue must not borrow the
 * correction's vocabulary: a filled orange disc says *something is wrong
 * here*, a teal crosshair says *the wire belongs here*, and neither is true of
 * a part somebody merely asked about.
 *
 * So the mark is the **ring's own docked pose**, left behind: an open ring in
 * the agent's blue with the four short arms it grows when it lands on a hole,
 * over the dark halo that keeps it legible on the board's own blue. Rule 8 —
 * the product's own metaphor — rather than a third colour of pin ring. Rule 7
 * is met by the word: the callout names the thing in the reader's language,
 * mono when the name is something the hardware prints (rule 13).
 *
 * ## None of this is a control
 *
 * Same discipline as `pin-rings.tsx`: every shape here is `pointerEvents:
 * none`, because the pill sits over the very part it names, and a spotlight
 * that stopped you picking up the part it was pointing at would be the
 * interface arguing with itself.
 *
 * The geometry is in scene units, deliberately. A mark on the bench scales
 * with the bench, like the target ring does; it is the *flying* ring that is
 * screen-sized, because that one is a cursor and this one is a note pinned to
 * a hole.
 */

/** One agent, one blue — `tokens.ts` says why the halo is the legibility. */
const AGENT = agent.mark;
const HALO = agent.halo;

export interface SpotlightPoint {
  x: number;
  y: number;
}

export function SpotlightMark({ at }: { at: SpotlightPoint }) {
  const r = PITCH * 0.82;
  const gap = PITCH * 0.14;
  const reach = PITCH * 0.42;
  const arms: [number, number, number, number][] = [
    [at.x, at.y - r - gap, at.x, at.y - r - gap - reach],
    [at.x, at.y + r + gap, at.x, at.y + r + gap + reach],
    [at.x - r - gap, at.y, at.x - r - gap - reach, at.y],
    [at.x + r + gap, at.y, at.x + r + gap + reach, at.y],
  ];

  return (
    <g className="motion-safe:motion-pop" style={{ pointerEvents: "none" }}>
      <circle
        cx={at.x}
        cy={at.y}
        r={r}
        fill="none"
        stroke={HALO}
        strokeWidth={4.6}
        opacity={0.5}
      />
      <circle
        cx={at.x}
        cy={at.y}
        r={r}
        fill="none"
        stroke={AGENT}
        strokeWidth={2.2}
      />
      {arms.map(([x1, y1, x2, y2], index) => (
        <g key={index}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={HALO}
            strokeWidth={4.2}
            strokeLinecap="round"
            opacity={0.5}
          />
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={AGENT}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
}

/**
 * The word, in a pill above the mark with one leader line down to it.
 *
 * Smaller and nearer than `CorrectionCallout`, which has two pins to stay
 * clear of and a warning glyph to carry. This has one subject and no verdict:
 * the pill is the width of its text, sits four and a half pitches up — clear
 * of a part standing in the hole, whose dome tops out around three — and
 * carries nothing but the name.
 */
export function SpotlightCallout({
  at,
  label,
  mono = false,
}: {
  at: SpotlightPoint;
  label: string;
  /** Rule 13: a name the hardware prints (`D7`, `GND`, `F7`) is set in mono. */
  mono?: boolean;
}) {
  const fontSize = PITCH * 1.15;
  /* An estimate of the run, not a measurement: a text box cannot be measured
     during render and a pill a few units too wide is not a defect anybody
     reads. Mono glyphs are wider than the sans at the same size. */
  const advance = fontSize * (mono ? 0.62 : 0.55);
  const boxH = PITCH * 3;
  const boxW = Math.max(PITCH * 6, label.length * advance + PITCH * 2.6);
  const boxX = at.x - boxW / 2;
  const boxY = at.y - PITCH * 4.6 - boxH;
  const baseY = boxY + boxH;

  return (
    <g className="motion-safe:motion-pop" style={{ pointerEvents: "none" }}>
      <line
        x1={at.x}
        y1={at.y - PITCH * 1.5}
        x2={at.x}
        y2={baseY + PITCH * 0.2}
        stroke={AGENT}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.85}
      />
      <rect
        x={boxX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={boxH / 2}
        fill="var(--color-surface)"
        stroke={AGENT}
        strokeWidth={1.4}
      />
      <text
        x={at.x}
        y={boxY + boxH / 2 + fontSize * 0.36}
        textAnchor="middle"
        className={mono ? "font-mono" : "font-sans"}
        fill="var(--color-ink)"
        style={{ fontSize, letterSpacing: mono ? "0.01em" : undefined }}
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Marks on every point and the word once, above the first.
 *
 * A connection is two ends and one name, so it is two marks and one pill; a
 * part with three leads on the bench is three marks and one pill. The pill
 * goes over the first point the tool listed, which is the anchor lead for a
 * part and the board end for a connection — the end the sketch names first.
 */
export function SpotlightOverlay({
  at,
  label,
  mono,
}: {
  at: readonly SpotlightPoint[];
  label: string;
  mono?: boolean;
}) {
  if (at.length === 0) return null;
  /* A lead seated in its hole is two nodes at one place — the lead's mark
     half a pitch up its leg, the hole under it — and two rings there are one
     ring drawn twice, thicker. One mark per place. */
  const marks = at.filter((point, index) =>
    at
      .slice(0, index)
      .every((seen) => Math.hypot(point.x - seen.x, point.y - seen.y) > PITCH * 1.5),
  );
  return (
    <g>
      {marks.map((point, index) => (
        <SpotlightMark key={index} at={point} />
      ))}
      <SpotlightCallout at={marks[0]} label={label} mono={mono} />
    </g>
  );
}
