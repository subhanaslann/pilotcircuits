import type { Copy } from "@/content/i18n";
import {
  projects,
  type ComponentId,
  type ConceptId,
  type Difficulty,
  type ProjectDef,
} from "@/lib/projects/catalog";

/**
 * Batch 6 · P-04 · The filters, as functions.
 *
 * `frontend-plan.md` §5 asks for filters that genuinely work rather than a
 * toolbar that looks like it filters, so the narrowing lives here as pure
 * functions the toolbar calls. No React, no state — the same shape as
 * `steps.ts` and `catalog.ts`, and for the same reason: in Batch 7 a WebMCP
 * tool will be asked to *find me a build with a servo I already own*, and it
 * will call this, not a component.
 *
 * Search reads the words, so it takes the dictionary as an argument. Everything
 * else reads structure and does not.
 */

export interface ProjectFilters {
  search: string;
  difficulty: Difficulty[];
  /** Upper bound in minutes; `null` means no limit. */
  maxMinutes: number | null;
  components: ComponentId[];
  concepts: ConceptId[];
  /** Only builds with a guided workbench. */
  readyOnly: boolean;
}

export const noFilters: ProjectFilters = {
  search: "",
  difficulty: [],
  maxMinutes: null,
  components: [],
  concepts: [],
  readyOnly: false,
};

export function isFiltered(filters: ProjectFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.difficulty.length > 0 ||
    filters.maxMinutes !== null ||
    filters.components.length > 0 ||
    filters.concepts.length > 0 ||
    filters.readyOnly
  );
}

/**
 * Search covers the name, the summary and the concept labels — the words
 * actually on a card, plus the ones behind it.
 *
 * Case-folded with the reader's own locale: `İstasyon` lowercases to `i̇stasyon`
 * under Turkish rules and to `i̇stasyon` under invariant ones, and getting that
 * wrong makes a Turkish search for `istasyon` miss a Turkish project name.
 */
function matchesSearch(
  project: ProjectDef,
  copy: Copy,
  query: string,
  locale: string,
): boolean {
  const needle = query.trim().toLocaleLowerCase(locale);
  if (!needle) return true;

  const words = copy.projects[project.id];
  const haystack = [
    words.name,
    words.summary,
    ...project.concepts.map((id) => copy.concepts[id]),
    ...project.components.map((id) => copy.components[id]),
  ]
    .join(" ")
    .toLocaleLowerCase(locale);

  return haystack.includes(needle);
}

/** Every filter is an AND; within one filter, values are an OR. */
export function filterProjects(
  filters: ProjectFilters,
  copy: Copy,
  locale: string,
): ProjectDef[] {
  return projects.filter((project) => {
    if (!matchesSearch(project, copy, filters.search, locale)) return false;
    if (
      filters.difficulty.length &&
      !filters.difficulty.includes(project.difficulty)
    ) {
      return false;
    }
    if (filters.maxMinutes !== null && project.minutes > filters.maxMinutes) {
      return false;
    }
    if (
      filters.components.length &&
      !filters.components.some((id) => project.components.includes(id))
    ) {
      return false;
    }
    if (
      filters.concepts.length &&
      !filters.concepts.some((id) => project.concepts.includes(id))
    ) {
      return false;
    }
    if (filters.readyOnly && project.status !== "ready") return false;
    return true;
  });
}

/** The duration bands the toolbar offers. Minutes, so they sort. */
export const durationBands = [30, 45, 60] as const;
