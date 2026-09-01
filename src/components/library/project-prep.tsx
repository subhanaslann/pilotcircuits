"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  ComponentChecklist,
  LibraryAgentSurface,
} from "@/components/library/project-blocks";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/status";
import { useBuildSession } from "@/components/build/build-provider";
import { useWebMcpTools } from "@/components/agent/use-webmcp";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import type { ComponentId, ProjectDef } from "@/lib/projects/catalog";

const DETAIL_TOOLS = ["get_project_requirements", "start_project"] as const;

/**
 * S-03 · The half of the project page you touch.
 *
 * P-05's checklist, the reassurance under it, and the two actions §5 asks for.
 * Everything above this on the page — the scene, the goals, the steps — is
 * server-rendered prose and stays there.
 *
 * **The checklist is local state, on purpose.** What is in someone's drawer is
 * not a fact about the build, it does not survive a reload in a product with no
 * database (§2), and no tool reads it: `get_project_requirements` answers from
 * the catalogue, which is the honest source — the agent is telling you what the
 * project needs, not what it imagines you own.
 *
 * **Nothing here blocks anything.** An unticked list still starts the build.
 * That was settled with CB3 in Batch 1 and it is why the summary line reports
 * rather than warns, and why the demo-mode notice is an `Alert` in the
 * editorial register instead of a boxed warning (rule 4): its job is to
 * reassure, and a warning-shaped container undoes that whatever the words say.
 */
export function ProjectPrep({ project }: { project: ProjectDef }) {
  const copy = useCopy();
  const router = useRouter();
  const session = useBuildSession();

  useWebMcpTools(DETAIL_TOOLS);

  const [checked, setChecked] = useState<ComponentId[]>([]);
  const [report, setReport] = useState<string | null>(null);

  const ready = project.status === "ready";
  const missing = project.components.length - checked.length;

  const toggle = (id: ComponentId) =>
    setChecked((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );

  /**
   * `Start build` — §18 has no room for a dead one.
   *
   * The clock starts here rather than on arrival at the bench, so the time the
   * summary reports is the time from the decision, not from the render. Then
   * `router.push` rather than a link: the session has to survive the move, and
   * a document load would take it with it.
   */
  const start = () => {
    session.start();
    router.push(`/workbench/${project.slug}`);
  };

  /**
   * `Ask agent to check my kit` — the same tool the browser can call.
   *
   * It answers with the checklist's own count rather than a second phrasing of
   * it: two ways of saying `3 parts missing` on one screen is one too many, and
   * the numbers would be the first thing to disagree.
   */
  const askAgent = async () => {
    await session.run("get_project_requirements", { project: project.slug });
    setReport(
      missing === 0
        ? copy.projectDetail.allPresent
        : missing === 1
          ? copy.projectDetail.missingOne
          : copy.projectDetail.missingMany(missing),
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-h3 text-ink mb-3">{copy.projectDetail.required}</h2>
        <ComponentChecklist
          components={project.components}
          checked={checked}
          onToggle={toggle}
        />
      </div>

      {report ? (
        <Alert tone="info" title={copy.projectDetail.kitReport}>
          {report} · {copy.projectDetail.kitReportHint}
        </Alert>
      ) : null}

      <Alert tone="info" title={copy.projectDetail.demoModeNotice}>
        {copy.projectDetail.demoModeDetail}
      </Alert>

      {/* §9's unavailable sentence, and the two hosts a refused tool call needs
          to be seen at all. See `LibraryAgentSurface`. */}
      <LibraryAgentSurface />

      {ready ? (
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={start}
            iconRight={
              <ArrowRight
                size={icon.sm}
                strokeWidth={icon.strokeWidth}
                aria-hidden="true"
              />
            }
          >
            {copy.projectDetail.start}
          </Button>
          <Button
            variant="tertiary"
            onClick={() => void askAgent()}
            loading={session.busy}
            iconLeft={
              <Sparkles
                size={icon.sm}
                strokeWidth={icon.strokeWidth}
                aria-hidden="true"
              />
            }
          >
            {copy.projectDetail.askAgent}
          </Button>
        </div>
      ) : (
        /* A preview has no workbench, so it gets no `Start build` — a faded
           button pointing at a 404 is the dead control §18 rules out. The one
           action it can honestly offer is the one that reads the catalogue. */
        <Button
          variant="secondary"
          onClick={() => void askAgent()}
          loading={session.busy}
          iconLeft={
            <Sparkles
              size={icon.sm}
              strokeWidth={icon.strokeWidth}
              aria-hidden="true"
            />
          }
        >
          {copy.projectDetail.askAgent}
        </Button>
      )}
    </div>
  );
}
