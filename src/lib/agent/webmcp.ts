import type { BuildSchemaFacts } from "@/lib/agent/builds";
import type { McpToolAnnotations } from "@/lib/agent/model";
import { componentIds, projects } from "@/lib/projects/catalog";
import { conceptIds, difficulties } from "@/lib/projects/filter";

/**
 * Batch 8 · §9 · The browser side of WebMCP.
 *
 * Seven batches built a product whose whole argument is that an agent drives
 * the page through a real protocol, and until now nothing was ever registered
 * with the browser: `webMcpAvailable` was a boolean that started `true` and was
 * only ever changed by a button in the design lab. The panel said `Connected via
 * WebMCP` on the strength of nothing at all. This file is where the claim
 * becomes checkable.
 *
 * Nothing here imports React, and that is the point Batch 4 was paying for in
 * advance: the browser calls `execute` directly, not through a component, so
 * every handler it reaches has to work outside a hook. `lib/agent/services.ts`
 * and `lib/projects/tools.ts` already do.
 *
 * ## Finding the host
 *
 * `document.modelContext` is the surface, and it is the only one the proposal
 * has: `index.bs:585` declares it on `partial interface Document`. `navigator`
 * carried the same object until PR #184 deleted `partial interface Navigator`
 * on 2026-05-27, and `window` was never specified in any revision. The probe
 * still tries all three — standards-track first, then the two a shim or an old
 * extension may still be exposing — and takes the first that actually exposes
 * `registerTool`. If none does — which is the case in every browser this was
 * developed against — it returns `null`, the interface says so out loud, and
 * the manual demo controls carry the build. §18 asks for both halves of that
 * sentence and this is where they are kept.
 *
 * The order was inverted until this batch, on a comment of this file's own that
 * called `navigator` *"the standards-track location"*. It had been gone three
 * months by the time that sentence was checked, and the sentence is why the
 * mistake survived the check — so it is corrected here rather than deleted. The
 * cost of the wrong order was never realised: a legacy shim on `navigator`
 * would have won over the real object beside it, and no browser ships either.
 *
 * Every touch of the host is wrapped, in both directions: an extension that
 * defines `modelContext` and then throws inside `registerTool` must not be able
 * to take the page down with it, and a host that refuses the way the IDL says
 * to — a rejected promise — must not reach the page as an unhandled rejection
 * either. A tool that fails to register is a tool that is not there, which is a
 * state the product already knows how to render.
 */

/** What the browser hands back, when it hands anything back at all. */
export interface McpRegistration {
  /**
   * The shim's way back out, and not the protocol's.
   *
   * The IDL defines no handle: `registerTool` resolves to `undefined` and
   * removal is `options.signal` — see `McpRegisterToolOptions`. So on a
   * conforming host this is a no-op, and aborting the signal is what takes the
   * tool back. It stays for the demo hosts written before the signal existed,
   * which hand back a disposer or an `{unregister}` object and would otherwise
   * never be torn down at all.
   */
  unregister: () => void;
  /**
   * Whether the host actually took the tool.
   *
   * `registerTool` below is deliberately forgiving — a host that throws must
   * not take the page down — and that forgiveness used to erase the one fact a
   * caller needs: a refused registration and an accepted one came back as the
   * same object. The panel's `Connected via WebMCP` was then a claim about
   * `typeof navigator.modelContext.registerTool === "function"`, which is API
   * presence, not a handshake. This is the difference, reported rather than
   * swallowed. `false` also for the descriptor a strict host rejects — several
   * function-calling dialects refuse JSON Schema this product publishes
   * legally, and that is exactly the case where the badge must not lie.
   *
   * A promise, because the answer is one. Every refusal in the IDL is *"return
   * a promise rejected with"* — a name already registered rejects with an
   * `InvalidStateError` (`index.bs:666`) — so read synchronously, the only
   * refusal visible is the one no conforming host performs. It resolves rather
   * than rejects, so a caller that never reads it cannot raise an unhandled
   * rejection by ignoring it.
   */
  ok: Promise<boolean>;
}

