"use client";

import type { ReactNode } from "react";
import { StatusChip } from "@/components/ui/badge";
import {
  BuildProgress,
  currentStepIndex,
  type BuildStep,
} from "@/components/ui/build-progress";
import { LocaleSelect } from "@/components/ui/locale-select";
import { BackHeader } from "@/components/ui/nav";
import { MonoValue } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";

/**
 * W-01 · Workbench topbar
 *
 * `BackHeader` (M-15) fed, not rewritten: one way back, the build's identity,
 * and the session's status pushed to the right at the fixed 64px the canvas
 * below depends on.
 *
 * The fraction is said **twice on purpose**, and it is the only thing in this
 * bar that is. `Step 3 of 7` is the sentence; the compact `BuildProgress`
 * beside it is the instrument — seven ticks you can count without reading, one
 * of which can turn amber under the agent. They are the same fact at two
 * reading distances, and they cannot disagree because the ticks and the number
 * are derived from one `BuildStep[]`.
 *
 * The three badges are the product's promise, not decoration. `Demo feed` and
 * `Board simulated` are §6.1's requirement that the interface never behaves as
 * though real hardware were attached, so they stay for the whole session.
 * `Agent connected` is the one that can change, and when it does it changes
 * glyph as well as word (rule 7) — absence is `WifiOff`, never `Wifi` greyed.
 *
 * The language switch sits with them, and it is here for the agent as much as
 * for the reader. The tools' titles, descriptions, argument sentences and
 * refusals are published in the reader's language and a locale change
 * re-registers all of them — so the bench, the one route where the tools are
 * used, was the one route with no way to change it: the shell nav that carries
 * `LocaleSelect` is not mounted here, and a judge deep-linked to
 * `/workbench/[slug]` met a Turkish vocabulary for English ids with no control
 * in sight. `bare`, as on the nameplate: two letters beside three chips, not a
 * fourth capsule. At `layout.workbenchMin` (1120 px) the bar has the title
 * truncating and `Board simulated` already folded below `xl`, so two letters
 * and a gap cost nothing the layout was not already paying.
 */
export function WorkbenchTopbar({
  project,
  backHref,
  steps,
  agentConnected = true,
  onSelectStep,
  demoMenu,
  className,
}: {
  project: string;
  backHref: string;
  steps: BuildStep[];
  agentConnected?: boolean;
  /** Jumping steps lives here, in one control (see `StepRail`). */
  onSelectStep?: (id: string) => void;
  /** W-10, passed in so the bar itself owns no demo behaviour. */
  demoMenu?: ReactNode;
  className?: string;
}) {
  const copy = useCopy();

  /* The same function the instrument beside it uses, which is the whole of the
     promise above: two readings of one fact cannot disagree if they are one
     line of code. They used to be two copies of a scan for "active or issue",
     and a fault left behind at step 4 made them both say 4 while the rail, the
     guidance panel and the foot stood on step 7. */
  const current = currentStepIndex(steps);

  return (
    <BackHeader
      className={className}
      backHref={backHref}
      backLabel={copy.workbench.back}
      title={project}
      meta={
        <>
          <MonoValue tone="quiet" className="hidden shrink-0 lg:inline">
            {copy.workbench.stepOf(
              current >= 0 ? current + 1 : steps.length,
              steps.length,
            )}
          </MonoValue>
          <BuildProgress
            compact
            steps={steps}
            onSelectStep={onSelectStep}
            className="shrink-0"
          />
        </>
      }
      actions={
        <>
          <LocaleSelect tone="bare" className="mr-1" />
          <StatusChip status="demoFeed">{copy.status.demoFeed}</StatusChip>
          <StatusChip status="boardSimulated" className="hidden xl:inline-flex">
            {copy.status.boardSimulated}
          </StatusChip>
          {agentConnected ? (
            <StatusChip status="agentConnected">
              {copy.status.agentConnected}
            </StatusChip>
          ) : (
            <StatusChip status="agentOffline">
              {copy.status.agentOffline}
            </StatusChip>
          )}
          {demoMenu}
        </>
      }
    />
  );
}
