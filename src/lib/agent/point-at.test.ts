import { describe, expect, it } from "vitest";
import { en } from "@/content/locales/en";
import { tr } from "@/content/locales/tr";
import { builds, schemaFactsFor } from "@/lib/agent/builds";
import { say, type Line } from "@/lib/agent/line";
import { placeIn } from "@/lib/agent/placement";
import {
  headlineFor,
  type SessionEffect,
  type ToolInputs,
  type ToolOutcome,
} from "@/lib/agent/services";
import {
  initialSession,
  sessionReducer,
  type AgentSessionState,
} from "@/lib/agent/session";
import { allHandlers, type AllToolInputs } from "@/lib/agent/tools";
import { maybeNode } from "@/lib/circuit/graph";

/**
 * G-17 · `point_at`, and the one thing it changed about `attach_lead`.
 *
 * The pointer is the first tool since `attach_lead` to leave something on the
 * bench — a spotlight, in `pointedAt` — so what is pinned here is less the
 * camera move than the bookkeeping around it: what a name resolves to on each
 * kind of bench, what is written when the thing is in the kit and there is
 * nothing to frame, and the rule that the mark is one mark, cleared by the
 * next gesture, correction, step change or undo. The last block is about the
 * carry: a lead that can never land is refused before the ring leaves.
 */

const lamp = builds.breathingLamp!;
const spec = lamp.placement!;
const barrier = builds.smartParkingBarrier!;

const open = () => initialSession(lamp);

/**
 * A call the way the runner makes it, with the two things a handler cannot
 * see recorded: which phases it announced and how long it asked to wait, and
 * whether its patch landed as a commit — on the undo stack, counted in
 * `assistedEdits` — or folded into the entry. The waits are collapsed; this
 * file is about the answers and the decisions, not the timing.
 */
async function call<K extends keyof AllToolInputs>(
  state: AgentSessionState,
  name: K,
  input: AllToolInputs[K],
) {
  let live = state;
  const phases: Line[] = [];
  let waited = 0;
  const outcome = await allHandlers[name](input as never, {
    read: () => live,
    copy: en,
    locale: "en",
    phase: async (note, ms) => {
      phases.push(note);
      waited += ms;
    },
  });
  if (outcome.patch) {
    live = sessionReducer(
      live,
      outcome.commits
        ? { type: "commit", patch: outcome.patch, by: "agent" }
        : { type: "patch", patch: outcome.patch },
    );
  }
  return { outcome, next: live, phases, waited };
}

const result = (outcome: ToolOutcome) =>
  outcome.result as Record<string, unknown>;
const refusal = (outcome: ToolOutcome) => result(outcome).refused;
const focuses = (outcome: ToolOutcome) =>
  (outcome.effects ?? []).filter(
    (effect): effect is Extract<SessionEffect, { kind: "focus" }> =>
      effect.kind === "focus",
  );
const toast = (outcome: ToolOutcome) =>
  (outcome.effects ?? []).find(
    (effect): effect is Extract<SessionEffect, { kind: "toast" }> =>
      effect.kind === "toast",
  );

/** Chapter one with the LED seated, which puts both of its legs on the bench. */
const withLed = async () =>
  (
    await call(open(), "attach_lead", {
      lead: "led.cathode",
      target: "board.GND",
    })
  ).next;

