# AGENTS.md — Abyss

## What this is
ShrimpScript's portfolio, built as a single continuous descent from the ocean surface to
Challenger Deep (10,935 m). Eight projects are bioluminescent structures found at depth.
Below 1,000 m the page goes genuinely dark and the visitor's cursor becomes the lamp that
finds them. React + React Three Fiber + Lenis, no framework beyond Vite.

## Run / build / test
- dev: `npm run dev`
- build: `npm run build` (runs `tsc -b` first, so it also typechecks)
- preview: `npm run preview -- --port 4180 --strictPort`
- lint: `npx oxlint src`

## Validate end-to-end (see E2E.md)
`npm run build && npm run preview -- --port 4180 --strictPort` then, in another shell:
`node scripts/shoot.mjs desktop` · `node scripts/lamp.mjs` · `node scripts/a11y.mjs` ·
`node scripts/perf.mjs`. Screenshots land in `.shots/` (gitignored).

## Conventions that differ from defaults
- **Scroll is the single source of truth, not depth.** `src/lib/depth.ts` defines BEATS:
  every block of content owns a scroll station, with a minimum gap so nothing can overlap.
  Depth is *derived* from scroll, which is why the readout speeds up and slows down while
  the camera falls at a constant rate. Never position anything by raw depth.
- **Per-frame state lives outside React** in `src/lib/store.ts` (`frame`). React state is
  only for discrete changes (zone, active project, phase). Anything that updates at 60fps
  writes to a DOM ref or a CSS variable, never to `useState`.
- One clock: `tickDescent` runs first inside the Canvas and drives Lenis, the frame bus,
  and the CSS variables. Lenis needs `performance.now()`, not the renderer clock.
- `<Canvas>` needs an explicit `position: fixed; inset: 0` in its `style` prop. R3F's own
  inline styles resolve against a root with no definite height and the drawing buffer ends
  up 300x150.
- Screenshots need `?probe`, which turns on `preserveDrawingBuffer`. Without it headless
  Chrome captures the page with no WebGL layer at all and everything looks black.
- Headless screenshots use SwiftShader; only `scripts/perf.mjs` (ANGLE/Vulkan) produces
  frame times that mean anything.

## Boundaries
- Never invent a number. Pressure, temperature and sunlight come from formulas in
  `depth.ts`; project facts come from `src/data/projects.ts` and must be true.
- Ask before: changing the beat order or the project set, deploying to production.
