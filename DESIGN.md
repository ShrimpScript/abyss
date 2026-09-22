# DESIGN.md — Abyss (ShrimpScript portfolio)
*The design contract. Build sessions follow it; design-review verifies against it.
Decisions only — no options, no "consider".*

## Product + audience
- What it is: a single-page descent from the ocean surface to Challenger Deep (10,935 m),
  where each of ShrimpScript's projects is a bioluminescent structure found at depth.
- Who it's for + the one job: developers, collaborators and hiring people who land here
  once and need to come away thinking "this person can build anything".
- Platforms that are real: web, 360px → 2560px. Desktop is the primary experience;
  mobile gets a lighter scene, never a broken one.
- Breakpoints that get pixel-checked: 390, 768, 1440.

## Brand personality
- Is: submerged, precise, alive.   Is not: corporate, neon-cyberpunk, templated.
- Reference language taken: 19th-century naturalist expedition plates (engraved display
  serif, specimen numbering, latin-style zone labels) crossed with modern submersible
  instrumentation (monospace telemetry, depth/pressure/temperature readouts).
- Signature element: below 1,000 m the page is genuinely dark and the cursor is the
  submersible lamp. Content only exists where the visitor points it.

## Color
| Token | Hex | Role |
|---|---|---|
| `--abyss` | #01040a | page background at depth |
| `--surface-water` | #2ad4c3 | epipelagic water |
| `--twilight-water` | #0a4b68 | mesopelagic water |
| `--midnight-water` | #04121f | bathypelagic water |
| `--hadal-water` | #000204 | hadal water |
| `--bone` | #e8eef2 | primary text |
| `--bone-dim` | #7d929e | secondary text, telemetry labels |
| `--biolum` | #5ffbf1 | default bioluminescence, links, lamp core |
| `--biolum-deep` | #4a7cff | deep accent |
| `--dragonfish` | #ff2d55 | hadal-only red (the one warm colour, used sparingly) |
- Water colour is driven by depth, not by a theme toggle. Red wavelength is removed first,
  as it is in real water; by 1,000 m only blue-green remains.
- Each project carries its own bioluminescence hue so the sonar rail is readable.
- Dark mode: the site is dark-only by design. `prefers-color-scheme: light` is ignored.
- Contrast: body text ≥ 4.5:1 against its panel, telemetry ≥ 3:1. Text inside the dark
  zones sits on a panel with its own backdrop, never on raw black-on-black.

## Type
- Display: **Bodoni Moda** (variable, optical size) — wordmark, zone names, project names.
  High contrast, engraved, used only at ≥ 40px where its hairlines survive.
- Body: **Newsreader** (variable, optical size) — prose in project panels and the intro.
- Utility/data: **IBM Plex Mono** — depth, pressure, temperature, tags, coordinates,
  the sonar rail, all HUD chrome. Uppercase with positive tracking for labels.
- Never: Inter, Roboto, Poppins, Montserrat, Space Grotesk, system-ui as a display face.
- Scale: 12 / 14 / 16 / 19 / 24 / 34 / 56 / 96 / clamp to viewport for the wordmark.
  Body line-height 1.6, display line-height 0.95.

## Motion budget
- Budget: expressive. This is the product.
- Tokens: fast 140ms · base 260ms · slow 700ms · zone crossfade 1200ms.
  Enter ease-out (cubic-bezier(.16,1,.3,1)), exit ease-in.
- Scroll is smoothed (Lenis, lerp ~0.075) so the descent has mass. **Scroll** is the single
  source of truth; depth is derived from it. Every block of content owns a scroll station
  with a minimum gap of 860px, so two blocks can never overlap however close their depths
  are. The camera falls at a constant rate through scroll, which means the depth readout
  crawls through the crowded shallows and races through the empty trench. That variance is
  the point: it makes the deep water feel like distance.
- Animates: transform, opacity, filter, mask position, shader uniforms.
  Never animates: layout properties (width/height/top/left), font-size of body copy.
- Signature moment: crossing 1,000 m. The ambient light dies over ~400 m of scroll, the
  lamp takes over, and the first structure resolves out of the dark as the beam finds it.
- `prefers-reduced-motion`: lamp becomes a wide soft glow that does not require movement,
  bloom and chromatic aberration are disabled, particle count drops, scroll becomes native.

## Voice
- Copy register: expedition log. Plain, specific, present tense, sentence case.
  No exclamation marks, no "passionate about", no "crafting delightful experiences".
- Project copy leads with what the thing does, then what it is built in, then the hard part.
- Buttons say what they do: "Begin descent", "Open on GitHub", "Surface".
- Numbers are real: real star counts, real languages, real file sizes. Never invented.

## Do / Don't
- DO make every readout correspond to something real — depth drives pressure and
  temperature by actual formula, not random jitter.
- DO give each project a distinct procedural set-piece; no repeated geometry with a
  different colour.
- DO keep a way out at all times: the sonar rail warps to any project, typing a project
  name warps to it, and "Surface" returns to 0 m.
- DON'T use stock photography, emoji, or icon-font logos.
- DON'T put a fake terminal, fake "Connected" status, or a pulsing "live" dot anywhere.
- DON'T autoplay audio. Sound is offered once at the gate and is off until accepted.
- DON'T let the long scroll be the only navigation.
- DON'T ship a scene that drops below 50fps on the target machine at 1440p.

## Quality floor (non-negotiable, verified by design-review)
- Every interactive element works or doesn't exist. No fake status, no dead buttons.
- Usable at 360px wide, 200% text zoom, keyboard only, touch (44px targets).
- Keyboard: Tab reaches every project, Enter opens its links, Escape surfaces.
- Screenshots at 390 / 768 / 1440 at four depths are the proof of done.