describe("point_at on a part", () => {
  it("frames a part that is on the bench, at a spotlight's zoom", async () => {
    const seated = await withLed();
    const { outcome, next, phases } = await call(seated, "point_at", {
      target: "led",
    });

    expect(outcome.status).toBe("ok");
    expect(result(outcome)).toMatchObject({
      target: "led",
      kind: "part",
      where: "bench",
      label: en.build.parts.led,
      changed: true,
    });
    expect(result(outcome).nodes).toContain("led.cathode");

    /* One focus, framing the part in its surroundings — not `PIN_FOCUS`'s
       2.9, which is a correction's zoom onto one pin. */
    expect(focuses(outcome)).toEqual([
      { kind: "focus", nodes: result(outcome).nodes, padding: 110, scale: 1.6 },
    ]);
    expect(toast(outcome)).toEqual({
      kind: "toast",
      tone: "info",
      message: en.workbench.pointedAt(en.build.parts.led),
    });
    expect(phases.map((p) => p.k)).toEqual(["pointing"]);

    /* The spotlight, and nothing else: no commit, no undo entry, the bench
       exactly as it was. */
    expect(next.pointedAt).toMatchObject({
      target: "led",
      kind: "part",
      where: "bench",
      part: "led",
      label: en.build.parts.led,
    });
    expect(outcome.commits).toBeUndefined();
    expect(next.history.past).toEqual(seated.history.past);
    expect(next.placement).toBe(seated.placement);
  });

  it("says a part is still in the kit, and does not move the camera", async () => {
    const { outcome, next } = await call(open(), "point_at", {
      target: "resistor",
    });

    expect(outcome.status).toBe("ok");
    expect(result(outcome)).toMatchObject({
      kind: "part",
      where: "kit",
      nodes: [],
      label: en.build.parts.resistor,
    });
    expect(focuses(outcome)).toEqual([]);
    expect(toast(outcome)?.message).toBe(
      en.workbench.pointedAtKit(en.build.parts.resistor),
    );
    expect(outcome.outcome?.k).toBe("pointedAtKit");
    /* Nothing to frame, so the shelf tile is what the mark has to ring. */
    expect(next.pointedAt).toMatchObject({ where: "kit", part: "resistor" });
  });

  it("names a lead by its own name, and knows which part it belongs to", async () => {
    const { outcome, next } = await call(open(), "point_at", {
      target: "led.cathode",
    });

    expect(result(outcome)).toMatchObject({
      kind: "lead",
      where: "kit",
      label: en.build.leads["led.cathode"],
    });
    expect(next.pointedAt?.part).toBe("led");

    /* §14 · the timeline's copy of the name is a `Ref`, so it re-translates. */
    expect(say(tr, outcome.outcome!)).toContain(tr.build.leads["led.cathode"]);
    expect(say(tr, outcome.outcome!)).not.toContain(
      en.build.leads["led.cathode"],
    );
  });
});

describe("point_at on the board", () => {
  it("takes a pin's printed name, whatever its case", async () => {
    const { outcome } = await call(open(), "point_at", { target: "d9" });

    expect(result(outcome)).toMatchObject({
      kind: "pin",
      where: "bench",
      nodes: ["board.D9"],
      label: "D9",
    });
    expect(focuses(outcome)[0]).toMatchObject({ scale: 1.6 });

    const { outcome: ground } = await call(open(), "point_at", {
      target: "GND",
    });
    expect(result(ground).nodes).toEqual(["board.GND"]);
  });

  it("takes a pin's id", async () => {
    const { outcome } = await call(initialSession(barrier), "point_at", {
      target: "board.D7",
    });
    expect(result(outcome)).toMatchObject({
      kind: "pin",
      nodes: ["board.D7"],
      label: "D7",
    });
  });

  it("takes a breadboard hole by its id and by what it prints", async () => {
    const light = initialSession(builds.trafficLight!);
    const hole = schemaFactsFor("trafficLight")!.holes.find((id) =>
      id.startsWith("bb."),
    )!;
    const { outcome } = await call(light, "point_at", { target: hole });
    expect(result(outcome)).toMatchObject({
      kind: "hole",
      where: "bench",
      nodes: [hole],
    });

    const printed = maybeNode(light.scene, hole)!.label!;
    const { outcome: byLabel } = await call(light, "point_at", {
      target: printed.toLowerCase(),
    });
    expect(result(byLabel).nodes).toEqual([hole]);
  });

  /* The capstone is laid out by its author: there is no kit, so nothing is
     addressable as a part — but its terminals are nodes of its scene, and a
     person asking where Echo is deserves an answer there too. */
  it("on the capstone, a terminal is a lead on the bench and a part is not a name", async () => {
    const { outcome } = await call(initialSession(barrier), "point_at", {
      target: "sensor.echo",
    });
    expect(result(outcome)).toMatchObject({
      kind: "lead",
      where: "bench",
      nodes: ["sensor.echo"],
      label: en.build.leads["sensor.echo"],
    });
    expect(result(outcome)).not.toHaveProperty("part");

    const { outcome: part } = await call(initialSession(barrier), "point_at", {
      target: "sensor",
    });
    expect(refusal(part)).toBe("unknownSubject");
  });
});

