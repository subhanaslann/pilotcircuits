import type { BuildSchemaFacts } from "@/lib/agent/builds";
import { say } from "@/lib/agent/line";
import type { AgentTool, McpToolAnnotations } from "@/lib/agent/model";
import type { ToolOutcome } from "@/lib/agent/services";
import type { Copy } from "@/content/i18n";
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

/**
 * What `execute` resolves with: the value itself, never an envelope.
 *
 * The IDL types the callback `Promise<any>` (`index.bs:1077`), and the host's
 * execution algorithm runs *"serialize a JavaScript value to a JSON string"*
 * on whatever the promise settles with and hands that string to the model.
 * This used to be MCP's `CallToolResult` — `{content: [{type: "text", text}],
 * structuredContent, isError}` — on the reasoning that a client doing
 * `JSON.parse(result.content[0].text)` would read the same string either way.
 * Measured on Chrome 152 with the WebMCP flags, no client does: the model
 * received the envelope verbatim — 6 618 characters for 2 425 of payload on the
 * first call a judge's agent makes, the same object twice, every quote
 * escaped — and `isError` reached nobody. ChatGPT's documentation, Chrome's,
 * the explainer's demo and the Model Context Tool Inspector all return and read
 * bare values; the spec's only error channel is a rejected promise, which the
 * model sees as an `UnknownError` with no body.
 *
 * So a result is the object the handler returned, and a refusal is a resolved
 * object too — `{...detail, error, message, tool}`, composed by `executeVia`
 * below, never a rejection: a rejection loses `error`, `message`, `argument`
 * and `valid`, which are the parts an agent can act on. Never `undefined`,
 * because the serialiser throws on it and the host then reports the execution
 * as failed; `asToolResult` turns it into `null`.
 *
 * No `outputSchema` describing it, and not for want of trying: it is not a
 * member of `ModelContextTool` (`index.bs:1057-1065`), WebIDL drops undeclared
 * members without an error, and the explainer has it under *Future work*
 * against an open issue. It would reach no host this product can talk to.
 */
export type McpToolResult = NonNullable<unknown> | null;

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
 * Normalises a tool's return value into what `execute` resolves with.
 *
 * One rule, and this is the only constructor of a result in the codebase so it
 * holds everywhere: **`undefined` becomes `null`.** HTML's *"serialize a
 * JavaScript value to a JSON string"* throws on `undefined`, and the host's
 * execution algorithm then reports the call as failed — a handler that returns
 * nothing would reach the model as an error with no body. Everything else
 * passes through as it is: the same object the panel's `Raw result` disclosure
 * renders, so what the agent reads and what the developer reads cannot drift.
 *
 * This used to build MCP's `{content, structuredContent, isError}` around the
 * value; `McpToolResult` says what that cost and why it went.
 */
export function asToolResult(value: unknown): McpToolResult {
  return value ?? null;
}

/**
 * The two things the bridge needs from a session, read at call time.
 *
 * Functions rather than values because a registration outlives the render that
 * made it: `session.run` is a new function on every render and the dictionary
 * changes with the locale, so `use-webmcp.ts` hands in readers of a ref rather
 * than the objects themselves. A test hands in plain closures.
 */
export interface McpToolRunner {
  run: (
    name: AgentTool,
    args: Record<string, unknown>,
    options: { signal?: AbortSignal },
  ) => Promise<ToolOutcome>;
  copy: () => Copy;
}

/**
 * The `execute` a host is handed for one tool: a call into `session.run`, and
 * a result whatever happens.
 *
 * Lifted out of the hook so the composition can be exercised without a host or
 * a React tree; `webmcp.test.ts` calls it through a spec-shaped host's stored
 * descriptor. Nothing thrown crosses this line. The runner already turns a
 * throwing handler into an error outcome, but the throw can happen before it —
 * `navigate_build_step` with a step id that does not exist fails while the
 * entry's own headline is being composed — and a host that does not enforce
 * the schema would get an exception where the protocol promises a result.
 */
