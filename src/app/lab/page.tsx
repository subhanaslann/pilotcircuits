import Link from "next/link";
import { ArrowRight, Check, CircleDashed, Loader } from "lucide-react";
import { brand } from "@/content/brand";
import { getServerCopy } from "@/content/copy-server";
import { labBatches, labTotals } from "@/content/lab-manifest";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

const statusMeta = {
  approved: { Icon: Check, cls: "text-success" },
  "in-progress": { Icon: Loader, cls: "text-warning" },
  pending: { Icon: CircleDashed, cls: "text-ink-tertiary" },
} as const;

export default async function LabIndexPage() {
  const copy = await getServerCopy();
  const t = copy.lab.molecules.index;
  const statusLabel = {
    approved: copy.lab.shell.nav.status.approved,
    "in-progress": copy.lab.shell.nav.status.inProgress,
    pending: copy.lab.shell.nav.status.pending,
  } as const;

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10">
      <header className="mb-8">
        <p className="text-overline text-ink-tertiary uppercase">
          {t.eyebrow(brand.name)}
        </p>
        <h1 className="text-h1 text-ink mt-1">{t.title}</h1>
        <p className="text-body text-ink-secondary mt-2 max-w-prose">
          {t.intro}
        </p>
        <p className="text-caption text-ink-tertiary mt-3">
          <span className="tnum">{labTotals.materials}</span>
          {t.totalsMid}
          <span className="tnum">{labTotals.batches}</span>
          {t.totalsTail}
        </p>
      </header>

      <ol className="space-y-2">
        {labBatches.map((batch) => {
          const meta = statusMeta[batch.status];
          /* The manifest holds structure; the words come from the dictionary,
             keyed by the same batch id — the lookup the lab nav also makes. */
          const words = copy.lab.shell.batches[batch.id];
          const href = batch.slug ? `/lab/${batch.slug}` : (batch.href ?? null);

          const body = (
            <>
              <span className="text-mono text-ink-tertiary tnum w-6 shrink-0 font-mono">
                {batch.index}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-h3 text-ink block">{words.title}</span>
                <span className="text-body-sm text-ink-secondary block">
                  {words.summary}
                </span>
              </span>
              <span className="text-mono-sm text-ink-tertiary tnum shrink-0 font-mono">
                {batch.count}
              </span>
              <span
                className={cn(
                  "text-caption flex w-24 shrink-0 items-center gap-1.5 font-medium",
                  meta.cls,
                )}
              >
                <meta.Icon
                  size={icon.xs}
                  strokeWidth={icon.strokeWidth}
                  aria-hidden="true"
                />
                {statusLabel[batch.status]}
              </span>
              {href ? (
                <ArrowRight
                  size={icon.sm}
                  strokeWidth={icon.strokeWidth}
                  className="text-ink-tertiary shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <span className="w-4 shrink-0" aria-hidden="true" />
              )}
            </>
          );

          return (
            <li key={batch.id}>
              {href ? (
                <Link
                  href={href}
                  className="bg-surface border-border shadow-e1 hover:shadow-e2 hover:border-border-strong flex items-center gap-4 rounded-lg border px-4 py-3 transition-all"
                >
                  {body}
                </Link>
              ) : (
                <div className="bg-surface/60 border-border flex items-center gap-4 rounded-lg border border-dashed px-4 py-3">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
