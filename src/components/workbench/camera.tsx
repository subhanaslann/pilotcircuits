"use client";

import type { ReactNode } from "react";
import { partBox } from "@/lib/circuit/geometry";
import type { AffectedNode } from "@/lib/agent/findings";
import type { Copy } from "@/content/i18n";
import { useCopy } from "@/content/copy-provider";
import { partNameOf } from "@/lib/agent/parts";
import {
  partOf,
  type PlacementTopology,
} from "@/lib/circuit/placement";
import { bench } from "@/components/illustration/spec";
import { MonoValue } from "@/components/ui/text";
import { cn } from "@/lib/utils/cn";

/**
 * W-06 · Mock camera frame — **two directions, both live, the choice is open.**
 * W-07 · Vision overlay set
 *
 * The question this batch turns on: **how much should the camera look like a
 * camera?**
 *
 * The product's hardest promise is that it never behaves as though real
 * hardware were attached — `Demo feed`, `Board simulated`, `source: "demo"` on
 * every tool result. §7 then asks for "an image of the physical circuit on the
 * desk", which is the one place that promise is under load. Put viewfinder
 * corners, a timestamp and a little grain on it and it reads as a photograph,
 * and the promise is left to a label alone. Put none of them on it and the pane
 * is a second canvas, and the modal has no reason to exist.
 *
 * Both were built against the same content and left side by side at
 * `/lab/workbench#w-camera`, and **`plate` was chosen.**
 *
 *   `plate`    *Chosen.* The frame is evidence, not a photograph. No furniture
 *              on the image at all; the label and the time sit under it, in the
 *              interface's own voice. What keeps it from being a second canvas
 *              is that it is *fixed* — no controls, no view switch — and that
 *              it carries annotations the canvas never draws. The product's
 *              promise is not left to a label doing battle with a picture that
 *              contradicts it.
 *
 *   `capture`  *Rejected, and still built.* Corner marks, the label printed on
 *              the image, the time in its corner, a faint scan. It reads as a
 *              photograph — which is exactly what it was rejected for, and
 *              exactly why it is worth keeping visible.
 *
 * What is not in question, and is identical in both: the picture inside is
 * `CircuitSceneView`. There is no second drawing of this circuit and there will
 * not be one. A camera pane that redrew the build would be a second opinion
 * about it, and the first time a wire moved one of the two would be wrong.
 */

export type CameraVariant = "capture" | "plate";

/* --- W-07 · the annotations ---------------------------------------------- */

/** The outline of one part, in scene units. */
export interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Which part a node belongs to, and what that part is called.
 *
 * The key is looked up in the *build's* box map rather than in the capstone's,
 * because the same node id sits in a different place on a different bench —
 * `board.D9` is one board on the barrier's mat and another on chapter one's.
 * A key the map has not got draws nothing, which is the honest failure: a
 * detection box in the wrong place claims the vision saw a part that is not
 * there.
 */
function substrateOwner(
  id: string,
): { key: string; name: (c: Copy) => string } | null {
  const parts = (c: Copy) => c.build.parts;
  if (id.startsWith("board."))
    return { key: "board", name: (c) => parts(c).board };
  if (id.startsWith("bb."))
    return { key: "breadboard", name: (c) => parts(c).breadboard };
  if (id.startsWith("sensor."))
    return { key: "sensor", name: (c) => parts(c).sensor };
  if (id.startsWith("servo."))
    return { key: "servo", name: (c) => parts(c).servo };
  if (id.startsWith("led.green."))
    return { key: "ledGreen", name: (c) => parts(c).ledGreen };
  if (id.startsWith("led.red."))
    return { key: "ledRed", name: (c) => parts(c).ledRed };
  /* Chapter one has one LED and one resistor, so they need no side. Checked
     after the capstone's two, which are the more specific prefixes. */
  if (id.startsWith("led.")) return { key: "led", name: (c) => parts(c).led };
  if (id.startsWith("res."))
    return { key: "resistor", name: (c) => parts(c).resistor };
  return null;
}

/**
 * Which part a node belongs to, on the build actually in the frame.
 *
 * The ladder above answers in ONE vocabulary — the capstone's — and a build
 * that assembles itself keys its boxes by its own `PartId`s: chapter two's are
 * `ledRed`/`resRed`/`wireGnd`, chapter three's `pir`/`ledNight`/`wirePower`.
 * Against those, `led.night.cathode → "led"` is a key the map has not got, so
 * the overlay drew the board and the breadboard and nothing else — never the
 * part a finding was actually about.
 *
 * So a build with a placement is asked directly: `partOf` already answers
 * exactly this question, in the same words its `boxesFor` is keyed by, and
 * `partNameOf` already names a lead's owner for the shelf and the rail. The
 * ladder stays as the answer for a build laid out by an author, which has no
 * placement to ask.
 */
function ownerOf(
  id: string,
  spec?: PlacementTopology,
): { key: string; name: (c: Copy) => string } | null {
  const part = spec ? partOf(spec, id) : undefined;
  if (part) return { key: part, name: (c) => partNameOf(c, id) };
  return substrateOwner(id);
}

const CORNER = 26;

/**
 * One detection: corner brackets and a name.
 *
 * **Neutral, on purpose.** The box says *the vision found this part here*; it
 * does not say whether the part is right. Colouring it would put a third
 * amber-against-teal signal on top of the error ring and the target ring the
 * canvas already draws for the same finding — one fact in three shapes, which
 * is rule 7 read from the wrong end. Corners rather than a closed rectangle for
 * a related reason: a full outline reads as a border belonging to the part.
 */
