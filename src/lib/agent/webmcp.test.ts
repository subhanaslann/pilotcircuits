import { describe, expect, it } from "vitest";
import { en } from "@/content/locales/en";
import { tr } from "@/content/locales/tr";
import {
  libraryTools,
  toolAnnotations,
  workbenchTools,
} from "@/lib/agent/model";
import { componentIds, projects } from "@/lib/projects/catalog";
import { conceptIds, difficulties } from "@/lib/projects/filter";
import { hasBench, schemaFactsFor } from "@/lib/agent/builds";
import {
  asToolResult,
  findMcpHost,
  librarySchemas,
  registerTool,
  workbenchSchemasFor,
  type McpHost,
} from "@/lib/agent/webmcp";

/**
 * The eleven schemas, as a contract rather than as prose.
 *
 * `webmcp.ts`'s own header says an agent reads these before it reads anything
 * else the product says, and the two ways that sentence had stopped being true
 * are both mechanical, so both are asserted here rather than re-read:
 *
 *   *A property with no `description`.* Two of the sixteen published
 *   properties had none — `navigate_build_step.step_id`, over a bare enum of
 *   ids like `tlGround`, and `find_projects.difficulty` — so the schema
 *   offered a vocabulary with nothing saying what the words meant.
 *
 *   *An open string over a closed set.* `find_projects.components` and
 *   `.concepts` were `{type:"string"}` over six and twelve fixed ids, beside a
 *   `difficulty` in the same object that was already enumerated. A wrong guess
 *   was answered `ok, count: 0` — indistinguishable from an honestly empty
 *   query — and written into the toolbar the person is looking at.
 *
 * The workbench half is per build and already derived from `schemaFactsFor`;
 * what is asserted there is that the derivation is what reaches the schema, on
 * every one of the six benches, so a seventh chapter cannot publish chapter
 * six's steps.
 */

const benches = projects.map((p) => p.id).filter(hasBench);

/** Every leaf a published schema offers an agent, with its path. */
function properties(
  schema: Record<string, unknown>,
): [string, Record<string, unknown>][] {
  const props = schema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  return Object.entries(props ?? {});
}

describe("every published property documents itself", () => {
  it("in the four library schemas", () => {
    const undocumented = Object.entries(librarySchemas).flatMap(
      ([tool, schema]) =>
        properties(schema)
          .filter(([, prop]) => !prop.description)
          .map(([name]) => `${tool}.${name}`),
    );

    expect(undocumented).toEqual([]);
  });

  it.each(benches)("in every schema on %s's bench", (projectId) => {
    const schemas = workbenchSchemasFor(schemaFactsFor(projectId));
    const undocumented = Object.entries(schemas).flatMap(([tool, schema]) =>
      properties(schema)
        .filter(([, prop]) => !prop.description)
        .map(([name]) => `${tool}.${name}`),
    );

    expect(undocumented).toEqual([]);
  });
});

describe("a closed set is published closed", () => {
  it("find_projects enumerates all three of its vocabularies", () => {
    const props = Object.fromEntries(properties(librarySchemas.find_projects!));
    const itemsOf = (name: string) =>
      (props[name]!.items as Record<string, unknown>).enum;

    expect(itemsOf("difficulty")).toEqual(difficulties);
    expect(itemsOf("components")).toEqual(componentIds);
    expect(itemsOf("concepts")).toEqual(conceptIds);
  });

  it("and the sets are the ones the filter actually matches on", () => {
    /* Six and twelve, from the two files that own them. An id added to either
       union without being added to its runtime table is a compile error there;
       this is the clause that says the schema reads that table and not a
       hand-kept copy of it. */
    expect(componentIds.length).toBe(6);
    expect(conceptIds.length).toBe(12);
  });

  it.each(benches)("%s publishes its own steps, checks and scopes", (id) => {
    const facts = schemaFactsFor(id)!;
    const schemas = workbenchSchemasFor(facts);
    const enumOf = (tool: string, prop: string) =>
      (
        (schemas[tool]!.properties as Record<string, Record<string, unknown>>)[
          prop
        ] as Record<string, unknown>
      ).enum;

    expect(enumOf("navigate_build_step", "step_id")).toEqual(facts.stepIds);
    expect(enumOf("run_functional_test", "test")).toEqual(facts.tests);
    expect(enumOf("inspect_build", "scope")).toEqual(facts.scopes);
  });

  it.each(benches.filter((id) => schemaFactsFor(id)!.leads.length))(
    "%s publishes the leads and holes attach_lead may be given",
    (id) => {
      const facts = schemaFactsFor(id)!;
      const props = Object.fromEntries(
        properties(workbenchSchemasFor(facts).attach_lead!),
      );

      expect(props.lead!.enum).toEqual(facts.leads);
      expect(props.target!.enum).toEqual([
        ...facts.holes,
        ...facts.leads,
        null,
      ]);
    },
  );
});

