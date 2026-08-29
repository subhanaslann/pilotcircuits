import type { ReactNode } from "react";
import { layout } from "@/lib/design/tokens";

/**
 * Every specimen on this page sits in a column exactly as wide as the shipping
 * panel — 360px, minus its own padding. The batch's hardest constraint is the
 * column width, and a component reviewed at 700px will disappoint at 328.
 */
export function PanelColumn({
  title,
  padded = true,
  children,
}: {
  title: string;
  /** Off for specimens that bring their own frame, like the panel itself. */
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ width: layout.agentPanel }} className="max-w-full">
      <p className="text-overline text-ink-tertiary mb-2 uppercase">{title}</p>
      {padded ? (
        <div className="border-border bg-surface rounded-xl border px-4 py-2.5">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
