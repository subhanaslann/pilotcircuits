import { diff, extras, isServoAligned, type CircuitScene } from "@/lib/circuit/graph";
import { pwmPins } from "@/lib/circuit/breathing-lamp";
import { lightDrivePins, lightLines } from "@/lib/circuit/traffic-light";
import { nightLines, nightPins } from "@/lib/circuit/motion-night-light";
import {
  analogPins,
  plantLines,
  plantPins,
} from "@/lib/circuit/plant-guardian";
import { soapLines, soapPins } from "@/lib/circuit/touchless-soap";
import {
  approachReadings,
  barrierLines,
  distanceLine,
  finalReadingCm,
} from "@/lib/device/test-run";

/**
 * What running a build actually does — declared by the build.
 *
 * ## The bug this file is the answer to
 *
 * `run_functional_test` used to be the capstone's test with the capstone's
 * three rows welded into it. On chapter one — one LED, no sensor, no servo — a
 * correct build reported `sensor: 18 cm`, `servo: 0° → 90°`, `leds: green`,
 * played a car driving across the bench, and left the serial monitor saying the
 * board had not spoken. Three lies and a silence, from the one call the chapter
 * ends on.
 *
 * The mistake was not the numbers. It was that a **per-build fact lived in a
 * global place**, which is the same mistake `builds.ts` was created to end for
 * scenes and steps. So a run is a row in the registry now: the checks it makes,
 * the beats the board plays, and when it is over. Adding chapter two is writing
 * one of these, not editing a handler.
 *
 * ## Two readings, one timeline
 *
 * The canvas plays a run as theatre and the dock prints it as numbers, and they
 * must not be able to disagree — so both are driven from the beats below. A
 * beat carries what the board *says* (serial, never translated: rule 13) and
 * what the bench *shows*, and the session applies both.
 */

/** What the canvas is doing at a beat. Every field optional; absent is unchanged. */
export interface StagePatch {
  /** C-23's approaching car, 0–1. */
  approach?: number;
  distanceCm?: number | null;
  sensing?: boolean;
  /** The capstone's two indicator LEDs. */
  leds?: { green: boolean; red: boolean };
  /** The servo horn, where the build has one. */
  hornAngle?: number | null;
  /** Chapter one: the lamp, swelling and fading rather than simply on. */
  breathing?: boolean;
  lit?: boolean;
  /**
   * Chapter two: three lamps, each named.
   *
   * Neither of the fields above can say this. `lit` is one lamp and `leds` is
   * the capstone's two fixed indicators, and the thing chapter two shows is
   * *which* of three is alight — including the frame where none of them is,
   * which is why these are three booleans and not a colour.
   */
  lamps?: { red: boolean; yellow: boolean; green: boolean };
}

export interface RunBeat {
  /** Milliseconds from the start of the run. */
  at: number;
  /** A line the board prints. Hardware, so never translated. */
  serial?: string;
  /**
   * What the bench shows from this moment. A function of the scene because a
   * build can only show what is true of it — the horn does not swing to 90°
   * when it is mounted a quarter turn out, and pretending otherwise is the one
   * thing this product cannot do.
   */
  stage?: (scene: CircuitScene) => StagePatch;
}

export interface CheckSpec {
  /** The dock's row and the tool result's `subject`. Named in `copy.test`. */
  id: string;
  passes: (scene: CircuitScene) => boolean;
  /** What the board measured. Shown only on a check that passed (rule 9). */
  detail: (scene: CircuitScene) => string;
  /** When this row stops running, in milliseconds from the start. */
  settlesAt: number;
}

export interface RunSpec {
  checks: readonly CheckSpec[];
  beats: readonly RunBeat[];
  /** When the theatre clears. The dock keeps its log and verdict past this. */
  clearsAt: number;
}

/** Every join the sketch asks for is made, and nothing else is touching them. */
const wiringOk = (scene: CircuitScene) =>
  diff(scene).mismatches.length === 0 && extras(scene).length === 0;

