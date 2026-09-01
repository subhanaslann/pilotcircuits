"use client";

import { useMemo } from "react";
import { PITCH, layout, part } from "@/lib/circuit/geometry";
import type { CircuitScene, Highlight } from "@/lib/circuit/graph";
import { comparedTo, node } from "@/lib/circuit/graph";
import { placeWireLabels } from "@/lib/circuit/routing";
import { useCopy } from "@/content/copy-provider";
import { DeskSurface } from "@/components/canvas/desk-surface";
import { UnoBoard } from "@/components/canvas/parts/uno-board";
import { Breadboard } from "@/components/canvas/parts/breadboard";
import { UltrasonicSensor } from "@/components/canvas/parts/ultrasonic";
import { MicroServo } from "@/components/canvas/parts/micro-servo";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import {
  Wire,
  WireLabels,
  type PlacedWireLabel,
  type WireTone,
} from "@/components/canvas/wire";
import { TestOverlay } from "@/components/canvas/overlays/test-overlay";
import {
  CorrectionCallout,
  TargetPinMark,
  WrongPinMark,
} from "@/components/canvas/overlays/pin-rings";

/**
 * The whole build, drawn in one fixed layer order:
 *
 *   grid → substrate → parts → wires → labels → overlays
 *
 * Overlays are always above everything. An error ring that ends up under a
 * jumper would point at nothing, and a wire label over a `CorrectionCallout`
 * would hide the sentence the agent is in the middle of saying.
 *
 * Labels are a layer rather than a thing each wire draws for itself, and that
 * is not tidiness: five wires converge on the Uno's digital header, so a pill
 * needs to know where the other pills are, and it needs to be drawn after every
 * cable — neither of which is knowable from inside one wire.
 */

export type { Highlight } from "@/lib/circuit/graph";

