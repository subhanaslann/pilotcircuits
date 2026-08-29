"use client";

import { Check, Search } from "lucide-react";
import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { brand } from "@/content/brand";
import { useCopy } from "@/content/copy-provider";
import type { foundations } from "@/content/locales/lab/foundations";
import { icon } from "@/lib/design/tokens";

type FocusCopy = (typeof foundations)["en"]["focus"];
type ContentCopy = (typeof foundations)["en"]["content"];

export function FocusRing() {
  const copy = useCopy();
  const t: FocusCopy = copy.lab.foundations.focus;

  return (
    <>
      <LabBlock title={t.ring.title} note={t.ring.note}>
        <LabStage>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="bg-accent text-ink-inverse shadow-btn-accent text-body-sm hover:bg-accent-hover h-11 rounded-full px-5 font-medium transition-colors"
            >
              {t.ring.primary}
            </button>
            <button
              type="button"
              className="bg-surface text-ink shadow-btn-surface text-body-sm hover:bg-surface-hover h-11 rounded-full px-5 font-medium transition-colors"
            >
              {t.ring.secondary}
            </button>
            <button
              type="button"
              className="bg-surface-sunken text-ink-secondary hover:bg-surface-active hover:text-ink text-body-sm h-11 rounded-full px-5 font-medium transition-colors"
            >
              {t.ring.tertiary}
            </button>
            <label className="text-body-sm text-ink inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-accent size-4 rounded-xs"
                defaultChecked
              />
              {copy.projectDetail.haveThis}
            </label>
            <div className="relative">
              <Search
                size={icon.sm}
                strokeWidth={icon.strokeWidth}
                className="text-ink-tertiary pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder={copy.library.search}
                aria-label={copy.library.search}
                className="border-border bg-surface text-body-sm text-ink placeholder:text-ink-tertiary h-11 w-52 rounded-full border pr-4 pl-9"
              />
            </div>
            <a
              href="#f-10"
              className="text-accent text-body-sm rounded-xs font-medium underline-offset-2 hover:underline"
            >
              {copy.workbench.whyThisPin}
            </a>
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.coloured.title} note={t.coloured.note}>
        <div className="bg-accent grid grid-cols-1 gap-4 rounded-lg p-5 sm:grid-cols-2">
          <button
            type="button"
            className="bg-surface text-ink text-body-sm h-11 rounded-full px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t.coloured.button}
          </button>
          <p className="text-body-sm self-center text-white/85">
            {t.coloured.caption}
          </p>
        </div>
      </LabBlock>

      <LabBlock title={t.hit.title} note={t.hit.note}>
        <LabStage>
          <div className="flex items-end gap-6">
            <div className="text-center">
              <button
                type="button"
                aria-label={t.hit.markComplete}
                className="bg-surface text-ink shadow-btn-surface hover:bg-surface-hover inline-flex size-10 items-center justify-center rounded-full transition-colors"
              >
                <Check
                  size={icon.sm}
                  strokeWidth={icon.strokeWidth}
                  aria-hidden="true"
                />
              </button>
              <p className="text-mono-sm text-ink-tertiary tnum mt-2 font-mono">
                40×40
              </p>
            </div>
            <div className="text-center">
              <button
                type="button"
                className="bg-accent text-ink-inverse shadow-btn-accent text-body-sm hover:bg-accent-hover h-11 rounded-full px-5 font-medium transition-colors"
              >
                {copy.workbench.runFullTest}
              </button>
              <p className="text-mono-sm text-ink-tertiary tnum mt-2 font-mono">
                {t.hit.tall}
              </p>
            </div>
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}

export function ContentLayer() {
  const copy = useCopy();
  const t: ContentCopy = copy.lab.foundations.content;

  return (
    <>
      <LabBlock title={t.brand.title} note={t.brand.note}>
        <LabStage className="p-0">
          <table className="w-full">
            <tbody className="text-body-sm">
              {Object.entries(brand).map(([key, value]) => (
                <tr
                  key={key}
                  className="border-border/70 border-b last:border-0"
                >
                  <td className="text-mono-sm text-ink-secondary w-40 px-5 py-2.5 font-mono">
                    brand.{key}
                  </td>
                  <td className="text-ink px-3 py-2.5">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.namespaces.title} note={t.namespaces.note}>
        <LabStage>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-4">
            {Object.keys(copy).map((namespace) => (
              <code
                key={namespace}
                className="text-mono-sm text-ink-secondary bg-surface-sunken rounded-sm px-2 py-1 font-mono"
              >
                copy.{namespace}
              </code>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.voice.title} note={t.voice.note}>
        <LabStage className="max-w-prose space-y-3">
          <div>
            <p className="text-caption text-success font-medium">
              {t.voice.good}
            </p>
            <p className="text-body text-ink">{t.voice.goodExample}</p>
          </div>
          <div>
            <p className="text-caption text-error font-medium">
              {t.voice.avoid}
            </p>
            <p className="text-body text-ink-secondary">
              {t.voice.avoidExample}
            </p>
          </div>
          <div className="border-border border-t pt-3">
            <p className="text-caption text-success font-medium">
              {t.voice.good}
            </p>
            <p className="text-body text-ink">
              {`“${copy.status.demoFeed} · ${copy.device.boardValue}”`}
            </p>
            <p className="text-caption text-ink-secondary mt-1">
              {t.voice.simulatedNote}
            </p>
          </div>
        </LabStage>
      </LabBlock>
    </>
  );
}