export function executeVia(
  name: AgentTool,
  runner: McpToolRunner,
): McpToolDescriptor["execute"] {
  return async (args, options) => {
    /**
     * A call the caller has already cancelled does not start at all.
     *
     * The bridge's own half of the signal, and the cheapest one: the host
     * aborts when the agent walks away and then discards whatever the promise
     * settles with, so anything begun after that point runs into a void. The
     * half that matters more is inside the run — `attach_lead` awaits two
     * animation phases before it commits, and only the handler is in a
     * position to decide not to commit at 900 ms of a 1160 ms seat — which is
     * why the signal is handed to `session.run` below rather than being
     * consumed here.
     *
     * Racing the signal *here* instead of passing it on would be worse than
     * silence: the promise would settle "cancelled" while the bench went on
     * moving, so the one caller who asked us to stop would be the only one
     * told that we had.
     */
    if (options?.signal?.aborted) {
      return asToolResult({ error: "aborted", tool: name });
    }

    try {
      const outcome = await runner.run(
        name,
        args ?? {},
        /* Rewrapped rather than forwarded: `ToolExecuteCallbackOptions` is the
           protocol's dictionary and this is the runner's, and only the signal
           is meant to cross between them. `run` reads it inside the queue, so
           a call cancelled while it waits its turn behind another never
           runs. */
        { signal: options?.signal },
      );
      if (outcome.status !== "error") return asToolResult(outcome.result);

      /**
       * A refusal, with everything that makes it actionable.
       *
       * This used to be the key alone — `{"error":"unknownCheck"}` — and the
       * key is the one part of a refusal that helps nobody. `unknownCheck`
       * carries the list of checks this build runs; `holeTaken` carries the
       * pin; the four validated arguments carry what arrived and what would
       * have been accepted. All of it was composed, shown to the person in a
       * toast, and then dropped on the way to the one caller that could act
       * on it.
       *
       * Three fields, because they answer three different questions and no
       * client reads all three: `error` is the stable key to branch on,
       * `message` is the sentence the person is looking at (same dictionary,
       * same words — the agent and the reader cannot be told different
       * things), and `result` is the structured refusal where there is one.
       * `result` is spread rather than nested so a caller reads `refused` /
       * `argument` / `valid` at the top level.
       *
       * The two this used to name as carrying nothing now carry the most: the
       * unknown project answers `{argument, value, valid}` with all six ids,
       * and the capstone's `noPlacement` answers `{argument, value, reason:
       * "authorPlaced"}` so an agent learns on call #1 rather than call #12
       * that the bench takes no writes. The defensive read stays regardless —
       * this bridge does not get to assume a shape it does not own, and
       * `status: "error"` alone is still reachable from a throw.
       */
      const detail = outcome.result;
      return asToolResult({
        /* Spread first, so a payload can never shadow the three fields this
           bridge is contractually responsible for. */
        ...(detail && typeof detail === "object" ? detail : {}),
        error: outcome.errorMessage?.k ?? "failed",
        ...(outcome.errorMessage
          ? { message: say(runner.copy(), outcome.errorMessage) }
          : {}),
        tool: name,
      });
    } catch (error) {
      return asToolResult({
        error: error instanceof Error ? error.message : "failed",
        tool: name,
      });
    }
  };
}

