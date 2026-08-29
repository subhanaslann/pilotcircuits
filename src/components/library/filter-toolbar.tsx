"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { ComponentIcon } from "@/components/illustration/component-icons";
import { Button } from "@/components/ui/button";
import { Checkbox, Switch } from "@/components/ui/choice";
import { SearchInput } from "@/components/ui/input";
import { MenuLabel, Popover } from "@/components/ui/overlay";
import { Toolbar } from "@/components/ui/tabs";
import { useCopy } from "@/content/copy-provider";
import { componentIds, type ComponentId } from "@/lib/projects/catalog";
import {
  durationBands,
  isFiltered,
  noFilters,
  type ProjectFilters,
} from "@/lib/projects/filter";
import { icon } from "@/lib/design/tokens";

const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

/**
 * P-04 · Filter toolbar
 *
 * Search plus five filters plus a result count plus a clear, in the toolbar
 * rhythm M-04 already set. Nothing here is a new control: the search field is
 * A-09, the popovers are M-05, the checkboxes are A-11's compact sibling, the
 * ready toggle is A-14.
 *
 * It filters for real. The narrowing is `lib/projects/filter.ts` — pure
 * functions with no React in them — because in Batch 7 an agent asked to *find
 * a build that uses a servo I already own* has to call the same code this
 * toolbar calls, not a component.
 *
 * A filter button reflects its own state: it goes secondary once it is holding
 * something back, so a narrowed list is never a mystery. That is rule 7 applied
 * to controls — the count alone would be one signal, and one is not enough.
 */
export function FilterToolbar({
  filters,
  onFiltersChange,
  resultCount,
}: {
  filters: ProjectFilters;
  onFiltersChange: (next: ProjectFilters) => void;
  resultCount: number;
}) {
  const copy = useCopy();
  const patch = (next: Partial<ProjectFilters>) =>
    onFiltersChange({ ...filters, ...next });

  const toggleComponent = (id: ComponentId) =>
    patch({
      components: filters.components.includes(id)
        ? filters.components.filter((c) => c !== id)
        : [...filters.components, id],
    });

  return (
    <Toolbar className="gap-3">
      <SearchInput
        value={filters.search}
        onValueChange={(search) => patch({ search })}
        label={copy.library.search}
        className="min-w-[200px] flex-1"
      />

      <Popover
        label={copy.library.filters.difficulty}
        width="sm"
        trigger={({ open, toggle }) => (
          <Button
            variant={
              open || filters.difficulty.length ? "secondary" : "tertiary"
            }
            size="sm"
            onClick={toggle}
            iconLeft={<SlidersHorizontal {...g} />}
          >
            {copy.library.filters.difficulty}
          </Button>
        )}
      >
        <MenuLabel>{copy.library.filters.difficulty}</MenuLabel>
        <div className="space-y-2 p-2.5">
          {(["beginner", "intermediate"] as const).map((level) => (
            <Checkbox
              key={level}
              checked={filters.difficulty.includes(level)}
              onCheckedChange={() =>
                patch({
                  difficulty: filters.difficulty.includes(level)
                    ? filters.difficulty.filter((d) => d !== level)
                    : [...filters.difficulty, level],
                })
              }
              label={copy.library.difficulty[level]}
            />
          ))}
        </div>
      </Popover>

      <Popover
        label={copy.library.filters.duration}
        width="sm"
        trigger={({ open, toggle }) => (
          <Button
            variant={
              open || filters.maxMinutes !== null ? "secondary" : "tertiary"
            }
            size="sm"
            onClick={toggle}
          >
            {filters.maxMinutes === null
              ? copy.library.filters.duration
              : copy.library.upTo(filters.maxMinutes)}
          </Button>
        )}
      >
        <MenuLabel>{copy.library.filters.duration}</MenuLabel>
        <div className="space-y-2 p-2.5">
          <Checkbox
            checked={filters.maxMinutes === null}
            onCheckedChange={() => patch({ maxMinutes: null })}
            label={copy.library.anyDuration}
          />
          {durationBands.map((band) => (
            <Checkbox
              key={band}
              checked={filters.maxMinutes === band}
              onCheckedChange={() =>
                patch({ maxMinutes: filters.maxMinutes === band ? null : band })
              }
              label={copy.library.upTo(band)}
            />
          ))}
        </div>
      </Popover>

      <Popover
        label={copy.library.filters.components}
        width="md"
        trigger={({ open, toggle }) => (
          <Button
            variant={
              open || filters.components.length ? "secondary" : "tertiary"
            }
            size="sm"
            onClick={toggle}
          >
            {copy.library.filters.components}
          </Button>
        )}
      >
        <MenuLabel>{copy.library.filters.components}</MenuLabel>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-2.5">
          {componentIds.map((id) => (
            <Checkbox
              key={id}
              checked={filters.components.includes(id)}
              onCheckedChange={() => toggleComponent(id)}
              label={
                <span className="flex items-center gap-1.5">
                  <ComponentIcon id={id} size={18} />
                  {copy.components[id]}
                </span>
              }
            />
          ))}
        </div>
      </Popover>

      <Switch
        checked={filters.readyOnly}
        onCheckedChange={(readyOnly) => patch({ readyOnly })}
        label={copy.library.readyNow}
      />

      {/* The count is the toolbar's answer to itself, so it sits in it. */}
      <span className="text-caption text-ink-tertiary ml-auto shrink-0 tabular-nums">
        {copy.library.results(resultCount)}
      </span>

      {isFiltered(filters) ? (
        <Button
          variant="quiet"
          size="sm"
          iconLeft={<X {...g} />}
          onClick={() => onFiltersChange(noFilters)}
        >
          {copy.library.clear}
        </Button>
      ) : null}
    </Toolbar>
  );
}
