import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import * as THREE from 'three'
import { tickDescent } from '../lib/descent'
import { emitFrame } from '../lib/frameBus'
import { frame, getState } from '../lib/store'
import { MAX_DEPTH, smoothstep, sunlightAt, waterColourAt, worldYFromScroll } from '../lib/depth'
import { lampDir, lampPos } from './lamp'
import { MarineSnow } from './MarineSnow'
import { GodRays } from './GodRays'
import { Structures } from './Structures'

/**
 * The single clock. Mounted first so its useFrame runs before anything reads `frame`.
 * Also pushes the values the DOM needs onto the document element.
 */
function Clock() {
  const probe = typeof window !== 'undefined' && window.location.search.includes('probe')
  useFrame((state, delta) => {
    if (probe) {
      ;(window as any).__abyss = {
        cam: state.camera.position.toArray(),
        bg: (state.scene.background as THREE.Color | null)?.getHexString?.(),
        fog: (state.scene.fog as THREE.FogExp2 | null)?.density,
        fogCol: (state.scene.fog as THREE.FogExp2 | null)?.color?.getHexString?.(),
        tone: state.gl.toneMapping,
        cs: state.gl.outputColorSpace,
        children: state.scene.children.length,
        calls: state.gl.info.render.calls,
        tris: state.gl.info.render.triangles,
        scroll: frame.scroll,
        depth: frame.depth,
      }
    }
    const d = Math.min(delta, 1 / 20)
    tickDescent(state.clock.elapsedTime, d)

    const root = document.documentElement.style
    root.setProperty('--mx', `${frame.cx}px`)
    root.setProperty('--my', `${frame.cy}px`)
    root.setProperty('--lamp', frame.lamp.toFixed(4))
    root.setProperty('--boost', frame.boost.toFixed(4))
    root.setProperty('--depth', frame.depth.toFixed(1))

    emitFrame(d)
  })
  return null
}

function Rig() {
  const { camera } = useThree()
  const reduced = getState().reduced

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.0015, Math.min(delta, 1 / 20))
    const y = worldYFromScroll(frame.scroll)

    // Parallax: the hull drifts toward where the visitor is looking.
    const tx = reduced ? 0 : frame.px * 0.62
    const ty = reduced ? 0 : frame.py * 0.34
    camera.position.x += (tx - camera.position.x) * k
    camera.position.y = y + ty
    camera.position.z = 0

    camera.rotation.x += ((reduced ? -0.04 : frame.py * 0.055 - 0.045) - camera.rotation.x) * k
    camera.rotation.y += ((reduced ? 0 : frame.px * 0.085) - camera.rotation.y) * k

    // The lamp points from the hull through the cursor into the water.
    lampPos.copy(camera.position)
    const dir = new THREE.Vector3(frame.px * 0.55, frame.py * 0.42, -1)
      .normalize()
      .applyQuaternion(camera.quaternion)
    lampDir.lerp(dir, reduced ? 1 : 1 - Math.pow(0.0009, Math.min(delta, 1 / 20)))
    lampDir.normalize()
  })

  return null
}

function Atmosphere() {
  const { scene } = useThree()
  const fog = useMemo(() => new THREE.FogExp2(0x01040a, 0.016), [])
  const bg = useMemo(() => new THREE.Color(0x01040a), [])

  useEffect(() => {
    scene.fog = fog
    scene.background = bg
    return () => {
      scene.fog = null
      scene.background = null
    }
  }, [scene, fog, bg])

  useFrame(() => {
    const [r, g, b] = waterColourAt(frame.depth)
    bg.setRGB(r, g, b)
    fog.color.setRGB(r, g, b)
    // Water closes in as you descend, so the lamp has something to catch.
    fog.density = 0.013 + frame.lamp * 0.036
  })

  return null
}

function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const ambient = useRef<THREE.AmbientLight>(null)
  const lamp = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const { scene, camera } = useThree()

  useEffect(() => {
    scene.add(target)
    return () => {
      scene.remove(target)
    }
  }, [scene, target])

  useFrame(() => {
    const s = sunlightAt(frame.depth)
    const [r, g, b] = waterColourAt(frame.depth)

    if (ambient.current) {
      ambient.current.intensity = 0.055 + s * 1.85
      ambient.current.color.setRGB(r + 0.06, g + 0.12, b + 0.2)
    }
    if (sun.current) {
      sun.current.intensity = s * 2.6
      sun.current.position.set(camera.position.x + 6, camera.position.y + 24, -10)
      sun.current.visible = s > 0.003
    }
    if (lamp.current) {
      lamp.current.position.copy(lampPos)
      lamp.current.intensity = frame.lamp * (34 + frame.boost * 52)
      lamp.current.angle = 0.30 + frame.boost * 0.10
      lamp.current.distance = 34 + frame.boost * 14
      target.position.copy(lampPos).addScaledVector(lampDir, 10)
      lamp.current.target = target
    }
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.4} />
      <directionalLight ref={sun} color="#cfefff" intensity={2} />
      <spotLight
        ref={lamp}
        color="#cdf6ff"
        penumbra={0.78}
        decay={1.35}
        intensity={0}
        angle={0.3}
      />
    </>
  )
}

function Effects() {
  const bloom = useRef<any>(null)
  const chroma = useRef<any>(null)
  const noise = useRef<any>(null)

  useFrame(() => {
    const d = frame.depth
    if (bloom.current) {
      // Bioluminescence carries the whole image once the sun is gone.
      bloom.current.intensity = 0.55 + frame.lamp * 1.5
    }
    if (chroma.current?.offset) {
      // Pressure distortion, only meaningful in the trench.
      const p = smoothstep(6000, MAX_DEPTH, d) * 0.0022
      const strain = p + Math.abs(frame.velocity) * 2e-6
      chroma.current.offset.set(strain, strain * 0.6)
    }
    if (noise.current?.blendMode?.opacity) {
      noise.current.blendMode.opacity.value = 0.035 + frame.lamp * 0.05
    }
  })

  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={bloom} intensity={0.8} luminanceThreshold={0.18} luminanceSmoothing={0.35} mipmapBlur />
      <ChromaticAberration ref={chroma} offset={new THREE.Vector2(0, 0)} radialModulation={false} modulationOffset={0} />
      <Noise ref={noise} opacity={0.04} premultiply />
      <Vignette eskil={false} offset={0.22} darkness={0.82} />
    </EffectComposer>
  )
}

export function Scene({ quality }: { quality: 'low' | 'high' }) {
  const reduced = getState().reduced
  const snow = quality === 'high' ? 3400 : 1100
  const dpr = quality === 'high' ? 1.5 : 1

  return (
    <>
      <Clock />
      <Rig />
      <Atmosphere />
      <Lights />
      <GodRays />
      <MarineSnow count={snow} pixelRatio={dpr} />
      <Structures quality={quality} />
      {!reduced && <Effects />}
    </>
  )
}
