import { boxOf, frame } from "@/lib/circuit/wokwi";
import {
  nightArtOrigins,
  nightLeadRoot,
} from "@/lib/circuit/motion-night-light";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import { PirSensor } from "@/components/canvas/parts/pir-sensor";
import type { BenchSpec } from "@/components/canvas/breadboard-bench";

/**
 * Chapter three's bench, as a table.
 *
 * Chapter two's shape with one thing added: a `module`. The sensor's case
 * stands at a point the build declares and its three leads go wherever they are
 * put, so it draws like a rigid part and drags like a cable — which is what a
 * module on the end of three jumpers actually does.
 *
 * The paint order is the same rule as chapter two's: the resistor lies in the
 * row below the lamp, and a rigid part's grab rect covers its whole box, so
 * drawn the other way round the lens would sit under a transparent rectangle
 * belonging to the part beneath it. The sensor is above the plastic and touches
 * nothing, so it goes after both.
 */

/** Whether the sketch is driving the lamp. One lamp, so one flag. */
export type NightLive = boolean | undefined;

export const nightBench: BenchSpec<NightLive> = {
  origins: (scene) => {
    const at = nightArtOrigins(scene);
    return {
      board: at.board,
      breadboard: at.breadboard,
      /* Cables are absent, always: a cable has no drawn box, so there is no
         corner for one to be the top-left of, and its ends grip themselves. */
      parts: {
        resNight: at.resNight,
        ledNight: at.ledNight,
        pir: at.pir,
      },
    };
  },
  parts: [
    {
      id: "resNight",
      body: {
        kind: "rigid",
        box: boxOf(frame.resistor),
        draw: (pos) => <Resistor x={pos.x} y={pos.y} ohms={220} />,
      },
    },
    {
      id: "ledNight",
      body: {
        kind: "rigid",
        box: boxOf(frame.led),
        draw: (pos, live) => (
          <Led
            x={pos.x}
            y={pos.y}
            /* One lamp and no colour to choose: a white night light is a warm
               LED, and the part in the box is the same 5 mm one chapter one
               hands over. Red is what that drawing has always been. */
            colour="red"
            lit={live ?? false}
            /* What this lamp's two blur filters are called. Uniqueness is the
               copy's own `useSvgPrefix()`; this is the readable half. */
            uid="ledNight"
          />
        ),
      },
    },
    {
      id: "pir",
      body: {
        kind: "module",
        box: boxOf(frame.pir),
        leads: ["pir.vcc", "pir.out", "pir.gnd"],
        rootOf: nightLeadRoot,
        /* Three wires, three colours — the same three a real sensor's flying
           lead is made of, and the only cue on the bench that says which strand
           is which without reading anything. */
        roleOf: (terminal) =>
          terminal === "pir.vcc"
            ? "power"
            : terminal === "pir.gnd"
              ? "ground"
              : "signal",
        draw: (pos) => <PirSensor at={pos} />,
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
      id: "wireSignal",
      body: {
        kind: "cable",
        ends: ["wire.signal.row", "wire.signal.pin"],
        role: "signal",
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
  /* Every correction in this chapter is a hole, so the plastic prints the
     addresses a person is told out loud. */
  holeAddresses: true,
};
