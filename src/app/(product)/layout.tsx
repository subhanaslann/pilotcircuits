import type { ReactNode } from "react";
import { BuildProvider } from "@/components/build/build-provider";

/**
 * Batch 8 · Everything the product does, over one build.
 *
 * A route group rather than a folder, so `/`, `/projects`, `/workbench/…` and
 * `/complete/…` keep the URLs §5 promises while sharing the
 * one thing they have to share.
 *
 * This layout adds no markup at all. The shell — the top bar and the content
 * measure — is one level further in, because the workbench is inside this
 * provider and outside that shell: it carries the same build but draws its own
 * control bar (§6.1) and needs the full viewport.
 *
 * The design lab is deliberately not under here. See `build-provider.tsx`.
 */
export default function ProductLayout({ children }: { children: ReactNode }) {
  return <BuildProvider>{children}</BuildProvider>;
}
