import type { Metadata } from "next";
import { DecisionBlock } from "@/components/lab/decisions/decision-block";
import { CardGrid } from "@/components/lab/decisions/card-pair";
import {
  TelemetryA,
  TelemetryB,
} from "@/components/lab/decisions/telemetry-pair";
import { CameraDirection } from "@/components/lab/workbench/camera-directions";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getServerCopy()).lab.decisions.page;
  return { title: `${t.overline} · ${t.title}` };
}

/**
 * The decisions desk.
 *
 * Three batches ended with a question and left both answers standing rather
 * than picking one — the tradition `/lab/buttons` started. It worked, and then
 * it accumulated: by Batch 7 the three live questions sat on three different
 * pages, which is the wrong way to answer them. Two of the three turned out to
 * be the same question at different distances (*how much should a surface
 * say*), and that only became visible with them on one screen. All three were
 * answered in one pass.
 *
 * The page stays after the answers, as the record. Every direction here is the
 * component that is in the product, fed the content it is fed — nothing was
 * rebuilt for this page, and the arguments stay on the pages the directions
 * were built on.
 */
export default async function DecisionsPage() {
  const copy = await getServerCopy();
  const t = copy.lab.decisions;
  const device = copy.lab.deviceLab.serial;
  const cards = copy.lab.libraryLab.cards;
  const camera = copy.lab.workbenchLab.camera;

  const sections = [
    { id: "d-04", title: t.telemetry.title },
    { id: "p-01", title: t.card.title },
    { id: "w-06", title: t.camera.title },
  ];

  return (
    <div className="mx-auto max-w-[1512px] px-8 py-10">
      <header className="mb-10">
        <p className="text-overline text-ink-tertiary uppercase">
          {t.page.overline}
        </p>
        <h1 className="text-h1 text-ink mt-1">{t.page.title}</h1>
        <p className="text-body text-ink-secondary mt-2 max-w-prose">
          {t.page.intro}
        </p>
        <p className="text-body-sm text-ink-secondary mt-3 max-w-prose">
          {t.page.note}
        </p>

        <nav
          aria-label={t.page.sectionsNav}
          className="mt-5 flex flex-wrap gap-1.5"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="border-border bg-surface text-caption text-ink-secondary hover:bg-surface-hover hover:text-ink rounded-full border px-2.5 py-1 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </header>

      <div className="space-y-14">
        <DecisionBlock
          id="d-04"
          code={t.telemetry.code}
          title={t.telemetry.title}
          question={t.telemetry.question}
          settled={t.settled.telemetry}
          chosen="a"
          chosenLabel={t.page.chosen}
          href="/lab/device#d-serial"
          hrefLabel={t.page.seeFull}
          aLabel={device.directionA}
          aNote={device.directionANote}
          bLabel={device.directionB}
          bNote={device.directionBNote}
          a={<TelemetryA />}
          b={<TelemetryB />}
        />

        <DecisionBlock
          id="p-01"
          code={t.card.code}
          title={t.card.title}
          question={t.card.question}
          settled={t.settled.card}
          chosen="a"
          chosenLabel={t.page.chosen}
          hint={t.card.hint}
          href="/lab/library#p-cards"
          hrefLabel={t.page.seeFull}
          aLabel={cards.fullTitle}
          aNote={cards.fullNote}
          bLabel={cards.calmTitle}
          bNote={cards.calmNote}
          stacked
          a={<CardGrid variant="full" copy={copy} />}
          b={<CardGrid variant="calm" copy={copy} />}
        />

        <DecisionBlock
          id="w-06"
          code={t.camera.code}
          title={t.camera.title}
          question={t.camera.question}
          settled={t.settled.camera}
          chosen="b"
          chosenLabel={t.page.chosen}
          href="/lab/workbench#w-camera"
          hrefLabel={t.page.seeFull}
          aLabel={camera.captureTitle}
          aNote={camera.captureNote}
          bLabel={camera.plateTitle}
          bNote={camera.plateNote}
          a={<CameraDirection variant="capture" />}
          b={<CameraDirection variant="plate" />}
        />
      </div>
    </div>
  );
}
