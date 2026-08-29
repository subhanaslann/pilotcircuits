import { LabBlock, LabStage } from "@/components/lab/lab-primitives";
import { ComponentIcon } from "@/components/illustration/component-icons";
import { getServerCopy } from "@/content/copy-server";
import { componentIds } from "@/lib/projects/catalog";

/** The four sizes a mark actually appears at in this product. */
const SIZES = [24, 32, 40, 48];

/**
 * P-06 reviewed as a set, which is the only way it can be reviewed: ten marks
 * looked at one at a time become ten styles.
 */
export async function ComponentMarks() {
  const copy = await getServerCopy();
  const t = copy.lab.libraryLab.icons;

  return (
    <>
      <LabBlock title={t.setTitle} note={t.setNote}>
        <LabStage>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-5">
            {componentIds.map((id) => (
              <li key={id} className="flex flex-col items-center gap-2">
                <ComponentIcon id={id} size={48} />
                <span className="text-caption text-ink-secondary text-center leading-snug">
                  {copy.components[id]}
                </span>
              </li>
            ))}
          </ul>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.scaleTitle} note={t.scaleNote}>
        <LabStage>
          <div className="space-y-4">
            {SIZES.map((size) => (
              <div key={size} className="flex items-center gap-4">
                <span className="text-mono-sm tnum text-ink-tertiary w-10 shrink-0 font-mono">
                  {size}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {componentIds.map((id) => (
                    <ComponentIcon key={id} id={id} size={size} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </LabStage>
      </LabBlock>

      <LabBlock title={t.groundTitle} note={t.groundNote}>
        <div className="grid gap-4 sm:grid-cols-2">
          <LabStage>
            <div className="flex flex-wrap items-center gap-3">
              {componentIds.map((id) => (
                <ComponentIcon key={id} id={id} size={40} />
              ))}
            </div>
          </LabStage>
          <LabStage className="bg-surface-sunken">
            <div className="flex flex-wrap items-center gap-3">
              {componentIds.map((id) => (
                <ComponentIcon key={id} id={id} size={40} />
              ))}
            </div>
          </LabStage>
        </div>
      </LabBlock>

      <LabBlock title={t.notPartsTitle}>
        <p className="text-caption text-ink-tertiary max-w-prose">
          {t.notPartsNote}
        </p>
      </LabBlock>
    </>
  );
}
