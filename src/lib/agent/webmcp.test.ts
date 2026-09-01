import { describe, expect, it } from "vitest";
import { componentIds, projects } from "@/lib/projects/catalog";
import { conceptIds, difficulties } from "@/lib/projects/filter";
import { hasBench, schemaFactsFor } from "@/lib/agent/builds";
import {
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

    /* Omitting `target` detaches the lead and can send the part back to the
       kit. An agent reading "optional" the ordinary way undid work and was
       answered `ok`, so the destructive default is published both ways: as
       JSON Schema for a validator, and in the sentence a model reads. */
    expect(props.target).toHaveProperty("default", null);
    expect(String(props.target!.description)).toMatch(/[Oo]mitting it means null/);
  });
});

describe("a host that will not take a tool is reported as one that did not", () => {
  const descriptor = {
    name: "get_build_context",
    description: "",
    inputSchema: {},
    execute: async () => ({ content: [] as { type: "text"; text: string }[] }),
  };

  it("a throwing registerTool is `ok: false`", () => {
    const host: McpHost = {
      registerTool: () => {
        throw new Error("permission denied");
      },
    };

    const registration = registerTool(host, descriptor);
    expect(registration.ok).toBe(false);
    /* And unregistering it still cannot be the thing that breaks teardown. */
    expect(() => registration.unregister()).not.toThrow();
  });

  it.each([
    ["an unregister object", () => ({ unregister: () => {} })],
    ["a bare disposer", () => () => {}],
    ["nothing at all", () => undefined],
  ])("all three accepted shapes are `ok: true` — %s", (_name, handle) => {
    expect(registerTool({ registerTool: handle }, descriptor).ok).toBe(true);
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
