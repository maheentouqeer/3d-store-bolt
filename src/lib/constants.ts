import * as THREE from 'three'

// Store dimensions in meters (1 unit = 1m)
export const STORE = {
  width: 40,
  depth: 30,
  height: 4.5,
  eyeHeight: 1.65,
  aisleStartX: -10.5,
  aisleSpacing: 3.0,
  aisleCount: 8,
  shelfHeight: 2.2,
  shelfWidth: 0.9,
  shelfDepth: 0.5,
  zSlots: [-10, -6, -2, 2, 6, 10],
  checkoutZ: 14,
  entranceZ: 14,
}

export const COLORS = {
  deep: '#0B2A6F',
  signal: '#E5322D',
  paper: '#F6F4EE',
  ink: '#14213D',
  shelf: '#FFFFFF',
  floor: '#E8E5DE',
  wall: '#D4D0C4',
  ceiling: '#C8C4B8',
  sign: '#0B2A6F',
}

export const CATEGORY_COLORS: Record<string, string> = {
  Beauty: '#E8B4D0',
  Pharmacy: '#A5D6A7',
  Food: '#FFE0B2',
  Drinks: '#BBDEFB',
  Apparel: '#D7CCC8',
  Electronics: '#B3E5FC',
  Home: '#DCEDC8',
  Kids: '#F8BBD9',
}

// Collision boxes for shelves: [minX, maxX, minZ, maxZ]
export function getShelfColliders(): { min: THREE.Vector3; max: THREE.Vector3 }[] {
  const colliders: { min: THREE.Vector3; max: THREE.Vector3 }[] = []
  for (let aisle = 0; aisle < STORE.aisleCount; aisle++) {
    const ax = STORE.aisleStartX + aisle * STORE.aisleSpacing
    // Each aisle is a double-sided shelf unit
    colliders.push({
      min: new THREE.Vector3(ax - 0.6, 0, -12),
      max: new THREE.Vector3(ax + 0.6, STORE.shelfHeight, 12),
    })
  }
  return colliders
}

// Wall colliders
export function getWallColliders(): { min: THREE.Vector3; max: THREE.Vector3 }[] {
  const halfW = STORE.width / 2
  const halfD = STORE.depth / 2
  return [
    { min: new THREE.Vector3(-halfW, 0, -halfD), max: new THREE.Vector3(halfW, 5, -halfD + 0.3) },
    { min: new THREE.Vector3(-halfW, 0, halfD - 0.3), max: new THREE.Vector3(halfW, 5, halfD) },
    { min: new THREE.Vector3(-halfW, 0, -halfD), max: new THREE.Vector3(-halfW + 0.3, 5, halfD) },
    { min: new THREE.Vector3(halfW - 0.3, 0, -halfD), max: new THREE.Vector3(halfW, 5, halfD) },
  ]
}

export function resolveCollision(pos: THREE.Vector3, radius: number): THREE.Vector3 {
  const colliders = [...getShelfColliders(), ...getWallColliders()]
  const resolved = pos.clone()
  for (const c of colliders) {
    // Expand box by player radius in XZ
    const minX = c.min.x - radius
    const maxX = c.max.x + radius
    const minZ = c.min.z - radius
    const maxZ = c.max.z + radius
    if (resolved.x > minX && resolved.x < maxX && resolved.z > minZ && resolved.z < maxZ) {
      // Push out along the smallest penetration axis
      const penLeft = resolved.x - minX
      const penRight = maxX - resolved.x
      const penFront = resolved.z - minZ
      const penBack = maxZ - resolved.z
      const minPen = Math.min(penLeft, penRight, penFront, penBack)
      if (minPen === penLeft) resolved.x = minX
      else if (minPen === penRight) resolved.x = maxX
      else if (minPen === penFront) resolved.z = minZ
      else resolved.z = maxZ
    }
  }
  return resolved
}
