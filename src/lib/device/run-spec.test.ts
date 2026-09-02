import { describe, expect, it } from "vitest";
import { builds } from "@/lib/agent/builds";
import type { CircuitScene } from "@/lib/circuit/graph";
import { attach } from "@/lib/circuit/placement";
import {
  smartParkingBarrier,
  withEchoFixed,
  withServoRemounted,
} from "@/lib/circuit/smart-parking-barrier";
import type { RunSpec, StagePatch } from "@/lib/device/run-spec";

/**
 * The bench may only show what is true of the build it is standing on — and
 * for one day it did not. Every lesson row read one line (the drive pin, the
 * sensor's OUT) and every "on" frame followed the row, so a lamp with its
 * cathode in the air was drawn breathing, a servo with its 5 V lead in the box
 * swung to 90°, and the night-light film played on a bench that had shorted
 * 5 V to GND. The readers also asked the finished build's hole rather than the
 * part's own lead, so a cable in column 29 answered for a sensor whose OUT lead
 * was in the box. Measured across all five chapters in
 * `.audit/hackathon/r4/functional.before.txt`; these pin the truth.
 */

type Chapter = Exclude<keyof typeof builds, "smartParkingBarrier">;

const build = (id: Chapter) => {
  const b = builds[id]!;
  const spec = b.placement!;
  return { run: b.run, spec, mechanical: b.scene.mechanical };
};

/** The finished build. */
const complete = (id: Chapter): CircuitScene => {
  const { spec, mechanical } = build(id);
  return spec.sceneFrom(spec.complete, mechanical);
};

/** The finished build with one lead pulled into the box. */
const pulled = (id: Chapter, terminal: string): CircuitScene => {
  const { spec, mechanical } = build(id);
  return spec.sceneFrom(attach(spec, spec.complete, terminal, null), mechanical);
};

/** The finished build with one lead moved to another hole. */
const moved = (id: Chapter, terminal: string, target: string): CircuitScene => {
  const { spec, mechanical } = build(id);
  return spec.sceneFrom(attach(spec, spec.complete, terminal, target), mechanical);
};

const rows = (run: RunSpec, scene: CircuitScene) =>
  Object.fromEntries(run.checks.map((c) => [c.id, c.passes(scene)]));

const isOn = (patch: StagePatch) =>
  patch.lit === true ||
  patch.breathing === true ||
  (patch.lamps !== undefined && Object.values(patch.lamps).some(Boolean)) ||
  patch.hornAngle === 90 ||
  patch.sensing === true;

/** The frames on which the bench shows something working. */
const onFrames = (run: RunSpec, scene: CircuitScene) =>
  run.beats
    .map((beat) => beat.stage?.(scene))
    .filter((patch): patch is StagePatch => patch !== undefined)
    .filter(isOn);

const serialAt = (run: RunSpec, scene: CircuitScene, at: number) => {
  const beat = run.beats.find((b) => b.at === at);
  return typeof beat?.serial === "function" ? beat.serial(scene) : beat?.serial;
};

describe("chapter one — the breathing lamp", () => {
  const { run } = build("breathingLamp");

  it("passes and breathes on the finished build", () => {
    expect(rows(run, complete("breathingLamp"))).toEqual({
      wiring: true,
      breathing: true,
    });
    expect(onFrames(run, complete("breathingLamp")).length).toBeGreaterThan(0);
  });

  it("a lamp with its cathode in the air neither passes nor lights", () => {
    const scene = pulled("breathingLamp", "led.cathode");
    expect(rows(run, scene).breathing).toBe(false);
    expect(onFrames(run, scene)).toEqual([]);
  });

  it("keeps its own lesson: the drive lead on a ~ pin still breathes, wired or not", () => {
    /* `pwmPins` says why: the chapter asks whether the lamp CAN breathe, for
       every one of the fifteen holes, and `wiring` is the row that says D9. */
    const onD3 = moved("breathingLamp", "res.out", "board.D3");
    expect(rows(run, onD3)).toEqual({ wiring: false, breathing: true });
    const onD8 = moved("breathingLamp", "res.out", "board.D8");
    expect(rows(run, onD8)).toEqual({ wiring: false, breathing: false });
    /* Lit and still on D8 — the chapter's picture of a blink. */
    expect(onFrames(run, onD8).some((patch) => patch.lit === true)).toBe(true);
  });
});

