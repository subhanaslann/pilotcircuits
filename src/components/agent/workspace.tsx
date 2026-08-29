"use client";

import { AgentPanel, TabPanel } from "@/components/agent/panel";
import {
  CoachingLevelSelector,
  Correction,
  GuidanceSummary,
  KnowledgeCheck,
} from "@/components/agent/guidance";
import { FindingRow } from "@/components/agent/finding";
import { ActivityTimeline } from "@/components/agent/activity";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { AlertStack, EmptyState } from "@/components/ui/status";
import { Divider } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import { isResolved } from "@/lib/agent/findings";
import { stepAside, stepCount, stepWords } from "@/lib/agent/steps";
import { cn } from "@/lib/utils/cn";

/**
 * The agent panel, filled.
 *
 * G-01…G-15 were approved as materials in Batch 4 and then assembled twice: on
 * the lab's live-session page and, in Batch 7, in the workbench itself. Two
 * assemblies of one panel is two panels — the first time a tab gains a row or
 * an empty state changes its mind, only one of them gets it. So the assembly
 * lives here, in `agent/`, beside the parts it is made of, and both callers
 * hand it the same `useAgentSession`.
 *
 * What stays with the caller is the one thing that genuinely differs: the
 * suggested action in the pinned foot. The lab drives it from a page's script;
 * the workbench drives it from the step definition.
 */
export function AgentWorkspace({
  session,
  action,
  className,
}: {
  session: AgentSession;
  /** G-14 · the one control in the pinned foot. */
  action?: {
    id: string;
    label: string;
    onAction?: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  className?: string;
}) {
  const copy = useCopy();
  const { state, step, openFindings } = session;

  const matched = step.connections.length - openFindings.length;
  const inspected = state.findings.length > 0;
  const solved = inspected && openFindings.length === 0;

  return (
    <AgentPanel
      className={cn("min-h-0", className)}
      pulse={
        !state.webMcpAvailable
          ? "offline"
          : state.running
            ? "working"
            : "idle"
      }
      tool={state.running?.name}
      webMcpAvailable={state.webMcpAvailable}
      tab={state.tab}
      onTabChange={session.setTab}
      findingCount={openFindings.length}
      announcement={session.announcement}
      action={action}
    >
      <TabPanel
        active={state.tab === "guidance"}
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
              : openFindings.length
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
          blocked={openFindings.length > 0}
          aside={stepAside(copy, step.id)}
        />
        <Divider />
        <CoachingLevelSelector
          className="py-3"
          value={state.coaching}
          onValueChange={(level) =>
            session.act({ kind: "set-coaching", level })
          }
        />
        {solved ? <KnowledgeCheck /> : null}
      </TabPanel>

      <TabPanel
        active={state.tab === "findings"}
        tabsId="agent-panel"
        value="findings"
      >
        {state.findings.length ? (
          <AlertStack>
            {state.findings.map((finding) => {
              const open = state.highlightedFindingId === finding.id;
              return (
                <FindingRow
                  key={finding.id}
                  finding={finding}
                  resolved={isResolved(finding, state.scene)}
                  correctionOpen={open}
                  correctionId={`correction-${finding.id}`}
                  onShow={() =>
                    void session.run("show_correction", {
                      finding_id: finding.id,
                      detail_level: state.coaching,
                    })
                  }
                  onResolve={() =>
                    session.act({ kind: "resolve", findingId: finding.id })
                  }
                >
                  {open ? (
                    <Correction
                      id={`correction-${finding.id}`}
                      finding={finding}
                      level={state.coaching}
                      onLevelChange={(level) =>
                        void session.run("show_correction", {
                          finding_id: finding.id,
                          detail_level: level,
                        })
                      }
                    />
                  ) : null}
                </FindingRow>
              );
            })}
          </AlertStack>
        ) : (
          <EmptyState
            title={copy.agentPanel.noFindings}
            description={copy.agentPanel.noFindingsHint}
          />
        )}
      </TabPanel>

      <TabPanel
        active={state.tab === "activity"}
        tabsId="agent-panel"
        value="activity"
      >
        <ActivityTimeline entries={state.activity} />
      </TabPanel>
    </AgentPanel>
  );
}
