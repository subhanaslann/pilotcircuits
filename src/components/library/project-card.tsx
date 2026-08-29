import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ComponentIcon } from "@/components/illustration/component-icons";
import { ProjectScene } from "@/components/illustration/project-scenes";
import { StatusChip } from "@/components/ui/badge";
import { MetadataLine } from "@/components/ui/text";
import type { Copy } from "@/content/i18n";
import { CARD_CONCEPTS, type ProjectDef } from "@/lib/projects/catalog";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * P-01 · Project card — **`full` chosen**, `calm` kept.
 *
 * The batch turns on one question: **how much can a card say?** `frontend-plan`
 * §4 asks for nine fields and, in the same paragraph, for no bulky cards. Rule 3
 * asks that seven badges side by side read as one calm system rather than seven
 * separate emphases. A grid of seven is where those two sentences collide, so
 * both answers are built and left side by side at `/lab/library#p-cards`.
 *
 * The directions differ in what they spend the space *on*, which turned out to
 * be the sharper question than more-versus-less:
 *
 *   `full`  *Chosen.* What is **in** it — the component strip and the concepts
 *           it teaches. A library you shop a kit from: you can tell at a glance
 *           whether a build needs a servo you do not own.
 *   `calm`  *Rejected, and still built.* What it **does** — one sentence, and
 *           nothing else competing. Live at `/lab/library#p-cards`.
 *
 * Shared by both, and not up for grabs: the scene, the name, the duration and
 * level, the status, and the action. Those are the fields no reasonable card
 * drops.
 *
 * **Batch 8 · the link is a `Link`.** It was a bare `<a>` while every href was
 * `#`. In the product a document load would take the build session with it —
 * the dashboard would forget a build in progress the moment somebody clicked a
 * card to look at something else.
 *
 * **The whole card is the link.** Rule 1 reserves capsules for things you
 * press, and a card is a surface you read, so it stays at 14px and never
 * becomes one — but it is still clickable, so the action inside it renders as
 * text rather than as a nested button. Two controls in one card is how a
 * keyboard user ends up tabbing twice to reach one destination.
 */

export type ProjectCardVariant = "full" | "calm";

export function ProjectCard({
  project,
  copy,
  variant = "full",
  href = "#",
  className,
}: {
  project: ProjectDef;
  /** Passed rather than hooked, so the card renders on the server. */
  copy: Copy;
  variant?: ProjectCardVariant;
  href?: string;
  className?: string;
}) {
  const words = copy.projects[project.id];
  const ready = project.status === "ready";

  return (
    <Link
      href={href}
      className={cn(
        "group border-border bg-surface shadow-e1 hover:shadow-e2 hover:border-border-strong focus-visible:ring-focus flex flex-col overflow-hidden rounded-xl border transition-all duration-instant ease-out-soft",
        className,
      )}
    >
      <div className="bg-surface-sunken">
        <ProjectScene id={project.id} width={640} className="h-auto w-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
        <h3 className="text-h3 text-ink group-hover:text-accent transition-colors duration-instant">
          {words.name}
        </h3>

        {variant === "calm" ? (
          <p className="text-body-sm text-ink-secondary line-clamp-2">
            {words.summary}
          </p>
        ) : null}

        <MetadataLine
          items={[
            copy.library.minutes(project.minutes),
            copy.library.difficulty[project.difficulty],
            copy.library.stepsCount(project.stepCount),
          ]}
        />

        {variant === "full" ? (
          <>
            {/* What is in the box. The count carries the fact; the marks make
                it scannable, which is why they are decorative. */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                {project.components.map((id) => (
                  <ComponentIcon key={id} id={id} size={22} />
                ))}
              </span>
              <span className="text-caption text-ink-tertiary shrink-0">
                {copy.library.partsCount(project.components.length)}
              </span>
            </div>

            <ul className="flex flex-wrap gap-1.5">
              {project.concepts.slice(0, CARD_CONCEPTS).map((id) => (
                <li
                  key={id}
                  className="bg-surface-sunken text-caption text-ink-secondary rounded-full px-2.5 py-1"
                >
                  {copy.concepts[id]}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          <StatusChip status={ready ? "ready" : "preview"}>
            {ready ? copy.status.ready : copy.status.preview}
          </StatusChip>

          {/* Not a button: the card is already the control. */}
          <span className="text-body-sm text-accent group-hover:text-accent-hover inline-flex shrink-0 items-center gap-1 font-medium transition-colors duration-instant">
            {ready ? copy.projectDetail.start : copy.library.viewProject}
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
