import { describe, expect, it } from "vitest";
import {
  deriveFindings,
  findingWords,
  isResolved,
  verifyStep,
  type Finding,
} from "@/lib/agent/findings";
import {
  lampAtRest,
  lampComplete,
  lampEmpty,
  lampPlacement,
  lampSceneFrom,
} from "@/lib/circuit/breathing-lamp";
import { prune, tryAttach, type Placement } from "@/lib/circuit/placement";
import { builds } from "@/lib/agent/builds";
import { stepById, stepOwning, type StepId } from "@/lib/agent/steps";
import type { CircuitScene } from "@/lib/circuit/graph";
import { en } from "@/content/locales/en";
import { tr } from "@/content/locales/tr";
import type { Copy } from "@/content/i18n";

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

/* --- Every chapter's words, in both languages ----------------------------
   The three defects this block is the tripwire for were all invisible to the
   suite above, which is chapter one only and asserts about findings rather
   than about the sentences a finding turns into:

     - one chapter's hardware printed on another's: `findings.explain` was the
       capstone's ultrasonic-Echo line on all 81 joins in all six chapters, and
       the default `hint` sent every one of them to "the highlighted digital-pin
       row", including chapter four's `A0`;
     - a rung with a hole in it: `exact` was handed `observed ?? ""`, so a lead
       standing in no hole read "Move the black − wire from  to F9.";
     - a graph address on screen: `wire.gnd.pin` in the sentence, in the chip
       and in the chip's accessible name.

   Everything below runs over EVERY build in the registry and over BOTH
   locales, because each of the three was found in a chapter nobody was looking
   at and in the language nobody was reading. */

const LOCALES: [string, Copy][] = [
  ["en", en],
  ["tr", tr],
];

const rows = Object.entries(builds).map(([id, build]) => [id, build!] as const);

/** Every string a person can read off one finding, including the chips. */
function everyString(copy: Copy, finding: Finding): string[] {
  const words = findingWords(copy, finding);
  return [
    words.title,
    words.explanation,
    words.expected,
    words.observed,
    words.evidenceLabel,
    words.coaching.hint,
    words.coaching.explain,
    words.coaching.exact,
    words.actions.show,
    words.actions.check,
    ...Object.keys(words.mono),
    ...words.nodes.flatMap((node) => [node.part, node.terminal]),
  ];
}

/**
 * A bench with every part on it and nothing wired.
 *
 * `diff` enumerates `expected`, so emptying `observed` turns every one of a
 * build's joins into a `missing-connection` at once — which is how all 81 get
 * looked at without driving 81 gestures. Every node exists, because the scene
 * is the finished one, so nothing degrades into `part-not-placed` and the
 * wiring sentences are the ones under test.
 */
const nothingWired = (scene: CircuitScene): CircuitScene => ({
  ...scene,
  observed: [],
});

/** The same bench with every lead one join along: every join misplaced. */
function everythingShifted(scene: CircuitScene): CircuitScene {
  const targets = scene.expected.map((c) => c.to);
  return {
    ...scene,
    observed: scene.expected.map((c, i) => ({
      ...c,
      to: targets[(i + 1) % targets.length],
    })),
  };
}

function wiringFindingsOf(scene: CircuitScene, stepId: StepId): Finding[] {
  return deriveFindings(scene, "all", stepId, NOW).filter(
    (f) => f.type === "connection-mismatch" || f.type === "missing-connection",
  );
}

describe("no chapter's sentences print another chapter's hardware", () => {
  /* The capstone's sentence, and the words it was made of. Chapter five has an
     Echo lead of its own, so it is exempt; the first four chapters contain no
     ultrasonic sensor of any kind, and a sentence naming one there describes a
     part that is not in the box. */
  const NOT_HERE = /echo|pulse|ultrason|darbe/i;
  const withoutASensor = [
    "breathingLamp",
    "trafficLight",
    "motionNightLight",
    "plantGuardian",
  ];

  it.each(rows.filter(([id]) => withoutASensor.includes(id)))(
    "%s says nothing about an ultrasonic sensor",
    (id, build) => {
      for (const [locale, copy] of LOCALES) {
        for (const scene of [
          nothingWired(build.reference),
          everythingShifted(build.reference),
        ]) {
          for (const finding of wiringFindingsOf(scene, build.activeStepId)) {
            for (const line of everyString(copy, finding)) {
              expect(line, `${id} ${locale} ${finding.id}`).not.toMatch(
                NOT_HERE,
              );
            }
          }
        }
      }
    },
  );

  it("no chapter is sent to the board's header for a hole", () => {
    for (const [id, build] of rows) {
      for (const [locale, copy] of LOCALES) {
        const scene = nothingWired(build.reference);
        for (const finding of wiringFindingsOf(scene, build.activeStepId)) {
          if (finding.type !== "missing-connection") continue;
          const { hint } = findingWords(copy, finding).coaching;
          /* The header is named only where the sketch actually wants the lead.
             Everything else is a hole, a rail, a supply pin or a leg. */
          const namesTheHeader = /header|kartın üstünde/.test(hint);
          expect(
            namesTheHeader,
            `${id} ${locale} ${finding.id} → ${finding.targetKind}: ${hint}`,
          ).toBe(finding.targetKind === "digital-pin");
        }
      }
    }
  });

  it("chapter four's analog hole is taught as an analog hole", () => {
    const build = builds.plantGuardian!;
    const scene = nothingWired(build.reference);
    const a0 = wiringFindingsOf(scene, build.activeStepId).find(
      (f) => f.type === "missing-connection" && f.expectedTerminal === "A0",
    );
    expect(a0).toBeDefined();
    expect(findingWords(en, a0!).coaching.explain).toContain("marked A");
    expect(findingWords(tr, a0!).coaching.explain).toContain("A harfiyle");
  });

  it("chapter one is never told to move a wire", () => {
    const build = builds.breathingLamp!;
    for (const scene of [
      nothingWired(build.reference),
      everythingShifted(build.reference),
    ]) {
      for (const finding of wiringFindingsOf(scene, build.activeStepId)) {
        /* Its joins are the LED's and the resistor's own legs; the chapter
           contains no cable at all, and its own kit list says so. */
        expect(findingWords(en, finding).coaching.exact).not.toMatch(/\bwire\b/);
        expect(findingWords(tr, finding).coaching.exact).not.toMatch(
          /\bkablo\b/,
        );
      }
    }
  });
});

