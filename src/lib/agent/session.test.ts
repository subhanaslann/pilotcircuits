import { describe, expect, it } from "vitest";
import {
  initialSession,
  sessionReducer,
  snapshotOf,
  type AgentSessionState,
} from "@/lib/agent/session";
import { builds } from "@/lib/agent/builds";
import { lampComplete, lampSceneFrom } from "@/lib/circuit/breathing-lamp";
import { placeIn } from "@/lib/agent/placement";
import { diff, extras } from "@/lib/circuit/graph";
import { onBench } from "@/lib/circuit/placement";
import { stepsOwning } from "@/lib/agent/steps";
import { headlineFor, type ToolInputs, type ToolOutcome } from "@/lib/agent/services";
import { allHandlers, type AllToolInputs } from "@/lib/agent/tools";
import { say, type Line } from "@/lib/agent/line";
import { toolErrorKeys, type ToolErrorKey } from "@/lib/agent/model";
import { en } from "@/content/locales/en";
import { tr } from "@/content/locales/tr";

const lamp = builds.breathingLamp!;
const spec = lamp.placement!;

const open = () => initialSession(lamp);

/** One gesture, committed the way `act`'s place branch commits it. */
const gesture = (
  state: AgentSessionState,
  terminal: string,
  target: string | null,
) => {
  const outcome = placeIn(state, spec, terminal, target);
  return sessionReducer(state, { type: "commit", patch: outcome.patch });
};

describe("undo", () => {
  it("takes back one gesture and puts the bench where it was", () => {
    const before = open();
    const seated = gesture(before, "led.cathode", "board.GND");
    expect(seated.placement["led.cathode"]).toBe("board.GND");

    const back = sessionReducer(seated, { type: "undo" });
    expect(back.placement).toEqual(before.placement);
    expect(back.scene.observed).toEqual(before.scene.observed);
  });

  it("redo puts it back", () => {
    const seated = gesture(open(), "led.cathode", "board.GND");
    const round = sessionReducer(sessionReducer(seated, { type: "undo" }), {
      type: "redo",
    });
    expect(round.placement).toEqual(seated.placement);
  });

  it("walks back through several gestures in order", () => {
    let s = open();
    s = gesture(s, "led.cathode", "board.GND");
    s = gesture(s, "res.out", "board.D9");
    s = gesture(s, "res.in", "led.anode");
    /* Compared as a graph, not as a record: the middle join is stored on
       whichever lead made it, and `lampComplete` happens to have made it from
       the LED's side. `sceneFrom` reuses the expected id either way, which is
       the invariant that matters and the one the spec test pins. */
    expect(diff(s.scene).mismatches).toHaveLength(0);
    expect(extras(s.scene)).toHaveLength(0);

    s = sessionReducer(s, { type: "undo" });
    expect(s.placement["res.in"]).toBeNull();
    s = sessionReducer(s, { type: "undo" });
    expect(s.placement["res.out"]).toBeNull();
    s = sessionReducer(s, { type: "undo" });
    expect(s.placement).toEqual(spec.empty);
    /* And it stops rather than throwing or wrapping round. */
    expect(sessionReducer(s, { type: "undo" }).placement).toEqual(spec.empty);
  });

  /**
   * The gesture this exists for.
   *
   * A release that missed by a fifth of a pitch took the part off the bench,
   * and there was no way back but rebuilding it from the kit.
   */
  it("brings back a part that a mis-aimed release took off the bench", () => {
    let s = open();
    /* The resistor first, then the LED hung off its free lead — so the LED has
       no hold on the board of its own and the resistor is carrying it. */
    s = gesture(s, "res.out", "board.D9");
    s = gesture(s, "led.cathode", "res.in");
    expect(onBench(spec, s.placement, "led")).toBe(true);
    const built = s;

    s = gesture(s, "res.out", null);
    /* Both parts are gone, and `prune` dropped the join between them. */
    expect(s.placement).toEqual(spec.empty);

    s = sessionReducer(s, { type: "undo" });
    expect(s.placement).toEqual(built.placement);
    expect(onBench(spec, s.placement, "led")).toBe(true);
  });

  it("a gesture the model refused is not a step to take back", () => {
    let s = open();
    s = gesture(s, "led.cathode", "board.GND");
    const depth = s.history.past.length;
    /* `res.out` into the hole the cathode already occupies. */
    s = gesture(s, "res.out", "board.GND");
    expect(s.history.past.length).toBe(depth);
    expect(s.placement["res.out"]).toBeNull();
  });

  it("a new gesture abandons the redo branch", () => {
    let s = gesture(open(), "led.cathode", "board.GND");
    s = sessionReducer(s, { type: "undo" });
    expect(s.history.future).toHaveLength(1);
    s = gesture(s, "res.out", "board.D9");
    expect(s.history.future).toHaveLength(0);
  });

  it("restores the step ticks a regression walked back", () => {
    let s = gesture(open(), "led.cathode", "board.GND");
    s = { ...s, completedSteps: ["lampKit", "lampSeat"] };
    const ticked = s;
    /* Pulling the cathode out un-ticks `lampSeat`, which is `commit`'s job. */
    s = gesture(s, "led.cathode", null);
    expect(s.completedSteps).not.toContain("lampSeat");
    s = sessionReducer(s, { type: "undo" });
    expect(s.completedSteps).toEqual(ticked.completedSteps);
  });

  it("does not remember findings, nor the credit for putting them right", () => {
    const snap = snapshotOf(open());
    expect(Object.keys(snap).sort()).toEqual([
      "activeStepId",
      "completedAt",
      "completedSteps",
      "placement",
      "scene",
    ]);
  });

  /**
   * The one that keeps this honest as the code changes.
   *
   * `commit` in `agent/placement.ts` and `BenchSnapshot` have to stay in step:
   * a field `commit` learns to write and the snapshot does not carry is a field
   * undo silently fails to restore, and nothing else would ever notice.
   */
  it("a snapshot covers every field a placement commit writes", () => {
    const state = open();
    const { patch } = placeIn(state, spec, "led.cathode", "board.GND");
    const covered = new Set([
      ...Object.keys(snapshotOf(state)),
      /* Deliberately outside the snapshot — see the reducer's `undo`. */
      "highlightedFindingId",
      /* And the spotlight, for the same reason: a placement write clears it
         rather than carrying it, and undo drops it either way. */
      "pointedAt",
      /* Deliberately outside too — see `history`: a repair, once counted,
         stays counted, and `repaired` is what keeps it from counting twice. */
      "repairs",
      "repaired",
    ]);
    for (const key of Object.keys(patch)) expect(covered).toContain(key);
  });

  /**
   * The credit survives the undo, and is never paid twice.
   *
   * With `repairs` and `repaired` in the snapshot, one Ctrl+Z after a verified
   * step zeroed `Issues fixed` for good: verify had dropped the step's findings
   * by patch, undo restored the count from before the fix, and the re-made fix
   * found no finding left to be credited against. Measured on chapters one
   * and two.
   */
  it("keeps the credit for a repair that undo takes back, and bills it once", async () => {
    let s: AgentSessionState = { ...open(), activeStepId: "lampSeat" };
    s = (await call(s, "inspect_build", { scope: "current_step" })).next;
    expect(s.findings.map((f) => f.id)).toEqual(["kit-led"]);

    s = gesture(s, "led.cathode", "board.GND");
    expect(s.repairs).toBe(1);
    expect(s.repaired).toEqual(["kit-led"]);

    s = sessionReducer(s, { type: "undo" });
    expect(s.placement["led.cathode"]).toBeNull();
    expect(s.repairs).toBe(1);
    expect(s.repaired).toEqual(["kit-led"]);

    s = gesture(s, "led.cathode", "board.GND");
    expect(s.repairs).toBe(1);
  });

  it("keeps it past a verified step, so the re-made fix still counts on /complete", async () => {
    let s: AgentSessionState = { ...open(), activeStepId: "lampSeat" };
    s = (await call(s, "inspect_build", { scope: "current_step" })).next;
    s = gesture(s, "led.cathode", "board.GND");
    s = (await call(s, "verify_current_step", {})).next;
    expect(s.completedSteps).toContain("lampSeat");
    expect(s.findings).toEqual([]);
    expect(s.repairs).toBe(1);

    s = sessionReducer(s, { type: "undo" });
    expect(s.completedSteps).not.toContain("lampSeat");
    expect(s.activeStepId).toBe("lampSeat");
    expect(s.repairs).toBe(1);

    s = gesture(s, "led.cathode", "board.GND");
    s = (await call(s, "verify_current_step", {})).next;
    expect(s.completedSteps).toContain("lampSeat");
    expect(s.repairs).toBe(1);

    /* And forward again: redo restores the bench, not a second credit. */
    s = sessionReducer(s, { type: "undo" });
    s = sessionReducer(s, { type: "redo" });
    expect(s.repairs).toBe(1);
  });
});

