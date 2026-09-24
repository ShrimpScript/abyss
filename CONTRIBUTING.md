# Contributing

## Running it

```
npm install
npm run dev
```

`npm test` runs the depth model tests. `npm run build` typechecks and builds.

## Two things that are not guessable

**Scroll is the source of truth, not depth.** `src/lib/depth.ts` gives every block of
content its own scroll station with a clamped minimum gap, so two blocks can never
overlap however close their real depths are. Depth is derived from scroll. Never
position anything by raw depth.

**Per-frame state lives outside React.** `src/lib/store.ts` holds a mutable `frame`
object that the render loop writes and reads. React state is only for discrete changes:
the current zone, the active project, the phase. Anything updating at 60fps writes to a
DOM ref or a CSS variable.

## Before opening a pull request

`E2E.md` is the verification script. It drives real Chrome, captures the whole column at
three widths, proves the lamp mechanic, and checks reduced motion and keyboard-only use.
Run the parts that touch what you changed and attach the evidence.

## Numbers

Pressure, temperature and light come from formulas in `depth.ts`. Project facts come from
`src/data/projects.ts`. Both must stay true.
