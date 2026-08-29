import type { Copy } from "@/content/i18n";

/**
 * Batch 6 · The seven projects.
 *
 * Same contract as `@/lib/agent/steps`: **structure here, words in the
 * dictionary, both keyed by the same id.** Which components a build needs and
 * how long it takes are the same in every language; what it is *called* is not.
 * Adding a locale never touches this file.
 *
 * Only Smart Parking Barrier is `ready` — it is the one with a guided
 * workbench. The other six are honestly labelled `preview`, which is a product
 * fact rather than a placeholder: `frontend-plan.md` §4 lists them by name,
 * duration and level, and the rest of each entry is written out here so seven
 * cards can be judged side by side with real content in them.
 */

export type ProjectId =
  | "smartParkingBarrier"
  | "plantGuardian"
  | "motionNightLight"
  | "miniRadar"
  | "roomClimateStation"
  | "touchlessSoapDispenser"
  | "digitalReactionGame";

export type Difficulty = "beginner" | "intermediate";

/** `ready` has a guided workbench; `preview` is announced as such (P-11). */
export type ProjectStatus = "ready" | "preview" | "inProgress";

/**
 * P-06 · The component vocabulary.
 *
 * `sensor` is deliberately generic: distance, soil moisture, motion and
 * temperature all share one mark, which is what keeps seven projects inside one
 * small set instead of growing an icon per part.
 *
 * `button` is the one addition to the nine the inventory names. The reaction
 * game is a person pressing a button when a light comes on — without it the
 * project does not exist, and calling a push button a `sensor` would be the
 * kind of small lie that makes a legend untrustworthy.
 */
export type ComponentId =
  | "board"
  | "breadboard"
  | "sensor"
  | "servo"
  | "led"
  | "resistor"
  | "jumper"
  | "usb"
  | "cardboard"
  | "button";

export const componentIds: ComponentId[] = [
  "board",
  "breadboard",
  "sensor",
  "servo",
  "led",
  "resistor",
  "jumper",
  "usb",
  "cardboard",
  "button",
];

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
    id: "smartParkingBarrier",
    slug: "smart-parking-barrier",
    minutes: 35,
    difficulty: "beginner",
    status: "ready",
    /* The only build that uses every part in the kit — see §3. */
    components: [
      "board",
      "breadboard",
      "sensor",
      "servo",
      "led",
      "resistor",
      "jumper",
      "usb",
      "cardboard",
    ],
    concepts: [
      "digitalPins",
      "triggerEcho",
      "pwmServo",
      "ledPolarity",
      "distanceMeasurement",
      "conditionalLogic",
      "mechanicalCalibration",
      "testing",
    ],
    stepCount: 7,
  },
  {
    id: "plantGuardian",
    slug: "plant-guardian",
    minutes: 45,
    difficulty: "beginner",
    status: "preview",
    components: [
      "board",
      "breadboard",
      "sensor",
      "led",
      "resistor",
      "jumper",
      "usb",
    ],
    concepts: [
      "analogReading",
      "thresholds",
      "ledPolarity",
      "conditionalLogic",
    ],
    stepCount: 6,
  },
  {
    id: "motionNightLight",
    slug: "motion-night-light",
    minutes: 25,
    difficulty: "beginner",
    status: "preview",
    components: [
      "board",
      "breadboard",
      "sensor",
      "led",
      "resistor",
      "jumper",
      "usb",
    ],
    concepts: ["digitalPins", "conditionalLogic", "ledPolarity"],
    stepCount: 5,
  },
  {
    id: "miniRadar",
    slug: "mini-radar",
    minutes: 50,
    difficulty: "intermediate",
    status: "preview",
    components: ["board", "breadboard", "sensor", "servo", "jumper", "usb"],
    concepts: [
      "pwmServo",
      "distanceMeasurement",
      "triggerEcho",
      "serialOutput",
    ],
    stepCount: 7,
  },
  {
    id: "roomClimateStation",
    slug: "room-climate-station",
    minutes: 60,
    difficulty: "intermediate",
    status: "preview",
    components: [
      "board",
      "breadboard",
      "sensor",
      "led",
      "resistor",
      "jumper",
      "usb",
    ],
    concepts: ["analogReading", "serialOutput", "thresholds", "testing"],
    stepCount: 8,
  },
  {
    id: "touchlessSoapDispenser",
    slug: "touchless-soap-dispenser",
    minutes: 40,
    difficulty: "beginner",
    status: "preview",
    components: ["board", "breadboard", "sensor", "servo", "jumper", "usb"],
    concepts: ["distanceMeasurement", "pwmServo", "conditionalLogic"],
    stepCount: 6,
  },
  {
    id: "digitalReactionGame",
    slug: "digital-reaction-game",
    minutes: 55,
    difficulty: "intermediate",
    status: "preview",
    components: [
      "board",
      "breadboard",
      "button",
      "led",
      "resistor",
      "jumper",
      "usb",
    ],
    concepts: ["timing", "digitalPins", "conditionalLogic", "testing"],
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

/** The build the dashboard offers to continue. */
export const featuredProjectId: ProjectId = "smartParkingBarrier";
