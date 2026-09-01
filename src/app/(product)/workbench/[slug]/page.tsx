import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkbenchRoute } from "@/components/workbench/workbench-route";
import { getServerCopy } from "@/content/copy-server";
import { buildBySlug } from "@/lib/agent/builds";

export async function generateMetadata(
  props: PageProps<"/workbench/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const build = buildBySlug(slug);
  if (!build) return {};
  return { title: (await getServerCopy()).projects[build.projectId].name };
}

/**
 * S-04 · `/workbench/[slug]` — the workbench, on its own route.
 *
 * Only a build that has one gets one. The chapters without a bench are
 * honestly labelled previews everywhere else in the product, and a workbench
 * URL that opened an empty bench for them would be the first place that
 * stopped being true — so a benchless slug is a `404` rather than a
 * disappointment.
 *
 * The page itself is thin on purpose. Everything that makes this screen the
 * hardest one in the product — four regions that each fill their own track, a
 * canvas that measures itself exactly once — lives in `WorkbenchFrame` and was
 * settled in Batch 7. What this route adds is the two things a route can add:
 * the height to fill and the two doors out of it.
 */
export default async function WorkbenchPage(
  props: PageProps<"/workbench/[slug]">,
) {
  const { slug } = await props.params;
  const build = buildBySlug(slug);

  /* No bench, no route. The registry is the single answer to "does this
     chapter have a workshop" — the catalogue's `status` says the same thing
     and the two are checked against each other in `@/lib/agent/builds`. */
  if (!build) notFound();

  return <WorkbenchRoute slug={slug} projectId={build.projectId} />;
}
