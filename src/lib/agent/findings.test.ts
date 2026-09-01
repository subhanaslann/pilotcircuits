import { describe, expect, it } from "vitest";
import { deriveFindings, isResolved, verifyStep } from "@/lib/agent/findings";
import {
  lampAtRest,
  lampComplete,
  lampEmpty,
  lampPlacement,
  lampSceneFrom,
} from "@/lib/circuit/breathing-lamp";
import { prune, tryAttach, type Placement } from "@/lib/circuit/placement";

const spec = lampPlacement;

const seat = (p: Placement, terminal: string, target: string | null) => {
  const r = tryAttach(spec, p, terminal, target);
  return prune(spec, r.kind === "attached" ? r.placement : p);
};

const sceneOf = (p: Placement) => lampSceneFrom(p, lampAtRest);
const NOW = 1_700_000_000_000;

describe("a part still in the kit", () => {
  /**
   * The complaint this closes.
   *
   * On step two with the LED in the box, `inspect_build` said **"Nothing to
   * correct in this step"** and flipped the pinned action to *Verify* — and
   * `verify_current_step`, which has no on-bench guard, then refused the same
   * step with "1 issue still open" and named nothing. The panel could not see
   * the single most important thing about the bench.
   */
  it("is a finding, not a silence", () => {
    const found = deriveFindings(
      sceneOf(lampEmpty),
      "current_step",
      "lampSeat",
      NOW,
    );
    expect(found).toHaveLength(1);
    expect(found[0].type).toBe("part-not-placed");
    expect(found[0]).toMatchObject({ component: "led" });
  });

  it("is one finding per part, not one per lead", () => {
    /* Step three names both of the resistor's leads. */
    const found = deriveFindings(
      sceneOf(seat(lampEmpty, "led.cathode", "board.GND")),
      "current_step",
      "lampResistor",
      NOW,
    );
    const parts = found.filter((f) => f.type === "part-not-placed");
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ component: "resistor" });
  });

  it("closes by itself the moment the part reaches the bench", () => {
    const [finding] = deriveFindings(
      sceneOf(lampEmpty),
      "current_step",
      "lampSeat",
      NOW,
    );
    expect(isResolved(finding, sceneOf(lampEmpty))).toBe(false);
    expect(
      isResolved(finding, sceneOf(seat(lampEmpty, "led.cathode", "board.D5"))),
    ).toBe(true);
  });

  it("does not appear once every part the step names is placed", () => {
    const found = deriveFindings(
      sceneOf(seat(lampEmpty, "led.cathode", "board.D5")),
      "current_step",
      "lampSeat",
      NOW,
    );
    expect(found.some((f) => f.type === "part-not-placed")).toBe(false);
    /* And the real fault is reported instead. */
    expect(found.map((f) => f.type)).toContain("connection-mismatch");
  });

  it("agrees with the verify that follows it", () => {
    /* The two tools used to contradict each other on exactly this bench. */
    const scene = sceneOf(lampEmpty);
    const found = deriveFindings(scene, "current_step", "lampSeat", NOW);
    const report = verifyStep(scene, "lampSeat");
    expect(report.verified).toBe(false);
    expect(found.length).toBeGreaterThan(0);
  });
});

describe("the finished lamp", () => {
  it("has nothing to report on any step", () => {
    const scene = sceneOf(lampComplete);
    for (const stepId of ["lampSeat", "lampResistor"] as const) {
      expect(deriveFindings(scene, "current_step", stepId, NOW), stepId).toEqual(
        [],
      );
      expect(verifyStep(scene, stepId).verified, stepId).toBe(true);
    }
  });

  it("a whole-build inspection is clean too", () => {
    expect(deriveFindings(sceneOf(lampComplete), "all", "lampSeat", NOW)).toEqual(
      [],
    );
  });
});

describe("the mistakes the chapter is about", () => {
  const cathodeInGnd = seat(lampEmpty, "led.cathode", "board.GND");

  it("both legs in the header is one stray, not two mismatches", () => {
    const scene = sceneOf(seat(cathodeInGnd, "led.anode", "board.D13"));
    const found = deriveFindings(scene, "all", "lampResistor", NOW);
    const strays = found.filter((f) => f.type === "unexpected-connection");
    expect(strays).toHaveLength(1);
  });

  it("a stray closes when the lead is pulled loose, and not before", () => {
    const wrong = seat(cathodeInGnd, "led.anode", "board.D13");
    const [stray] = deriveFindings(sceneOf(wrong), "all", "lampResistor", NOW)
      .filter((f) => f.type === "unexpected-connection");
    expect(isResolved(stray, sceneOf(wrong))).toBe(false);
    /* Moved to a different wrong hole: still the same join, still open. */
    expect(
      isResolved(stray, sceneOf(seat(wrong, "led.anode", "board.D11"))),
    ).toBe(false);
    expect(isResolved(stray, sceneOf(seat(wrong, "led.anode", null)))).toBe(
      true,
    );
  });

  it("a step cannot verify with a stray touching it", () => {
    const scene = sceneOf(seat(cathodeInGnd, "led.anode", "board.D13"));
    expect(verifyStep(scene, "lampSeat").verified).toBe(false);
  });
});
