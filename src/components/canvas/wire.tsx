"use client";

import { PITCH } from "@/lib/circuit/geometry";
import type { CircuitNode, Connection } from "@/lib/circuit/graph";
import { wireExits, wireMidpoint, wirePath } from "@/lib/circuit/routing";
import { connector, wireNeutral, wireRoles } from "@/lib/design/tokens";
import { useCopy } from "@/content/copy-provider";

/**
 * C-11 · Jumper wire   ·   C-13 · Mismatch state   ·   C-17 · Light trace
 *
 * A jumper is a round cable with a moulded plug on each end, and it is drawn
 * as one: a single soft shadow, a darker rim showing down both sides where a
 * blur used to be, a solid body, and a housing where it meets the pin.
 * Nothing here is dashed. A dash on a cable that is physically present reads
 * as damage, and at canvas zoom it broke into coarse capsules.
 *
 * How a mismatch is told, now that the dash is gone (design-language.md,
 * rule 7 — never colour alone):
 *
 *   1. every other cable drains to neutral grey, so one wire keeps its hue
 *   2. the callout above the header names the move, `D6 → D7`
 *   3. both pins carry a mark, one filled and one open
 *
 * The travelling glint is a single short highlight, not a dash pattern — it
 * points at the wire the agent is talking about without breaking it up.
 */
export function Wire({
  connection,
  from,
  to,
  state = "normal",
  showLabel = false,
  trace = false,
}: {
  connection: Connection;
  from: CircuitNode;
  to: CircuitNode;
  /**
   * `mismatch` overrides the role's colour; `target` is the expected route,
   * which is drawn as an annotation rather than a cable; `dimmed` is every
   * other wire while one of them is the subject.
   */
  state?: "normal" | "mismatch" | "target" | "dimmed";
  showLabel?: boolean;
  /**
   * C-22 · One green pulse down the wire, played once when the step it belongs
   * to verifies. Remounting the component replays it, which is exactly when it
   * should play.
   */
  trace?: boolean;
}) {
  const copy = useCopy();
  const role =
    state === "mismatch"
      ? wireRoles.error
      : state === "target"
        ? wireRoles.target
        : wireRoles[connection.role];

  const d = wirePath(from, to);
  const mid = wireMidpoint(from, to);
  const exits = wireExits(from, to);

  const dimmed = state === "dimmed";
  /* An expected route is not a cable: no shadow, no rim, no plugs, and the one
     place a dash still belongs — it means "there is nothing here yet". */
  const ghost = state === "target";

  const stroke = dimmed ? wireNeutral.stroke : role.stroke;
  const edge = dimmed ? wireNeutral.edge : role.edge;
  /* How far the darker rim shows past the cable on each side. */
  const edgeWidth = role.width * 1.4;

  /* Colour changes as the agent moves its attention, so it moves rather than
     cuts (rule 6). */
  const fade =
    "motion-safe:transition-[stroke,fill] duration-settle ease-out-soft";

  if (ghost) {
    return (
      <g>
        <path
          d={d}
          fill="none"
          stroke={role.stroke}
          strokeWidth={role.width}
          strokeLinecap="round"
          strokeDasharray={role.dash}
        />
        {showLabel ? (
          <WireLabel
            x={mid.x}
            y={mid.y}
            text={connection.label ?? copy.wire.label[role.id]}
            tone={state}
          />
        ) : null}
      </g>
    );
  }

  return (
    <g>
      {/* One shadow, unbroken, offset down and to the right. Two layers or a
          blur made the edge mushy at zoom; the rim below carries the volume. */}
      <path
        d={d}
        fill="none"
        stroke={dimmed ? "rgba(16,24,40,0.10)" : "rgba(16,24,40,0.16)"}
        strokeWidth={edgeWidth + 1.4}
        strokeLinecap="round"
        transform="translate(0.8 1.4)"
        className={fade}
      />

      {/* Rim: the same hue 25% darker, a shade wider than the cable, so a dark
          line shows down both sides. This is the whole volume trick — the
          cable is flat, its edges are not. Run down the centre instead, the
          same colour reads as a groove and the cable looks hollow. */}
      <path
        d={d}
        fill="none"
        stroke={edge}
        strokeWidth={edgeWidth}
        strokeLinecap="round"
        className={fade}
      />

      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={role.width}
        strokeLinecap="round"
        className={fade}
      />

      {/* C-17 — one short glint sliding along the subject wire. */}
      {state === "mismatch" ? (
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={role.width * 0.34}
          strokeLinecap="round"
          strokeDasharray="12 120"
          className="motion-safe:animate-[cp-glint_2.4s_linear_infinite]"
        />
      ) : null}

      {trace ? (
        <path
          d={d}
          fill="none"
          stroke="var(--color-success)"
          /* Wider than the cable, so the wire itself reads as lighting up. A
             hairline over an amber jumper is invisible at fit-view zoom, which
             is exactly where the user is standing when a step verifies. */
          strokeWidth={role.width + 1}
          strokeLinecap="round"
          strokeDasharray="70 400"
          /* Linear, not eased: a signal travels the wire at one speed. An
             ease-out puts most of the distance in the first fifth of the
             duration, and the pulse is gone before the eye finds it. */
          className="motion-safe:animate-[cp-success-trace_1100ms_linear_forwards]"
        />
      ) : null}

      <Connector at={from} exit={exits.from} muted={dimmed} fade={fade} />
      <Connector at={to} exit={exits.to} muted={dimmed} fade={fade} />

      {showLabel ? (
        <WireLabel
          x={mid.x}
          y={mid.y}
          text={connection.label ?? copy.wire.label[role.id]}
          tone={state}
        />
      ) : null}
    </g>
  );
}

