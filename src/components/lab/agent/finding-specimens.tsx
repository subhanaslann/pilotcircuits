"use client";

import { useState } from "react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import {
  AffectedNodeChip,
  EvidenceLine,
  FindingRow,
} from "@/components/agent/finding";
import { SeverityPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { AlertStack, EmptyState } from "@/components/ui/status";
import { Sentence } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import {
  deriveFindings,
  findingWords,
  type Finding,
} from "@/lib/agent/findings";
import { smartParkingBarrier } from "@/lib/circuit/smart-parking-barrier";
import { PanelColumn } from "@/components/lab/agent/panel-column";

/* ------------------------------------------------ The direction to decide */

function EditorialDirection({ findings }: { findings: Finding[] }) {
  return (
    <AlertStack>
      {findings.map((finding) => (
        <FindingRow
          key={finding.id}
          finding={finding}
          onShow={() => {}}
          onResolve={() => {}}
        />
      ))}
    </AlertStack>
  );
}

function CardDirection({ findings }: { findings: Finding[] }) {
  const copy = useCopy();

  return (
    <div className="space-y-3 py-1">
      {findings.map((finding) => {
        const words = findingWords(copy, finding);

        return (
          <Card key={finding.id} tone="warning">
            <CardHeader
              title={words.title}
              meta={<EvidenceLine evidence={finding.evidence} />}
              action={<SeverityPill severity={finding.severity} />}
            />
            <Sentence
              className="text-body-sm text-ink-secondary mt-2.5 block"
              text={words.explanation}
              mono={words.mono}
            />
            {words.nodes.length ? (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {words.nodes.map((node) => (
                  <AffectedNodeChip key={node.id} node={node} />
                ))}
              </div>
            ) : null}
            <CardFooter>
              <Button variant="secondary" size="sm">
                {words.actions.show}
              </Button>
              <Button variant="tertiary" size="sm">
                {words.actions.resolve}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

export function FindingSpecimens() {
  const copy = useCopy();
  const t = copy.lab.agentLab.findings;
  /* Derived from the real graph rather than written out, so the specimens
     cannot drift from what the agent will actually say — in either language. */
  const findings = deriveFindings(smartParkingBarrier, "all", "sensor", 0);
  const [resolved, setResolved] = useState(false);

  return (
    <>
      <LabBlock title={t.registerTitle} note={t.registerNote}>
        <LabStage>
          <div className="flex flex-wrap gap-8">
            <PanelColumn title={t.editorial}>
              <EditorialDirection findings={findings} />
            </PanelColumn>
            <PanelColumn title={t.card}>
              <CardDirection findings={findings} />
            </PanelColumn>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.statesTitle} note={t.statesNote}>
        <LabStage>
          <div className="flex flex-wrap items-start gap-8">
            <PanelColumn title={t.openResolved}>
              <FindingRow
                finding={findings[0]}
                resolved={resolved}
                onShow={() => {}}
                onResolve={() => setResolved(true)}
              />
            </PanelColumn>
            <PanelColumn title={t.nothingOpen}>
              <EmptyState
                title={copy.agentPanel.noFindings}
                description={copy.agentPanel.noFindingsHint}
                action={
                  <Button variant="secondary" size="sm">
                    {copy.workbench.inspect}
                  </Button>
                }
              />
            </PanelColumn>
          </div>
          <div className="mt-4">
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setResolved(false)}
            >
              {copy.workbench.resetDemo}
            </Button>
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
