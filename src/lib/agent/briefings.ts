import { getCopy, locales, type Copy } from "@/content/i18n";
import type { ComponentId, ProjectId } from "@/lib/projects/catalog";
import {
  lampComplete,
  lampEmpty,
  lampFitBox,
  lampPartBox,
  lampPartNumbers,
  lampSceneFrom,
} from "@/lib/circuit/breathing-lamp";
import { lampAssembly } from "@/lib/circuit/lamp-assembly";
import {
  lightComplete,
  lightEmpty,
  lightFitBox,
  lightPartBox,
  lightPartNumbers,
  lightSceneFrom,
} from "@/lib/circuit/traffic-light";
import { lightAssembly } from "@/lib/circuit/traffic-light-assembly";
import {
  nightComplete,
  nightEmpty,
  nightFitBox,
  nightPartBox,
  nightPartNumbers,
  nightSceneFrom,
} from "@/lib/circuit/motion-night-light";
import { nightAssembly } from "@/lib/circuit/motion-night-light-assembly";
import {
  plantComplete,
  plantEmpty,
  plantFitBox,
  plantPartBox,
  plantPartNumbers,
  plantSceneFrom,
} from "@/lib/circuit/plant-guardian";
import { plantAssembly } from "@/lib/circuit/plant-guardian-assembly";
import {
  soapComplete,
  soapEmpty,
  soapFitBox,
  soapPartBox,
  soapPartNumbers,
  soapSceneFrom,
} from "@/lib/circuit/touchless-soap";
import { soapAssembly } from "@/lib/circuit/touchless-soap-assembly";
import type { AssemblyBeat } from "@/lib/circuit/assembly";
import type { CircuitScene } from "@/lib/circuit/graph";
import type { Placement } from "@/lib/circuit/placement";
import type { MonoTone } from "@/lib/design/tokens";
import { builds } from "@/lib/agent/builds";

/**
 * Which chapters open with a briefing, and what is in it.
 *
 * A row per build, the same shape `builds.ts` uses for benches, and for the
 * same reason: a chapter with no row simply does not have one, so converting
 * the chapters one at a time is a matter of adding rows rather than of
 * remembering which screens to leave alone.
 *
 * **No words, and no drawings.** Both are named rather than carried — the copy
 * by `copyKey`, the framing by boxes the build itself already exports. A row
 * that held a scene would be a second answer to "what does the finished lamp
 * look like", and the compare view would be the first. `sceneFrom` is not that
 * second answer: it is the build's own function, handed over so the window can
 * draw a chapter without importing one by name, which is exactly what it did
 * until chapter two arrived.
 *
 * **An objection, recorded.** Nothing else in `lib/agent/` reads this file and
 * no tool touches it — §9 keeps a tool on a page that can honour it, and an
 * agent that could re-open the briefing would be an agent hiding the bench it
 * is pointing at. It lives here because it is the second per-chapter registry
 * and standing beside the first is worth more than the folder being tidy. If
 * that stops being true, `lib/workbench/` is where it belongs.
 */

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A chapter's own words, reached through the row rather than by key.
 *
 * A `copyKey` plus an index would need a cast at every lookup — the registry
 * speaks in six component ids and a chapter's copy names the three it uses —
 * and a cast is exactly how a missing entry becomes a crash at render instead
 * of an error at build. A getter is checked where it is written, once.
 * `camera.tsx` names its parts the same way.
 */
export interface BriefingWords {
  purpose: string;
  /**
   * One caption per beat of this chapter's film, keyed by the beat's own id.
   *
   * `Record<string, string>` rather than a closed union of beat ids, and the
   * loss is real: this was `Record<BeatId, string>`, total over chapter one's
   * six, so a beat nobody had written a caption for was a compile error. The
   * union cannot widen — every chapter's copy object would then owe captions
   * for every other chapter's beats, and adding a chapter would edit the
   * locale entry of every chapter before it (`assembly.ts` records the same
   * argument from the other side).
   *
   * What replaces it is the dev-only throw at the foot of this file, which
   * checks each row's own beats against each row's own captions in every
   * locale. **That throw is the whole guarantee.** Without it a chapter ships
   * with a blank line under its film and nothing anywhere fails.
   */
  assembly: Record<string, string>;
}

