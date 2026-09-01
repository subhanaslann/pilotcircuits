import type { BuildSchemaFacts } from "@/lib/agent/builds";
import { componentIds } from "@/lib/projects/catalog";
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
 * `frontend-plan.md` §9 names `document.modelContext.registerTool(...)`; the
 * W3C proposal as it stands puts the same object on `navigator`. Rather than
 * betting on one, the probe tries all three surfaces and takes the first that
 * actually exposes `registerTool`. If none does — which is the case in every
 * browser this was developed against — it returns `null`, the interface says so
 * out loud, and the manual demo controls carry the build. §18 asks for both
 * halves of that sentence and this is where they are kept.
 *
 * Every touch of the host is wrapped: an extension that defines `modelContext`
 * and then throws inside `registerTool` must not be able to take the page down
 * with it. A tool that fails to register is a tool that is not there, which is
 * a state the product already knows how to render.
 */

/** What the browser hands back, when it hands anything back at all. */
export interface McpRegistration {
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
   */
  ok: boolean;
}

/** The result shape the protocol expects from a tool call. */
export interface McpToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

export interface McpToolDescriptor {
  name: string;
  description: string;
  /** JSON Schema for the arguments. Hand-written; there is no generator here. */
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<McpToolResult>;
}

export interface McpHost {
  registerTool: (descriptor: McpToolDescriptor) => unknown;
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
 * Order is deliberate: the standards-track location first, the two the brief
 * and early demos used after it. Reading a property off `navigator` cannot
 * throw in practice, but a proxy could, so the whole probe is guarded.
 */
export function findMcpHost(): McpHost | null {
  if (typeof window === "undefined") return null;

  try {
    const candidates: unknown[] = [
      (navigator as unknown as Record<string, unknown>).modelContext,
      (window as unknown as Record<string, unknown>).modelContext,
      (document as unknown as Record<string, unknown>).modelContext,
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
 * Registers one tool and returns how to take it back.
 *
 * The proposal has moved on what `registerTool` returns — an object with
 * `unregister`, a bare disposer function, or nothing — so all three are
 * accepted. Cleanup that silently does nothing is better than cleanup that
 * throws while a route is unmounting.
 *
 * Returning without throwing is what `ok` reports, and it is the only signal
 * available: the third shape returns no handle, so "registered" and "cannot be
 * unregistered" are the same state and both are true. A throw is the one
 * unambiguous refusal, and it is the case the badge was getting wrong.
 */
export function registerTool(
  host: McpHost,
  descriptor: McpToolDescriptor,
): McpRegistration {
  try {
    const handle = host.registerTool(descriptor);

    if (typeof handle === "function") {
      return { unregister: () => safely(handle as () => void), ok: true };
    }
    if (
      typeof handle === "object" &&
      handle !== null &&
      typeof (handle as McpRegistration).unregister === "function"
    ) {
      const registration = handle as McpRegistration;
      return {
        unregister: () => safely(() => registration.unregister()),
        ok: true,
      };
    }

    /* The third shape the proposal allows: nothing at all. The call returned,
       so the tool is registered — there is simply no way to take it back. */
    return { unregister: () => {}, ok: true };
  } catch {
    /* A host that cannot take this tool is a host without it. */
  }

  return { unregister: () => {}, ok: false };
}

function safely(fn: () => void) {
  try {
    fn();
  } catch {
    /* Unregistering during teardown must never be the thing that breaks. */
  }
}

/**
 * Serialises a tool's return value for the protocol.
 *
 * Text rather than a structured field, because that is the shape every current
 * MCP client understands. The JSON inside it is the same object the panel's
 * `Raw result` disclosure shows, so what the agent reads and what the developer
 * reads cannot drift.
 */
export function asToolResult(value: unknown, isError = false): McpToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value ?? null, null, 2) }],
    isError: isError || undefined,
  };
}

/* --- Schemas --------------------------------------------------------------
   Written by hand and kept beside the tools they describe. They are short
   enough that a generator would be more code than it replaced, and an agent
   reads these before it reads anything else the product says.               */

const noInput = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

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
  get_build_context: noInput,
  inspect_build: {
    type: "object",
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
    properties: {
      finding_id: {
        type: "string",
        description: "An id returned by inspect_build.",
      },
      detail_level: {
        type: "string",
        enum: ["hint", "explain", "exact"],
        description: "How much of the answer to give away.",
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
         * The default is destructive, so the schema says so.
         *
         * `target` is optional and the handler reads an absent one as `null`:
         * the lead comes out, and if it was the part's last anchor the part
         * leaves the bench and goes back in the kit. An agent reading
         * "optional" the ordinary way — skip it when you do not care — undid
         * work and was answered `ok`. The `default` is the machine-readable
         * half; the sentence is the half a model actually reads.
         */
        default: null,
        description:
          "A board hole, another part's free lead, or null to leave it loose. " +
          "Omitting it means null: the lead comes out, and the part returns to " +
          "the kit if this was its only anchor.",
      },
    },
    required: ["lead"],
    additionalProperties: false,
  },
  verify_current_step: noInput,
  navigate_build_step: {
    type: "object",
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

export const librarySchemas: Record<string, Record<string, unknown>> = {
  find_projects: {
    type: "object",
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
    properties: {
      project: { type: "string", description: "A project id or its slug." },
    },
    required: ["project"],
    additionalProperties: false,
  },
  get_project_requirements: {
    type: "object",
    properties: {
      project: { type: "string", description: "A project id or its slug." },
    },
    required: ["project"],
    additionalProperties: false,
  },
  start_project: {
    type: "object",
    properties: {
      project: { type: "string", description: "A project id or its slug." },
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
