import type { ReactNode } from "react";
import { ProductNav } from "@/components/shell/product-nav";

/**
 * Batch 8 · The reading shell.
 *
 * The three screens you read rather than work in: the dashboard, the library
 * and the completion summary. They share a top bar and a measure
 * (`--spacing-shell`, 1360px, fixed in Batch 0 and spent here), and they scroll
 * like documents.
 *
 * The workbench is not one of them. It sits beside this group under the same
 * provider: same build, different frame.
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ProductNav />
      {/* `overflow-x: clip`, not `hidden`. The entry screen bleeds a decorative
          field to the window edges with `w-screen`, and `100vw` counts the
          vertical scrollbar — left alone that is a horizontal scrollbar on
          every page. `clip` trims it without creating a scroll container, so
          the sticky bar above still sticks. */}
      <div className="min-w-0 flex-1 overflow-x-clip">
        <div className="mx-auto w-full max-w-shell px-6">{children}</div>
      </div>
    </>
  );
}
