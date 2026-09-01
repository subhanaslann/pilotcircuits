"use client";

import { CircuitSceneView } from "@/components/canvas/circuit-scene";
import {
  LampSceneView,
  type BenchHandling,
} from "@/components/canvas/lamp-scene";
import { BreadboardBenchView } from "@/components/canvas/breadboard-bench";
import { lightBench } from "@/components/canvas/traffic-light-bench";
import { nightBench } from "@/components/canvas/motion-night-light-bench";
import { plantBench } from "@/components/canvas/plant-guardian-bench";
import { soapBench } from "@/components/canvas/touchless-soap-bench";
import type {
  CircuitNode,
  CircuitScene,
  Highlight,
  NodeId,
} from "@/lib/circuit/graph";
import type { PartId, TerminalId } from "@/lib/circuit/placement";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * Which view a build is drawn with.
 *
 * The conditional is not new — the workbench has carried it since chapter one
 * got a bench. What is new is that it lives in **one** place. It lived in one
 * and was needed in three: the inspection modal drew every build with the
 * capstone's view, so pressing `Inspect my build` on chapter one threw
 * `Unknown circuit node: servo.signal` out of a `useMemo` reaching for pins the
 * lamp does not have. That is the chapter's own primary action, crashing the
 * app — and it crashed because the answer to "which view?" was written down
 * twice and only maintained once.
 *
 * A dispatcher rather than a flag on either view: `lamp-scene.tsx` records why
 * a single view taking a list of which parts to draw would be "a switch
 * statement wearing a prop". This is that switch, written once, where the next
 * build can be added to it in one line.
 *
 * **One arm per build, and no default.** A `projectId` with no case of its own
 * used to fall through to `CircuitSceneView`, and that is not a blank canvas:
 * it resolves `servo.signal` with the throwing `node()` inside a `useMemo`, so
 * a build this file has not been told about crashes the app instead of drawing
 * nothing — the same fault the paragraph above records, one level up. The last
 * arm is the capstone's own view now, not a fallback for whatever arrives next.
 *
 * The build-specific props are passed only to the view that understands them.
 * A lamp handed `test` would be a lamp with a car driving at it.
 */
export function BuildSceneView({
  projectId,
  lit,
  breathing,
  lamps,
  entering,
  targets,
  picking,
  onSeat,
  onRemove,
  onCancelPick,
  choosing,
  onPickLead,
  onCancelChoose,
  handling,
  ledState,
  servoGhost,
  test,
  ...shared
}: {
  projectId: ProjectId;
  scene: CircuitScene;
  showLabels: boolean;
  highlight?: Highlight;
  reference?: CircuitScene;
  successTrace?: string[];
  /** Chapter one: whether the sketch is driving the pin. */
  lit?: boolean;
  /**
   * Swelling and fading rather than simply on — chapter one's whole point, and
   * the difference its functional test is looking for.
   */
  breathing?: boolean;
  /**
   * Chapter two: which of the three lamps the sketch is driving.
   *
   * Its own prop rather than a widening of `lit`, because a traffic light has
   * three lamps and "all three dark" is a real frame — the one the sequence
   * starts and ends on. A single flag cannot say which one is lit.
   */
  lamps?: { red: boolean; yellow: boolean; green: boolean };
  /**
   * A part that has just arrived, drawn coming down onto the bench.
   *
   * Forwarded to both assembled builds: the briefing's assembly names the
   * arriving part in the build's own vocabulary, which is a `PartId` and not a
   * union either view can spell for itself.
   */
  entering?: PartId;
  /** Chapter one: everywhere the lead in hand may go — holes, and free leads. */
  targets?: CircuitNode[];
  /** Chapter one: a lead is in the person's hand and the targets are offering. */
  picking?: {
    lead: TerminalId;
    blocked?: readonly CircuitNode[];
    attached?: NodeId;
    hover?: NodeId;
    aimAt: (target: CircuitNode) => { x: number; y: number };
    nameFor: (target: CircuitNode) => string;
    release?: string;
  };
  onSeat?: (target: NodeId) => void;
  onRemove?: () => void;
  onCancelPick?: () => void;
  /** Chapter one: a part was clicked and which of its leads moves is the question. */
  choosing?: PartId;
  onPickLead?: (terminal: TerminalId) => void;
  onCancelChoose?: () => void;
  /** Chapter one: moving a lead that is already on the bench. */
  handling?: BenchHandling;
  /** The capstone's two status LEDs. */
  ledState?: { green: boolean; red: boolean };
  /** The capstone's expected horn position, drawn behind the current one. */
  servoGhost?: boolean;
  /** C-23, the capstone's functional test, driven from outside. */
  test?: { approach: number; distanceCm: number | null; sensing?: boolean };
}) {
  if (projectId === "breathingLamp") {
    return (
      <LampSceneView
        {...shared}
        lit={lit}
        breathing={breathing}
        entering={entering}
        targets={targets}
        picking={picking}
        onSeat={onSeat}
        onRemove={onRemove}
        onCancelPick={onCancelPick}
        choosing={choosing}
        onPickLead={onPickLead}
        onCancelChoose={onCancelChoose}
        handling={handling}
      />
    );
  }

  if (projectId === "trafficLight") {
    return (
      <BreadboardBenchView
        {...shared}
        spec={lightBench}
        live={lamps}
        entering={entering}
        targets={targets}
        picking={picking}
        onSeat={onSeat}
        onRemove={onRemove}
        onCancelPick={onCancelPick}
        choosing={choosing}
        onPickLead={onPickLead}
        onCancelChoose={onCancelChoose}
        handling={handling}
      />
    );
  }

  if (projectId === "motionNightLight") {
    return (
      <BreadboardBenchView
        {...shared}
        spec={nightBench}
        /* One lamp, so the flag chapter one already carries. `lamps` is three
           named booleans and would be two questions this build cannot answer. */
        live={lit}
        entering={entering}
        targets={targets}
        picking={picking}
        onSeat={onSeat}
        onRemove={onRemove}
        onCancelPick={onCancelPick}
        choosing={choosing}
        onPickLead={onPickLead}
        onCancelChoose={onCancelChoose}
        handling={handling}
      />
    );
  }

  if (projectId === "plantGuardian") {
    return (
      <BreadboardBenchView
        {...shared}
        spec={plantBench}
        live={lit}
        entering={entering}
        targets={targets}
        picking={picking}
        onSeat={onSeat}
        onRemove={onRemove}
        onCancelPick={onCancelPick}
        choosing={choosing}
        onPickLead={onPickLead}
        onCancelChoose={onCancelChoose}
        handling={handling}
      />
    );
  }

  if (projectId === "touchlessSoapDispenser") {
    return (
      <BreadboardBenchView
        {...shared}
        spec={soapBench}
        /* Two things move on this bench. The horn's angle comes off the scene
           rather than from a prop of its own: the run folds `hornAngle` into
           `mechanical.servoAngle`, so the drawing and the model cannot come to
           disagree about where it is. */
        live={{ lit, angle: shared.scene.mechanical.servoAngle }}
        entering={entering}
        targets={targets}
        picking={picking}
        onSeat={onSeat}
        onRemove={onRemove}
        onCancelPick={onCancelPick}
        choosing={choosing}
        onPickLead={onPickLead}
        onCancelChoose={onCancelChoose}
        handling={handling}
      />
    );
  }

  /* The capstone, which is the only build left that is laid out by an author
     rather than assembled — so it takes none of the placement props and every
     one of its own. */
  return (
    <CircuitSceneView
      {...shared}
      ledState={ledState}
      servoGhost={servoGhost}
      test={test}
    />
  );
}
