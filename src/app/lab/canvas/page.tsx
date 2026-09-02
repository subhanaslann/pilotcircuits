import type { Metadata } from "next";
import { LabSection } from "@/components/lab/lab-primitives";
import { CanvasGallery } from "@/components/lab/canvas/canvas-gallery";
import { LampSpecimen } from "@/components/lab/canvas/lamp-specimen";
import { RingSpecimen } from "@/components/lab/canvas/ring-specimen";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getServerCopy();
  const t = copy.lab.molecules.canvas.page;
  return { title: `${t.eyebrow} · ${t.title}` };
}

export default async function CanvasPage() {
  const copy = await getServerCopy();
  const t = copy.lab.molecules.canvas;

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10">
      <header className="mb-10">
        <p className="text-overline text-ink-tertiary uppercase">
          {t.page.eyebrow}
        </p>
        <h1 className="text-h1 text-ink mt-1">{t.page.title}</h1>
        <p className="text-body text-ink-secondary mt-2 max-w-prose">
          {t.page.intro}
        </p>
      </header>

      <LabSection
        id="c-canvas"
        code="C-01 → C-17"
        title={t.section.title}
        description={t.section.description}
      >
        <CanvasGallery />
      </LabSection>

      <LabSection
        id="c-lamp"
        code="C-18"
        title="Chapter one, on the same canvas"
        description="Three parts and no breadboard. The router, the pin marks and the correction callout are the capstone's — only the build is different."
      >
        <LampSpecimen />
      </LabSection>

      <LabSection
        id="c-ring"
        code="C-24"
        title="The agent, on the bench"
        description="The ring that stands for the agent's position: it leaves the coach figure, reads, points or carries, and returns. Drawn over the canvas in screen pixels, so it is the same size at every zoom."
      >
        <RingSpecimen />
      </LabSection>
    </div>
  );
}
