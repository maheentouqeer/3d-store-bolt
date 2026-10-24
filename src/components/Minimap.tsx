import { useStore } from '../lib/store'
import { STORE } from '../lib/constants'

export function Minimap() {
  const showMinimap = useStore((s) => s.showMinimap)
  const playerPos = useStore((s) => s.playerPos)
  const mode = useStore((s) => s.mode)
  const slots = useStore((s) => s.slots)

  if (!showMinimap) return null

  // Scale: store is 40x30, minimap is 160x120
  const mapW = 160
  const mapH = 120
  const scaleX = mapW / STORE.width
  const scaleZ = mapH / STORE.depth
  const toX = (worldX: number) => (worldX + STORE.width / 2) * scaleX
  const toY = (worldZ: number) => (worldZ + STORE.depth / 2) * scaleZ

  const lowStockSlots = mode === 'manager'
    ? slots.filter((s) => s.product && s.stock && s.stock.qty <= s.stock.min_qty)
    : []

  return (
    <div className="fixed bottom-4 right-4 z-20 bg-ink/90 backdrop-blur rounded-lg border border-white/10 p-2">
      <div className="relative" style={{ width: mapW, height: mapH }}>
        {/* Store floor */}
        <div className="absolute inset-0 bg-paper/20 rounded" />

        {/* Aisles */}
        {Array.from({ length: STORE.aisleCount }).map((_, i) => {
          const ax = STORE.aisleStartX + i * STORE.aisleSpacing
          return (
            <div
              key={i}
              className="absolute bg-deep/60"
              style={{
                left: toX(ax - 0.5),
                top: toY(-12),
                width: 1 * scaleX,
                height: 24 * scaleZ,
              }}
            />
          )
        })}

        {/* Checkout area */}
        <div
          className="absolute bg-ink/60"
          style={{
            left: toX(-12),
            top: toY(12.5),
            width: 24 * scaleX,
            height: 1.5 * scaleZ,
          }}
        />

        {/* Low stock markers (manager mode) */}
        {lowStockSlots.map((s) => (
          <div
            key={s.id}
            className="absolute w-1.5 h-1.5 rounded-full bg-signal pulse-red"
            style={{
              left: toX(s.pos_x) - 3,
              top: toY(s.pos_z) - 3,
            }}
          />
        ))}

        {/* Player position */}
        <div
          className="absolute w-3 h-3 rounded-full bg-signal border-2 border-white shadow-lg"
          style={{
            left: toX(playerPos.x) - 6,
            top: toY(playerPos.z) - 6,
          }}
        />
      </div>
      <div className="text-paper/40 text-xs mt-1 text-center font-mono">
        {mode === 'manager' && lowStockSlots.length > 0
          ? `${lowStockSlots.length} low-stock`
          : 'You are here'}
      </div>
    </div>
  )
}
