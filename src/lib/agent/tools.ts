import type { Line } from "@/lib/agent/line";
import type { AgentSessionState } from "@/lib/agent/session";
import {
  handlers,
  headlineFor,
  type ToolInputs,
} from "@/lib/agent/services";
import {
  libraryTools,
  workbenchTools,
  type AgentTool,
} from "@/lib/agent/model";
import {
  isLibraryTool,
  libraryHandlers,
  libraryHeadlineFor,
  type LibraryToolInputs,
} from "@/lib/projects/tools";

/**
 * Batch 8 · Every tool the product exposes, in one map.
 *
 * The two halves are written where they belong — the bench's six in
 * `agent/services.ts`, the library's four in `projects/tools.ts` — and joined
 * here, because there is one runner. That matters more than tidiness: the
 * runner is what serialises calls, closes each activity entry with its own
 * duration, and drops a landing whose generation has been reset underneath it.
 * A second runner for the library would be a second set of those three bugs.
 *
 * §9's rule about *where* a tool is registered is untouched by this: the map
 * says what exists, and `use-webmcp.ts` hands the browser only the subset the
 * current route can honour.
 */

export type AllToolInputs = ToolInputs & LibraryToolInputs;

export const allHandlers = {
  ...handlers,
  ...libraryHandlers,
} as const;

/** Declaration order is display order, bench first. */
export const allTools: readonly AgentTool[] = [
  ...workbenchTools,
  ...libraryTools,
];

/** The human sentence an entry opens with, whichever half it came from. */
export function headlineForAny<K extends keyof AllToolInputs>(
  name: K,
  input: AllToolInputs[K],
  state: AgentSessionState,
): Line {
  return isLibraryTool(name as string)
    ? libraryHeadlineFor(name as keyof LibraryToolInputs)
    : headlineFor(
        name as keyof ToolInputs,
        input as ToolInputs[keyof ToolInputs],
        state,
      );
}
