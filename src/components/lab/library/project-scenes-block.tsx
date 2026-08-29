import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { ProjectScene } from "@/components/illustration/project-scenes";
import { getServerCopy } from "@/content/copy-server";
import { featuredProjectId, projects } from "@/lib/projects/catalog";

/**
 * P-02 · P-09, reviewed the only way they can be: all seven in one row.
 */
export async function ProjectScenes() {
  const copy = await getServerCopy();
  const t = copy.lab.libraryLab.scenes;

  return (
    <>
      <LabBlock title={t.setTitle} note={t.setNote}>
        <LabStage>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {projects.map((project) => (
              <li key={project.id} className="space-y-2">
                <ProjectScene id={project.id} width={180} />
                <p className="text-caption text-ink-secondary">
                  {copy.projects[project.id].name}
                </p>
              </li>
            ))}
          </ul>
        </LabStage>
        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {t.reviewNote}
        </p>
      </LabBlock>

      <LabBlock title={t.heroTitle} note={t.heroNote}>
        <LabStage>
          <ProjectScene id={featuredProjectId} width={420} />
        </LabStage>
      </LabBlock>
    </>
  );
}
