import { useStore } from '../lib/store'

export function ManagerPanel() {
  const mode = useStore((s) => s.mode)
  const slots = useStore((s) => s.slots)
  const flyToShelf = useStore((s) => s.flyToShelf)
  const setSelected = useStore((s) => s.setSelected)

  if (mode !== 'manager') return null

  const lowStock = slots.filter((s) => s.product && s.stock && s.stock.qty <= s.stock.min_qty)
  const outOfStock = lowStock.filter((s) => s.stock!.qty === 0)
  const lowOnly = lowStock.filter((s) => s.stock!.qty > 0)

  const totalUnits = slots.reduce((sum, s) => sum + (s.stock?.qty ?? 0), 0)
  const totalProducts = slots.filter((s) => s.product).length

  return (
    <div className="fixed top-16 left-4 z-20 bg-ink/90 backdrop-blur rounded-lg border border-white/10 w-72 max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-sign font-bold text-paper text-base mb-3">Inventory Dashboard</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="font-mono text-paper text-lg font-bold">{totalProducts}</div>
            <div className="text-paper/40 text-xs">Products</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="font-mono text-paper text-lg font-bold">{totalUnits}</div>
            <div className="text-paper/40 text-xs">Units</div>
          </div>
          <div className="bg-signal/10 rounded-lg p-2">
            <div className="font-mono text-signal text-lg font-bold">{lowStock.length}</div>
            <div className="text-paper/40 text-xs">Alerts</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {lowStock.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-sm font-medium mb-1">All stocked</div>
            <div className="text-paper/40 text-xs">No low-stock alerts</div>
          </div>
        ) : (
          <div className="space-y-2">
            {outOfStock.length > 0 && (
              <div className="text-signal text-xs font-bold uppercase tracking-wide mb-1">Out of Stock</div>
            )}
            {outOfStock.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  flyToShelf(s.aisle, s.pos_z)
                  setSelected(s.product ?? null, s)
                }}
                className="w-full text-left p-2.5 rounded-lg bg-signal/10 hover:bg-signal/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-paper text-sm font-medium truncate flex-1">{s.product?.name}</span>
                  <span className="font-mono text-signal text-xs ml-2">0</span>
                </div>
                <div className="text-paper/40 text-xs mt-0.5">{s.product?.category} · Aisle {s.aisle + 1}</div>
              </button>
            ))}

            {lowOnly.length > 0 && (
              <div className="text-signal/80 text-xs font-bold uppercase tracking-wide mb-1 mt-3">Low Stock</div>
            )}
            {lowOnly.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  flyToShelf(s.aisle, s.pos_z)
                  setSelected(s.product ?? null, s)
                }}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-paper text-sm font-medium truncate flex-1">{s.product?.name}</span>
                  <span className="font-mono text-signal text-xs ml-2">{s.stock?.qty}</span>
                </div>
                <div className="text-paper/40 text-xs mt-0.5">{s.product?.category} · Aisle {s.aisle + 1}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
