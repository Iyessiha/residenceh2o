'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  ROLES_MANAGER, lireSonsActifs, ecrireSonsActifs, lireVolume, ecrireVolume,
  activerSon, jouerSon, sonPret,
} from '@/lib/alertes'
import { demanderPermissionNotifications } from '@/lib/notifications'

const PEUT_MODIFIER_ROLES = ['admin', 'gerance']

// Réglages des alertes : son et volume (par appareil), rôles concernés (partagés)
export default function AlertesReglages() {
  const supabase = createClient()
  const [sons, setSons] = useState(true)
  const [volume, setVolume] = useState(80)
  const [pret, setPret] = useState(false)
  const [roleUtilisateur, setRoleUtilisateur] = useState(null)
  const [roles, setRoles] = useState(ROLES_MANAGER.map(r => r.key))
  const [enregistre, setEnregistre] = useState(null)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    setSons(lireSonsActifs())
    setVolume(lireVolume())
    setPret(sonPret())

    supabase.auth.getUser().then(async ({ data }) => {
      const id = data?.user?.id
      if (!id) return
      const { data: profil } = await supabase.from('profiles').select('role').eq('id', id).maybeSingle()
      setRoleUtilisateur(profil?.role || null)
    })
    supabase.from('alertes_reglages').select('roles').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data?.roles) setRoles(data.roles) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const peutModifier = PEUT_MODIFIER_ROLES.includes(roleUtilisateur)

  function basculerSons() {
    const nouveau = !sons
    setSons(nouveau)
    ecrireSonsActifs(nouveau)
  }

  function changerVolume(v) {
    setVolume(v)
    ecrireVolume(v)
  }

  async function activer() {
    demanderPermissionNotifications()
    setPret(await activerSon())
  }

  function basculerRole(key) {
    setRoles(liste => (liste.includes(key) ? liste.filter(r => r !== key) : [...liste, key]))
    setEnregistre(null)
  }

  async function enregistrerRoles() {
    setErreur(null)
    if (roles.length === 0) { setErreur('Sélectionnez au moins un rôle.'); return }
    const { error } = await supabase
      .from('alertes_reglages')
      .update({ roles, updated_at: new Date().toISOString() })
      .eq('id', 1)
    if (error) { setErreur(error.message); return }
    setEnregistre('Rôles enregistrés. Ils s\'appliquent aux prochaines alertes.')
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-800 mb-1">Alertes sonores</h2>
      <p className="text-xs text-gray-400 mb-4">Son et volume : réglages de cet appareil. Rôles : partagés par toute l'équipe.</p>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={activer}
            className={`btn-primary text-sm ${pret ? 'opacity-60' : ''}`}>
            {pret ? '🔊 Alertes sonores actives' : '🔊 Activer les alertes sonores'}
          </button>
          <button onClick={basculerSons} className="btn-secondary text-sm">
            {sons ? '🔔 Sons activés (couper)' : '🔕 Sons coupés (activer)'}
          </button>
        </div>

        <div>
          <label className="label">Volume · {volume} %</label>
          <input type="range" min="0" max="100" step="5" value={volume}
            onChange={e => changerVolume(Number(e.target.value))}
            className="w-full" />
        </div>

        <div>
          <p className="label mb-2">Écouter les sonneries</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => jouerSon('reservation')} className="btn-secondary text-sm">🎵 Réservation</button>
            <button onClick={() => jouerSon('commande')} className="btn-secondary text-sm">🎵 Commande / vente</button>
          </div>
          {!pret && <p className="text-xs text-gray-400 mt-2">Cliquez d'abord sur « Activer les alertes sonores » : le navigateur bloque le son sans interaction.</p>}
        </div>

        <div>
          <p className="label mb-2">Rôles concernés</p>
          <div className="flex flex-wrap gap-3">
            {ROLES_MANAGER.map(r => (
              <label key={r.key} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${peutModifier ? 'cursor-pointer' : 'opacity-70'}`}>
                <input type="checkbox" disabled={!peutModifier}
                  checked={roles.includes(r.key)} onChange={() => basculerRole(r.key)} />
                {r.label}
              </label>
            ))}
          </div>
          {peutModifier ? (
            <div className="flex items-center gap-3 mt-3">
              <button onClick={enregistrerRoles} className="btn-primary text-sm">Enregistrer les rôles</button>
              {enregistre && <span className="text-xs text-green-700">{enregistre}</span>}
              {erreur && <span className="text-xs text-red-600">{erreur}</span>}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Seuls l'administrateur et la gérance peuvent modifier les rôles concernés.</p>
          )}
        </div>
      </div>
    </div>
  )
}
