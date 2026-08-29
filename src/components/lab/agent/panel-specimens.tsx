"use client";

import { useState } from "react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import {
  AgentPanel,
  TabPanel,
  ToolInventory,
  WebMcpNotice,
  type AgentTab,
} from "@/components/agent/panel";
import { Correction, GuidanceSummary } from "@/components/agent/guidance";
import {
  CoachingLevelSelector,
  KnowledgeCheck,
} from "@/components/agent/guidance";
import { FindingRow } from "@/components/agent/finding";
import { ActivityTimeline } from "@/components/agent/activity";
import { PanelColumn } from "@/components/lab/agent/panel-column";
import { sampleActivity } from "@/components/lab/agent/activity-specimens";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/choice";
import { AlertStack, EmptyState } from "@/components/ui/status";
import { Divider } from "@/components/ui/text";
import type { PulseState } from "@/components/ui/feedback";
import { useCopy } from "@/content/copy-provider";
import { deriveFindings, isResolved, type Finding } from "@/lib/agent/findings";
import type { CoachingLevel } from "@/lib/agent/model";
import { stepAside, stepById, stepCount, stepWords } from "@/lib/agent/steps";
import { applyExpected } from "@/lib/circuit/graph";
import { smartParkingBarrier } from "@/lib/circuit/smart-parking-barrier";

const step = stepById("sensor");

/**
 * The assembled panel. Not the live agent session yet — that lands with the
 * services — but every material in its real place, at its real width, driven by
 * the same derivation the tools will use.
 */
export function PanelSpecimens() {
  const copy = useCopy();
  const t = copy.lab.agentLab.panel;
  const [tab, setTab] = useState<AgentTab>("guidance");
  const [level, setLevel] = useState<CoachingLevel>("hint");
  const [openCorrection, setOpenCorrection] = useState<string | null>(null);
  const [fixed, setFixed] = useState(false);
  const [pulse, setPulse] = useState<PulseState>("idle");

  const scene = fixed
    ? applyExpected(smartParkingBarrier, "c.sensor.echo")
    : smartParkingBarrier;

  /**
   * The scene is what is true; findings are what the agent noticed. So they are
   * held from the moment of the inspection rather than re-derived every render —
   * otherwise fixing the wire would delete the finding instead of resolving it,
   * and a row that vanishes on click is a change the user never saw happen.
   */
  const [known, setKnown] = useState<Finding[]>(() =>
    deriveFindings(smartParkingBarrier, "current_step", "sensor", 0),
  );

  const open = known.filter((finding) => !isResolved(finding, scene));
  const inspected = known.length > 0;
  const matched = step.connections.length - open.length;

  return (
    <>
      <LabBlock title={t.title} note={t.note}>
        <LabStage>
          <div className="flex flex-wrap items-start gap-8">
            <PanelColumn title={t.assembled} padded={false}>
              <AgentPanel
                className="h-[560px]"
                pulse={pulse}
                tool={pulse === "working" ? "inspect_build" : undefined}
                webMcpAvailable={pulse !== "offline"}
                tab={tab}
                onTabChange={setTab}
                findingCount={open.length}
                action={
                  open.length
                    ? {
                        id: "verify",
                        label: copy.workbench.verify,
                        loading: pulse === "working",
                      }
                    : {
                        id: "inspect",
                        label: copy.workbench.inspect,
                        loading: pulse === "working",
                      }
                }
              >
                <TabPanel
                  active={tab === "guidance"}
                  tabsId="agent-panel"
                  value="guidance"
                >
                  <GuidanceSummary
                    stepIndex={step.index}
                    stepTotal={stepCount}
                    stepName={stepWords(copy, step.id).name}
                    context={
                      !inspected
                        ? copy.agentPanel.context.notInspected
                        : open.length
                          ? copy.agentPanel.context.someMatch(
                              matched,
                              step.connections.length,
                            )
                          : copy.agentPanel.context.allMatch
                    }
                    connections={
                      inspected
                        ? { matched, expected: step.connections.length }
                        : undefined
                    }
                    blocked={open.length > 0}
                    aside={stepAside(copy, step.id)}
                  />
                  <Divider />
                  <CoachingLevelSelector
                    className="py-3"
                    value={level}
                    onValueChange={setLevel}
                  />
                  {!open.length && inspected ? <KnowledgeCheck /> : null}
                </TabPanel>

                <TabPanel
                  active={tab === "findings"}
                  tabsId="agent-panel"
                  value="findings"
                >
                  {known.length ? (
                    <AlertStack>
                      {known.map((finding) => (
                        <FindingRow
                          key={finding.id}
                          finding={finding}
                          resolved={isResolved(finding, scene)}
                          correctionOpen={openCorrection === finding.id}
                          correctionId={`correction-${finding.id}`}
                          onShow={() =>
                            setOpenCorrection((current) =>
                              current === finding.id ? null : finding.id,
                            )
                          }
                          onResolve={() => setFixed(true)}
                        >
                          {openCorrection === finding.id ? (
                            <Correction
                              id={`correction-${finding.id}`}
                              finding={finding}
                              level={level}
                              onLevelChange={setLevel}
                            />
                          ) : null}
                        </FindingRow>
                      ))}
                    </AlertStack>
                  ) : (
                    <EmptyState
                      title={copy.agentPanel.noFindings}
                      description={copy.agentPanel.noFindingsHint}
                    />
                  )}
                </TabPanel>

                <TabPanel
                  active={tab === "activity"}
                  tabsId="agent-panel"
                  value="activity"
                >
                  <ActivityTimeline
                    entries={sampleActivity}
                  />
                </TabPanel>
              </AgentPanel>
            </PanelColumn>

            <div className="min-w-[240px] flex-1">
              <p className="text-overline text-ink-tertiary mb-2 uppercase">
                {t.drive}
              </p>
              <div className="space-y-4">
                <SegmentedControl<PulseState>
                  size="sm"
                  label={t.agentState}
                  value={pulse}
                  onValueChange={setPulse}
                  options={[
                    { value: "idle", label: t.idle },
                    { value: "working", label: t.working },
                    { value: "offline", label: t.offline },
                  ]}
                />
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setKnown(
                        inspected
                          ? []
                          : deriveFindings(scene, "current_step", "sensor", 0),
                      )
                    }
                  >
                    {inspected ? t.forget : copy.workbench.inspect}
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      setFixed(false);
                      setKnown(
                        deriveFindings(
                          smartParkingBarrier,
                          "current_step",
                          "sensor",
                          0,
                        ),
                      );
                      setOpenCorrection(null);
                      setLevel("hint");
                      setPulse("idle");
                      setTab("guidance");
                    }}
                  >
                    {copy.workbench.resetDemo}
                  </Button>
                </div>
                <p className="text-caption text-ink-tertiary max-w-prose">
                  {t.noticedLead}
                  <em>{t.noticedEmphasis}</em>
                  {t.noticedRest}
                </p>
              </div>
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.headerTitle} note={t.headerNote}>
        <LabStage>
          <div className="flex flex-wrap items-start gap-8">
            <PanelColumn title={t.toolInventory}>
              <div className="py-3">
                <ToolInventory />
              </div>
            </PanelColumn>
            <PanelColumn title={t.webMcpUnavailable}>
              <WebMcpNotice />
            </PanelColumn>
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
