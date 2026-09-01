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

  it("does not remember findings — they are re-asked off the graph", () => {
    const snap = snapshotOf(open());
    expect(Object.keys(snap).sort()).toEqual([
      "activeStepId",
      "completedAt",
      "completedSteps",
      "placement",
      "repaired",
      "repairs",
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
    ]);
    for (const key of Object.keys(patch)) expect(covered).toContain(key);
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
