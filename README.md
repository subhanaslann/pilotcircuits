# PilotCircuits

PilotCircuits is a guided Arduino breadboard workbench for beginners, built for the
OpenAI WebMCP Challenge. A person wires each chapter by hand on a simulated bench
— a breathing lamp, a traffic light, a motion night-light, a plant guardian, a
touchless soap dispenser, and a pre-built capstone — while an agent connected
through [WebMCP](https://github.com/webmachinelearning/webmcp) reads the same
build: it explains what the chapter is, inspects the wiring, points the camera
at the mistake, points the bench at whichever part you ask about, verifies the
step, runs the functional test and, on request, attaches a lead itself. Tools are
registered per route with `navigator.modelContext`, so the agent only ever sees
what the page in front of it can actually do.

**Live demo:** https://pilotcircuits.com _(domain registered; goes live on deploy)_
**Video:** _(YouTube link — fill in)_

## For judges

1. Open the live URL in the **ChatGPT desktop app's browser** (WebMCP is on by
   default there), or in **Chrome 149+** with
   `chrome://flags/#enable-webmcp-testing` set to *Enabled*, then relaunch.
2. Use a window **at least 1120 px wide**. Below that the workbench folds into a
   stacked layout without the canvas, and only the five tools that make sense
   without a canvas are registered; the agent panel's header counts them
   (`9 tools available` on the full bench, `5 tools available` when folded).
3. The product opens in English. The `TR / EN` switch in the top bar changes the
   language, and every registered tool re-registers in the new one — titles,
   descriptions and refusal messages are all localised.
4. Start at `/projects`, open a chapter and press **Start building**. The agent
   panel on the right lists the tools the page has registered and shows
   `Connected via WebMCP` when the host is real.
5. Things to ask the agent on the bench: *what am I building?*
   (`explain_project` — the chapter's purpose, what each part is for and how it
   works) · *inspect my build* (findings against
   the step you are on) · *show me* (the camera frames the lead at fault) ·
   *where is the resistor?* (`point_at`, the bench points at it) ·
   *attach the lead for me* (`attach_lead`, the one tool that moves the build) ·
   *verify this step* · *run the functional test*.
6. `?demo=1` on a workbench URL opens the demo menu: scripted scenarios and a
   bench reset, for driving the story without an agent attached.

### Which tools are registered where

| route | tools |
|---|---|
| `/` | `inspect_build` · `show_correction` |
| `/projects` | `find_projects` · `open_project` · `get_project_requirements` |
| `/projects/[slug]` | `get_project_requirements` · `start_project` |
| `/workbench/[slug]` | `explain_project` · `get_build_context` · `inspect_build` · `show_correction` · `point_at` · `attach_lead` · `verify_current_step` · `navigate_build_step` · `run_functional_test` |
| `/workbench/[slug]` under 1120 px | `explain_project` · `get_build_context` · `verify_current_step` · `navigate_build_step` · `run_functional_test` |
| `/workspace` | `get_project_requirements` · `start_project` |
| `/lab/agent` | the bench's nine, against a demo build |

Tools are torn down when the route changes, and re-registered when the build or
the language changes. Without a WebMCP host the product works as an ordinary web
app; the agent panel just says so.

## Run it locally

Node 20.9 or newer.

```bash
npm ci
npm run dev      # http://localhost:3000
npm test         # vitest
npm run build    # production build
```

Chrome needs the flag above for `navigator.modelContext` to exist on
`localhost` too. The app deploys as a standard Next.js 16 application (a default
Vercel import works); every response carries `Origin-Agent-Cluster: ?1`.

## Design gallery

`/lab` is the design system the product was built from — foundations, atoms,
molecules, canvas parts, the device dock, the workbench — and `/lab/agent` is a
live agent session that registers the bench's nine tools against a demo build.

## Credits and licence

The breadboard, Arduino and component artwork on the bench is ported from
[Wokwi Elements](https://github.com/wokwi/wokwi-elements) (MIT, © Uri Shaked);
see `src/components/canvas/parts/wokwi/LICENSE`. Everything else is MIT,
© 2026 Sübhan Aslan — see [`LICENSE`](LICENSE).
