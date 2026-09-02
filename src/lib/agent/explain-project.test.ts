import { describe, expect, it } from "vitest";
import { en } from "@/content/locales/en";
import { tr } from "@/content/locales/tr";
import { builds } from "@/lib/agent/builds";
import { briefingFor } from "@/lib/agent/briefings";
import { allHandlers } from "@/lib/agent/tools";
import { initialSession, type AgentSessionState } from "@/lib/agent/session";
import { projects, type ProjectId } from "@/lib/projects/catalog";
import type { Copy } from "@/content/i18n";
import type { ToolOutcome } from "@/lib/agent/services";

/**
 * G-18 · `explain_project`, which is words about a chapter and nothing else.
 *
 * Two properties are worth a test and the rest is the dictionary's own
 * business. The first is that the answer is **complete on every build**: the
 * tool projects two registries onto one payload, and a chapter missing from
 * either one comes back with a null purpose and empty lists rather than an
 * error — silently useless, which is the failure mode a count catches and a
 * reader does not.
 *
 * The second is that it **reads no state**. That is the whole line between
 * this tool and `get_build_context`, it is what `toolAnnotations` promises a
 * host (`readOnlyHint: true`), and it would be quietly broken by anybody
 * reaching for `state.scene` to enrich the answer.
 */

const call = async (state: AgentSessionState, copy: Copy = en) =>
  allHandlers.explain_project({} as never, {
    read: () => state,
    copy,
    locale: copy === en ? "en" : "tr",
    phase: async () => {},
  });

const said = (outcome: ToolOutcome) => outcome.result as Record<string, never>;

describe("explain_project", () => {
  const ids = projects.map((p) => p.id);

  it.each(ids)("answers for %s out of the two registries", async (id) => {
    const build = builds[id as ProjectId];
    expect(build).toBeDefined();

    const answer = said(await call(initialSession(build!)));
    const project = projects.find((p) => p.id === id)!;
    const brief = briefingFor(id as ProjectId)!;

    expect(answer.project).toEqual({
      id,
      slug: project.slug,
      name: en.projects[id as ProjectId].name,
    });
    expect(answer.chapter).toBe(project.chapter);
    expect(answer.chapters).toBe(projects.length);
    expect(answer.stepCount).toBe(project.stepCount);

    /* The sentences, and every one of them present: this is the payload's
       whole reason to exist. */
    expect(String(answer.purpose).length).toBeGreaterThan(40);
    expect(answer.parts).toHaveLength(brief.parts.length);
    expect(answer.howItWorks).toHaveLength(brief.assembly.length);
    for (const part of answer.parts as unknown as { does: string }[]) {
      expect(part.does.length).toBeGreaterThan(20);
    }
    for (const line of answer.howItWorks as unknown as string[]) {
      expect(line.trim().length).toBeGreaterThan(0);
    }
    /* The parts are the ones the card counts, in the briefing's order. */
    expect((answer.parts as unknown as { id: string }[]).map((p) => p.id)).toEqual(
      brief.parts.map((p) => p.id),
    );
  });

  it("speaks the reader's language", async () => {
    const state = initialSession(builds.trafficLight!);
    const english = said(await call(state, en));
    const turkish = said(await call(state, tr));

    expect(english.purpose).not.toEqual(turkish.purpose);
    expect((english.project as { name: string }).name).toBe(
      en.projects.trafficLight.name,
    );
    expect((turkish.project as { name: string }).name).toBe(
      tr.projects.trafficLight.name,
    );
    /* Printed on the part, so the same in both (rule 13). */
    expect((english.parts as unknown as { number: string }[]).map((p) => p.number)).toEqual(
      (turkish.parts as unknown as { number: string }[]).map((p) => p.number),
    );
  });

  it("reports nothing about the bench, and writes nothing to it", async () => {
    const before = initialSession(builds.smartParkingBarrier!);
    const outcome = await call(before);

    expect(outcome.patch).toBeUndefined();
    expect(outcome.effects ?? []).toHaveLength(0);
    expect(outcome.commits).toBeFalsy();

    /* No key of the payload may carry a wire, a step or a finding: those are
       `get_build_context`'s answer and they change under the person's hands. */
    const keys = Object.keys(said(outcome));
    for (const banned of [
      "activeStep",
      "expectedConnections",
      "observedConnections",
      "findings",
      "placement",
      "completedSteps",
    ]) {
      expect(keys).not.toContain(banned);
    }
  });
});