describe("a build the author laid out has no history to keep", () => {
  it("chapter six commits nothing to the placement, so nothing stacks up", () => {
    const barrier = initialSession(builds.smartParkingBarrier!);
    expect(barrier.placement).toEqual({});
    expect(barrier.history.past).toHaveLength(0);
    const patched = sessionReducer(barrier, {
      type: "commit",
      patch: { activeStepId: "servo" },
    });
    expect(patched.history.past).toHaveLength(0);
  });
});

describe("the opening bench", () => {
  it("chapter one opens empty, on step one, with nothing ticked", () => {
    const s = open();
    expect(s.placement).toEqual(spec.empty);
    expect(s.scene.observed).toHaveLength(0);
    expect(s.completedSteps).toEqual([]);
    expect(s.activeStepId).toBe("lampKit");
  });

  it("the reference is the finished lamp, not the empty bench", () => {
    expect(lamp.reference.observed).toEqual(
      lampSceneFrom(lampComplete).observed,
    );
  });
});

/**
 * The tools, called the way the browser calls them.
 *
 * Every one of these is an argument no button in the product can produce, and
 * every one of them used to be answered with `status: "ok"`. The phases are
 * collapsed to nothing — the wait is theatre and this is about the answer.
 */
async function call<K extends keyof AllToolInputs>(
  state: AgentSessionState,
  name: K,
  input: AllToolInputs[K],
  /* The host's cancel, for the two tests below. Absent everywhere else, which
     is what every caller that is not a WebMCP host passes. */
  signal?: AbortSignal,
): Promise<{ outcome: ToolOutcome; next: AgentSessionState }> {
  let live = state;
  const outcome = await allHandlers[name](input as never, {
    read: () => live,
    copy: en,
    locale: "en",
    signal,
    phase: async () => {},
  });
  live = outcome.patch
    ? sessionReducer(live, { type: "patch", patch: outcome.patch })
    : live;
  return { outcome, next: live };
}

