import { useMemo } from 'react'
import * as THREE from 'three'
import { STORE, COLORS, CATEGORY_COLORS } from '../lib/constants'
import { CATEGORIES } from '../lib/store'

export function StoreEnvironment() {
  const halfW = STORE.width / 2
  const halfD = STORE.depth / 2

  const shelfPositions = useMemo(() => {
    const arr: { x: number; aisle: number }[] = []
    for (let i = 0; i < STORE.aisleCount; i++) {
      arr.push({ x: STORE.aisleStartX + i * STORE.aisleSpacing, aisle: i })
    }
    return arr
  }, [])

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[STORE.width, STORE.depth]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Floor grid lines for depth perception */}
      <gridHelper args={[STORE.width, 40, 0xccccca, 0xddddd9]} position={[0, 0.01, 0]} />

      {/* Back wall */}
      <mesh position={[0, STORE.height / 2, -halfD]}>
        <boxGeometry args={[STORE.width, STORE.height, 0.2]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>

      {/* Front wall (with entrance gap - two segments) */}
      <mesh position={[-halfW / 2 - 2, STORE.height / 2, halfD]}>
        <boxGeometry args={[halfW - 2, STORE.height, 0.2]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>
      <mesh position={[halfW / 2 + 2, STORE.height / 2, halfD]}>
        <boxGeometry args={[halfW - 2, STORE.height, 0.2]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-halfW, STORE.height / 2, 0]}>
        <boxGeometry args={[0.2, STORE.height, STORE.depth]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>

      {/* Right wall */}
      <mesh position={[halfW, STORE.height / 2, 0]}>
        <boxGeometry args={[0.2, STORE.height, STORE.depth]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, STORE.height, 0]}>
        <planeGeometry args={[STORE.width, STORE.depth]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {/* Ceiling lights (emissive strips) */}
      {[-12, -6, 0, 6, 12].map((z) => (
        <mesh key={z} position={[0, STORE.height - 0.1, z]}>
          <boxGeometry args={[STORE.width - 2, 0.05, 0.4]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* Shelves and signs per aisle */}
      {shelfPositions.map(({ x, aisle }) => (
        <AisleShelf key={aisle} x={x} aisle={aisle} />
      ))}

      {/* Checkout area */}
      <CheckoutArea />
    </group>
  )
}

function AisleShelf({ x, aisle }: { x: number; aisle: number }) {
  const categoryName = CATEGORIES[aisle]
  const signColor = CATEGORY_COLORS[categoryName] || COLORS.deep

  return (
    <group position={[x, 0, 0]}>
      {/* Left shelf panel */}
      <mesh position={[-0.45, STORE.shelfHeight / 2, 0]}>
        <boxGeometry args={[0.15, STORE.shelfHeight, 24]} />
        <meshStandardMaterial color={COLORS.shelf} roughness={0.6} />
      </mesh>
      {/* Right shelf panel */}
      <mesh position={[0.45, STORE.shelfHeight / 2, 0]}>
        <boxGeometry args={[0.15, STORE.shelfHeight, 24]} />
        <meshStandardMaterial color={COLORS.shelf} roughness={0.6} />
      </mesh>
      {/* Top shelf boards (horizontal) */}
      {[0.4, 0.9, 1.4, 1.9].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[1.0, 0.04, 24]} />
            <meshStandardMaterial color={'#E8E5DE'} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Center divider */}
      <mesh position={[0, STORE.shelfHeight / 2, 0]}>
        <boxGeometry args={[0.05, STORE.shelfHeight, 24]} />
        <meshStandardMaterial color={'#D4D0C4'} roughness={0.7} />
      </mesh>

      {/* Base panels */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.0, 0.2, 24]} />
        <meshStandardMaterial color={'#C8C4B8'} roughness={0.8} />
      </mesh>

      {/* Hanging aisle sign */}
      <group position={[0, STORE.height - 0.8, 0]}>
        {/* Chains */}
        <mesh position={[-0.3, 0.3, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.6]} />
          <meshStandardMaterial color="#999" />
        </mesh>
        <mesh position={[0.3, 0.3, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.6]} />
          <meshStandardMaterial color="#999" />
        </mesh>
        {/* Sign board */}
        <mesh>
          <boxGeometry args={[2.2, 0.6, 0.08]} />
          <meshStandardMaterial color={COLORS.deep} roughness={0.4} />
        </mesh>
        {/* Sign text (front-facing plane with color) */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.0, 0.45]} />
          <meshBasicMaterial color={signColor} />
        </mesh>
      </group>
    </group>
  )
}

function CheckoutArea() {
  const lanePositions = [-9, -3, 3, 9]
  return (
    <group position={[0, 0, 13]}>
      {/* Counter behind lanes */}
      <mesh position={[0, 0.6, 1.5]}>
        <boxGeometry args={[24, 1.2, 0.8]} />
        <meshStandardMaterial color={COLORS.ink} roughness={0.5} />
      </mesh>

      {lanePositions.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Checkout counter */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[2.0, 1.0, 0.8]} />
            <meshStandardMaterial color={COLORS.shelf} roughness={0.5} />
          </mesh>
          {/* Belt */}
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[1.8, 0.05, 0.6]} />
            <meshStandardMaterial color="#333" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Terminal */}
          <mesh position={[0.6, 1.3, 0]}>
            <boxGeometry args={[0.3, 0.4, 0.3]} />
            <meshStandardMaterial color="#222" roughness={0.3} />
          </mesh>
          {/* Lane number sign */}
          <mesh position={[0, 2.0, 0]}>
            <boxGeometry args={[0.8, 0.4, 0.06]} />
            <meshStandardMaterial color={COLORS.deep} />
          </mesh>
          {/* Number plane (simple colored circle to represent number) */}
          <mesh position={[0, 2.0, 0.04]}>
            <circleGeometry args={[0.15, 16]} />
            <meshBasicMaterial color={COLORS.paper} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
