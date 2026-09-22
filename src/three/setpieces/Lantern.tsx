import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PieceProps } from '../Structures'
import { frame } from '../../lib/store'
import { glowMaterial, hullMaterial, wireMaterial } from './shared'

/**
 * Vantage — small, precise, almost nothing there. A caged lantern: three dark rings the
 * lamp has to find, and one bright core that never needed them.
 */
export function Lantern({ project, prox }: PieceProps) {
  const core = useRef<THREE.Mesh>(null)
  const cage = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Mesh>(null)

  const mats = useMemo(
    () => ({
      hull: hullMaterial('#243642'),
      glow: glowMaterial(project.color, 1.5),
      wire: wireMaterial(project.color, 0.4),
    }),
    [project.color],
  )

  useFrame(() => {
    const t = frame.time
    if (cage.current) {
      cage.current.rotation.x = t * 0.21
      cage.current.rotation.y = t * 0.14
    }
    if (core.current) {
      const pulse = 0.82 + Math.sin(t * 1.9) * 0.1 + prox.value * 0.24
      core.current.scale.setScalar(pulse)
    }
    if (halo.current) {
      halo.current.rotation.z = t * 0.6
      halo.current.scale.setScalar(1 + Math.sin(t * 1.1) * 0.06)
      ;(halo.current.material as THREE.Material).opacity = 0.18 + prox.value * 0.4
    }
  })

  return (
    <group scale={1.15}>
      <group ref={cage}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            material={mats.hull}
            rotation={[i === 0 ? 0 : Math.PI / 2, i === 2 ? Math.PI / 2 : 0, 0]}
          >
            <torusGeometry args={[1.15, 0.035, 8, 60]} />
          </mesh>
        ))}
      </group>

      <mesh material={mats.wire}>
        <icosahedronGeometry args={[0.92, 0]} />
      </mesh>

      <mesh ref={core} material={mats.glow}>
        <octahedronGeometry args={[0.36, 0]} />
      </mesh>

      <mesh ref={halo} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.55, 0.012, 6, 80]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.25} />
      </mesh>
    </group>
  )
}
