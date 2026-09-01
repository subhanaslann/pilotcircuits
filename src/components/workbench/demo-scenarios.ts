import type { AgentSession } from "@/components/agent/use-agent-session";
import type { Copy } from "@/content/i18n";
import type { InspectionScope } from "@/lib/agent/model";
import { stepTotalFor, stepsOwning, type StepId } from "@/lib/agent/steps";
import { buildFor, schemaFactsFor } from "@/lib/agent/builds";
import type { PlacementSpec } from "@/lib/circuit/placement";

/**
 * W-10 · The nine scenarios, §10.
 *
 * The rule this file exists to keep: **the demo buttons do not run a second
 * flow.** Every one of the nine is `session.run(tool, input)` or
 * `session.act(...)` — the same calls the agent makes through WebMCP, against
 * the same store, producing the same activity entries, the same toasts and the
 * same canvas moves. A menu that drove the screen directly would be a private
 * path that works right up until the moment it is filmed beside the real one.
 *
 * That is also why "Complete project" takes seven seconds rather than being a
 * state assignment: it repairs both faults through `inspect_build` and then
 * verifies each remaining step, which is what completing the project *is*. The
 * loop reads `verify_current_step`'s own return value rather than the session
 * state, because state committed during an `await` is not visible to the
 * closure that is awaiting.
 *
 * The two `inject` actions are the only thing here that is not a tool call, and
 * they cannot be one: no tool in this product breaks a build. They go through
 * `act`, beside "I fixed it", which is the right neighbourhood — in the fiction
 * they are the same gesture in the other direction.
 */

export type DemoGroup = "reset" | "wiring" | "servo" | "system";

export interface DemoScenario {
  id: string;
  group: DemoGroup;
  label: string;
  run: () => void | Promise<void>;
}

/** `inspect_build` reports what it found; the ids come back with it. */
function foundIds(outcome: unknown): string[] {
  const result = (outcome as { result?: { findings?: { id: string }[] } })
    ?.result;
  return (result?.findings ?? []).map((finding) => finding.id);
}

