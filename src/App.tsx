import { useEffect } from 'react'
import { Scene } from './components/Scene'
import { TopBar } from './components/TopBar'
import { ProductCard } from './components/ProductCard'
import { CartDrawer } from './components/CartDrawer'
import { CheckoutFlow } from './components/CheckoutFlow'
import { Minimap } from './components/Minimap'
import { ManagerPanel } from './components/ManagerPanel'
import { AuthModal } from './components/AuthModal'
import { HelpOverlay } from './components/HelpOverlay'
import { LoadingScreen } from './components/LoadingScreen'
import { useStore } from './lib/store'
import { supabase } from './lib/supabase'
import type { Product, ShelfSlot, StockRecord } from './lib/supabase'

export default function App() {
  const setStoreData = useStore((s) => s.setStoreData)
  const setLoading = useStore((s) => s.setLoading)
  const loading = useStore((s) => s.loading)
  const setShowHelp = useStore((s) => s.setShowHelp)
  const setIsAuthed = useStore((s) => s.setIsAuthed)
  const setUserEmail = useStore((s) => s.setUserEmail)
  const updateStock = useStore((s) => s.updateStock)

  // Load store data
  useEffect(() => {
    (async () => {
      try {
        const [{ data: products }, { data: slots }, { data: stock }] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('shelf_slots').select('*'),
          supabase.from('stock').select('*'),
        ])

        const productMap = new Map<string, Product>()
        ;(products || []).forEach((p: Product) => productMap.set(p.id, p))

        const stockMap = new Map<string, StockRecord>()
        ;(stock || []).forEach((s: StockRecord) => stockMap.set(s.slot_id, s))

        const slotsWithData = (slots || []).map((s: ShelfSlot) => ({
          ...s,
          product: productMap.get(s.product_id ?? '') || null,
          stock: stockMap.get(s.id) || null,
        }))

        const productArr = (products || []) as Product[]
        setStoreData(productArr, slotsWithData)
      } catch (e) {
        console.error('Failed to load store data', e)
      } finally {
        setLoading(false)
      }
    })()

    // Show help on first load
    setShowHelp(true)
  }, [setStoreData, setLoading, setShowHelp])

  // Check existing auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsAuthed(true)
        setUserEmail(data.session.user.email || null)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
      setUserEmail(session?.user.email || null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [setIsAuthed, setUserEmail])

  // Realtime stock updates
  useEffect(() => {
    const channel = supabase
      .channel('stock-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stock' }, (payload) => {
        const newStock = payload.new as StockRecord
        updateStock(newStock.slot_id, newStock.qty)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [updateStock])

  return (
    <div className="w-full h-full relative">
      <LoadingScreen />
      {!loading && (
        <>
          <Scene />
          <TopBar />
          <ManagerPanel />
          <ProductCard />
          <CartDrawer />
          <CheckoutFlow />
          <Minimap />
          <AuthModal />
          <HelpOverlay />
        </>
      )}
    </div>
  )
}
