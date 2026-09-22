import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { frame } from '../lib/store'
import { WORLD_PER_PX } from '../lib/depth'
import { lampDir } from './lamp'

const VERT = /* glsl */ `
  uniform float uCamY;
  uniform float uHeight;
  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;
  uniform vec3  uLampDir;
  uniform float uLamp;
  uniform float uPixelRatio;

  attribute float aSeed;
  attribute float aScale;

  varying float vAlpha;
  varying float vGlow;
  varying float vStretch;

  void main() {
    vec3 p = position;

    // Recycle the column around the camera so the field is effectively infinite.
    p.y = uCamY + mod(position.y - uCamY, uHeight) - uHeight * 0.5;

    // Slow lateral drift so the water never feels static.
    float w = uTime * 0.09 + aSeed * 6.2831;
    p.x += sin(w) * 0.5;
    p.z += cos(w * 0.77) * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;

    // How far inside the lamp cone this flake sits.
    vec3 toFlake = normalize(p - cameraPosition);
    float cone = max(dot(toFlake, uLampDir), 0.0);
    vGlow = pow(cone, 26.0) * uLamp;

    // Fade in from the far plane and out as flakes pass the lens.
    vAlpha = smoothstep(46.0, 30.0, dist) * smoothstep(0.35, 2.6, dist);
    vStretch = uSpeed;

    gl_PointSize = uSize * aScale * uPixelRatio * (12.0 / max(dist, 0.6));
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uTint;
  uniform float uAmbient;

  varying float vAlpha;
  varying float vGlow;
  varying float vStretch;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;

    // Falling fast stretches each flake into a streak.
    uv.y /= (1.0 + vStretch * 3.2);

    float d = length(uv);
    float core = smoothstep(0.5, 0.06, d);
    if (core <= 0.001) discard;

    float lit = uAmbient + vGlow * 2.4;
    vec3 col = uTint * lit;

    gl_FragColor = vec4(col, core * vAlpha * clamp(lit, 0.0, 1.0));
  }
`

type Props = { count: number; pixelRatio: number }

export function MarineSnow({ count, pixelRatio }: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const HEIGHT = 70

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    const scale = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Biased toward the centre of the column so the edges of frame stay clean.
      const r = Math.pow(Math.random(), 0.6) * 26
      const a = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = Math.random() * HEIGHT
      pos[i * 3 + 2] = Math.sin(a) * r - 6
      seed[i] = Math.random()
      scale[i] = 0.35 + Math.pow(Math.random(), 2.4) * 1.5
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6)
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uCamY: { value: 0 },
      uHeight: { value: HEIGHT },
      uTime: { value: 0 },
      uSize: { value: 2.3 },
      uSpeed: { value: 0 },
      uLampDir: { value: new THREE.Vector3(0, 0, -1) },
      uLamp: { value: 0 },
      uAmbient: { value: 0.5 },
      uTint: { value: new THREE.Color('#dff3ff') },
      uPixelRatio: { value: pixelRatio },
    }),
    [pixelRatio],
  )

  useFrame((state) => {
    const u = mat.current?.uniforms
    if (!u) return
    u.uTime.value = frame.time
    u.uCamY.value = state.camera.position.y
    u.uSpeed.value = Math.min((Math.abs(frame.velocity) * WORLD_PER_PX) / 34, 1.5)
    u.uLamp.value = frame.lamp
    ;(u.uLampDir.value as THREE.Vector3).copy(lampDir)
    u.uAmbient.value = Math.max(0.035, (1 - frame.lamp) * 0.55)
    u.uPixelRatio.value = pixelRatio
  })

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
