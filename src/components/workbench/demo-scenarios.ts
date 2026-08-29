import type { AgentSession } from "@/components/agent/use-agent-session";
import type { Copy } from "@/content/i18n";
import type { InspectionScope } from "@/lib/agent/model";
import { buildSteps, type StepId } from "@/lib/agent/steps";

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
      session.act({ kind: "resolve", findingId: id });
    }
  };

  const complete = async () => {
    await repair("wiring");
    await repair("mechanical");

    /* One verify per remaining step, reading each call's own answer. The guard
       is the step count: a build cannot need more verifications than it has
       steps, and a loop driven by tool results should not be able to spin.
       Stops one short: the last step is the test, and verifying it without
       running it is not what finishing this build means. */
    for (let remaining = buildSteps.length; remaining > 0; remaining--) {
      const outcome = await session.run("verify_current_step", {});
      const result = (
        outcome as {
          result?: { verified?: boolean; nextStepId?: StepId | null };
        }
      )?.result;
      if (!result?.verified || !result.nextStepId) break;
      if (result.nextStepId === "test") break;
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

  return [
    {
      id: "reset",
      group: "reset",
      label: copy.demo.reset,
      run: () => session.reset(),
    },
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
    {
      id: "fix-wiring",
      group: "wiring",
      label: copy.demo.markWiringFixed,
      run: () => repair("wiring"),
    },
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
    {
      id: "jump-test",
      group: "system",
      label: copy.demo.jumpTest,
      run: async () => {
        await session.run("navigate_build_step", { step_id: "test" });
        await session.run("run_functional_test", { test: "full_system" });
      },
    },
    {
      id: "complete",
      group: "system",
      label: copy.demo.complete,
      run: complete,
    },
  ];
}
