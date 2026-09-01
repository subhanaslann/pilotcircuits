"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { useLandingSession } from "@/components/landing/landing-session";
import {
  getLine,
  getServerLine,
  subscribe,
} from "@/components/landing/scene/repair-demo";
import { useCopy } from "@/content/copy-provider";
import { say } from "@/lib/agent/line";
import { workbenchTools } from "@/lib/agent/model";
import { stepById } from "@/lib/agent/steps";
import { demoWorkshopLog } from "@/lib/agent/workshop-log";
import { finalReadingCm } from "@/lib/device/test-run";
import { featuredProjectId, projectById } from "@/lib/projects/catalog";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The diagnostics strip.
 *
 * One block, not two panels. The build sheet and the agent's terminal share an
 * edge with no gap, no radius and no shadow between them, and that single
 * decision is what stops the entry screen reading as a card collection: two
 * rounded white panels floating 28px apart are a dashboard; the same two
 * readings butted together are an instrument face.
 *
 * The table's height is not set. It is seven rows of `flex-1` inside a strip
 * whose height is fixed once, so the left column and the terminal cannot drift
 * out of alignment when a value wraps or a row is added.
 *
 * Everything printed here is read from where the product reads it — the
 * catalogue, the step definitions, the tool list, the test run, the live
 * session. `Steps 3 / 7` here cannot disagree with the rail, because it is the
 * same number, and `Status` is derived from the findings rather than asserted.
 */

export function DiagnosticsStrip({ className }: { className?: string }) {
  const copy = useCopy();

  return (
    <section
      aria-label={copy.landing.stripRegion}
      className={cn(
        "grid grid-cols-1 md:h-[173px] md:grid-cols-[49fr_51fr]",
        className,
      )}
    >
      <BuildDataTable />
      <AgentLog />
    </section>
  );
}

/* --- The sheet ----------------------------------------------------------- */

function BuildDataTable() {
  const copy = useCopy();
  const { state, openFindings } = useLandingSession();
  const project = projectById(featuredProjectId);

  /* Derived, never stored: how many findings are still *open* against this
     build decides whether the strip is allowed to say GREEN.
     Not `state.findings.length`. That counts every finding the agent is
     holding, resolved ones included, and until this screen could correct
     anything the two numbers were never different. They are now: the panel
     beside it puts the cable back and the sheet has to stop saying `1 AÇIK`
     over a bench that is visibly right. The word on the label is `open`. */
  const open = openFindings.length;
  const step = stepById(state.activeStepId);

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: copy.device.board, value: copy.device.boardValueShort },
    { label: copy.device.port, value: copy.device.portValue },
    { label: copy.device.voltage, value: copy.device.voltageValue },
    { label: copy.device.distance, value: `${finalReadingCm} cm` },
    {
      label: copy.landing.steps,
      value: copy.landing.stepsValue(step.index, project.stepCount),
    },
    { label: copy.landing.tools, value: workbenchTools.length },
    {
      label: copy.landing.status,
      value:
        open === 0 ? (
          <span className="text-success inline-flex items-center gap-1 font-semibold">
            <Check size={13} strokeWidth={3} aria-hidden="true" />
            {copy.landing.statusGreen}
          </span>
        ) : (
          <span className="text-warning font-semibold">
            {copy.landing.statusOpen(open)}
          </span>
        ),
    },
  ];

  return (
    /* `dl` because these are label/value pairs, and a `dl` is the one element
       that says so without inventing a table with no columns. */
    <dl className="flex min-w-0 flex-col">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-3 pl-2.5 md:py-0",
            /* Two grounds, alternating. The banding is what makes seven dense
               rows scannable without a rule between each of them. */
            index % 2 === 0 ? "bg-paper-row" : "bg-paper-row-alt",
          )}
        >
          <dt className="font-condensed text-ink w-[48%] shrink-0 text-[14px] leading-none font-semibold">
            {row.label}:
          </dt>
          <dd className="text-ink tnum min-w-0 truncate font-mono text-[12.5px] leading-none">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* --- The terminal -------------------------------------------------------- */

/**
 * The agent's own surface.
 *
 * No title bar, no `Demo` tag in the corner, no visible scrollbar and no
 * caption underneath. A diagnostic terminal is recognised by what it *is* —
 * dark ground, green monospace, timestamps down the left — and every chrome
 * element added around it makes it one degree less like one.
 *
 * It prints the live timeline the moment there is one. Before that it prints
 * the transcript in `workshop-log.ts`, which is assembled from the circuit
 * graph rather than typed out, so the fallback cannot say something about this
 * build that is not true of it.
 */
function AgentLog() {
  const copy = useCopy();
  const { state } = useLandingSession();

  /**
   * Which line the bench is illustrating right now.
   *
   * The transcript's third line reports the fault and its fourth reports the
   * correction, and until now the bench under them stood still while both were
   * on screen. `repair-demo.ts` plays the move; this reads back which sentence
   * the move is currently making true.
   *
   * The snapshot is an integer, so this component re-renders exactly twice
   * during the run rather than on every frame of it.
   */
  const active = useSyncExternalStore(subscribe, getLine, getServerLine);

  const live = state.activity;
  const lines = live.length
    ? live
        .slice(-6)
        .map((entry) => ({
          key: entry.id,
          time: entry.time ?? "",
          text: say(copy, entry.headline),
        }))
    : demoWorkshopLog().map((line) => ({
        key: line.time,
        time: line.time,
        text: line.say(copy),
      }));

  return (
    <div
      role="log"
      aria-label={copy.landing.logRegion}
      /* These are the agent's sentences, not raw serial output, so a change
         here is worth announcing — unlike `SerialMonitor`, which is off. */
      aria-live="polite"
      className="bg-terminal min-h-[160px] min-w-0 overflow-hidden rounded-[1px] px-4 py-3 md:min-h-0"
    >
      {lines.map((line, index) => (
        <p
          key={line.key}
          className={cn(
            "text-terminal-ink tnum truncate font-mono text-[12.5px] leading-[17.5px]",
            "transition-opacity duration-settle",
            /* No highlight box, no colour change, no marker in the gutter: the
               line the bench is acting on stays lit and the rest step back.
               A terminal is recognised by what it is, and a row of green
               monospace with one row boxed is no longer one. */
            !live.length && active >= 0 && index !== active && "opacity-45",
          )}
        >
          {line.time ? (
            <>
              <span className="opacity-70">{line.time}</span>
              <span className="opacity-50"> &gt; </span>
            </>
          ) : null}
          {line.text}
        </p>
      ))}
    </div>
  );
}
