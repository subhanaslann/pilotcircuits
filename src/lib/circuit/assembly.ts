import type { PartId, Placement } from "@/lib/circuit/placement";

/**
 * One frame of a chapter building itself.
 *
 * This lived in `lamp-assembly.ts` until chapter two wanted a film of its own.
 * It is the same shape it was there, and chapter one's file still holds the
 * reasoning for the shape — a beat is data rather than a component, the clock
 * belongs to whoever is playing it, and the caption is looked up from the
 * dictionary against `id` so a briefing already on screen changes language
 * with everything else.
 *
 * ## Why `id` is a plain string
 *
 * It used to be chapter one's six-member `BeatId`, and `BriefingWords.assembly`
 * was `Record<BeatId, string>` — total over those six, which is what made a
 * beat without a caption a compile error. Widening `BeatId` into the union of
 * every chapter's beat ids keeps that error and buys a worse one: each
 * chapter's copy object would then owe captions for every other chapter's
 * beats, so adding a chapter would edit the locale entry of every chapter
 * before it. So the key type widens to `string`, each chapter keeps its own
 * union beside its own beats, and the totality that was a type error becomes a
 * dev-boot throw in `briefings.ts` — checked per build, against the ids that
 * build actually plays. That throw is the whole guarantee now; it is not
 * optional.
 *
 * ## Why a beat carries a whole placement
 *
 * Not a delta, and never one built from the beat before it. The scene a film
 * draws is `sceneFrom(beat.placement)` — the same function the bench is drawn
 * by — so the two cannot disagree about what a finished build looks like, and
 * a join can only appear in a frame whose own literal puts it there. A stale
 * edge riding along into a picture that has not earned it is exactly the class
 * of lie this product keeps removing.
 */
export interface AssemblyBeat {
  /** The caption's key. Never the caption. */
  id: string;

  /**
   * Milliseconds from the start of the run.
   *
   * Absolute rather than a duration: durations are read by adding up, and a
   * film whose pacing is an argument (chapter one's pairs, and chapter two's
   * copy of them) has to be readable as a column of numbers.
   */
  atMs: number;

  /** What every lead is attached to at this beat. */
  placement: Placement;

  /**
   * The part arriving on this beat — drawn coming down onto the bench.
   *
   * A `PartId` rather than the `"led" | "resistor"` it started as: that union
   * was chapter one's two parts spelled into a type two chapters now share, so
   * chapter three would have had to widen chapter one's file to introduce a
   * part chapter one has never heard of. The player looks the name up in the
   * build's own tables and a name no build owns simply draws nothing.
   *
   * At most ONE per beat, even where several parts land together. It is the
   * thing the eye follows down; a beat that claimed three arrivals would have
   * to pick which one moves anyway, so a chapter with a crowded beat names the
   * part its caption is about, or names none.
   */
  entering?: PartId;

  /** C-22 · one green pulse along this connection, named by its id. */
  trace?: string;

  /** Whether the lamp is swelling and fading. */
  breathing?: boolean;

  /**
   * Whether the lamp is simply on.
   *
   * Its own field and not something derived from `breathing`, because the two
   * are different claims and the difference is already on screen: under
   * `prefers-reduced-motion` the player draws chapter one's swell as a lamp
   * that is lit and steady — the frame the swell would have ended on, rather
   * than the swell frozen part-way. A build whose light does not breathe says
   * so here.
   */
  lit?: boolean;

  /**
   * Which of chapter two's three lights are on.
   *
   * Three named booleans rather than a colour, because "all three dark" is a
   * real frame — it is the one the run opens on — and a colour would have to
   * spell darkness as a fourth value that is not a colour. `lit` and
   * `breathing` are one lamp's vocabulary and have no way to say WHICH lamp,
   * which is the only question a traffic light asks.
   */
  lamps?: { red: boolean; yellow: boolean; green: boolean };
}
