"use client";

import { PITCH } from "@/lib/circuit/geometry";
import type { CircuitNode, Connection } from "@/lib/circuit/graph";
import {
  WIRE_LABEL_HEIGHT,
  wireExits,
  wireLabelWidth,
  wirePath,
} from "@/lib/circuit/routing";
import { connector, wireNeutral, wireRoles } from "@/lib/design/tokens";

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
 *
 * **A wire does not print its own name.** It used to, and the two labels a
 * scene needed most were the two the picture destroyed: a cable drawn after
 * another wire's pill runs straight across the words, and `Trig → D8` read as
 * `Trig`. Neither problem is visible from inside one wire — one needs to know
 * where the other pills are, the other needs to be drawn after every cable —
 * so the words go up to `WireLabels`, a layer, which is where the file header
 * has always said they belong.
 */
export type WireTone = "normal" | "mismatch" | "target" | "dimmed";

/**
 * A wire is a picture of a join, not a handle on one.
 *
 * Nothing in this canvas set `pointer-events` at all, and wires are painted
 * *after* the parts' grab rects — so under SVG's default `visiblePainted` every
 * stroked path and every moulded plug housing was a hit target sitting on top
 * of the controls beneath it. Pressing the LED's dome right of centre, or
 * either end of the resistor's body, landed on a cable, bubbled to the
 * viewport, and panned the bench instead of picking the part up.
 *
 * There is nothing to grab here even in principle: paths are derived from their
 * two endpoints (`routing.ts`) and the only way to change one is to move a
 * lead. The gesture is on the leads; this is the drawing of the result.
 */
const NOT_A_CONTROL = { pointerEvents: "none" } as const;

/** Tinned copper. Not a token: it is the material, not a role. */
const LEG_METAL = "#B9C2CC";
/** A 0.5 mm lead is two scene units; drawn a hair over so it survives zoom-out. */
const LEG_WIDTH = 2.4;

