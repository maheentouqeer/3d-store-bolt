import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

export function AuthModal() {
  const authOpen = useStore((s) => s.authOpen)
  const setAuthOpen = useStore((s) => s.setAuthOpen)
  const setIsAuthed = useStore((s) => s.setIsAuthed)
  const setUserEmail = useStore((s) => s.setUserEmail)
  const setMode = useStore((s) => s.setMode)

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!authOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      setIsAuthed(true)
      setUserEmail(email)
      setAuthOpen(false)
      setMode('manager')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 fade-in">
      <div className="bg-ink rounded-lg shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden slide-up">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-deep flex items-center justify-center font-sign font-bold text-paper text-xl">
              Ω
            </div>
            <div>
              <h2 className="font-sign font-bold text-paper text-xl">
                {isLogin ? 'Manager Login' : 'Create Account'}
              </h2>
              <p className="text-paper/50 text-xs">Access inventory management</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-11 px-3 rounded-lg bg-white/10 text-paper text-sm outline-none focus-ring border border-white/10 placeholder:text-paper/40"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full h-11 px-3 rounded-lg bg-white/10 text-paper text-sm outline-none focus-ring border border-white/10 placeholder:text-paper/40"
            />

            {error && (
              <div className="text-signal text-xs bg-signal/10 rounded-lg p-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-deep text-paper font-medium hover:bg-deep/80 transition-colors focus-ring disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="text-paper/50 hover:text-paper text-xs transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <button
            onClick={() => setAuthOpen(false)}
            className="w-full py-2 text-paper/40 hover:text-paper text-xs transition-colors mt-4"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
