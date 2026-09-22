# MEMORY.md — Abyss

Mistakes made here once, so they are not made again.

- **The canvas was 300×150 and everything looked black.** R3F writes its own inline
  `width/height: 100%` on the Canvas container; those resolve against a root with no
  definite height, so the drawing buffer never got sized. A `className` cannot fix it —
  inline styles win. The Canvas needs `style={{ position: 'fixed', inset: 0 }}`.
- **Headless screenshots showed no 3D at all.** Chrome captures the page without the
  WebGL layer unless the context was created with `preserveDrawingBuffer`. The `?probe`
  flag turns it on for capture only. Two hours of "the background colour is broken"
  were actually "the canvas is not in the picture".
- **Lenis `scrollTo` silently did nothing.** It was being driven with
  `state.clock.elapsedTime * 1000` from R3F. Lenis animates against real rAF timestamps;
  give it `performance.now()`.
- **Content overlapped badly when scroll was linear in depth.** Beats near the surface are
  tens of metres apart and beats in the trench are thousands, so a constant px-per-metre
  either stacks content on top of itself or makes the deep water endless. Fixed by giving
  every beat its own scroll station with a clamped gap.
- **Headless `Emulation.setEmulatedMedia` cannot fake a hovering pointer.** Use
  `--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2`.
- **Frame times from an occluded window are fiction.** Chrome throttles rAF; a perfectly
  flat 5.6 ms across every scene was the tell. Measure headless on ANGLE/Vulkan instead.

## 2026-09-22 — the slop pass

**Smell**: a hero that is a dead-centre stack of eyebrow, headline, paragraph and two
buttons; bordered pills for metadata; body text tinted with an accent colour.
**Failure**: all three shipped in the first build and read as generated.
**Truth**: measured off Dovetail — the hero sits **left at 8.4% of viewport width**, and
the greys are **pure neutral** (#ffffff / #ababab / #808080, zero hue). Ours carried a
+37 blue-minus-red cast, which is what made copy look muddy on the water. In Common With
uses **label/value rows with hairline separators**, never pills.
**Mitigation**: before calling any dark UI done, check three things — is the hero
centred, is any running text tinted, and is any metadata in a bordered pill.

**Also**: renaming a type token (`--t-96` → `--t-hero`) silently drops every rule still
referencing the old name, and the element falls back to inherited size. Grep for the old
name after any token rename.

**Also**: capture scripts that click hard-coded coordinates break the moment the layout
moves, and they fail *silently* by simply not entering the page. Query the element.