describe("no rung ever renders an empty clause", () => {
  it.each(rows)("%s, every join, both locales", (id, build) => {
    for (const [locale, copy] of LOCALES) {
      for (const scene of [
        nothingWired(build.reference),
        everythingShifted(build.reference),
        /* And the opening bench, which is where `part-not-placed` lives. */
        build.scene,
      ]) {
        const found = deriveFindings(scene, "all", build.activeStepId, NOW);
        for (const finding of found) {
          for (const line of everyString(copy, finding)) {
            const where = `${id} ${locale} ${finding.id}: ${JSON.stringify(line)}`;
            expect(line, where).not.toBe("");
            expect(line, where).toBe(line.trim());
            /* `from  to` — the shape of a template handed an empty argument. */
            expect(line, where).not.toMatch(/ {2}/);
            expect(line, where).not.toMatch(/\s[.,:]/);
          }
        }
      }
    }
  });
});

describe("no graph address reaches a person", () => {
  /**
   * `wire.gnd.pin`, `bb.f7`, `board.GND` — an id is two words joined by a dot
   * with no space around it, and nothing this product prints looks like that.
   * The chips are covered too, because that is exactly where `bb.f7` survived
   * after being fixed in the canvas callout once already.
   */
  const GRAPH_ID = /[A-Za-z0-9]\.[A-Za-z0-9]/;

  it.each(rows)("%s, every finding, both locales", (id, build) => {
    for (const [locale, copy] of LOCALES) {
      for (const scene of [
        nothingWired(build.reference),
        everythingShifted(build.reference),
        build.scene,
      ]) {
        const found = deriveFindings(scene, "all", build.activeStepId, NOW);
        for (const finding of found) {
          for (const line of everyString(copy, finding)) {
            expect(line, `${id} ${locale} ${finding.id}`).not.toMatch(GRAPH_ID);
          }
        }
      }
    }
  });
});

describe("a part still in the kit is filed against the step that needs it", () => {
  /**
   * It was filed against the step you were STANDING on — `missingPartFinding`
   * took `activeStepId` where `wiringFinding` asks `owningStepId`. Two
   * consequences, and the second is the one that hid the first: the rail put an
   * amber tick on the wrong row, and `inspectionCovers` counted these inside
   * `current_step` and then filtered them straight back out again.
   */
  it.each(rows)("%s", (id, build) => {
    const found = deriveFindings(build.scene, "all", build.activeStepId, NOW);
    for (const finding of found) {
      if (finding.type !== "part-not-placed") continue;
      /* Which steps ask for this lead, according to the sketch alone. */
      const owners = new Set(
        build.reference.expected
          .filter(
            (c) => c.from === finding.terminal || c.to === finding.terminal,
          )
          .map((c) => stepOwning(c.id)?.id)
          .filter(Boolean),
      );
      if (owners.size === 0) continue;
      expect(
        [...owners],
        `${id} ${finding.id} filed against ${finding.stepId}`,
      ).toContain(finding.stepId);
      /* And the step it names is a real one. */
      expect(() => stepById(finding.stepId)).not.toThrow();
    }
  });

  it("chapter two blames each lamp's own step, not the step you are on", () => {
    const build = builds.trafficLight!;
    const kits = deriveFindings(
      build.scene,
      "all",
      build.activeStepId,
      NOW,
    ).filter((f) => f.type === "part-not-placed");
    expect(kits.length).toBeGreaterThan(1);
    /* Ten parts across four wiring steps. Stamped with the active step, this
       set had exactly one member. */
    expect(new Set(kits.map((f) => f.stepId)).size).toBeGreaterThan(1);
  });
});
