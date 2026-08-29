"use client";

import { MicroServo } from "@/components/canvas/parts/micro-servo";
import { DeskSurface } from "@/components/canvas/desk-surface";
import { KeyValueRow } from "@/components/ui/card";
import { useCopy } from "@/content/copy-provider";
import { PITCH, hornFrame, spindle } from "@/lib/circuit/geometry";
import { node, type CircuitScene } from "@/lib/circuit/graph";
import { cn } from "@/lib/utils/cn";

/**
 * W-08 · Horn angle comparator
 *
 * The second fault this build teaches is not a wire, and it cannot be shown as
 * one: the horn is fitted a quarter turn out, so the sketch's OPEN command
 * closes the gate. The only way to see that is to see both angles at once.
 *
 * **It is the canvas, cropped.** Same `MicroServo`, same 1:1 scene units, same
 * mat underneath — `hornFrame` is a viewBox around the servo and nothing more.
 * The alternative was a diagram of a servo drawn for this panel, and that would
 * have been the fourth drawing scale in a product that has decided it has
 * three (canvas 1:1, mark 48-box, scene 160 × 100).
 *
 * The ghost is C-18 unchanged, which is why the expected horn is green here and
 * green on the workbench: one device for "where this belongs", used twice.
 *
 * The arc is the only thing added, and it earns its place by carrying the
 * quantity — a reader can see two horns without being able to say how far
 * apart they are. Its label is a hardware value, so it is mono (rule 13), and
 * the two rows underneath say the same two numbers in words, because a picture
 * is not a state word (rule 9).
 */

const RADIUS = PITCH * 11;

/** A point on the sweep. SVG turns clockwise for positive degrees. */
function at(cx: number, cy: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + RADIUS * Math.cos(radians),
    y: cy + RADIUS * Math.sin(radians),
  };
}

function Legend({
  tone,
  children,
}: {
  tone: "observed" | "expected";
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 shrink-0 rounded-full border-2",
          tone === "observed"
            ? "border-ink-secondary bg-ink-secondary"
            : "border-success bg-transparent",
        )}
      />
      {children}
    </span>
  );
}

export function HornAngleCompare({
  scene,
  className,
}: {
  scene: CircuitScene;
  className?: string;
}) {
  const copy = useCopy();
  const { servoAngle, expectedAngle } = scene.mechanical;

  const pins = ["servo.signal", "servo.power", "servo.ground"].map((id) =>
    node(scene, id),
  );

  const from = at(spindle.x, spindle.y, servoAngle);
  const to = at(spindle.x, spindle.y, expectedAngle);
  const delta = expectedAngle - servoAngle;
  const mid = at(spindle.x, spindle.y, (servoAngle + expectedAngle) / 2);

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-overline text-ink-tertiary uppercase">
        {copy.inspection.hornAngle}
      </p>

      {/* The box keeps the frame's own proportion. An SVG letterboxed inside
         a wider pane does not crop — it shows more scene on both sides, and
         what is beside this crop is the oak the mat sits on. */}
      <div className="bg-surface-sunken layer-sunken mt-2 aspect-[11/10] overflow-hidden rounded-lg">
        <svg
          role="img"
          aria-label={copy.inspection.hornAngle}
          viewBox={`${hornFrame.x} ${hornFrame.y} ${hornFrame.width} ${hornFrame.height}`}
          className="block h-full w-full"
        >
          <DeskSurface />
          <MicroServo
            pins={pins}
            angle={expectedAngle}
            showLabels={false}
            tone="ghost"
          />
          <MicroServo pins={pins} angle={servoAngle} showLabels={false} />

          {delta ? (
            <g>
              <path
                d={`M ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 ${
                  Math.abs(delta) > 180 ? 1 : 0
                } ${delta > 0 ? 1 : 0} ${to.x} ${to.y}`}
                fill="none"
                stroke="var(--color-success)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="6 6"
              />
              <text
                x={mid.x + PITCH * 1.4}
                y={mid.y}
                className="font-mono"
                fill="var(--color-success)"
                style={{ fontSize: PITCH * 1.6, fontWeight: 600 }}
              >
                {`${delta > 0 ? "+" : ""}${delta}°`}
              </text>
            </g>
          ) : null}
        </svg>
      </div>

      <dl className="mt-2">
        <KeyValueRow
          label={<Legend tone="observed">{copy.inspection.observed}</Legend>}
          value={`${servoAngle}°`}
        />
        <KeyValueRow
          label={<Legend tone="expected">{copy.inspection.expected}</Legend>}
          value={`${expectedAngle}°`}
        />
      </dl>
    </div>
  );
}
