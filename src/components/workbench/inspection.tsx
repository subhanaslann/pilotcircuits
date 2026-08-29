"use client";

import { useState, type RefObject } from "react";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { CircuitSceneView } from "@/components/canvas/circuit-scene";
import { matBox } from "@/components/canvas/desk-surface";
import { FindingRow } from "@/components/agent/finding";
import { Modal } from "@/components/ui/overlay";
import { AlertStack, EmptyState } from "@/components/ui/status";
import { Divider } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import { isResolved, type Finding, type FindingId } from "@/lib/agent/findings";
import { scene as sceneBox } from "@/lib/circuit/geometry";
import type { CircuitScene, Highlight } from "@/lib/circuit/graph";
import { boundsOf } from "@/lib/circuit/routing";
import { node } from "@/lib/circuit/graph";
import { CameraFrame, VisionOverlay, type CameraVariant } from "./camera";
import { HornAngleCompare } from "./horn-angle";

/**
 * W-05 · Inspection modal frame   ·   W-09 · Findings summary
 *
 * `Modal size="wide"` (M-07) fed, not rewritten — focus trap, Escape, scroll
 * lock and focus return are all already paid for. Three regions, as §7 asks:
 * the camera frame, the reference beside it, the findings underneath.
 *
 * **The findings are `FindingRow`.** Not a condensed copy of it — the actual
 * G-05 component, reading the actual `Finding` objects the agent panel behind
 * the modal is reading. §7 says the detections in here use the same central
 * state; the strongest possible way to keep that true is for there to be one
 * component, so a change to how a finding reads cannot land in one place and
 * not the other. `Show me` in here runs `show_correction` — the same tool — so
 * the workbench canvas moves too, and closing the modal leaves you looking at
 * what you were just shown.
 *
 * **Two transforms, not three.** The camera pane is a real `CanvasViewport`
 * with its own handle, because the agent has to be able to take it to a pin.
 * The reference beside it is a fixed `viewBox` — a reference view is a thing
 * you compare against, not one you fly around in, and a third pannable canvas
 * on screen at one time is a third thing to keep in step with the other two.
 *
 * **The reference is cropped to the disagreement.** Drawing the whole board at
 * 380px would be a picture of nothing at all: 0.3× scale, no readable pin
 * names. So it takes the same focus box the agent uses to point at the finding
 * — the reference is of *this*, and it is the only view in the product where
 * the correct answer is drawn beside the wrong one at the same magnification.
 */

/**
 * Above this the camera is no longer looking at a scene, it is looking at a
 * pin, and the detection boxes stop being annotations of a picture.
 */
const OVERLAY_MAX_SCALE = 1.5;

/** The correct build, framed on whatever the finding is about. */
function ReferenceView({
  reference,
  finding,
  label,
}: {
  reference: CircuitScene;
  finding?: Finding;
  label: string;
}) {
  const box = finding
    ? boundsOf(
        finding.focus.nodes.map((id) => node(reference, id)),
        finding.focus.padding,
      )
    : null;
  const frame = box ?? {
    x: 0,
    y: 0,
    width: sceneBox.width,
    height: sceneBox.height,
  };

  return (
    <div className="bg-surface-sunken layer-sunken min-h-0 flex-1 overflow-hidden rounded-lg">
      <svg
        role="img"
        aria-label={label}
        viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`}
        className="block h-full w-full"
      >
        <CircuitSceneView scene={reference} showLabels />
      </svg>
    </div>
  );
}

export function InspectionModal({
  open,
  onClose,
  scene,
  reference,
  findings,
  highlight,
  highlighted,
  camera,
  cameraVariant,
  capturedAt,
  onShow,
  onResolve,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  /** What is on the bench. */
  scene: CircuitScene;
  /** What the sketch defines, both faults corrected. */
  reference: CircuitScene;
  findings: Finding[];
  highlight?: Highlight;
  /** The finding the agent is pointing at, if any. Frames the reference. */
  highlighted?: Finding | null;
  /** The camera pane's own handle — see the note above about two transforms. */
  camera: RefObject<CanvasHandle | null>;
  cameraVariant: CameraVariant;
  capturedAt: string;
  onShow: (id: FindingId) => void;
  onResolve: (id: FindingId) => void;
  busy?: boolean;
}) {
  const copy = useCopy();
  const [cameraScale, setCameraScale] = useState(1);

  const open_ = findings.filter((finding) => !isResolved(finding, scene));
  const servoOff = scene.mechanical.servoAngle !== scene.mechanical.expectedAngle;

  /* Every terminal the open findings name, so the vision result boxes exactly
     what the inspection is talking about and nothing else. */
  const detected = open_.flatMap((finding) => finding.affectedNodes);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={copy.inspection.title}
      description={copy.build.project}
    >
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* No fixed height: the frame stretches to whatever the column beside
            it needs, so the two panes are always the same size and the camera
            gets every pixel the comparison does not. */}
        <CameraFrame
          variant={cameraVariant}
          capturedAt={capturedAt}
          className="min-h-[300px]"
        >
          <CanvasViewport
            ref={camera}
            ariaLabel={copy.inspection.cameraFrame}
            /* The mat, not the whole bench: a vision result should open on
               the build rather than on the half-metre of oak around it. */
            initialView={matBox}
            onScaleChange={setCameraScale}
            className="h-full"
          >
            <CircuitSceneView
              scene={scene}
              showLabels
              highlight={highlight}
            />
            {/* The vision result annotates a *frame*. Once the agent takes the
                camera down to two pins the boxes are a room away and their
                labels, drawn in scene units, are forty pixels tall over the
                callout — and the callout, the wrong-pin disc and the target
                ring are already saying the same thing at that distance. So the
                overlay belongs to the framing, and hands over when the framing
                stops being one. */}
            {cameraScale <= OVERLAY_MAX_SCALE ? (
              <VisionOverlay nodes={detected} />
            ) : null}
          </CanvasViewport>
        </CameraFrame>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex min-h-[200px] flex-1 flex-col">
            <p className="text-overline text-ink-tertiary mb-2 uppercase">
              {copy.inspection.referenceView}
            </p>
            <ReferenceView
              reference={reference}
              finding={highlighted ?? open_[0]}
              label={copy.inspection.referenceView}
            />
          </div>

          {/* Only when there is an angle to compare. A comparator showing two
              horns in the same place would be answering a question nobody
              asked. */}
          {servoOff ? <HornAngleCompare scene={scene} /> : null}
        </div>
      </div>

      <Divider className="my-4" />

      <section aria-label={copy.inspection.findingsSummary}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-overline text-ink-tertiary uppercase">
            {copy.inspection.findingsSummary}
          </p>
          <span className="text-caption text-ink-tertiary">
            {copy.findings.openCount(open_.length)}
          </span>
        </div>

        {findings.length ? (
          <AlertStack className="mt-1">
            {findings.map((finding) => (
              <FindingRow
                key={finding.id}
                finding={finding}
                resolved={isResolved(finding, scene)}
                onShow={busy ? undefined : () => onShow(finding.id)}
                onResolve={busy ? undefined : () => onResolve(finding.id)}
              />
            ))}
          </AlertStack>
        ) : (
          <EmptyState
            className="py-6"
            title={copy.agentPanel.noFindings}
            description={copy.agentPanel.noFindingsHint}
          />
        )}
      </section>
    </Modal>
  );
}