describe("point_at on a connection", () => {
  it("frames both ends, fitting rather than zooming", async () => {
    const { outcome } = await call(initialSession(barrier), "point_at", {
      target: "c.sensor.echo",
    });

    expect(result(outcome)).toMatchObject({
      kind: "connection",
      where: "bench",
      nodes: ["sensor.echo", "board.D7"],
      label: "Sensor's Echo lead → D7",
    });
    const [focus] = focuses(outcome);
    expect(focus).toMatchObject({
      nodes: ["sensor.echo", "board.D7"],
      padding: 90,
    });
    expect(focus).not.toHaveProperty("scale");
  });

  it("a join between two parts still in the box is in the kit", async () => {
    const { outcome, next } = await call(open(), "point_at", {
      target: "bl.c.anode",
    });
    expect(result(outcome)).toMatchObject({ where: "kit", nodes: [] });
    expect(focuses(outcome)).toEqual([]);
    expect(next.pointedAt?.part).toBe("led");
  });

  it("a join whose two ends stand in one place is framed like a pin", async () => {
    const seated = await withLed();
    const join = seated.scene.expected.find(
      (c) =>
        [c.from, c.to].includes("led.cathode") &&
        [c.from, c.to].includes("board.GND"),
    );
    expect(join).toBeDefined();
    const { outcome } = await call(seated, "point_at", { target: join!.id });

    expect(result(outcome)).toMatchObject({ kind: "connection", where: "bench" });
    expect((result(outcome) as { nodes: string[] }).nodes).toHaveLength(2);
    /* Both ends on the bench, and a pitch apart: fitting that box would
       run the zoom to its limit. */
    const [focus] = focuses(outcome);
    expect(focus).toMatchObject({ scale: 1.6 });
  });

  it("a join with one end on the bench frames that end", async () => {
    const { outcome } = await call(await withLed(), "point_at", {
      target: "bl.c.pin",
    });
    expect(result(outcome)).toMatchObject({
      where: "bench",
      nodes: ["board.D9"],
    });
    /* One end on the bench is one pin, and one pin is framed like a pin:
       fitting it alone would run the zoom to its limit, which is the
       correction's framing and not this tool's. */
    const [focus] = focuses(outcome);
    expect(focus).toMatchObject({ nodes: ["board.D9"], scale: 1.6 });
  });
});

describe("point_at refuses a name this bench has not got", () => {
  it("with a sample of each family and the size of the set", async () => {
    const { outcome, next } = await call(open(), "point_at", {
      target: "nope",
    });

    expect(outcome.status).toBe("error");
    expect(refusal(outcome)).toBe("unknownSubject");
    expect(outcome.errorMessage?.k).toBe("unknownSubject");
    const body = result(outcome) as {
      argument: string;
      value: unknown;
      validSample: string[];
      count: number;
    };
    expect(body.argument).toBe("target");
    expect(body.value).toBe("nope");
    expect(body.validSample).toContain("led");
    expect(body.validSample).toContain("led.cathode");
    expect(body.validSample.some((id) => id.startsWith("board."))).toBe(true);
    expect(body.count).toBeGreaterThan(body.validSample.length);

    expect(outcome.patch).toBeUndefined();
    expect(outcome.effects).toBeUndefined();
    expect(next.pointedAt).toBeNull();
  });

  it("and a target that is not a string at all", async () => {
    for (const value of [42, null, undefined, ""]) {
      const { outcome } = await call(open(), "point_at", {
        target: value,
      } as unknown as ToolInputs["point_at"]);
      expect(outcome.status, String(value)).toBe("error");
      expect(refusal(outcome)).toBe("unknownSubject");
      expect(result(outcome).value).toBe(value ?? null);
    }
  });
});

