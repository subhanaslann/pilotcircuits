"use client";

import { CircuitSceneView } from "@/components/canvas/circuit-scene";
import { LabBlock } from "@/components/lab/lab-primitives";
import {
  CameraFrame,
  VisionOverlay,
  type CameraVariant,
} from "@/components/workbench/camera";
import { useCopy } from "@/content/copy-provider";
import { deriveFindings } from "@/lib/agent/findings";
import { scene as sceneBox } from "@/lib/circuit/geometry";
import { smartParkingBarrier } from "@/lib/circuit/smart-parking-barrier";

/**
 * W-06 · The open decision.
 *
 * Identical content in both frames — the same scene, the same finding, the
 * same detection boxes — so the only thing being compared is the framing.
 *
 * The findings are derived at module scope from the shipped scene rather than
 * hand-written, so the boxes here are the boxes an inspection actually draws.
 * `foundAt` is `0`: nothing on this page reads the clock.
 */
const findings = deriveFindings(smartParkingBarrier, "current_step", "sensor", 0);
const detected = findings.flatMap((finding) => finding.affectedNodes);
const highlight = findings[0]?.highlight;

/**
 * One framing, with the finding already in it.
 *
 * Exported because the open-decisions desk (`/lab/decisions`) shows the same
 * pair beside the other two open questions. One specimen, two pages — the
 * alternative is two specimens that can quietly stop being the same test.
 */
export function CameraDirection({ variant }: { variant: CameraVariant }) {
  const copy = useCopy();

  return (
    <CameraFrame variant={variant} capturedAt="14:32">
      <div className="aspect-[1200/820] w-full">
        <svg
          role="img"
          aria-label={copy.inspection.cameraFrame}
          viewBox={`0 0 ${sceneBox.width} ${sceneBox.height}`}
          className="block h-full w-full"
        >
          <CircuitSceneView
            scene={smartParkingBarrier}
            showLabels
            highlight={highlight}
          />
          <VisionOverlay nodes={detected} />
        </svg>
      </div>
    </CameraFrame>
  );
}

export function CameraDirections() {
  const copy = useCopy();
  const t = copy.lab.workbenchLab.camera;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <LabBlock title={t.captureTitle} note={t.captureNote}>
          <CameraDirection variant="capture" />
        </LabBlock>
        <LabBlock title={t.plateTitle} note={t.plateNote}>
          <CameraDirection variant="plate" />
        </LabBlock>
      </div>

      <p className="text-body-sm text-ink-secondary mt-2 max-w-prose">
        {t.contentNote}
      </p>
      <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
        {t.overlayNote}
      </p>
    </>
  );
}
