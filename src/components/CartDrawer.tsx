import { useStore, TAX_RATE } from '../lib/store'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export function CartDrawer() {
  const cart = useStore((s) => s.cart)
  const cartOpen = useStore((s) => s.cartOpen)
  const setCartOpen = useStore((s) => s.setCartOpen)
  const updateCartQty = useStore((s) => s.updateCartQty)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const clearCart = useStore((s) => s.clearCart)
  const setCheckoutActive = useStore((s) => s.setCheckoutActive)

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const handleCheckout = () => {
    setCartOpen(false)
    setCheckoutActive(true)
  }

  if (!cartOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 fade-in" onClick={() => setCartOpen(false)} />
      <div className="relative w-full max-w-md bg-ink h-full shadow-2xl flex flex-col slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-sign font-bold text-paper text-xl">Your Cart</h2>
          <button
            onClick={() => setCartOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/10 text-paper hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {cart.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-paper/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-paper/50 text-sm">Your cart is empty</p>
              <p className="text-paper/30 text-xs mt-2">Click products on shelves to add them</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div
                    className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-sign font-bold text-center px-1"
                    style={{ background: item.product.color }}
                  >
                    {item.product.name.slice(0, 8)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-paper text-sm font-medium truncate">{item.product.name}</div>
                    <div className="text-paper/50 text-xs font-mono">${item.product.price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                      className="w-7 h-7 rounded bg-white/10 text-paper hover:bg-white/20 flex items-center justify-center text-sm"
                    >
                      −
                    </button>
                    <span className="font-mono text-paper w-6 text-center text-sm">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                      className="w-7 h-7 rounded bg-white/10 text-paper hover:bg-white/20 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="w-7 h-7 rounded bg-signal/20 text-signal hover:bg-signal/30 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={clearCart}
                className="w-full py-2 text-paper/40 hover:text-signal text-xs transition-colors"
              >
                Clear cart
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between text-paper/60 text-sm">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-paper/60 text-sm">
              <span>Tax (8%)</span>
              <span className="font-mono">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-paper font-bold text-lg pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full h-12 rounded-lg bg-deep text-paper font-medium hover:bg-deep/80 transition-colors focus-ring mt-2"
            >
              Go to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
