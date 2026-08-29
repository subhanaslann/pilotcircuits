"use client";

import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import {
  ActivityTimeline,
  DeveloperDetails,
  ToolBadge,
} from "@/components/agent/activity";
import { PanelColumn } from "@/components/lab/agent/panel-column";
import { useCopy } from "@/content/copy-provider";
import type { ActivityEntry } from "@/lib/agent/activity";
import { say } from "@/lib/agent/line";
import { workbenchTools } from "@/lib/agent/model";

/**
 * Fixed clocks and durations rather than `Date.now()`: a specimen that changes
 * every reload cannot be compared with the last screenshot, and a timestamp
 * formatted at render splits between server and client. Tool names, argument
 * summaries and results stay as they are in every language — they are what the
 * machine says.
 *
 * The sentences are the shipping ones, carried as `Line`s exactly as the
 * running session carries them. The lab used to keep its own copy of these
 * eleven strings; a specimen written in different words from the product is a
 * specimen of something the product does not do.
 */
export const sampleActivity: ActivityEntry[] = [
  {
    id: "act-1",
    actor: "agent",
    headline: { ns: "activity", k: "readContext" },
    status: "ok",
    time: "14:31",
    call: {
      id: "call-1",
      name: "get_build_context",
      args: {},
      argsSummary: "",
      status: "ok",
      startedAt: 0,
      durationMs: 180,
      result: {
        project: "Smart Parking Barrier",
        activeStep: "sensor",
        observed: 11,
        expected: 11,
        source: "demo",
      },
    },
  },
  {
    id: "act-2",
    actor: "agent",
    headline: { ns: "activity", k: "inspecting", args: [3] },
    status: "ok",
    time: "14:31",
    call: {
      id: "call-2",
      name: "inspect_build",
      args: { scope: "current_step" },
      argsSummary: "scope: current_step",
      status: "ok",
      startedAt: 0,
      durationMs: 240,
      result: {
        scope: "current_step",
        findings: [
          {
            id: "finding:wiring:c.sensor.echo",
            type: "connection-mismatch",
            severity: "warning",
            subject: "Echo",
            expected: "D7",
            observed: "D6",
          },
        ],
        source: "demo",
      },
    },
  },
  {
    id: "act-3",
    actor: "agent",
    headline: { ns: "activity", k: "mismatchFound", args: [1] },
    status: "ok",
    tone: "found",
    time: "14:31",
  },
  {
    id: "act-4",
    actor: "agent",
    headline: { ns: "activity", k: "showingCorrection" },
    outcome: { ns: "activity", k: "correctionHighlighted" },
    status: "ok",
    time: "14:32",
    call: {
      id: "call-3",
      name: "show_correction",
      args: {
        finding_id: "finding:wiring:c.sensor.echo",
        detail_level: "hint",
      },
      argsSummary: "finding: c.sensor.echo · detail: hint",
      status: "ok",
      startedAt: 0,
      durationMs: 96,
      result: { focused: ["board.D6", "board.D7"], detailLevel: "hint" },
    },
  },
  {
    id: "act-5",
    actor: "user",
    headline: { ns: "user", k: "movedWire", args: ["Echo", "D7"] },
    status: "ok",
    time: "14:33",
  },
  {
    id: "act-6",
    actor: "agent",
    headline: { ns: "activity", k: "verifying", args: [3] },
    phase: { ns: "phases", k: "comparingExpected" },
    status: "running",
    call: {
      id: "call-4",
      name: "verify_current_step",
      args: {},
      argsSummary: "",
      status: "running",
      startedAt: 0,
    },
  },
];

const failedEntry: ActivityEntry = {
  id: "act-fail",
  actor: "agent",
  headline: { ns: "activity", k: "testing", args: ["full system"] },
  outcome: { ns: "activity", k: "testFailed", args: [1] },
  status: "error",
  time: "14:36",
  call: {
    id: "call-5",
    name: "run_functional_test",
    args: { test: "full_system" },
    argsSummary: "test: full_system",
    status: "error",
    startedAt: 0,
    durationMs: 2704,
    errorMessage: { ns: "errors", k: "barrierDirection" },
  },
};

export function ActivitySpecimens() {
  const copy = useCopy();
  const t = copy.lab.agentLab.activity;
  const entries = sampleActivity;

  return (
    <>
      <LabBlock title={t.spineTitle} note={t.spineNote}>
        <LabStage>
          <div className="flex flex-wrap items-start gap-8">
            <PanelColumn title={t.timelineColumn}>
              <ActivityTimeline entries={entries} />
            </PanelColumn>
            <PanelColumn title={t.failedColumn}>
              <ActivityTimeline entries={[failedEntry]} />
            </PanelColumn>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.detailsTitle} note={t.detailsNote}>
        <LabStage>
          <PanelColumn title={t.detailsColumn}>
            <DeveloperDetails
              call={entries[1].call!}
              headline={say(copy, entries[1].headline)}
            />
          </PanelColumn>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.badgeTitle} note={t.badgeNote}>
        <LabStage>
          <ul className="space-y-2">
            {workbenchTools.map((tool) => (
              <li key={tool}>
                <ToolBadge tool={tool} running={tool === "inspect_build"} />
              </li>
            ))}
          </ul>
        </LabStage>
      </LabBlock>
    </>
  );
}
