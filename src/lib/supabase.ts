import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key, {
  auth: { persistSession: true },
})

export type Product = {
  id: string
  sku: string
  name: string
  category: string
  price: number
  shape: string
  color: string
  aisle: number
  slot_index: number
}

export type ShelfSlot = {
  id: string
  aisle: number
  side: number
  z_index: number
  pos_x: number
  pos_y: number
  pos_z: number
  product_id: string | null
  product?: Product | null
}

export type StockRecord = {
  slot_id: string
  qty: number
  min_qty: number
  updated_at: string
}

export type OrderRow = {
  id: string
  order_number: string
  subtotal: number
  tax: number
  total: number
  status: string
  payment_method: string | null
  created_at: string
}

export type ShelfSlotWithStock = ShelfSlot & {
  stock?: StockRecord | null
}
