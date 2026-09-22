import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PieceProps } from '../Structures'
import { frame } from '../../lib/store'
import { hullMaterial } from './shared'

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * What you see through the glass: a lit room on the other side of the water, with a
 * session still running in it. Thick-glass distortion, scrolling lines, warm against cold.
 */
const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uProx;
  uniform vec3  uTint;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
  }

  void main() {
    vec2 c = vUv - 0.5;
    float r = length(c);
    if (r > 0.5) discard;

    // Thick glass bulges what is behind it.
    vec2 uv = c * (1.0 - 0.38 * r * r) + 0.5;

    // Lines of a session, scrolling.
    float rows = 26.0;
    float scroll = uTime * 0.21;
    float row = floor(uv.y * rows + scroll);
    float inRow = fract(uv.y * rows + scroll);

    float seed = hash(vec2(row, 3.0));
    float len = 0.14 + seed * 0.72;
    float indent = hash(vec2(row, 9.0)) * 0.18;
    float glyphs = step(indent, uv.x) * step(uv.x, indent + len);
    // Break the run into glyphs rather than a solid bar.
    glyphs *= step(0.34, hash(vec2(floor(uv.x * 54.0), row)));
    glyphs *= smoothstep(0.0, 0.18, inRow) * smoothstep(1.0, 0.72, inRow);

    // A cursor on the newest line.
    float cursorRow = step(abs(row - floor(scroll + rows - 2.0)), 0.5);
    float cursor = cursorRow * step(indent + len, uv.x) * step(uv.x, indent + len + 0.03)
                 * step(0.5, fract(uTime * 1.4));
    glyphs = max(glyphs, cursor);

    vec3 room = uTint * 0.16;
    vec3 col = room + uTint * glyphs * 1.5;

    // The room falls off toward the rim, and a highlight rakes across the glass.
    col *= smoothstep(0.5, 0.18, r) * 0.8 + 0.2;
    float sweep = smoothstep(0.06, 0.0, abs(c.x * 0.7 + c.y - sin(uTime * 0.35) * 0.5));
    col += vec3(0.55, 0.7, 0.85) * sweep * 0.12;

    gl_FragColor = vec4(col * (0.35 + uProx * 0.9), 1.0);
  }
`

export function Porthole({ project, prox }: PieceProps) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const rig = useRef<THREE.Group>(null)
  const bolts = useRef<THREE.InstancedMesh>(null)
  const BOLTS = 12

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProx: { value: 0 },
      uTint: { value: new THREE.Color('#ffb877') },
    }),
    [],
  )

  const mats = useMemo(
    () => ({ hull: hullMaterial('#26202f'), bolt: hullMaterial('#4a4356') }),
    [],
  )

  useFrame(() => {
    const t = frame.time
    if (mat.current) {
      mat.current.uniforms.uTime.value = t
      mat.current.uniforms.uProx.value = prox.value
    }
    if (rig.current) {
      // Hangs and turns to face you as you come level with it.
      rig.current.rotation.y = -project.side * 0.5 + Math.sin(t * 0.18) * 0.12
      rig.current.rotation.z = Math.sin(t * 0.24) * 0.05
    }
    const b = bolts.current
    if (b && !b.userData.done) {
      const d = new THREE.Object3D()
      for (let i = 0; i < BOLTS; i++) {
        const a = (i / BOLTS) * Math.PI * 2
        d.position.set(Math.cos(a) * 1.16, Math.sin(a) * 1.16, 0.075)
        d.scale.setScalar(0.055)
        d.updateMatrix()
        b.setMatrixAt(i, d.matrix)
      }
      b.instanceMatrix.needsUpdate = true
      b.userData.done = true
    }
  })

  return (
    <group ref={rig} scale={1.2}>
      <mesh material={mats.hull}>
        <torusGeometry args={[1.12, 0.17, 14, 64]} />
      </mesh>
      <mesh material={mats.hull} position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.14, 1.14, 0.1, 48, 1, true]} />
      </mesh>
      <instancedMesh ref={bolts} args={[undefined, undefined, BOLTS]} material={mats.bolt}>
        <sphereGeometry args={[1, 7, 6]} />
      </instancedMesh>
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[1.06, 56]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={VERT}
          fragmentShader={FRAG}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <ringGeometry args={[1.02, 1.07, 56]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
