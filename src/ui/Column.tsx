import { useEffect, useRef, useState } from 'react'
import { PROJECTS, type Project } from '../data/projects'
import { TOTAL_SCROLL_PX, ZONES, beatScroll, formatDepth } from '../lib/depth'
import { warpTo } from '../lib/descent'
import { FINE_POINTER, frame, getState, input } from '../lib/store'
import { onFrame } from '../lib/frameBus'

/** Everything in the column is pinned to its own scroll station, never to raw depth. */
const atBeat = (id: string) => ({ top: `calc(${beatScroll(id)}px + 50vh)` })

/**
 * Reveals its children once the visitor's lamp has swept them. In daylight, or for anyone
 * without a hovering pointer, content is simply visible — the lamp is a discovery
 * mechanic, never a gate on reading.
 */
function useLampReveal(beatId: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  const shownRef = useRef(false)

  useEffect(() => {
    if (!FINE_POINTER || getState().reduced) {
      shownRef.current = true
      setShown(true)
      return
    }
    const anchor = beatScroll(beatId)
    return onFrame(() => {
      if (shownRef.current) return
      if (Math.abs(frame.scroll - anchor) > 900) return

      const show = () => {
        shownRef.current = true
        setShown(true)
      }

      // Still daylight here, or the visitor never touched a pointer.
      if (frame.lamp < 0.25 || !input.moved) return show()

      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const beam = 190 + frame.boost * 150 + Math.max(r.width, r.height) * 0.45
      if (Math.hypot(frame.cx - cx, frame.cy - cy) < beam) show()
    })
  }, [beatId])

  return { ref, shown, force: () => setShown(true) }
}

function ZoneMarker({ zone }: { zone: (typeof ZONES)[number] }) {
  const { ref, shown } = useLampReveal(`zone-${zone.id}`)
  return (
    <div ref={ref} className={`marker${shown ? ' is-lit' : ''}`} style={atBeat(`zone-${zone.id}`)}>
      <span className="mono marker__depth">{formatDepth(zone.from)} m</span>
      <h2 className="marker__name">{zone.name}</h2>
      <span className="mono marker__latin">{zone.latin}</span>
      <p className="marker__note">{zone.note}</p>
    </div>
  )
}

function Plate({ project }: { project: Project }) {
  const { ref, shown, force } = useLampReveal(project.id)

  return (
    <article
      ref={ref}
      className={`plate${shown ? ' is-lit' : ''}`}
      data-side={project.side === 1 ? 'left' : 'right'}
      style={{ ...atBeat(project.id), '--c': project.color } as React.CSSProperties}
      id={project.id}
      tabIndex={0}
      onFocus={force}
      onPointerEnter={force}
    >
      <div className="plate__frame">
        <header className="plate__head">
          <span className="mono plate__spec">Specimen&nbsp;{project.specimen}</span>
          <span className="mono plate__depth">{formatDepth(project.depth)}&nbsp;m</span>
        </header>

        <h3 className="plate__name">{project.name}</h3>
        <p className="plate__tagline">{project.tagline}</p>
        <p className="plate__body">{project.body}</p>

        <div className="plate__hard">
          <span className="mono plate__hard-label">The hard part</span>
          <p>{project.hard}</p>
        </div>

        <dl className="spec mono">
          <div className="spec__row">
            <dt>Stack</dt>
            <dd>{project.stack.join(' \u00b7 ')}</dd>
          </div>
          <div className="spec__row">
            <dt>Status</dt>
            <dd>{project.meta}</dd>
          </div>
          {project.links.length > 0 && (
            <div className="spec__row">
              <dt>Source</dt>
              <dd className="spec__links">
                {project.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener">
                    {l.label}
                    <svg viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M3 9L9 3M9 3H4.5M9 3v4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  )
}

function Intro() {
  return (
    <div className="intro" style={atBeat('intro')}>
      <span className="mono intro__label">The log</span>
      <h2 className="intro__head">
        Mostly systems work,
        <br />
        and mostly for myself.
      </h2>
      <p className="intro__body">
        An engine that puts three coding agents on one brain. A Minecraft launcher in 4.9
        megabytes. A ragdoll solver written by hand because no library would fit inside a
        game tick. They get stranger the deeper you go.
      </p>
      <p className="mono intro__hint">Scroll to descend</p>
    </div>
  )
}

/** The beat immediately before the light dies. */
function LampNotice() {
  return (
    <div className="notice" style={atBeat('notice')}>
      <p className="notice__line">
        Below this, no sunlight reaches. Everything you see from here on
        is either made of light, or found with yours.
      </p>
      <p className="mono notice__hint">
        Move the cursor to sweep the lamp &middot; hold to focus the beam
      </p>
    </div>
  )
}

function Floor() {
  const { ref, shown } = useLampReveal('floor')
  return (
    <div ref={ref} className={`floor${shown ? ' is-lit' : ''}`} style={atBeat('floor')}>
      <div className="floor__lede">
        <span className="mono floor__depth">10,935 m &middot; Challenger Deep</span>
      <h2 className="floor__head">The floor.</h2>
      <p className="floor__body">
        Nothing below this but sediment. Everything above it is on GitHub, or close enough
        to it that asking will get you the rest.
      </p>

        <a
          className="floor__cta"
          href="https://github.com/ShrimpScript"
          target="_blank"
          rel="noreferrer noopener"
        >
          github.com/ShrimpScript
        </a>

        <div className="floor__end">
          <button className="btn" onClick={() => warpTo(0)}>
            Return to the surface
          </button>
          <p className="mono floor__keys">
            Type any name to go back to it &middot; Esc surfaces
          </p>
        </div>
      </div>

      <ol className="floor__index mono">
        {PROJECTS.map((p) => (
          <li key={p.id} style={{ '--c': p.color } as React.CSSProperties}>
            <button onClick={() => warpTo(p.depth)}>
              <span className="floor__index-spec">{p.specimen}</span>
              <span className="floor__index-name">{p.name}</span>
              <span className="floor__index-rule" aria-hidden="true" />
              <span className="floor__index-depth">{formatDepth(p.depth)} m</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Column() {
  return (
    <div className="column" style={{ height: `calc(${TOTAL_SCROLL_PX}px + 100vh)` }}>
      <Intro />
      {ZONES.slice(1).map((z) => (
        <ZoneMarker key={z.id} zone={z} />
      ))}
      <LampNotice />
      {PROJECTS.map((p) => (
        <Plate key={p.id} project={p} />
      ))}
      <Floor />
    </div>
  )
}
