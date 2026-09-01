import { describe, expect, it } from "vitest";
import { demoScenarios } from "@/components/workbench/demo-scenarios";
import type { AgentSession } from "@/components/agent/use-agent-session";
import { en } from "@/content/locales/en";
import { buildFor } from "@/lib/agent/builds";
import { initialSession } from "@/lib/agent/session";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * §10 · `Complete project`, on the five benches it could not complete.
 *
 * This is the control the demo film ends on, and on every chapter but the
 * capstone it was inert. `complete()` opened with `repair("wiring")`, but an
 * empty bench raises `placement` findings, so nothing was ever seated, the
 * verify loop broke on its second step and the device panel stayed on
 * `Failed`. And `repair("mechanical")` ran unconditionally, so chapters one to
 * four — which have nothing that turns — each logged *"Agent checked step 1's
 * mechanical alignment"*.
 *
 * Both are asserted by recording the calls rather than the state: what was
 * wrong was **which tools were called**, and a state assertion would pass on a
 * shortcut that reached the same board without going through them, which §10
 * rules out in as many words ("the demo buttons do not run a second flow").
 *
 * The session is a stub, and it is allowed to be one: `demoScenarios` reads
 * `state`, calls `run` and `act`, and touches nothing else. Anything it grows a
 * dependency on will fail here as a type error, which is the seam working.
 */

interface Recorded {
  name: string;
  input: Record<string, unknown>;
}

function stub(projectId: ProjectId) {
  const calls: Recorded[] = [];
  const state = initialSession(buildFor(projectId));

  const session = {
    state,
    run: async (name: string, input: Record<string, unknown>) => {
      calls.push({ name, input });

      if (name === "get_build_context") {
        /* Everything still in the kit, which is the bench the demo opens in. */
        return { status: "ok", result: { placement: { leads: {} } } };
      }
      if (name === "inspect_build") return { status: "ok", result: { findings: [] } };
      /* Stops the verify loop after one turn; this file is about what runs
         before it, and the loop itself is unchanged. */
      return { status: "ok", result: { verified: false } };
    },
    act: () => {},
    reset: () => {},
  } as unknown as AgentSession;

  return { calls, scenarios: demoScenarios(session, en) };
}

const placementChapters: ProjectId[] = [
  "breathingLamp",
  "trafficLight",
  "motionNightLight",
  "plantGuardian",
  "touchlessSoapDispenser",
];

const namesOf = (calls: Recorded[]) => calls.map((c) => c.name);

describe("Complete project puts the parts in", () => {
  it.each(placementChapters)("%s seats every lead the sketch wants", async (id) => {
    const { calls, scenarios } = stub(id);
    await scenarios.find((s) => s.id === "complete")!.run();

    const spec = buildFor(id)!.placement!;
    const wanted = spec.terminals.filter((lead) => spec.complete[lead]);
    const seated = calls
      .filter((c) => c.name === "attach_lead")
      .map((c) => c.input.lead);

    expect(seated).toEqual([...wanted]);
    /* And each one goes where the finished build says it goes. */
    for (const call of calls.filter((c) => c.name === "attach_lead")) {
      expect(call.input.target).toBe(spec.complete[call.input.lead as string]);
    }
  });

  it("the capstone is untouched: no placement, so the wiring repair still opens it", async () => {
    const { calls, scenarios } = stub("smartParkingBarrier");
    await scenarios.find((s) => s.id === "complete")!.run();

    expect(namesOf(calls)).not.toContain("attach_lead");
    expect(calls[0]).toEqual({ name: "inspect_build", input: { scope: "wiring" } });
  });
});

describe("the mechanical scope is only asked of a build that has one", () => {
  it.each(["breathingLamp", "trafficLight", "motionNightLight", "plantGuardian"] as const)(
    "%s is never asked to check an alignment",
    async (id) => {
      const { calls, scenarios } = stub(id);
      await scenarios.find((s) => s.id === "complete")!.run();

      const scopes = calls
        .filter((c) => c.name === "inspect_build")
        .map((c) => c.input.scope);
      expect(scopes).not.toContain("mechanical");
    },
  );

  it.each(["touchlessSoapDispenser", "smartParkingBarrier"] as const)(
    "%s still is",
    async (id) => {
      const { calls, scenarios } = stub(id);
      await scenarios.find((s) => s.id === "complete")!.run();

      const scopes = calls
        .filter((c) => c.name === "inspect_build")
        .map((c) => c.input.scope);
      expect(scopes).toContain("mechanical");
    },
  );
});

describe("the menu offers no control that cannot act on this bench", () => {
  it.each(placementChapters)("%s has no `Mark wiring as fixed`", (id) => {
    const ids = stub(id).scenarios.map((s) => s.id);
    expect(ids).not.toContain("fix-wiring");
    /* Its real equivalent is here instead, and the menu is not empty. */
    expect(ids).toContain("agent-attach");
    expect(ids).toContain("complete");
  });

  it("the capstone's nine are unchanged, in order", () => {
    expect(stub("smartParkingBarrier").scenarios.map((s) => s.id)).toEqual([
      "reset",
      "jump-wiring",
      "inject-echo",
      "fix-wiring",
      "jump-servo",
      "inject-servo",
      "fix-servo",
      "jump-test",
      "complete",
    ]);
  });
});
