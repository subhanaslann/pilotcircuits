"use client";

import { LabBlock } from "@/components/lab/lab-primitives";
import { StepComponents, StepRail } from "@/components/workbench/step-rail";
import { useCopy } from "@/content/copy-provider";
import { stepParts } from "@/lib/agent/parts";
import { toProgressSteps } from "@/lib/agent/steps";
import { smartParkingBarrier } from "@/lib/circuit/smart-parking-barrier";

/**
 * W-02 · W-03
 *
 * The rail is shown standing on step 4 with step 3 still open, because that is
 * the arrangement the four words exist for: `Issue` behind you, `Active` where
 * you are.
 */
export function RailSpecimen() {
  const copy = useCopy();
  const t = copy.lab.workbenchLab.rail;

  const steps = toProgressSteps(copy, "servo", ["kit", "place"], ["sensor"]);
  const wiring = ["sensor", "servo", "leds"] as const;

  return (
    <>
      <LabBlock title={t.statesTitle} note={t.statesNote}>
        <div className="border-border shadow-e1 flex h-[430px] w-rail overflow-hidden rounded-lg border">
          <StepRail
            steps={steps}
            parts={stepParts(smartParkingBarrier, "servo")}
            className="flex-1 border-0"
          />
        </div>
        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {t.navigationNote}
        </p>
      </LabBlock>

      <LabBlock title={t.partsTitle} note={t.partsNote}>
        <div className="grid gap-4 sm:grid-cols-3">
          {wiring.map((id) => (
            <div
              key={id}
              className="border-border bg-surface shadow-e1 rounded-lg border p-4"
            >
              <p className="text-caption text-ink-secondary mb-2">
                {copy.build.steps[id].name}
              </p>
              <StepComponents parts={stepParts(smartParkingBarrier, id)} />
            </div>
          ))}
        </div>
      </LabBlock>
    </>
  );
}
