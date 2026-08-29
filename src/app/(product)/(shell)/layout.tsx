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
      <div className="mx-auto w-full max-w-shell flex-1 px-6">{children}</div>
    </>
  );
}
