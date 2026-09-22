import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { frame } from '../lib/store'
import { sunlightAt } from '../lib/depth'

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Soft vertical light shafts for the top of the water column. Additive, drawn far behind
 * everything else, and multiplied down to nothing by 300 m — so it costs nothing at depth.
 */
const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uStrength;
  uniform vec3  uTint;

  varying vec2 vUv;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  float shaft(float x, float seed, float t) {
    float pos = hash(seed) * 2.0 - 0.5;
    pos += sin(t * 0.13 + seed * 9.0) * 0.06;
    float width = 0.006 + hash(seed + 3.1) * 0.022;
    float d = abs(x - pos);
    return smoothstep(width, 0.0, d);
  }

  void main() {
    if (uStrength <= 0.001) discard;

    // Shafts converge slightly as they descend, as refracted sunlight does.
    float spread = mix(1.0, 0.72, vUv.y);
    float x = (vUv.x - 0.5) / spread + 0.5;

    float acc = 0.0;
    for (int i = 0; i < 9; i++) {
      float s = float(i) * 17.31;
      float flicker = 0.72 + 0.28 * sin(uTime * (0.5 + hash(s) * 0.9) + s);
      acc += shaft(x, s, uTime) * flicker;
    }

    float vertical = pow(1.0 - vUv.y, 1.55);
    float alpha = acc * vertical * uStrength;

    gl_FragColor = vec4(uTint * alpha, alpha);
  }
`

export function GodRays() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uStrength: { value: 1 },
      uTint: { value: new THREE.Color('#9fe9ff') },
    }),
    [],
  )

  useFrame((state) => {
    const u = mat.current?.uniforms
    if (!u || !mesh.current) return
    const sun = sunlightAt(frame.depth)
    u.uTime.value = frame.time
    u.uStrength.value = sun * 0.34
    mesh.current.visible = sun > 0.002
    // Ride with the camera so the shafts never run out of column.
    mesh.current.position.set(0, state.camera.position.y + 14, -52)
  })

  return (
    <mesh ref={mesh} renderOrder={-1}>
      <planeGeometry args={[150, 110]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
