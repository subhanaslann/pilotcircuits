"use client";

import { useState, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioOption, SegmentedControl } from "@/components/ui/choice";
import { Disclosure } from "@/components/ui/disclosure";
import { ProgressBar, TracePad } from "@/components/ui/feedback";
import { MonoValue, Sentence } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import type { Copy } from "@/content/i18n";
import { findingWords, type Finding } from "@/lib/agent/findings";
import {
  coachingOrder,
  nextLevel,
  type CoachingLevel,
} from "@/lib/agent/model";
import { icon, type MonoTone } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * G-02 · Coaching level   ·   G-03 · Guidance   ·   G-04 · Teaching ladder
 * G-08 · Correction       ·   G-12 · Knowledge check
 *
 * Four of these five are named "card" in the inventory. None of them is one.
 * The rule the batch settled on:
 *
 *   **A surface contains the user's input or a countable object. It never
 *   contains the agent's output.**
 *
 * Whatever the agent noticed, explains or did is a sentence in the interface.
 * The one place the ground changes is the knowledge check — and it changes
 * *down*, into a sunken band, because that region belongs to the user.
 */

/**
 * The rung and the setting deliberately differ on rung one: `Notice` is the
 * content, `Hint first` is the preference. Keeping them apart is the reason
 * both maps exist rather than one.
 */
const rungLabels = (copy: Copy): Record<CoachingLevel, string> => ({
  hint: copy.agentPanel.ladder.notice,
  explain: copy.agentPanel.ladder.explain,
  exact: copy.agentPanel.ladder.exactFix,
});

const levelLabels = (copy: Copy): Record<CoachingLevel, string> => ({
  hint: copy.agentPanel.coaching.hint,
  explain: copy.agentPanel.coaching.explain,
  exact: copy.agentPanel.coaching.exact,
});

/* ------------------------------------------------------------------ G-02 */

/**
 * The agent moves this control through `show_correction`'s `detail_level`, so
 * the thumb sliding is not polish — it is how the user sees that the agent
 * changed how much help they are getting (rule 6).
 */