export interface BriefingPart {
  /** Which kit component this is — what the drawing and the kit list use. */
  id: ComponentId;
  /** What the stage frames while this part is the subject. */
  box: Box;
  /**
   * The bench with this part on it and nothing else.
   *
   * A close-up of the board with an LED and a resistor already standing in it
   * is a picture of the finished build, not of a board. Written down rather
   * than derived, because "which parts are on the bench while we talk about
   * this one" is an editorial decision and the next chapter may answer it
   * differently.
   *
   * Lead-keyed, and every one of these is spread from the build's own *empty*
   * placement. Spreading the complete one instead would carry chapter one's
   * middle join — or any of chapter two's twenty — into a frame whose other
   * part is still in the kit: an edge to a part that has no node, which the
   * scene drops silently rather than complaining about.
   */
  alone: Placement;
  words: (copy: Copy) => { name: string; note: string };
  /** Printed on the part itself, so never translated (rule 13). */
  number: string;
}

export interface BriefingDef {
  projectId: ProjectId;
  words: (copy: Copy) => BriefingWords;
  /** Introduced in this order, and they arrive in the assembly in it too. */
  parts: readonly BriefingPart[];
  /** What the assembly is framed on. */
  stageBox: Box;
  assembly: readonly AssemblyBeat[];
  /**
   * How a frame becomes a drawing — the build's own `sceneFrom`.
   *
   * Named here rather than imported by the window, because the window used to
   * import chapter one's by name and would have gone on drawing a breathing
   * lamp under chapter two's captions. The row already answers "which boxes",
   * "which beats" and "which words"; this is the same question about the
   * picture, and it is the build's own function, so a briefing frame and the
   * bench behind it cannot disagree about what a placement looks like.
   */
  sceneFrom: (placement: Placement) => CircuitScene;
  /**
   * The values printed on this chapter's hardware, wherever its own sentences
   * name them (rule 13).
   *
   * The two `Sentence` calls in the window carried these as literals — `{D9}`
   * under a part, `{GND, D9}` under the film — which is chapter one's board
   * spelled into a component that draws every chapter. A pin name is a fact
   * about the build, so it is written down beside the build's other facts and
   * a chapter that names different pins does not need the window edited.
   */
  mono: Record<string, MonoTone>;
}

