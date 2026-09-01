"use client";

import { ComponentIcon } from "@/components/illustration/component-icons";
import { StepMark } from "@/components/ui/build-progress";
import { ListRow, Panel } from "@/components/ui/card";
import { MonoValue } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import type { BuildStep } from "@/lib/agent/steps";
import { partNameOf, type StepParts } from "@/lib/agent/parts";
import type { TerminalId } from "@/lib/circuit/placement";
import type { ComponentId, KitId } from "@/lib/projects/catalog";
import { cn } from "@/lib/utils/cn";

/**
 * W-02 · Step rail item   ·   W-03 · Components in this step
 *
 * The workbench's left region: seven steps in the order they happen, and — at
 * the foot, pinned — what the step you are standing on actually touches.
 *
 * **The parts at the foot are now where the kit is.** The rail's *step list*
 * still does not navigate — that half of the rule below is untouched. What
 * changed is the block under it: on a build the person assembles, the kit is
 * picked up from there, so those rows became controls. A row that is suddenly
 * pressable in a column of six read-only ones would be a rule-1 violation on
 * its own, so the affordance is paid for where rule 1 asks: a **capsule** chip
 * at the end of the row, carrying the **state word** (rule 9). Capsule says
 * pressable, the word says which state, and the row itself stays a 14px list
 * row — a 252px rail of capsules is not this language.
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
/**
 * What the person can do with one row of the kit.
 *
 * **One row is one lead, not one component.** `placed: boolean` had two states
 * and a lead has four, and the missing one — a lead clipped onto another lead —
 * is exactly what chapter one's third step is about: saying `Placed` about it
 * would be the rail asserting a hole that does not exist. So the row carries the
 * state word itself rather than a flag this file would have to interpret, and it
 * carries the `terminal` because that, not the component, is what `place`
 * commits.
 *
 * An ordered array rather than a record keyed by component, for the same
 * reason: step 3 touches three leads across two parts, and a record could hold
 * one row per part.
 */
export interface KitRow {
  /** What `place` is called with. */
  terminal: TerminalId;
  component: KitId;
  /**
   * The lead's name, or `null` when this row is the whole part.
   *
   * Both readings are real. `Check your kit` is about the box — one row per
   * part, "LED · In the kit" — and a wiring step is about legs. The name is
   * already a phrase that says which part it belongs to ("the LED's long leg"),
   * so the row prints it instead of the component's name rather than beside it:
   * the icon is the part, and 252px does not have room to say so twice.
   */
  lead: string | null;
  state: "inKit" | "loose" | "seated" | "joined";
}

export interface KitControls {
  rows: readonly KitRow[];
  /** The lead currently in hand, if any. */
  picking: TerminalId | null;
  onPick: (terminal: TerminalId | null) => void;
}

