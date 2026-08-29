/**
 * Batch 5 · What the board says while the functional test runs.
 *
 * One source for both readings of the sequence: the canvas draws from it
 * (C-23's approach and readout) and the dock prints from it. Two lists that
 * had to be kept in step would drift the first time either was tuned, and the
 * whole point of the dock is that it is the *same* run seen as numbers.
 *
 * Nothing here is translated, and nothing here is a sentence. These are the
 * lines the sketch prints over the serial port — rule 13, at its purest. The
 * dictionary owns every word *around* the log; the log itself is hardware.
 */

/**
 * The approach, in centimetres. Five samples rather than three: the canvas
 * only needs enough to move a car, but a serial monitor with three lines in it
 * does not look like a board talking.
 */
export const approachReadings = [62, 48, 34, 25, 18] as const;

/** The reading the build is specified around, and the one C-23 parks on. */
export const finalReadingCm = approachReadings[approachReadings.length - 1];

export function distanceLine(cm: number): string {
  return `Distance: ${cm} cm`;
}

/**
 * The gate's own report.
 *
 * These are identical whether the test passes or fails, and that is the point.
 * The servo failure in this build is a *mechanical* one — the horn is fitted a
 * quarter turn out — so the sketch commands OPEN and the board dutifully
 * reports that it opened. What actually happens in the room is the opposite,
 * and only the canvas and the inspection can see it.
 *
 * So the serial log is not where the bug surfaces. A board that printed
 * `Barrier: wrong direction` would be a board that already knew, and if it
 * knew, the agent would have nothing to find.
 */
export const barrierLines = {
  opening: "Barrier: opening",
  closed: "Barrier: closed",
} as const;

/** The whole log a completed run leaves behind, in order. */
export function fullSerialLog(): string[] {
  return [
    ...approachReadings.map(distanceLine),
    barrierLines.opening,
    barrierLines.closed,
  ];
}
