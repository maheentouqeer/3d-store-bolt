import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useThree, ThreeEvent } from '@react-three/fiber'
import { STORE, CATEGORY_COLORS } from '../lib/constants'
import { useStore } from '../lib/store'
import type { Product, ShelfSlotWithStock } from '../lib/supabase'

type ProductInstance = {
  product: Product
  slot: ShelfSlotWithStock
  position: [number, number, number]
}

export function ProductMeshes() {
  const slots = useStore((s) => s.slots)
  const mode = useStore((s) => s.mode)
  const setSelected = useStore((s) => s.setSelected)
  const checkoutActive = useStore((s) => s.checkoutActive)

  const instances = useMemo<ProductInstance[]>(() => {
    return slots
      .filter((s) => s.product)
      .map((s) => ({
        product: s.product!,
        slot: s,
        position: [s.pos_x, s.pos_y, s.pos_z] as [number, number, number],
      }))
  }, [slots])

  if (checkoutActive) return null

  return (
    <group>
      {instances.map((inst) => (
        <ProductBox
          key={inst.slot.id}
          instance={inst}
          mode={mode}
          onSelect={setSelected}
        />
      ))}
    </group>
  )
}

function ProductBox({
  instance,
  mode,
  onSelect,
}: {
  instance: ProductInstance
  mode: 'shopper' | 'manager'
  onSelect: (p: Product | null, s: ShelfSlotWithStock | null) => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { product, slot, position } = instance
  const shape = product.shape || 'box'
  const baseColor = product.color || CATEGORY_COLORS[product.category] || '#cccccc'
  const qty = slot.stock?.qty ?? 0
  const minQty = slot.stock?.min_qty ?? 10

  // Manager mode: stock visualization
  const stockColor = useMemo(() => {
    if (mode !== 'manager') return baseColor
    if (qty === 0) return '#666666'
    if (qty <= minQty) return '#E5322D'
    return baseColor
  }, [mode, qty, minQty, baseColor])

  const scale = useMemo(() => {
    if (mode === 'manager' && qty === 0) return 0.3
    if (mode === 'manager') {
      return 0.5 + Math.min(qty / 60, 1) * 0.5
    }
    return 1
  }, [mode, qty])

  const geometry = useMemo(() => {
    switch (shape) {
      case 'bottle':
        return new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8)
      case 'bag':
        return new THREE.BoxGeometry(0.2, 0.25, 0.08)
      default:
        return new THREE.BoxGeometry(0.28, 0.28, 0.2)
    }
  }, [shape])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      onSelect(product, slot)
    },
    [product, slot, onSelect]
  )

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'default'
  }, [])

  return (
    <group position={position}>
      <mesh
        ref={ref}
        geometry={geometry}
        scale={hovered && mode === 'shopper' ? scale * 1.1 : scale}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color={stockColor}
          roughness={0.5}
          metalness={0.1}
          emissive={hovered ? '#FFFFFF' : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      {/* Manager mode: low-stock tag */}
      {mode === 'manager' && qty <= minQty && qty > 0 && (
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#E5322D" emissive="#E5322D" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Manager mode: empty slot gap indicator */}
      {mode === 'manager' && qty === 0 && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.2]} />
          <meshBasicMaterial color="#E5322D" wireframe />
        </mesh>
      )}
    </group>
  )
}

// Label textures are generated procedurally for products
export function makeProductTexture(color: string, name: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillRect(8, 8, 112, 40)
  ctx.fillStyle = '#14213D'
  ctx.font = 'bold 10px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(name.slice(0, 14), 64, 30)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}
