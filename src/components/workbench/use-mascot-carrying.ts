"use client";

import { useSyncExternalStore } from "react";
import { carryingPart, subscribe } from "@/lib/agent/mascot";
import type { PartId } from "@/lib/circuit/placement";

const nothing = () => null;

/**
 * Which part the agent's ring has hold of right now, or `null`.
 *
 * The kit shelf asks this to fade the tile the ring is carrying — the same
 * `opacity-20` a person's own drag leaves behind — so the part is seen to
 * leave the box rather than to be copied out of it. The selector is a
 * primitive on purpose: the store ticks every frame while the ring flies, and
 * a shelf subscribed to the frame itself would redraw ten tiles sixty times a
 * second for a change that happens twice per carry.
 */
export function useMascotCarrying(): PartId | null {
  return useSyncExternalStore(subscribe, carryingPart, nothing);
}