describe("attach_lead's optional argument states its default", () => {
  it.each(benches)("on %s", (id) => {
    const props = Object.fromEntries(
      properties(workbenchSchemasFor(schemaFactsFor(id)).attach_lead!),
    );
    const sentence = String(props.target!.description);

    /* Omitting `target` detaches the lead and can send the part back to the
       kit. An agent reading "optional" the ordinary way undid work and was
       answered `ok`, so the destructive default is published both ways: as
       JSON Schema for a validator, and in the sentence a model reads. */
    expect(props.target).toHaveProperty("default", null);
    expect(sentence).toMatch(/[Oo]mitting it means null/);

    /* And how far the detach reaches. It is not one part and not one lead:
       one measured call returned two parts to the kit and broke a join on a
       lead it never named, while this sentence said "the part". The two
       result fields that report it are named here because the sentence is the
       only channel that reaches a host. */
    expect(sentence).toMatch(/leftBench/);
    expect(sentence).toMatch(/brokeJoins/);

    /* The enum lists every lead in the build, including ones the handler
       refuses on sight. A schema that offers a value the handler will not take
       has to say so. */
    expect(sentence).toMatch(/refused/);
  });
});

describe("show_correction's ladder is published, and its real default", () => {
  it.each(benches)("on %s", (id) => {
    const props = Object.fromEntries(
      properties(workbenchSchemasFor(schemaFactsFor(id)).show_correction!),
    );
    const sentence = String(props.detail_level!.description);

    /* The three levels were an enum with no ordering, so nothing said `exact`
       gives more away than `hint`. */
    expect(sentence).toMatch(/hint, explain, exact/);

    /* And the default is `askedLevel ?? state.coaching` — the level the
       reader's own panel is on, not the bottom of the ladder. "Defaults to
       hint" is the wrong sentence and this is the assertion that keeps it out:
       two separate readings of this argument proposed it. */
    expect(sentence).not.toMatch(/[Dd]efaults to hint/);
    expect(sentence).toMatch(/panel is already on/);
  });
});

describe("a schema says what its tool is for", () => {
  /* The object-level `description` nothing renders. `copy.agentPanel.tools` is
     the one-line sentence a person reads in the panel; this is the two or three
     a model needs — when to call it, what it will not do, and the edge that
     costs a wasted call. Every published schema has one. */
  const long = (schema: Record<string, unknown>) =>
    typeof schema.description === "string" && schema.description.length > 60;

  it("in the four library schemas", () => {
    const silent = Object.entries(librarySchemas)
      .filter(([, schema]) => !long(schema))
      .map(([tool]) => tool);

    expect(silent).toEqual([]);
  });

  it.each(benches)("in every schema on %s's bench", (id) => {
    const silent = Object.entries(workbenchSchemasFor(schemaFactsFor(id)))
      .filter(([, schema]) => !long(schema))
      .map(([tool]) => tool);

    expect(silent).toEqual([]);
  });
});

describe("the three project arguments publish the closed set", () => {
  /* Six ids, read from the catalogue. It was a free string over a closed set,
     beside a `difficulty` in the same file that had been enumerated from the
     start. A wrong guess is answered by the handler, not by the schema. */
  const ids = projects.map((p) => p.id);

  it.each(["open_project", "get_project_requirements", "start_project"])(
    "%s",
    (tool) => {
      const props = Object.fromEntries(properties(librarySchemas[tool]!));

      expect(props.project!.enum).toEqual(ids);
      expect(String(props.project!.description)).toMatch(/slug/);
    },
  );
});

describe("no two tools share one schema object", () => {
  /* `get_build_context` and `verify_current_step` were the same object — one
     mutable object reached by two tools, six builds and both locales, so a
     single write downstream was a write to every published schema at once.
     Frozen as well as unshared, so a write is a throw rather than a silent
     corruption of the other ten. */
  it.each(benches)("on %s", (id) => {
    const schemas = workbenchSchemasFor(schemaFactsFor(id));

    expect(schemas.get_build_context).not.toBe(schemas.verify_current_step);
    expect(Object.isFrozen(schemas.get_build_context)).toBe(true);
    expect(Object.isFrozen(schemas.verify_current_step)).toBe(true);
  });

  it("and a second call does not hand back the first call's objects", () => {
    const first = workbenchSchemasFor(schemaFactsFor(benches[0]!));
    const second = workbenchSchemasFor(schemaFactsFor(benches[0]!));

    expect(first.get_build_context).not.toBe(second.get_build_context);
  });
});

/**
 * The two tables `use-webmcp.ts` publishes from, checked against the union it
 * publishes for.
 *
 * They live in `model.ts` and the locales, and neither has a test of its own —
 * but the registration is the only thing that reads them, and a hole in either
 * reaches a host as `title: undefined` or as no annotations at all. Eleven
 * names, three sources, asserted where they are spent.
 */
