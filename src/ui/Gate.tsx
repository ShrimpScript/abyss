import { useEffect, useRef, useState } from 'react'
import { setState, useStore } from '../lib/store'
import { startAudio, tick } from '../lib/audio'

/**
 * The surface. Nothing scrolls until the visitor chooses how to go under, which is also
 * the only moment audio is ever offered.
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
      <div className="gate__inner">
        <p className="mono gate__coords">11&deg;22.4&prime;N&nbsp;&nbsp;142&deg;35.5&prime;E</p>

        <h1 className="gate__mark">
          {'ShrimpScript'.split('').map((c, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties}>
              {c}
            </span>
          ))}
        </h1>

        <p className="gate__lede">
          Eight structures, logged between the surface
          <br />
          and the floor of the trench.
        </p>

        <div className="gate__choice">
          <button ref={first} className="gate__btn" onClick={() => enter(true)}>
            <span>Descend with sound</span>
          </button>
          <button className="gate__btn gate__btn--quiet" onClick={() => enter(false)}>
            <span>Descend in silence</span>
          </button>
        </div>

        <p className="mono gate__foot">
          10,935 metres to the floor &middot; scroll to descend
        </p>
      </div>

      <div className="gate__waterline" aria-hidden="true" />
    </div>
  )
}
