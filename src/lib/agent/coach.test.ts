import { describe, expect, it } from "vitest";
import type { ToolCall } from "@/lib/agent/activity";
import {
  atRest,
  coachMood,
  coachMoods,
  DWELL_MS,
  dwellLeft,
  reactionFor,
  restingMood,
  runningMood,
} from "@/lib/agent/coach";
import {
  allTools,
} from "@/lib/agent/tools";
import { toolAct, toolActs, type AgentTool } from "@/lib/agent/model";
import {
  initialSession,
  sessionReducer,
  type AgentSessionState,
} from "@/lib/agent/session";

/**
 * The coach's face is a claim about the call in flight, so the claims are
 * pinned here the way the annotations table is pinned in `webmcp.test.ts`:
 * every tool has a verb, the verbs agree with the ring, and the reactions
 * come off the entries the runner really writes.
 */

const call = (name: AgentTool, id = "call-1"): ToolCall => ({
  id,
  name,
  args: {},
  argsSummary: "",
  status: "running",
  startedAt: 0,
});

function running(name: AgentTool, online = true): AgentSessionState {
  const base = { ...initialSession(), webMcpAvailable: online };
  return sessionReducer(base, {
    type: "tool/start",
    call: call(name),
    headline: { ns: "activity", k: "readContext" },
  });
}

function settled(
  state: AgentSessionState,
  status: "ok" | "error",
  tone?: "found" | "passed" | "failed",
): AgentSessionState {
  const closed = sessionReducer(state, {
    type: "tool/settle",
    callId: "call-1",
    time: "14:32",
    status,
    durationMs: 10,
  });
  if (!tone) return closed;
  return sessionReducer(closed, {
    type: "log",
    entry: {
      actor: "agent",
      headline: { ns: "activity", k: "nothingFound" },
      status: "ok",
      time: "14:32",
      tone,
    },
  });
}

describe("every tool has an act, and the acts are the moods' first five", () => {
  it("names all twelve", () => {
    for (const tool of allTools) {
      expect(toolActs).toContain(toolAct[tool]);
    }
  });

  it("every act is a mood the face can draw", () => {
    for (const act of toolActs) {
      expect(coachMoods).toContain(act);
    }
  });

  /* The ring's three jobs, in `use-agent-mascot.ts`: `inspect_build` and
     `verify_current_step` read, `show_correction` points, `attach_lead`
     carries. A tool the ring reads while the face says it is touching would
     be two agents on one bench. */
  it("agrees with the ring on the four tools that get one", () => {
    expect(toolAct.inspect_build).toBe("looking");
    expect(toolAct.verify_current_step).toBe("looking");
    expect(toolAct.show_correction).toBe("showing");
    expect(toolAct.attach_lead).toBe("touching");
  });
});

describe("the mood of a call in flight", () => {
  it("is the tool's act", () => {
    expect(runningMood(running("attach_lead"))).toBe("touching");
    expect(runningMood(running("run_functional_test"))).toBe("testing");
    expect(runningMood(running("navigate_build_step"))).toBe("moving");
    expect(runningMood(running("show_correction"))).toBe("showing");
    expect(runningMood(running("get_build_context"))).toBe("looking");
  });

  it("is `thinking` only during a comparing phase", () => {
    const reading = sessionReducer(running("inspect_build"), {
      type: "tool/phase",
      callId: "call-1",
      note: { ns: "phases", k: "readingWiring" },
    });
    expect(runningMood(reading)).toBe("looking");

    const weighing = sessionReducer(reading, {
      type: "tool/phase",
      callId: "call-1",
      note: { ns: "phases", k: "comparingSketch" },
    });
    expect(runningMood(weighing)).toBe("thinking");
  });

  it("a comparing phase on a tool that is not looking does not think", () => {
    const state = sessionReducer(running("attach_lead"), {
      type: "tool/phase",
      callId: "call-1",
      note: { ns: "phases", k: "comparingSketch" },
    });
    expect(runningMood(state)).toBe("touching");
  });

  it("is nothing when nothing runs", () => {
    expect(runningMood(initialSession())).toBeNull();
  });
});