describe("every registered tool has something to publish", () => {
  const everyTool = [...workbenchTools, ...libraryTools];

  it("eleven, and no more", () => {
    expect(everyTool.length).toBe(11);
    expect(new Set(everyTool).size).toBe(11);
  });

  it.each(everyTool)("%s has a title in both languages", (name) => {
    for (const copy of [en, tr]) {
      const title = copy.agentPanel.toolTitles[name];

      expect(typeof title).toBe("string");
      expect(title.trim().length).toBeGreaterThan(0);
      /* A name, not a sentence: `title` is what a host prints in a list where
         the id would otherwise be. */
      expect(title.length).toBeLessThan(copy.agentPanel.tools[name].length);
    }
  });

  it.each(everyTool)("%s has annotations", (name) => {
    const hints = toolAnnotations[name];

    expect(typeof hints.readOnlyHint).toBe("boolean");
    /* A claim rather than a default restated: nothing in the product makes a
       network call, and MCP's default for this one is `true`. */
    expect(hints.openWorldHint).toBe(false);
    expect(hints.untrustedContentHint).toBe(false);
  });

  /**
   * The two rows that are corrections, and the omission rule.
   *
   * `attach_lead` is idempotent — the second identical call writes nothing —
   * and `verify_current_step` is not, because it patches `activeStepId` and so
   * four identical `{}` calls walk the rail. Three separate readings got this
   * pair the wrong way round, which is the reason it is pinned here rather
   * than left to a comment.
   */
  it("idempotence is the measured answer, not the intuitive one", () => {
    expect(toolAnnotations.attach_lead.idempotentHint).toBe(true);
    expect(toolAnnotations.attach_lead.destructiveHint).toBe(true);
    expect(toolAnnotations.verify_current_step.idempotentHint).toBe(false);
  });

  it.each(["get_build_context", "get_project_requirements"] as const)(
    "%s reads, so the two hints that mean nothing are absent rather than false",
    (name) => {
      const hints = toolAnnotations[name];

      expect(hints.readOnlyHint).toBe(true);
      /* MCP: "meaningful only when `readOnlyHint == false`". A `false` here
         would be an answer to a question that was not asked. */
      expect("destructiveHint" in hints).toBe(false);
      expect("idempotentHint" in hints).toBe(false);
    },
  );
});

describe("a host that will not take a tool is reported as one that did not", () => {
  const descriptor = {
    name: "get_build_context",
    description: "",
    inputSchema: {},
    execute: async () => ({ content: [] as { type: "text"; text: string }[] }),
  };

  /**
   * `ok` is a promise, and that is the contract this block exists to hold.
   *
   * The IDL returns `Promise<undefined>` and every refusal in it is a rejection
   * of that promise — a duplicate name rejects with `InvalidStateError`. Read
   * synchronously, as this file used to, the only refusal visible is the
   * synchronous throw, which is the one shape no conforming host performs. So
   * an accepted registration and a refused one came back as the same object and
   * the badge could not tell them apart.
   */
  it("a throwing registerTool is `ok: false`", async () => {
    const host: McpHost = {
      registerTool: () => {
        throw new Error("permission denied");
      },
    };

    const registration = registerTool(host, descriptor);
    await expect(registration.ok).resolves.toBe(false);
    /* And unregistering it still cannot be the thing that breaks teardown. */
    expect(() => registration.unregister()).not.toThrow();
  });

  it("a host that REJECTS is `ok: false`, and nothing escapes", async () => {
    const escaped: string[] = [];
    const listener = (reason: unknown) => escaped.push(String(reason));
    process.on("unhandledRejection", listener);

    const host: McpHost = {
      registerTool: () =>
        Promise.reject(new Error("InvalidStateError: already registered")),
    };
    const registration = registerTool(host, descriptor);

    await expect(registration.ok).resolves.toBe(false);
    /* A macrotask, because an unhandled rejection is only reported once the
       microtask queue has drained without a handler being attached. */
    await new Promise((resolve) => setTimeout(resolve, 20));
    process.off("unhandledRejection", listener);

    expect(escaped).toEqual([]);
  });

  it.each([
    ["an unregister object", () => ({ unregister: () => {} })],
    ["a bare disposer", () => () => {}],
    ["nothing at all", () => undefined],
    ["the spec's own shape", () => Promise.resolve(undefined)],
  ])("a host that takes it is `ok: true` — %s", async (_name, handle) => {
    await expect(
      registerTool({ registerTool: handle }, descriptor).ok,
    ).resolves.toBe(true);
  });

  it("a disposer that throws does not escape unregister", () => {
    const host: McpHost = {
      registerTool: () => () => {
        throw new Error("gone");
      },
    };

    expect(() => registerTool(host, descriptor).unregister()).not.toThrow();
  });
});