/**
 * What a refusal put in `result` — the structured half, which is what a caller
 * that cannot see the toast has to act on. `refused` is the dictionary key, so
 * asserting it also asserts which sentence the person read.
 */
const refusal = (outcome: ToolOutcome) =>
  (outcome.result as { refused?: string } | undefined)?.refused;

describe("navigate_build_step refuses another chapter's step", () => {
  /* `stepById` searches all 33 ids, so the lamp's bench used to accept the
     capstone's and redraw its whole rail as the other build's — with no UI
     route back, because the rail the person clicks is the same derivation. */
  it("every bench refuses every other bench's step ids", async () => {
    for (const build of Object.values(builds)) {
      const mine = new Set(
        stepsOwning(build!.activeStepId).map((step) => step.id),
      );
      for (const other of Object.values(builds)) {
        if (other!.projectId === build!.projectId) continue;
        for (const step of stepsOwning(other!.activeStepId)) {
          if (mine.has(step.id)) continue;
          const { outcome, next } = await call(
            initialSession(build!),
            "navigate_build_step",
            { step_id: step.id },
          );
          expect(outcome.status, `${build!.projectId} -> ${step.id}`).toBe(
            "error",
          );
          expect(refusal(outcome)).toBe("unknownStep");
          expect(next.activeStepId).toBe(build!.activeStepId);
        }
      }
    }
  });

  it("and still moves to one of its own", async () => {
    const { outcome, next } = await call(open(), "navigate_build_step", {
      step_id: "lampResistor",
    });
    expect(outcome.status).toBe("ok");
    expect(next.activeStepId).toBe("lampResistor");
  });

  /* The headline is composed OUTSIDE the runner's try, so a throw in it used to
     mean no activity entry, no settle, no toast — and a raw JS `TypeError`
     where the handler had a refusal ready. */
  it("the headline survives an id no build has", () => {
    const state = open();
    expect(() =>
      headlineFor(
        "navigate_build_step",
        { step_id: "nope" } as unknown as ToolInputs["navigate_build_step"],
        state,
      ),
    ).not.toThrow();
    expect(() =>
      headlineFor(
        "run_functional_test",
        {} as ToolInputs["run_functional_test"],
        state,
      ),
    ).not.toThrow();
  });
});

describe("verify_current_step", () => {
  /**
   * `verifyStep` reads `verified` off the mismatches and `expected` off the
   * step's own count, with no clause tying them together — so a step whose ids
   * the scene has never heard of yields zero mismatches and a green tick beside
   * `matched: 0`. Six such calls turned an untouched bench into a finished
   * build with `Finish` in the foot.
   */
  it("cannot report `verified: true` with nothing matched", async () => {
    /* Reached by hand: `navigate_build_step` refuses this now, and the point of
       the test is that the invariant holds even if that guard ever stops. */
    const foreign: AgentSessionState = { ...open(), activeStepId: "sensor" };
    const { outcome, next } = await call(foreign, "verify_current_step", {});
    const result = outcome.result as { verified: boolean; matched: number };
    expect(result.matched).toBe(0);
    expect(result.verified).toBe(false);
    expect(next.completedSteps).toEqual([]);
    expect(next.completedAt).toBeNull();
  });

  /**
   * §9: a failed verification returns a structured answer and makes the finding
   * visible. The failure branch used to return no patch at all, so the activity
   * tab said `1 issue still open` while the Findings tab said there was nothing
   * open on this step.
   */
  it("a failed verification puts the findings on screen", async () => {
    const seat: AgentSessionState = { ...open(), activeStepId: "lampSeat" };
    const { outcome, next } = await call(seat, "verify_current_step", {});
    expect((outcome.result as { verified: boolean }).verified).toBe(false);
    expect(next.findings.length).toBeGreaterThan(0);
    expect(next.tab).toBe("findings");
    expect(next.highlightedFindingId).toBe(next.findings[0]!.id);
    expect(
      outcome.effects?.some(
        (effect) => effect.kind === "toast" && effect.tone === "warning",
      ),
    ).toBe(true);
  });

  it("and a step with nothing to compare still ticks", async () => {
    const { outcome, next } = await call(open(), "verify_current_step", {});
    expect((outcome.result as { verified: boolean }).verified).toBe(true);
    expect(next.completedSteps).toContain("lampKit");
  });
});

