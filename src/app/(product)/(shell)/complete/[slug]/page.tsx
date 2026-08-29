import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuildSummary } from "@/components/complete/summary-blocks";
import { Breadcrumb } from "@/components/ui/nav";
import { getServerCopy } from "@/content/copy-server";
import { projectBySlug } from "@/lib/projects/catalog";

export async function generateMetadata(
  props: PageProps<"/complete/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = projectBySlug(slug);
  if (!project) return {};
  return { title: (await getServerCopy()).complete.title };
}

/**
 * S-05 · `/complete/[slug]` — Completion and learning summary.
 *
 * The only screen in Batch 8 that is genuinely new rather than assembled. Its
 * words have been in the dictionary since Batch 0 (`copy.complete.*`) and
 * nothing read them until now, because nothing could: the four figures §5 asks
 * for need a build that survived the walk from the workbench, which is what the
 * provider added.
 *
 * Same route guard as the workbench. A preview project has no build to finish,
 * so it has no summary either.
 *
 * The heading is the product's, and it is unusual for this product in being
 * warm: `You didn't just finish it. You learned how it works.` §17 wrote that
 * sentence and the whole screen exists to have earned it.
 */
export default async function CompletePage(
  props: PageProps<"/complete/[slug]">,
) {
  const { slug } = await props.params;
  const project = projectBySlug(slug);

  if (!project || project.status !== "ready") notFound();

  const copy = await getServerCopy();
  const words = copy.projects[project.id];

  return (
    <main className="pt-6 pb-20">
      <Breadcrumb
        items={[
          { label: copy.library.title, href: "/projects" },
          { label: words.name, href: `/projects/${project.slug}` },
          { label: copy.complete.title },
        ]}
      />

      <div className="mt-8 max-w-[900px]">
        <h1 className="text-h1 text-ink">{copy.complete.title}</h1>
        <p className="text-body-lg text-ink-secondary mt-3 max-w-prose">
          {copy.complete.sub}
        </p>

        <BuildSummary project={project} />
      </div>
    </main>
  );
}
