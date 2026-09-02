"use client";

import { useState } from "react";
import { CoachCorner } from "@/components/agent/coach-corner";
import {
  CoachFigure,
  coachSilhouettes,
  defaultSilhouette,
  type CoachSilhouette,
} from "@/components/agent/coach-figure";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { SegmentedControl } from "@/components/ui/choice";
import { useCopy } from "@/content/copy-provider";
import { coachMoods, type CoachMood } from "@/lib/agent/coach";
import { toolAct, toolActs, type ToolAct } from "@/lib/agent/model";
import { allTools } from "@/lib/agent/tools";

/**
 * G-16 · The coach figure, laid out to be chosen from.
 *
 * Three silhouettes side by side first, because the silhouette is the whole
 * decision and the rest is shared. Then every mood of the chosen one, each
 * beside the shipping sentence for it and the tools that put the face there,
 * so a wrong expression is caught against the words it will stand next to.
 * Last, the two grounds it stands on, at the size it stands at.
 *
 * The shelf colours are the kit strip's own (`kit-strip.tsx`), copied here
 * rather than imported because a specimen of a shelf is not a shelf: nothing
 * on it can be picked up.
 */

const SHELF = "border-[#4E5C66] bg-[#333E46]";

/** Which tools wear each face. The phases, for the one mood that is a phase. */
function whoWearsIt(mood: CoachMood): string | null {
  if ((toolActs as readonly string[]).includes(mood)) {
    return allTools.filter((tool) => toolAct[tool] === (mood as ToolAct)).join(" · ");
  }
  if (mood === "thinking") {
    return "comparingSketch · comparingExpected · checkingAlignment";
  }
  return null;
}

export function CoachSpecimens() {
  const copy = useCopy();
  const t = copy.lab.agentLab.coach;
  const [silhouette, setSilhouette] = useState<CoachSilhouette>(defaultSilhouette);

  return (
    <>
      <LabBlock title={t.silhouettesTitle} note={t.silhouettesNote}>
        <LabStage className={SHELF}>
          <div className="flex flex-wrap items-end justify-around gap-8 py-2">
            {coachSilhouettes.map((s) => (
              <figure key={s} className="flex flex-col items-center gap-3">
                <CoachFigure mood="idle" silhouette={s} size={120} />
                <figcaption className="text-caption text-[#B4C0C9]">
                  {t.silhouettes[s]}
                </figcaption>
              </figure>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.moodsTitle} note={t.moodsNote}>
        <SegmentedControl<CoachSilhouette>
          size="sm"
          label={t.silhouette}
          value={silhouette}
          onValueChange={setSilhouette}
          className="mb-3"
          options={coachSilhouettes.map((s) => ({
            value: s,
            label: t.silhouettes[s],
          }))}
        />
        <LabStage className={SHELF}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-3">
            {coachMoods.map((mood) => {
              const wearers = whoWearsIt(mood);
              return (
                <div key={mood} className="flex items-center gap-3">
                  <CoachFigure mood={mood} silhouette={silhouette} size={64} />
                  <div className="min-w-0">
                    <p className="text-body-sm leading-tight font-medium text-[#E6ECF0]">
                      {copy.agentPanel.coach[mood]}
                    </p>
                    <p className="text-mono-sm mt-0.5 font-mono text-[#B4C0C9]">
                      {mood}
                    </p>
                    {wearers ? (
                      <p className="text-mono-sm mt-0.5 font-mono break-words text-[#8E9BA5]">
                        {wearers}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.inPlaceTitle} note={t.inPlaceNote}>
        <LabStage className="overflow-hidden p-0">
          <div
            className={`flex items-center gap-5 border-b px-4 ${SHELF}`}
            style={{ height: 94 }}
          >
            <span className="text-overline shrink-0 text-[#B4C0C9] uppercase">
              {copy.workbench.kit.tray}
            </span>
            <div className="flex-1" />
            <CoachCorner
              mood="thinking"
              silhouette={silhouette}
              line={copy.agentPanel.coach.thinking}
              detail={copy.agentPanel.phases.comparingSketch}
            />
          </div>
          <div className="relative h-44" style={{ background: "var(--color-mat)" }}>
            <CoachCorner
              ground="mat"
              mood="touching"
              silhouette={silhouette}
              line={copy.agentPanel.coach.touching}
              detail={copy.agentPanel.phases.carrying}
              className="absolute top-3 right-3"
            />
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
