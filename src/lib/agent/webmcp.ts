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
 * accepted and anything else yields a no-op. Cleanup that silently does
 * nothing is better than cleanup that throws while a route is unmounting.
 */
export function registerTool(
  host: McpHost,
  descriptor: McpToolDescriptor,
): McpRegistration {
  try {
    const handle = host.registerTool(descriptor);

    if (typeof handle === "function") {
      return { unregister: () => safely(handle as () => void) };
    }
    if (
      typeof handle === "object" &&
      handle !== null &&
      typeof (handle as McpRegistration).unregister === "function"
    ) {
      const registration = handle as McpRegistration;
      return { unregister: () => safely(() => registration.unregister()) };
    }
  } catch {
    /* A host that cannot take this tool is a host without it. */
  }

  return { unregister: () => {} };
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

export const workbenchSchemas: Record<string, Record<string, unknown>> = {
  get_build_context: noInput,
  inspect_build: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        enum: ["current_step", "wiring", "mechanical", "all"],
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
  verify_current_step: noInput,
  navigate_build_step: {
    type: "object",
    properties: {
      step_id: {
        type: "string",
        enum: ["kit", "place", "sensor", "servo", "leds", "upload", "test"],
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
        enum: ["sensor", "servo", "leds", "full_system"],
      },
    },
    required: ["test"],
    additionalProperties: false,
  },
};

export const librarySchemas: Record<string, Record<string, unknown>> = {
  find_projects: {
    type: "object",
    properties: {
      search: { type: "string", description: "Free text over names and goals." },
      difficulty: {
        type: "array",
        items: { type: "string", enum: ["beginner", "intermediate"] },
      },
      max_minutes: { type: "number", description: "Upper bound on duration." },
      components: {
        type: "array",
        items: { type: "string" },
        description: "Component ids the build must use at least one of.",
      },
      concepts: {
        type: "array",
        items: { type: "string" },
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
