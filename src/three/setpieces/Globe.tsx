import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PieceProps } from '../Structures'
import { frame } from '../../lib/store'
import { hullMaterial } from './shared'

const PINS = 150

/**
 * Whereabouts — a dark globe speckled with the places that have open imagery, and a
 * reticle that keeps committing to a guess.
 */
export function Globe({ project, prox }: PieceProps) {
  const ball = useRef<THREE.Group>(null)
  const reticle = useRef<THREE.Group>(null)
  const pinsMat = useRef<THREE.PointsMaterial>(null)

  const pinGeo = useMemo(() => {
    // Fibonacci sphere, then thinned unevenly so coverage looks like real imagery.
    const pts: number[] = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < PINS * 2; i++) {
      const y = 1 - (i / (PINS * 2 - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const th = golden * i
      if (Math.random() > 0.55 + r * 0.3) continue
      pts.push(Math.cos(th) * r * 1.02, y * 1.02, Math.sin(th) * r * 1.02)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])

  const targets = useMemo(() => {
    const arr = pinGeo.getAttribute('position') as THREE.BufferAttribute
    return arr
  }, [pinGeo])

  const hull = useMemo(() => hullMaterial('#16323a'), [])

  useFrame(() => {
    const t = frame.time
    if (ball.current) ball.current.rotation.y = t * 0.12
    if (pinsMat.current) pinsMat.current.opacity = 0.35 + prox.value * 0.55

    if (reticle.current) {
      // Lock onto a new pin every couple of seconds, like a guess being placed.
      const step = Math.floor(t / 2.2)
      const i = (step * 37) % targets.count
      const x = targets.getX(i)
      const y = targets.getY(i)
      const z = targets.getZ(i)
      const k = 1 - Math.pow(0.0008, 1 / 60)
      reticle.current.position.lerp(new THREE.Vector3(x, y, z).multiplyScalar(1.12), k)
      reticle.current.lookAt(0, 0, 0)
      reticle.current.rotation.z = t * 1.1
      const settle = 1 - ((t / 2.2) % 1)
      reticle.current.scale.setScalar((0.9 + settle * 0.5) * (0.4 + prox.value * 0.6))
    }
  })

  return (
    <group scale={1.25}>
      <group ref={ball}>
        <mesh material={hull}>
          <icosahedronGeometry args={[1, 3]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.004, 26, 18]} />
          <meshBasicMaterial color={project.color} wireframe transparent opacity={0.12} />
        </mesh>
        <points geometry={pinGeo}>
          <pointsMaterial
            ref={pinsMat}
            color={new THREE.Color(project.color).multiplyScalar(2.2)}
            size={0.055}
            sizeAttenuation
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </points>
        <group ref={reticle}>
          <mesh>
            <ringGeometry args={[0.1, 0.125, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
