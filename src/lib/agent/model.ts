/**
 * Batch 4 · The agent's vocabulary.
 *
 * The six tools the workbench exposes, and the one axis the product teaches on.
 * Nothing here touches React or the DOM: in Batch 7 a WebMCP callback invoked by
 * the browser has to be able to reach every one of these without a hook.
 */

/** Declaration order is display order — `6 tools available` counts this list. */
export const workbenchTools = [
  "get_build_context",
  "inspect_build",
  "show_correction",
  /**
   * Batch 9 · the one tool with hands.
   *
   * Every other tool on this list reads the build or moves a view. This one
   * moves the build, and it is the first thing in the product that lets an
   * agent do what the person does — which is a decision, not an oversight, and
   * it is worth saying what it cost. `check` replaced `resolve` in Batch 8
   * precisely so the agent could not fix things for people; a learner who can
   * have the whole lamp built for them has not learned the chapter.
   *
   * What makes it worth having anyway: an agent driving this page through the
   * browser could, until now, only ever talk about the bench. A protocol demo
   * whose tools cannot touch the thing they describe is a demo of a
   * conversation. So the write exists, it is the one the ring is drawn for,
   * and the three things that keep the chapter honest are that it lands as a
   * commit `Ctrl+Z` can take back, that it is announced in the timeline as the
   * agent's own act rather than the person's, and that the panel's own buttons
   * still cannot call it.
   */
  "attach_lead",
  "verify_current_step",
  "navigate_build_step",
  "run_functional_test",
] as const;

export type WorkbenchTool = (typeof workbenchTools)[number];

/**
 * Batch 8 · The four the library and the project page expose.
 *
 * Named here, beside the bench's six, so that the one thing every layer needs —
 * *what is this tool called* — has a single declaration with no imports behind
 * it. The handlers live where their screen does (`lib/projects/tools.ts`); this
 * is only the vocabulary.
 *
 * They are deliberately not added to `workbenchTools`: the agent panel counts
 * that list to say `6 tools available`, and it is right to, because §9 keeps a
 * tool on the page that can act on it. Four of these are never registered while
 * the workbench is open.
 */
export const libraryTools = [
  "find_projects",
  "open_project",
  "get_project_requirements",
  "start_project",
] as const;

export type LibraryTool = (typeof libraryTools)[number];

/** Every tool the product can register, on any route. */
export type AgentTool = WorkbenchTool | LibraryTool;

/**
 * Whether a call left the bench as it found it.
 *
 * This is not bookkeeping — the activity timeline draws the two differently: a
 * read is a hollow pad, a change is a filled one. A user scanning the log can
 * see what the agent *did* to their build without reading a word.
 */
export type ToolKind = "read" | "change";

export const toolKind: Record<AgentTool, ToolKind> = {
  get_build_context: "read",
  inspect_build: "read",
  show_correction: "change",
  attach_lead: "change",
  verify_current_step: "change",
  navigate_build_step: "change",
  run_functional_test: "change",
  /* Reading the catalogue leaves the page as it found it — narrowing the
     toolbar does not, and neither does opening a route. `find_projects` is the
     borderline one and it is a change: it moves a control the person can see. */
  find_projects: "change",
  open_project: "change",
  get_project_requirements: "read",
  start_project: "change",
};

/**
 * `inspect_build`'s argument — which connections `diff()` sees, **and which
 * kinds of finding come back**.
 *
 * The second half was missing and it made the scopes useless to an agent:
 * asking for `wiring` on a bench with nothing on it returned "the LED is still
 * in the kit", which is not a wiring finding by any reading. A scope that does
 * not partition is a filter that does not filter.
 *
 * `placement` is the scope that was missing. It is the one question a build the
 * person assembles can be asked that the others cannot answer: what is still in
 * the box.
 */
export type InspectionScope =
  | "current_step"
  | "wiring"
  | "placement"
  | "mechanical"
  | "all";

/**
 * How much help the user has asked for — and, unchanged, the `detail_level`
 * argument of `show_correction`. One union, because the panel's selector and the
 * agent's argument must never be able to disagree: when the agent raises the
 * level, the selector's thumb slides, and that movement is how the user sees
 * that the agent did something (design-language.md, rule 6).
 */
export const coachingOrder = ["hint", "explain", "exact"] as const;

export type CoachingLevel = (typeof coachingOrder)[number];

/** Everything at or below a level, so the teaching ladder can render its rungs. */
export function rungsUpTo(level: CoachingLevel): CoachingLevel[] {
  return coachingOrder.slice(0, coachingOrder.indexOf(level) + 1);
}

/** The next rung, or `null` at the top. Drives the ladder's one control. */
export function nextLevel(level: CoachingLevel): CoachingLevel | null {
  return coachingOrder[coachingOrder.indexOf(level) + 1] ?? null;
}
