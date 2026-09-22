import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PieceProps } from '../Structures'
import { frame } from '../../lib/store'
import { glowMaterial, hullMaterial } from './shared'

const ARCS = 10

/**
 * Lectern — the deepest structure and the largest. Three gimbal rings on separate axes
 * around one core, throwing arcs out to whatever is currently bound to it.
 */
export function Reactor({ project, prox }: PieceProps) {
  const ringA = useRef<THREE.Group>(null)
  const ringB = useRef<THREE.Group>(null)
  const ringC = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const shell = useRef<THREE.Mesh>(null)
  const cage = useRef<THREE.Mesh>(null)

  const mats = useMemo(
    () => ({
      hull: hullMaterial('#2e1a22'),
      glow: glowMaterial(project.color, 2.1),
    }),
    [project.color],
  )

  const arcs = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARCS * 2 * 3), 3))
    const m = new THREE.LineBasicMaterial({
      color: new THREE.Color(project.color).multiplyScalar(2.4),
      transparent: true,
      opacity: 0.5,
    })
    return new THREE.LineSegments(g, m)
  }, [project.color])

  const dir = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const t = frame.time
    if (ringA.current) ringA.current.rotation.set(t * 0.31, 0, 0)
    if (ringB.current) ringB.current.rotation.set(0, t * -0.24, Math.PI / 2.4)
    if (ringC.current) ringC.current.rotation.set(Math.PI / 2, t * 0.41, 0)

    const pulse = 0.72 + Math.sin(t * 2.1) * 0.08 + Math.sin(t * 5.3) * 0.03
    if (core.current) core.current.scale.setScalar(pulse * (0.7 + prox.value * 0.45))
    if (shell.current) {
      shell.current.rotation.y = t * -0.18
      shell.current.rotation.x = t * 0.12
    }
    if (cage.current) {
      cage.current.rotation.y = t * 0.06
      ;(cage.current.material as THREE.Material).opacity = 0.08 + prox.value * 0.2
    }

    // Arcs snap to new anchor points constantly.
    const arr = arcs.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < ARCS; i++) {
      const seed = Math.floor(t * 7 + i * 13) * 0.618
      const a = seed * 6.28318
      const b = (seed * 2.414) % 3.14159
      dir.set(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a))
      arr.setXYZ(i * 2, dir.x * 0.42, dir.y * 0.42, dir.z * 0.42)
      arr.setXYZ(i * 2 + 1, dir.x * 1.85, dir.y * 1.85, dir.z * 1.85)
    }
    arr.needsUpdate = true
    ;(arcs.material as THREE.LineBasicMaterial).opacity = prox.value * 0.55
  })

  const Ring = ({ r, w }: { r: number; w: number }) => (
    <>
      <mesh material={mats.hull}>
        <torusGeometry args={[r, w, 10, 72]} />
      </mesh>
      <mesh>
        <torusGeometry args={[r - w * 0.55, w * 0.22, 6, 72]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.65} />
      </mesh>
    </>
  )

  return (
    <group scale={0.92}>
      <group ref={ringA}>
        <Ring r={1.95} w={0.085} />
      </group>
      <group ref={ringB}>
        <Ring r={1.55} w={0.07} />
      </group>
      <group ref={ringC}>
        <Ring r={1.18} w={0.055} />
      </group>

      <mesh ref={core} material={mats.glow}>
        <icosahedronGeometry args={[0.45, 1]} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[0.72, 0]} />
        <meshBasicMaterial color={project.color} wireframe transparent opacity={0.4} />
      </mesh>
      <mesh ref={cage}>
        <dodecahedronGeometry args={[2.15, 0]} />
        <meshBasicMaterial color={project.color} wireframe transparent opacity={0.12} />
      </mesh>

      <primitive object={arcs} />
    </group>
  )
}
