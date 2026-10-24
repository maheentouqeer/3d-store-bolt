import { useStore } from '../lib/store'
import { useState } from 'react'
import type { Product, ShelfSlotWithStock } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export function ProductCard() {
  const selectedProduct = useStore((s) => s.selectedProduct)
  const selectedSlot = useStore((s) => s.selectedSlot)
  const setSelected = useStore((s) => s.setSelected)
  const addToCart = useStore((s) => s.addToCart)
  const mode = useStore((s) => s.mode)
  const updateStock = useStore((s) => s.updateStock)
  const updateProductPrice = useStore((s) => s.updateProductPrice)
  const isAuthed = useStore((s) => s.isAuthed)

  const [qty, setQty] = useState(1)
  const [editingPrice, setEditingPrice] = useState(false)
  const [editingQty, setEditingQty] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [qtyInput, setQtyInput] = useState('')
  const [reorderInput, setReorderInput] = useState('')
  const [justAdded, setJustAdded] = useState(false)

  if (!selectedProduct) return null

  const product = selectedProduct
  const slot = selectedSlot
  const stockQty = slot?.stock?.qty ?? 0
  const minQty = slot?.stock?.min_qty ?? 10
  const isLowStock = stockQty <= minQty

  const handleClose = () => {
    setSelected(null, null)
    setQty(1)
    setEditingPrice(false)
    setEditingQty(false)
  }

  const handleAdd = () => {
    addToCart(product)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 800)
  }

  const handleSavePrice = async () => {
    const newPrice = parseFloat(priceInput)
    if (isNaN(newPrice) || newPrice < 0) return
    updateProductPrice(product.id, newPrice)
    await supabase.from('products').update({ price: newPrice }).eq('id', product.id)
    setEditingPrice(false)
  }

  const handleSaveStock = async () => {
    const newQty = parseInt(qtyInput)
    const newMin = parseInt(reorderInput)
    if (isNaN(newQty) || newQty < 0) return
    const minVal = isNaN(newMin) ? minQty : newMin
    if (slot) {
      updateStock(slot.id, newQty)
      await supabase.from('stock').update({ qty: newQty, min_qty: minVal, updated_at: new Date().toISOString() }).eq('slot_id', slot.id)
    }
    setEditingQty(false)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[340px] max-w-[calc(100vw-2rem)] slide-up">
      <div className="bg-ink rounded-lg shadow-2xl border border-white/10 overflow-hidden">
        {/* Product image / color swatch */}
        <div
          className="h-32 flex items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${product.color}, ${product.color}99)` }}
        >
          <div className="text-white text-center">
            <div className="text-2xl font-sign font-bold drop-shadow-lg">{product.name}</div>
            <div className="text-sm opacity-80 mt-1">{product.category}</div>
          </div>
          {isLowStock && mode === 'shopper' && stockQty > 0 && (
            <div className="absolute top-2 right-2 bg-signal text-white text-xs font-bold px-2 py-1 rounded pulse-red">
              Only {stockQty} left
            </div>
          )}
          <button
            onClick={handleClose}
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-paper/50">{product.sku}</span>
            <span className="font-mono text-lg font-bold text-paper">${product.price.toFixed(2)}</span>
          </div>

          {mode === 'shopper' ? (
            <>
              {/* Quantity stepper */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-paper/60 text-sm">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-paper hover:bg-white/20 transition-colors focus-ring flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="font-mono text-paper w-8 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-8 h-8 rounded-lg bg-white/10 text-paper hover:bg-white/20 transition-colors focus-ring flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                className={`w-full h-11 rounded-lg font-medium text-sm transition-all focus-ring ${
                  justAdded
                    ? 'bg-green-600 text-white'
                    : 'bg-deep text-paper hover:bg-deep/80'
                }`}
              >
                {justAdded ? 'Added to cart!' : `Add ${qty} to cart — $${(product.price * qty).toFixed(2)}`}
              </button>
            </>
          ) : (
            /* Manager mode editing */
            <div className="space-y-3">
              {/* Price editing */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-paper/60 text-sm">Price</span>
                {editingPrice ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-20 h-8 px-2 rounded bg-white/10 text-paper text-sm outline-none focus-ring border border-white/10"
                      autoFocus
                    />
                    <button onClick={handleSavePrice} className="px-2 h-8 rounded bg-green-600 text-white text-xs font-medium">Save</button>
                    <button onClick={() => setEditingPrice(false)} className="px-2 h-8 rounded bg-white/10 text-paper text-xs">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setPriceInput(product.price.toString()); setEditingPrice(true) }}
                    className="font-mono text-paper hover:text-signal transition-colors"
                  >
                    ${product.price.toFixed(2)} ✎
                  </button>
                )}
              </div>

              {/* Stock editing */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-paper/60 text-sm">Stock</span>
                {editingQty ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={qtyInput}
                        onChange={(e) => setQtyInput(e.target.value)}
                        placeholder="Qty"
                        className="w-16 h-8 px-2 rounded bg-white/10 text-paper text-sm outline-none focus-ring border border-white/10"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={reorderInput}
                        onChange={(e) => setReorderInput(e.target.value)}
                        placeholder="Min"
                        className="w-16 h-8 px-2 rounded bg-white/10 text-paper text-sm outline-none focus-ring border border-white/10"
                      />
                      <button onClick={handleSaveStock} className="px-2 h-8 rounded bg-green-600 text-white text-xs font-medium">Save</button>
                      <button onClick={() => setEditingQty(false)} className="px-2 h-8 rounded bg-white/10 text-paper text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setQtyInput(stockQty.toString()); setReorderInput(minQty.toString()); setEditingQty(true) }}
                    className={`font-mono text-sm hover:text-signal transition-colors ${isLowStock ? 'text-signal font-bold' : 'text-paper'}`}
                  >
                    {stockQty} units (min {minQty}) ✎
                  </button>
                )}
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2 pt-1">
                {stockQty === 0 ? (
                  <span className="px-2 py-1 rounded bg-signal/20 text-signal text-xs font-medium">OUT OF STOCK</span>
                ) : isLowStock ? (
                  <span className="px-2 py-1 rounded bg-signal/20 text-signal text-xs font-medium">LOW STOCK</span>
                ) : (
                  <span className="px-2 py-1 rounded bg-green-600/20 text-green-400 text-xs font-medium">IN STOCK</span>
                )}
                <span className="px-2 py-1 rounded bg-white/10 text-paper/60 text-xs">{product.shape}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
