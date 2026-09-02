import { describe, expect, it } from "vitest";
import { barrierAssembly } from "@/lib/circuit/barrier-assembly";
import { builds } from "@/lib/agent/builds";

/**
 * Chapter six's film names wires by id, and a wrong id draws nothing.
 *
 * The player looks a `trace` up among the scene's connections and pulses the
 * one it finds; a name no connection owns is not an error anywhere — the frame
 * simply plays without a pulse, which reads as a film that has stopped
 * working rather than as a typo. The other chapters are protected from this by
 * their assembly literals being written out of `<build>Complete`, so a bad key
 * is a type error. This film carries no placement at all (the build has none),
 * so its ids are strings and this is the only thing standing under them.
 *
 * The scene asserted against is the one the briefing actually draws: the
 * build's `reference`, the corrected machine — not the bench's opening scene,
 * where Echo is in the wrong hole.
 */
describe("chapter six's briefing film", () => {
  const reference = builds.smartParkingBarrier!.reference;

  it("traces a connection the reference build actually has", () => {
    const ids = new Set(reference.expected.map((c) => c.id));
    const traced = barrierAssembly
      .map((beat) => beat.trace)
      .filter((id): id is string => Boolean(id));

    expect(traced.length).toBe(5);
    for (const id of traced) expect(ids).toContain(id);
  });

  it("runs forwards, one beat at a time", () => {
    const times = barrierAssembly.map((beat) => beat.atMs);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
    expect(times[0]).toBe(0);
  });

  it("names each beat once", () => {
    const ids = barrierAssembly.map((beat) => beat.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * The empty placement is deliberate — `barrier-assembly.ts` says why — and
   * this is what would notice somebody "fixing" it with a literal copied from
   * another chapter, which would then be a placement this build cannot draw.
   */
  it("carries no placement, because this build has none", () => {
    for (const beat of barrierAssembly) {
      expect(Object.keys(beat.placement)).toHaveLength(0);
    }
    expect(builds.smartParkingBarrier!.placement).toBeUndefined();
  });
});
