import type { Copy } from "@/content/i18n";

/**
 * Batch 9 · The six chapters.
 *
 * Same contract as `@/lib/agent/steps`: **structure here, words in the
 * dictionary, both keyed by the same id.** Which components a build needs and
 * how long it takes are the same in every language; what it is *called* is not.
 * Adding a locale never touches this file.
 *
 * ## The ladder
 *
 * These are not seven interchangeable projects any more. They are **six
 * chapters in order**, and the order is the curriculum: each one adds exactly
 * one idea to the one before it, and the parts list grows with it — three parts
 * in chapter one, six in chapter six. Declaration order is chapter order, and
 * `chapter` says so out loud so nothing has to infer it from an array index.
 *
 * The count is the visible half of the ladder. A chapter's `components` are the
 * parts it *teaches with*: the wires, the USB cable and the cardboard you cut
 * yourself are in the box but are not on the list, because a list that grows
 * from three to six only means something if every entry on it is a thing the
 * chapter is about.
 *
 * **All six are `ready`.** The capstone was built first as the whole product's
 * proof and the ladder was filled in from the bottom towards it; three, four
 * and five were the last, and until they landed they were honestly labelled
 * `preview`. `status` and the bench registry in `@/lib/agent/builds` have to
 * agree, and that file throws in development when they do not — so this
 * sentence cannot go stale without the app refusing to start.
 */

export type ProjectId =
  | "breathingLamp"
  | "trafficLight"
  | "motionNightLight"
  | "plantGuardian"
  | "touchlessSoapDispenser"
  | "smartParkingBarrier";

export type Difficulty = "beginner" | "intermediate";

/** `ready` has a guided workbench; `preview` is announced as such (P-11). */
export type ProjectStatus = "ready" | "preview" | "inProgress";

/**
 * P-06 · The component vocabulary.
 *
 * Six parts, and six is the point: the ladder is *counted*, so the vocabulary
 * has to be small enough that "three parts" and "six parts" are facts a reader
 * can hold in their head rather than two numbers that happen to differ.
 *
 * What left, and why it is not a loss: `jumper` and `usb` are in every build and
 * therefore distinguish none of them — wire and a cable are how you work, not
 * what you are working on. `cardboard` is the barrier's arm, which you cut
 * yourself. `button` had exactly one build and that build is no longer a
 * chapter. All four are still drawn where they physically are — the workbench
 * still wires with jumpers and still swings a cardboard arm. They are just not
 * *counted*.
 *
 * `sensor` stays deliberately generic: distance, soil moisture and motion all
 * share one mark, which is what lets three different chapters sense three
 * different things without the legend growing an entry each time.
 */
export type ComponentId =
  | "board"
  | "breadboard"
  | "sensor"
  | "servo"
  | "led"
  | "resistor";

export const componentIds: ComponentId[] = [
  "board",
  "breadboard",
  "sensor",
  "servo",
  "led",
  "resistor",
];

/**
 * What a bench can have in its hands, which is wider than what the ladder
 * counts.
 *
 * `componentIds` is still six and this is not a facet: the library's filters,
 * the project cards and the legend all keep reading `ComponentId`. But a
 * chapter's *workbench* holds things the catalogue deliberately does not count
 * — chapter two hands the person four jumper cables, and the capstone a sheet
 * of cardboard — and those have to be nameable by the kit shelf, the parts
 * rail and a finding. `component-icons.tsx` had already written this union
 * down for the drawings; it belongs here, beside the narrow one it widens.
 */
export type KitId =
  | ComponentId
  /* Three LEDs on one bench, and they are not the same object: a traffic light
     needs the red one at the top, so a shelf that drew and named all three the
     same way would be asking somebody to pick one at random and then telling
     them they picked wrong. The counted vocabulary keeps saying `led`. */
  | "ledRed"
  | "ledYellow"
  | "ledGreen"
  /* The same argument one part along. `sensor` stays deliberately generic in
     the COUNTED vocabulary — distance, soil moisture and motion share one mark,
     which is what lets three chapters sense three different things without the
     legend growing an entry each time. But a kit shelf draws the thing in the
     box, and an HC-SR501 does not look like a soil probe: a chapter whose shelf
     handed over "a sensor" drawn as somebody else's part would be asking a
     person to recognise a component by reading its caption. Chapter five keeps
     the bare `sensor`, whose drawing is the HC-SR04 it has always been. */
  | "sensorMotion"
  | "sensorMoisture"
  | "jumper"
  | "cardboard";