/**
 * How much of the sketch is on the bench, as the dock prints it: `6 / 8`.
 *
 * Shared between chapters, and that is not the mistake this file exists to
 * end: *how many* joins a build asks for is a per-build fact, and it is read
 * off the build's own scene every time this runs. Only the fraction is common.
 */
const joinsMade = (scene: CircuitScene) => {
  const report = diff(scene);
  return `${report.matched} / ${report.matched + report.mismatches.length}`;
};

/* --- Chapter six · the capstone -----------------------------------------
   Transcribed from the sequence that used to be written into the session, beat
   for beat and millisecond for millisecond: this build's film is unchanged. */

export const barrierRun: RunSpec = {
  checks: [
    {
      id: "sensor",
      passes: wiringOk,
      detail: () => `${finalReadingCm} cm`,
      settlesAt: 2000,
    },
    {
      id: "servo",
      passes: isServoAligned,
      detail: () => "0° → 90°",
      settlesAt: 3000,
    },
    /* The lights report the sketch's decision, which is right either way — the
       arm reports the room, which is not. */
    { id: "leds", passes: () => true, detail: () => "green", settlesAt: 3600 },
  ],
  beats: [
    ...approachReadings.map((cm, index) => ({
      at: 400 + index * 350,
      serial: distanceLine(cm),
      stage: () => ({
        approach: 0.3 + (index / (approachReadings.length - 1)) * 0.7,
        distanceCm: cm,
        sensing: true,
      }),
    })),
    {
      at: 2400,
      serial: barrierLines.opening,
      stage: (scene) => ({
        leds: { green: true, red: false },
        /* Commanded open; it only *goes* there if the horn is on straight. */
        hornAngle: isServoAligned(scene) ? 90 : undefined,
      }),
    },
    {
      at: 4400,
      serial: barrierLines.closed,
      stage: () => ({
        hornAngle: 0,
        leds: { green: false, red: true },
        approach: 1,
        distanceCm: finalReadingCm,
        sensing: false,
      }),
    },
  ],
  clearsAt: 5400,
};

/* --- Chapter one · the breathing lamp ------------------------------------ */

/** Where the resistor's board end actually is, whatever the sketch wanted. */
function drivePin(scene: CircuitScene): string | undefined {
  return scene.observed.find((c) => c.from === "res.out")?.to;
}

/**
 * The chapter's whole lesson, as a check.
 *
 * A lamp wired to `D8` is wired correctly in every sense a connection test can
 * measure — two ends, both seated — and it **blinks** instead of breathing,
 * because only the pins marked `~` can hold a value between on and off. So the
 * run has a row for it, and moving one lead to the wrong header hole fails that
 * row and nothing else. That is the difference between a test that checks the
 * build and a test that teaches it.
 */
const breathes = (scene: CircuitScene) => {
  const pin = drivePin(scene);
  return Boolean(pin && pwmPins.includes(pin));
};

const brightness = (value: number) => `Brightness: ${value}`;

export const lampRun: RunSpec = {
  checks: [
    {
      id: "wiring",
      passes: wiringOk,
      detail: joinsMade,
      settlesAt: 1000,
    },
    {
      id: "breathing",
      passes: breathes,
      /* The sweep the sketch writes, which is what "breathing" is. */
      detail: () => "0 → 255",
      settlesAt: 3000,
    },
  ],
  beats: [
    { at: 300, serial: "Sketch: breathing_lamp.ino", stage: () => ({ lit: true }) },
    {
      at: 900,
      serial: brightness(0),
      /* Only a lamp that can breathe is drawn breathing. On `D8` it is lit and
         still, which is exactly what the person would see on the desk. */
      stage: (scene) => ({ breathing: breathes(scene) }),
    },
    { at: 1500, serial: brightness(128) },
    { at: 2100, serial: brightness(255) },
    { at: 2700, serial: brightness(128) },
    { at: 3200, serial: brightness(0), stage: () => ({ breathing: false }) },
  ],
  clearsAt: 4000,
};

/* --- Chapter two · the traffic light -------------------------------------- */

/** The three lamps, named by the pins the sketch drives them on. */
type TrafficColour = keyof typeof lightDrivePins;