describe("the spotlight is one mark, taken off by the next thing that moves", () => {
  it("a second call at the same place says nothing changed — even by another name", async () => {
    const { next: first } = await call(open(), "point_at", { target: "d9" });
    const { outcome, next } = await call(first, "point_at", {
      target: "board.D9",
    });

    expect(result(outcome).changed).toBe(false);
    expect(outcome.outcome).toEqual({ ns: "activity", k: "alreadyPointedAt" });
    /* The patch lands either way, the way `show_correction`'s does. */
    expect(next.pointedAt?.target).toBe("board.D9");
  });

  it("navigate_build_step clears it", async () => {
    const { next: pointed } = await call(open(), "point_at", {
      target: "resistor",
    });
    expect(pointed.pointedAt).not.toBeNull();
    const { next } = await call(pointed, "navigate_build_step", {
      step_id: "lampSeat",
    });
    expect(next.pointedAt).toBeNull();
  });

  it("a placement commit clears it", async () => {
    const { next: pointed } = await call(open(), "point_at", {
      target: "resistor",
    });
    const { patch } = placeIn(pointed, spec, "led.cathode", "board.GND");
    expect(patch.pointedAt).toBeNull();
    const next = sessionReducer(pointed, { type: "commit", patch });
    expect(next.pointedAt).toBeNull();
  });

  it("show_correction clears it: one mark at a time", async () => {
    const seat: AgentSessionState = { ...open(), activeStepId: "lampSeat" };
    const { next: found } = await call(seat, "inspect_build", { scope: "all" });
    const { next: pointed } = await call(found, "point_at", { target: "led" });
    expect(pointed.pointedAt).not.toBeNull();

    const { next } = await call(pointed, "show_correction", {
      finding_id: found.findings[0]!.id,
    });
    expect(next.highlightedFindingId).toBe(found.findings[0]!.id);
    expect(next.pointedAt).toBeNull();
  });

  it("undo clears it, and redo does not bring it back", async () => {
    const { next: pointed } = await call(await withLed(), "point_at", {
      target: "led",
    });
    const undone = sessionReducer(pointed, { type: "undo" });
    expect(undone.placement["led.cathode"]).toBeNull();
    expect(undone.pointedAt).toBeNull();
    expect(sessionReducer(undone, { type: "redo" }).pointedAt).toBeNull();
  });
});

describe("the timeline names the subject before the call lands", () => {
  it("through a Ref, so the row re-translates", () => {
    const line = headlineFor("point_at", { target: "resistor" }, open());
    /* `res.out`, not `res.in`: a part is named through its first lead in the
       spec's priority order, which is the one that anchors it. Either lead
       names the same part; the point is that it is a `Ref`. */
    expect(line).toEqual({
      ns: "activity",
      k: "pointing",
      args: [{ ref: "part", lead: "res.out" }],
    });
    expect(say(en, line)).toContain(en.build.parts.resistor);
    expect(say(tr, line)).toContain(tr.build.parts.resistor);
    expect(say(tr, line)).not.toContain(en.build.parts.resistor);
  });

  it("falls back to the name as typed, and never throws", () => {
    expect(headlineFor("point_at", { target: "nope" }, open())).toEqual({
      ns: "activity",
      k: "pointing",
      args: ["nope"],
    });
    for (const target of [undefined, 42, ""]) {
      expect(
        headlineFor(
          "point_at",
          { target } as unknown as ToolInputs["point_at"],
          open(),
        ),
      ).toEqual({ ns: "activity", k: "calledTool" });
    }
  });
});

/**
 * A lead that can never land is refused before the ring leaves.
 *
 * The five bench refusals are decided by the model, not by the wait, and they
 * used to be asked only after `reaching` and `carrying` — 1253 ms to a
 * `holeTaken` in a real Chrome, with the ring performing the whole carry for
 * a lead that was never going to land. The dry run answers them on the state
 * read at the top; the post-phase ask stays for a bench that moved meanwhile.
 */
describe("attach_lead refuses before it reaches, when it can", () => {
  it("a taken hole settles with no phase, no wait, no commit and no undo entry", async () => {
    const seated = await withLed();
    const { outcome, next, phases, waited } = await call(seated, "attach_lead", {
      lead: "led.anode",
      target: "board.GND",
    });

    expect(outcome.status).toBe("error");
    expect(refusal(outcome)).toBe("holeTaken");
    expect(result(outcome).occupant).toBe("led.cathode");
    expect(phases).toEqual([]);
    expect(waited).toBe(0);

    expect(outcome.patch).toBeUndefined();
    expect(outcome.commits).toBeUndefined();
    expect(next.history.past).toEqual(seated.history.past);
    expect(next.assistedEdits).toBe(seated.assistedEdits);
    expect(next.placement).toBe(seated.placement);
  });

  it("so does a seat the lead is already in", async () => {
    const { outcome, phases } = await call(open(), "attach_lead", {
      lead: "led.cathode",
      target: null,
    });
    expect(refusal(outcome)).toBe("leadAlreadyThere");
    expect(phases).toEqual([]);
  });

  it("while a lead that can land still waits out both beats", async () => {
    const { outcome, phases, waited } = await call(open(), "attach_lead", {
      lead: "led.cathode",
      target: "board.GND",
    });
    expect(outcome.commits).toBe(true);
    expect(phases.map((p) => p.k)).toEqual(["reaching", "carrying"]);
    expect(waited).toBeGreaterThan(0);
  });
});
