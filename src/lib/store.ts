import { create } from 'zustand'
import type { Product, ShelfSlotWithStock } from './supabase'

export type AppMode = 'shopper' | 'manager'
export type CartItem = {
  product: Product
  qty: number
}

type StoreState = {
  mode: AppMode
  setMode: (m: AppMode) => void

  products: Product[]
  slots: ShelfSlotWithStock[]
  setStoreData: (products: Product[], slots: ShelfSlotWithStock[]) => void
  updateStock: (slotId: string, qty: number) => void
  updateProductPrice: (productId: string, price: number) => void

  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, qty: number) => void
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (v: boolean) => void

  selectedProduct: Product | null
  selectedSlot: ShelfSlotWithStock | null
  setSelected: (product: Product | null, slot: ShelfSlotWithStock | null) => void

  searchQuery: string
  setSearchQuery: (q: string) => void

  cameraTarget: { x: number; z: number } | null
  flyToShelf: (aisle: number, z: number) => void
  clearCameraTarget: () => void

  checkoutActive: boolean
  setCheckoutActive: (v: boolean) => void

  authOpen: boolean
  setAuthOpen: (v: boolean) => void
  isAuthed: boolean
  setIsAuthed: (v: boolean) => void
  userEmail: string | null
  setUserEmail: (e: string | null) => void

  showHelp: boolean
  setShowHelp: (v: boolean) => void
  showMinimap: boolean
  setShowMinimap: (v: boolean) => void
  playerPos: { x: number; z: number }
  setPlayerPos: (x: number, z: number) => void

  loading: boolean
  setLoading: (v: boolean) => void
}

export const useStore = create<StoreState>((set) => ({
  mode: 'shopper',
  setMode: (m) => set({ mode: m }),

  products: [],
  slots: [],
  setStoreData: (products, slots) => set({ products, slots }),
  updateStock: (slotId, qty) =>
    set((s) => ({
      slots: s.slots.map((sl) =>
        sl.id === slotId
          ? { ...sl, stock: sl.stock ? { ...sl.stock, qty } : { slot_id: slotId, qty, min_qty: 10, updated_at: new Date().toISOString() } }
          : sl
      ),
    })),
  updateProductPrice: (productId, price) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === productId ? { ...p, price } : p)),
      slots: s.slots.map((sl) =>
        sl.product?.id === productId ? { ...sl, product: { ...sl.product, price } } : sl
      ),
    })),

  cart: [],
  addToCart: (product) =>
    set((s) => {
      const existing = s.cart.find((c) => c.product.id === product.id)
      if (existing) {
        return { cart: s.cart.map((c) => (c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)) }
      }
      return { cart: [...s.cart, { product, qty: 1 }] }
    }),
  removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((c) => c.product.id !== productId) })),
  updateCartQty: (productId, qty) =>
    set((s) => ({
      cart: qty <= 0 ? s.cart.filter((c) => c.product.id !== productId) : s.cart.map((c) => (c.product.id === productId ? { ...c, qty } : c)),
    })),
  clearCart: () => set({ cart: [] }),
  cartOpen: false,
  setCartOpen: (v) => set({ cartOpen: v }),

  selectedProduct: null,
  selectedSlot: null,
  setSelected: (product, slot) => set({ selectedProduct: product, selectedSlot: slot }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  cameraTarget: null,
  flyToShelf: (aisle, z) => set({ cameraTarget: { x: -10.5 + aisle * 3.0, z } }),
  clearCameraTarget: () => set({ cameraTarget: null }),

  checkoutActive: false,
  setCheckoutActive: (v) => set({ checkoutActive: v }),

  authOpen: false,
  setAuthOpen: (v) => set({ authOpen: v }),
  isAuthed: false,
  setIsAuthed: (v) => set({ isAuthed: v }),
  userEmail: null,
  setUserEmail: (e) => set({ userEmail: e }),

  showHelp: false,
  setShowHelp: (v) => set({ showHelp: v }),
  showMinimap: true,
  setShowMinimap: (v) => set({ showMinimap: v }),
  playerPos: { x: 0, z: 14 },
  setPlayerPos: (x, z) => set({ playerPos: { x, z } }),

  loading: true,
  setLoading: (v) => set({ loading: v }),
}))

export const TAX_RATE = 0.08

export const CATEGORIES = [
  'Beauty', 'Pharmacy', 'Food', 'Drinks',
  'Apparel', 'Electronics', 'Home', 'Kids',
] as const