describe("the signal is the only teardown the spec has", () => {
  const descriptor = {
    name: "get_build_context",
    description: "",
    inputSchema: {},
    execute: async () => ({ content: [] as { type: "text"; text: string }[] }),
  };

  /**
   * A host as `index.bs` describes one: `Promise<undefined>` out, a duplicate
   * name rejected, and `options.signal` the only way a name is ever freed
   * again. There is no `unregisterTool` in the IDL and the promise resolves to
   * `undefined`, so a teardown that reads the return value removes nothing —
   * which is what left seven names on the host across a whole route walk, and
   * made every later arrival at a bench a duplicate.
   */
  function specHost() {
    const held = new Map<string, unknown>();
    const host: McpHost = {
      registerTool: (tool, options) => {
        if (held.has(tool.name)) {
          return Promise.reject(new Error("InvalidStateError"));
        }
        held.set(tool.name, tool);
        options?.signal?.addEventListener("abort", () => held.delete(tool.name));
        return Promise.resolve(undefined);
      },
    };
    return { host, held };
  }

  it("aborting the signal takes the tool off the host", async () => {
    const { host, held } = specHost();
    const controller = new AbortController();

    const registration = registerTool(host, descriptor, {
      signal: controller.signal,
    });
    await expect(registration.ok).resolves.toBe(true);
    expect(held.size).toBe(1);

    controller.abort();
    registration.unregister();

    expect(held.size).toBe(0);
  });

  it("so the second arrival at the same name is accepted, not refused", async () => {
    const { host, held } = specHost();

    const first = new AbortController();
    const before = registerTool(host, descriptor, { signal: first.signal });
    await expect(before.ok).resolves.toBe(true);
    first.abort();

    const second = new AbortController();
    const after = registerTool(host, descriptor, { signal: second.signal });

    await expect(after.ok).resolves.toBe(true);
    expect(held.size).toBe(1);
  });
});

describe("a result carries the same value twice", () => {
  /* `structuredContent` beside the text block, which is what MCP asks for:
     the text stays so a client that only reads `content[0].text` is unaffected,
     and the structured half saves every other client a `JSON.parse`. */
  it("as text and as structure, and they cannot drift", () => {
    const value = { project: "breathingLamp", findings: [{ id: "f1" }] };
    const result = asToolResult(value);

    expect(result.structuredContent).toBe(value);
    expect(JSON.parse(result.content[0]!.text)).toEqual(value);
    expect(result.isError).toBeUndefined();
  });

  it("a refusal is structured too", () => {
    const refusal = { error: "holeTaken", tool: "attach_lead" };
    const result = asToolResult(refusal, true);

    expect(result.structuredContent).toBe(refusal);
    expect(result.isError).toBe(true);
  });

  it("nothing is `null` in both halves, not `undefined` in one", () => {
    const result = asToolResult(undefined);

    expect(result.structuredContent).toBeNull();
    expect(result.content[0]!.text).toBe("null");
  });
});

describe("the standards-track surface is probed first", () => {
  /**
   * `document.modelContext` is the only surface the proposal has
   * (`index.bs:585`); `navigator` was deleted by PR #184 on 2026-05-27 and
   * `window` was never declared. The list used to run the other way round on a
   * comment calling `navigator` "the standards-track location", so a legacy
   * shim would have won over the real object beside it. Asserted rather than
   * commented, because a comment is what let it through last time.
   */
  const marked = (mark: string) => ({
    modelContext: { registerTool: () => Promise.resolve(undefined), mark },
  });

  /* Node defines `navigator` of its own, so the originals are put back rather
     than deleted — a global this file borrowed must not stay borrowed. */
  function withSurfaces(present: readonly string[]) {
    const names = ["window", "document", "navigator"] as const;
    const saved = names.map(
      (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
    );
    for (const name of names) {
      Object.defineProperty(globalThis, name, {
        value: present.includes(name) ? marked(name) : {},
        configurable: true,
        writable: true,
      });
    }
    return () => {
      for (const [name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      }
    };
  }

  const cases: [string, string[], string][] = [
    ["all three present, document wins", ["document", "navigator", "window"], "document"],
    ["no document, navigator is next", ["navigator", "window"], "navigator"],
    ["window alone still carries a shim", ["window"], "window"],
  ];

  it.each(cases)("%s", (_name, present, winner) => {
    const restore = withSurfaces(present);
    try {
      expect((findMcpHost() as unknown as { mark: string } | null)?.mark).toBe(
        winner,
      );
    } finally {
      restore();
    }
  });

  it("and no surface at all is `null`, not a throw", () => {
    const restore = withSurfaces([]);
    try {
      expect(findMcpHost()).toBeNull();
    } finally {
      restore();
    }
  });
});
