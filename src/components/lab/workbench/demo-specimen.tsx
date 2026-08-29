"use client";

import { ActivityTimeline } from "@/components/agent/activity";
import { useAgentSession } from "@/components/agent/use-agent-session";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { ToastViewport } from "@/components/ui/status";
import { DemoControls } from "@/components/workbench/demo-menu";
import { demoScenarios } from "@/components/workbench/demo-scenarios";
import { StepRail } from "@/components/workbench/step-rail";
import { useCopy } from "@/content/copy-provider";
import { stepParts } from "@/lib/agent/parts";

/**
 * W-10 · the nine, on their own session.
 *
 * No canvas here on purpose: the point of this section is that every item is a
 * real tool call, and the place that is visible is the timeline. The focus
 * effects a couple of them emit have no canvas to move, which is harmless —
 * effects are data, and an applier with nothing to apply them to does nothing.
 */
export function DemoSpecimen() {
  const copy = useCopy();
  const t = copy.lab.workbenchLab.demo;
  const session = useAgentSession();

  return (
    <>
      <LabBlock title={t.liveTitle} note={t.liveNote}>
        <LabStage className="p-0">
          <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <span className="text-body-sm text-ink font-medium">
              {copy.demo.controls}
            </span>
            <DemoControls
              scenarios={demoScenarios(session, copy)}
              busy={session.busy}
            />
          </div>

          <div className="grid gap-0 sm:grid-cols-[252px_1fr]">
            <StepRail
              steps={session.steps}
              parts={stepParts(session.scene, session.step.id)}
              className="h-[380px] border-0 border-r"
            />
            <div className="h-[380px] overflow-y-auto px-4 py-3">
              <ActivityTimeline entries={session.state.activity} />
            </div>
          </div>
        </LabStage>

        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {t.groupNote}
        </p>
        <p className="text-caption text-ink-tertiary mt-2 max-w-prose">
          {t.injectNote}
        </p>
      </LabBlock>

      <ToastViewport toasts={session.toasts} onDismiss={session.dismissToast} />
    </>
  );
}
