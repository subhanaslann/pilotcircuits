import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { ProjectCard } from "@/components/library/project-card";
import { getServerCopy } from "@/content/copy-server";
import { projects } from "@/lib/projects/catalog";
import type { ProjectCardVariant } from "@/components/library/project-card";
import type { Copy } from "@/content/i18n";

function Grid({ variant, copy }: { variant: ProjectCardVariant; copy: Copy }) {
  return (
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
  );
}

/**
 * P-01, both ways, with all seven projects in each grid.
 *
 * Seven is the number that matters. A single card of either direction looks
 * fine; the question is what a shelf of them reads like.
 */
export async function CardDirections() {
  const copy = await getServerCopy();
  const t = copy.lab.libraryLab.cards;

  return (
    <>
      <LabBlock title={t.fullTitle} note={t.fullNote}>
        <LabStage className="bg-app">
          <Grid variant="full" copy={copy} />
        </LabStage>
      </LabBlock>

      <LabBlock title={t.calmTitle} note={t.calmNote}>
        <LabStage className="bg-app">
          <Grid variant="calm" copy={copy} />
        </LabStage>
      </LabBlock>

      <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
        {t.verdictNote}
      </p>
      <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
        {t.linkNote}
      </p>
    </>
  );
}