/* --- Schemas --------------------------------------------------------------
   Written by hand and kept beside the tools they describe. They are short
   enough that a generator would be more code than it replaced, and an agent
   reads these before it reads anything else the product says.

   The shape is here; every sentence in it comes from the dictionary. A schema
   below is an arrangement of enums, types and required lists, and the prose
   that explains them is `copy.agentPanel.toolDocs` (one per tool, published as
   the object-level `description`) and `copy.agentPanel.toolArgs` (one per
   argument). That is why both functions take a `Copy`: the tool `description`
   and `title` the caller publishes were already localised, and an agent reading
   a Turkish tool description, English argument documentation and then a Turkish
   refusal about the argument it got wrong was reading three registers of one
   sentence.

   ## The drift this arrangement can have, and where to look for it

   **Six of those argument sentences are claims about an `enum` computed here.**
   `scope`, `detail_level`, `step_id` and `test` describe per-build lists that
   arrive in `facts`; `components` and `concepts` describe `componentIds` and
   `conceptIds`, imported from the files that own them. The enum is the source
   of truth in every case — it is derived, never hand-kept — and the sentence in
   the dictionary is a description of it that nothing checks.

   So drift here looks like a sentence that is still true of last month's list.
   It is not hypothetical: `attach_lead.target` was measured promising "another
   part's free lead" over an enum that listed every lead, free or taken, and
   `detail_level` named a ladder whose order appeared nowhere. Both were
   repaired, in `en` and `tr`, on the way into the dictionary.

   The rule for anyone changing one of those lists: change the sentence in both
   locales in the same commit, and read them against each other. `webmcp.test.ts`
   holds the two clauses a machine can check — the ladder's order, and that
   `detail_level` never claims to default to `hint`, which two separate readings
   of this file got wrong — and prose is otherwise only as honest as its last
   reader.                                                                 */

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
  facts: BuildSchemaFacts | undefined,
  copy: Copy,
): Record<string, Record<string, unknown>> {
  const docs = copy.agentPanel.toolDocs;
  const args = copy.agentPanel.toolArgs;

  return {
  get_build_context: noInput(docs.get_build_context),
  inspect_build: {
    type: "object",
    description: docs.inspect_build,
    properties: {
      scope: {
        type: "string",
        enum: facts?.scopes ?? ["current_step", "wiring", "all"],
        description: args.inspect_build.scope,
      },
    },
    additionalProperties: false,
  },
  show_correction: {
    type: "object",
    description: docs.show_correction,
    properties: {
      finding_id: {
        type: "string",
        description: args.show_correction.finding_id,
      },
      detail_level: {
        type: "string",
        enum: ["hint", "explain", "exact"],
        /* The ladder was legible only from a refusal, and the default was
           legible nowhere: the handler reads `askedLevel ?? state.coaching`,
           so an omitted level follows the panel the reader is looking at
           rather than starting at the bottom. Both facts are in the sentence
           now, in both languages, and this enum is the ladder it names. */
        description: args.show_correction.detail_level,
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
    description: docs.attach_lead,
    properties: {
      lead: {
        type: "string",
        ...(facts?.leads.length ? { enum: facts.leads } : {}),
        description: args.attach_lead.lead,
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
         *
         * Both corrections now live in `copy.agentPanel.toolArgs.attach_lead`,
         * in two languages, describing the enum built three lines above. This
         * is the pair the schema block's drift note is about: change what goes
         * into that enum and this sentence is the thing that silently stops
         * being true.
         */
        default: null,
        description: args.attach_lead.target,
      },
    },
    required: ["lead"],
    additionalProperties: false,
  },
  verify_current_step: noInput(docs.verify_current_step),
  navigate_build_step: {
    type: "object",
    description: docs.navigate_build_step,
    properties: {
      step_id: {
        type: "string",
        /* This build's steps, not every step in the product. The list used to
           be all eleven, so an agent could navigate chapter one's bench to a
           step belonging to chapter six — and the rail obligingly redrew
           itself as the other build's. */
        enum: facts?.stepIds ?? [],
        description: args.navigate_build_step.step_id,
      },
    },
    required: ["step_id"],
    additionalProperties: false,
  },
  run_functional_test: {
    type: "object",
    description: docs.run_functional_test,
    properties: {
      test: {
        type: "string",
        /* The checks this build actually makes. Chapter one runs `wiring` and
           `breathing`; it has neither a sensor nor a servo to test. */
        enum: facts?.tests ?? ["full_system"],
        description: args.run_functional_test.test,
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
 * three tools reach must not be writable by any of them. One dictionary key for
 * the same reason, and it is the one entry in `toolArgs` that is not nested
 * under a tool.
 *
 * The enum is the id set. A slug is accepted too and the sentence says so,
 * because the handler resolves both and the product's own URLs are slugs;
 * enumerating twelve values for six builds would publish an ambiguity instead
 * of a vocabulary.
 */
const projectArgument = (description: string) =>
  Object.freeze({
    type: "string",
    enum: projectIds,
    description,
  });

/**
 * The library's four, which have no per-build facts and still have a language.
 *
 * A function now for the one reason `workbenchSchemasFor` always was one: what
 * it returns depends on something the caller knows and this file does not. That
 * used to be the build on the bench; it is now also the dictionary the reader
 * is in.
 */
export function librarySchemasFor(
  copy: Copy,
): Record<string, Record<string, unknown>> {
  const docs = copy.agentPanel.toolDocs;
  const args = copy.agentPanel.toolArgs;
  const project = projectArgument(args.project);

  return {
  find_projects: {
    type: "object",
    description: docs.find_projects,
    properties: {
      search: { type: "string", description: args.find_projects.search },
      difficulty: {
        type: "array",
        items: { type: "string", enum: difficulties },
        description: args.find_projects.difficulty,
      },
      max_minutes: {
        type: "number",
        description: args.find_projects.max_minutes,
      },
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
        description: args.find_projects.components,
      },
      concepts: {
        type: "array",
        items: { type: "string", enum: conceptIds },
        description: args.find_projects.concepts,
      },
      ready_only: {
        type: "boolean",
        description: args.find_projects.ready_only,
      },
    },
    additionalProperties: false,
  },
  open_project: {
    type: "object",
    description: docs.open_project,
    properties: {
      project,
    },
    required: ["project"],
    additionalProperties: false,
  },
  get_project_requirements: {
    type: "object",
    description: docs.get_project_requirements,
    properties: {
      project,
    },
    required: ["project"],
    additionalProperties: false,
  },
  start_project: {
    type: "object",
    description: docs.start_project,
    properties: {
      project,
      mode: {
        type: "string",
        enum: ["guided", "demo"],
        description: args.start_project.mode,
      },
    },
    required: ["project"],
    additionalProperties: false,
  },
  };
}