/** The result shape the protocol expects from a tool call. */
export interface McpToolResult {
  content: { type: "text"; text: string }[];
  /**
   * The same value again, unserialised.
   *
   * MCP's rule runs one way only — *"If an output schema is provided: servers
   * MUST provide structured results that conform to this schema"* — so a
   * `structuredContent` without an `outputSchema` is legal, and the spec's own
   * worked example carries both. `content` stays required and carries the same
   * JSON as text, which is what *"a tool that returns structured content SHOULD
   * also return the serialized JSON in a TextContent block"* asks for: a client
   * doing `JSON.parse(result.content[0].text)` reads exactly what it read
   * before this field existed.
   *
   * No `outputSchema` beside it, and not for want of trying: it is not a member
   * of `ModelContextTool` (`index.bs:1057-1065`), WebIDL drops undeclared
   * members without an error, and the explainer has it under *Future work*
   * against an open issue. It would reach no host this product can talk to.
   */
  structuredContent?: unknown;
  isError?: boolean;
}

/**
 * The second argument the host calls `execute` with.
 *
 * `index.bs:1073-1074` is `dictionary ToolExecuteCallbackOptions { required
 * AbortSignal signal; }`, and `:1077` types the callback itself as
 * `Promise<any> (object inputObject, ToolExecuteCallbackOptions options)`. The
 * host opens an `AbortController` per execution (`:486-497`) and hands over its
 * signal, so on a conforming host it is always present; it is optional on this
 * side because we are the callee, and a shim that calls with one argument must
 * not throw its way into the result.
 *
 * What it is for, in the spec's own order of events: the caller cancels, the
 * host aborts, and the host then discards whatever the promise settles with —
 * *"If localExecutions[uuid] does not exist, then return"* (`:504-510`). So a
 * tool that ignores the signal does not merely waste work; it finishes into a
 * result nobody will read, and for `attach_lead` that means a bench that goes
 * on moving after the agent has walked away.
 */
export interface McpToolExecuteOptions {
  signal?: AbortSignal;
}

export interface McpToolDescriptor {
  name: string;
  /**
   * The name a person sees where the id would otherwise be.
   *
   * `USVString title` is a member of `ModelContextTool` (`index.bs:1058-1060`)
   * and the IDL's own comment beside it says why it is a `USVString` and not a
   * `DOMString`: it is *"for display in possibly native UIs"*. It is also the
   * only landing place there is — `ToolAnnotations` has no `title` — so a
   * browser listing what this page offers had nothing to print but
   * `get_build_context`, which is a name for a function rather than for a
   * thing. Filled from `copy.agentPanel.toolTitles`, so what a host displays is
   * in the reader's language and in the same nouns the timeline uses.
   */
  title?: string;
  description: string;
  /** JSON Schema for the arguments. Hand-written; there is no generator here. */
  inputSchema: Record<string, unknown>;
  /**
   * What a host is told before it decides whether to call.
   *
   * `ToolAnnotations` (`index.bs:1067-1070`) declares two members —
   * `readOnlyHint` and `untrustedContentHint` — and the registration algorithm
   * reads exactly those two. The table in `model.ts` publishes five, because a
   * bridge to a real MCP client wants all of them and WebIDL drops the other
   * three without an error.
   *
   * The reason to publish at all is the default rather than the reach. Both
   * declared members default to `false`, and `readOnlyHint: false` is a
   * positively wrong claim about `get_build_context` and
   * `get_project_requirements` — which is the claim this page was making by
   * saying nothing. `model.ts` holds the reasoning for every cell, including
   * the two rows that are corrections rather than readings.
   */
  annotations?: McpToolAnnotations;
  execute: (
    args: Record<string, unknown>,
    options?: McpToolExecuteOptions,
  ) => Promise<McpToolResult>;
}

/**
 * The options argument — and the only way a tool ever comes back off a host.
 *
 * `index.bs:605` reads `Promise<undefined> registerTool(ModelContextTool tool,
 * optional ModelContextRegisterToolOptions options = {})`, and the word
 * `unregisterTool` appears nowhere in the IDL. Removal is
 * `ModelContextRegisterToolOptions.signal` — *"An AbortSignal that unregisters
 * the tool when aborted"* (`index.bs:1157`), added by PR #147 on 2026-03-26.
 *
 * So a caller's teardown is an `abort()`, and this is how a caller gets to make
 * one. `use-webmcp.ts` opens one controller per effect run and aborts it in the
 * cleanup, which is what makes §9's *"cleaned up when the page changes"* true
 * of a conforming host rather than only of the shims.
 */
