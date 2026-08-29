"use client";

import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { LiveWorkbench } from "@/components/lab/workbench/live-workbench";
import { SmallScreenNotice } from "@/components/workbench/frame";
import { useCopy } from "@/content/copy-provider";

/** W-11 · the folded layout, forced, and the notice on its own. */
export function SmallScreenSpecimen() {
  const copy = useCopy();
  const t = copy.lab.workbenchLab.small;

  return (
    <>
      <LabBlock note={t.noticeNote}>
        <LabStage>
          <SmallScreenNotice />
        </LabStage>
      </LabBlock>

      <LabBlock note={t.note}>
        <div className="border-border bg-app overflow-x-auto rounded-lg border p-4">
          <div className="w-[880px] shrink-0">
            <LiveWorkbench
              wide={false}
              className="border-border h-[620px] rounded-lg border"
            />
          </div>
        </div>
      </LabBlock>
    </>
  );
}
