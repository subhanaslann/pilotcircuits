"use client";

import { useMemo } from "react";
import { layout, part } from "@/lib/circuit/geometry";
import type { CircuitScene, Highlight } from "@/lib/circuit/graph";
import { comparedTo, node } from "@/lib/circuit/graph";
import { DeskSurface } from "@/components/canvas/desk-surface";
import { UnoBoard } from "@/components/canvas/parts/uno-board";
import { Breadboard } from "@/components/canvas/parts/breadboard";
import { UltrasonicSensor } from "@/components/canvas/parts/ultrasonic";
import { MicroServo } from "@/components/canvas/parts/micro-servo";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import { Wire } from "@/components/canvas/wire";
import { TestOverlay } from "@/components/canvas/overlays/test-overlay";
import {
  CorrectionCallout,
  TargetPinMark,
  WrongPinMark,
} from "@/components/canvas/overlays/pin-rings";

/**
 * The whole build, drawn in one fixed layer order:
 *
 *   grid → substrate → parts → wires → overlays → labels
 *
 * Overlays are always above wires. An error ring that ends up under a jumper
 * would point at nothing.
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
  const boardPins = useMemo(
    () => Object.values(scene.nodes).filter((n) => n.kind === "board-pin"),
    [scene.nodes],
  );
  const holes = useMemo(
    () =>
      Object.values(scene.nodes).filter((n) => n.kind === "breadboard-hole"),
    [scene.nodes],
  );
  const sensorPins = useMemo(
    () =>
      ["sensor.vcc", "sensor.trig", "sensor.echo", "sensor.gnd"].map((id) =>
        node(scene, id),
      ),
    [scene],
  );
  const servoPins = useMemo(
    () =>
      ["servo.signal", "servo.power", "servo.ground"].map((id) =>
        node(scene, id),
      ),
    [scene],
  );

  const highlightedPins = [highlight?.errorPin, highlight?.targetPin].filter(
    Boolean,
  ) as string[];

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

  return (
    <>
      <DeskSurface />

      {/* substrate */}
      <Breadboard holes={holes} showLabels={showLabels} />
      <UnoBoard
        pins={boardPins}
        showLabels={showLabels}
        highlighted={highlightedPins}
        dimOtherLabels={highlightedPins.length > 0}
      />

      {/* parts */}
      <UltrasonicSensor
        pins={sensorPins}
        showLabels={showLabels}
        highlighted={highlightedPins}
      />
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
      <Resistor
        x={layout.ledGreen.x - part.resistor.bodyWidth - 30}
        y={layout.ledGreen.y + 4}
      />
      <Resistor
        x={layout.ledRed.x - part.resistor.bodyWidth - 30}
        y={layout.ledRed.y + 4}
      />

      {/* wires — the subject last, so it crosses over the drained ones rather
          than under them. */}
      {[...scene.observed]
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
          return (
            <Wire
              key={connection.id}
              connection={connection}
              from={node(scene, connection.from)}
              to={node(scene, connection.to)}
              state={isSubject ? "mismatch" : dimmed ? "dimmed" : "normal"}
              /* In compare the reference route carries the label; printing the
                 current one too stacks two labels on the same midpoint. */
              showLabel={
                showLabels &&
                !dimmed &&
                !highlight?.connectionId &&
                !differing.has(connection.id)
              }
              trace={successTrace?.includes(connection.id)}
            />
          );
        })}

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
          showLabel={showLabels}
        />
      ))}

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
