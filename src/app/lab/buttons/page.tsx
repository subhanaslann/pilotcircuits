import type { Metadata } from "next";
import { ButtonDirections } from "@/components/lab/buttons/button-directions";
import { ContrastOptions } from "@/components/lab/buttons/contrast-options";
import { DepthLayers } from "@/components/lab/buttons/depth-layers";
import { SurroundingLayers } from "@/components/lab/buttons/surrounding-layers";
import { CheckboxOptions } from "@/components/lab/buttons/checkbox-options";
import { ProgressOptions } from "@/components/lab/buttons/progress-options";
import { LabSection } from "@/components/lab/lab-primitives";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getServerCopy()).lab.atoms.buttonsLab.page;
  return { title: `${t.overline} · ${t.title}` };
}

export default async function ButtonLabPage() {
  const copy = await getServerCopy();
  const t = copy.lab.atoms.buttonsLab;

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10">
      <header className="mb-10">
        <p className="text-overline text-ink-tertiary uppercase">
          {t.page.overline}
        </p>
        <h1 className="text-h1 text-ink mt-1">{t.page.title}</h1>
        <p className="text-body text-ink-secondary mt-2 max-w-prose">
          {t.page.introBefore}{" "}
          <strong className="text-ink font-semibold">
            A · {t.directions.a.name}
          </strong>{" "}
          {t.page.introAfter}
        </p>
      </header>

      <div className="space-y-14">
        <LabSection
          id="progress"
          code={t.verdict.settled}
          title={t.sections.progress.title}
          description={t.sections.progress.description}
        >
          <ProgressOptions />
        </LabSection>

        <LabSection
          id="checkbox"
          code={t.verdict.open}
          title={t.sections.checkbox.title}
          description={t.sections.checkbox.description}
        >
          <CheckboxOptions />
        </LabSection>

        <LabSection
          id="surround"
          code={t.verdict.open}
          title={t.sections.surround.title}
          description={t.sections.surround.description}
        >
          <SurroundingLayers />
        </LabSection>

        <LabSection
          id="depth"
          code={t.verdict.open}
          title={t.sections.depth.title}
          description={t.sections.depth.description}
        >
          <DepthLayers />
        </LabSection>

        <LabSection
          id="contrast"
          code={t.verdict.open}
          title={t.sections.contrast.title}
          description={t.sections.contrast.description}
        >
          <ContrastOptions />
        </LabSection>

        <LabSection
          id="directions"
          code={t.verdict.settled}
          title={t.sections.directions.title}
          description={t.sections.directions.description}
        >
          <ButtonDirections />
        </LabSection>
      </div>
    </div>
  );
}