/**
 * The moulded housing on the end of a jumper, seated over the hole and lying
 * along the leg's exit axis.
 *
 * Deliberately drawn under scale: a real housing is a full 2.54 mm wide, and
 * two of them on adjacent pins — which is exactly the D6/D7 case the demo is
 * built around — merge into one black bar and swallow the pin marks. At 0.56
 * pitch they still read as plugs and leave the marks room.
 */
function Connector({
  at,
  exit,
  muted,
  fade,
}: {
  at: CircuitNode;
  /** Signed vertical offset the leg leaves on, from `wireExits`. */
  exit: number;
  muted?: boolean;
  fade: string;
}) {
  const up = exit < 0;
  const width = PITCH * 0.56;
  const height = PITCH;
  /* How far the housing sinks over the hole, so it looks seated, not perched. */
  const seat = PITCH * 0.42;
  const y = up ? at.y + seat - height : at.y - seat;
  /* Latch rib on the outer half, where the light catches it. */
  const ribY = y + height * (up ? 0.32 : 0.68);

  return (
    <g>
      <rect
        x={at.x - width / 2}
        y={y}
        width={width}
        height={height}
        rx={PITCH * 0.16}
        fill={muted ? connector.bodyMuted : connector.body}
        className={fade}
      />
      <line
        x1={at.x - width * 0.28}
        y1={ribY}
        x2={at.x + width * 0.28}
        y2={ribY}
        stroke={connector.rib}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </g>
  );
}

function WireLabel({
  x,
  y,
  text,
  tone,
}: {
  x: number;
  y: number;
  text: string;
  tone: "normal" | "mismatch" | "target" | "dimmed";
}) {
  const width = text.length * PITCH * 0.55 + PITCH * 2.6;
  const height = PITCH * 1.8;

  const ink =
    tone === "mismatch"
      ? "var(--color-wire-error)"
      : tone === "target"
        ? "var(--color-wire-target)"
        : "var(--color-ink-secondary)";

  return (
    <g className="motion-safe:motion-pop">
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={height / 2}
        fill="var(--color-surface)"
        stroke={tone === "normal" ? "var(--color-border)" : ink}
        strokeWidth={0.9}
      />
      {tone === "mismatch" ? (
        <path
          d={`M ${x - width / 2 + PITCH * 0.9} ${y + PITCH * 0.35}
              l ${PITCH * 0.55} ${-PITCH * 0.95}
              l ${PITCH * 0.55} ${PITCH * 0.95} Z`}
          fill="none"
          stroke={ink}
          strokeWidth={1.1}
          strokeLinejoin="round"
        />
      ) : null}
      <text
        x={tone === "mismatch" ? x + PITCH * 0.55 : x}
        y={y + PITCH * 0.32}
        textAnchor="middle"
        fill={ink}
        className="font-mono"
        style={{ fontSize: PITCH * 0.72, letterSpacing: "0.02em" }}
      >
        {text}
      </text>
    </g>
  );
}