/**
 * The chapter's lesson as a check, the way `breathes` is chapter one's.
 *
 * Chapter one taught that a lamp on `D8` is wired correctly in every sense a
 * connection test can measure and still cannot breathe. Chapter two says the
 * same thing about three cables a hole apart: `D13 D12 D11` and `D13 D11 D12`
 * are both twenty made joins and one of them shows the lights in the wrong
 * order. `wiring` passes either way, so the sequence gets a row of its own —
 * and it reads the pins from `lightDrivePins`, which is the sketch's own
 * constants, rather than from a second copy of them here.
 *
 * **Which pin each lamp is on is asked of the metal**, through `lightLines`.
 * This row used to read `observed.find(c => c.from === "wire.red.pin")`, which
 * asks which CABLE rather than which line — and the same chapter declares its
 * four jumpers indistinguishable, so that reading failed 382 of the 384 correct
 * layouts: `inspect_build` found nothing, `wiring` passed 20 / 20, this row went
 * red, and there was nothing in the panel to point at. Chapter three's
 * `nightLines` was written against this function; chapter two now uses the same
 * shape.
 */
const sequences = (scene: CircuitScene) => {
  const lines = lightLines(scene);
  return (["red", "yellow", "green"] as const).every(
    (colour) => lines[colour] === lightDrivePins[colour],
  );
};

/**
 * Which lamps are alight at a beat, given how the bench is actually wired.
 *
 * A light comes on only when the sketch's pin is the pin its own cable
 * reaches; anything else and it stays dark for the whole film while the other
 * two run. That is the same rule that stops the capstone's horn swinging to
 * 90° when it is mounted a quarter turn out — the bench may only show what is
 * true of the build it is standing on.
 *
 * `null` is a real argument, not a missing one: "no lamp is lit" is the frame
 * the run opens and closes on, and it is this function's answer rather than a
 * literal written twice.
 */
const lampsFor = (scene: CircuitScene, on: TrafficColour | null) => {
  const lines = lightLines(scene);
  return {
    red: on === "red" && lines.red === lightDrivePins.red,
    yellow: on === "yellow" && lines.yellow === lightDrivePins.yellow,
    green: on === "green" && lines.green === lightDrivePins.green,
  };
};

export const trafficRun: RunSpec = {
  checks: [
    {
      id: "wiring",
      passes: wiringOk,
      detail: joinsMade,
      settlesAt: 1000,
    },
    {
      id: "sequence",
      passes: sequences,
      /* The three pins in the order the sketch drives them, which is the one
         thing this row is about. */
      detail: () => "D13 · D12 · D11",
      settlesAt: 3600,
    },
  ],
  /* One turn of a real light, in a real light's order: red, then green, then
     amber, then red again. Amber between green and red and never between red
     and green is the whole reason a person can read this film as a traffic
     light rather than as three LEDs taking turns. */
  beats: [
    {
      at: 300,
      serial: "Sketch: traffic_light.ino",
      stage: (scene) => ({ lamps: lampsFor(scene, null) }),
    },
    {
      at: 900,
      serial: "Light: RED",
      stage: (scene) => ({ lamps: lampsFor(scene, "red") }),
    },
    {
      at: 1800,
      serial: "Light: GREEN",
      stage: (scene) => ({ lamps: lampsFor(scene, "green") }),
    },
    {
      at: 2600,
      serial: "Light: AMBER",
      stage: (scene) => ({ lamps: lampsFor(scene, "yellow") }),
    },
    {
      at: 3400,
      serial: "Light: RED",
      stage: (scene) => ({ lamps: lampsFor(scene, "red") }),
    },
    {
      at: 4000,
      serial: "Light: off",
      stage: (scene) => ({ lamps: lampsFor(scene, null) }),
    },
  ],
  clearsAt: 5000,
};

/* --- Chapter three · the motion night light ------------------------------- */