export interface McpRegisterToolOptions {
  /** Aborting it unregisters every tool that was handed it. */
  signal?: AbortSignal;
}

export interface McpHost {
  registerTool: (
    descriptor: McpToolDescriptor,
    options?: McpRegisterToolOptions,
  ) => unknown;
}

function hasRegisterTool(value: unknown): value is McpHost {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as McpHost).registerTool === "function"
  );
}

/**
 * The first surface that can register a tool, or `null`.
 *
 * Order is deliberate, and it is the spec's: `document` (`index.bs:585`) ahead
 * of the two superseded surfaces — `navigator`, which PR #184 removed on
 * 2026-05-27, and `window`, which no revision ever declared. Reading a property
 * off `document` cannot throw in practice, but a proxy could, so the whole
 * probe is guarded.
 */
export function findMcpHost(): McpHost | null {
  if (typeof window === "undefined") return null;

  try {
    const candidates: unknown[] = [
      (document as unknown as Record<string, unknown>).modelContext,
      (navigator as unknown as Record<string, unknown>).modelContext,
      (window as unknown as Record<string, unknown>).modelContext,
    ];
    return candidates.find(hasRegisterTool) ?? null;
  } catch {
    return null;
  }
}

/** Whether this browser can be handed tools at all. */
export function isWebMcpAvailable(): boolean {
  return findMcpHost() !== null;
}

/**
 * Registers one tool, and says whether the host took it.
 *
 * What `registerTool` returns is a promise, and no revision of the IDL has it
 * returning anything else. The comment this replaces said the proposal had
 * *moved* between three shapes — an `{unregister}` object, a bare disposer,
 * nothing at all — and a walk of `index.bs`'s history finds none of them; it
 * has read `Promise<undefined>` throughout. The two handle branches below are
 * kept regardless, because hosts written against that reading do exist and a
 * disposer they hand back is the only way to take a tool off them.
 *
 * `ok` is resolved from the promise for the reason the shape exists: every
 * refusal the IDL defines is *"return a promise rejected with"*. Read
 * synchronously — which is what this used to do — an accepted registration and
 * a rejected one are the same object, and the rejection nobody read reached the
 * page as an unhandled rejection. Attaching the handler both reports the
 * refusal and removes the event.
 *
 * A synchronous throw is not in the IDL and is still caught. An extension that
 * defines `modelContext` and throws inside it must not be able to take the page
 * down, and cleanup that silently does nothing is better than cleanup that
 * throws while a route is unmounting.
 */
export function registerTool(
  host: McpHost,
  descriptor: McpToolDescriptor,
  options?: McpRegisterToolOptions,
): McpRegistration {
  try {
    const handle = host.registerTool(descriptor, options);

    /* The spec's shape, and the only one that can carry a refusal. It resolves
       to `undefined`, so there is no handle inside to unregister with — the
       signal in `options` is what takes this tool back. */
    if (isThenable(handle)) {
      return {
        unregister: () => {},
        ok: Promise.resolve(handle).then(
          () => true,
          () => false,
        ),
      };
    }
    if (typeof handle === "function") {
      return {
        unregister: () => safely(handle as () => void),
        ok: Promise.resolve(true),
      };
    }
    if (
      typeof handle === "object" &&
      handle !== null &&
      typeof (handle as { unregister?: unknown }).unregister === "function"
    ) {
      const registration = handle as { unregister: () => void };
      return {
        unregister: () => safely(() => registration.unregister()),
        ok: Promise.resolve(true),
      };
    }

    /* Nothing at all. The call returned without refusing, so the tool is
       registered; a host of this shape is taken back by the signal or not at
       all. */
    return { unregister: () => {}, ok: Promise.resolve(true) };
  } catch {
    /* A host that cannot take this tool is a host without it. */
  }

  return { unregister: () => {}, ok: Promise.resolve(false) };
}