describe("inspect_build validates its scope", () => {
  it("refuses a name that is not one of the five", async () => {
    for (const scope of ["banana", null, 42, ""]) {
      const { outcome, next } = await call(open(), "inspect_build", {
        scope,
      } as ToolInputs["inspect_build"]);
      expect(outcome.status, String(scope)).toBe("error");
      expect(refusal(outcome)).toBe("unknownScope");
      expect(next.findings).toEqual([]);
    }
  });

  /**
   * A scope this build does not *offer* is still a true question with a true
   * answer. `schemaFactsFor` withholds `mechanical` from a build with nothing
   * that turns; the honest reply is an empty list, not a refusal.
   */
  it("but answers a valid scope the build does not offer", async () => {
    const { outcome } = await call(open(), "inspect_build", {
      scope: "mechanical",
    });
    expect(outcome.status).toBe("ok");
    expect((outcome.result as { findings: unknown[] }).findings).toEqual([]);
  });

  /**
   * The credit ledger is scoped to the findings list, not emptied.
   *
   * `repaired: []` plus a `kept` list that keeps out-of-scope findings alive
   * left the two disagreeing, and `commit` in `agent/placement.ts` guards
   * double-billing with exactly this set — so one fault could be counted twice.
   */
  it("keeps the repair credit of a finding it did not look at", async () => {
    const held: AgentSessionState = { ...open(), activeStepId: "lampResistor" };
    const { next: found } = await call(held, "inspect_build", { scope: "all" });
    expect(found.findings.length).toBeGreaterThan(0);

    const credited = { ...found, repaired: [found.findings[0]!.id] };
    const { next: after } = await call(credited, "inspect_build", {
      scope: "mechanical",
    });
    expect(after.repaired).toEqual(credited.repaired);
  });

  /** And the id an agent is holding survives the tool's own default scope. */
  it("a second inspection does not throw away the first one's ids", async () => {
    const { next: all } = await call(open(), "inspect_build", { scope: "all" });
    expect(all.findings.length).toBeGreaterThan(0);
    const { next: again } = await call(all, "inspect_build", {});
    for (const finding of all.findings) {
      expect(again.findings.map((f) => f.id)).toContain(finding.id);
    }
  });
});

describe("show_correction", () => {
  const withFindings = async () => {
    const seat: AgentSessionState = { ...open(), activeStepId: "lampSeat" };
    const { next } = await call(seat, "inspect_build", { scope: "all" });
    return next;
  };

  it("refuses a detail level outside the ladder, and does not write it", async () => {
    const state = await withFindings();
    const { outcome, next } = await call(state, "show_correction", {
      finding_id: state.findings[0]!.id,
      detail_level: "loud",
    } as unknown as ToolInputs["show_correction"]);
    expect(outcome.status).toBe("error");
    expect(refusal(outcome)).toBe("unknownDetailLevel");
    expect(next.coaching).toBe("hint");
  });

  /* The two conditions were the wrong way round: an id nothing ever minted was
     told the finding was "no longer open", and an id whose fault the graph says
     is fixed returned ok and swung the camera onto the corrected hole. */
  it("refuses an id nothing minted", async () => {
    const state = await withFindings();
    const { outcome } = await call(state, "show_correction", {
      finding_id: "finding:nope",
    });
    expect(outcome.status).toBe("error");
    expect(refusal(outcome)).toBe("noSuchFinding");
  });

  it("refuses a finding the build has already put right", async () => {
    const state = await withFindings();
    const finding = state.findings[0]!;
    const fixed = {
      ...state,
      placement: spec.complete,
      scene: lampSceneFrom(spec.complete),
    };
    const { outcome } = await call(fixed, "show_correction", {
      finding_id: finding.id,
    });
    expect(outcome.status).toBe("error");
    expect(outcome.errorMessage).toEqual({
      ns: "errors",
      k: "unknownFinding",
    });
    expect(outcome.result).toMatchObject({ resolved: true });
  });

  it("and points at one that is genuinely open", async () => {
    const state = await withFindings();
    const { outcome, next } = await call(state, "show_correction", {
      finding_id: state.findings[0]!.id,
      detail_level: "exact",
    });
    expect(outcome.status).toBe("ok");
    expect(next.coaching).toBe("exact");
    expect(next.highlightedFindingId).toBe(state.findings[0]!.id);
  });
});

describe("find_projects validates before it writes the toolbar", () => {
  it("refuses a filter of the wrong shape", async () => {
    const bad: Record<string, unknown>[] = [
      { search: 42 },
      { max_minutes: "twenty" },
      { max_minutes: -5 },
      { ready_only: "yes" },
      { difficulty: {} },
      { concepts: 5 },
      { components: "servo" },
      { components: ["nope"] },
      { concepts: ["blinking"] },
      { difficulty: ["hard"] },
    ];
    for (const input of bad) {
      const { outcome } = await call(
        open(),
        "find_projects",
        input as never,
      );
      expect(outcome.status, JSON.stringify(input)).toBe("error");
      expect(refusal(outcome)).toBe("unknownFilter");
      expect(outcome.effects).toBeUndefined();
    }
  });

  it("and narrows on one it accepts", async () => {
    const { outcome } = await call(open(), "find_projects", {
      components: ["servo"],
    });
    expect(outcome.status).toBe("ok");
    expect((outcome.result as { count: number }).count).toBeGreaterThan(0);
  });

  it("resolves a project by a shouted slug", async () => {
    const { outcome } = await call(open(), "open_project", {
      project: "TRAFFIC-LIGHT",
    });
    expect(outcome.status).toBe("ok");
  });
});

/**
 * §14 · nothing in state is a sentence.
 *
 * Undo and redo say *what came back* — `Undone: You put the LED's long leg in
 * A5` — and the inner half was rendered at gesture time and passed as a STRING.
 * `resolve` returns a non-`Ref` verbatim, so that half never re-translated:
 * switch language and the timeline read one clause in each. It was the only
 * occurrence in `src/`.
 */
