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
import { say, type Line } from "@/lib/agent/line";
import type { ToolOutcome } from "@/lib/agent/services";
import {
  asToolResult,
  executeVia,
  findMcpHost,
  librarySchemasFor,
  registerTool,
  workbenchSchemasFor,
  type McpHost,
  type McpToolDescriptor,
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
    const undocumented = Object.entries(librarySchemasFor(en)).flatMap(
      ([tool, schema]) =>
        properties(schema)
          .filter(([, prop]) => !prop.description)
          .map(([name]) => `${tool}.${name}`),
    );

    expect(undocumented).toEqual([]);
  });

  it.each(benches)("in every schema on %s's bench", (projectId) => {
    const schemas = workbenchSchemasFor(schemaFactsFor(projectId), en);
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
    const props = Object.fromEntries(properties(librarySchemasFor(en).find_projects!));
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
    const schemas = workbenchSchemasFor(facts, en);
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
        properties(workbenchSchemasFor(facts, en).attach_lead!),
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
      properties(workbenchSchemasFor(schemaFactsFor(id), en).attach_lead!),
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
      properties(workbenchSchemasFor(schemaFactsFor(id), en).show_correction!),
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
    const silent = Object.entries(librarySchemasFor(en))
      .filter(([, schema]) => !long(schema))
      .map(([tool]) => tool);

    expect(silent).toEqual([]);
  });

  it.each(benches)("in every schema on %s's bench", (id) => {
    const silent = Object.entries(workbenchSchemasFor(schemaFactsFor(id), en))
      .filter(([, schema]) => !long(schema))
      .map(([tool]) => tool);

    expect(silent).toEqual([]);
  });
});