/**
 * A promise, or something claiming to be one.
 *
 * `instanceof Promise` is false for a promise made in another realm, which is
 * precisely where an extension's host object lives. Reading `.then` off an
 * exotic object can throw; every call site is inside the `try` above.
 */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}

function safely(fn: () => void) {
  try {
    fn();
  } catch {
    /* Unregistering during teardown must never be the thing that breaks. */
  }
}

/**
 * Serialises a tool's return value for the protocol — twice.
 *
 * Text, because that is the shape every current MCP client understands, and the
 * JSON inside it is the same object the panel's `Raw result` disclosure shows,
 * so what the agent reads and what the developer reads cannot drift. Then the
 * value itself, so a client that would rather not re-parse a string does not
 * have to. Two views of one object, never two objects.
 *
 * This is the only constructor of a result in the codebase, which decides one
 * thing worth deciding on purpose: **a refusal is structured too**. All three
 * call sites in `use-webmcp.ts` come through here, so an `isError` result
 * publishes the composed refusal — `{...detail, error, message, tool}` — as
 * `structuredContent` as well as text. That is the half of a tool call an agent
 * most needs to read mechanically, and the reason `error` is a stable key.
 */
export function asToolResult(value: unknown, isError = false): McpToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value ?? null, null, 2) }],
    structuredContent: value ?? null,
    isError: isError || undefined,
  };
}

/* --- Schemas --------------------------------------------------------------
   Written by hand and kept beside the tools they describe. They are short
   enough that a generator would be more code than it replaced, and an agent
   reads these before it reads anything else the product says.

   Each one carries an object-level `description` as well as a description per
   property. Nothing renders it — `copy.agentPanel.tools` is the sentence a
   person sees in the panel, and it is one line because a panel row is one line
   — so this is the place to put what a model needs and a reader does not: when
   to call the tool, what it will not do, and the edge that costs a wasted call
   if it is not known in advance.                                            */

/**
 * A tool that takes no arguments, and still says what it is for.
 *
 * A function where this used to be one shared constant, for two reasons that
 * arrive together. `get_build_context` and `verify_current_step` were literally
 * the same object — reached by two tools, six builds and both locales, so a
 * single write anywhere downstream would have been a write to every published
 * schema at once — and the object-level `description` below is per tool, which
 * one shared object cannot carry. Frozen as well as unshared, so the first half
 * of that cannot come back by a later edit.
 */
const noInput = (description: string) =>
  Object.freeze({
    type: "object",
    description,
    properties: Object.freeze({}),
    additionalProperties: false,
  });

/**
 * The workbench's schemas, for the build on the bench.
 *
 * A function rather than a constant: every enum below is a per-build set, and
 * writing them once produced a page that offered an agent the capstone's tests,
 * the capstone's steps and a mechanical scope on a build with no servo. The
 * facts come from `schemaFactsFor`; this only shapes them.
 */
