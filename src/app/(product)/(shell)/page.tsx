import { HowItWorks } from "@/components/library/project-blocks";
import { ProjectCard } from "@/components/library/project-card";
import { ContinueSection } from "@/components/shell/continue-section";
import { getServerCopy } from "@/content/copy-server";
import { featuredProjectId, projects } from "@/lib/projects/catalog";

/**
 * S-01 · `/` — Dashboard.
 *
 * §5 is explicit about what this screen is not: "no unnecessarily large
 * marketing hero. The user approaches the product experience directly." So the
 * heading, the sentence under it and the two actions take one screenful, and
 * the rest is the product — a build to continue, six more to pick from, and
 * three lines about how any of it works.
 *
 * Almost nothing here is new. `ContinueCard`, `ProjectCard` and `HowItWorks`
 * were approved in Batch 6 and arrive with real content; what Batch 8 supplies
 * is the arrangement and, at last, `href`s that go somewhere.
 *
 * A server component apart from one island: the copy is read from the cookie at
 * request time, so the first paint is already in the reader's language, and the
 * cards render without shipping the catalogue to the browser twice.
 */
export default async function DashboardPage() {
  const copy = await getServerCopy();
  const suggested = projects.filter((p) => p.id !== featuredProjectId);

  return (
    <main className="pt-12 pb-20">
      {/* Rule 4: the product's own voice needs no container. */}
      <h1 className="text-h1 text-ink max-w-[20ch] text-balance">
        {copy.dashboard.heading}
      </h1>
      <p className="text-body-lg text-ink-secondary mt-3 max-w-prose">
        {copy.dashboard.sub}
      </p>

      <ContinueSection />

      <section className="mt-16" aria-labelledby="suggested">
        <h2 id="suggested" className="text-h2 text-ink">
          {copy.dashboard.suggested}
        </h2>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {suggested.map((project) => (
            <li key={project.id} className="flex">
              <ProjectCard
                project={project}
                copy={copy}
                href={`/projects/${project.slug}`}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      </section>

      <HowItWorks className="mt-16 max-w-[900px]" />
    </main>
  );
}
