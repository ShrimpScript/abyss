import * as THREE from 'three'

/** World-space direction the visitor's lamp is pointing. Written once per frame by the rig. */
export const lampDir = new THREE.Vector3(0, 0, -1)
/** World-space position of the lamp (the camera). */
export const lampPos = new THREE.Vector3()