export function workbenchSchemasFor(
  facts?: BuildSchemaFacts,
): Record<string, Record<string, unknown>> {
  return {
  get_build_context: noInput(
    "The whole bench in one call: which project is on it, where the rail is, " +
      "and every connection currently made. It changes nothing and needs " +
      "nothing selected first, so it is the call to make on arrival.",
  ),
  inspect_build: {
    type: "object",
    description:
      "Compares what is on the bench against the sketch and returns findings, " +
      "each with an id. Those ids are what show_correction takes; nothing " +
      "here moves a lead.",
    properties: {
      scope: {
        type: "string",
        enum: facts?.scopes ?? ["current_step", "wiring", "all"],
        description: "How much of the build to compare. Defaults to the step.",
      },
    },
    additionalProperties: false,
  },
  show_correction: {
    type: "object",
    description:
      "Points the workbench at one finding and says what is wrong with it, at " +
      "the depth detail_level asks for. It explains and highlights; the only " +
      "tool that repairs anything is attach_lead.",
    properties: {
      finding_id: {
        type: "string",
        description: "An id returned by inspect_build.",
      },
      detail_level: {
        type: "string",
        enum: ["hint", "explain", "exact"],
        /* The ladder was legible only from a refusal, and the default was
           legible nowhere: the handler reads `askedLevel ?? state.coaching`,
           so an omitted level follows the panel the reader is looking at
           rather than starting at the bottom. */
        description:
          "How much of the answer to give away — a ladder, least to most: " +
          "hint, explain, exact. Omitted, it follows the level the reader's " +
          "panel is already on.",
      },
    },
    required: ["finding_id"],
    additionalProperties: false,
  },
  /* Now that the schema knows which build it is describing, the two sets are
     enumerated: an agent can read what it may move and where, without a call.
     Left open on a build with no placement, where the tool refuses anyway. */
  attach_lead: {
    type: "object",
    description:
      "The one tool that changes the build: it seats a lead in a hole, joins " +
      "it to another lead, or — with no target — pulls it out again. Every " +
      "refusal names the argument and the reason, and the result reports what " +
      "the call cost in loosened, brokeJoins and leftBench.",
    properties: {
      lead: {
        type: "string",
        ...(facts?.leads.length ? { enum: facts.leads } : {}),
        description: "A lead of a part in this build.",
      },
      target: {
        type: ["string", "null"],
        ...(facts && facts.holes.length
          ? { enum: [...facts.holes, ...facts.leads, null] }
          : {}),
        /**
         * The default is destructive, so the schema says so — and says how far
         * it reaches.
         *
         * `target` is optional and the handler reads an absent one as `null`:
         * the lead comes out, every part that is left without an anchor goes
         * back in the kit, and any join made through that lead breaks with it.
         * None of that is bounded by the part the call names — one measured
         * `attach_lead("res.out")` returned two parts to the kit and broke a
         * join on a lead it had never mentioned — and the sentence here said
         * "the part", singular. An agent reading "optional" the ordinary way —
         * skip it when you do not care — undid work and was answered `ok`.
         *
         * The second correction is the enum's. It lists every lead in the
         * build, which is what makes it useful, but three of those values are
         * refused on sight: a lead of the same part, a lead already joined to
         * something, and a hole already taken. A schema that offers a value the
         * handler will not accept has to say so, or the enum reads as a
         * promise.
         */
        default: null,
        description:
          "A board hole, another lead in this build, or null to leave it " +
          "loose. Omitting it means null: the lead comes out, every part left " +
          "without an anchor returns to the kit — two of them, on one measured " +
          "call — and joins made through that lead break; the result names " +
          "them in leftBench and brokeJoins. The enum lists every lead, but a " +
          "lead of the same part, or one already taken, is refused.",
      },
    },
    required: ["lead"],
    additionalProperties: false,
  },
  verify_current_step: noInput(
    "Checks the current step against the sketch and marks it complete if it " +
      "passes. A step can fail with every connection matched — mechanicalOk " +
      "is the servo horn, strays counts joins the sketch never asked for — so " +
      "read those before concluding the wiring is wrong.",
  ),
  navigate_build_step: {
    type: "object",
    description:
      "Moves the rail to another step of this build. It changes what is on " +
      "screen and nothing else: every connection stays where it is, no step " +
      "is ticked, and the ids it takes are this build's only.",
    properties: {
      step_id: {
        type: "string",
        /* This build's steps, not every step in the product. The list used to
           be all eleven, so an agent could navigate chapter one's bench to a
           step belonging to chapter six — and the rail obligingly redrew
           itself as the other build's. */
        enum: facts?.stepIds ?? [],
        description:
          "A step of this build, in the order the rail shows them — the first " +
          "is the kit check. Moving is not verifying; nothing is ticked.",
      },
    },
    required: ["step_id"],
    additionalProperties: false,
  },
  run_functional_test: {
    type: "object",
    description:
      "Runs this build's own checks on the simulated board and reports what " +
      "each one saw. The checks are per build, not a fixed list — test " +
      "enumerates the ones this bench has — and a run that fails is still a " +
      "call that succeeded.",
    properties: {
      test: {
        type: "string",
        /* The checks this build actually makes. Chapter one runs `wiring` and
           `breathing`; it has neither a sensor nor a servo to test. */
        enum: facts?.tests ?? ["full_system"],
        description: "One check by id, or full_system for all of them.",
      },
    },
    required: ["test"],
    additionalProperties: false,
  },
  };
}

