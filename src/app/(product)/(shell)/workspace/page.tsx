"use client";

import { useState } from "react";
import { useWebMcpTools } from "@/components/agent/use-webmcp";
import { ComponentIcon } from "@/components/illustration/component-icons";
import { CoachWebMcp } from "@/components/workspace/coach-webmcp";
import { KitCase } from "@/components/workspace/kit-case";
import { ProjectButtons } from "@/components/workspace/project-buttons";
import { StartBuild } from "@/components/workspace/start-build";
import { useCopy } from "@/content/copy-provider";
import type { AgentTool } from "@/lib/agent/model";
import {
  firstChapterId,
  projectById,
  type ProjectId,
} from "@/lib/projects/catalog";

/**
 * W · `/workspace` — the picker behind the bench's Back button.
 *
 * Nothing links here from the entry screen or the nav: the landing's doors go
 * straight to `/workbench/[slug]` and the nav carries `/` and `/projects`. The
 * one way in is `Back` on the bench (`workbench-route.tsx`), so this is where
 * a person lands on leaving a build — and it is a screen for choosing the next
 * one. (This header used to call it "the way into the bench"; nothing ever
 * sent anyone here first.)
 *
 * Three columns, the way the sketch asks for them: the builds on the left as
 * pressable cards, the selected build's kit in the middle inside a case you
 * open, the agent on the right.
 *
 * **The case is the screen.** Everything else is a rail or a panel; the middle
 * is one physical object that answers one question — *what is in this kit* —
 * and it answers it by opening, which is the only honest way to show the inside
 * of a box. Pressing it is the interaction, and the inventory printed under it
 * is the same list in words, because a drawing cannot be read by everyone and
 * §18 does not allow the picture to be the only place a fact lives.
 *
 * The way in lives at the foot of the third column and names the bench it
 * opens — see `StartBuild`. (When five chapters were `preview`, this column
 * also carried a note saying so; all six have a bench now, and the note went
 * with the branch that showed it.)
 */
/**
 * §9's route table, one row: the two tools this screen can honour.
 *
 * `get_project_requirements` answers from the catalogue and has no effect to
 * land — the kit in the middle column is the same list as a drawing — and
 * `start_project`'s `navigate` reaches `BuildProvider`'s `router.push`, which
 * is the door `StartBuild` opens. Until this pass the route registered
 * nothing, beside a panel whose headline is that this page can talk to the
 * agent: a judge pressing Back on the bench arrived at the one screen that
 * explains WebMCP with an agent that had nothing to call there. Not
 * `find_projects` — the toolbar it narrows is not mounted here — and not
 * `open_project`, whose detail screen belongs to the library at `/projects`.
 */
const WORKSPACE_TOOLS: readonly AgentTool[] = [
  "get_project_requirements",
  "start_project",
];

export default function WorkspacePage() {
  const copy = useCopy();

  /* Inside `BuildProvider` (`app/(product)/layout.tsx`), so the calls land in
     the build the product is carrying — the same session `Back` just left. */
  useWebMcpTools(WORKSPACE_TOOLS);

  const [selectedId, setSelectedId] = useState<ProjectId>(firstChapterId);
  const [caseOpen, setCaseOpen] = useState(false);

  const project = projectById(selectedId);
  const words = copy.projects[selectedId];

  return (
    <div className="grid gap-8 py-6 lg:h-[calc(100dvh-var(--spacing-topbar))] lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:overflow-hidden">
      {/* --- The rail ---------------------------------------------------- */}
      <section
        aria-labelledby="ws-projects"
        className="flex min-h-0 min-w-0 flex-col"
      >
        <h2
          id="ws-projects"
          className="font-condensed text-ink border-border mb-4 shrink-0 border-b pb-2.5 text-[17px] leading-none font-bold tracking-[0.07em] uppercase"
        >
          {copy.workspace.projects}
        </h2>
        <ProjectButtons
          selected={selectedId}
          onSelect={setSelectedId}
          className="flex-1"
        />
      </section>

      {/* --- The case ---------------------------------------------------- */}
      <section
        aria-labelledby="ws-kit"
        className="flex min-h-0 min-w-0 flex-col"
      >
        <div className="border-border mb-4 flex shrink-0 items-end gap-3 border-b pb-2.5">
          <h2
            id="ws-kit"
            className="font-condensed text-ink min-w-0 flex-1 truncate text-[17px] leading-none font-bold tracking-[0.07em] uppercase"
          >
            {copy.workspace.caseCaption(words.name)}
          </h2>
          <span className="text-mono-sm text-ink-tertiary tnum shrink-0 font-mono">
            {copy.library.partsCount(project.components.length)}
          </span>
        </div>

        {/* The case takes the height that is left rather than the width it is
            given. On a screen that does not scroll the two are not the same
            claim: opening the case brings the inventory in under it, and the
            drawing has to give up the room for it. `KitCase` letterboxes inside
            whatever box it is handed, so the case shrinks and nothing moves. */}
        <div className="mx-auto flex min-h-0 w-full max-w-[620px] flex-1 flex-col">
          <KitCase
            components={project.components}
            open={caseOpen}
            onToggle={() => setCaseOpen((was) => !was)}
            label={caseOpen ? copy.workspace.closeCase : copy.workspace.openCase}
            className="min-h-0 flex-1"
          />
          {/* The hint is the affordance the drawing cannot carry on its own. It
              goes away once the case has been opened, because at that point it
              is telling you something you have just done. */}
          <p
            aria-hidden={caseOpen}
            className="font-condensed text-ink-tertiary duration-quick mt-2 shrink-0 text-center text-[13px] leading-none tracking-[0.08em] uppercase transition-opacity"
            style={{ opacity: caseOpen ? 0 : 1 }}
          >
            {copy.workspace.caseHint}
          </p>
        </div>

        {/* The inventory: the same kit, in words. Revealed with the case, so
            the list and the drawing always say the same thing. */}
        <div
          id="ws-inventory"
          hidden={!caseOpen}
          className="motion-rise border-border mt-5 shrink-0 border-t pt-4"
        >
          <h3 className="text-overline text-ink-tertiary mb-3 uppercase">
            {copy.workspace.inventory}
          </h3>
          <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
            {project.components.map((id) => (
              <li
                key={id}
                className="border-border/70 flex items-center gap-2.5 border-b py-2"
              >
                <ComponentIcon id={id} size={26} />
                <span className="text-body-sm text-ink-secondary min-w-0 truncate">
                  {copy.components[id]}
                </span>
              </li>
            ))}
          </ul>

        </div>
      </section>

      {/* --- What the agent is, and the way in ------------------------------
          The panel takes its natural height, not the column's: its last line is
          the point of it and has to sit under the list it concludes, not pinned
          to the bottom of a tall box with a hand's width of nothing above it.
          Which leaves the foot of this column free for the one control that
          takes you off this screen. */}
      <div className="flex min-h-0 min-w-0 flex-col gap-6">
        <CoachWebMcp />
        <StartBuild selected={project} />
      </div>
    </div>
  );
}