export const briefings: Partial<Record<ProjectId, BriefingDef>> = {
  breathingLamp: {
    projectId: "breathingLamp",
    words: (copy) => copy.briefing.chapters.breathingLamp,
    parts: [
      {
        id: "board",
        box: lampPartBox.board,
        alone: lampEmpty,
        words: (copy) => copy.briefing.chapters.breathingLamp.parts.board,
        number: lampPartNumbers.board,
      },
      {
        id: "led",
        box: lampPartBox.led,
        /* The short leg in GND and the long one loose — the LED as step 2
           leaves it, which is also how the `seat` beat draws it. */
        alone: { ...lampEmpty, "led.cathode": lampComplete["led.cathode"] },
        words: (copy) => copy.briefing.chapters.breathingLamp.parts.led,
        number: lampPartNumbers.led,
      },
      {
        id: "resistor",
        box: lampPartBox.resistor,
        /* Board-side lead in D9, LED-side lead loose. The note under this frame
           says the LED's leg does not reach D9 and that you are the one who
           closes the gap; a frame that already showed the gap closed would be
           arguing with its own caption. */
        alone: { ...lampEmpty, "res.out": lampComplete["res.out"] },
        words: (copy) => copy.briefing.chapters.breathingLamp.parts.resistor,
        number: lampPartNumbers.resistor,
      },
    ],
    stageBox: lampFitBox,
    assembly: lampAssembly,
    sceneFrom: lampSceneFrom,
    /* Exactly the two the window used to carry as literals, so chapter one's
       five screens render character for character as they did. */
    mono: { GND: "default", D9: "default" },
  },

  trafficLight: {
    projectId: "trafficLight",
    words: (copy) => copy.briefing.chapters.trafficLight,
    /**
     * Four screens, and the jumper is not one of them.
     *
     * The list matches `catalog.trafficLight.components` exactly, because the
     * catalogue is the contract for what a chapter is made of — it is what the
     * project card counts and what the kit page lists, and a briefing that
     * introduced a fifth part would be the product disagreeing with its own
     * ladder. The cables are genuinely new here and they are genuinely
     * uncounted (`catalog.ts`: wire is how you work, not what you are working
     * on), so they arrive in the film instead, on the beat that is entirely
     * about one of them.
     */
    parts: [
      {
        id: "board",
        box: lightPartBox.board,
        alone: lightEmpty,
        words: (copy) => copy.briefing.chapters.trafficLight.parts.board,
        number: lightPartNumbers.board,
      },
      {
        id: "breadboard",
        box: lightPartBox.breadboard,
        /* Empty, and that is the picture: this screen's whole subject is the
           plastic and the holes in it. A board with parts already standing in
           it would be a photograph of the answer under a caption explaining
           what a column is. */
        alone: lightEmpty,
        words: (copy) => copy.briefing.chapters.trafficLight.parts.breadboard,
        number: lightPartNumbers.breadboard,
      },
      {
        id: "led",
        box: lightPartBox.ledRed,
        /* The red lamp's short leg in its column and the long one loose — one
           LED, standing where step three puts it, which is also the frame the
           `red` beat opens on. Read out of `lightComplete` rather than typed
           as `bb.f7`, so the hole is written down once (chapter one's rows do
           the same). */
        alone: {
          ...lightEmpty,
          "led.red.cathode": lightComplete["led.red.cathode"],
        },
        words: (copy) => copy.briefing.chapters.trafficLight.parts.led,
        number: lightPartNumbers.led,
      },
      {
        id: "resistor",
        box: lightPartBox.resRed,
        /* Lying in row J of the same column the LED's short leg is in — which
           is the fact this chapter exists to teach and the one the note under
           this frame argues. The LED is deliberately absent: with both parts
           drawn the picture answers "why does that work" before the sentence
           has asked it. */
        alone: { ...lightEmpty, "res.red.in": lightComplete["res.red.in"] },
        words: (copy) => copy.briefing.chapters.trafficLight.parts.resistor,
        number: lightPartNumbers.resistor,
      },
    ],
    stageBox: lightFitBox,
    assembly: lightAssembly,
    sceneFrom: lightSceneFrom,
    /* The ground pin, the three drive pins, and the value stamped on the
       resistor — every one of them printed on a part rather than written by
       us. `220Ω` is here because the resistor's own screen prints it twice:
       once as the part number beside the heading, once inside the note, and
       the same four characters set two different ways on one screen is the
       inconsistency this map exists to stop.

       Hole addresses stay prose. The captions never name one — the whole
       ground rail verifies, so the film says "the − rail" — and the bench's
       own `INSTRUCTION_MONO` is where the addresses that ARE named live. */
    mono: {
      GND: "default",
      D13: "default",
      D12: "default",
      D11: "default",
      "220Ω": "default",
    },
  },

  motionNightLight: {
    projectId: "motionNightLight",
    words: (copy) => copy.briefing.chapters.motionNightLight,
    /**
     * Five screens, and the list matches `catalog.motionNightLight.components`
     * exactly — the catalogue is the contract for what a chapter is made of,
     * and a briefing that introduced a sixth part would be the product
     * disagreeing with its own ladder. The four cables are uncounted, so they
     * arrive in the film instead, on the beat that is entirely about two of
     * them.
     */
    parts: [
      {
        id: "board",
        box: nightPartBox.board,
        alone: nightEmpty,
        words: (copy) => copy.briefing.chapters.motionNightLight.parts.board,
        number: nightPartNumbers.board,
      },
      {
        id: "breadboard",
        box: nightPartBox.breadboard,
        /* Empty, and that is the picture: this screen's subject is the plastic
           and the two rails down its edges. */
        alone: nightEmpty,
        words: (copy) =>
          copy.briefing.chapters.motionNightLight.parts.breadboard,
        number: nightPartNumbers.breadboard,
      },
      {
        id: "sensor",
        box: nightPartBox.pir,
        /* Its power lead alone, which is enough to bring the case onto the
           bench and not enough to show the circuit it is part of. The note
           beside this frame is about what is under the dome; a sensor already
           wired to a lamp would answer a question the screen has not asked. */
        alone: { ...nightEmpty, "pir.vcc": nightComplete["pir.vcc"] },
        words: (copy) => copy.briefing.chapters.motionNightLight.parts.sensor,
        number: nightPartNumbers.sensor,
      },
      {
        id: "led",
        box: nightPartBox.ledNight,
        /* The short leg in its column and the long one loose — the lamp as
           step four leaves it, read out of `nightComplete` rather than typed
           as a hole id. */
        alone: {
          ...nightEmpty,
          "led.night.cathode": nightComplete["led.night.cathode"],
        },
        words: (copy) => copy.briefing.chapters.motionNightLight.parts.led,
        number: nightPartNumbers.led,
      },
      {
        id: "resistor",
        box: nightPartBox.resNight,
        /* Lying in row J of the lamp's own column, with the lamp deliberately
           absent: with both parts drawn the picture answers "why does that
           work" before the sentence has asked it. */
        alone: { ...nightEmpty, "res.night.in": nightComplete["res.night.in"] },
        words: (copy) => copy.briefing.chapters.motionNightLight.parts.resistor,
        number: nightPartNumbers.resistor,
      },
    ],
    stageBox: nightFitBox,
    assembly: nightAssembly,
    sceneFrom: nightSceneFrom,
    /* The two supply pins, the two the sketch names, and the value stamped on
       the resistor — every one of them printed on a part rather than by us.
       Hole addresses stay prose: the captions never name one, because the whole
       rail verifies and the film says "the + rail". */
    mono: {
      "5V": "default",
      GND: "default",
      D2: "default",
      D13: "default",
      "220Ω": "default",
    },
  },

  plantGuardian: {
    projectId: "plantGuardian",
    words: (copy) => copy.briefing.chapters.plantGuardian,
    parts: [
      {
        id: "board",
        box: plantPartBox.board,
        alone: plantEmpty,
        words: (copy) => copy.briefing.chapters.plantGuardian.parts.board,
        number: plantPartNumbers.board,
      },
      {
        id: "breadboard",
        box: plantPartBox.breadboard,
        alone: plantEmpty,
        words: (copy) => copy.briefing.chapters.plantGuardian.parts.breadboard,
        number: plantPartNumbers.breadboard,
      },
      {
        id: "sensor",
        box: plantPartBox.probe,
        /* Its power lead alone: enough to bring the board onto the bench, and
           not enough to show the circuit it belongs to. */
        alone: { ...plantEmpty, "soil.vcc": plantComplete["soil.vcc"] },
        words: (copy) => copy.briefing.chapters.plantGuardian.parts.sensor,
        number: plantPartNumbers.sensor,
      },
      {
        id: "led",
        box: plantPartBox.ledPlant,
        alone: {
          ...plantEmpty,
          "led.plant.cathode": plantComplete["led.plant.cathode"],
        },
        words: (copy) => copy.briefing.chapters.plantGuardian.parts.led,
        number: plantPartNumbers.led,
      },
      {
        id: "resistor",
        box: plantPartBox.resPlant,
        alone: { ...plantEmpty, "res.plant.in": plantComplete["res.plant.in"] },
        words: (copy) => copy.briefing.chapters.plantGuardian.parts.resistor,
        number: plantPartNumbers.resistor,
      },
    ],
    stageBox: plantFitBox,
    assembly: plantAssembly,
    sceneFrom: plantSceneFrom,
    /* The two supply pins, the two the sketch names, and the value stamped on
       the resistor. `A0` earns its place here more than any of them: it is the
       one address in this chapter a person has never seen before. */
    mono: {
      "5V": "default",
      GND: "default",
      A0: "default",
      D9: "default",
      "220Ω": "default",
    },
  },

  touchlessSoapDispenser: {
    projectId: "touchlessSoapDispenser",
    words: (copy) => copy.briefing.chapters.touchlessSoapDispenser,
    /* Six screens — the first chapter whose card counts six components, and the
       list matches `catalog.touchlessSoapDispenser.components` exactly. */
    parts: [
      {
        id: "board",
        box: soapPartBox.board,
        alone: soapEmpty,
        words: (copy) =>
          copy.briefing.chapters.touchlessSoapDispenser.parts.board,
        number: soapPartNumbers.board,
      },
      {
        id: "breadboard",
        box: soapPartBox.breadboard,
        alone: soapEmpty,
        words: (copy) =>
          copy.briefing.chapters.touchlessSoapDispenser.parts.breadboard,
        number: soapPartNumbers.breadboard,
      },
      {
        id: "sensor",
        box: soapPartBox.sensor,
        /* Its supply lead alone: enough to bring the module onto the bench, and
           not enough to show the measurement it is part of. */
        alone: { ...soapEmpty, "sensor.vcc": soapComplete["sensor.vcc"] },
        words: (copy) =>
          copy.briefing.chapters.touchlessSoapDispenser.parts.sensor,
        number: soapPartNumbers.sensor,
      },
      {
        id: "servo",
        box: soapPartBox.servo,
        alone: { ...soapEmpty, "servo.power": soapComplete["servo.power"] },
        words: (copy) =>
          copy.briefing.chapters.touchlessSoapDispenser.parts.servo,
        number: soapPartNumbers.servo,
      },
      {
        id: "led",
        box: soapPartBox.ledSoap,
        alone: {
          ...soapEmpty,
          "led.soap.cathode": soapComplete["led.soap.cathode"],
        },
        words: (copy) => copy.briefing.chapters.touchlessSoapDispenser.parts.led,
        number: soapPartNumbers.led,
      },
      {
        id: "resistor",
        box: soapPartBox.resSoap,
        alone: { ...soapEmpty, "res.soap.in": soapComplete["res.soap.in"] },
        words: (copy) =>
          copy.briefing.chapters.touchlessSoapDispenser.parts.resistor,
        number: soapPartNumbers.resistor,
      },
    ],
    stageBox: soapFitBox,
    assembly: soapAssembly,
    sceneFrom: soapSceneFrom,
    /* The two supply pins and the four the sketch names. `D9` carries the most
       weight of the six: it is the one whose `~` is the whole reason it was
       chosen. */
    mono: {
      "5V": "default",
      GND: "default",
      D8: "default",
      D7: "default",
      D9: "default",
      D13: "default",
      "220Ω": "default",
    },
  },
};

