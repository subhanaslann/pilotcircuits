"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Check, CircleDashed, Loader } from "lucide-react";
import { LocaleSelect } from "@/components/ui/locale-select";
import { useCopy } from "@/content/copy-provider";
import { labBatches, labTotals } from "@/content/lab-manifest";
import { brand } from "@/content/brand";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

const statusIcon = {
  approved: Check,
  "in-progress": Loader,
  pending: CircleDashed,
} as const;

export function LabNav() {
  const copy = useCopy();
  const t = copy.lab.shell.nav;
  const statusLabel = {
    approved: t.status.approved,
    "in-progress": t.status.inProgress,
    pending: t.status.pending,
  } as const;
  const pathname = usePathname();
  const approved = labBatches.filter((b) => b.status === "approved").length;

  return (
    <nav
      aria-label={t.ariaLabel}
      className="bg-surface border-border flex w-[248px] shrink-0 flex-col border-r"
    >
      <div className="border-border border-b px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href="/lab"
            className="text-h3 text-ink rounded-sm hover:text-accent transition-colors"
          >
            {brand.name} {t.labSuffix}
          </Link>
          <LocaleSelect className="-mt-0.5 shrink-0" />
        </div>
        <p className="text-caption text-ink-tertiary mt-1">
          {t.approvedOf(approved, labTotals.batches)} ·{" "}
          <span className="tnum">{t.materials(labTotals.materials)}</span>
        </p>
      </div>

      <ul className="flex-1 overflow-y-auto p-2">
        {labBatches.map((batch) => {
          const href = batch.slug ? `/lab/${batch.slug}` : (batch.href ?? null);
          const active = href ? pathname === href : false;
          const StatusIcon = statusIcon[batch.status];
          /* The manifest holds structure; the words come from the dictionary,
             keyed by the same batch id. */
          const words = copy.lab.shell.batches[batch.id];

          const inner = (
            <>
              <span
                className={cn(
                  "text-mono-sm mt-px w-4 shrink-0 font-mono",
                  active ? "text-accent" : "text-ink-tertiary",
                )}
              >
                {batch.index}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-body-sm truncate font-medium",
                      active ? "text-accent" : "text-ink",
                    )}
                  >
                    {words.title}
                  </span>
                  <StatusIcon
                    size={icon.xs}
                    strokeWidth={icon.strokeWidth}
                    aria-hidden="true"
                    className={cn(
                      "shrink-0",
                      batch.status === "approved" && "text-success",
                      batch.status === "in-progress" && "text-warning",
                      batch.status === "pending" && "text-ink-disabled",
                    )}
                  />
                  <span className="sr-only">{statusLabel[batch.status]}</span>
                </span>
                <span className="text-caption text-ink-tertiary mt-0.5 block leading-snug">
                  {words.summary}
                </span>
              </span>
            </>
          );

          return (
            <li key={batch.id}>
              {href ? (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex gap-2 rounded-md px-2.5 py-2 transition-colors",
                    active
                      ? "bg-accent-soft layer-active"
                      : "hover:bg-surface-hover",
                  )}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  className="flex cursor-default gap-2 rounded-md px-2.5 py-2 opacity-55"
                  title={t.notDesignedYet}
                >
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="border-border border-t p-2">
        <p className="text-overline text-ink-tertiary px-2.5 pt-1 pb-1.5 uppercase">
          {t.openDecisions}
        </p>
        {/* The three still waiting on a choice, on one screen. The button
            directions below are the older record: eight built, one chosen. */}
        <Link
          href="/lab/decisions"
          aria-current={pathname === "/lab/decisions" ? "page" : undefined}
          className={cn(
            "block rounded-md px-2.5 py-2 transition-colors",
            pathname === "/lab/decisions"
              ? "bg-accent-soft layer-active"
              : "hover:bg-surface-hover",
          )}
        >
          <span
            className={cn(
              "text-body-sm block font-medium",
              pathname === "/lab/decisions" ? "text-accent" : "text-ink",
            )}
          >
            {t.threeDirections}
          </span>
          <span className="text-caption text-ink-tertiary block leading-snug">
            {t.threeDirectionsHint}
          </span>
        </Link>

        <Link
          href="/lab/buttons"
          aria-current={pathname === "/lab/buttons" ? "page" : undefined}
          className={cn(
            "block rounded-md px-2.5 py-2 transition-colors",
            pathname === "/lab/buttons"
              ? "bg-accent-soft layer-active"
              : "hover:bg-surface-hover",
          )}
        >
          <span
            className={cn(
              "text-body-sm block font-medium",
              pathname === "/lab/buttons" ? "text-accent" : "text-ink",
            )}
          >
            {t.buttonDirections}
          </span>
          <span className="text-caption text-ink-tertiary block leading-snug">
            {t.buttonDirectionsHint}
          </span>
        </Link>
      </div>

      {/* Batch 8 · until this batch `/` was a placeholder that linked in here.
          The product has its own screens now, so the link runs the other way
          and the lab stops being the only place to stand. */}
      <div className="border-border border-t px-2 py-2">
        <Link
          href="/"
          className="text-body-sm text-ink-secondary hover:bg-surface-hover hover:text-ink flex items-center gap-1.5 rounded-md px-2.5 py-2 transition-colors"
        >
          <ArrowLeft
            size={icon.xs}
            strokeWidth={icon.strokeWidth}
            aria-hidden="true"
          />
          {t.backToProduct}
        </Link>
      </div>

      <div className="border-border text-caption text-ink-tertiary border-t px-4 py-3">
        {t.footer}
      </div>
    </nav>
  );
}