/**
 * The chapter's lesson as a check.
 *
 * Chapter one taught that a lamp on `D8` is wired correctly in every sense a
 * connection test can measure and still cannot breathe; chapter two said the
 * same about three cables a hole apart. This chapter's version is the sharpest
 * of the three, because the two pins are not the same KIND of pin: the sketch
 * READS one of them and WRITES the other, so a build with the two lines swapped
 * is fifteen made joins, a lamp that never comes on, and a sensor whose answer
 * is being written over.
 *
 * `wiring` passes on that build — the eight cable ends are one interchangeable
 * class, so every join finds a partner — which is exactly why this row exists.
 * The reading is `nightLines`, which asks the metal rather than the cable's
 * name; see there for why the obvious version is wrong.
 */
const senses = (scene: CircuitScene) => {
  const lines = nightLines(scene);
  return lines.sense === nightPins.sense && lines.lamp === nightPins.lamp;
};

export const nightRun: RunSpec = {
  checks: [
    {
      id: "wiring",
      passes: wiringOk,
      detail: joinsMade,
      settlesAt: 1000,
    },
    {
      id: "senses",
      passes: senses,
      /* The two pins in the order the sketch names them — the one it reads
         first, then the one it drives. */
      detail: () => "D2 · D13",
      settlesAt: 3400,
    },
  ],
  /**
   * One pass of an empty hallway and somebody walking through it.
   *
   * The lamp is `lit` and never `breathing`: this chapter's light is on or off,
   * and the whole question is which of the two and why. And it only lights on a
   * build whose cables reached the pins the sketch names — the same rule that
   * stops the capstone's horn swinging to 90° when it is mounted a quarter turn
   * out. The bench may only show what is true of the build it is standing on.
   */
  beats: [
    {
      at: 300,
      serial: "Sketch: motion_night_light.ino",
      stage: () => ({ lit: false }),
    },
    { at: 900, serial: "PIR: LOW" },
    {
      at: 1800,
      serial: "PIR: HIGH",
      stage: (scene) => ({ lit: senses(scene) }),
    },
    { at: 2600, serial: "Lamp: ON" },
    /* A real HC-SR501 holds its pin up for seconds after the last movement and
       then lets it fall; the film shows the hold rather than eliding it,
       because "it stays on for a while" is a property of the part and not of
       the sketch. */
    { at: 3400, serial: "PIR: LOW" },
    {
      at: 4200,
      serial: "Lamp: off",
      stage: () => ({ lit: false }),
    },
  ],
  clearsAt: 5000,
};

/* --- Chapter four · the plant guardian ------------------------------------ */

/**
 * The chapter's lesson as a check: is the board reading a NUMBER?
 *
 * Chapter one's shape exactly, one header along. A probe wired to `D2` is a
 * made join with two seated ends — every connection test there is says yes —
 * and `analogRead` on a digital pin comes back as 0 or 1023 and nothing in
 * between, so the threshold the person spent step five choosing can never be
 * crossed. Only the six holes marked `A` can answer with a number, and that is
 * a fact about the board rather than about the sketch, so it is read from
 * `analogPins` rather than kept twice.
 *
 * It catches the swap as well as the wrong hole: the four cables are one
 * interchangeable class, so a build with the probe's line on `D9` and the
 * lamp's on `A0` passes `wiring` — and fails here, which is the truth.
 */
const readsANumber = (scene: CircuitScene) => {
  const lines = plantLines(scene);
  return Boolean(lines.sense && analogPins.includes(lines.sense));
};

/** Whether the lamp can be driven at all — the pin the sketch writes. */
const lampWired = (scene: CircuitScene) =>
  plantLines(scene).lamp === plantPins.lamp;

/**
 * One reading, falling.
 *
 * The numbers are a real capacitive probe's: wet soil pulls the reading down
 * toward 300 and dry soil lets it climb past 600, so a threshold sits in the
 * middle and the lamp comes on when the value crosses it going UP. The film
 * plays the crossing rather than the two states either side of it, because the
 * crossing is what the sketch is written around.
 */
const SOIL_READINGS = [412, 468, 523, 571, 618] as const;
const SOIL_THRESHOLD = 550;

const soilLine = (value: number) => `Soil: ${value}`;