describe("a schema is published in the reader's language", () => {
  /**
   * Both halves of the move, checked at the only place both are visible.
   *
   * A string left behind as an English literal in `webmcp.ts` and a `tr` key
   * that still holds the English sentence fail identically here, and neither
   * fails anywhere else: `tr.ts` is typed against `en.ts`, so a *missing* key
   * breaks the build and a *wrong* one does not. Sentences rather than titles,
   * so "the two are the same" is never a legitimate answer.
   */
  const sentences = (schemas: Record<string, Record<string, unknown>>) =>
    Object.entries(schemas).flatMap(([tool, schema]) => [
      [`${tool}`, String(schema.description)] as const,
      ...properties(schema).map(
        ([name, prop]) =>
          [`${tool}.${name}`, String(prop.description)] as const,
      ),
    ]);

  it.each(benches)("every sentence on %s's bench differs in tr", (id) => {
    const english = sentences(workbenchSchemasFor(schemaFactsFor(id), en));
    const turkish = new Map(
      sentences(workbenchSchemasFor(schemaFactsFor(id), tr)),
    );

    const untranslated = english
      .filter(([where, sentence]) => turkish.get(where) === sentence)
      .map(([where]) => where);

    expect(untranslated).toEqual([]);
  });

  it("and every sentence in the four library schemas", () => {
    const english = sentences(librarySchemasFor(en));
    const turkish = new Map(sentences(librarySchemasFor(tr)));

    const untranslated = english
      .filter(([where, sentence]) => turkish.get(where) === sentence)
      .map(([where]) => where);

    expect(untranslated).toEqual([]);
  });

  it("the shared project argument moved as one string, not three", () => {
    const library = librarySchemasFor(en);
    const argument = (tool: string) =>
      (library[tool]!.properties as Record<string, unknown>).project;

    expect(argument("open_project")).toBe(argument("start_project"));
    expect(argument("get_project_requirements")).toBe(argument("open_project"));
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
      const props = Object.fromEntries(properties(librarySchemasFor(en)[tool]!));

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
    const schemas = workbenchSchemasFor(schemaFactsFor(id), en);

    expect(schemas.get_build_context).not.toBe(schemas.verify_current_step);
    expect(Object.isFrozen(schemas.get_build_context)).toBe(true);
    expect(Object.isFrozen(schemas.verify_current_step)).toBe(true);
  });

  it("and a second call does not hand back the first call's objects", () => {
    const first = workbenchSchemasFor(schemaFactsFor(benches[0]!), en);
    const second = workbenchSchemasFor(schemaFactsFor(benches[0]!), en);

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
    execute: async () => ({}),
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

/**
 * A host as `index.bs` describes one: `Promise<undefined>` out, a duplicate
 * name rejected, and `options.signal` the only way a name is ever freed again.
 * There is no `unregisterTool` in the IDL and the promise resolves to
 * `undefined`, so a teardown that reads the return value removes nothing —
 * which is what left seven names on the host across a whole route walk, and
 * made every later arrival at a bench a duplicate. It keeps the descriptor it
 * was handed, so a test can call `execute` the way the browser does: off the
 * stored tool, not off a local variable.
 */
function specHost() {
  const held = new Map<string, McpToolDescriptor>();
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

describe("the signal is the only teardown the spec has", () => {
  const descriptor = {
    name: "get_build_context",
    description: "",
    inputSchema: {},
    execute: async () => ({}),
  };

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

describe("a result is the value itself", () => {
  /**
   * No envelope. The host serialises whatever `execute` resolves with and hands
   * the string to the model, and MCP's `{content, structuredContent, isError}`
   * reached Chrome 152 verbatim — 6 618 characters for 2 425 of payload, the
   * same object twice — while no host, vendor example or inspector read it.
   * These pin the shape that replaced it.
   */
  it("an object passes through untouched, with nothing wrapped around it", () => {
    const value = { project: "breathingLamp", findings: [{ id: "f1" }] };
    const result = asToolResult(value);

    expect(result).toBe(value);
    expect(result).not.toHaveProperty("content");
    expect(result).not.toHaveProperty("structuredContent");
  });

  it("a refusal is the composed object, not a flag beside one", () => {
    const refusal = { error: "holeTaken", tool: "attach_lead" };

    expect(asToolResult(refusal)).toBe(refusal);
    expect(asToolResult(refusal)).not.toHaveProperty("isError");
  });

  it("only `undefined` is touched, and it becomes `null`", () => {
    /* The serialiser throws on `undefined` and the host then reports the call
       as failed; every other value is the host's to serialise as it is. */
    expect(asToolResult(undefined)).toBeNull();
    expect(asToolResult(null)).toBeNull();
    expect(asToolResult(0)).toBe(0);
    expect(asToolResult("")).toBe("");
    expect(asToolResult(false)).toBe(false);
  });
});

/**
 * The registered `execute`, end to end: composed by `executeVia`, stored by a
 * spec-shaped host, called the way a browser calls it. Until this block no
 * test reached the closure a host actually invokes, so the envelope change and
 * the refusal composition both lived in code a green run never touched.
 */
describe("what a host receives from the registered execute", () => {
  const holeTaken: Line = {
    ns: "errors",
    k: "holeTaken",
    args: ["D7"],
  };

  /** Registers one tool whose runner answers with `answer`, and hands back the
      `execute` the host stored — plus the calls the runner saw. */
  async function registered(
    name: Parameters<typeof executeVia>[0],
    answer: (
      args: Record<string, unknown>,
      options: { signal?: AbortSignal },
    ) => Promise<ToolOutcome> | ToolOutcome,
  ) {
    const { host, held } = specHost();
    const seen: { args: Record<string, unknown>; signal?: AbortSignal }[] = [];
    const registration = registerTool(host, {
      name,
      description: "",
      inputSchema: {},
      execute: executeVia(name, {
        run: async (_tool, args, options) => {
          seen.push({ args, signal: options.signal });
          return answer(args, options);
        },
        copy: () => en,
      }),
    });
    await expect(registration.ok).resolves.toBe(true);
    return { execute: held.get(name)!.execute, seen };
  }

  it("a success is the handler's result, bare", async () => {
    const result = { findings: [], source: "demo" };
    const { execute, seen } = await registered("inspect_build", () => ({
      status: "ok",
      result,
    }));

    const received = await execute({ scope: "wiring" });

    expect(received).toBe(result);
    /* What the model reads after the host's serialisation: two keys, and
       neither of them is `content`. */
    expect(Object.keys(JSON.parse(JSON.stringify(received)))).toEqual([
      "findings",
      "source",
    ]);
    expect(seen[0]!.args).toEqual({ scope: "wiring" });
  });

  it("a refusal is the detail plus `error`, `message` and `tool`, resolved", async () => {
    const { execute } = await registered("attach_lead", () => ({
      status: "error",
      result: {
        refused: "holeTaken",
        lead: "led.cathode",
        target: "board.D7",
        occupant: "res.out",
        source: "demo",
      },
      errorMessage: holeTaken,
    }));

    await expect(
      execute({ lead: "led.cathode", target: "board.D7" }),
    ).resolves.toEqual({
      refused: "holeTaken",
      lead: "led.cathode",
      target: "board.D7",
      occupant: "res.out",
      source: "demo",
      error: "holeTaken",
      /* The same sentence the person's toast shows, from the same dictionary. */
      message: say(en, holeTaken),
      tool: "attach_lead",
    });
  });

  it("the three bridge fields cannot be shadowed by the payload", async () => {
    const { execute } = await registered("attach_lead", () => ({
      status: "error",
      result: { error: "mine", message: "mine", tool: "mine" },
      errorMessage: holeTaken,
    }));

    await expect(execute({})).resolves.toMatchObject({
      error: "holeTaken",
      message: say(en, holeTaken),
      tool: "attach_lead",
    });
  });

  it("an error outcome with no sentence and no detail is still an object", async () => {
    const { execute } = await registered("navigate_build_step", () => ({
      status: "error",
    }));

    await expect(execute({ step_id: "nope" })).resolves.toEqual({
      error: "failed",
      tool: "navigate_build_step",
    });
  });

  it("a handler that returns nothing reaches the host as `null`, not `undefined`", async () => {
    const { execute } = await registered("get_build_context", () => ({
      status: "ok",
    }));

    await expect(execute({})).resolves.toBeNull();
  });

  it("a runner that throws resolves, with the message, and never rejects", async () => {
    const { execute } = await registered("run_functional_test", () => {
      throw new Error("headline could not be composed");
    });

    await expect(execute({ test: "sonar" })).resolves.toEqual({
      error: "headline could not be composed",
      tool: "run_functional_test",
    });
  });

  /**
   * One event, one word. A cancel used to reach a client in four spellings:
   * `error: "aborted"` from the pre-abort return, and `error: "failed"` for
   * the queue's cancel, `attach_lead`'s mid-carry cancel and the runner's
   * dropped landing — none of which failed. Every shape now says `cancelled`,
   * and none of them carries a `message`, because there is no sentence for a
   * call that was called off.
   */
  it.each([
    ["queued, never started", { cancelled: true, tool: "attach_lead", source: "demo" }],
    [
      "stopped mid-carry",
      { lead: "led.cathode", target: "board.D7", cancelled: true, source: "demo" },
    ],
    [
      "landing dropped by a reset",
      { cancelled: true, reason: "benchChanged", tool: "attach_lead", source: "demo" },
    ],
  ] as const)("a call cancelled while %s says `cancelled`", async (_how, result) => {
    const { execute } = await registered("attach_lead", () => ({
      status: "error",
      result,
    }));

    const received = await execute({ lead: "led.cathode", target: "board.D7" });

    expect(received).toEqual({ ...result, error: "cancelled", tool: "attach_lead" });
    expect(received).not.toHaveProperty("message");
  });

  it("a call cancelled before it starts says the same word, and never runs", async () => {
    const controller = new AbortController();
    controller.abort();
    const { execute, seen } = await registered("attach_lead", () => ({
      status: "ok",
      result: { seated: "board.D7" },
    }));

    await expect(
      execute({ lead: "led.cathode", target: "board.D7" }, {
        signal: controller.signal,
      }),
    ).resolves.toEqual({ error: "cancelled", cancelled: true, tool: "attach_lead" });
    expect(seen).toEqual([]);
  });

  it("missing arguments reach the runner as `{}`, and the signal crosses", async () => {
    const controller = new AbortController();
    const { execute, seen } = await registered("get_build_context", () => ({
      status: "ok",
      result: {},
    }));

    await execute(undefined as unknown as Record<string, unknown>, {
      signal: controller.signal,
    });

    expect(seen[0]!.args).toEqual({});
    expect(seen[0]!.signal).toBe(controller.signal);
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
