# E2E.md — how to prove Abyss actually works

1. **Start**: `npm run build` then `npm run preview -- --port 4180 --strictPort`.
   Wait for `http://localhost:4180/` to return 200.

2. **Exercise** (each script drives real Chrome and fails loudly on console errors):
   - `node scripts/shoot.mjs desktop` — enters through the gate, warps to all eleven
     stations, sweeps the lamp over whatever content is on screen, captures each one.
     Prints depth / zone / revealed-count per stop. Repeat with `tablet` and `phone`.
   - `node scripts/lamp.mjs` — the signature mechanic. Parks the pointer away from a deep
     plate, then sweeps the beam onto it.
   - `node scripts/a11y.mjs` — reduced motion, then keyboard only.
   - `node scripts/perf.mjs` — frame times on real hardware via ANGLE/Vulkan.

3. **Evidence**: `.shots/*.png` at 1440 / 768 / 390 across the whole column, plus
   `lamp-1-dark.png` and `lamp-2-found.png`, plus the printed tables.

## Known-good baseline
- `shoot.mjs` ends with `no console errors, no failed requests`.
- Depth and zone at each stop match the station: 70 Sunlight · 340 Twilight ·
  1,580 Midnight · 5,400 The abyss · 9,800 Hadal · 10,935 Hadal.
- `lamp.mjs`: the target plate is `false` before the sweep and `true` after.
- `a11y.mjs`: reduced motion reports `allLit: true` and `beam: 78vmax`; keyboard reports
  8 plates reached, a visible focus ring, a typed warp to 9,800 and Escape back to 0.
- `perf.mjs`: p50 and p95 both 16.7 ms at every depth — vsync-locked with no dropped
  frames, measured on the integrated Radeon, which is the slower of the two GPUs here.