describe("a sentence inside a sentence still re-translates", () => {
  const nested: Line = {
    ns: "user",
    k: "undone",
    args: [{ ref: "line", line: { ns: "user", k: "nothingToUndo" } }],
  };

  it("resolves both halves through the reader's own dictionary", () => {
    expect(say(en, nested)).toContain(en.agentPanel.user.nothingToUndo);
    expect(say(tr, nested)).toContain(tr.agentPanel.user.nothingToUndo);
    expect(say(tr, nested)).not.toContain(en.agentPanel.user.nothingToUndo);
  });
});

/**
 * A part is named by its lead, not by the kind it is counted as.
 *
 * `componentOf` collapses chapter two's three resistors to `resistor` and its
 * four cables to `jumper`, so three different acts produced one identical
 * timeline row — under a finding row that named the part correctly.
 */
describe("part names come from one authority", () => {
  const named = (lead: string) =>
    say(en, {
      ns: "activity",
      k: "checkedPartPlaced",
      args: [{ ref: "part", lead }],
    });

  it("tells chapter two's lamps, resistors and cables apart", () => {
    const leads = [
      "led.red.anode",
      "led.yellow.anode",
      "led.green.anode",
      "res.red.in",
      "res.yellow.in",
      "res.green.in",
      "wire.gnd.pin",
      "wire.red.pin",
      "wire.yellow.pin",
      "wire.green.pin",
    ];
    expect(new Set(leads.map(named)).size).toBe(leads.length);
  });
});

/**
 * A check id is translated too — the dock beside the panel already says so.
 *
 * The timeline carried the raw id, so the Turkish activity row read *"Ajan
 * wiring testini çalıştırdı"* beside a device row reading `Bağlantılar
 * okunuyor`: one screen naming one check twice, in two languages.
 */
describe("a check ref resolves in the reader's language", () => {
  const testing = (id: string): Line => ({
    ns: "activity",
    k: "testing",
    args: [{ ref: "check", id }],
  });

  it("names the check the way the device dock names it", () => {
    expect(say(en, testing("wiring"))).toContain(en.test.wiring);
    expect(say(tr, testing("wiring"))).toContain(tr.test.wiring);
    expect(say(tr, testing("wiring"))).not.toContain("wiring");
  });

  /**
   * `no_such_check` is deliberately undeclared — no `RunSpec` has it and no
   * locale names it — because the fallback needs an id the dictionary will
   * never learn. It used to be demonstrated with `full_system`, which is a real
   * argument of `run_functional_test` and is exactly the row that ought to
   * acquire a name; pinning the fallback to it would have made naming it a test
   * failure.
   */
  it("falls back to the id itself where there is no word for it", () => {
    expect(say(en, testing("no_such_check"))).toContain("no such check");
    expect(say(tr, testing("no_such_check"))).toContain("no such check");
  });
});

/**
 * A stray is not a wire in the wrong place.
 *
 * `foundLine`'s docstring says only a set that is all of one kind gets that
 * kind's sentence — and the implementation asked "not mechanical and not
 * part-not-placed", which swept `unexpected-connection` in with the two
 * mismatch kinds. So one missing join plus one join nobody asked for — the
 * ordinary outcome of moving a single lead to a wrong hole — was announced as
 * `2 connection mismatches found`, sending the person to look for the sketch's
 * line about a wire the sketch does not have.
 */
describe("a mixed set of wiring faults is counted, not named", () => {
  it("one missing join and one stray is `2 issues found`", async () => {
    const wrong: AgentSessionState = {
      ...open(),
      activeStepId: "lampResistor",
      placement: { ...spec.complete, "led.anode": "board.D8" },
      scene: lampSceneFrom({ ...spec.complete, "led.anode": "board.D8" }),
    };
    const { outcome } = await call(wrong, "inspect_build", { scope: "all" });
    const found = (outcome.result as { findings: { type: string }[] }).findings;
    expect(found.map((f) => f.type).sort()).toEqual([
      "missing-connection",
      "unexpected-connection",
    ]);
    expect(outcome.note?.headline).toEqual({
      ns: "activity",
      k: "issuesFound",
      args: [2],
    });
  });
});

/**
 * The happy path, end to end, on every bench that has one.
 *
 * `verify_current_step` now re-derives `verified` (see `fullyVerified` in
 * `services.ts`) instead of trusting `verifyStep`'s boolean, which is the guard
 * that stops a step the scene cannot answer for reporting a green tick beside
 * `matched: 0`. The cost of getting that wrong would be silent and total: a
 * correctly assembled build that can no longer be finished. So the same tool,
 * on the same finished placement, walks each rail to `completedAt`.
 */
describe("a correctly built bench still verifies to the end", () => {
  for (const build of Object.values(builds)) {
    const placement = build!.placement;
    if (!placement) continue;

    it(build!.projectId, async () => {
      const start = initialSession(build!);
      let state: AgentSessionState = {
        ...start,
        placement: placement.complete,
        scene: placement.sceneFrom(
          placement.complete,
          start.scene.mechanical,
        ),
      };
      const rail = stepsOwning(state.activeStepId);
      for (let i = 0; i < rail.length; i += 1) {
        const at = state.activeStepId;
        const { outcome, next } = await call(state, "verify_current_step", {});
        expect(
          (outcome.result as { verified: boolean }).verified,
          `${build!.projectId} ${at}`,
        ).toBe(true);
        state = next;
      }
      expect(state.completedSteps.sort()).toEqual(
        rail.map((step) => step.id).sort(),
      );
      expect(state.completedAt).not.toBeNull();
    });
  }
});