export function demoScenarios(
  session: AgentSession,
  copy: Copy,
): DemoScenario[] {
  /** Look, then point at the first thing found — what "jump to" means. */
  const jumpTo = async (step: StepId, scope: InspectionScope) => {
    await session.run("navigate_build_step", { step_id: step });
    const found = foundIds(await session.run("inspect_build", { scope }));
    if (found.length) {
      await session.run("show_correction", {
        finding_id: found[0],
        detail_level: "hint",
      });
    }
  };

  /** Look, then do the half the agent cannot: put the part back. */
  const repair = async (scope: InspectionScope) => {
    for (const id of foundIds(await session.run("inspect_build", { scope }))) {
      session.act({ kind: "repair", findingId: id });
    }
  };

  /**
   * Where every lead is right now, asked rather than remembered.
   *
   * `session.state` is the state of the render this menu was built in, and a
   * sequence that seats twenty leads is twenty commits past it before it ends.
   * `get_build_context` is the tool an agent would use for exactly this, it
   * lands in the timeline as the agent looking, and its `placement.leads` is
   * the same map `attach_lead` is read against.
   */
  const seatedNow = async (): Promise<Record<string, string | null>> => {
    const looked = await session.run("get_build_context", {});
    const result = (
      looked as {
        result?: { placement?: { leads?: Record<string, string | null> } };
      }
    )?.result;
    return result?.placement?.leads ?? {};
  };

  /**
   * Build the whole thing, through the one tool that can.
   *
   * `complete()` used to open with `repair("wiring")` on every bench, and on
   * the five chapters you assemble yourself that is a scope with nothing in
   * it: an empty bench raises `placement` findings, not `wiring` ones. So no
   * lead was ever seated, the verify loop broke on its second step, and the
   * device panel stayed on `Failed` — the demo control that finishes the build
   * could not finish five of the six builds. `repair("placement")` would not
   * have closed it either: a `part-not-placed` probe has no repair arm, by
   * design, because the finding is not something a repair *means*.
   *
   * What it means is putting the parts in, and there is exactly one call in
   * this product that does that. Same tool, same arguments, same refusals, same
   * undo entries as an agent driving the bench through WebMCP — which is the
   * rule this whole file exists to keep.
   *
   * Two passes. The second seats every lead the sketch is still waiting for, in
   * `terminals` order, which is the order that keeps a part on the bench long
   * enough for the next one to be clipped onto it. The first takes back
   * anything sitting in a hole it does not belong in, so a mistake made earlier
   * cannot hold the hole a later lead needs and turn the run into a string of
   * `holeTaken` refusals. On the bench the demo opens in — everything in the
   * kit — the first pass makes no calls at all.
   *
   * It is not quick: the wait inside `attach_lead` is the mascot's carry, and
   * chapter two has twenty leads. That is the cost of the control doing what it
   * says through the same door as everything else, and it films as the agent
   * building the circuit rather than as the circuit appearing.
   */
  const assemble = async (spec: PlacementSpec) => {
    const seated = await seatedNow();

    for (const lead of spec.terminals) {
      if (seated[lead] && seated[lead] !== spec.complete[lead]) {
        await session.run("attach_lead", { lead, target: null });
      }
    }

    for (const lead of spec.terminals) {
      const wanted = spec.complete[lead];
      if (!wanted || seated[lead] === wanted) continue;
      await session.run("attach_lead", { lead, target: wanted });
    }
  };

  /** The step this build finishes on — the one whose own suggestion is the run. */
  const testStepId = stepsOwning(session.state.activeStepId).find(
    (step) => step.suggestion === "runTest",
  )?.id;

  /** Whether this build has anything mounted that can be out of true. */
  const turns = Boolean(
    schemaFactsFor(session.state.projectId)?.scopes.includes("mechanical"),
  );

  const complete = async () => {
    /**
     * Put the build right, in whichever way this build can be put right.
     *
     * The capstone is laid out by its author: there is nothing to place, and
     * what stands between it and a finished bench is the wiring fault the demo
     * injects. The five you assemble start empty, and what stands between them
     * and a finished bench is every part. Two different jobs, and the old code
     * did the first one on both.
     */
    const spec = buildFor(session.state.projectId)?.placement;
    if (spec) await assemble(spec);
    else await repair("wiring");

    /* Only where something turns. `repair("mechanical")` was unconditional, so
       chapters one to four — which have no servo, no horn and no mounted
       anything — each got an activity row reading *"Agent checked step 1's
       mechanical alignment"*, about a step that checks no such thing. The
       build's own facts say which scopes it can answer; two of the six offer
       this one. */
    if (turns) await repair("mechanical");

    /* One verify per remaining step, reading each call's own answer. The guard
       is the step count: a build cannot need more verifications than it has
       steps, and a loop driven by tool results should not be able to spin.
       Stops one short: the last step is the test, and verifying it without
       running it is not what finishing this build means. */
    for (
      let remaining = stepTotalFor(session.state.activeStepId);
      remaining > 0;
      remaining--
    ) {
      const outcome = await session.run("verify_current_step", {});
      const result = (
        outcome as {
          result?: { verified?: boolean; nextStepId?: StepId | null };
        }
      )?.result;
      if (!result?.verified || !result.nextStepId) break;
      if (result.nextStepId === testStepId) break;
    }

    /**
     * Batch 8 · the run itself, before the step that is about it closes.
     *
     * Until there was a completion screen this made no visible difference and
     * the shortcut skipped it. Now the summary reports a test result, and a
     * `Complete project` that never ran one produced a finished build whose
     * verdict read `Not started` — true, and a contradiction the product had
     * put there itself.
     *
     * Still not a second flow (§10): it is the tool the foot of the panel calls
     * at this step, followed by the verify that closes it.
     */
    await session.run("run_functional_test", { test: "full_system" });
    await session.run("verify_current_step", {});
  };

  const reset: DemoScenario = {
    id: "reset",
    group: "reset",
    label: copy.demo.reset,
    run: () => session.reset(),
  };

  /**
   * W-10 · The agent's own hands, on a bench that has some.
   *
   * `attach_lead` is registered with the browser and **no button in the product
   * calls it** — deliberately, because the learner places their own parts. This
   * is the development-only way to watch one happen without an MCP client
   * attached, and it is not a second path: it is the same call with the same
   * arguments an agent would send, picked off the sketch rather than typed.
   *
   * The next lead the sketch is still waiting for, in the order the steps ask
   * for them — which is also the order that keeps each part on the bench long
   * enough for the next one to be clipped to it.
   */
  const agentPlaces: DemoScenario = {
    id: "agent-attach",
    group: "wiring",
    label: copy.demo.agentAttach,
    run: async () => {
      const spec = buildFor(session.state.projectId)?.placement;
      if (!spec) return;
      const next = spec.terminals.find((lead) => {
        const wanted = spec.complete[lead];
        return wanted && session.state.placement[lead] !== wanted;
      });
      if (!next) return;
      await session.run("attach_lead", {
        lead: next,
        target: spec.complete[next],
      });
    },
  };

  const wiringFix: DemoScenario = {
    id: "fix-wiring",
    group: "wiring",
    label: copy.demo.markWiringFixed,
    run: () => repair("wiring"),
  };

  const runTest: DemoScenario = {
    id: "jump-test",
    group: "system",
    label: copy.demo.jumpTest,
    run: async () => {
      if (testStepId) {
        await session.run("navigate_build_step", { step_id: testStepId });
      }
      await session.run("run_functional_test", { test: "full_system" });
    },
  };

  const finish: DemoScenario = {
    id: "complete",
    group: "system",
    label: copy.demo.complete,
    run: complete,
  };

  /**
   * The menu belongs to the build on the bench.
   *
   * Six of the nine name the capstone's steps and the capstone's two faults,
   * and the menu was rendered on every bench regardless — so on chapter one
   * `Jump to wiring issue` navigated to `sensor`, a step of the *other* build,
   * and the rail obligingly redrew itself as the barrier's seven. The two
   * `inject` rows were already guarded to the barrier inside `act`, which made
   * them controls that did nothing at all.
   *
   * The capstone's nine are unchanged, in the same order. Every other build
   * gets the ones that are actually about it.
   */
  if (session.state.projectId !== "smartParkingBarrier") {
    /**
     * No `Mark wiring as fixed` here, and that is the honest list.
     *
     * It is `repair("wiring")`, and it exists to clear the fault the menu
     * injects two rows above it on the capstone. On a bench you assemble
     * yourself there is no injected fault and nothing in the `wiring` scope
     * until the parts are in, so the control produced one "nothing found" row
     * and stopped — a demo control that cannot do the thing on its own label,
     * on the state the demo opens in. `Agent seats the next lead` is this
     * bench's real equivalent and it is already here.
     */
    return [reset, agentPlaces, runTest, finish];
  }

  return [
    reset,
    {
      id: "jump-wiring",
      group: "wiring",
      label: copy.demo.jumpWiring,
      run: () => jumpTo("sensor", "current_step"),
    },
    {
      id: "inject-echo",
      group: "wiring",
      label: copy.demo.injectEcho,
      run: () => session.act({ kind: "inject", fault: "echo" }),
    },
    wiringFix,
    {
      id: "jump-servo",
      group: "servo",
      label: copy.demo.jumpServo,
      run: () => jumpTo("servo", "mechanical"),
    },
    {
      id: "inject-servo",
      group: "servo",
      label: copy.demo.injectServo,
      run: () => session.act({ kind: "inject", fault: "servo" }),
    },
    {
      id: "fix-servo",
      group: "servo",
      label: copy.demo.markServoRemounted,
      run: () => repair("mechanical"),
    },
    runTest,
    finish,
  ];
}
