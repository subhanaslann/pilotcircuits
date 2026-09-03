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
 * §9 splits the product's tools by the screen that can act
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

/**
 * The refusal, said and structured from one argument name.
 *
 * Six call sites, and the sentence names the filter that was wrong — so the
 * name has to be the same one the payload reports or the toast and the tool
 * result would send a reader to two different controls. One function, one
 * `argument`, both halves.
 */
function badFilter(refusal: Refusal): ToolOutcome {
  return refused(
    { ns: "errors", k: "unknownFilter", args: [refusal.argument] },
    { ...refusal },
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

/**
 * A reference that names no project, refused with the six that do.
 *
 * Three tools answered this with `{error, message, tool}` and nothing else, so
 * a caller that guessed `Traffic Light` — which is what `get_build_context`
 * calls `project` — was told only that it was wrong. Six ids is a list a
 * sentence cannot carry and a payload can.
 *
 * A function rather than the constant it was, because the value that was
 * refused is half of what a refusal is for: `refused()`'s own docstring asks
 * for *which argument, what arrived, and what would have been accepted*, and a
 * shared object can only ever supply the third.
 */
const notFound = (reference: string): ToolOutcome =>
  refused(
    { ns: "errors", k: "unknownProject" },
    {
      argument: "project",
      /* An absent argument reports `null`, a wrong one reports itself — the
         same distinction the bench tools make, and the only thing that tells a
         host that dropped a required argument apart from a typo. */
      value: reference ?? null,
      /* The ids. `resolve` folds case and takes a slug as well, so publishing
         both would be twelve entries naming six things; the slug is one
         `open_project` result away and the schema's description says so. */
      valid: projects.map((project) => project.id),
    },
  );

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
      return badFilter({ argument: "search", value: search });
    }

    const maxMinutes = raw.max_minutes ?? null;
    if (
      maxMinutes !== null &&
      (typeof maxMinutes !== "number" ||
        !Number.isFinite(maxMinutes) ||
        maxMinutes < 0)
    ) {
      return badFilter({ argument: "max_minutes", value: maxMinutes });
    }

    const readyOnly = raw.ready_only ?? false;
    if (typeof readyOnly !== "boolean") {
      return badFilter({ argument: "ready_only", value: readyOnly });
    }

    const difficulty = wordList("difficulty", raw.difficulty, difficulties);
    if (isRefusal(difficulty)) return badFilter(difficulty);
    const components = wordList("components", raw.components, componentIds);
    if (isRefusal(components)) return badFilter(components);
    const concepts = wordList("concepts", raw.concepts, conceptIds);
    if (isRefusal(concepts)) return badFilter(concepts);

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
        /**
         * The narrowing that was applied, in the **argument's** own names.
         *
         * `next` is `ProjectFilters` — the toolbar's shape, and camelCase — and
         * echoing it raw made this result invalid as its own input: the schema
         * declares `max_minutes` and `ready_only` with
         * `additionalProperties: false`, so a strict host rejects the echo and
         * a lenient one drops the two keys and defaults them. Measured, that
         * turned `find_projects(result.filters)` after a `max_minutes: 20`
         * search into every project in the catalogue — and the effect below
         * writes the widened filter into the toolbar the person is looking at,
         * so the duration button they set disappears off their screen.
         *
         * `max_minutes` is omitted rather than sent as `null`, because the
         * schema types it `number` and *no upper bound* is said by leaving the
         * argument out. The other five are legal at their empty values.
         */
        filters: {
          search,
          difficulty,
          ...(maxMinutes === null ? {} : { max_minutes: maxMinutes }),
          components,
          concepts,
          ready_only: readyOnly,
        },
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
    if (!project) return notFound(reference);

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
    if (!project) return notFound(reference);

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
    if (!project) return notFound(reference);

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
