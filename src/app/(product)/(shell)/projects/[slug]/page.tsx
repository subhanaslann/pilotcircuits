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
 * **All seven get one.** The inventory names only Smart Parking Barrier here,
 * but P-11's `Preview project` notice was drawn for the other six and a single
 * static route would leave it as material nothing renders — and would leave six
 * cards in the library linking nowhere, which is the dead control §18 rules out
 * from the other direction.
 *
 * What a preview does *not* get is a step list. `buildSteps` describes one
 * build; the other six have a `stepCount` and no definitions, and writing seven
 * plausible-sounding step names would be exactly the placeholder §17 rules out.
 * They get their goals, their parts and an honest sentence about why the list
 * is not there.
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

  /* The same seven the workbench rail draws, so the preview cannot promise a
     build the bench does not deliver. Statuses are irrelevant here — the strip
     renders names and durations — so the list is asked for from the start. */
  const steps = toProgressSteps(copy, "kit", [], []);

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
