import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PieceProps } from '../Structures'
import { frame } from '../../lib/store'
import { glowMaterial, hullMaterial } from './shared'

const JOINTS = 10
const LINK = 0.30
const ITERATIONS = 7

/**
 * Tumble — an actual verlet chain with distance constraints, the same shape of solver the
 * mod runs. It hangs, swings with the current, and answers the pointer.
 */
export function Ragdoll({ project, prox }: PieceProps) {
  const jointsRef = useRef<THREE.InstancedMesh>(null)
  const linksRef = useRef<THREE.InstancedMesh>(null)

  const sim = useMemo(() => {
    const pos: THREE.Vector3[] = []
    const prev: THREE.Vector3[] = []
    for (let i = 0; i < JOINTS; i++) {
      const p = new THREE.Vector3(0, 1.35 - i * LINK, 0)
      pos.push(p)
      prev.push(p.clone())
    }
    return { pos, prev, dummy: new THREE.Object3D(), up: new THREE.Vector3(0, 1, 0) }
  }, [])

  const mats = useMemo(
    () => ({ hull: hullMaterial('#2c3a26'), glow: glowMaterial(project.color, 1.55) }),
    [project.color],
  )

  useFrame(() => {
    const { pos, prev, dummy } = sim
    const t = frame.time

    // Verlet integration with heavy drag, because this is water rather than air.
    // Gravity has to stay well above the lateral terms or the chain is dragged straight
    // instead of hanging, which is the whole point of a ragdoll.
    const DRAG = 0.985
    const GRAVITY = -0.00092
    const SWAY = 0.00022
    const PUSH = 0.00017

    const sway = Math.sin(t * 0.7) * 0.9 + Math.sin(t * 1.63) * 0.35
    const push = frame.px * 2.4 * prox.value

    for (let i = 1; i < JOINTS; i++) {
      const p = pos[i]
      const q = prev[i]
      const vx = (p.x - q.x) * DRAG
      const vy = (p.y - q.y) * DRAG
      const vz = (p.z - q.z) * DRAG
      q.copy(p)
      const w = i / JOINTS
      p.x += vx + (sway * SWAY + push * PUSH) * w
      p.y += vy + GRAVITY
      p.z += vz + Math.cos(t * 0.9 + i * 0.4) * 0.00012 * w
    }

    // Distance constraints, anchored at the first joint.
    pos[0].set(0, 1.35, 0)
    for (let k = 0; k < ITERATIONS; k++) {
      for (let i = 0; i < JOINTS - 1; i++) {
        const a = pos[i]
        const b = pos[i + 1]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dz = b.z - a.z
        const d = Math.hypot(dx, dy, dz) || 1e-5
        const diff = (d - LINK) / d
        const wa = i === 0 ? 0 : 0.5
        const wb = i === 0 ? 1 : 0.5
        a.x += dx * diff * wa
        a.y += dy * diff * wa
        a.z += dz * diff * wa
        b.x -= dx * diff * wb
        b.y -= dy * diff * wb
        b.z -= dz * diff * wb
      }
    }

    const joints = jointsRef.current
    const links = linksRef.current
    if (!joints || !links) return

    for (let i = 0; i < JOINTS; i++) {
      dummy.position.copy(pos[i])
      const s = 0.138 - i * 0.0092
      dummy.scale.setScalar(s)
      dummy.rotation.set(0, t * 0.4, 0)
      dummy.updateMatrix()
      joints.setMatrixAt(i, dummy.matrix)
    }
    joints.instanceMatrix.needsUpdate = true

    for (let i = 0; i < JOINTS - 1; i++) {
      const a = pos[i]
      const b = pos[i + 1]
      dummy.position.copy(a).lerp(b, 0.5)
      const dir = new THREE.Vector3().subVectors(b, a)
      const len = dir.length()
      dummy.quaternion.setFromUnitVectors(sim.up, dir.normalize())
      dummy.scale.set(1, len, 1)
      dummy.updateMatrix()
      links.setMatrixAt(i, dummy.matrix)
    }
    links.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={[0, -0.3, 0]} scale={1.25}>
      <instancedMesh ref={jointsRef} args={[undefined, undefined, JOINTS]} material={mats.glow}>
        <icosahedronGeometry args={[1, 1]} />
      </instancedMesh>
      <instancedMesh ref={linksRef} args={[undefined, undefined, JOINTS - 1]} material={mats.hull}>
        <cylinderGeometry args={[0.028, 0.028, 1, 6]} />
      </instancedMesh>
    </group>
  )
}
