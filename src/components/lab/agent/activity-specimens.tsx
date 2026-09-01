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
 *
 * **And so are the payloads.** The clause above was asserted for the sentences
 * and then quietly broken for everything under them: every `result` here was
 * hand-written, and all four were shapes no handler returns — `activeStep` as a
 * bare string where the tool answers an object, `show_correction` two keys
 * short with its pins in the wrong order, an `inspect_build` finding with its
 * `confidence` dropped, and a failed run carrying `status: "error"` and an
 * error key (`barrierDirection`) that nothing in the product ever produced. A
 * fabricated payload is the same defect as a paraphrased sentence, one level
 * down: it is a specimen of a product that does not exist.
 *
 * These four are transcribed from one real run against the real handlers — the
 * capstone bench, opened fresh and called in the order the timeline tells it.
 * `argsSummary` is `summariseArgs`' own output rather than a shortened version
 * of it, and a payload that looks longer than a specimen needs is the size the
 * tool actually answers.
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
        project: {
          id: "smartParkingBarrier",
          slug: "smart-parking-barrier",
          name: "Smart Parking Barrier",
        },
        locale: "en",
        assistedEdits: 0,
        activeStep: {
          id: "sensor",
          index: 3,
          name: "Wire the distance sensor",
          instruction: "Connect the sensor's Echo pin to digital pin D7.",
        },
        expectedConnections: [
          "sensor.vcc -> bb.pos4",
          "sensor.gnd -> bb.neg4",
          "sensor.trig -> board.D8",
          "sensor.echo -> board.D7",
          "servo.signal -> board.D9",
          "servo.power -> bb.pos20",
          "servo.ground -> bb.neg20",
          "led.green.anode -> board.D3",
          "led.red.anode -> board.D2",
          "board.5V -> bb.pos1",
          "board.GND -> bb.neg1",
        ],
        observedConnections: [
          "sensor.vcc -> bb.pos4",
          "sensor.gnd -> bb.neg4",
          "sensor.trig -> board.D8",
          "sensor.echo -> board.D6",
          "servo.signal -> board.D9",
          "servo.power -> bb.pos20",
          "servo.ground -> bb.neg20",
          "led.green.anode -> board.D3",
          "led.red.anode -> board.D2",
          "board.5V -> bb.pos1",
          "board.GND -> bb.neg1",
        ],
        mechanical: { servoAngle: 0, expectedAngle: 90, aligned: false },
        /* Zero because nothing has looked yet — the inspection is the next
           entry. The two lists above are what it is about to compare. */
        openFindings: 0,
        /* The capstone is wired rather than placed, so it has no placement to
           report. The five assembled chapters answer an object here. */
        placement: null,
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
            /* `subject` is the pin's printed name, for a sentence; the three
               `*Node` fields beside it are the graph's own ids, for a caller
               that has to act rather than read. The specimen used to carry the
               readable half only, which is the half a tool client cannot use. */
            subject: "Echo",
            subjectLead: "sensor.echo",
            expected: "D7",
            expectedNode: "board.D7",
            observed: "D6",
            observedNode: "board.D6",
            confidence: 0.94,
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
      argsSummary:
        "finding_id: finding:wiring:c.sensor.echo · detail_level: hint",
      status: "ok",
      startedAt: 0,
      durationMs: 96,
      result: {
        findingId: "finding:wiring:c.sensor.echo",
        detailLevel: "hint",
        /* Where the wire should go first, then where it is. The pair used to be
           written the other way round, which is the order that reads as an
           instruction to undo the fix. */
        focused: ["board.D7", "board.D6"],
        changed: true,
        source: "demo",
      },
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

/**
 * A call that failed — and it has to be a *refused* one.
 *
 * This used to be `run_functional_test` on `full_system` with
 * `status: "error"` and an outcome reading `1 check failed`, which is the one
 * thing this tool never does: a run where two of three checks fail returns
 * `status: "ok"` and says so in its `note`'s tone, because the call succeeded
 * and the *build* is what failed. The distinction is the whole reason
 * `ActivityEntry` carries `status` and `tone` separately.
 *
 * So the specimen is the tool's only reachable error exit instead — an unknown
 * check — which is a genuine `status: "error"`, carries the structured refusal
 * `use-webmcp.ts` forwards to a host, and names the checks this build does run.
 * The error key it replaces (`barrierDirection`) had no producer anywhere in
 * the product; `unknownCheck` is composed by the handler.
 */
const failedEntry: ActivityEntry = {
  id: "act-fail",
  actor: "agent",
  headline: {
    ns: "activity",
    k: "testing",
    args: [{ ref: "check", id: "barrier" }],
  },
  status: "error",
  time: "14:36",
  call: {
    id: "call-5",
    name: "run_functional_test",
    args: { test: "barrier" },
    argsSummary: "test: barrier",
    status: "error",
    startedAt: 0,
    /* Short, because a refusal is decided before the first phase note: the
       handler never reaches the run it would have timed. */
    durationMs: 14,
    result: {
      refused: "unknownCheck",
      argument: "test",
      value: "barrier",
      valid: ["sensor", "servo", "leds", "full_system"],
      source: "demo",
    },
    errorMessage: {
      ns: "errors",
      k: "unknownCheck",
      args: ["sensor, servo, leds"],
    },
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