export const plantRun: RunSpec = {
  checks: [
    {
      id: "wiring",
      passes: wiringOk,
      detail: joinsMade,
      settlesAt: 1000,
    },
    {
      id: "reads",
      passes: readsANumber,
      /* What the board can actually report on that pin, which is the whole of
         what this row is about. */
      detail: () => `${plantPins.sense.replace("board.", "")} · 0–1023`,
      settlesAt: 3400,
    },
  ],
  beats: [
    {
      at: 300,
      serial: "Sketch: plant_guardian.ino",
      stage: () => ({ lit: false }),
    },
    ...SOIL_READINGS.map((value, index) => ({
      at: 900 + index * 700,
      serial: soilLine(value),
      /* The lamp comes on when the reading crosses the threshold — and only on
         a build that can read a number at all, and whose lamp is on the pin the
         sketch drives. The bench may only show what is true of it. */
      stage: (scene: CircuitScene) => ({
        lit:
          value > SOIL_THRESHOLD && readsANumber(scene) && lampWired(scene),
      }),
    })),
    {
      at: 4400,
      serial: `Dry: ${SOIL_READINGS[SOIL_READINGS.length - 1]} > ${SOIL_THRESHOLD}`,
    },
  ],
  clearsAt: 5400,
};

/* --- Chapter five · the touchless soap dispenser -------------------------- */

/**
 * The chapter's lesson as a check: can the board TELL the pump where to go?
 *
 * Chapter one's shape, on a part where getting it wrong is louder. A servo is
 * told an angle, and an angle is a value between two ends — so the pin it
 * listens on has to be one of the ones marked `~`. On any other digital pin the
 * wiring is perfect, every connection test says yes, and the horn does not
 * move at all.
 *
 * `pwmPins` is chapter one's own list, read rather than copied: which pins can
 * hold a value is a fact about the board.
 *
 * The horn's alignment rides in the same row. On this bench it cannot be wrong
 * — nothing here mounts a horn — so what it adds is the promise that the row
 * is about the pump ACTUALLY turning rather than about a wire being present.
 */
const canSweep = (scene: CircuitScene) => {
  const pump = soapLines(scene).pump;
  return Boolean(pump && pwmPins.includes(pump)) && isServoAligned(scene);
};

/** Whether the board is reading the echo it triggered. */
const measures = (scene: CircuitScene) => {
  const lines = soapLines(scene);
  return lines.trig === soapPins.trig && lines.echo === soapPins.echo;
};

export const soapRun: RunSpec = {
  checks: [
    {
      id: "wiring",
      passes: wiringOk,
      detail: joinsMade,
      settlesAt: 1000,
    },
    {
      id: "distance",
      passes: measures,
      detail: () => `${finalReadingCm} cm`,
      settlesAt: 2600,
    },
    {
      id: "sweep",
      passes: canSweep,
      detail: () => "0° → 90°",
      settlesAt: 4200,
    },
  ],
  /**
   * A hand coming near, the pump running, and the hand going away.
   *
   * The readings are the capstone's own approach — one measurement is one
   * measurement, and this chapter's sensor is the same part. What differs is
   * what happens at the end of it: a pump turns for a second and comes back,
   * rather than a barrier opening and staying open.
   */
  beats: [
    {
      at: 300,
      serial: "Sketch: touchless_soap.ino",
      stage: () => ({ lit: false, hornAngle: 0 }),
    },
    ...approachReadings.map((cm, index) => ({
      at: 700 + index * 320,
      serial: distanceLine(cm),
      stage: (scene: CircuitScene) => ({
        distanceCm: measures(scene) ? cm : null,
        sensing: measures(scene),
      }),
    })),
    {
      at: 2700,
      serial: "Hand: near — pump on",
      /* Commanded to turn; it only GOES there on a build that can say an
         angle. The bench may only show what is true of it. */
      stage: (scene: CircuitScene) => ({
        lit: canSweep(scene),
        hornAngle: canSweep(scene) ? 90 : undefined,
      }),
    },
    {
      at: 4000,
      serial: "Hand: gone — pump off",
      stage: () => ({ lit: false, hornAngle: 0, sensing: false }),
    },
  ],
  clearsAt: 5000,
};
