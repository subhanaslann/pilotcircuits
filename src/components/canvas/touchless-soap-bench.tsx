import { boxOf, frame } from "@/lib/circuit/wokwi";
import { soapArtOrigins, soapLeadRoot } from "@/lib/circuit/touchless-soap";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import { UltrasonicSensor } from "@/components/canvas/parts/ultrasonic";
import { MicroServo } from "@/components/canvas/parts/micro-servo";
import type { BenchSpec } from "@/components/canvas/breadboard-bench";

/**
 * Chapter five's bench, as a table.
 *
 * Two modules instead of one, and the second is the reason the shape exists: a
 * servo's leads leave its case sideways and its case is a thing you put down on
 * a desk, so it draws like a part and drags like a cable.
 *
 * The servo is drawn with **no arm**. `MicroServo` grew its cardboard barrier
 * for the capstone and the arm is that build's own part — a soap pump has a
 * horn and nothing on the end of it, and drawing a 70 mm plank swinging over
 * this bench would be chapter six's project on chapter five's desk.
 */

/** What the sketch is doing to the two things that move. */
export interface SoapLive {
  /** Whether the lamp is on. */
  lit?: boolean;
  /** Where the horn is, in this build's own degrees. `0` is at rest. */
  angle?: number;
}

export const soapBench: BenchSpec<SoapLive | undefined> = {
  origins: (scene) => {
    const at = soapArtOrigins(scene);
    return {
      board: at.board,
      breadboard: at.breadboard,
      parts: {
        resSoap: at.resSoap,
        ledSoap: at.ledSoap,
        sensor: at.sensor,
        servo: at.servo,
      },
    };
  },
  parts: [
    {
      id: "resSoap",
      body: {
        kind: "rigid",
        box: boxOf(frame.resistor),
        draw: (pos) => <Resistor x={pos.x} y={pos.y} ohms={220} />,
      },
    },
    {
      id: "ledSoap",
      body: {
        kind: "rigid",
        box: boxOf(frame.led),
        draw: (pos, live) => (
          <Led
            x={pos.x}
            y={pos.y}
            colour="green"
            lit={live?.lit ?? false}
            uid="ledSoap"
          />
        ),
      },
    },
    {
      id: "sensor",
      body: {
        kind: "module",
        box: boxOf(frame.sensor),
        leads: ["sensor.vcc", "sensor.gnd", "sensor.trig", "sensor.echo"],
        rootOf: soapLeadRoot,
        /* Four wires, and the two that carry the measurement are told apart:
           the board writes the trigger and reads the echo, and `signalAlt` is
           the role that exists for exactly that second signal. */
        roleOf: (terminal) =>
          terminal === "sensor.vcc"
            ? "power"
            : terminal === "sensor.gnd"
              ? "ground"
              : terminal === "sensor.trig"
                ? "signalAlt"
                : "signal",
        draw: (pos) => <UltrasonicSensor at={pos} />,
      },
    },
    {
      id: "servo",
      body: {
        kind: "module",
        box: boxOf(frame.servo),
        leads: ["servo.power", "servo.ground", "servo.signal"],
        rootOf: soapLeadRoot,
        /* Red, brown, orange — the three colours every hobby servo's cable
           has, and the only cue on the bench that says which is which. */
        roleOf: (terminal) =>
          terminal === "servo.power"
            ? "power"
            : terminal === "servo.ground"
              ? "ground"
              : "signalAlt",
        draw: (pos, live) => (
          <MicroServo
            at={pos}
            /* Its pins are drawn by the strand layer, and the labels this prop
               exists for are the capstone's. */
            pins={[]}
            angle={live?.angle ?? 0}
            showLabels={false}
            showArm={false}
          />
        ),
      },
    },
    {
      id: "wirePower",
      body: {
        kind: "cable",
        ends: ["wire.power.rail", "wire.power.pin"],
        role: "power",
      },
    },
    {
      id: "wireGround",
      body: {
        kind: "cable",
        ends: ["wire.ground.rail", "wire.ground.pin"],
        role: "ground",
      },
    },
    {
      id: "wireLamp",
      body: {
        kind: "cable",
        ends: ["wire.lamp.row", "wire.lamp.pin"],
        role: "signal",
      },
    },
  ],
  holeAddresses: true,
};