/**
 * The six builds, by id, read from the catalogue rather than copied.
 *
 * `project` is an argument of three of the four library tools and was published
 * as a free string over a closed set of six. Same reasoning as `componentIds`
 * below: two hand-kept copies of one list drift, and this one would drift the
 * moment a seventh chapter is written.
 */
const projectIds = Object.freeze(projects.map((project) => project.id));

/**
 * The `project` argument, published closed and shared on purpose.
 *
 * One object across the three tools that take it, because here the three really
 * do mean the same thing — unlike `noInput`, whose two users had different
 * things to say. Frozen for the reason `noInput` is now a function: a schema
 * three tools reach must not be writable by any of them.
 *
 * The enum is the id set. A slug is accepted too and the sentence says so,
 * because the handler resolves both and the product's own URLs are slugs;
 * enumerating twelve values for six builds would publish an ambiguity instead
 * of a vocabulary.
 */
const projectArgument = Object.freeze({
  type: "string",
  enum: projectIds,
  description: "A project id — a slug is also accepted.",
});

export const librarySchemas: Record<string, Record<string, unknown>> = {
  find_projects: {
    type: "object",
    description:
      "Filters the catalogue and redraws the grid the reader is looking at. " +
      "Every call replaces the whole filter rather than adding to it, so an " +
      "omitted argument clears that filter — and a call with no arguments is " +
      "the way back to all six builds.",
    properties: {
      search: { type: "string", description: "Free text over names and goals." },
      difficulty: {
        type: "array",
        items: { type: "string", enum: difficulties },
        description:
          "Levels a build may be at; several are OR-ed, and an empty array is " +
          "every level.",
      },
      max_minutes: { type: "number", description: "Upper bound on duration." },
      /**
       * Both sets are closed, and both used to be published open.
       *
       * `difficulty` beside them carried an enum from the start, so the
       * omission was an inconsistency inside one schema object rather than a
       * policy. The cost was not a crash: the handler passed the strings
       * straight into an exact `includes`, answered `ok, count: 0` — the same
       * answer an honestly empty query gives — and wrote the guess into the
       * toolbar the person is looking at, which then showed an active-looking
       * filter button over six unticked checkboxes and an empty grid. The
       * likeliest wrong guess was never exotic: `sensorMoisture` and
       * `sensorMotion` are real ids in the same file, in the vocabulary the
       * kit shelf uses, and neither is a `ComponentId`.
       *
       * Enumerated from the exported arrays rather than copied, for the reason
       * `stepIds` states above: two hand-kept copies of one list drift.
       */
      components: {
        type: "array",
        items: { type: "string", enum: componentIds },
        description: "Component ids the build must use at least one of.",
      },
      concepts: {
        type: "array",
        items: { type: "string", enum: conceptIds },
        description: "Learning-goal ids the build must teach at least one of.",
      },
      ready_only: {
        type: "boolean",
        description: "Only builds that have a guided workbench.",
      },
    },
    additionalProperties: false,
  },
  open_project: {
    type: "object",
    description:
      "Opens a project's detail screen — its parts, its length and what it " +
      "teaches. It navigates; it does not start the build.",
    properties: {
      project: projectArgument,
    },
    required: ["project"],
    additionalProperties: false,
  },
  get_project_requirements: {
    type: "object",
    description:
      "Answers what a project needs — parts, length, level, learning goals — " +
      "without opening it or starting it. Nothing on screen moves.",
    properties: {
      project: projectArgument,
    },
    required: ["project"],
    additionalProperties: false,
  },
  start_project: {
    type: "object",
    description:
      "Starts a build and opens its workbench, where the seven bench tools " +
      "are the ones registered. Both modes run on the simulated board, so " +
      "nothing here depends on the reader owning the parts.",
    properties: {
      project: projectArgument,
      mode: {
        type: "string",
        enum: ["guided", "demo"],
        description:
          "Both run on the simulated board; the kit checklist is advisory either way.",
      },
    },
    required: ["project"],
    additionalProperties: false,
  },
};
