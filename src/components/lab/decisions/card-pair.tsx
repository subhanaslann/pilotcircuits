import { LabStage } from "@/components/lab/lab-primitives";
import { ProjectCard } from "@/components/library/project-card";
import type { ProjectCardVariant } from "@/components/library/project-card";
import type { Copy } from "@/content/i18n";
import { projects } from "@/lib/projects/catalog";

/**
 * P-01, with all seven projects on each side.
 *
 * Seven is not a display choice, it is the test. A single card of either
 * direction looks fine; what the question turns on is what a shelf of them
 * reads like, and cutting the shelf down to fit a comparison would remove the
 * only thing worth comparing.
 */
export function CardGrid({
  variant,
  copy,
}: {
  variant: ProjectCardVariant;
  copy: Copy;
}) {
  /* Capped at the library page's own measure. The comparison has to happen at
     the width the grid was judged at — widen it and seven cards fall into one
     row, which is a different picture of the same seven. */
  return (
    <LabStage className="bg-app max-w-[1080px]">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] items-stretch gap-4">
        {projects.map((project) => (
          <li key={project.id} className="flex">
            <ProjectCard
              project={project}
              copy={copy}
              variant={variant}
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </LabStage>
  );
}