/**
 * Which of the six a bench part counts as, or `null` where it counts as none.
 *
 * The bridge back: a chapter's card promises a components list, and a bench
 * that grew a seventh part its card does not mention would be the card lying.
 * So the check is not "is this id in the list" — `ledRed` never will be — but
 * "does what this id counts as appear in the list", and the uncounted things
 * say so out loud by answering `null`.
 */
export function countedAs(id: KitId): ComponentId | null {
  if (id === "ledRed" || id === "ledYellow" || id === "ledGreen") return "led";
  if (id === "sensorMotion" || id === "sensorMoisture") return "sensor";
  if (id === "jumper" || id === "cardboard") return null;
  return id;
}

/** What a build teaches. Cards show the first two or three; the detail page
 *  shows them all (`frontend-plan.md` §4, §5). */
export type ConceptId =
  | "digitalPins"
  | "analogReading"
  | "triggerEcho"
  | "pwmServo"
  | "ledPolarity"
  | "distanceMeasurement"
  | "conditionalLogic"
  | "mechanicalCalibration"
  | "testing"
  | "thresholds"
  | "serialOutput"
  | "timing";

export interface ProjectDef {
  id: ProjectId;
  /**
   * Batch 8 · the project's address.
   *
   * Written out rather than derived from the id, for the same reason the ids
   * are not derived from the names: a URL is a promise. `smartParkingBarrier`
   * kebab-cased happens to give `smart-parking-barrier` today, but a rename
   * that shifts casing would silently move a route somebody has bookmarked.
   * Two fields, one of which never changes once it has been published.
   */
  slug: string;
  /**
   * Where it sits in the ladder, 1 to 6.
   *
   * Written down rather than read off the array index. Declaration order below
   * is chapter order and always will be, but an index is a property of a list
   * and a chapter is a property of the thing — the difference shows the first
   * time something renders these filtered or sorted.
   */
  chapter: number;
  minutes: number;
  difficulty: Difficulty;
  status: ProjectStatus;
  components: ComponentId[];
  concepts: ConceptId[];
  stepCount: number;
}

/** How many concepts a card shows before the rest move to the detail page. */
export const CARD_CONCEPTS = 3;

