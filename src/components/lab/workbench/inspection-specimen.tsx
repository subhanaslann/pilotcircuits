"use client";

import { useRef, useState } from "react";
import { Eye } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { useAgentSession } from "@/components/agent/use-agent-session";
import { type CanvasHandle } from "@/components/canvas/canvas-viewport";
import { Button } from "@/components/ui/button";
import { ToastViewport } from "@/components/ui/status";
import { HornAngleCompare } from "@/components/workbench/horn-angle";
import { InspectionModal } from "@/components/workbench/inspection";
import { useCopy } from "@/content/copy-provider";
import { clockOf } from "@/lib/agent/activity";
import { smartParkingBarrier } from "@/lib/circuit/smart-parking-barrier";
import {
  withEchoFixed,
  withServoRemounted,
} from "@/lib/circuit/smart-parking-barrier";
import { icon } from "@/lib/design/tokens";

const referenceScene = withServoRemounted(withEchoFixed(smartParkingBarrier));

/**
 * W-05 · W-08 · W-09
 *
 * The modal on its own session, so it can be opened without scrolling back up
 * to the workbench. `scope: "all"` rather than the step's own scope, because
 * both faults have to be on screen at once for the angle comparison to have
 * anything to compare.
 */
export function InspectionSpecimen() {
  const copy = useCopy();
  const t = copy.lab.workbenchLab.inspection;
  const camera = useRef<CanvasHandle>(null);
  const session = useAgentSession({ camera });

  const [open, setOpen] = useState(false);
  const [capturedAt, setCapturedAt] = useState("");

  const inspect = async () => {
    setCapturedAt(clockOf(Date.now()));
    setOpen(true);
    await session.run("inspect_build", { scope: "all" });
  };

  return (
    <>
      <LabBlock note={t.modalNote}>
        <LabStage className="flex flex-wrap items-center gap-4">
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Eye size={icon.sm} strokeWidth={icon.strokeWidth} />}
            onClick={() => void inspect()}
            disabled={session.busy}
          >
            {copy.workbench.inspect}
          </Button>
          <Button variant="quiet" size="sm" onClick={session.reset}>
            {copy.workbench.resetDemo}
          </Button>
        </LabStage>
        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {t.findingsNote}
        </p>
        <p className="text-caption text-ink-tertiary mt-2 max-w-prose">
          {t.transformNote}
        </p>
      </LabBlock>

      <LabBlock title={t.angleTitle} note={t.angleNote}>
        <LabStage>
          <HornAngleCompare
            scene={session.scene}
            className="mx-auto max-w-[420px]"
          />
        </LabStage>
      </LabBlock>

      <InspectionModal
        open={open}
        projectId={session.state.projectId}
        projectName={copy.build.project}
        onClose={() => setOpen(false)}
        scene={session.scene}
        reference={referenceScene}
        findings={session.state.findings}
        highlight={session.highlighted?.highlight}
        highlighted={session.highlighted}
        camera={camera}
        cameraVariant="plate"
        capturedAt={capturedAt}
        busy={session.busy}
        onShow={(id) =>
          void session.run("show_correction", { finding_id: id })
        }
        onCheck={(id) => session.act({ kind: "check", findingId: id })}
      />

      <ToastViewport toasts={session.toasts} onDismiss={session.dismissToast} />
    </>
  );
}
