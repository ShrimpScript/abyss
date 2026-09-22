import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PROJECTS, type Project } from '../data/projects'
import { frame } from '../lib/store'
import { beatScroll, smoothstep, worldYFromScroll } from '../lib/depth'
import { Lantern } from './setpieces/Lantern'
import { Ragdoll } from './setpieces/Ragdoll'
import { Market } from './setpieces/Market'
import { Swarm } from './setpieces/Swarm'
import { Globe } from './setpieces/Globe'
import { Atlas } from './setpieces/Atlas'
import { Porthole } from './setpieces/Porthole'
import { Reactor } from './setpieces/Reactor'

/** Mutable proximity handed to each set-piece so nothing re-renders while you fall past it. */
export type Prox = { value: number; signed: number }

export type PieceProps = { project: Project; prox: Prox; quality: 'low' | 'high' }

const FORMS: Record<Project['form'], (p: PieceProps) => React.ReactElement> = {
  lantern: Lantern,
  ragdoll: Ragdoll,
  market: Market,
  swarm: Swarm,
  globe: Globe,
  atlas: Atlas,
  porthole: Porthole,
  reactor: Reactor,
}

/** How far above and below a structure you can still make it out, in pixels of scroll. */
const REACH = 1150

function Structure({ project, quality }: { project: Project; quality: 'low' | 'high' }) {
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const prox = useMemo<Prox>(() => ({ value: 0, signed: 0 }), [])
  const Form = FORMS[project.form]
  const size = useThree((s) => s.size)

  const anchor = beatScroll(project.id)
  const y = worldYFromScroll(anchor)

  // In portrait there is no room beside the panel, so the structure moves behind it and
  // further off, where it reads as something looming through the water instead.
  const portrait = size.width / size.height < 1.05
  const x = portrait ? project.side * 0.45 : project.side * 2.7
  const z = portrait ? -12.5 : -8.8

  useFrame(() => {
    const delta = frame.scroll - anchor
    prox.signed = delta / REACH
    prox.value = smoothstep(REACH, 120, Math.abs(delta))

    if (group.current) {
      const near = Math.abs(delta) < REACH * 1.25
      group.current.visible = near
      if (!near) return
      // Structures drift with the current; the far ones drift more.
      group.current.rotation.y = Math.sin(frame.time * 0.11 + project.depth) * 0.22
    }
    if (light.current) {
      light.current.intensity = prox.value * 9 + 0.4
    }
  })

  return (
    <group ref={group} position={[x, y, z]}>
      <pointLight ref={light} color={project.color} distance={16} decay={1.7} intensity={0} />
      <Form project={project} prox={prox} quality={quality} />
    </group>
  )
}

export function Structures({ quality }: { quality: 'low' | 'high' }) {
  return (
    <>
      {PROJECTS.map((p) => (
        <Structure key={p.id} project={p} quality={quality} />
      ))}
    </>
  )
}
