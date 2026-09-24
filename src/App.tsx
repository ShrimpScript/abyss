import { useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './three/Scene'
import { Gate } from './ui/Gate'
import { Hud } from './ui/Hud'
import { SonarRail } from './ui/SonarRail'
import { Column } from './ui/Column'
import { Cursor } from './ui/Cursor'
import { AudioDriver } from './ui/AudioDriver'
import { DocumentTitle } from './ui/DocumentTitle'
import { Announcer } from './ui/Announcer'
import { SkipLink } from './ui/SkipLink'
import { applyHash, getLenis, initDescent, teardownDescent } from './lib/descent'
import { useStore } from './lib/store'

/** Phones and low-memory machines get fewer particles and a lower pixel ratio. */
function detectQuality(): 'low' | 'high' {
  if (typeof window === 'undefined') return 'low'
  const mem = (navigator as { deviceMemory?: number }).deviceMemory
  const small = window.innerWidth < 820
  return small || (mem !== undefined && mem <= 4) ? 'low' : 'high'
}

/** Screenshot tooling needs the drawing buffer kept; nothing else does. */
const PROBE = typeof window !== 'undefined' && window.location.search.includes('probe')

export default function App() {
  const phase = useStore((s) => s.phase)
  const quality = useMemo(detectQuality, [])

  useEffect(() => {
    initDescent()
    return teardownDescent
  }, [])

  useEffect(() => {
    document.body.dataset.phase = phase
    const lenis = getLenis()
    if (!lenis) return
    if (phase === 'gate') {
      lenis.stop()
      return
    }
    lenis.start()
    // Land straight on a shared structure rather than at the surface.
    applyHash(true)
    const onHash = () => applyHash(false)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [phase])

  return (
    <>
      <Canvas
        className="canvas-layer"
        // R3F writes its own inline width/height, which resolve against a root that has no
        // definite height. Pinning it here is what actually gives the drawing buffer a size.
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
        dpr={[1, quality === 'high' ? 1.65 : 1.2]}
        gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: PROBE }}
        camera={{ fov: 52, near: 0.1, far: 130, position: [0, 0, 0] }}
      >
        <Scene quality={quality} />
      </Canvas>

      <div className="gloom" aria-hidden="true" />
      <div className="beam" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <Column />

      <SkipLink />
      <Hud />
      <SonarRail />
      <AudioDriver />
      <DocumentTitle />
      <Announcer />
      <Cursor />
      <Gate />
    </>
  )
}
