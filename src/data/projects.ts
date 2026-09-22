export type Project = {
  id: string
  name: string
  /** Depth in metres where this structure is found. Drives everything. */
  depth: number
  /** Specimen number on the expedition plate. */
  specimen: string
  tagline: string
  body: string
  /** The hard part — what makes it non-trivial. */
  hard: string
  stack: string[]
  meta: string
  links: { label: string; href: string }[]
  /** Bioluminescence hue for this structure, and its sonar blip. */
  color: string
  /** Which procedural set-piece renders for this project. */
  form:
    | 'lantern'
    | 'ragdoll'
    | 'market'
    | 'swarm'
    | 'atlas'
    | 'globe'
    | 'porthole'
    | 'reactor'
  /** Horizontal offset of the structure in world units; alternates to keep the fall interesting. */
  side: -1 | 1
}

export const PROJECTS: Project[] = [
  {
    id: 'vantage',
    name: 'Vantage',
    depth: 340,
    specimen: 'I',
    tagline: 'A Minecraft launcher that fits in a single scroll of this page.',
    body: 'A free Minecraft: Java Edition launcher with no ads and no telemetry. It authenticates, manages versions and mod loaders, and launches the game — in 4.9 MB, against incumbents that ship hundreds.',
    hard: 'Mojang rejects traffic that does not originate from a real client, so identity had to be proved with Minecraft’s own signing key rather than a bearer token.',
    stack: ['Rust', 'Tauri'],
    meta: '4.9 MB · public',
    links: [{ label: 'GitHub', href: 'https://github.com/ShrimpScript/vantage-launcher' }],
    color: '#7ef3c4',
    form: 'lantern',
    side: 1,
  },
  {
    id: 'tumble',
    name: 'Tumble',
    depth: 760,
    specimen: 'II',
    tagline: 'Ragdoll physics for Minecraft, solved from scratch.',
    body: 'Players and mobs collapse into jointed ragdolls on death. The player rides their own corpse as it falls. Forge 1.20.1, and the solver is pure Java — no native libraries, no engine.',
    hard: 'An XPBD constraint solver written by hand, stepped inside a game loop that was never designed to host one, staying stable at 20 ticks per second.',
    stack: ['Java', 'Forge', 'XPBD'],
    meta: 'MIT · public',
    links: [{ label: 'GitHub', href: 'https://github.com/ShrimpScript/Tumble' }],
    color: '#a8e34f',
    form: 'ragdoll',
    side: -1,
  },
  {
    id: 'glaze',
    name: 'Glaze',
    depth: 1580,
    specimen: 'III',
    tagline: 'A market terminal welded into a video game.',
    body: 'An auction-house terminal for DonutSMP, rendered inside Minecraft. Fourteen months of price history, searchable, with the spreads and volume a trader would actually want.',
    hard: 'The price feed is an undocumented endpoint with no key, no schema and no guarantees. Everything Glaze shows had to be reverse-engineered from responses.',
    stack: ['Java', 'Fabric'],
    meta: 'private',
    links: [],
    color: '#ffb457',
    form: 'market',
    side: 1,
  },
  {
    id: 'foreman',
    name: 'Foreman',
    depth: 2700,
    specimen: 'IV',
    tagline: 'Automation that plans instead of reacting.',
    body: 'A Meteor addon sitting on top of Baritone. Where most automation responds to the last frame, Foreman predicts where a target will be and commits to the intercept.',
    hard: 'Airborne trajectories are knowable. Modelling them turned a reactive bot into one that leads its target, tested against Carpet fake players in a purpose-built arena.',
    stack: ['Java', 'Baritone'],
    meta: 'private',
    links: [],
    color: '#ff7ad9',
    form: 'swarm',
    side: -1,
  },
  {
    id: 'whereabouts',
    name: 'Whereabouts',
    depth: 3950,
    specimen: 'V',
    tagline: 'GeoGuessr, without the subscription or the licensed imagery.',
    body: 'Drop into a street-level panorama anywhere on Earth and guess where you are. Daily rounds, levels and high scores, built entirely on open imagery from Mapillary and Panoramax.',
    hard: 'Free imagery is uneven. Finding rounds that are solvable but not trivial means scoring coverage density and road context before a location is ever served.',
    stack: ['TypeScript', 'MapLibre', 'Next.js'],
    meta: 'private · deployed',
    links: [],
    color: '#5ffbf1',
    form: 'globe',
    side: 1,
  },
  {
    id: 'sightline',
    name: 'Sightline',
    depth: 5400,
    specimen: 'VI',
    tagline: 'The world, live, from orbit to the street.',
    body: 'Aircraft, ships, satellites, bases, places and webcams on one globe you can zoom continuously from orbit down to a street corner. Every layer is a free public source.',
    hard: 'Half a dozen feeds updating at different rates onto one Cesium globe, without the frame rate collapsing when every one of them ticks at once.',
    stack: ['TypeScript', 'Cesium', 'Next.js'],
    meta: 'private',
    links: [],
    color: '#4a7cff',
    form: 'atlas',
    side: -1,
  },
  {
    id: 'porthole',
    name: 'Porthole',
    depth: 7300,
    specimen: 'VII',
    tagline: 'Your coding agent, in your pocket, over your own network.',
    body: 'An Android client and a Go daemon that put Claude Code on a phone over Tailscale. Start a session at the desk, keep reading it on the train, approve a diff from anywhere.',
    hard: 'A cross-site WebSocket hijack: device-level trust meant any browser on a paired device could drive the daemon. Fixed by rejecting any request carrying an Origin header at all.',
    stack: ['Kotlin', 'Go', 'Tailscale'],
    meta: 'v0.25.0 · private',
    links: [{ label: 'Docs', href: 'https://porthole-one.vercel.app' }],
    color: '#c69bff',
    form: 'porthole',
    side: 1,
  },
  {
    id: 'lectern',
    name: 'Lectern',
    depth: 9800,
    specimen: 'VIII',
    tagline: 'One engine underneath every coding agent you use.',
    body: 'Claude Code, Antigravity and OpenCode on a shared brain. A Conductor routes each task to the model best suited to it, and one session history follows you across desktop, terminal and CLI. Local-first.',
    hard: 'Three agents with three different protocols, three notions of a session and three memory models, reconciled into one engine without any of them noticing.',
    stack: ['Rust', 'Tauri', 'TypeScript'],
    meta: 'Apache-2.0 · public',
    links: [
      { label: 'GitHub', href: 'https://github.com/ShrimpScript/lectern' },
      { label: 'Site', href: 'https://getlectern.vercel.app' },
    ],
    color: '#ff2d55',
    form: 'reactor',
    side: -1,
  },
]

export const PROJECT_BY_ID = Object.fromEntries(PROJECTS.map((p) => [p.id, p]))