/**
 * Every refusal says what was wrong, in the reader's own language.
 *
 * The structure landed a batch before the sentences did, so for one commit all
 * five of these showed `errors.toolFailed` — "That call could not be completed."
 * — which is true and tells a person nothing. §9's rule 3 asks for a
 * comprehensible error, and a generic one shared by five different mistakes is
 * the defect this campaign is about, one level up.
 */
describe("a refused call names what was refused", () => {
  /** A bench with findings on it, so a `finding_id` can be resolved. */
  const withFindings = async () => {
    const seat: AgentSessionState = { ...open(), activeStepId: "lampSeat" };
    const { next } = await call(seat, "inspect_build", { scope: "all" });
    return next;
  };

  const cases: {
    name: string;
    key: ToolErrorKey;
    run: () => Promise<ToolOutcome>;
  }[] = [
    {
      name: "a step from another chapter",
      key: "unknownStep",
      run: async () =>
        (
          await call(open(), "navigate_build_step", {
            step_id: "sensor",
          } as unknown as ToolInputs["navigate_build_step"])
        ).outcome,
    },
    {
      name: "a scope that is not a scope",
      key: "unknownScope",
      run: async () =>
        (
          await call(open(), "inspect_build", {
            scope: "banana",
          } as unknown as ToolInputs["inspect_build"])
        ).outcome,
    },
    {
      name: "a detail level outside the ladder",
      key: "unknownDetailLevel",
      run: async () =>
        (
          await call(open(), "show_correction", {
            finding_id: "anything",
            detail_level: "loud",
          } as unknown as ToolInputs["show_correction"])
        ).outcome,
    },
    {
      name: "an id nothing minted",
      key: "noSuchFinding",
      run: async () =>
        (await call(open(), "show_correction", { finding_id: "nope" })).outcome,
    },
    {
      name: "an id the build has already put right",
      key: "unknownFinding",
      run: async () => {
        const state = await withFindings();
        const fixed = {
          ...state,
          placement: spec.complete,
          scene: lampSceneFrom(spec.complete),
        };
        return (
          await call(fixed, "show_correction", {
            finding_id: state.findings[0]!.id,
          })
        ).outcome;
      },
    },
    {
      name: "a name this bench has not got",
      key: "unknownSubject",
      run: async () =>
        (await call(open(), "point_at", { target: "nope" })).outcome,
    },
    {
      name: "a write on a bench the author laid out",
      key: "noPlacement",
      run: async () =>
        (
          await call(initialSession(builds.smartParkingBarrier!), "attach_lead", {
            lead: "sensor.echo",
          })
        ).outcome,
    },
    {
      name: "a lead this build does not have",
      key: "unknownLead",
      run: async () =>
        (await call(open(), "attach_lead", { lead: "nope" })).outcome,
    },
    {
      name: "a target that is neither a hole nor a lead",
      key: "unknownTarget",
      run: async () =>
        (
          await call(open(), "attach_lead", {
            lead: "led.cathode",
            target: "nope",
          })
        ).outcome,
    },
    {
      name: "a hole with someone else's lead in it",
      key: "holeTaken",
      run: async () => {
        const { next } = await call(open(), "attach_lead", {
          lead: "led.cathode",
          target: "board.GND",
        });
        return (
          await call(next, "attach_lead", {
            lead: "led.anode",
            target: "board.GND",
          })
        ).outcome;
      },
    },
    {
      name: "a lead that already has something clipped to it",
      key: "leadNotFree",
      run: async () => {
        /* The LED is seated first on purpose: `prune` drops a join between two
           parts that both have no path to a hole, so clipping the resistor to
           a floating LED changes nothing and answers `leadAlreadyThere`. */
        const { next: seated } = await call(open(), "attach_lead", {
          lead: "led.cathode",
          target: "board.GND",
        });
        const { next } = await call(seated, "attach_lead", {
          lead: "res.in",
          target: "led.anode",
        });
        return (
          await call(next, "attach_lead", {
            lead: "res.out",
            target: "led.anode",
          })
        ).outcome;
      },
    },
    {
      name: "both ends of one part asked to meet",
      key: "sameCircuitPart",
      run: async () =>
        (
          await call(open(), "attach_lead", {
            lead: "led.anode",
            target: "led.cathode",
          })
        ).outcome,
    },
    {
      name: "a cable end asked to clip onto a leg",
      key: "wireEnd",
      run: async () =>
        (
          await call(initialSession(builds.trafficLight!), "attach_lead", {
            lead: "wire.gnd.pin",
            target: "led.red.anode",
          })
        ).outcome,
    },
    {
      name: "a lead asked for the seat it is already in",
      key: "leadAlreadyThere",
      run: async () =>
        (await call(open(), "attach_lead", { lead: "led.cathode", target: null }))
          .outcome,
    },
    {
      name: "a check this build does not run",
      key: "unknownCheck",
      run: async () =>
        (await call(open(), "run_functional_test", { test: "nope" })).outcome,
    },
    {
      name: "a filter of the wrong shape",
      key: "unknownFilter",
      run: async () =>
        (
          await call(open(), "find_projects", {
            max_minutes: "twenty",
          } as never)
        ).outcome,
    },
    {
      name: "a project the catalogue does not name",
      key: "unknownProject",
      run: async () =>
        (await call(open(), "open_project", { project: "Traffic Light" }))
          .outcome,
    },
  ];

  for (const { name, key, run } of cases) {
    it(name, async () => {
      const outcome = await run();
      expect(outcome.status).toBe("error");
      expect(refusal(outcome)).toBe(key);
      /* The key the payload reports and the key the toast renders are one
         object, so they cannot name two different mistakes. */
      expect(outcome.errorMessage?.k).toBe(key);
      for (const copy of [en, tr]) {
        const sentence = say(copy, outcome.errorMessage!);
        expect(sentence.length, `${key} ${copy === en ? "en" : "tr"}`)
          .toBeGreaterThan(0);
        expect(sentence).not.toBe(copy.agentPanel.errors.toolFailed);
      }
    });
  }

  /**
   * Both directions, or the guard is half a guard.
   *
   * A key added to the vocabulary and never provoked is a wire value nothing
   * checks; a key provoked and not in the vocabulary is a list that has stopped
   * describing the layer. This is what makes the seventeen-of-seventeen claim
   * checkable rather than asserted.
   */
  it("covers every refusal the layer can reach, and no others", () => {
    expect([...cases.map((c) => c.key)].sort()).toEqual([...toolErrorKeys].sort());

    /**
     * And every key in the vocabulary is a key the dictionary has.
     *
     * A compile-time check, written here because `model.ts` keeps the list
     * without importing anything. It is the half of the guard that catches a
     * key `en.ts` has *deleted*; the seventeen provocations above are the half
     * that catches one that has been *renamed*, which fixes both sides at once
     * and would otherwise pass in silence.
     */
    type ErrorKey = Extract<Line, { ns: "errors" }>["k"];
    const inDictionary: readonly ErrorKey[] = toolErrorKeys;
    expect(inDictionary).toHaveLength(toolErrorKeys.length);
  });

  /**
   * The refusal for a step names a count, not the ids.
   *
   * `mnlPower` is a graph address that appears nowhere a person can see, and
   * the campaign that produced this guard spent a commit taking exactly that
   * class of string out of rendered sentences. The ids an agent needs are in
   * `result.valid`, where a list belongs.
   */
  it("counts the steps rather than listing them", async () => {
    const { outcome } = await call(open(), "navigate_build_step", {
      step_id: "sensor",
    } as unknown as ToolInputs["navigate_build_step"]);
    const sentence = say(en, outcome.errorMessage!);
    expect(sentence).toContain("4");
    for (const id of ["lampKit", "lampSeat", "lampResistor", "lampUpload"]) {
      expect(sentence).not.toContain(id);
      expect(
        (outcome.result as { valid: string[] }).valid,
      ).toContain(id);
    }
  });
});

