/**
 * Design-lab manifest.
 *
 * Mirrors `docs/design-system-inventory.md`. The lab route reads this so the
 * inventory, the navigation and the review checklist can never drift apart.
 *
 * Structure only: ids, order, counts, statuses, routes. What each batch is
 * *called* lives in `copy.lab.shell.batches`, keyed by the same id — a batch
 * does not change identity when the language does.
 */

export type BatchStatus = "pending" | "in-progress" | "approved";

export type LabBatchId =
  | "foundations"
  | "atoms"
  | "molecules"
  | "canvas"
  | "agent"
  | "device"
  | "library"
  | "workbench"
  | "screens";

export interface LabBatch {
  id: LabBatchId;
  index: number;
  /** Route segment under /lab, or null while the batch has no page yet. */
  slug: string | null;
  /**
   * Batch 8 · where to look at this batch, when that is not a lab page.
   *
   * The screens batch has no `/lab/screens` and never will: its materials are
   * the product's own routes. Without this it rendered dimmed and captioned
   * `Not designed yet` — the one row in the list that was approved and looked
   * like the opposite.
   */
  href?: string;
  count: number;
  status: BatchStatus;
}

export const labBatches: LabBatch[] = [
  {
    id: "foundations",
    index: 0,
    slug: "foundations",
    count: 10,
    status: "approved",
  },
  {
    id: "atoms",
    index: 1,
    slug: "atoms",
    count: 22,
    status: "approved",
  },
  {
    id: "molecules",
    index: 2,
    slug: "molecules",
    count: 17,
    status: "approved",
  },
  {
    id: "canvas",
    index: 3,
    slug: "canvas",
    count: 23,
    status: "approved",
  },
  {
    id: "agent",
    index: 4,
    slug: "agent",
    count: 15,
    status: "approved",
  },
  {
    id: "device",
    index: 5,
    slug: "device",
    count: 7,
    status: "approved",
  },
  {
    id: "library",
    index: 6,
    slug: "library",
    count: 11,
    status: "approved",
  },
  {
    id: "workbench",
    index: 7,
    slug: "workbench",
    count: 11,
    status: "approved",
  },
  {
    id: "screens",
    index: 8,
    /* The only batch whose gallery is the product itself: S-01…S-06 are real
       routes, so there is no `/lab/screens` to link to. */
    slug: null,
    href: "/",
    count: 6,
    status: "approved",
  },
];

export const labTotals = {
  materials: labBatches.reduce((sum, batch) => sum + batch.count, 0),
  batches: labBatches.length,
};
