"use client";

import { FilterToolbar } from "@/components/library/filter-toolbar";
import { LibraryAgentSurface } from "@/components/library/project-blocks";
import { ProjectCard } from "@/components/library/project-card";
import { EmptyState } from "@/components/ui/status";
import { useBuild } from "@/components/build/build-provider";
import { useWebMcpTools } from "@/components/agent/use-webmcp";
import { useCopy, useLocale } from "@/content/copy-provider";
import { filterProjects } from "@/lib/projects/filter";

const LIBRARY_TOOLS = ["find_projects", "open_project"] as const;

/**
 * S-02 · `/projects` — the library, filtering for real.
 *
 * P-04's toolbar and `lib/projects/filter.ts` were built in Batch 6 against
 * exactly this screen; all this adds is the grid beside them and a destination
 * on every card.
 *
 * **The filter state is not local.** It lives on the build context, because
 * `find_projects` has to narrow the control the person is looking at rather
 * than answer past it — an agent that says it searched while the toolbar sits
 * unchanged has done something the user cannot see, which rule 6 counts as not
 * having done it at all.
 *
 * It is not in the URL either. Five filters and a text field synced to the
 * query string means a router round trip per keystroke, and the search folds
 * case with the reader's locale, which the server would have to be told
 * separately. The trade is a list you cannot deep-link to; the thing that is
 * worth deep-linking to — a project — has had its own URL since this batch.
 */
export function ProjectLibrary() {
  const copy = useCopy();
  const { locale } = useLocale();
  const { filters, setFilters } = useBuild();

  /* §9 · the two tools this screen can honour. `find_projects` narrows the
     toolbar below; `open_project` opens one of the cards. Neither would mean
     anything on the workbench, and neither is registered there. */
  useWebMcpTools(LIBRARY_TOOLS);

  const results = filterProjects(filters, copy, locale);

  return (
    <>
      <FilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={results.length}
      />

      {/* §9's unavailable sentence, and the two hosts a refused tool call needs
          to be seen at all. See `LibraryAgentSurface`. */}
      <LibraryAgentSurface className="mt-6" />

      {results.length ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((project) => (
            <li key={project.id} className="flex">
              <ProjectCard
                project={project}
                copy={copy}
                href={`/projects/${project.slug}`}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={copy.library.empty}
          description={copy.library.emptyHint}
          className="mt-10"
        />
      )}
    </>
  );
}
