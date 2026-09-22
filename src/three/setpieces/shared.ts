import * as THREE from 'three'

/**
 * The dark, non-emissive body of a structure. Invisible until the visitor's lamp
 * finds it — this is what makes the beam matter.
 */
export function hullMaterial(tint = '#1b2a33') {
  return new THREE.MeshStandardMaterial({
    color: tint,
    roughness: 0.62,
    metalness: 0.22,
  })
}

/** A self-lit bioluminescent surface. Bright enough that bloom catches it. */
export function glowMaterial(color: string, intensity = 2.4) {
  const c = new THREE.Color(color)
  return new THREE.MeshBasicMaterial({ color: c.multiplyScalar(intensity) })
}

export function wireMaterial(color: string, opacity = 0.55) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(1.6),
    wireframe: true,
    transparent: true,
    opacity,
  })
}
