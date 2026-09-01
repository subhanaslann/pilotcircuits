"use client";

import { useState } from "react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import {
  CoachingLevelSelector,
  Correction,
  GuidanceSummary,
  KnowledgeCheck,
  TeachingLadder,
} from "@/components/agent/guidance";
import { FindingRow } from "@/components/agent/finding";
import { PanelColumn } from "@/components/lab/agent/panel-column";
import { MonoValue } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import { deriveFindings, findingWords } from "@/lib/agent/findings";
import type { CoachingLevel } from "@/lib/agent/model";
import { stepAside, stepById, stepTotalFor, stepWords } from "@/lib/agent/steps";
import { smartParkingBarrier } from "@/lib/circuit/smart-parking-barrier";

const step = stepById("sensor");

export function GuidanceSpecimens() {
  const copy = useCopy();
  const t = copy.lab.agentLab.guidance;
  const echo = deriveFindings(smartParkingBarrier, "all", "sensor", 0)[0];
  const echoWords = findingWords(copy, echo);
  const words = stepWords(copy, step.id);
  const aside = stepAside(copy, step.id);
  const [level, setLevel] = useState<CoachingLevel>("hint");
  const [correctionOpen, setCorrectionOpen] = useState(true);

  return (
    <>
      <LabBlock title={t.summaryTitle} note={t.summaryNote}>
        <LabStage>
          <div className="flex flex-wrap items-start gap-8">
            <PanelColumn title={t.blocked}>
              <GuidanceSummary
                stepIndex={step.index}
                stepTotal={stepTotalFor(step.id)}
                stepName={words.name}
                context={copy.agentPanel.context.someMatch(5, 6)}
                connections={{ matched: 5, expected: 6 }}
                blocked
                aside={aside}
              />
            </PanelColumn>
            <PanelColumn title={t.clear}>
              <GuidanceSummary
                stepIndex={step.index}
                stepTotal={stepTotalFor(step.id)}
                stepName={words.name}
                context={copy.agentPanel.context.allMatch}
                connections={{ matched: 6, expected: 6 }}
              />
            </PanelColumn>
            <PanelColumn title={t.notInspected}>
              <div className="py-3">
                <CoachingLevelSelector value={level} onValueChange={setLevel} />
                <p className="text-caption text-ink-tertiary mt-3">
                  {t.thumbLead}
                  <MonoValue tone="quiet">show_correction</MonoValue>
                  {t.thumbMid}
                  <MonoValue tone="quiet">detail_level</MonoValue>
                  {t.thumbRest}
                </p>
              </div>
            </PanelColumn>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.ladderTitle} note={t.ladderNote}>
        <LabStage>
          <div className="flex flex-wrap items-start gap-8">
            {(["hint", "explain", "exact"] as const).map((rung) => (
              <PanelColumn key={rung} title={copy.agentPanel.coaching[rung]}>
                <div className="py-2">
                  <TeachingLadder
                    coaching={echoWords.coaching}
                    mono={echoWords.mono}
                    level={rung}
                  />
                </div>
              </PanelColumn>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.correctionTitle} note={t.correctionNote}>
        <LabStage>
          <PanelColumn title={t.correctionColumn}>
            <FindingRow
              finding={echo}
              correctionOpen={correctionOpen}
              correctionId="specimen-correction"
              onShow={() => setCorrectionOpen((open) => !open)}
            >
              {correctionOpen ? (
                <Correction
                  id="specimen-correction"
                  finding={echo}
                  level={level}
                  onLevelChange={setLevel}
                  aside={aside}
                />
              ) : null}
            </FindingRow>
          </PanelColumn>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.knowledgeTitle} note={t.knowledgeNote}>
        <LabStage>
          <PanelColumn title={t.knowledgeColumn}>
            <KnowledgeCheck projectId="smartParkingBarrier" />
          </PanelColumn>
        </LabStage>
      </LabBlock>
    </>
  );
}