export const projects: ProjectDef[] = [
  {
    id: "breathingLamp",
    slug: "breathing-lamp",
    chapter: 1,
    minutes: 15,
    difficulty: "beginner",
    /* The second build to get a guided bench, and the first chapter to have
       one — see `@/lib/agent/builds`. The two lists are checked against each
       other there. */
    status: "ready",
    /* Three parts, and no breadboard: the LED goes straight into the board's
       own header. Chapter two is where a circuit stops fitting on the board
       itself, and that is a lesson of its own rather than a given. */
    components: ["board", "led", "resistor"],
    concepts: ["digitalPins", "ledPolarity", "timing"],
    stepCount: 4,
  },
  {
    id: "trafficLight",
    slug: "traffic-light",
    chapter: 2,
    minutes: 20,
    difficulty: "beginner",
    /* The lesson chapter one's note points forward to — a circuit that no
       longer fits on the board's own header — is something the person builds
       now rather than reads about. Twenty minutes and five steps are the same
       twenty and five `trafficSteps` adds up to; the bench is in
       `@/lib/agent/builds`, and the two lists are checked against each other
       there. */
    status: "ready",
    components: ["board", "breadboard", "led", "resistor"],
    concepts: ["digitalPins", "timing", "conditionalLogic"],
    stepCount: 5,
  },
  {
    id: "motionNightLight",
    slug: "motion-night-light",
    chapter: 3,
    minutes: 25,
    difficulty: "beginner",
    /* The first chapter whose bench has something on it that has to be FED
       rather than driven, and the first pin in the product that is read. Its
       bench is in `@/lib/agent/builds`, and the two lists are checked against
       each other there. Twenty-five minutes and five steps are the same
       twenty-five and five `nightSteps` adds up to. */
    status: "ready",
    components: ["board", "breadboard", "sensor", "led", "resistor"],
    concepts: ["digitalPins", "conditionalLogic", "ledPolarity"],
    stepCount: 5,
  },
  {
    id: "plantGuardian",
    slug: "plant-guardian",
    chapter: 4,
    minutes: 35,
    difficulty: "intermediate",
    /* The first chapter whose bench addresses the analog header — `board.A0`
       did not exist anywhere in this product before it. Its bench is in
       `@/lib/agent/builds`, and the two lists are checked against each other
       there. Thirty-five minutes and six steps are the same thirty-five and six
       `plantSteps` adds up to. */
    status: "ready",
    /* The same five parts as chapter three. What changes is what the pin is
       reading: a number instead of a yes, and a threshold you choose. */
    components: ["board", "breadboard", "sensor", "led", "resistor"],
    concepts: ["analogReading", "thresholds", "ledPolarity", "conditionalLogic"],
    stepCount: 6,
  },
  {
    id: "touchlessSoapDispenser",
    slug: "touchless-soap-dispenser",
    chapter: 5,
    minutes: 40,
    difficulty: "intermediate",
    /* The last chapter to get a bench, and the first assembled one with
       something that moves. Its bench is in `@/lib/agent/builds`, and the two
       lists are checked against each other there. Forty minutes and six steps
       are the same forty and six `soapSteps` adds up to. */
    status: "ready",
    components: ["board", "breadboard", "sensor", "servo", "led", "resistor"],
    concepts: [
      "triggerEcho",
      "distanceMeasurement",
      "pwmServo",
      "conditionalLogic",
    ],
    stepCount: 6,
  },
  {
    id: "smartParkingBarrier",
    slug: "smart-parking-barrier",
    chapter: 6,
    /* Thirty-five, which is what `barrierSteps` adds up to: 2 + 4 + 6 + 5 + 4 +
       8 + 6. It said 45 while the step list on the same page — the header meta
       reads this row, the preview below it reads the steps — added to 35. The
       other five rows carry that sum in their own comment and all five agree;
       this was the only one with no such line and the only one that differed.
       `docs/frontend-plan.md` specifies 35 for this build. */
    minutes: 35,
    difficulty: "intermediate",
    status: "ready",
    /* The capstone, and the only build the author lays out rather than the
       person: it opens on a planted fault with two steps already ticked, where
       the other five hand over an empty bench. All six have a guided bench.
       Same six parts as chapter five: everything new here is judgement —
       deciding, calibrating, and proving it works. */
    components: ["board", "breadboard", "sensor", "servo", "led", "resistor"],
    concepts: [
      "digitalPins",
      "triggerEcho",
      "pwmServo",
      "ledPolarity",
      "distanceMeasurement",
      "conditionalLogic",
      "mechanicalCalibration",
      "serialOutput",
      "testing",
    ],
    stepCount: 7,
  },
];

export function projectById(id: ProjectId): ProjectDef {
  const found = projects.find((project) => project.id === id);
  if (!found) throw new Error(`Unknown project: ${id}`);
  return found;
}

/**
 * Batch 8 · the route's way in.
 *
 * Returns `undefined` rather than throwing, because the caller is a page
 * handed an arbitrary string out of the URL bar: an unknown slug is a `404`,
 * not a crash. `projectById` keeps throwing — its argument is a typed id, so
 * a miss there is a programming error.
 */
export function projectBySlug(slug: string): ProjectDef | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Whether the build has a guided workbench, or is announced as a preview. */
export function isReady(project: ProjectDef): boolean {
  return project.status === "ready";
}

/** Everything a project says, in the reader's language. */
export function projectWords(copy: Copy, id: ProjectId) {
  return copy.projects[id];
}

/** The build the dashboard offers to continue: the capstone — all six have a
 *  guided bench, and this is the one that opens mid-story, on a planted fault,
 *  rather than on an empty bench. */
export const featuredProjectId: ProjectId = "smartParkingBarrier";

/**
 * Where the ladder starts.
 *
 * Not the same answer as `featuredProjectId`, and the difference is the point.
 * The dashboard offers the build you can actually walk through; the workspace is
 * a chapter picker and opens on chapter one, because a picker that opens on the
 * last chapter is a picker whose selection you cannot see.
 */
export const firstChapterId: ProjectId = projects[0].id;