export function CoachingLevelSelector({
  value,
  onValueChange,
  className,
}: {
  value: CoachingLevel;
  onValueChange: (next: CoachingLevel) => void;
  className?: string;
}) {
  const copy = useCopy();
  const levelLabel = levelLabels(copy);

  return (
    <div className={className}>
      <p className="text-overline text-ink-tertiary mb-1.5 uppercase">
        {copy.agentPanel.coaching.label}
      </p>
      <SegmentedControl<CoachingLevel>
        size="sm"
        label={copy.agentPanel.coaching.label}
        value={value}
        onValueChange={onValueChange}
        options={coachingOrder.map((level) => ({
          value: level,
          label: levelLabel[level],
        }))}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ G-03 */

/**
 * What the agent currently knows — deliberately not what to do. The imperative
 * belongs above the canvas (`Connect the sensor's Echo pin to D7.`) and the
 * suggested action belongs in the pinned foot. Saying either of them here as
 * well would halve its authority and fill the panel with its own echo.
 */
export function GuidanceSummary({
  stepIndex,
  stepTotal,
  stepName,
  context,
  connections,
  blocked = false,
  aside,
  className,
}: {
  stepIndex: number;
  stepTotal: number;
  stepName: string;
  context: string;
  /** Countable, so it gets one tick each rather than a bar (rule 5). */
  connections?: { matched: number; expected: number };
  blocked?: boolean;
  aside?: { summary: string; body: ReactNode };
  className?: string;
}) {
  const copy = useCopy();

  return (
    <div className={cn("motion-expand py-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <MonoValue tone="quiet">
          {copy.workbench.stepOf(stepIndex, stepTotal)}
        </MonoValue>
        {blocked ? (
          <span className="text-caption text-warning font-medium">
            {copy.agentPanel.context.blocked}
          </span>
        ) : null}
      </div>

      <p className="text-h3 text-ink mt-0.5">{stepName}</p>
      <p className="text-body-sm text-ink-secondary mt-1">{context}</p>

      {connections && connections.expected > 0 ? (
        <ProgressBar
          className="mt-3"
          value={connections.matched}
          max={connections.expected}
          segments={connections.expected}
          label={copy.agentPanel.context.connections}
          valueLabel={copy.agentPanel.context.countOf(
            connections.matched,
            connections.expected,
          )}
        />
      ) : null}

      {aside ? (
        <Disclosure className="mt-1.5" summary={aside.summary}>
          {aside.body}
        </Disclosure>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ G-04 */

/**
 * Three rungs, always three rungs tall.
 *
 * A closed rung keeps its label and its dashed pad rather than collapsing to
 * nothing: two filled pads and one dashed circle say *there is one more level
 * of help available* without a word being read. Collapse them and the product's
 * headline claim — three levels of teaching, you choose how much — becomes an
 * invisible feature (rule 5, applied to teaching depth).
 */
export function TeachingLadder({
  coaching,
  mono,
  level,
  onLevelChange,
  className,
}: {
  coaching: Record<CoachingLevel, string>;
  /** Hardware values inside the rungs, rendered in mono (rule 13). */
  mono?: Record<string, MonoTone>;
  level: CoachingLevel;
  onLevelChange?: (next: CoachingLevel) => void;
  className?: string;
}) {
  const copy = useCopy();
  const rungLabel = rungLabels(copy);
  const levelLabel = levelLabels(copy);
  const openTo = coachingOrder.indexOf(level);
  const next = nextLevel(level);

  return (
    <div className={className}>
      {coachingOrder.map((rung, index) => {
        const open = index <= openTo;
        const isNext = rung === next;
        const last = index === coachingOrder.length - 1;

        return (
          <div key={rung} className="flex gap-2.5">
            <div className="relative flex w-[18px] shrink-0 flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-px shrink-0",
                  index === 0 ? "bg-transparent" : "bg-border",
                )}
              />
              <TracePad mark={open ? "change" : "pending"} />
              <span
                aria-hidden="true"
                className={cn(
                  "w-px flex-1",
                  last ? "bg-transparent" : "bg-border",
                )}
              />
            </div>

            <div className="min-w-0 flex-1 pb-2.5">
              {/* A closed rung that carries the control does not also print its
                  label — the button already says the word, and printing both
                  reads as a stutter. The pad still holds the rung's place, so
                  the ladder is three rungs tall either way. */}
              {open || !(isNext && onLevelChange) ? (
                <p
                  className={cn(
                    "text-caption font-medium",
                    open ? "text-ink" : "text-ink-tertiary",
                  )}
                >
                  {rungLabel[rung]}
                </p>
              ) : null}

              {open ? (
                <Sentence
                  className="text-body-sm text-ink-secondary motion-expand mt-0.5 block"
                  text={coaching[rung]}
                  mono={mono}
                />
              ) : isNext && onLevelChange ? (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => onLevelChange(rung)}
                >
                  {levelLabel[rung]}
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ G-08 */

/**
 * What `Show me` opens.
 *
 * Not a box: an indent and a single accent rule down its left edge — the
 * quotation device. A box would say "separate object"; the correction is not a
 * separate object, it is the finding, elaborated. What makes it distinct is
 * behavioural rather than visual: it arrives with `motion-expand`, it takes the
 * canvas to the pins, and it carries the resolve action so the teaching moment
 * and the fix are one gesture apart.
 */
export function Correction({
  id,
  finding,
  level,
  onLevelChange,
  aside,
  className,
}: {
  id?: string;
  finding: Finding;
  level: CoachingLevel;
  onLevelChange?: (next: CoachingLevel) => void;
  aside?: { summary: string; body: ReactNode };
  className?: string;
}) {
  const copy = useCopy();
  const words = findingWords(copy, finding);

  return (
    <div
      id={id}
      className={cn(
        "motion-expand border-accent mt-3 border-l-2 pl-3",
        className,
      )}
    >
      <p className="text-overline text-ink-tertiary mb-1.5 uppercase">
        {copy.agentPanel.correction}
      </p>

      <TeachingLadder
        coaching={words.coaching}
        mono={words.mono}
        level={level}
        onLevelChange={onLevelChange}
      />

      {aside ? (
        <Disclosure summary={aside.summary}>{aside.body}</Disclosure>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ G-12 */

/**
 * The one place in the panel where the ground changes — and it changes *down*,
 * into a full-bleed sunken band with a hairline top and bottom, no radius and
 * no side edges. It is a change of ground for a passage, not a box floating in
 * the column: the panel changed colour, so this bit is yours to answer.
 *
 * Real radios inside a real fieldset, so arrow keys, Home/End and grouping all
 * come free — rule 14's rebuild cost is only paid when a native control is
 * thrown away, and here it is not.
 */
export function KnowledgeCheck({ className }: { className?: string }) {
  const copy = useCopy();
  const quiz = copy.agentPanel.knowledge;
  const [answerId, setAnswerId] = useState<string | null>(null);

  const answered = answerId !== null;
  const correct = answerId === quiz.correctId;

  return (
    <div
      className={cn(
        "border-border bg-surface-sunken -mx-4 border-y px-4 py-4",
        className,
      )}
    >
      <fieldset>
        <legend className="text-overline text-ink-tertiary uppercase">
          {quiz.title}
        </legend>
        <p className="text-h3 text-ink mt-1.5">{quiz.question}</p>

        <div className="mt-3 space-y-2">
          {quiz.options.map((option) => {
            const picked = option.id === answerId;
            const isRight = option.id === quiz.correctId;

            const state = !answered
              ? "idle"
              : picked && isRight
                ? "correct"
                : picked
                  ? "incorrect"
                  : isRight
                    ? "revealed"
                    : "idle";

            return (
              <RadioOption
                key={option.id}
                name="knowledge-check"
                value={option.id}
                checked={picked}
                state={state}
                disabled={answered}
                onSelect={setAnswerId}
              >
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1">{option.label}</span>
                  {answered && isRight ? (
                    <span className="text-caption text-ink-tertiary inline-flex shrink-0 items-center gap-1">
                      <CircleCheck
                        size={icon.xs}
                        strokeWidth={icon.strokeWidth}
                        className="text-success"
                        aria-hidden="true"
                      />
                      {quiz.correctMark}
                    </span>
                  ) : null}
                </span>
              </RadioOption>
            );
          })}
        </div>

        <p
          aria-live="polite"
          className="text-body-sm text-ink-secondary mt-3 min-h-[19px]"
        >
          {answered ? (correct ? quiz.correct : quiz.incorrect) : null}
        </p>

        {answered && !correct ? (
          <Button
            variant="tertiary"
            size="sm"
            className="mt-1"
            onClick={() => setAnswerId(null)}
          >
            {quiz.tryAgain}
          </Button>
        ) : null}
      </fieldset>
    </div>
  );
}
