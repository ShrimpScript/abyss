import { PROJECTS } from '../data/projects'

/** Challenger Deep, the deepest surveyed point on Earth. */
export const MAX_DEPTH = 10935

/** World units per pixel of scroll. Keeps the visual fall rate constant. */
export const WORLD_PER_PX = 0.021

export type Zone = {
  id: string
  name: string
  latin: string
  from: number
  to: number
  water: [number, number, number]
  note: string
}

export const ZONES: Zone[] = [
  {
    id: 'surface',
    name: 'Surface',
    latin: 'Interfacies',
    from: 0,
    to: 12,
    water: [0.13, 0.36, 0.38],
    note: 'Air above, water below.',
  },
  {
    id: 'epipelagic',
    name: 'Sunlight zone',
    latin: 'Epipelagic',
    from: 12,
    to: 200,
    water: [0.04, 0.24, 0.29],
    note: 'Everything that photosynthesises lives here.',
  },
  {
    id: 'mesopelagic',
    name: 'Twilight zone',
    latin: 'Mesopelagic',
    from: 200,
    to: 1000,
    water: [0.009, 0.085, 0.17],
    note: 'Red light is already gone. Blood runs black down here.',
  },
  {
    id: 'bathypelagic',
    name: 'Midnight zone',
    latin: 'Bathypelagic',
    from: 1000,
    to: 4000,
    water: [0.0025, 0.022, 0.05],
    note: 'No sunlight reaches this far. Every light you see is made by something alive.',
  },
  {
    id: 'abyssopelagic',
    name: 'The abyss',
    latin: 'Abyssopelagic',
    from: 4000,
    to: 6000,
    water: [0.0012, 0.008, 0.019],
    note: 'Near freezing, four hundred atmospheres, and still inhabited.',
  },
  {
    id: 'hadal',
    name: 'Hadal zone',
    latin: 'Hadopelagic',
    from: 6000,
    to: MAX_DEPTH,
    water: [0.0005, 0.003, 0.008],
    note: 'Named for Hades. Only trenches go this deep.',
  },
]

/* ---------------------------------------------------------------------------
 * Pacing
 *
 * Scroll is not linear in depth. Every beat of the descent gets its own slot so
 * nothing can ever overlap, and the empty water between structures is crossed
 * quickly. The camera moves at a constant rate through SCROLL, which is why the
 * fall feels even while the depth readout speeds up and slows down.
 * ------------------------------------------------------------------------- */

export type BeatKind = 'intro' | 'zone' | 'notice' | 'project' | 'floor'
export type Beat = { id: string; kind: BeatKind; depth: number; scroll: number }

const PX_PER_METRE = 1.0
const MIN_GAP = 860
const MAX_GAP = 1560
const LEAD_IN = 780
/** Room after the floor so the last beat can sit centred. */
export const RUN_OUT = 640

const RAW: { id: string; kind: BeatKind; depth: number }[] = [
  ...ZONES.slice(1).map((z) => ({ id: `zone-${z.id}`, kind: 'zone' as const, depth: z.from })),
  { id: 'intro', kind: 'intro', depth: 70 },
  { id: 'notice', kind: 'notice', depth: 880 },
  ...PROJECTS.map((p) => ({ id: p.id, kind: 'project' as const, depth: p.depth })),
  { id: 'floor', kind: 'floor', depth: MAX_DEPTH },
]

export const BEATS: Beat[] = (() => {
  const sorted = [...RAW].sort((a, b) => a.depth - b.depth)
  let acc = LEAD_IN
  return sorted.map((b, i) => {
    if (i > 0) {
      const raw = (b.depth - sorted[i - 1].depth) * PX_PER_METRE
      acc += clamp(raw, MIN_GAP, MAX_GAP)
    }
    return { ...b, scroll: Math.round(acc) }
  })
})()

const BEAT_BY_ID = Object.fromEntries(BEATS.map((b) => [b.id, b]))

/** Total scroll to reach the last beat. The page is taller than this by one viewport. */
export const TOTAL_SCROLL_PX = BEATS[BEATS.length - 1].scroll