function Detection({
  box,
  label,
  terminals,
}: {
  box: DetectionBox;
  label: string;
  /** What the vision read off it: `Echo`, `D6`. Hardware, so mono. */
  terminals: string[];
}) {
  const right = box.x + box.width;
  const bottom = box.y + box.height;

  const corner = (x: number, y: number, dx: number, dy: number) =>
    `M ${x} ${y + dy * CORNER} L ${x} ${y} L ${x + dx * CORNER} ${y}`;

  return (
    <g className="motion-safe:motion-pop">
      {[
        corner(box.x, box.y, 1, 1),
        corner(right, box.y, -1, 1),
        corner(box.x, bottom, 1, -1),
        corner(right, bottom, -1, -1),
      ].map((d, index) => (
        <path
          key={index}
          d={d}
          fill="none"
          stroke={bench.label}
          strokeWidth={1.6}
          strokeLinecap="square"
          opacity={0.85}
        />
      ))}

      <text
        x={box.x}
        y={box.y - 9}
        fill={bench.label}
        style={{ fontSize: 15 }}
        opacity={0.85}
      >
        {label}
      </text>
      {terminals.length ? (
        <text
          x={right}
          y={box.y - 9}
          textAnchor="end"
          className="font-mono"
          fill={bench.labelStrong}
          style={{ fontSize: 14, letterSpacing: "0.04em" }}
        >
          {terminals.join("  ")}
        </text>
      ) : null}
    </g>
  );
}

/**
 * The whole vision result, in scene coordinates.
 *
 * It is drawn inside the same layer the circuit is, so it sits on the canvas's
 * own 1:1 measuring system rather than on a fourth scale of its own — which is
 * also why a box cannot slide off its part when the layout moves.
 */
export function VisionOverlay({
  nodes,
  boxes = partBox,
  spec,
}: {
  nodes: AffectedNode[];
  /** Where this build's parts sit. Defaults to the capstone's bench. */
  boxes?: Readonly<Record<string, DetectionBox>>;
  /**
   * The build's own vocabulary, where it has one.
   *
   * `boxes` is keyed by whatever the build calls its parts, so the only thing
   * that can turn a node id into one of those keys is the build itself.
   */
  spec?: PlacementTopology;
}) {
  const copy = useCopy();

  const grouped = new Map<
    string,
    { box: DetectionBox; name: string; terminals: string[] }
  >();
  for (const node of nodes) {
    const owner = ownerOf(node.id, spec);
    if (!owner) continue;
    const box = boxes[owner.key];
    if (!box) continue;
    const entry = grouped.get(owner.key) ?? {
      box,
      name: owner.name(copy),
      terminals: [],
    };
    if (!entry.terminals.includes(node.terminal)) {
      entry.terminals.push(node.terminal);
    }
    grouped.set(owner.key, entry);
  }

  return (
    <g aria-hidden="true">
      {[...grouped.entries()].map(([key, entry]) => (
        <Detection
          key={key}
          box={entry.box}
          label={entry.name}
          terminals={entry.terminals}
        />
      ))}
    </g>
  );
}

/* --- W-06 · the frame ---------------------------------------------------- */

export function CameraFrame({
  variant,
  capturedAt,
  className,
  children,
}: {
  variant: CameraVariant;
  /** `14:32` — when the frame was taken. A reading, so mono (rule 13). */
  capturedAt: string;
  className?: string;
  children: ReactNode;
}) {
  const copy = useCopy();
  const capture = variant === "capture";

  return (
    <figure className={cn("flex min-w-0 flex-col", className)}>
      <div
        className={cn(
          "bg-surface-sunken relative min-h-0 flex-1 overflow-hidden",
          capture ? "rounded-md" : "layer-sunken rounded-lg",
        )}
      >
        {children}

        {capture ? (
          <>
            {/* Viewfinder marks: inside the frame, not on the picture. This is
                the instrument, not the scene. */}
            {[
              "top-2 left-2 border-t border-l",
              "top-2 right-2 border-t border-r",
              "bottom-2 left-2 border-b border-l",
              "bottom-2 right-2 border-b border-r",
            ].map((position) => (
              <span
                key={position}
                aria-hidden="true"
                className={cn(
                  "border-ink-inverse/45 pointer-events-none absolute size-5",
                  position,
                )}
              />
            ))}
            {/* The scan. A repeating hairline rather than a gradient (rule 12),
                and faint enough to be felt rather than seen. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,#fff_0_1px,transparent_1px_3px)]"
            />
            {/* Burned into the image, the way a camera writes them. */}
            <span className="text-overline text-ink-inverse/85 absolute top-3 left-3 flex items-center gap-1.5 uppercase">
              <span
                aria-hidden="true"
                className="bg-warning size-1.5 rounded-full motion-safe:animate-[cp-attention_1.8s_var(--ease-in-out-soft)_infinite]"
              />
              {copy.inspection.demoVisionResult}
            </span>
            <span className="text-mono-sm text-ink-inverse/70 tnum absolute right-3 bottom-3 font-mono">
              {capturedAt}
            </span>
          </>
        ) : null}
      </div>

      {/* The same two facts, in the interface's own voice instead. */}
      {capture ? null : (
        <figcaption className="text-caption text-ink-tertiary mt-2 flex shrink-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span>{copy.inspection.demoVisionResult}</span>
          <span aria-hidden="true" className="text-ink-disabled">
            ·
          </span>
          <span>{copy.inspection.capturedAt}</span>
          <MonoValue tone="quiet">{capturedAt}</MonoValue>
        </figcaption>
      )}
    </figure>
  );
}
