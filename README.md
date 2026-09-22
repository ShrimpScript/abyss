# Abyss

ShrimpScript's portfolio, built as one continuous descent from the ocean surface to
Challenger Deep. Eight projects are bioluminescent structures found at depth. Below
1,000 m the page goes dark and your cursor becomes the lamp that finds them.

Every readout is real: pressure is one atmosphere per 10.06 m of seawater, the temperature
curve follows the actual profile through the thermocline, and sunlight falls off
exponentially so red is gone long before the twilight zone ends.

## Running it

```
npm install
npm run dev
```

## Stack

React 19, React Three Fiber, Lenis, and a small amount of GLSL. No UI framework, no CSS
framework, no animation library. Audio is synthesised in Web Audio at runtime, so no sound
files ship with the site.

Type any project name to warp to it. `Esc` returns to the surface. `#lectern` and
`#d=4200` are shareable links into the column.

## Verifying a change

`E2E.md` is the script. It drives real Chrome, captures the whole column at three widths,
proves the lamp mechanic, checks reduced motion and keyboard-only use, and measures frame
times on actual GPU hardware.
