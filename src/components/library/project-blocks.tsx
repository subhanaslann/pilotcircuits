"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ComponentIcon } from "@/components/illustration/component-icons";
import { ProjectScene } from "@/components/illustration/project-scenes";
import { BuildProgress } from "@/components/ui/build-progress";
import { CheckRow } from "@/components/ui/choice";
import { Alert } from "@/components/ui/status";
import { Chip } from "@/components/ui/badge";
import { MetadataLine } from "@/components/ui/text";
import { useCopy } from "@/content/copy-provider";
import type { BuildStep } from "@/lib/agent/steps";
import type { ComponentId, ProjectDef } from "@/lib/projects/catalog";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * P-03 · Continue build card
 *
 * The dashboard's one card about a build already under way. It is the project
 * card turned on its side — scene on the left, progress on the right — because
 * this card answers a different question from the others in the grid: not
 * *what is this* but *where was I*.
 *
 * The progress indicator is A-15's compact variant, unchanged. A dashboard that
 * invented a second way of saying `3/7` would have two of them to keep in step
 * the first time the step count moved.
 */
export function ContinueCard({
  project,
  steps,
  href = "#",
  className,
}: {
  project: ProjectDef;
  steps: BuildStep[];
  href?: string;
  className?: string;
}) {
  const copy = useCopy();
  const words = copy.projects[project.id];

  return (
    <Link
      href={href}
      className={cn(
        "group border-border bg-surface shadow-e1 hover:shadow-e2 hover:border-border-strong focus-visible:ring-focus flex overflow-hidden rounded-xl border transition-all duration-instant ease-out-soft",
        className,
      )}
    >
      <div className="bg-surface-sunken hidden shrink-0 sm:block">
        <ProjectScene id={project.id} width={200} className="h-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="text-overline text-ink-tertiary uppercase">
            {copy.dashboard.continueTitle}
          </p>
          <h3 className="text-h3 text-ink group-hover:text-accent mt-0.5 transition-colors duration-instant">
            {words.name}
          </h3>
        </div>

        <BuildProgress steps={steps} compact />

        <div className="mt-auto flex items-center justify-between gap-3">
          <MetadataLine
            items={[
              copy.library.minutes(project.minutes),
              copy.library.difficulty[project.difficulty],
            ]}
          />
          <span className="text-body-sm text-accent group-hover:text-accent-hover inline-flex shrink-0 items-center gap-1 font-medium transition-colors duration-instant">
            {copy.dashboard.primaryCta}
            <ArrowRight
              size={icon.xs}
              strokeWidth={icon.strokeWidth}
              aria-hidden="true"
              className="transition-transform duration-instant group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * P-05 · Component checklist
 *
 * `CheckRow` (A-11), fed. The direction was settled in Batch 1 —
 * **CB3 · Inventory row** — and this is what it was settled for: a list you run
 * down once before starting, counting stock rather than agreeing to terms.
 *
 * Nothing here blocks anything. An unticked list still starts the build, which
 * is why the summary underneath reports and never warns.
 */
export function ComponentChecklist({
  components,
  checked,
  onToggle,
  className,
}: {
  components: ComponentId[];
  checked: ComponentId[];
  onToggle: (id: ComponentId) => void;
  className?: string;
}) {
  const copy = useCopy();
  const missing = components.length - checked.length;

  return (
    <div className={cn("w-full", className)}>
      <p className="text-body-sm text-ink-secondary mb-3">
        {copy.projectDetail.checklistHint}
      </p>

      <ul className="space-y-1.5">
        {components.map((id) => (
          <li key={id}>
            <CheckRow
              checked={checked.includes(id)}
              onCheckedChange={() => onToggle(id)}
              label={
                <span className="flex items-center gap-2">
                  <ComponentIcon id={id} size={22} />
                  {copy.components[id]}
                </span>
              }
            />
          </li>
        ))}
      </ul>

      {/* A report, not a warning: the tone stays informational even at zero,
          because nothing here is blocked (rule 4's reassurance case). */}
      <p className="text-body-sm text-ink-secondary mt-3">
        {missing === 0
          ? copy.projectDetail.allPresent
          : missing === 1
            ? copy.projectDetail.missingOne
            : copy.projectDetail.missingMany(missing)}
      </p>
    </div>
  );
}

/**
 * P-07 · Learning goals list
 *
 * Chips rather than a bulleted list: these are labels, and a bullet list of
 * eight two-word items reads as a specification. The same chips appear on the
 * card, from the same keys.
 */
export function LearningGoals({
  concepts,
  className,
}: {
  concepts: readonly string[];
  className?: string;
}) {
  const copy = useCopy();
  return (
    <div className={className}>
      <h3 className="text-h3 text-ink mb-3">
        {copy.projectDetail.learningGoals}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {concepts.map((label) => (
          <li key={label}>
            <Chip>{label}</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * P-08 · Step preview strip
 *
 * The seven steps before you start them, from `steps.ts` — the same list the
 * workbench rail renders, so the preview cannot promise a build the workbench
 * does not deliver.
 *
 * Numbered and countable (rule 5): seven steps get seven marks, never a bar.
 */
export function StepPreview({
  steps,
  className,
}: {
  steps: BuildStep[];
  className?: string;
}) {
  const copy = useCopy();

  return (
    <div className={className}>
      <h3 className="text-h3 text-ink mb-3">
        {copy.projectDetail.stepPreview}
      </h3>
      <ol className="space-y-0.5">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-3 py-1.5">
            <span
              aria-hidden="true"
              className="text-mono-sm tnum text-ink-tertiary bg-surface-sunken grid size-6 shrink-0 place-items-center rounded-full font-mono"
            >
              {index + 1}
            </span>
            <span className="text-body-sm text-ink min-w-0 flex-1">
              {step.name}
            </span>
            {step.minutes ? (
              <span className="text-mono-sm tnum text-ink-tertiary shrink-0 font-mono">
                {copy.library.minutes(step.minutes)}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * P-10 · How it works
 *
 * Three steps on the dashboard. Numbered discs and a sentence each — no cards,
 * because these are the product talking about itself (rule 4).
 */
export function HowItWorks({
  className,
  /** S-01 · lets the entry screen set this heading in the same condensed
   *  face as the three sections around it, without the block growing a
   *  second style of its own. */
  headingClassName = "text-h3 text-ink",
}: {
  className?: string;
  headingClassName?: string;
}) {
  const copy = useCopy();

  return (
    <div className={className}>
      <h3 className={cn("mb-4", headingClassName)}>{copy.dashboard.howItWorks}</h3>
      <ol className="grid gap-5 sm:grid-cols-3">
        {copy.dashboard.steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="bg-accent-soft text-accent text-mono-sm tnum grid size-7 shrink-0 place-items-center rounded-full font-mono font-semibold"
            >
              {index + 1}
            </span>
            <span className="text-body-sm text-ink-secondary pt-1">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * P-11 · Preview project notice
 *
 * **A sentence, not a box.** This is the same trap `You can continue in guided
 * demo mode` set in Batch 2: the message's job is to set expectations calmly,
 * and a warning-shaped container undoes that whatever the words say (rule 4).
 * So it is `Alert` in the editorial register — one filled disc, a dark title, a
 * grey line, and no card around any of it.
 *
 * Info rather than warning, too. A preview project is not a problem with the
 * build; it is a fact about this release.
 */
export function PreviewNotice({ className }: { className?: string }) {
  const copy = useCopy();
  return (
    <Alert tone="info" title={copy.status.previewProject} className={className}>
      {copy.projectDetail.previewNotice}
    </Alert>
  );
}