export function CircuitSceneView({
  scene,
  showLabels,
  highlight,
  ledState,
  servoGhost = false,
  reference,
  successTrace,
  test,
}: {
  scene: CircuitScene;
  showLabels: boolean;
  highlight?: Highlight;
  ledState?: { green: boolean; red: boolean };
  /** Draws the expected servo position behind the current one. */
  servoGhost?: boolean;
  /**
   * C-20 · The finished build, laid underneath. Only the routes that differ are
   * drawn, as the same dashed teal the product already uses for "where this
   * belongs" — drawing every reference wire would double the tangle and hide
   * the one thing the view exists to show.
   */
  reference?: CircuitScene;
  /** C-22 · Connections to run one green pulse along. */
  successTrace?: string[];
  /** C-23 · The functional test, driven from outside. */
  test?: {
    approach: number;
    distanceCm: number | null;
    sensing?: boolean;
  };
}) {
  const copy = useCopy();

  /* The breadboard is the one part we still draw ourselves, so it is the only
     one that needs its holes handed to it — the bought parts carry their own
     pin positions in their artwork. */
  const holes = useMemo(
    () =>
      Object.values(scene.nodes).filter((n) => n.kind === "breadboard-hole"),
    [scene.nodes],
  );
  const servoPins = useMemo(
    () =>
      ["servo.signal", "servo.power", "servo.ground"].map((id) =>
        node(scene, id),
      ),
    [scene],
  );

  /* C-20 · which connections the current build does not match. */
  const differences = useMemo(
    () => (reference ? comparedTo(scene, reference) : []),
    [scene, reference],
  );
  const differing = useMemo(
    () => new Set(differences.map((c) => c.id)),
    [differences],
  );

  /* A servo a quarter turn out is a difference the compare view has to show,
     and it is not a connection — so the ghost horn carries it. */
  const mechanicalDiffers = Boolean(
    reference &&
    scene.mechanical.servoAngle !== reference.mechanical.servoAngle,
  );

  /* The wires, resolved once: which end is where, what state it draws in, and
     whether it prints its name. Built here rather than inline in the map
     because the labels have to be placed against **each other**, and a wire
     cannot see its neighbours.

     Sorted with the subject last, so it crosses over the drained ones rather
     than under them. */
  const wires = useMemo(
    () =>
      [...scene.observed]
        .sort((a, b) => {
          const rank = (c: typeof a) =>
            highlight?.connectionId === c.id ? 1 : 0;
          return rank(a) - rank(b);
        })
        .map((connection) => {
          const isSubject = highlight?.connectionId === connection.id;
          /* In compare, everything that already matches drains to grey — the
             same device the mismatch uses, so the eye lands on the one route
             that is different without being told. */
          const dimmed =
            (Boolean(highlight?.connectionId) && !isSubject) ||
            (Boolean(reference) && !differing.has(connection.id));
          return {
            connection,
            from: node(scene, connection.from),
            to: node(scene, connection.to),
            state: (isSubject
              ? "mismatch"
              : dimmed
                ? "dimmed"
                : "normal") as WireTone,
            /* In compare the reference route carries the label; printing the
               current one too stacks two labels on the same midpoint. */
            named:
              showLabels &&
              !dimmed &&
              !highlight?.connectionId &&
              !differing.has(connection.id),
          };
        }),
    [scene, highlight?.connectionId, reference, differing, showLabels],
  );

  /**
   * Every pill in this view, placed in one pass so that none covers another.
   *
   * Five wires converge on the Uno's digital header and their midpoints land
   * within a pill's width of each other: `Trig → D8` and `Echo → D6` overlapped
   * by 27 × 8 units at fit view, and the later opaque capsule erased the
   * earlier one down to a bare `T`. The endpoints are read out of the drawing's
   * own pin tables now, so this is not a coordinate anyone can hand-tune away —
   * keeping the words readable is the label layer's job. Draw order is the
   * tie-break, so it is the order the wires draw in, current before reference.
   */
  const labels = useMemo((): PlacedWireLabel[] => {
    const subjects = [
      ...wires
        .filter((wire) => wire.named)
        .map((wire) => ({
          key: wire.connection.id,
          from: wire.from,
          to: wire.to,
          text: wire.connection.label ?? copy.wire.label[wire.connection.role],
          tone: wire.state,
        })),
      ...(showLabels && reference
        ? differences.map((want) => ({
            key: `ref-${want.id}`,
            from: node(reference, want.from),
            to: node(reference, want.to),
            text: want.label ?? copy.wire.label.target,
            tone: "target" as WireTone,
          }))
        : []),
    ];
    const at = placeWireLabels(subjects);
    return subjects.map((subject) => ({
      key: subject.key,
      ...at[subject.key],
      text: subject.text,
      tone: subject.tone,
    }));
  }, [wires, differences, reference, showLabels, copy]);

  return (
    <>
      <DeskSurface />

      {/* substrate */}
      <Breadboard holes={holes} showLabels={showLabels} />
      <UnoBoard />

      {/* parts */}
      <UltrasonicSensor />
      {servoGhost || mechanicalDiffers ? (
        <MicroServo
          pins={servoPins}
          angle={scene.mechanical.expectedAngle}
          showLabels={false}
          tone="ghost"
        />
      ) : null}
      <MicroServo
        pins={servoPins}
        angle={scene.mechanical.servoAngle}
        showLabels={showLabels}
      />
      <Led
        x={layout.ledGreen.x}
        y={layout.ledGreen.y}
        colour="green"
        lit={ledState?.green}
        label={showLabels ? "Open" : undefined}
      />
      <Led
        x={layout.ledRed.x}
        y={layout.ledRed.y}
        colour="red"
        lit={ledState?.red}
        label={showLabels ? "Closed" : undefined}
      />
      {/* One 220Ω in series with each LED, laid alongside it on the bench. */}
      <Resistor
        x={layout.ledGreen.x - part.resistor.width - PITCH * 2}
        y={layout.ledGreen.y + part.led.height * 0.62}
      />
      <Resistor
        x={layout.ledRed.x - part.resistor.width - PITCH * 2}
        y={layout.ledRed.y + part.led.height * 0.62}
      />

      {/* wires */}
      {wires.map((wire) => (
        <Wire
          key={wire.connection.id}
          connection={wire.connection}
          from={wire.from}
          to={wire.to}
          state={wire.state}
          trace={successTrace?.includes(wire.connection.id)}
        />
      ))}

      {/* C-20 · the reference route, drawn last. It is an annotation rather than
          a cable, so it belongs above the build — under it, a route one pin
          away from the real wire would be hidden by that very wire. */}
      {differences.map((want) => (
        <Wire
          key={`ref-${want.id}`}
          connection={want}
          from={node(reference!, want.from)}
          to={node(reference!, want.to)}
          state="target"
        />
      ))}

      {/* labels — above every cable, because a jumper drawn across a pill is a
          pill nobody can read, and the wire that crosses it is always the one
          drawn later. */}
      <WireLabels labels={labels} />

      {test ? (
        <TestOverlay
          approach={test.approach}
          distanceCm={test.distanceCm}
          sensing={test.sensing}
        />
      ) : null}

      {/* overlays — always above the wires */}
      {highlight?.errorPin ? (
        <WrongPinMark pin={node(scene, highlight.errorPin)} />
      ) : null}
      {highlight?.targetPin ? (
        <TargetPinMark pin={node(scene, highlight.targetPin)} />
      ) : null}
      {highlight?.errorPin && highlight.targetPin ? (
        <CorrectionCallout
          wrong={node(scene, highlight.errorPin)}
          target={node(scene, highlight.targetPin)}
          subject={highlight.subject ?? "Wire"}
        />
      ) : null}
    </>
  );
}