describe("at rest", () => {
  it("listens with a host and waits without one", () => {
    expect(restingMood({ ...initialSession(), webMcpAvailable: true })).toBe(
      "idle",
    );
    expect(restingMood(initialSession())).toBe("offline");
  });

  it("a call in flight outranks a held reaction, which outranks rest", () => {
    expect(coachMood(running("inspect_build"), "passed")).toBe("looking");
    expect(coachMood(initialSession(), "passed")).toBe("passed");
    expect(coachMood(initialSession(), null)).toBe("offline");
  });
});

describe("the reaction after a call lands", () => {
  it("a refusal is a failed face, whatever the tool", () => {
    expect(reactionFor(settled(running("attach_lead"), "error"), "call-1")).toBe(
      "failed",
    );
  });

  it("reads the verdict off the note logged after the call", () => {
    expect(
      reactionFor(settled(running("verify_current_step"), "ok", "passed"), "call-1"),
    ).toBe("passed");
    expect(
      reactionFor(settled(running("run_functional_test"), "ok", "failed"), "call-1"),
    ).toBe("failed");
    expect(
      reactionFor(settled(running("inspect_build"), "ok", "found"), "call-1"),
    ).toBe("found");
  });

  it("a call that landed without a verdict gets no reaction", () => {
    expect(reactionFor(settled(running("get_build_context"), "ok"), "call-1")).toBeNull();
  });

  it("does not read a later call's note as this call's verdict", () => {
    const first = settled(running("get_build_context"), "ok");
    const second = sessionReducer(first, {
      type: "tool/start",
      call: call("verify_current_step", "call-2"),
      headline: { ns: "activity", k: "readContext" },
    });
    const done = sessionReducer(
      sessionReducer(second, {
        type: "tool/settle",
        callId: "call-2",
        time: "14:33",
        status: "ok",
        durationMs: 10,
      }),
      {
        type: "log",
        entry: {
          actor: "agent",
          headline: { ns: "activity", k: "stepVerified" },
          status: "ok",
          time: "14:33",
          tone: "passed",
        },
      },
    );
    expect(reactionFor(done, "call-1")).toBeNull();
    expect(reactionFor(done, "call-2")).toBe("passed");
  });

  it("an unknown call is no reaction", () => {
    expect(reactionFor(initialSession(), "call-9")).toBeNull();
  });
});

describe("the dwell", () => {
  it("rest can be left at once", () => {
    expect(atRest("idle")).toBe(true);
    expect(atRest("offline")).toBe(true);
    expect(dwellLeft({ mood: "idle", since: 1000 }, 1000)).toBe(0);
    expect(dwellLeft({ mood: "offline", since: 1000 }, 1000)).toBe(0);
  });

  it("a working face is owed the rest of its time", () => {
    expect(dwellLeft({ mood: "looking", since: 1000 }, 1000)).toBe(DWELL_MS);
    expect(dwellLeft({ mood: "looking", since: 1000 }, 1400)).toBe(
      DWELL_MS - 400,
    );
    expect(dwellLeft({ mood: "looking", since: 1000 }, 1000 + DWELL_MS)).toBe(0);
    expect(dwellLeft({ mood: "looking", since: 1000 }, 5000)).toBe(0);
  });

  it("a reaction is held like a working face, not like rest", () => {
    for (const mood of ["found", "passed", "failed"] as const) {
      expect(atRest(mood)).toBe(false);
      expect(dwellLeft({ mood, since: 0 }, 100)).toBe(DWELL_MS - 100);
    }
  });

  /* The whole reason the rule exists: a real host's fastest call is shorter
     than the time it takes to read the face it puts on. */
  it("outlasts the fastest call in the product", () => {
    const getBuildContextMs = 420;
    expect(DWELL_MS).toBeGreaterThan(getBuildContextMs);
  });
});
