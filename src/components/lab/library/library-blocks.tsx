"use client";

import { useState } from "react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { ProjectCard } from "@/components/library/project-card";
import { FilterToolbar } from "@/components/library/filter-toolbar";
import {
  ComponentChecklist,
  ContinueCard,
  HowItWorks,
  LearningGoals,
  PreviewNotice,
  StepPreview,
} from "@/components/library/project-blocks";
import { EmptyState } from "@/components/ui/status";
import { useCopy, useLocale } from "@/content/copy-provider";
import { toProgressSteps } from "@/lib/agent/steps";
import { projectById, type ComponentId } from "@/lib/projects/catalog";
import {
  filterProjects,
  isFiltered,
  noFilters,
  type ProjectFilters,
} from "@/lib/projects/filter";

/**
 * P-03 · P-04 · P-05 · P-07 · P-08 · P-10 · P-11, assembled and working.
 *
 * The toolbar really filters: it calls `lib/projects/filter.ts`, the same pure
 * functions a WebMCP tool will call in Batch 7.
 */
export function LibraryBlocks() {
  const copy = useCopy();
  const { locale } = useLocale();
  const t = copy.lab.libraryLab.blocks;

  const [filters, setFilters] = useState<ProjectFilters>(noFilters);
  const results = filterProjects(filters, copy, locale);

  const featured = projectById("smartParkingBarrier");
  const [checked, setChecked] = useState<ComponentId[]>([
    "board",
    "breadboard",
    "led",
    "resistor",
  ]);
  const toggle = (id: ComponentId) =>
    setChecked((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    );

  /* Mid-build, the way the dashboard would find it. */
  const steps = toProgressSteps(copy, "servo", ["kit", "place", "sensor"], []);

  return (
    <>
      <LabBlock title={t.toolbarTitle} note={t.toolbarNote}>
        <LabStage className="bg-app space-y-4">
          <FilterToolbar
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={results.length}
          />

          {results.length ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] items-stretch gap-4">
              {results.map((project) => (
                <li key={project.id} className="flex">
                  <ProjectCard
                    project={project}
                    copy={copy}
                    variant="calm"
                    className="w-full"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={copy.library.empty}
              description={copy.library.emptyHint}
            />
          )}
        </LabStage>
        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {isFiltered(filters) ? t.filteredNote : t.unfilteredNote}
        </p>
      </LabBlock>

      <LabBlock title={t.continueTitle} note={t.continueNote}>
        <LabStage className="bg-app">
          <ContinueCard project={featured} steps={steps} />
        </LabStage>
      </LabBlock>

      <LabBlock title={t.prepTitle} note={t.prepNote}>
        <LabStage>
          <div className="grid gap-8 lg:grid-cols-2">
            <ComponentChecklist
              components={featured.components}
              checked={checked}
              onToggle={toggle}
            />
            <div className="space-y-8">
              <LearningGoals
                concepts={featured.concepts.map((id) => copy.concepts[id])}
              />
              <StepPreview steps={steps} />
            </div>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.noticeTitle} note={t.noticeNote}>
        <LabStage>
          <PreviewNotice />
        </LabStage>
      </LabBlock>

      <LabBlock title={t.howTitle} note={t.howNote}>
        <LabStage>
          <HowItWorks />
        </LabStage>
      </LabBlock>
    </>
  );
}