describe("chapter two — the traffic light", () => {
  const { run } = build("trafficLight");

  it("no ground, no lights", () => {
    const scene = pulled("trafficLight", "wire.gnd.pin");
    expect(rows(run, scene)).toEqual({ wiring: false, sequence: false });
    expect(onFrames(run, scene)).toEqual([]);
  });

  it("the red lamp's own leg in the box is not a red lamp, whatever its cable reaches", () => {
    const scene = pulled("trafficLight", "led.red.anode");
    expect(rows(run, scene).sequence).toBe(false);
    expect(onFrames(run, scene)).toEqual([]);
  });

  it("the finished build lights all three in turn", () => {
    const lit = onFrames(run, complete("trafficLight")).map((p) => p.lamps);
    expect(lit).toContainEqual({ red: true, yellow: false, green: false });
    expect(lit).toContainEqual({ red: false, yellow: false, green: true });
    expect(lit).toContainEqual({ red: false, yellow: true, green: false });
  });
});

describe("chapter three — the motion night light", () => {
  const { run } = build("motionNightLight");

  it("the sensor's OUT lead in the box: no sense, no HIGH, no lamp line", () => {
    const scene = pulled("motionNightLight", "pir.out");
    expect(rows(run, scene).senses).toBe(false);
    expect(onFrames(run, scene)).toEqual([]);
    expect(serialAt(run, scene, 1800)).toBe("PIR: LOW");
    expect(serialAt(run, scene, 2600)).toBeUndefined();
  });

  it("OUT seated across the channel is the board's most common silent mistake", () => {
    const scene = moved("motionNightLight", "pir.out", "bb.f29");
    expect(rows(run, scene).senses).toBe(false);
    expect(onFrames(run, scene)).toEqual([]);
  });

  it("the finished build goes HIGH and prints the lamp on", () => {
    const scene = complete("motionNightLight");
    expect(rows(run, scene)).toEqual({ wiring: true, senses: true });
    expect(serialAt(run, scene, 1800)).toBe("PIR: HIGH");
    expect(serialAt(run, scene, 2600)).toBe("Lamp: ON");
  });
});

describe("chapter four — the plant guardian", () => {
  const { run } = build("plantGuardian");

  it("the probe's AOUT lead in the box reads nothing", () => {
    const scene = pulled("plantGuardian", "soil.aout");
    expect(rows(run, scene).reads).toBe(false);
    expect(onFrames(run, scene)).toEqual([]);
  });

  it("the finished build crosses the threshold", () => {
    expect(rows(run, complete("plantGuardian"))).toEqual({
      wiring: true,
      reads: true,
    });
    expect(onFrames(run, complete("plantGuardian")).length).toBeGreaterThan(0);
  });
});

describe("chapter five — the touchless soap dispenser", () => {
  const { run } = build("touchlessSoapDispenser");

  it("the servo's 5 V lead in the box: no sweep, no swing", () => {
    const scene = pulled("touchlessSoapDispenser", "servo.power");
    expect(rows(run, scene).sweep).toBe(false);
    expect(onFrames(run, scene).some((p) => p.hornAngle === 90)).toBe(false);
  });

  it("the echo lead in the box: the board measures 0 and never sees a hand", () => {
    const scene = pulled("touchlessSoapDispenser", "sensor.echo");
    expect(rows(run, scene).distance).toBe(false);
    expect(serialAt(run, scene, 700)).toBe("Distance: 0 cm");
    expect(serialAt(run, scene, 2700)).toBeUndefined();
  });

  it("the finished build measures and pumps", () => {
    const scene = complete("touchlessSoapDispenser");
    expect(rows(run, scene)).toEqual({
      wiring: true,
      distance: true,
      sweep: true,
    });
    expect(serialAt(run, scene, 700)).toMatch(/^Distance: [1-9]\d* cm/);
    expect(serialAt(run, scene, 2700)).toBe("Hand: near — pump on");
  });
});

describe("chapter six — the capstone", () => {
  const { run } = builds.smartParkingBarrier!;
  const base = withServoRemounted(withEchoFixed(smartParkingBarrier));
  const without = (id: string): CircuitScene => ({
    ...base,
    observed: base.observed.filter((c) => c.id !== id),
  });

  it("the red LED's wire pulled fails the wiring row and not the sensor's", () => {
    expect(rows(run, without("c.led.red"))).toMatchObject({
      wiring: false,
      sensor: true,
    });
  });

  it("the echo pulled fails the sensor's row", () => {
    expect(rows(run, without("c.sensor.echo"))).toMatchObject({
      wiring: false,
      sensor: false,
    });
  });

  it("the finished build passes every row", () => {
    expect(rows(run, base)).toEqual({
      wiring: true,
      sensor: true,
      servo: true,
      leds: true,
    });
  });
});
