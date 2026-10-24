import { useStore } from '../lib/store'

export function LoadingScreen() {
  const loading = useStore((s) => s.loading)

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-deep flex items-center justify-center font-sign font-bold text-paper text-3xl">
          Ω
        </div>
        <h1 className="font-sign font-bold text-paper text-3xl mb-2">Omega</h1>
        <p className="text-paper/50 text-sm mb-6">3D Store Experience</p>
        <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-deep rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  )
}
