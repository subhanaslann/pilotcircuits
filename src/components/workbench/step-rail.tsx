"use client";

import { ComponentIcon } from "@/components/illustration/component-icons";
import { StepMark } from "@/components/ui/build-progress";
import { ListRow, Panel } from "@/components/ui/card";
import { MonoValue } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import type { BuildStep } from "@/lib/agent/steps";
import type { StepParts } from "@/lib/agent/parts";
import { cn } from "@/lib/utils/cn";

/**
 * W-02 · Step rail item   ·   W-03 · Components in this step
 *
 * The workbench's left region: seven steps in the order they happen, and — at
 * the foot, pinned — what the step you are standing on actually touches.
 *
 * **The rail does not navigate.** It reads, and that is deliberate. Three
 * things already move the build between steps: the agent, through
 * `navigate_build_step`; the demo menu; and the compact progress control in the
 * topbar, whose expanded list has been a step picker since Batch 1. A fourth
 * would be a second place to keep in step with the first, and the rail's job
 * here is orientation — where am I, what is behind me, what is still open.
 *
 * **Every row says its state in a word** (rule 9). Position alone would carry
 * three of the four states — before, here, after — but not the one that
 * matters: a step you have walked past can still be `Issue`, and that is
 * exactly the case the rail exists to keep visible. Saying only that one out
 * loud would leave the other three to be inferred from a glyph, so all four are
 * written, quietly, in the metadata line where the estimate already lives.
 *
 * Writing them down is also what caught the fourth word. `upcoming` reads
 * `Not started`, not `Upcoming`: the agent can move the build to step 4 with
 * step 3 still unverified — the demo menu does exactly that — and a row *above*
 * the active one calling itself upcoming is the rail saying something untrue.
 * The state keeps its name; the word says the part that holds in both
 * positions.
 */

const statusTone: Record<BuildStep["status"], string> = {
  completed: "text-ink-tertiary",
  active: "text-accent",
  issue: "text-warning-hover",
  upcoming: "text-ink-tertiary",
};

export function StepRailItem({
  step,
  index,
  className,
}: {
  step: BuildStep;
  /** Zero-based, so the disc can print its number. */
  index: number;
  className?: string;
}) {
  const copy = useCopy();

  return (
    <ListRow
      as="li"
      active={step.status === "active"}
      /* A row nobody can press must not light up under the pointer. */
      className={cn(
        "hover:bg-transparent hover:shadow-none",
        step.status === "issue" && "bg-warning-soft/70",
        className,
      )}
      leading={<StepMark status={step.status} index={index} />}
    >
      <span
        className={cn(
          "text-body-sm block truncate",
          step.status === "upcoming" ? "text-ink-tertiary" : "text-ink",
          (step.status === "active" || step.status === "issue") &&
            "font-medium",
        )}
      >
        {step.name}
      </span>
      <span className="text-caption mt-0.5 flex items-center gap-1.5">
        <span className={statusTone[step.status]}>
          {copy.workbench.stepStatus[step.status]}
        </span>
        {step.minutes ? (
          <>
            <span aria-hidden="true" className="text-ink-disabled">
              ·
            </span>
            <span className="text-mono-sm tnum text-ink-tertiary font-mono">
              {copy.library.minutes(step.minutes)}
            </span>
          </>
        ) : null}
      </span>
    </ListRow>
  );
}

/**
 * W-03 · What the step touches.
 *
 * Marks rather than canvas parts: this is a 24px strip in a 252px column, and
 * `illustration/component-icons.tsx` is the set drawn for exactly that distance
 * (Batch 6). The pins under them are what the board prints, so they are mono
 * and untranslated (rule 13).
 *
 * The whole block is derived from the connections the step owns — see
 * `stepParts`. Steps that wire nothing render nothing, which is honest: laying
 * out the kit is not a step with four components in it.
 */
export function StepComponents({
  parts,
  className,
}: {
  parts: StepParts;
  className?: string;
}) {
  const copy = useCopy();

  if (!parts.components.length && !parts.jumpers) return null;

  return (
    <div className={className}>
      <p className="text-overline text-ink-tertiary uppercase">
        {copy.workbench.componentsInStep}
      </p>

      <ul className="mt-2 space-y-1">
        {parts.components.map((id) => (
          <li key={id} className="flex items-center gap-2">
            <ComponentIcon id={id} size={24} className="shrink-0" />
            <span className="text-body-sm text-ink min-w-0 truncate">
              {copy.components[id]}
            </span>
          </li>
        ))}
        {parts.jumpers ? (
          <li className="flex items-center gap-2">
            <ComponentIcon id="jumper" size={24} className="shrink-0" />
            <span className="text-body-sm text-ink min-w-0 truncate">
              {copy.workbench.jumpers(parts.jumpers)}
            </span>
          </li>
        ) : null}
      </ul>

      {parts.pins.length ? (
        <p className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-caption text-ink-tertiary">
            {copy.workbench.pins}
          </span>
          {parts.pins.map((pin) => (
            <MonoValue key={pin}>{pin}</MonoValue>
          ))}
        </p>
      ) : null}
    </div>
  );
}

export function StepRail({
  steps,
  parts,
  className,
}: {
  steps: BuildStep[];
  /** The active step's parts. Omit and the foot is not rendered. */
  parts?: StepParts;
  className?: string;
}) {
  const copy = useCopy();

  return (
    <Panel
      ariaLabel={copy.workbench.region.steps}
      className={cn("border-y-0 border-l-0", className)}
      bodyClassName="px-2 py-2.5"
      /* An empty foot is still a rule and 28px of padding, so the block has
         to decide before the panel does. */
      footer={
        parts && (parts.components.length || parts.jumpers) ? (
          <StepComponents parts={parts} />
        ) : undefined
      }
    >
      <ol className="space-y-0.5">
        {steps.map((step, index) => (
          <StepRailItem key={step.id} step={step} index={index} />
        ))}
      </ol>
    </Panel>
  );
}