export function Wire({
  connection,
  from,
  to,
  state = "normal",
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
  state?: WireTone;
  /**
   * C-22 · One green pulse down the wire, played once when the step it belongs
   * to verifies. Remounting the component replays it, which is exactly when it
   * should play.
   */
  trace?: boolean;
}) {
  const role =
    state === "mismatch"
      ? wireRoles.error
      : state === "target"
        ? wireRoles.target
        : wireRoles[connection.role];

  /**
   * A component's own leg is not a cable.
   *
   * Chapter one has no jumper wires at all — its joins are the LED's and the
   * resistor's own legs, which `graph.ts` has recorded as `medium: "leg"` since
   * the day the kit list stopped offering a beginner two cables they do not
   * have. Nothing has ever read it, so a 220Ω resistor standing in the header
   * was drawn with a fat blue Dupont cable and two moulded plug housings — one
   * of them planted over the D13 hole, which is a target the person is being
   * asked to aim at.
   *
   * So a leg draws as what it is: one thin stroke in the part's own tinned
   * metal, no shadow, no rim, no housings — and it **routes** as what it is
   * too, which is the half of this that was missed: see `legPath`.
   */
  const leg = connection.medium === "leg";

  const d = wirePath(from, to, connection.medium);
  const exits = wireExits(from, to);

  const dimmed = state === "dimmed";
  /* An expected route is not a cable: no shadow, no rim, no plugs, and the one
     place a dash still belongs — it means "there is nothing here yet". */
  const ghost = state === "target";

  const stroke = dimmed
    ? wireNeutral.stroke
    : leg && state === "normal"
      ? LEG_METAL
      : role.stroke;
  const edge = dimmed ? wireNeutral.edge : role.edge;
  /* How far the darker rim shows past the cable on each side. */
  const edgeWidth = role.width * 1.4;

  /* Colour changes as the agent moves its attention, so it moves rather than
     cuts (rule 6). */
  const fade =
    "motion-safe:transition-[stroke,fill] duration-settle ease-out-soft";

  if (ghost) {
    return (
      <path
        style={NOT_A_CONTROL}
        d={d}
        fill="none"
        stroke={role.stroke}
        strokeWidth={role.width}
        strokeLinecap="round"
        strokeDasharray={role.dash}
      />
    );
  }

  const width = leg ? LEG_WIDTH : role.width;

  return (
    <g style={NOT_A_CONTROL}>
      {/* One shadow, unbroken, offset down and to the right. Two layers or a
          blur made the edge mushy at zoom; the rim below carries the volume.
          A leg is a wire a third of a millimetre across and casts nothing you
          would see. */}
      {leg ? null : (
        <path
          d={d}
          fill="none"
          stroke={dimmed ? "rgba(16,24,40,0.10)" : "rgba(16,24,40,0.16)"}
          strokeWidth={edgeWidth + 1.4}
          strokeLinecap="round"
          transform="translate(0.8 1.4)"
          className={fade}
        />
      )}

      {/* Rim: the same hue 25% darker, a shade wider than the cable, so a dark
          line shows down both sides. This is the whole volume trick — the
          cable is flat, its edges are not. Run down the centre instead, the
          same colour reads as a groove and the cable looks hollow. A leg has no
          sleeve to catch the light on. */}
      {leg ? null : (
        <path
          d={d}
          fill="none"
          stroke={edge}
          strokeWidth={edgeWidth}
          strokeLinecap="round"
          className={fade}
        />
      )}

      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        className={fade}
      />

      {/* C-17 — one short glint sliding along the subject wire. */}
      {state === "mismatch" ? (
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={width * 0.34}
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
          strokeWidth={width + 1}
          strokeLinecap="round"
          strokeDasharray="70 400"
          /* Linear, not eased: a signal travels the wire at one speed. An
             ease-out puts most of the distance in the first fifth of the
             duration, and the pulse is gone before the eye finds it. */
          className="motion-safe:animate-[cp-success-trace_1100ms_linear_forwards]"
        />
      ) : null}

      {/* Housings belong to a cable. A leg goes straight into the hole, and a
          moulded plug drawn on one covers the hole underneath it — which on
          this bench is a candidate somebody is being asked to aim at. */}
      {leg ? null : (
        <>
          <Connector at={from} exit={exits.from} muted={dimmed} fade={fade} />
          <Connector at={to} exit={exits.to} muted={dimmed} fade={fade} />
        </>
      )}
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

export interface PlacedWireLabel {
  /** The wire this names, so React can key it. */
  key: string;
  /** Pill centre, already de-conflicted by `placeWireLabels`. */
  x: number;
  y: number;
  text: string;
  tone: WireTone;
}

/**
 * Every wire label in a scene, drawn in one pass above every cable.
 *
 * Above the wires, below the agent's marks: a pill that a jumper crosses is
 * unreadable, and a pill over a `CorrectionCallout` hides the sentence the
 * agent is in the middle of saying. Positions come from `placeWireLabels`,
 * which is the only thing that can see all of them at once.
 */
export function WireLabels({ labels }: { labels: readonly PlacedWireLabel[] }) {
  return (
    <>
      {labels.map((label) => (
        <WireLabel
          key={label.key}
          x={label.x}
          y={label.y}
          text={label.text}
          tone={label.tone}
        />
      ))}
    </>
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
  tone: WireTone;
}) {
  /* Shared with `placeWireLabels`, which has to know how much room a pill takes
     before it can tell whether two of them collide. */
  const width = wireLabelWidth(text);
  const height = WIRE_LABEL_HEIGHT;

  /* The `-edge` tokens, not the cable's own colour. A pill sits on its own
     white capsule rather than on the cable, and `--color-wire-error` on
     `--color-surface` is 2.90:1 while `--color-wire-target` is 2.96:1 — both
     under §18's 3:1 floor for UI. The edge tokens are the same hue a shade
     down (4.9:1 and 5.1:1), so the pill still reads as belonging to its cable.
     The CABLE keeps the bright token; darkening that would change what the
     bench looks like, and the bench is not what fails here. */
  const ink =
    tone === "mismatch"
      ? "var(--color-wire-error-edge)"
      : tone === "target"
        ? "var(--color-wire-target-edge)"
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
