import { useStore, CATEGORIES, TAX_RATE } from '../lib/store'
import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

export function TopBar() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const cart = useStore((s) => s.cart)
  const setCartOpen = useStore((s) => s.setCartOpen)
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const flyToShelf = useStore((s) => s.flyToShelf)
  const products = useStore((s) => s.products)
  const slots = useStore((s) => s.slots)
  const isAuthed = useStore((s) => s.isAuthed)
  const setAuthOpen = useStore((s) => s.setAuthOpen)
  const showMinimap = useStore((s) => s.showMinimap)
  const setShowMinimap = useStore((s) => s.setShowMinimap)
  const setShowHelp = useStore((s) => s.setShowHelp)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 8)
  }, [searchQuery, products])

  const handleSearchSelect = (aisle: number) => {
    flyToShelf(aisle, 0)
    setSearchQuery('')
    setMenuOpen(false)
  }

  const handleCategorySelect = (catIdx: number) => {
    flyToShelf(catIdx, 0)
    setMenuOpen(false)
  }

  const handleModeSwitch = () => {
    if (mode === 'shopper') {
      if (!isAuthed) {
        setAuthOpen(true)
        return
      }
      setMode('manager')
    } else {
      setMode('shopper')
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 glass-bar border-b border-white/10">
      <div className="flex items-center gap-3 px-4 h-14 max-w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-deep flex items-center justify-center font-sign font-bold text-paper text-lg">
            Ω
          </div>
          <span className="font-sign font-bold text-paper text-lg hidden sm:block">Omega</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search products..."
              className="w-full h-10 px-4 pr-10 rounded-lg bg-white/10 text-paper placeholder:text-paper/50 text-sm focus-ring outline-none border border-white/10"
            />
            <svg className="absolute right-3 top-2.5 w-5 h-5 text-paper/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
          </div>
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-ink rounded-lg shadow-xl border border-white/10 max-h-80 overflow-y-auto scrollbar-thin slide-up">
              {searchResults.map((p) => {
                const slot = slots.find((s) => s.product_id === p.id)
                return (
                  <button
                    key={p.id}
                    onMouseDown={() => handleSearchSelect(p.aisle)}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-paper text-sm font-medium">{p.name}</div>
                      <div className="text-paper/50 text-xs">{p.category}</div>
                    </div>
                    <div className="font-mono text-paper/70 text-sm">${p.price.toFixed(2)}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Category menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-10 px-3 rounded-lg bg-white/10 text-paper text-sm font-medium hover:bg-white/20 transition-colors focus-ring flex items-center gap-1.5"
          >
            <span className="hidden sm:inline">Aisles</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-12 right-0 bg-ink rounded-lg shadow-xl border border-white/10 w-48 z-50 slide-up">
                {CATEGORIES.map((cat, i) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(i)}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-paper text-sm first:rounded-t-lg last:rounded-b-lg"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mode toggle */}
        <button
          onClick={handleModeSwitch}
          className={`h-10 px-3 rounded-lg text-sm font-medium transition-colors focus-ring flex items-center gap-1.5 shrink-0 ${
            mode === 'manager'
              ? 'bg-signal text-white'
              : 'bg-white/10 text-paper hover:bg-white/20'
          }`}
        >
          {mode === 'manager' ? 'Manager' : 'Shopper'}
        </button>

        {/* Minimap toggle */}
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className="h-10 w-10 rounded-lg bg-white/10 text-paper hover:bg-white/20 transition-colors focus-ring flex items-center justify-center shrink-0"
          title="Toggle minimap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
          </svg>
        </button>

        {/* Help */}
        <button
          onClick={() => setShowHelp(true)}
          className="h-10 w-10 rounded-lg bg-white/10 text-paper hover:bg-white/20 transition-colors focus-ring flex items-center justify-center shrink-0"
          title="Help"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9a3.228 3.228 0 016.456 0c0 2-2.228 3-2.228 3v2m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Cart */}
        <button
          onClick={() => setCartOpen(true)}
          className="h-10 px-3 rounded-lg bg-deep text-paper hover:bg-deep/80 transition-colors focus-ring flex items-center gap-2 shrink-0 relative"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-signal text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center font-mono">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