/**
 * The timeline says what the call actually did.
 *
 * `headlineFor` had one sentence for every `show_correction` — "Agent pointed
 * at the connection" — so every correction in the opening of five chapters
 * described pointing at a connection that does not exist, because on a fresh
 * bench every finding is a part still in the box. `placement` had the same
 * shape one tool along: the one scope that excludes wiring was announced as
 * having inspected wiring.
 */
describe("the timeline headline matches the call", () => {
  it("names a placement inspection as one", () => {
    const line = headlineFor("inspect_build", { scope: "placement" }, open());
    expect(line).toEqual({
      ns: "activity",
      k: "inspectingPlacement",
      args: [1],
    });
  });

  it("points at a part, a horn or a connection, by what the finding is", async () => {
    const seat: AgentSessionState = { ...open(), activeStepId: "lampSeat" };
    const { next } = await call(seat, "inspect_build", { scope: "all" });
    const part = next.findings.find((f) => f.type === "part-not-placed")!;
    expect(
      headlineFor("show_correction", { finding_id: part.id }, next).k,
    ).toBe("showingCorrectionPart");

    const barrier = initialSession(builds.smartParkingBarrier!);
    const { next: capstone } = await call(barrier, "inspect_build", {
      scope: "all",
    });
    const horn = capstone.findings.find(
      (f) => f.type === "mechanical-alignment",
    )!;
    const wire = capstone.findings.find((f) => f.type !== "mechanical-alignment")!;
    expect(
      headlineFor("show_correction", { finding_id: horn.id }, capstone).k,
    ).toBe("showingCorrectionAlignment");
    expect(
      headlineFor("show_correction", { finding_id: wire.id }, capstone).k,
    ).toBe("showingCorrection");
  });

  /**
   * The clean sentence is about what was looked at. One line said "in this
   * step" whatever the scope was, so a whole-build inspection that came back
   * clean reported on something narrower than it had read.
   */
  it("says `in this build` for a scope that read the build", async () => {
    const clean: AgentSessionState = {
      ...open(),
      placement: spec.complete,
      scene: lampSceneFrom(spec.complete),
    };
    const { outcome: whole } = await call(clean, "inspect_build", {
      scope: "all",
    });
    expect(whole.note?.headline).toEqual({
      ns: "activity",
      k: "nothingFoundInBuild",
    });
    const { outcome: here } = await call(clean, "inspect_build", {
      scope: "current_step",
    });
    expect(here.note?.headline).toEqual({
      ns: "activity",
      k: "nothingFound",
    });
  });
});

