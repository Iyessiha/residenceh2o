'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Parametres() {
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [pwForm, setPwForm] = useState({ current: '', nouveau: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function changePassword(e) {
    e.preventDefault()
    if (pwForm.nouveau !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (pwForm.nouveau.length < 8) {
      setPwMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 8 caractères.' })
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.nouveau })
    if (error) {
      setPwMsg({ type: 'error', text: error.message })
    } else {
      setPwMsg({ type: 'success', text: 'Mot de passe mis à jour avec succès.' })
      setPwForm({ current: '', nouveau: '', confirm: '' })
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Account info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Informations du compte</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
              <p className="text-gray-900 font-medium">{user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Rôle</p>
              <p className="text-gray-900">Administrateur</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Dernière connexion</p>
              <p className="text-gray-900">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Changer le mot de passe</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input type="password" className="input" value={pwForm.nouveau}
                onChange={e => setPwForm(p => ({...p, nouveau: e.target.value}))}
                placeholder="Minimum 8 caractères" />
            </div>
            <div>
              <label className="label">Confirmer le mot de passe</label>
              <input type="password" className="input" value={pwForm.confirm}
                onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))}
                placeholder="Répéter le nouveau mot de passe" />
            </div>
            {pwMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" disabled={saving || !pwForm.nouveau} className="btn-primary w-full">
              {saving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </div>

        {/* App info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">À propos de l'application</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Application</span><span className="font-medium">H2O Manager</span></div>
            <div className="flex justify-between"><span>Version</span><span className="font-medium">1.0.0</span></div>
            <div className="flex justify-between"><span>Établissement</span><span className="font-medium">Les Résidences H2O</span></div>
            <div className="flex justify-between"><span>Développé par</span><span className="font-medium">MonWe Infinity LLC</span></div>
            <div className="flex justify-between"><span>Support</span>
              <a href="https://wa.me/2250500446464" target="_blank" rel="noopener noreferrer"
                className="text-teal-600 hover:underline font-medium">
                +225 05 00 44 64 64
              </a>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Accès rapides</h2>
          <div className="space-y-2">
            {[
              { label: '📅 Gérer les réservations', href: '/dashboard/reservations' },
              { label: '🏠 Statut des duplexes', href: '/dashboard/duplexes' },
              { label: '👥 Base clients', href: '/dashboard/clients' },
              { label: '📈 Voir les rapports', href: '/dashboard/rapports' },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors border border-gray-100">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
