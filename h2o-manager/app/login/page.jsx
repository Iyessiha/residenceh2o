'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/20 rounded-2xl mb-4">
            <span className="text-3xl">🏊</span>
          </div>
          <h1 className="text-white text-2xl font-bold">H2O Manager</h1>
          <p className="text-white/50 text-sm mt-1">Résidences H2O — Espace réservé au personnel</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <label className="label">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="input" placeholder="direction@residencesh2o.com"
              autoComplete="username"
            />
          </div>
          <div className="mb-6">
            <label className="label">Mot de passe</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="input" placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          Accès réservé au personnel des Résidences H2O
        </p>
      </div>
    </div>
  )
}
