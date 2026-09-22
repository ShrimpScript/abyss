import { clamp, smoothstep } from './depth'

/**
 * Everything here is synthesised at runtime — no audio files ship with the site.
 * The bed is two detuned oscillators through a low-pass that closes as you descend,
 * so the water audibly thickens.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let bedFilter: BiquadFilterNode | null = null
let bedGain: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let started = false

function makeNoise(c: AudioContext) {
  const len = c.sampleRate * 2
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    // Brown noise. Closer to water and hull than white.
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.2
  }
  return buf
}

export function startAudio() {
  if (started) return
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  started = true

  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  bedFilter = ctx.createBiquadFilter()
  bedFilter.type = 'lowpass'
  bedFilter.frequency.value = 900
  bedFilter.Q.value = 0.6
  bedFilter.connect(master)

  bedGain = ctx.createGain()
  bedGain.gain.value = 0.5
  bedGain.connect(bedFilter)

  // Two drones a hair apart, so they beat slowly against each other.
  for (const [freq, gain] of [
    [41.2, 0.5],
    [41.9, 0.4],
    [82.4, 0.16],
  ] as const) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = gain
    osc.connect(g).connect(bedGain)
    osc.start()
  }

  noiseBuffer = makeNoise(ctx)

  // Water movement under the drone.
  const wash = ctx.createBufferSource()
  wash.buffer = noiseBuffer
  wash.loop = true
  const washFilter = ctx.createBiquadFilter()
  washFilter.type = 'bandpass'
  washFilter.frequency.value = 340
  washFilter.Q.value = 0.8
  const washGain = ctx.createGain()
  washGain.gain.value = 0.11
  wash.connect(washFilter).connect(washGain).connect(bedFilter)
  wash.start()

  master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.4)
}

export function stopAudio() {
  if (!ctx || !master) return
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
  const c = ctx
  window.setTimeout(() => {
    c.close().catch(() => {})
  }, 600)
  ctx = null
  master = null
  bedFilter = null
  bedGain = null
  started = false
}

export function audioRunning() {
  return started && ctx?.state === 'running'
}

/** Called each frame. Depth closes the filter; speed opens the wash. */
export function updateAudio(depth: number, speed: number) {
  if (!ctx || !bedFilter || !bedGain) return
  const t = ctx.currentTime
  const closed = smoothstep(0, 9000, depth)
  bedFilter.frequency.setTargetAtTime(880 - closed * 640, t, 0.5)
  bedGain.gain.setTargetAtTime(0.42 + clamp(speed / 2400, 0, 1) * 0.3, t, 0.3)
}

/** A single sonar return. Fired when a structure comes into range. */
export function ping(hz = 660) {
  if (!ctx || !master) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(hz, t)
  osc.frequency.exponentialRampToValueAtTime(hz * 0.55, t + 0.5)

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.16, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5)

  // A little tail, as if the return came back off something.
  const delay = ctx.createDelay(1)
  delay.delayTime.value = 0.26
  const fb = ctx.createGain()
  fb.gain.value = 0.32

  osc.connect(g)
  g.connect(master)
  g.connect(delay)
  delay.connect(fb)
  fb.connect(delay)
  fb.connect(master)

  osc.start(t)
  osc.stop(t + 1.6)
}

/** Pressure working on the hull. Gets more frequent the deeper you go. */
export function creak(intensity = 1) {
  if (!ctx || !master || !noiseBuffer) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.playbackRate.value = 0.12 + Math.random() * 0.2

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(120 + Math.random() * 260, t)
  filter.frequency.exponentialRampToValueAtTime(70, t + 1.1)
  filter.Q.value = 7

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.09 * intensity, t + 0.18)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)

  src.connect(filter).connect(g).connect(master)
  src.start(t)
  src.stop(t + 1.6)
}

/** UI feedback. Short, dry, quiet. */
export function tick(hz = 1400) {
  if (!ctx || !master) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = hz
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.05, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + 0.12)
}
