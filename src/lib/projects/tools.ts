import type { Copy } from "@/content/i18n";
import type { Line } from "@/lib/agent/line";
import { libraryTools, type LibraryTool } from "@/lib/agent/model";
import type { ToolContext, ToolOutcome } from "@/lib/agent/services";
import {
  projectBySlug,
  projects,
  type ComponentId,
  type ConceptId,
  type Difficulty,
  type ProjectDef,
  type ProjectId,
} from "@/lib/projects/catalog";
import {
  filterProjects,
  noFilters,
  type ProjectFilters,
} from "@/lib/projects/filter";

/**
 * Batch 8 · §9 · The four tools that belong to the library, not the bench.
 *
 * `frontend-plan.md` §9 splits the product's tools by the screen that can act
 * on them — "tools are registered only on the pages where they can be used" —
 * and these four are the half that was never built. They live in their own file
 * for the same reason the workbench six live in `agent/services.ts`: one
 * screen's vocabulary per file.
 *
 * They share everything else. Same `(input, ctx) => ToolOutcome` shape, same
 * rule that effects are **data** rather than calls, same activity log. Two of
 * them navigate, and navigation is exactly where the rule earns its keep — a
 * handler that reached for `useRouter` could only ever run inside a component,
 * and the browser calls these directly.
 *
 * Nothing here imports React.
 */

/** A project id or its slug — an agent may reasonably have either. */
function resolve(reference: string): ProjectDef | undefined {
  const bySlug = projectBySlug(reference);
  if (bySlug) return bySlug;
  return projects.find((project) => project.id === reference);
}

/** What a project looks like to a caller that cannot see the screen. */
function describe(project: ProjectDef, copy: Copy) {
  const words = copy.projects[project.id];
  return {
    id: project.id,
    slug: project.slug,
    name: words.name,
    summary: words.summary,
    minutes: project.minutes,
    difficulty: project.difficulty,
    status: project.status,
    stepCount: project.stepCount,
    components: project.components.map((id) => ({
      id,
      name: copy.components[id],
    })),
    concepts: project.concepts.map((id) => ({ id, name: copy.concepts[id] })),
  };
}

export interface LibraryToolInputs {
  find_projects: {
    search?: string;
    difficulty?: Difficulty[];
    max_minutes?: number;
    components?: ComponentId[];
    concepts?: ConceptId[];
    ready_only?: boolean;
  };
  open_project: { project: string };
  get_project_requirements: { project: string };
  start_project: { project: string; mode?: "guided" | "demo" };
}

type LibraryHandlers = {
  [K in keyof LibraryToolInputs]: (
    input: LibraryToolInputs[K],
    ctx: ToolContext,
  ) => Promise<ToolOutcome>;
};

const notFound: ToolOutcome = {
  status: "error",
  errorMessage: { ns: "errors", k: "unknownProject" },
};

export const libraryHandlers: LibraryHandlers = {
  /**
   * The same narrowing the toolbar does, because it is literally the same
   * function. §9's example question — *find me a build that uses a servo I
   * already own* — is a `components: ["servo"]` away, and the answer cannot
   * disagree with the grid because neither side has its own copy of the rule.
   */
  async find_projects(input, ctx) {
    const copy = ctx.copy;
    await ctx.phase({ ns: "phases", k: "searchingProjects" }, 340);

    const next: ProjectFilters = {
      ...noFilters,
      search: input.search ?? "",
      difficulty: input.difficulty ?? [],
      maxMinutes: input.max_minutes ?? null,
      components: input.components ?? [],
      concepts: input.concepts ?? [],
      readyOnly: input.ready_only ?? false,
    };

    /* The locale matters: `İstasyon` folds differently under Turkish rules, and
       a search run with the wrong ones misses a Turkish name. `ctx.copy` is the
       reader's dictionary, so the reader's locale is the right one to fold
       with — the agent is searching the library the person is looking at. */
    const found = filterProjects(next, copy, ctx.locale);

    return {
      status: "ok",
      result: {
        filters: next,
        count: found.length,
        projects: found.map((project) => describe(project, copy)),
        source: "demo",
      },
      /* Rule 6: the toolbar moves, so the search is something you watched
         happen rather than something you were told about. */
      effects: [{ kind: "filters", next }],
      note: {
        headline: {
          ns: "activity",
          k: "projectsFound",
          args: [found.length],
        },
        tone: found.length ? "found" : undefined,
      },
    };
  },

  async open_project({ project: reference }, ctx) {
    const project = resolve(reference);
    if (!project) return notFound;

    await ctx.phase({ ns: "phases", k: "readingProject" }, 220);

    return {
      status: "ok",
      result: { ...describe(project, ctx.copy), source: "demo" },
      effects: [{ kind: "navigate", href: `/projects/${project.slug}` }],
    };
  },

  /**
   * Read-only, and the one tool on the detail screen the person can also fire
   * themselves: `Ask agent to check my kit` runs exactly this.
   */
  async get_project_requirements({ project: reference }, ctx) {
    const project = resolve(reference);
    if (!project) return notFound;

    await ctx.phase({ ns: "phases", k: "readingProject" }, 320);

    return {
      status: "ok",
      result: { ...describe(project, ctx.copy), source: "demo" },
    };
  },

  /**
   * The only library tool that changes anything, and it refuses more often than
   * it agrees: six of the seven projects are previews, and opening a workbench
   * for one of them would be the product's first outright lie.
   *
   * `mode` is accepted and recorded rather than acted on, because in this phase
   * there is nothing to act on: the board is simulated either way and the kit
   * checklist never blocked anything (P-05). Rejecting the argument would be
   * worse — an agent asking for `demo` is asking for what it already gets.
   */
  async start_project({ project: reference }, ctx) {
    const project = resolve(reference);
    if (!project) return notFound;

    if (project.status !== "ready") {
      return {
        status: "error",
        errorMessage: { ns: "errors", k: "projectNotReady" },
      };
    }

    await ctx.phase({ ns: "phases", k: "readingProject" }, 260);
    const state = ctx.read();

    return {
      status: "ok",
      result: {
        ...describe(project, ctx.copy),
        workbench: `/workbench/${project.slug}`,
        source: "demo",
      },
      /* Idempotent by hand, the way `build/start` is by construction: an agent
         calling this twice must not restart the clock the summary reads. */
      patch: state.startedAt === null ? { startedAt: Date.now() } : undefined,
      effects: [{ kind: "navigate", href: `/workbench/${project.slug}` }],
      note: { headline: { ns: "activity", k: "buildStarted" }, tone: "passed" },
    };
  },
};

/** The sentence an entry opens with, before the call has finished. */
export function libraryHeadlineFor<K extends keyof LibraryToolInputs>(
  name: K,
): Line {
  switch (name) {
    case "find_projects":
      return { ns: "activity", k: "searchedProjects" };
    case "open_project":
      return { ns: "activity", k: "openedProject" };
    case "start_project":
      return { ns: "activity", k: "startedProject" };
    default:
      return { ns: "activity", k: "readRequirements" };
  }
}

export function isLibraryTool(name: string): name is LibraryTool {
  return (libraryTools as readonly string[]).includes(name);
}

export type { ProjectId };
