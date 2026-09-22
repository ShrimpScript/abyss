import { useEffect, useRef } from 'react'
import { frame, setState, useStore } from '../lib/store'
import { onFrame } from '../lib/frameBus'
import { MAX_DEPTH, formatDepth, pressureAt, temperatureAt, zoneAt } from '../lib/depth'
import { warpTo } from '../lib/descent'
import { startAudio, stopAudio, tick } from '../lib/audio'

/** Instrument readouts. Every number here is computed from depth, never invented. */
export function Hud() {
  const phase = useStore((s) => s.phase)
  const sound = useStore((s) => s.sound)
  const zoneId = useStore((s) => s.zoneId)
  const typed = useStore((s) => s.typed)

  const depthEl = useRef<HTMLSpanElement>(null)
  const pressEl = useRef<HTMLSpanElement>(null)
  const tempEl = useRef<HTMLSpanElement>(null)
  const fillEl = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let acc = 0
    return onFrame((delta) => {
      acc += delta
      if (acc < 1 / 24) return
      acc = 0
      const d = frame.depth
      if (depthEl.current) depthEl.current.textContent = formatDepth(d)
      if (pressEl.current) pressEl.current.textContent = pressureAt(d).toFixed(0)
      if (tempEl.current) tempEl.current.textContent = temperatureAt(d).toFixed(1)
      if (fillEl.current) {
        fillEl.current.style.transform = `scaleX(${Math.min(d / MAX_DEPTH, 1)})`
      }
    })
  }, [])

  if (phase === 'gate') return null

  const zone = zoneAt(frame.depth)

  const toggleSound = () => {
    if (sound) {
      stopAudio()
      setState({ sound: false })
    } else {
      startAudio()
      tick(880)
      setState({ sound: true })
    }
  }

  return (
    <div className="hud">
      <div className="hud__top">
        <button className="hud__mark" onClick={() => warpTo(0)}>
          ShrimpScript
          <span className="mono hud__mark-sub">Surface</span>
        </button>

        <button className="hud__sound mono" onClick={toggleSound} aria-pressed={sound}>
          <span className={`hud__wave${sound ? ' is-on' : ''}`} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          {sound ? 'Sound on' : 'Sound off'}
        </button>
      </div>

      <div className="hud__zone" key={zoneId}>
        <span className="hud__zone-name">{zone.name}</span>
        <span className="mono hud__zone-latin">{zone.latin}</span>
      </div>

      <div className="hud__gauge">
        <div className="hud__depth">
          <span className="hud__depth-value" ref={depthEl}>
            0
          </span>
          <span className="mono hud__depth-unit">m</span>
        </div>
        <div className="hud__bar" aria-hidden="true">
          <span className="hud__bar-fill" ref={fillEl} />
        </div>
        <dl className="hud__readouts mono">
          <div>
            <dt>Pressure</dt>
            <dd>
              <span ref={pressEl}>1</span> atm
            </dd>
          </div>
          <div>
            <dt>Water</dt>
            <dd>
              <span ref={tempEl}>19.4</span> &deg;C
            </dd>
          </div>
        </dl>
      </div>

      {typed && (
        <div className="hud__typed mono" aria-live="polite">
          <span className="hud__typed-caret">&gt;</span> {typed}
        </div>
      )}
    </div>
  )
}
