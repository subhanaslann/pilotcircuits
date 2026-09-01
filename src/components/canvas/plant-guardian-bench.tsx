import { boxOf, frame } from "@/lib/circuit/wokwi";
import { plantArtOrigins, plantLeadRoot } from "@/lib/circuit/plant-guardian";
import { Led } from "@/components/canvas/parts/led";
import { Resistor } from "@/components/canvas/parts/resistor";
import { SoilProbe } from "@/components/canvas/parts/soil-probe";
import type { BenchSpec } from "@/components/canvas/breadboard-bench";

/**
 * Chapter four's bench, as a table.
 *
 * Chapter three's shape with the module swapped: a soil probe instead of a
 * motion sensor, and nothing else about the view has to know the difference.
 * That was the point of generalising it.
 *
 * The paint order is the same rule as every other breadboard chapter: the
 * resistor lies in the row below the lamp, and a rigid part's grab rect covers
 * its whole box, so drawn the other way round the lens would sit under a
 * transparent rectangle belonging to the part beneath it.
 */

/** Whether the sketch is driving the lamp. One lamp, so one flag. */
export type PlantLive = boolean | undefined;

export const plantBench: BenchSpec<PlantLive> = {
  origins: (scene) => {
    const at = plantArtOrigins(scene);
    return {
      board: at.board,
      breadboard: at.breadboard,
      parts: {
        resPlant: at.resPlant,
        ledPlant: at.ledPlant,
        probe: at.probe,
      },
    };
  },
  parts: [
    {
      id: "resPlant",
      body: {
        kind: "rigid",
        box: boxOf(frame.resistor),
        draw: (pos) => <Resistor x={pos.x} y={pos.y} ohms={220} />,
      },
    },
    {
      id: "ledPlant",
      body: {
        kind: "rigid",
        box: boxOf(frame.led),
        draw: (pos, live) => (
          <Led x={pos.x} y={pos.y} colour="red" lit={live ?? false} uid="ledPlant" />
        ),
      },
    },
    {
      id: "probe",
      body: {
        kind: "module",
        box: boxOf(frame.soil),
        leads: ["soil.vcc", "soil.gnd", "soil.aout"],
        rootOf: plantLeadRoot,
        /* Three wires, three colours — the same three a real probe's flying
           lead is made of, and the only cue on the bench that says which strand
           is which without reading anything. */
        roleOf: (terminal) =>
          terminal === "soil.vcc"
            ? "power"
            : terminal === "soil.gnd"
              ? "ground"
              : "signal",
        draw: (pos) => <SoilProbe at={pos} />,
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
  holeAddresses: true,
};
