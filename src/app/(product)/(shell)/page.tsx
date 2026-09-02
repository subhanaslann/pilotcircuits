import { ChapterLedger } from "@/components/landing/chapter-ledger";
import { CoachIntro } from "@/components/landing/coach-intro";
import { DiagnosticsStrip } from "@/components/landing/diagnostics-strip";
import { RepairAsk } from "@/components/landing/repair-ask";
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
 *   3. **The action is a control on the bench.** The product's capsule at the
 *      front-right corner of the mat, not a capsule in a card of its own. (It
 *      was a moulded plate of its own for a while — see `next-step-control`.)
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
 * So the reading half is two bands, and it carries the two things the bench
 * genuinely cannot show:
 *
 *   1. **The agent.** The lamp in the bench's corner, introduced: the five
 *      faces a call can give it, each with the sentence the bench prints for
 *      it and the tools that put it there (`coach-intro.tsx`). A stranger who
 *      has just watched the ring fix a wire is told what they watched.
 *   2. **The ladder.** This build is the last of six chapters, and the parts
 *      list grows from three to six on the way (`chapter-ledger.tsx`). Printed
 *      as a ledger in the strip's own register rather than as six cards, so the
 *      last scroll of the page does not turn it back into a dashboard.
 *
 * A third band used to close the page — the claim that nothing here is faked,
 * and the door again as a link. Both said what the bench had shown, and the
 * door is under the bench now, so the page ends on the ladder.
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

      {/* The bench and the agent, side by side — while both of them fit.

          The ask has a measure and the bench has not: 340 is the ask's own
          width, and the scene beside it is an SVG with a viewBox
          (`bench-view.tsx`) that takes the width it is handed and scales to it.
          So the bench column is the elastic one, capped at the scene's own
          frame of 920 (`scene-spec.ts`) so that a 1360px shell still puts both
          columns exactly where they have always been.

          Both were `shrink-0` until this was measured, which is what the
          shell's 1312 of usable width invites you to write — and 1312 is only
          the truth at 1360. Anywhere between `lg` and 1332 the row was 1284
          wide inside a container that was not, and the ask hung off the right
          edge with nothing to scroll to it: the sentence that names the fault
          and the button that clears it, both simply gone. Found in ChatGPT's
          in-app browser, whose pane is about 1250 — the browser this product
          is opened in for judging.

          The row exists from 1120 up, which is `layout.workbenchMin`, the
          width at which the workbench itself still keeps its canvas. Below
          that the drawing would be under 700px and the terminal beside it
          starts dropping the ends of its lines, so the page stacks instead and
          gives the bench the whole column, ask last. */}
      <div className="mx-auto w-full max-w-[1304px]">
        {/* The sheet, the terminal, the bench and the panel over one session —
            see `landing-session.tsx`. Not the product's: pressing a button on
            the entry screen must not move the build waiting at the workbench. */}
        <LandingSessionProvider>
        <div className="flex flex-col gap-6 min-[1120px]:flex-row min-[1120px]:items-stretch">
          <div className="min-w-0 min-[1120px]:max-w-[920px] min-[1120px]:flex-1">
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

          <RepairAsk className="min-[1120px]:w-[340px] min-[1120px]:shrink-0 min-[1120px]:pt-[44px]" />
        </div>
        </LandingSessionProvider>
      </div>

      {/* Below the bench: two bands, hairlines, no cards (rule 4). Kept on the
          bench's own column rather than centred in the shell, so the whole page
          reads off one left edge instead of two.

          The column above is mirrored rather than restated: `mr-[364px]` is the
          ask's 340 and the row's 24 of gap, so this measure stands under the
          one it is continuing at every width the row can take. It was
          `ml-[80px]` — (920 − 760) / 2, the right inset for a bench column that
          is always 920, and 41px wrong in the 1250 pane the moment the column
          was allowed to shrink. */}
      <div className="mx-auto w-full max-w-[1304px]">
      <div className="min-w-0 min-[1120px]:mr-[364px] min-[1120px]:max-w-[920px]">
      <div className="mx-auto max-w-[760px]">
        <section className="border-paper-line mt-16 border-t pt-9">
          <h2 className="font-condensed text-ink text-[26px] leading-none font-bold uppercase">
            {copy.landing.coachTitle}
          </h2>
          <p className="text-body-sm text-ink-secondary mt-3 max-w-[74ch]">
            {copy.landing.coachBody}
          </p>
          <CoachIntro className="mt-7" />
        </section>

        <section className="border-paper-line mt-14 border-t pt-9">
          <h2 className="font-condensed text-ink text-[26px] leading-none font-bold uppercase">
            {copy.landing.ladderTitle}
          </h2>
          <p className="text-body-sm text-ink-secondary mt-3 max-w-[74ch]">
            {copy.landing.ladderBody}
          </p>
          <ChapterLedger className="mt-7" />
        </section>
      </div>
      </div>
      </div>
    </main>
  );
}
