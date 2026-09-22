import { useEffect, useRef, useState } from 'react'
import { setState, useStore } from '../lib/store'
import { startAudio, tick } from '../lib/audio'

const HEADLINE = ['Eight things I built,', 'and the part of each', 'that was hard.']

/**
 * The surface. Composition is left-set at the measured hero inset rather than a centred
 * stack, with the instrument labels pinned to the corners of a hairline frame. The name
 * is a label here; the claim is the headline.
 */
export function Gate() {
  const phase = useStore((s) => s.phase)
  const [leaving, setLeaving] = useState(false)
  const first = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (phase === 'gate') first.current?.focus({ preventScroll: true })
  }, [phase])

  if (phase === 'diving') return null

  const enter = (sound: boolean) => {
    if (leaving) return
    if (sound) {
      startAudio()
      tick(880)
      setState({ sound: true })
    }
    setLeaving(true)
    window.setTimeout(() => setState({ phase: 'diving' }), 1000)
  }

  return (
    <div className={`gate${leaving ? ' is-leaving' : ''}`}>
      <div className="frame" aria-hidden="true">
        <span className="frame__grid" />
        <span className="frame__box" />
        <i className="frame__tick frame__tick--tl" />
        <i className="frame__tick frame__tick--tr" />
        <i className="frame__tick frame__tick--bl" />
        <i className="frame__tick frame__tick--br" />
      </div>

      <div className="gate__layout">
        <p className="mono gate__id">ShrimpScript</p>
        <p className="mono gate__coord">11&deg;22.4&prime;N&ensp;142&deg;35.5&prime;E</p>

        <div className="gate__body">
          <h1 className="gate__head">
            {HEADLINE.map((line, i) => (
              <span className="gate__line" key={line}>
                <span style={{ '--i': i } as React.CSSProperties}>{line}</span>
              </span>
            ))}
          </h1>

          <p className="gate__sub">
            A descent from the surface to the floor of the Mariana Trench.
            Everything you pass on the way is running code.
          </p>

          <div className="gate__choice">
            <button ref={first} className="btn btn--solid" onClick={() => enter(true)}>
              Descend with sound
            </button>
            <button className="btn" onClick={() => enter(false)}>
              Descend in silence
            </button>
          </div>
        </div>

        <p className="mono gate__foot">0 m &middot; surface</p>
        <p className="mono gate__floor">10,935 m to the floor</p>
      </div>

      <div className="gate__waterline" aria-hidden="true" />
    </div>
  )
}
