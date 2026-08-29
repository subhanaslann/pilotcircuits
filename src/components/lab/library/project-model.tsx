import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { Chip, StatusChip } from "@/components/ui/badge";
import { MonoValue } from "@/components/ui/text";
import { getServerCopy } from "@/content/copy-server";
import { componentIds, projects, type ConceptId } from "@/lib/projects/catalog";

/**
 * The catalogue, rendered plainly.
 *
 * Not a material — a proof. Every widget in this batch reads from this data, so
 * before any of them is drawn it is worth seeing the whole table in both
 * languages at once: seven names, ten components, twelve concepts, and nothing
 * left as a placeholder.
 */
export async function ProjectModel() {
  const copy = await getServerCopy();
  const t = copy.lab.libraryLab.model;

  const conceptIds = Object.keys(copy.concepts) as ConceptId[];

  return (
    <>
      <LabBlock title={t.title} note={t.note}>
        <LabStage className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">{t.tableCaption}</caption>
            <thead>
              <tr className="border-border border-b">
                {[
                  t.colProject,
                  t.colStatus,
                  t.colTime,
                  t.colLevel,
                  t.colSteps,
                  t.colParts,
                  t.colConcepts,
                ].map((head) => (
                  <th
                    key={head}
                    scope="col"
                    className="text-overline text-ink-tertiary px-4 py-3 font-medium uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const words = copy.projects[project.id];
                return (
                  <tr
                    key={project.id}
                    className="border-border/70 border-b last:border-0"
                  >
                    <th
                      scope="row"
                      className="max-w-[260px] px-4 py-3 font-normal"
                    >
                      <span className="text-body-sm text-ink block font-medium">
                        {words.name}
                      </span>
                      <span className="text-caption text-ink-tertiary block leading-snug">
                        {words.summary}
                      </span>
                    </th>
                    <td className="px-4 py-3">
                      {/* A-03's presets rather than a bare badge: the glyph is
                          the second signal rule 7 asks for, and `ready` and
                          `preview` are already defined there. */}
                      <StatusChip
                        status={
                          project.status === "ready" ? "ready" : "preview"
                        }
                      >
                        {project.status === "ready"
                          ? copy.status.ready
                          : copy.status.preview}
                      </StatusChip>
                    </td>
                    <td className="text-body-sm text-ink-secondary px-4 py-3">
                      {copy.library.minutes(project.minutes)}
                    </td>
                    <td className="text-body-sm text-ink-secondary px-4 py-3">
                      {copy.library.difficulty[project.difficulty]}
                    </td>
                    <td className="px-4 py-3">
                      <MonoValue tone="quiet">{project.stepCount}</MonoValue>
                    </td>
                    <td className="px-4 py-3">
                      <MonoValue tone="quiet">
                        {project.components.length}
                      </MonoValue>
                    </td>
                    <td className="px-4 py-3">
                      <MonoValue tone="quiet">
                        {project.concepts.length}
                      </MonoValue>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.vocabularyTitle} note={t.vocabularyNote}>
        <LabStage>
          <div className="flex flex-wrap gap-2">
            {componentIds.map((id) => (
              <Chip key={id}>{copy.components[id]}</Chip>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.conceptsTitle} note={t.conceptsNote}>
        <LabStage>
          <div className="flex flex-wrap gap-2">
            {conceptIds.map((id) => (
              <Chip key={id}>{copy.concepts[id]}</Chip>
            ))}
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
