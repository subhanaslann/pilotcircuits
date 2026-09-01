"use client";

import { AgentPanel, TabPanel } from "@/components/agent/panel";
import {
  CoachingLevelSelector,
  Correction,
  GuidanceSummary,
  KnowledgeCheck,
} from "@/components/agent/guidance";
import { StepChecklist } from "@/components/agent/checklist";
import { FindingRow } from "@/components/agent/finding";
import { ActivityTimeline } from "@/components/agent/activity";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { AlertStack, EmptyState } from "@/components/ui/status";
import { Divider } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import { buildFor } from "@/lib/agent/builds";
import { checklistFor } from "@/lib/agent/checklist";
import { isResolved } from "@/lib/agent/findings";
import { stepAside, stepTotalFor, stepWords } from "@/lib/agent/steps";
import type { AgentTool } from "@/lib/agent/model";
import { diff } from "@/lib/circuit/graph";
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
  tools,
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
  /**
   * G-15's list, for the screen this panel is actually standing on.
   *
   * Defaulted by `AgentPanel` to the bench's own seven, which is right for the
   * wide workbench and wrong for the narrow one: below the breakpoint the
   * canvas is unmounted and only four tools are registered, so `7 tools
   * available` was the panel counting a list the browser had never been handed.
   * `panel.tsx`'s own note says the count is a claim about the current page —
   * this is the prop that lets the page make it.
   */
  tools?: readonly AgentTool[];
  className?: string;
}) {
  const copy = useCopy();
  const { state, step, openFindings } = session;

  /* Asked of the graph, not counted off the findings list. One open finding
     was one unmatched connection only while every finding was about one; a
     stray is a finding with no expected connection behind it, so subtracting
     it undercounts the matches, and two strays on a two-wire step reported
     `0 of 2` on a step where both wires were right. */
  const matched = diff(state.scene, step.connections).matched;
  /**
   * Whether the agent has looked at **this step**.
   *
   * It used to be `findings.length > 0`, which is a claim about what was
   * *found* rather than about what was looked at — so an inspection that came
   * back clean left the panel printing "the agent has not looked at this step
   * yet" directly underneath a timeline entry saying it had. `inspectedStepId`
   * has existed for exactly this since the tool started writing it.
   */
  const inspected = state.inspectedStepId === step.id;
  const checklist = checklistFor(state);
  /**
   * Solved is a fact about the build, not about the list.
   *
   * `openFindings.length === 0` was a claim about what the agent had *noticed*,
   * and findings are only born on `inspect_build` — so a fault made after an
   * inspection left the panel printing "every expected connection for this step
   * matches" directly above a progress bar reading the live graph and saying
   * `1 of 2`. Two sentences, one screen, and one of them false. The list still
   * decides whether the agent has looked; the graph decides what is true.
   *
   * And a step has to HAVE something to solve. The opening step of every
   * assembled chapter owns no connections — `Check your kit` compares nothing —
   * so `matched === step.connections.length` was `0 === 0` and all three
   * conjuncts were vacuously true the moment anybody pressed `Inspect my
   * build`. The panel then printed "every expected connection for this step
   * matches" and put the chapter's FINAL comprehension question on screen over
   * a bench with four to twenty leads still in the box, on chapters one to
   * five, through the product's own primary action.
   */
  const solved =
    inspected &&
    step.connections.length > 0 &&
    openFindings.length === 0 &&
    matched === step.connections.length;

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
      tools={tools}
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
          stepTotal={stepTotalFor(step.id)}
          stepName={stepWords(copy, step.id).name}
          /* Four arms, and the fourth is the one the kit step needs. `Check
             your kit` owns no connections, so an inspection of it fell through
             to `allMatch` — "every expected connection for this step matches",
             said over a bench with everything still in the box. The sentence
             for that has been in the dictionary all along. */
          context={
            !inspected
              ? copy.agentPanel.context.notInspected
              : step.connections.length === 0
                ? copy.agentPanel.context.nothingToCheck
                : openFindings.length
                  ? copy.agentPanel.context.someMatch(
                      matched,
                      step.connections.length,
                    )
                  : copy.agentPanel.context.allMatch
          }
          /* The bar is gone from here: the checklist below is the same count
             with each item named, which is what rule 5 asks of a countable
             thing in the first place. Two drawings of one number, one of them
             mute, is the redundancy the panel could least afford. */
          blocked={openFindings.length > 0}
          aside={stepAside(copy, step.id)}
        />
        <StepChecklist
          className="border-border border-t"
          checklist={checklist}
          scene={state.scene}
        />
        <Divider />
        <CoachingLevelSelector
          className="py-3"
          value={state.coaching}
          onValueChange={(level) =>
            session.act({ kind: "set-coaching", level })
          }
        />
        {solved ? <KnowledgeCheck projectId={state.projectId} /> : null}
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
                  onCheck={() =>
                    session.act({ kind: "check", findingId: finding.id })
                  }
                  /* Only where there is nothing to drag — see `onSimulate`. */
                  onSimulate={
                    buildFor(state.projectId)?.placement
                      ? undefined
                      : () =>
                          session.act({ kind: "repair", findingId: finding.id })
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
