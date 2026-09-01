import { ChapterLedger } from "@/components/landing/chapter-ledger";
import { DiagnosticsStrip } from "@/components/landing/diagnostics-strip";
import { RepairAsk } from "@/components/landing/repair-ask";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingSessionProvider } from "@/components/landing/landing-session";
import { WorkshopScene } from "@/components/landing/scene/workshop-scene";
import { getServerCopy } from "@/content/copy-server";
import { watchedPin } from "@/lib/agent/workshop-log";
import { partNumbers } from "@/lib/circuit/smart-parking-barrier";

/**
 * S-01 · `/` — the entry screen.
 *
 * **Direction: the workbench itself.** The screen this replaces was an
 * instrument column — a compact stack of readings in the middle of a wide quiet
 * page — and the reasoning behind it was right about density and wrong about
 * *what the object is*. Read on a real screen it was still a dashboard: a
 * rounded dark panel with a picture in it, a rounded white card with a table in
 * it, a third card with a blue button in it, each floating in its own pool of
 * air. Three cards is a dashboard no matter how tightly they are packed.
 *
 * So the page is now one surface rather than a collection of panels, and the
 * three decisions that carry that are all subtractions:
 *
 *   1. **The strip is one block.** The build sheet and the agent's terminal
 *      share an edge — no gap, no radius, no shadow, no titles above them.
 *      Nothing else on this screen changed as much for as little code.
 *   2. **The build is a photograph, not a diagram.** A cutting mat in
 *      perspective running past the reading measure on both sides, with a
 *      full-length breadboard as the substrate and everything else standing in
 *      it (`scene/`). The old still was the workbench canvas cropped, which is
 *      how it ended up as a large dark card.
 *   3. **The action is a control on the bench.** A moulded plate screwed to the
 *      front-right corner of the board, not a capsule in a card of its own.
 *
 * What did not change: every number on the page is still read from the same
 * place the product reads it, so nothing here can quietly stop being true — and
 * there is still exactly one action above the fold.
 *
 * ## Below the bench
 *
 * Four bands of prose used to stand here — what you are building, the two
 * faults, the six tools, how it works, a closing claim and a second button —
 * and every one of them said again, in words, something the half-page above had
 * just *shown*. The fault was named four times over: in the terminal, in the
 * ask, in a list, and as a count in the sheet. Prose that re-explains a working
 * demonstration reads as a defence of it.
 *
 * So the reading half is now two bands, and it carries the two things the bench
 * genuinely cannot show:
 *
 *   1. **The ladder.** This build is the last of six chapters, and the parts
 *      list grows from three to six on the way (`chapter-ledger.tsx`). Printed
 *      as a ledger in the strip's own register rather than as six cards, so the
 *      last scroll of the page does not turn it back into a dashboard.
 *   2. **The claim.** That nothing here is faked — no camera, no serial port,
 *      no upload — and the door, which is a link rather than a second capsule.
 */
export default async function LandingPage() {
  const copy = await getServerCopy();

  return (
    <main className="relative pb-24">
      {/* The bench paper, full bleed. Faint engineering dots on a cool ground:
          at a reading distance it is not a pattern, it just stops the wide
          margins from being blank white. */}
      <div
        aria-hidden="true"
        className="grid-paper pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2"
      />

      {/* The bench and the agent, side by side.
          920 + 24 + 360 = 1304, inside the shell's 1312 of usable width — and
          none of those three numbers is chosen here. 920 is the scene's own
          frame (`scene-spec.ts`), 360 is the panel's own width in the workbench
          (`tokens.ts` `layout.agentPanel`), so the entry screen is composed out
          of the two objects at the sizes they already are.

          Below `lg` it stacks, panel last: on a phone the bench is what the
          screen is about and a 360px column of tabs above it is not. */}
      <div className="mx-auto w-full max-w-[1304px]">
        {/* The sheet, the terminal, the bench and the panel over one session —
            see `landing-session.tsx`. Not the product's: pressing a button on
            the entry screen must not move the build waiting at the workbench. */}
        <LandingSessionProvider>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="min-w-0 lg:w-[920px] lg:shrink-0">
            {/* The reading measure. Narrower than the bench under it, which is
                the point: the mat runs past the text. */}
            <div className="mx-auto max-w-[760px]">
              <section className="pt-[38px]">
                <h1 className="font-condensed text-ink text-[38px] leading-[0.98] font-bold tracking-[0.004em] uppercase">
                  {copy.landing.designation}
                </h1>
                {/* One line, and a technical one: the kit, and what the agent
                    is watching right now. Both read from the build rather than
                    written out — the pin comes off the circuit graph. */}
                <p className="font-condensed text-ink-secondary mt-[6px] text-[17px] leading-[1.15]">
                  {copy.landing.sub(
                    partNumbers.board,
                    partNumbers.sensor,
                    partNumbers.servo,
                    watchedPin,
                  )}
                </p>
              </section>

              <DiagnosticsStrip className="mt-[24px]" />
            </div>

            <WorkshopScene className="mt-[14px]" />
          </div>

          <RepairAsk className="lg:w-[340px] lg:shrink-0 lg:pt-[44px]" />
        </div>
        </LandingSessionProvider>
      </div>

      {/* Below the bench: two bands, hairlines, no cards (rule 4). Kept on the
          bench's own column rather than centred in the shell, so the whole page
          reads off one left edge instead of two. */}
      <div className="mx-auto w-full max-w-[1304px]">
      <div className="mx-auto max-w-[760px] lg:mx-0 lg:ml-[80px]">
        <section className="border-paper-line mt-16 border-t pt-9">
          <h2 className="font-condensed text-ink text-[26px] leading-none font-bold uppercase">
            {copy.landing.ladderTitle}
          </h2>
          <p className="text-body-sm text-ink-secondary mt-3 max-w-[74ch]">
            {copy.landing.ladderBody}
          </p>
          <ChapterLedger className="mt-7" />
        </section>

        <section className="border-paper-line mt-14 border-t pt-9">
          <h2 className="font-condensed text-ink text-[26px] leading-none font-bold uppercase">
            {copy.landing.closingTitle}
          </h2>
          <p className="text-body-sm text-ink-secondary mt-3 max-w-[74ch]">
            {copy.landing.closingBody}
          </p>
          <LandingCta className="mt-6" />
        </section>
      </div>
      </div>
    </main>
  );
}
