import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PieceProps } from '../Structures'
import { frame } from '../../lib/store'
import { glowMaterial, hullMaterial } from './shared'

const AGENTS = 6
const TRAIL = 42

type Orbit = { r: number; tilt: number; phase: number; speed: number; ecc: number }

/**
 * Foreman — six agents on elliptical intercepts. Each drags the path it has taken and
 * projects the path it is about to take, which is the whole point of the addon.
 */
export function Swarm({ project, prox }: PieceProps) {
  const agents = useRef<THREE.InstancedMesh>(null)
  const core = useRef<THREE.Mesh>(null)

  const orbits = useMemo<Orbit[]>(
    () =>
      Array.from({ length: AGENTS }, (_, i) => ({
        r: 0.95 + (i % 3) * 0.38,
        tilt: (i / AGENTS) * Math.PI - Math.PI / 2,
        phase: (i / AGENTS) * Math.PI * 2,
        speed: 0.42 + (i % 4) * 0.16,
        ecc: 0.72 + (i % 2) * 0.3,
      })),
    [],
  )

  const { trails, leads, dummy, scratch } = useMemo(() => {
    const trails: THREE.Line[] = []
    const leads: THREE.Line[] = []
    for (let i = 0; i < AGENTS; i++) {
      const tg = new THREE.BufferGeometry()
      tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3))
      trails.push(
        new THREE.Line(
          tg,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(project.color).multiplyScalar(1.5),
            transparent: true,
            opacity: 0.35,
          }),
        ),
      )
      const lg = new THREE.BufferGeometry()
      lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3))
      leads.push(
        new THREE.Line(
          lg,
          new THREE.LineBasicMaterial({
            color: new THREE.Color('#ffffff'),
            transparent: true,
            opacity: 0.5,
          }),
        ),
      )
    }
    return { trails, leads, dummy: new THREE.Object3D(), scratch: new THREE.Vector3() }
  }, [project.color])

  const at = (o: Orbit, t: number, v: THREE.Vector3) => {
    const a = t * o.speed + o.phase
    const x = Math.cos(a) * o.r * o.ecc
    const z = Math.sin(a) * o.r
    const y = Math.sin(a * 2 + o.phase) * 0.34
    v.set(x, y, z)
    v.applyAxisAngle(new THREE.Vector3(0, 0, 1), o.tilt)
    return v
  }

  useFrame(() => {
    const t = frame.time
    const mesh = agents.current
    if (!mesh) return

    for (let i = 0; i < AGENTS; i++) {
      const o = orbits[i]
      at(o, t, scratch)
      dummy.position.copy(scratch)
      dummy.scale.setScalar(0.075 + prox.value * 0.03)
      dummy.rotation.set(t * 1.4 + i, t * 0.9, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // Path already flown.
      const arr = trails[i].geometry.getAttribute('position') as THREE.BufferAttribute
      for (let k = 0; k < TRAIL; k++) {
        at(o, t - k * 0.045, scratch)
        arr.setXYZ(k, scratch.x, scratch.y, scratch.z)
      }
      arr.needsUpdate = true
      ;(trails[i].material as THREE.LineBasicMaterial).opacity = 0.1 + prox.value * 0.35

      // Path it is committing to.
      const lead = leads[i].geometry.getAttribute('position') as THREE.BufferAttribute
      for (let k = 0; k < 16; k++) {
        at(o, t + k * 0.05, scratch)
        lead.setXYZ(k, scratch.x, scratch.y, scratch.z)
      }
      lead.needsUpdate = true
      ;(leads[i].material as THREE.LineBasicMaterial).opacity = prox.value * 0.55
    }
    mesh.instanceMatrix.needsUpdate = true

    if (core.current) {
      core.current.rotation.x = t * 0.23
      core.current.rotation.y = t * 0.31
    }
  })

  const mats = useMemo(
    () => ({ hull: hullMaterial('#3a2436'), glow: glowMaterial(project.color, 3.0) }),
    [project.color],
  )

  return (
    <group scale={1.3}>
      <mesh ref={core} material={mats.hull}>
        <octahedronGeometry args={[0.46, 0]} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.47, 0]} />
        <meshBasicMaterial color={project.color} wireframe transparent opacity={0.4} />
      </mesh>
      <instancedMesh ref={agents} args={[undefined, undefined, AGENTS]} material={mats.glow}>
        <tetrahedronGeometry args={[1, 0]} />
      </instancedMesh>
      {trails.map((l, i) => (
        <primitive key={`t${i}`} object={l} />
      ))}
      {leads.map((l, i) => (
        <primitive key={`l${i}`} object={l} />
      ))}
    </group>
  )
}
