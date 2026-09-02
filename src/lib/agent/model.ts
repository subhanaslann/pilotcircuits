/**
 * Batch 4 · The agent's vocabulary.
 *
 * The eight tools the workbench exposes, and the one axis the product teaches
 * on. Nothing here touches React or the DOM: in Batch 7 a WebMCP callback
 * invoked by the browser has to be able to reach every one of these without a
 * hook.
 */

/**
 * Declaration order is display order, and the panel's `N tools available`
 * counts this list rather than printing a number of its own — which is why the
 * header has been right since `attach_lead` arrived and made it seven, while
 * every comment that wrote the number out by hand went on saying six. A number
 * beside a rendered list is a fact with two copies.
 */
export const workbenchTools = [
  "get_build_context",
  "inspect_build",
  "show_correction",
  /**
   * G-17 · the one tool that answers *where*.
   *
   * `show_correction` points at a fault and needs a finding to do it. This one
   * points at a thing — a part, a lead, a pin, a hole, a connection — because
   * the question a beginner asks most is not "what is wrong" but "which one is
   * the resistor", and until now the only answer the bench had was a camera
   * that could frame a finding. It moves the camera and leaves a mark; it
   * changes nothing in the build. Listed beside the correction because that is
   * the tool it is the sibling of, and declaration order is display order.
   */
  "point_at",
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
 * Named here, beside the bench's eight, so that the one thing every layer needs
 * — *what is this tool called* — has a single declaration with no imports behind
 * it. The handlers live where their screen does (`lib/projects/tools.ts`); this
 * is only the vocabulary.
 *
 * They are deliberately not added to `workbenchTools`: the agent panel counts
 * that list for its `N tools available`, and it is right to, because §9 keeps a
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
  /* A spotlight is a mark on the bench and a camera that moved — the same
     reading `show_correction` gets. A hollow pad beside a correction's filled
     one would draw two calls that do the same thing to the screen as two
     different kinds of thing. */
  point_at: "change",
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
 * What the agent is **doing to the bench** while a tool runs — the vocabulary
 * the coach figure and its caption speak.
 *
 * Three tables now describe one tool, and they answer three questions that
 * were measured to disagree. `toolKind` says which pad the timeline fills;
 * `toolAnnotations` says what a host may assume before calling; this says what
 * a *person watching* should be told the agent is up to. `verify_current_step`
 * is the row that keeps them apart: it is a `change` to the timeline (it ticks
 * a step), not read-only to a host (it advances the rail), and to the person
 * it is the agent **looking** — the ring reads the step's pins, and nothing on
 * the bench moves until the verdict lands.
 *
 * Five verbs, and not twelve. The whole point of a category is that a viewer
 * learns the faces once: a figure with a different expression per tool would
 * be a figure with twelve expressions, which is the same as none.
 *
 * `find_projects` is `looking` rather than `moving`: a search is a read of the
 * catalogue that also narrows a control, and to the person it is the agent
 * scanning the shelf, not walking somewhere. The three that change the route
 * or the rail are the ones that walk.
 *
 * The ring in `lib/agent/mascot.ts` speaks the first three of these under its
 * own names (`read` / `point` / `carry`); `mascot.test.ts` pins that the two
 * vocabularies agree on every tool that gets a ring.
 */
export const toolActs = [
  "looking",
  "showing",
  "touching",
  "testing",
  "moving",
] as const;

export type ToolAct = (typeof toolActs)[number];

export const toolAct: Record<AgentTool, ToolAct> = {
  get_build_context: "looking",
  inspect_build: "looking",
  show_correction: "showing",
  /* The coach's pointing face, and the correction's verb: to the person
     watching, an agent framing a part and an agent framing a fault are both
     an agent pointing at the bench. */
  point_at: "showing",
  attach_lead: "touching",
  verify_current_step: "looking",
  navigate_build_step: "moving",
  run_functional_test: "testing",
  find_projects: "looking",
  open_project: "moving",
  get_project_requirements: "looking",
  start_project: "moving",
};

/**
 * What a host is told about a tool before it decides to call it.
 *
 * The MCP hints, in MCP's own names. `readOnlyHint` and `untrustedContentHint`
 * are the two a conforming WebMCP host reads today — they are the only two
 * declared in `ToolAnnotations` (`index.bs:1068-1071`) and read by the
 * registration algorithm (`index.bs:754-759`). The other three are dropped in
 * silence: WebIDL dictionary conversion discards an undeclared member without
 * an error, so publishing them costs nothing and reaches nobody **yet**.
 *
 * They are written anyway, for two reasons. One vocabulary is right — a bridge
 * to a real MCP client forwards all five, and the day one exists it should not
 * have to re-derive three of them from behaviour. And a hint stated is a hint
 * that can be checked: every cell below was measured, and two of them are
 * corrections to a table three separate readings got wrong.
 *
 * `destructiveHint` and `idempotentHint` are optional because MCP defines them
 * as *"meaningful only when `readOnlyHint == false`"*. Omitted, not set to
 * `false`, on the two tools that read.
 */
export interface McpToolAnnotations {
  readOnlyHint: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint: boolean;
  untrustedContentHint: boolean;
}

/**
 * The twelve rows, measured rather than reasoned about.
 *
 * **Not derived from `toolKind`, and the two cannot be merged.** `toolKind` is
 * a drawing hint — it says which pad the timeline fills — and `inspect_build`
 * is the row where the two answers differ: it is a `read` to a person watching
 * and it is *not* read-only, because it patches four session keys and raises a
 * toast. Deriving one from the other would tell a host it is safe to call that
 * tool unattended. Two questions, two tables, one comment saying so.
 *
 * The rule applied to all twelve: **a page tool's environment is the page.** A
 * tool that writes no session key but leaves a verdict on the device panel for
 * the life of the page has modified its environment.
 *
 * The three rows worth reading the reasoning for:
 *
 * - `attach_lead` is **idempotent**. The second identical call writes nothing
 *   on all five placement builds — seat, seat again, detach, detach again. MCP's
 *   test is about the environment and not about the status code, so the
 *   deliberate no-op the handler answers with `leadAlreadyThere` is documented
 *   here rather than left to surprise a caller. It is also the only
 *   `destructiveHint: true` in the product: one omitted `target` has been
 *   measured returning **two** parts to the kit and breaking a join on a lead
 *   the call never named.
 * - `verify_current_step` is **not** idempotent, and this is the row that must
 *   not be flipped back. It patches `activeStepId`, so four identical `{}`
 *   calls walk the rail; re-verifying a step already ticked still writes six
 *   keys, and on the last step it re-stamps `completedAt`. `true` here would
 *   tell a host it may retry a timed-out call, which would tick and advance a
 *   second step.
 * - `run_functional_test` is not read-only twice over. Its `runTest` effect
 *   reaches `playTest`, which sets the device panel's leds, lamps, serial,
 *   readings and verdict — none of them reverted by a timer, unlike `trace`;
 *   the pass/fail sits there for the life of the page. And on the step whose
 *   closing gesture is the test — every build's last, `suggestion: "runTest"`
 *   — a run with every check green ticks that step and stamps `completedAt`,
 *   the same patch `verify_current_step` writes (`stepClosed` in
 *   `services.ts`). Still idempotent, unlike verify: that step has no
 *   successor to advance to, the tick is a set and the stamp is guarded, so a
 *   second identical call writes the same keys to the same values.
 *
 * `openWorldHint` is `false` on all twelve and that is a claim, not a default
 * restated: there is no network call anywhere in `services.ts` or `tools.ts`,
 * and MCP's default is `true`. `untrustedContentHint` is `false` for the same
 * kind of reason — every payload is built here, from the product's own model,
 * with no attacker-controlled text in it.
 */
export const toolAnnotations: Record<AgentTool, McpToolAnnotations> = {
  /* Reads the session and returns it. Byte-identical state before and after,
     on all six builds. */
  get_build_context: {
    readOnlyHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  inspect_build: {
    readOnlyHint: false,
    destructiveHint: false,
    /* The whole difference between two calls is `foundAt`, by a millisecond. */
    idempotentHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  show_correction: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  point_at: {
    /* It writes `pointedAt` and moves the camera, and a page tool's
       environment is the page. */
    readOnlyHint: false,
    /* Nothing in the build moves; the mark goes with the next gesture rather
       than needing an undo. */
    destructiveHint: false,
    /* The second identical call writes the same spotlight and answers
       `changed: false`, the way `show_correction` does. */
    idempotentHint: true,
    /* Answered from the scene and the spec, like every row above. */
    openWorldHint: false,
    /* Every field is composed here, from the product's own model. */
    untrustedContentHint: false,
  },
  attach_lead: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  verify_current_step: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  navigate_build_step: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  run_functional_test: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  find_projects: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  open_project: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  /* No patch, no effects, no note, on all six projects — the one library tool
     that genuinely leaves the page as it found it. */
  get_project_requirements: {
    readOnlyHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
  start_project: {
    readOnlyHint: false,
    destructiveHint: false,
    /* The second call withholds the patch — hand-guarded at `tools.ts:317`. */
    idempotentHint: true,
    openWorldHint: false,
    untrustedContentHint: false,
  },
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
export const inspectionScopes = [
  "current_step",
  "wiring",
  "placement",
  "mechanical",
  "all",
] as const;

export type InspectionScope = (typeof inspectionScopes)[number];

/**
 * Every way a tool can refuse, named once.
 *
 * These are **wire values**: `refused()` takes the refusal's key straight off
 * the `Line` it renders, so `result.refused` is a dictionary key travelling to
 * a caller as an identifier. That makes a copy edit into a protocol change —
 * rename `holeTaken` in `en.ts` and the sentence improves while every client
 * branching on it silently stops matching, with nothing anywhere to catch it.
 * `Line.k` is derived from the dictionary, so the compiler stops a key that has
 * been *deleted*; only a list like this one stops a key that has been *moved*.
 *
 * The reachable set, so the assertion in `session.test.ts` can be total: it
 * provokes all seventeen and checks each against this list, both directions. The
 * two unreachable refusals are deliberately out — `noBench` (a ready project
 * with no build row, which `builds.ts` throws at boot to prevent) and
 * `projectNotReady` (all six are `ready`) — because a list nothing can reach is
 * a list nothing can check.
 *
 * A plain array of literals, and not typed against `Line` here: `model.ts` has
 * no imports behind it on purpose, so the dictionary cross-check is done where
 * `Line` already is.
 */
export const toolErrorKeys = [
  /* inspect_build */
  "unknownScope",
  /* show_correction */
  "noSuchFinding",
  "unknownDetailLevel",
  "unknownFinding",
  /* point_at */
  "unknownSubject",
  /* attach_lead — eight, the largest refusal surface in the product */
  "noPlacement",
  "unknownLead",
  "unknownTarget",
  "holeTaken",
  "leadNotFree",
  "sameCircuitPart",
  "wireEnd",
  "leadAlreadyThere",
  /* navigate_build_step */
  "unknownStep",
  /* run_functional_test */
  "unknownCheck",
  /* find_projects */
  "unknownFilter",
  /* open_project · get_project_requirements · start_project */
  "unknownProject",
] as const;

export type ToolErrorKey = (typeof toolErrorKeys)[number];

/**
 * Whether a value a caller handed us is one of the five names at all.
 *
 * A list rather than a type, because the type is what a *compiler* checks and
 * nothing compiles a WebMCP host's arguments. `inspect_build` used to take
 * whatever arrived: `"everything"`, `null` and `42` all fell through
 * `scopeConnections` and `scopeKinds` to their `default` arms — the whole build,
 * every kind — and were then echoed back in `result.scope` as if honoured. On
 * the capstone that silently deleted the servo finding, because an unrecognised
 * scope is admitted by `inspectionCovers` (so the finding is dropped from what
 * the inspection keeps) and refused by `scopeChecksMechanical` (so it is never
 * re-derived).
 *
 * The closed set, not the build's own offered subset: `schemaFactsFor` withholds
 * `mechanical` from a build with nothing that turns and `placement` from one the
 * author laid out, and "this build does not offer that scope" is a true and
 * useful answer — an empty finding list — rather than a bad argument. Only a
 * name that is not a scope at all is a bad argument.
 */
export function isInspectionScope(value: unknown): value is InspectionScope {
  return (inspectionScopes as readonly unknown[]).includes(value);
}

/** The same question for the coaching ladder — see `show_correction`. */
export function isCoachingLevel(value: unknown): value is CoachingLevel {
  return (coachingOrder as readonly unknown[]).includes(value);
}

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
