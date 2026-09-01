import type { Copy } from "@/content/i18n";
import type { Line } from "@/lib/agent/line";
import { libraryTools, type LibraryTool } from "@/lib/agent/model";
import {
  refused,
  type ToolContext,
  type ToolOutcome,
} from "@/lib/agent/services";
import {
  componentIds,
  projects,
  type ComponentId,
  type ConceptId,
  type Difficulty,
  type ProjectDef,
  type ProjectId,
} from "@/lib/projects/catalog";
import {
  conceptIds,
  difficulties,
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

/**
 * A project id or its slug — an agent may reasonably have either.
 *
 * Folded rather than compared exactly: `TRAFFIC-LIGHT` used to be refused while
 * `traffic-light` and `trafficLight` both resolved, which is a distinction
 * nothing in the product makes anywhere else. Both vocabularies are ASCII, so
 * the invariant fold is the right one here — this is an identifier, not a
 * person's search term (`filterProjects` folds with the reader's locale for
 * exactly that reason).
 */
function resolve(reference: string): ProjectDef | undefined {
  if (typeof reference !== "string") return undefined;
  const wanted = reference.toLowerCase();
  return projects.find(
    (project) =>
      project.slug.toLowerCase() === wanted ||
      project.id.toLowerCase() === wanted,
  );
}

/**
 * One argument of `find_projects`, checked before it is written anywhere.
 *
 * Nothing validated these and the tool writes them **into the library's visible
 * toolbar** — the same state the person's own clicks write. Three separate
 * failures came out of that: `max_minutes: "twenty"` returned every project
 * (`NaN` compares false) and left the duration button reading `Up to twenty
 * min`; `difficulty: {}` was written into state and the toolbar then called
 * `.includes` on a non-array, so the next click on the Difficulty popover threw
 * during render; and a typo'd component id answered `0 projects match`, which is
 * the same answer an honest empty query gives.
 *
 * A tool call must never be able to leave a route that throws on the next click.
 */
type Refusal = { argument: string; value: unknown; valid?: readonly string[] };

function wordList<T extends string>(
  argument: string,
  value: unknown,
  vocabulary: readonly T[],
): T[] | Refusal {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return { argument, value, valid: vocabulary };
  const bad = value.find(
    (entry) =>
      typeof entry !== "string" || !(vocabulary as readonly string[]).includes(entry),
  );
  if (bad !== undefined) return { argument, value: bad, valid: vocabulary };
  return value as T[];
}

function isRefusal(value: unknown): value is Refusal {
  return (
    typeof value === "object" && value !== null && "argument" in value
  );
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

    /**
     * Checked first, and only then written.
     *
     * The narrowing is **replacement**, deliberately: the effect carries a whole
     * `ProjectFilters`, and replacement is the only semantic under which a tool
     * can *clear* a filter — an agent asked to widen a search has to be able to.
     * What was missing is not the merge, it is the check.
     */
    const raw = input as Record<string, unknown>;

    const search = raw.search ?? "";
    if (typeof search !== "string") {
      return refused("unknownFilter", { argument: "search", value: search });
    }

    const maxMinutes = raw.max_minutes ?? null;
    if (
      maxMinutes !== null &&
      (typeof maxMinutes !== "number" ||
        !Number.isFinite(maxMinutes) ||
        maxMinutes < 0)
    ) {
      return refused("unknownFilter", {
        argument: "max_minutes",
        value: maxMinutes,
      });
    }

    const readyOnly = raw.ready_only ?? false;
    if (typeof readyOnly !== "boolean") {
      return refused("unknownFilter", {
        argument: "ready_only",
        value: readyOnly,
      });
    }

    const difficulty = wordList("difficulty", raw.difficulty, difficulties);
    if (isRefusal(difficulty)) {
      return refused("unknownFilter", { ...difficulty });
    }
    const components = wordList("components", raw.components, componentIds);
    if (isRefusal(components)) {
      return refused("unknownFilter", { ...components });
    }
    const concepts = wordList("concepts", raw.concepts, conceptIds);
    if (isRefusal(concepts)) {
      return refused("unknownFilter", { ...concepts });
    }

    await ctx.phase({ ns: "phases", k: "searchingProjects" }, 340);

    const next: ProjectFilters = {
      ...noFilters,
      search,
      difficulty,
      maxMinutes,
      components,
      concepts,
      readyOnly,
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
   * The only library tool that changes anything, and today it never refuses.
   *
   * It was written when one chapter had a bench and the rest were previews, and
   * the comment here said so. All six are `ready` now and all six have a row in
   * the builds registry — `builds.ts` throws at boot if those two ever disagree
   * — so the `projectNotReady` branch below is unreachable, and so is the
   * preview screen `ProjectPrep` renders in its place. Both are kept as the seam
   * a seventh chapter needs on the day it is added as a preview; neither has
   * ever run.
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