/**
 * A cancelled call does not leave a mark on somebody's build.
 *
 * WebMCP discards the result of an aborted call, so a tool that ignores the
 * signal finishes into nobody: an agent that cancelled at 900 ms of
 * `attach_lead`'s 1160 ms seat had its answer thrown away while the learner's
 * bench moved anyway — undoably, but unannounced, and with nobody left to be
 * told. The phases are collapsed here, so what these pin is the decision rather
 * than the timing: the race that ends the wait early lives in
 * `use-agent-session.ts`'s `phase`, and it was measured at 909 ms against
 * `SEAT_AT` of 1160.
 */
describe("a cancelled call", () => {
  const aborted = () => {
    const controller = new AbortController();
    controller.abort();
    return controller.signal;
  };

  it("writes nothing, and says so without calling it a failure", async () => {
    const { outcome, next } = await call(
      open(),
      "attach_lead",
      { lead: "led.cathode", target: "board.GND" },
      aborted(),
    );
    expect(outcome.patch).toBeUndefined();
    expect(outcome.commits).toBeUndefined();
    expect(outcome.result).toMatchObject({ cancelled: true });
    /* No sentence, rather than a borrowed one: every error line this layer has
       says the call failed, and this call did not fail. */
    expect(outcome.errorMessage).toBeUndefined();
    expect(next.placement["led.cathode"]).toBeNull();
  });

  it("still commits when the signal is there and never fires", async () => {
    const { outcome, next } = await call(
      open(),
      "attach_lead",
      { lead: "led.cathode", target: "board.GND" },
      new AbortController().signal,
    );
    expect(outcome.commits).toBe(true);
    expect(next.placement["led.cathode"]).toBe("board.GND");
  });

  /**
   * And a cancelled READ lands, which is the deliberate half.
   *
   * `commits` is the line: it means *a gesture on the bench rather than a
   * reading*, and `attach_lead` is the only handler that sets it. Refusing to
   * land a read's patch would only make the screen disagree with the timeline
   * about a camera move nobody is harmed by. Pinned so the rule is not
   * "improved" into a blanket one later.
   */
  it("does not withhold a reading's patch", async () => {
    const { outcome } = await call(
      open(),
      "inspect_build",
      { scope: "all" },
      aborted(),
    );
    expect(outcome.status).toBe("ok");
    expect(outcome.patch).toBeDefined();
  });
});

/**
 * Batch 8's door, reached without an agent.
 *
 * Every build's last step has `connections: []` and `suggestion: "runTest"`:
 * the foot offers the test there, and the only tool that ticked a step was
 * `verify_current_step` — which the foot never offered on that step. So the
 * test passed, the rail stayed on `4 of 4 · Active`, `completedAt` stayed null
 * and `Finish build` never appeared. A run with every check green now closes
 * the step it was offered on, with verify's own patch.
 */
describe("run_functional_test on the last step", () => {
  const atLastStep = (): AgentSessionState => ({
    ...open(),
    scene: lampSceneFrom(spec.complete),
    completedSteps: ["lampKit", "lampSeat", "lampResistor"],
    activeStepId: "lampUpload",
  });

  it("ticks the step and stamps completedAt when every check is green", async () => {
    const { outcome, next } = await call(atLastStep(), "run_functional_test", {
      test: "full_system",
    });
    expect(outcome.status).toBe("ok");
    expect(next.completedSteps).toContain("lampUpload");
    expect(next.completedAt).not.toBeNull();
    /* The last step has nowhere to advance to; the door is offered, not
       walked through. */
    expect(next.activeStepId).toBe("lampUpload");
  });

  it("is idempotent there: a second run keeps the first stamp", async () => {
    const first = (
      await call(atLastStep(), "run_functional_test", { test: "full_system" })
    ).next;
    const second = (
      await call(first, "run_functional_test", { test: "full_system" })
    ).next;
    expect(second.completedAt).toBe(first.completedAt);
    expect(second.completedSteps).toEqual(first.completedSteps);
  });

  it("ticks nothing when a check fails", async () => {
    const empty: AgentSessionState = { ...open(), activeStepId: "lampUpload" };
    const { outcome, next } = await call(empty, "run_functional_test", {
      test: "full_system",
    });
    expect(outcome.status).toBe("ok");
    expect(next.completedSteps).not.toContain("lampUpload");
    expect(next.completedAt).toBeNull();
  });

  it("ticks nothing from an earlier step, however green the bench is", async () => {
    const early: AgentSessionState = {
      ...open(),
      scene: lampSceneFrom(spec.complete),
      activeStepId: "lampSeat",
    };
    const { next } = await call(early, "run_functional_test", {
      test: "full_system",
    });
    expect(next.completedSteps).toEqual([]);
    expect(next.completedAt).toBeNull();
    expect(next.activeStepId).toBe("lampSeat");
  });

  it("a single check is a look, not a verdict", async () => {
    /* The precondition the test rests on: one check is not all of them. */
    expect(lamp.run.checks.length).toBeGreaterThan(1);
    const { next } = await call(atLastStep(), "run_functional_test", {
      test: lamp.run.checks[0]!.id,
    });
    expect(next.completedSteps).not.toContain("lampUpload");
    expect(next.completedAt).toBeNull();
  });
});
