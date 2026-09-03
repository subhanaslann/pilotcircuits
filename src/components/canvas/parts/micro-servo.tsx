import { PITCH, layout, part } from "@/lib/circuit/geometry";
import type { CircuitNode } from "@/lib/circuit/graph";
import { PX, artTransform, frame } from "@/lib/circuit/wokwi";
import { bench, material as m } from "@/components/illustration/spec";
import { ServoArtwork } from "@/components/canvas/parts/wokwi/servo-artwork";

/**
 * C-08 · Micro servo   ·   C-12 · Barrier arm
 *
 * The case, its three leads and the horn are Wokwi's SG90 (MIT). The barrier
 * arm is ours — it is this build's cardboard, not a part anyone sells.
 *
 * Wokwi draws the horn pointing up at `angle=0`; the product means `angle=0` to
 * be the closed barrier, which lies along the bench to the right. So the
 * drawing is handed `angle + 90` and the arm is drawn pointing right and turned
 * by `angle` — both land in the same place, and the product's own vocabulary is
 * the one the rest of the code keeps speaking.
 *
 * The rotation transition is what makes "preview correct angle" legible
 * (rule 6).
 */
export function MicroServo({
  pins,
  angle,
  showLabels,
  showArm = true,
  tone = "solid",
  at = layout.servo,
}: {
  pins: CircuitNode[];
  /**
   * Where the case sits.
   *
   * Defaults to the capstone's slot. A chapter that lays out its own bench
   * passes its own — and chapter five does, because its servo is a part
   * somebody puts on the desk rather than furniture the author placed.
   */
  at?: { x: number; y: number };
  /** Horn angle in degrees; 0 is the closed barrier. */
  angle: number;
  showLabels: boolean;
  showArm?: boolean;
  /** `ghost` draws the expected position behind the real one. */
  tone?: "solid" | "ghost";
}) {
  const ghost = tone === "ghost";

  /**
   * Where the horn turns, derived from where the case is.
   *
   * `geometry.spindle` is the same two offsets added to the capstone's slot,
   * and it was the only answer while the servo was furniture. A servo somebody
   * puts on the desk needs the offsets applied to ITS position, or the arm and
   * the ghost rotate about a point on another chapter's bench. Identical for
   * the capstone, which passes no `at`.
   */
  const turnsAt = {
    x: at.x + 91.467 * PX,
    y: at.y + 59.773 * PX,
  };

  /* The horn and the arm turn together, so they share one rotation. */
  const turn = {
    transform: `rotate(${angle}deg)`,
    transformOrigin: `${turnsAt.x}px ${turnsAt.y}px`,
    transition: "transform var(--duration-deliberate) var(--ease-out-soft)",
  };

  if (ghost) {
    /* Only the moving parts: the ghost says where the horn should be, and a
       second case drawn underneath the real one would just thicken its edges. */
    return (
      <g opacity={0.45}>
        <g style={turn} className="motion-reduce:transition-none">
          <rect
            x={turnsAt.x - PITCH * 0.5}
            y={turnsAt.y - PITCH * 0.5}
            width={part.servo.horn}
            height={PITCH}
            rx={PITCH * 0.5}
            fill="var(--color-success)"
            stroke="var(--color-success)"
            strokeWidth={1}
          />
          {showArm ? (
            <rect
              x={turnsAt.x + part.servo.horn - PITCH}
              y={turnsAt.y - part.barrierArm.width / 2}
              width={part.barrierArm.length}
              height={part.barrierArm.width}
              rx={1.5}
              fill="var(--color-success)"
              stroke="var(--color-success)"
              strokeWidth={1}
            />
          ) : null}
        </g>
      </g>
    );
  }

  return (
    <g>
      <g
        transform={artTransform(frame.servo, at)}
        style={{
          /* The artwork rotates its own horn, so the transition has to live on
             the element that carries the angle rather than on our wrapper. */
          transition: "none",
        }}
      >
        <ServoArtwork angle={angle + 90} hornColor={m.hornWhite} />
      </g>

      {/* The arm rides the horn. */}
      <g style={turn} className="motion-reduce:transition-none">
        {showArm ? (
          <rect
            x={turnsAt.x + part.servo.horn - PITCH}
            y={turnsAt.y - part.barrierArm.width / 2}
            width={part.barrierArm.length}
            height={part.barrierArm.width}
            rx={1.5}
            fill={m.armLight}
            stroke={m.armLightEdge}
            strokeWidth={1}
          />
        ) : null}
      </g>

      {pins.map((pin) => (
        <g key={pin.id}>
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
    </g>
  );
}