export function briefingFor(id: ProjectId): BriefingDef | undefined {
  return briefings[id];
}

/**
 * How many screens a briefing has: the purpose, then one per part, then the
 * assembly. Derived rather than written down, so the counter cannot disagree
 * with the thing it counts.
 */
export function briefingScreenCount(def: BriefingDef): number {
  return def.parts.length + 2;
}

/* One-directional, unlike the catalogue check in `builds.ts`: a bench with no
   briefing is an ordinary chapter that has not been converted yet, but a
   briefing for a chapter you cannot open is dead code that will be read as
   live. Development only. */
if (process.env.NODE_ENV !== "production") {
  const orphaned = Object.values(briefings).filter(
    (def) => !builds[def.projectId],
  );
  if (orphaned.length) {
    throw new Error(
      "Briefings for chapters with no bench: " +
        orphaned.map((def) => def.projectId).join(", "),
    );
  }

  /**
   * Every beat has a caption, in every language. **This is the guarantee that
   * replaced a type.**
   *
   * `BriefingWords.assembly` was total over chapter one's six beat ids, so the
   * compiler answered this question; it cannot any more (see the field's own
   * note). The check is per row against that row's own words, which is
   * strictly what the type used to say and nothing more — a chapter owes
   * captions for its own beats and for nobody else's.
   *
   * Both locales, because the Turkish file is typed against the English one
   * and `Record<string, string>` swallows a missing key on either side. A blank
   * caption is invisible: the film plays, the line under it is empty, and the
   * live region announces nothing at the beat it is announcing.
   */
  const blank: string[] = [];
  for (const def of Object.values(briefings)) {
    for (const locale of locales) {
      const words = def.words(getCopy(locale));
      for (const beat of def.assembly) {
        if (!words.assembly[beat.id]) {
          blank.push(`${def.projectId}.${beat.id} (${locale})`);
        }
      }
    }
  }
  if (blank.length) {
    throw new Error("Assembly beats with no caption: " + blank.join(", "));
  }
}
