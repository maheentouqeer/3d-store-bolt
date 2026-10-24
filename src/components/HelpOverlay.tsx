import { useStore } from '../lib/store'

export function HelpOverlay() {
  const showHelp = useStore((s) => s.showHelp)
  const setShowHelp = useStore((s) => s.setShowHelp)

  if (!showHelp) return null

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 fade-in">
      <div className="bg-ink rounded-lg shadow-2xl border border-white/10 w-full max-w-sm p-6 slide-up">
        <h2 className="font-sign font-bold text-paper text-2xl mb-4">How to Shop</h2>

        <div className="space-y-4">
          {isTouch ? (
            <>
              <HelpItem icon="⊗" title="Move" desc="Left side of screen: drag to use joystick" />
              <HelpItem icon="⟲" title="Look around" desc="Right side of screen: drag to look" />
              <HelpItem icon="☉" title="Select product" desc="Tap a product on the shelf" />
            </>
          ) : (
            <>
              <HelpItem icon="WASD" title="Move" desc="W A S D or arrow keys to walk" />
              <HelpItem icon="⊞" title="Look around" desc="Move mouse to look (click to capture)" />
              <HelpItem icon="⟳" title="Sprint" desc="Hold Shift to move faster" />
              <HelpItem icon="☉" title="Select product" desc="Click a product on the shelf" />
              <HelpItem icon="Esc" title="Release mouse" desc="Press Escape to exit pointer lock" />
            </>
          )}
          <HelpItem icon="🔍" title="Search" desc="Use the search bar to fly to a product" />
          <HelpItem icon="🛒" title="Cart" desc="Add items, open cart, checkout at a lane" />
        </div>

        <button
          onClick={() => setShowHelp(false)}
          className="w-full h-11 rounded-lg bg-deep text-paper font-medium hover:bg-deep/80 transition-colors focus-ring mt-6"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

function HelpItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-paper font-mono font-bold text-sm shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-paper text-sm font-medium">{title}</div>
        <div className="text-paper/50 text-xs mt-0.5">{desc}</div>
      </div>
    </div>
  )
}