export function StepComponents({
  parts,
  kit,
  className,
}: {
  parts: StepParts;
  /** Absent on a build laid out by the author: the rows stay read-only. */
  kit?: KitControls;
  className?: string;
}) {
  const copy = useCopy();

  const rows = kit?.rows ?? [];
  if (!parts.components.length && !parts.jumpers && !rows.length) return null;

  /* What the step names and no row covers stays the read-only line it has
     always been. Chapter six has no rows at all and reads exactly as before;
     chapter one's `Check your kit` names the board, which is part of the step
     and is not a thing anybody picks up. */
  const listed = parts.components.filter(
    (id) => !rows.some((row) => row.component === id),
  );

  /* Two tables, and the split is the point rather than an oversight.
     `copy.components` is the CATALOGUE's vocabulary — the six counted parts, in
     the plural words a project card uses ("LEDs") — and this read-only line has
     always spoken it. `copy.build.parts` is the BENCH's, which is wider: a
     chapter can hand you a jumper cable, and the catalogue deliberately does
     not count one. So the catalogue answers where it can and the bench answers
     for everything else, rather than one of them being retyped into the other. */
  const partName = (id: KitId) =>
    id in copy.components
      ? copy.components[id as ComponentId]
      : copy.build.parts[id];

  return (
    <div className={className}>
      <p className="text-overline text-ink-tertiary uppercase">
        {copy.workbench.componentsInStep}
      </p>

      <ul className="mt-2 space-y-1">
        {listed.map((id) => (
          <li key={id} className="flex items-center gap-2">
            <ComponentIcon id={id} size={24} className="shrink-0" />
            <span className="text-body-sm text-ink min-w-0 truncate">
              {partName(id)}
            </span>
          </li>
        ))}
        {rows.map((row) => {
          const inHand = kit?.picking === row.terminal;
          const state = inHand
            ? copy.workbench.kit.picking
            : row.state === "inKit"
              ? copy.workbench.kit.inKit
              : copy.workbench.lead[row.state];

          return (
            <li key={row.terminal}>
              <button
                type="button"
                aria-pressed={inHand}
                /* Named by what pressing it does, not by what it is standing
                   next to. Computed from the contents alone the name came out
                   "LED Kitte" — a noun glued to a state word, on the control
                   that is the primary keyboard way into the whole placement
                   gesture — and `aria-pressed` then implied that pressing it
                   toggled the LED's kit-ness. It does not: it puts the lead in
                   your hand. The state stays visible in the chip and audible in
                   `aria-pressed`, so the chip itself has nothing left to say. */
                aria-label={
                  row.lead
                    ? copy.workbench.lead.pickUp(
                        copy.build.leadObject[row.terminal],
                      )
                    : copy.workbench.kit.pickUp(
                        partNameOf(copy, row.terminal),
                      )
                }
                /* A name suppresses the contents it was written over, and the
                   chip is the only place `Loose`, `In a hole` and `Joined` are
                   said at all. The word comes back as the description rather
                   than in the name: what this commits does not change with the
                   state, and a name that moved between four readings would be
                   four different controls to anybody listening. */
                aria-describedby={`kit-state-${row.terminal}`}
                /* The one row this step is about, findable from outside: the
                   workbench puts the caret back on the lead it just moved, and
                   `footer button[aria-pressed]` returns the first of three the
                   moment a step touches more than one leg. */
                data-terminal={row.terminal}
                onClick={() => kit?.onPick(inHand ? null : row.terminal)}
                className="focus-visible:ring-focus hover:bg-surface-hover -mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors"
              >
                <ComponentIcon
                  id={row.component}
                  size={24}
                  className="shrink-0"
                />
                {/* Singular here and plural in the read-only row above, and
                    that is not an inconsistency: this row is one thing you can
                    pick up, that one is a line in a kit list. */}
                <span className="text-body-sm text-ink min-w-0 flex-1 truncate">
                  {/* The part, named off the lead this row commits — the
                      same answer the shelf gives, and the only one that can
                      tell three 220Ω resistors apart. */}
                  {row.lead ?? partNameOf(copy, row.terminal)}
                </span>
                <KitChip active={inHand} id={`kit-state-${row.terminal}`}>
                  {state}
                </KitChip>
              </button>
            </li>
          );
        })}
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

/** Rule 1's capsule and rule 9's word, in one 20px chip. */
function KitChip({
  active,
  id,
  children,
}: {
  active: boolean;
  /** So the row's button can point its description at the word. */
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      id={id}
      className={cn(
        "text-caption shrink-0 rounded-full px-2 py-0.5 leading-none",
        active
          ? "bg-accent text-inverse"
          : "border-border text-ink-secondary border",
      )}
    >
      {children}
    </span>
  );
}

export function StepRail({
  steps,
  parts,
  kit,
  className,
}: {
  steps: BuildStep[];
  /** The active step's parts. Omit and the foot is not rendered. */
  parts?: StepParts;
  kit?: KitControls;
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
        parts &&
        (parts.components.length || parts.jumpers || kit?.rows.length) ? (
          <StepComponents parts={parts} kit={kit} />
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
