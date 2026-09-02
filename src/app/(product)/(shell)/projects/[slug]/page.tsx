import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectScene } from "@/components/illustration/project-scenes";
import {
  LearningGoals,
  PreviewNotice,
  StepPreview,
} from "@/components/library/project-blocks";
import { ProjectPrep } from "@/components/library/project-prep";
import { StatusChip } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/nav";
import { MetadataLine } from "@/components/ui/text";
import { getServerCopy } from "@/content/copy-server";
import { toProgressSteps } from "@/lib/agent/steps";
import { buildBySlug } from "@/lib/agent/builds";
import { projectBySlug } from "@/lib/projects/catalog";

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = projectBySlug(slug);
  if (!project) return {};
  const copy = await getServerCopy();
  return {
    title: copy.projects[project.id].name,
    description: copy.projects[project.id].summary,
  };
}

/**
 * S-03 · `/projects/[slug]` — Project detail and preparation.
 *
 * One route for all six chapters, and every one of them is `ready`: the step
 * strip below is that chapter's own list, read from its entry in the bench
 * registry. The `preview` branches stay because the catalogue's
 * `ProjectStatus` still admits the state and P-11's notice was drawn for it —
 * a chapter can be announced before its bench exists — but nothing in the
 * catalogue is in that state today, and `@/lib/agent/builds` throws in
 * development if `status` and the registry ever disagree.
 *
 * Two columns because §5 asks for a page that is information-dense and still
 * comfortable: the left one is what the build *is*, the right one is what you
 * need before you start it.
 */
export default async function ProjectDetailPage(
  props: PageProps<"/projects/[slug]">,
) {
  const { slug } = await props.params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  const copy = await getServerCopy();
  const words = copy.projects[project.id];
  const ready = project.status === "ready";

  /* **This chapter's** steps, so the preview cannot promise a build the bench
     does not deliver. Statuses are irrelevant here — the strip renders names
     and durations — so the list is asked for from its own first step.

     It used to be the literal `"kit"`, which is the parking barrier's opening
     step, and `stepsOwning` answers the barrier's list for any id it does not
     recognise. So `/projects/breathing-lamp` printed "4 steps · 3 parts" in the
     summary and then listed the barrier's seven underneath it — the one screen
     in the product that stated something untrue. The `?? "kit"` fallback is
     for a slug the registry does not know, which `notFound()` above has
     already ruled out — every chapter has a bench, so it never runs. */
  const steps = toProgressSteps(
    copy,
    buildBySlug(slug)?.activeStepId ?? "kit",
    [],
    [],
  );

  return (
    <main className="pt-6 pb-20">
      <Breadcrumb
        items={[
          { label: copy.library.title, href: "/projects" },
          { label: words.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 text-ink">{words.name}</h1>
            <StatusChip status={ready ? "ready" : "preview"}>
              {ready ? copy.status.ready : copy.status.preview}
            </StatusChip>
          </div>

          <p className="text-body-lg text-ink-secondary mt-3 max-w-prose">
            {words.summary}
          </p>

          <MetadataLine
            className="mt-3"
            items={[
              copy.library.minutes(project.minutes),
              copy.library.difficulty[project.difficulty],
              copy.library.stepsCount(project.stepCount),
              copy.library.partsCount(project.components.length),
            ]}
          />

          {/* P-09 · not a second drawing: the card's scene, at hero size. */}
          <div className="bg-surface-sunken border-border mt-7 grid place-items-center overflow-hidden rounded-xl border py-6">
            <ProjectScene id={project.id} width={520} />
          </div>

          {!ready ? <PreviewNotice className="mt-6" /> : null}

          <LearningGoals
            className="mt-10"
            concepts={project.concepts.map((id) => copy.concepts[id])}
          />

          {ready ? (
            <StepPreview steps={steps} className="mt-10" />
          ) : (
            <p className="text-body-sm text-ink-tertiary mt-10 max-w-prose">
              {copy.projectDetail.previewNoSteps}
            </p>
          )}
        </div>

        {/* Sticks below the top bar, which is `--spacing-topbar` tall and gives
            Tailwind `top-topbar` for free. The breathing room above the column
            is padding rather than a `calc()` in the offset: an arbitrary value
            wrapping the custom property produced invalid CSS. */}
        <div className="lg:sticky lg:top-topbar lg:self-start lg:pt-6">
          <ProjectPrep project={project} />
        </div>
      </div>
    </main>
  );
}
