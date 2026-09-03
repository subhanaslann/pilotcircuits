"use client";

import { Disclosure, RawJson } from "@/components/ui/disclosure";
import { TracePad, type TraceMark } from "@/components/ui/feedback";
import { KeyValueRow } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/status";
import { MonoValue } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import type { ActivityEntry, ToolCall } from "@/lib/agent/activity";
import { say } from "@/lib/agent/line";
import { toolKind, type AgentTool } from "@/lib/agent/model";
import { cn } from "@/lib/utils/cn";

/**
 * G-09 · Activity timeline   ·   G-10 · Developer details   ·   G-11 · Tool badge
 *
 * A generic timeline is a filled dot on a grey line. This product already owns
 * something more literal: a **copper trace with plated pads on it**. The agent
 * is routing a trace through the build, one point at a time — that is not a
 * metaphor borrowed for decoration, it is what is actually happening to the
 * graph (rule 8).
 *
 * The distinctions the shapes carry, before a word is read:
 *
 *   hollow pad   the agent looked; nothing on the bench changed
 *   blue pad     the agent changed the workbench
 *   dark pad     *you* changed it — the half the agent cannot do
 *   lattice      happening now
 *
 * The running marker is the activity pulse itself, so there is no second
 * in-progress animation to invent and none to keep in sync. Above it the spine
 * runs accent — the trace being laid — and below it there is no spine at all,
 * because that route has not been routed yet.
 *
 * No hairlines between entries. The spine is the separator; adding rules would
 * turn the trace into a ladder.
 */

function markFor(entry: ActivityEntry): TraceMark {
  if (entry.status === "running") return "running";
  if (entry.status === "error") return "failed";
  if (entry.tone) return entry.tone;
  if (entry.actor === "user") return "human";
  if (entry.actor === "system") return "pending";
  return entry.call ? toolKind[entry.call.name] : "read";
}

/**
 * G-11 · Tool call badge
 *
 * Deliberately not a capsule. Rule 1 reserves the capsule for things you press,
 * and rule 13 files a tool name alongside `D7` and `94%` — a reading, not a
 * control. So it stays in the `MonoValue` family at 4px radius, and the shape
 * itself says there is nothing here to click.
 */
export function ToolBadge({
  tool,
  running = false,
  className,
}: {
  tool: AgentTool;
  running?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "block size-1.5 shrink-0 rounded-full",
          toolKind[tool] === "change"
            ? "bg-accent"
            : "border-border-strong border",
        )}
      />
      <MonoValue
        tone="quiet"
        className={running ? "motion-safe:text-shimmer text-ink" : undefined}
      >
        {tool}
      </MonoValue>
    </span>
  );
}

/**
 * G-10 · Developer details
 *
 * The human sentence always comes first; this is what sits underneath it when
 * someone wants to know exactly what ran. Raw JSON stays shut until asked for —
 * the product's teaching contract, applied to its own machinery.
 */
export function DeveloperDetails({
  call,
  headline,
  className,
}: {
  call: ToolCall;
  /** Distinguishes twelve otherwise identical `Developer details` controls. */
  headline?: string;
  className?: string;
}) {
  const copy = useCopy();
  const details = copy.agentPanel.details;

  return (
    <Disclosure
      tone="quiet"
      className={className}
      summary={
        <>
          {copy.agentPanel.developerDetails}
          {headline ? (
            <span className="sr-only">
              {" "}
              {copy.agentPanel.details.detailsFor(headline)}
            </span>
          ) : null}
        </>
      }
    >
      <dl>
        <KeyValueRow
          label={details.toolLabel}
          mono={false}
          value={
            <ToolBadge tool={call.name} running={call.status === "running"} />
          }
        />
        <KeyValueRow
          label={details.argumentsLabel}
          value={call.argsSummary || details.noArguments}
        />
        {call.errorMessage ? (
          <KeyValueRow
            label={details.resultLabel}
            mono={false}
            value={
              <span className="text-error">{say(copy, call.errorMessage)}</span>
            }
          />
        ) : null}
        {call.durationMs !== undefined ? (
          <KeyValueRow
            label={details.durationLabel}
            value={details.ms(call.durationMs)}
          />
        ) : null}
      </dl>

      {call.result !== undefined ? (
        <RawJson value={call.result} label={copy.agentPanel.rawResult} />
      ) : null}
    </Disclosure>
  );
}

export function ActivityItem({
  entry,
  first = false,
  last = false,
  className,
}: {
  entry: ActivityEntry;
  first?: boolean;
  last?: boolean;
  className?: string;
}) {
  const copy = useCopy();
  const running = entry.status === "running";
  const mark = markFor(entry);
  const headline = say(copy, entry.headline);

  /* The segment above a running entry is the trace being laid right now. */
  const above = first ? "bg-transparent" : running ? "bg-accent" : "bg-border";
  const below = last || running ? "bg-transparent" : "bg-border";

  return (
    <div className={cn("motion-rise flex gap-3", className)}>
      <div className="relative flex w-[22px] shrink-0 flex-col items-center">
        <span aria-hidden="true" className={cn("h-2 w-px shrink-0", above)} />
        <TracePad mark={mark} />
        <span aria-hidden="true" className={cn("w-px flex-1", below)} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5 pb-3">
        <div className="flex items-baseline gap-2">
          <p className="text-body-sm text-ink min-w-0 flex-1">{headline}</p>
          {entry.time ? (
            <span className="text-mono-sm tnum text-ink-tertiary shrink-0 font-mono">
              {entry.time}
            </span>
          ) : null}
        </div>

        {running && entry.phase ? (
          <p className="text-caption text-ink-tertiary mt-0.5">
            {say(copy, entry.phase)}
          </p>
        ) : null}

        {!running && entry.outcome ? (
          <p className="text-caption text-ink-secondary mt-0.5">
            {say(copy, entry.outcome)}
          </p>
        ) : null}

        {entry.call && !running ? (
          <DeveloperDetails
            call={entry.call}
            headline={headline}
            className="mt-0.5"
          />
        ) : null}
      </div>
    </div>
  );
}

export function ActivityTimeline({
  entries,
  className,
}: {
  entries: ActivityEntry[];
  className?: string;
}) {
  const copy = useCopy();

  if (!entries.length) {
    return (
      <EmptyState
        className={className}
        title={copy.agentPanel.noActivity}
        description={copy.agentPanel.noActivityHint}
      />
    );
  }

  return (
    <div className={cn("pt-1", className)}>
      {entries.map((entry, index) => (
        <ActivityItem
          key={entry.id}
          entry={entry}
          first={index === 0}
          last={index === entries.length - 1}
        />
      ))}
    </div>
  );
}
