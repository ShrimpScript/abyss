import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PieceProps } from '../Structures'
import { frame } from '../../lib/store'
import { glowMaterial } from './shared'

const SATS = 14
const RINGS = [
  { r: 1.55, tilt: 0.0, speed: 0.30 },
  { r: 1.8, tilt: 1.05, speed: -0.22 },
  { r: 1.34, tilt: -0.62, speed: 0.44 },
]

/**
 * Sightline — a wireframe Earth under three inclined orbital shells, with traffic running
 * on each. Everything you can see from orbit, on one globe.
 */
export function Atlas({ project, prox }: PieceProps) {
  const globe = useRef<THREE.Group>(null)
  const sats = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const v = useMemo(() => new THREE.Vector3(), [])

  const glow = useMemo(() => glowMaterial(project.color, 3.2), [project.color])

  useFrame(() => {
    const t = frame.time
    if (globe.current) globe.current.rotation.y = t * 0.09

    const mesh = sats.current
    if (!mesh) return
    for (let i = 0; i < SATS; i++) {
      const ring = RINGS[i % RINGS.length]
      const a = t * ring.speed + (i / SATS) * Math.PI * 2 * 2.3
      v.set(Math.cos(a) * ring.r, 0, Math.sin(a) * ring.r)
      v.applyAxisAngle(new THREE.Vector3(1, 0, 0), ring.tilt)
      dummy.position.copy(v)
      dummy.scale.setScalar(0.045 + prox.value * 0.022)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group scale={1.05}>
      <group ref={globe}>
        <mesh>
          <sphereGeometry args={[1, 30, 20]} />
          <meshBasicMaterial color={project.color} wireframe transparent opacity={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.985, 24, 16]} />
          <meshStandardMaterial color="#0a1830" roughness={0.9} metalness={0.05} />
        </mesh>
      </group>

      {RINGS.map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + ring.tilt, 0, 0]}>
          <torusGeometry args={[ring.r, 0.004, 4, 100]} />
          <meshBasicMaterial color={project.color} transparent opacity={0.4} />
        </mesh>
      ))}

      <instancedMesh ref={sats} args={[undefined, undefined, SATS]} material={glow}>
        <sphereGeometry args={[1, 6, 5]} />
      </instancedMesh>
    </group>
  )
}