/** Anchors for the depth <-> scroll mapping, including the surface. */
const ANCHORS: { d: number; s: number }[] = [{ d: 0, s: 0 }, ...BEATS.map((b) => ({ d: b.depth, s: b.scroll }))]

export function beatScroll(id: string): number {
  return BEAT_BY_ID[id]?.scroll ?? 0
}

export function depthToScroll(depth: number): number {
  const d = clamp(depth, 0, MAX_DEPTH)
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i]
    const b = ANCHORS[i + 1]
    if (d <= b.d) {
      const span = b.d - a.d
      const t = span <= 0 ? 0 : (d - a.d) / span
      return a.s + (b.s - a.s) * t
    }
  }
  return TOTAL_SCROLL_PX
}

export function scrollToDepth(scroll: number): number {
  const s = clamp(scroll, 0, TOTAL_SCROLL_PX)
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i]
    const b = ANCHORS[i + 1]
    if (s <= b.s) {
      const span = b.s - a.s
      const t = span <= 0 ? 0 : (s - a.s) / span
      return a.d + (b.d - a.d) * t
    }
  }
  return MAX_DEPTH
}

/* ---------------------------------------------------------------------------
 * Physics. Every readout on screen comes from one of these.
 * ------------------------------------------------------------------------- */

export function zoneAt(depth: number): Zone {
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (depth >= ZONES[i].from) return ZONES[i]
  }
  return ZONES[0]
}

/** Seawater pressure in atmospheres. One atmosphere per 10.06 m, plus the air above. */
export function pressureAt(depth: number): number {
  return 1 + depth / 10.06
}

const TEMP_PROFILE: [number, number][] = [
  [0, 19.4],
  [100, 17.8],
  [300, 11.2],
  [700, 6.1],
  [1000, 4.4],
  [2000, 2.8],
  [4000, 1.8],
  [6000, 1.5],
  [8000, 1.9],
  [MAX_DEPTH, 2.4],
]

/** Water temperature in Celsius, through the real profile. */
export function temperatureAt(depth: number): number {
  for (let i = 0; i < TEMP_PROFILE.length - 1; i++) {
    const [d0, t0] = TEMP_PROFILE[i]
    const [d1, t1] = TEMP_PROFILE[i + 1]
    if (depth <= d1) return t0 + (t1 - t0) * ((depth - d0) / (d1 - d0))
  }
  return TEMP_PROFILE[TEMP_PROFILE.length - 1][1]
}

/** Fraction of surface sunlight remaining. The photic zone is over by 200 m. */
export function sunlightAt(depth: number): number {
  if (depth <= 0) return 1
  return Math.exp(-depth / 92)
}

/** How much of the lighting the visitor's lamp is responsible for, 0 to 1. */
export function lampAuthorityAt(depth: number): number {
  return smoothstep(760, 1400, depth)
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function waterColourAt(depth: number): [number, number, number] {
  for (let i = 0; i < ZONES.length - 1; i++) {
    const a = ZONES[i]
    const b = ZONES[i + 1]
    if (depth <= b.from) {
      const t = smoothstep(a.from, b.from, depth)
      return [
        lerp(a.water[0], b.water[0], t),
        lerp(a.water[1], b.water[1], t),
        lerp(a.water[2], b.water[2], t),
      ]
    }
  }
  return ZONES[ZONES.length - 1].water
}

/** World height for a scroll position. The camera and every structure use this. */
export function worldYFromScroll(scroll: number): number {
  return -scroll * WORLD_PER_PX
}

/** The project currently in range, judged in scroll distance so pacing stays even. */
export function nearestProject(scroll: number, within = 560) {
  let best: (typeof PROJECTS)[number] | null = null
  let bestDist = Infinity
  for (const p of PROJECTS) {
    const d = Math.abs(beatScroll(p.id) - scroll)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return bestDist <= within ? best : null
}

export function formatDepth(depth: number): string {
  return Math.round(Math.max(0, depth)).toLocaleString('en-US')
}
