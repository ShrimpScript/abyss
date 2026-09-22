import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PieceProps } from '../Structures'
import { frame } from '../../lib/store'
import { glowMaterial, hullMaterial } from './shared'

const COLUMNS = 30

/**
 * Glaze — a reef of candlesticks. Each column walks its own seeded price series, so the
 * shape is never the same twice, and a scan line sweeps the book the way the terminal does.
 */
export function Market({ project, prox }: PieceProps) {
  const bodies = useRef<THREE.InstancedMesh>(null)
  const caps = useRef<THREE.InstancedMesh>(null)
  const scan = useRef<THREE.Mesh>(null)

  const series = useMemo(() => {
    const seeds = new Float32Array(COLUMNS)
    const speeds = new Float32Array(COLUMNS)
    const base = new Float32Array(COLUMNS)
    for (let i = 0; i < COLUMNS; i++) {
      seeds[i] = Math.random() * 100
      speeds[i] = 0.35 + Math.random() * 0.7
      base[i] = 0.3 + Math.random() * 0.5
    }
    return { seeds, speeds, base, dummy: new THREE.Object3D() }
  }, [])

  const mats = useMemo(
    () => ({ hull: hullMaterial('#3a2a18'), glow: glowMaterial(project.color, 2.6) }),
    [project.color],
  )

  useFrame(() => {
    const t = frame.time
    const { seeds, speeds, base, dummy } = series
    const b = bodies.current
    const c = caps.current
    if (!b || !c) return

    const cols = 10
    for (let i = 0; i < COLUMNS; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      const x = (col - (cols - 1) / 2) * 0.26
      const z = (row - 1) * 0.3

      const wave =
        Math.sin(t * speeds[i] + seeds[i]) * 0.5 + Math.sin(t * speeds[i] * 2.3 + seeds[i]) * 0.22
      const h = Math.max(0.08, base[i] + wave * 0.55) * (0.55 + prox.value * 0.55)

      dummy.position.set(x, h / 2 - 0.45, z)
      dummy.scale.set(1, h, 1)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      b.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, h - 0.45, z)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      c.setMatrixAt(i, dummy.matrix)
    }
    b.instanceMatrix.needsUpdate = true
    c.instanceMatrix.needsUpdate = true

    if (scan.current) {
      scan.current.position.y = -0.45 + ((t * 0.32) % 1.4)
      ;(scan.current.material as THREE.Material).opacity = 0.1 + prox.value * 0.4
    }
  })

  return (
    <group scale={1.5} rotation={[0, -0.35 * project.side, 0]}>
      <instancedMesh ref={bodies} args={[undefined, undefined, COLUMNS]} material={mats.hull}>
        <boxGeometry args={[0.1, 1, 0.1]} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, COLUMNS]} material={mats.glow}>
        <boxGeometry args={[0.13, 0.022, 0.13]} />
      </instancedMesh>
      <mesh ref={scan} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.006, 4, 72]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  )
}
