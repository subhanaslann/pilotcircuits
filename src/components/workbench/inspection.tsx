"use client";

import { useState, type RefObject } from "react";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { AgentMascotLayer } from "@/components/canvas/agent-mascot";
import { BuildSceneView } from "@/components/canvas/build-scene";
import { matBox } from "@/components/canvas/desk-surface";
import { FindingRow } from "@/components/agent/finding";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { AlertStack, EmptyState } from "@/components/ui/status";
import { Divider } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import { isResolved, type Finding, type FindingId } from "@/lib/agent/findings";
import { partBox, scene as sceneBox } from "@/lib/circuit/geometry";
import type { CircuitScene, Highlight } from "@/lib/circuit/graph";
import { boundsOf } from "@/lib/circuit/routing";
import { maybeNode } from "@/lib/circuit/graph";
import { buildFor } from "@/lib/agent/builds";
import type { ProjectId } from "@/lib/projects/catalog";
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
  projectId,
  reference,
  finding,
  label,
}: {
  projectId: ProjectId;
  reference: CircuitScene;
  finding?: Finding;
  label: string;
}) {
  /* A finding can name a terminal the reference has not got — a part still in
     the kit has no pins on the bench. Framing falls back to the whole scene
     rather than throwing inside a render. */
  const box = finding
    ? boundsOf(
        finding.focus.nodes
          .map((id) => maybeNode(reference, id))
          .filter((n) => n !== undefined),
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
        <BuildSceneView projectId={projectId} scene={reference} showLabels />
      </svg>
    </div>
  );
}

export function InspectionModal({
  open,
  onClose,
  projectId,
  projectName,
  scene,
  reference,
  findings,
  highlight,
  highlighted,
  camera,
  cameraVariant,
  capturedAt,
  onShow,
  onCheck,
  onSimulate,
  continueAction,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Which build is on the bench — decides which view draws it. */
  projectId: ProjectId;
  /** The build being inspected — named in the modal's own subtitle. */
  projectName: string;
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
  /** `Check this`. A read — the modal cannot write a fix either. */
  onCheck: (id: FindingId) => void;
  /** `Move it for me`, on a bench the person cannot assemble. Absent otherwise. */
  onSimulate?: (id: FindingId) => void;
  /**
   * The way on, which the close button in the corner is not.
   *
   * A window that has just told somebody what the agent found and offers only
   * an X is a dead end: whatever comes next — verify the step, go back and
   * place the part — is behind it, and the person has to work out for
   * themselves that dismissing this is how they get there. It is the same one
   * action the panel's pinned foot carries, handed in rather than worked out
   * again here, so the two cannot end up proposing different next moves.
   */
  continueAction?: {
    label: string;
    onAction: () => void;
    loading?: boolean;
  };
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
      description={projectName}
      /* One control, for the same reason the agent panel's foot has one: the
         action the agent is proposing stops meaning anything once there are
         two of them. Dismissing without acting is still there, in the corner
         and on Escape, where dismissal belongs. */
      footer={
        continueAction ? (
          <Button
            variant="primary"
            size="md"
            loading={continueAction.loading}
            onClick={continueAction.onAction}
          >
            {continueAction.label}
          </Button>
        ) : undefined
      }
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
            <BuildSceneView
              projectId={projectId}
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
              <VisionOverlay
                nodes={detected}
                /* Read off the scene in the frame, never off the finished
                   build. Chapter one's parts move now, so the boxes taken once
                   from `breathingLamp` annotated where a part *would* be if the
                   build were done — a detection bracket six pitches from the
                   LED, over empty desk, claiming the vision saw a part that is
                   not there. A build's own `boxesFor` omits a part with no path
                   to a hole, so one still in the kit correctly gets no bracket.

                   Asked of the registry rather than of a name: this was
                   `projectId === "breathingLamp" ? …`, which is the third copy
                   of "which build is this" the modal has carried, and the last
                   two both went stale. `partBox` stays the answer for the
                   capstone, whose parts do not move and whose row therefore
                   owns no `boxesFor`. */
                boxes={buildFor(projectId)?.boxesFor?.(scene) ?? partBox}
                /* Keyed by the build's own part names, so the overlay needs
                   the build's own vocabulary to turn a lead into one. */
                spec={buildFor(projectId)?.placement}
              />
            ) : null}
          </CanvasViewport>
          {/* The same flight, seen from the camera. A sibling of the viewport
              inside the frame's own `relative` box, so it lies exactly over
              the picture; scene anchors resolve through THIS pane's handle,
              and the shelf and the lamp — which the camera has not got —
              resolve to its corner. Not `primary`: the bench's layer is where
              the ring is, and this is a view of it. */}
          <AgentMascotLayer canvas={camera} screenFallback="corner" />
        </CameraFrame>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex min-h-[200px] flex-1 flex-col">
            <p className="text-overline text-ink-tertiary mb-2 uppercase">
              {copy.inspection.referenceView}
            </p>
            <ReferenceView
              projectId={projectId}
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
                onCheck={busy ? undefined : () => onCheck(finding.id)}
                onSimulate={
                  onSimulate && !busy
                    ? () => onSimulate(finding.id)
                    : undefined
                }
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
