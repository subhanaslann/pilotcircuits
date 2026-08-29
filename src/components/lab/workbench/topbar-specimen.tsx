"use client";

import { LabBlock } from "@/components/lab/lab-primitives";
import { DemoControls } from "@/components/workbench/demo-menu";
import { WorkbenchTopbar } from "@/components/workbench/topbar";
import { useCopy } from "@/content/copy-provider";
import { toProgressSteps } from "@/lib/agent/steps";

/** W-01 · the bar in both of the states a session can put it in. */
export function TopbarSpecimen() {
  const copy = useCopy();
  const t = copy.lab.workbenchLab.topbar;

  const calm = toProgressSteps(copy, "sensor", ["kit", "place"], []);
  const blocked = toProgressSteps(copy, "sensor", ["kit", "place"], ["sensor"]);

  return (
    <LabBlock title={t.stateTitle} note={t.stateNote}>
      <div className="border-border shadow-e1 overflow-hidden rounded-lg border">
        <WorkbenchTopbar
          project={copy.build.project}
          backHref="/lab/library"
          steps={calm}
          demoMenu={<DemoControls scenarios={[]} />}
        />
        <WorkbenchTopbar
          project={copy.build.project}
          backHref="/lab/library"
          steps={blocked}
          agentConnected={false}
          className="border-b-0"
          demoMenu={<DemoControls scenarios={[]} />}
        />
      </div>
      <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
        {t.demoNote}
      </p>
    </LabBlock>
  );
}
