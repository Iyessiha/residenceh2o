'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatFCFA } from '@/lib/utils'

// ── Constantes ────────────────────────────────────────────
const STATUTS = { en_cours: 'En cours', servie: 'Servie', payee: 'Payée', annulee: 'Annulée' }
const STATUT_COLORS = {
  en_cours: 'bg-yellow-100 text-yellow-800',
  servie:   'bg-blue-100 text-blue-700',
  payee:    'bg-green-100 text-green-800',
  annulee:  'bg-gray-100 text-gray-500',
}
const PAIEMENTS = { especes: 'Espèces', mobile_money: 'Mobile Money', carte: 'Carte', virement: 'Virement' }

const CATEGORIES = [
  { key: 'plat',     label: 'Plats',            emoji: '🍽️' },
  { key: 'entree',   label: 'Entrées',           emoji: '🥗' },
  { key: 'dessert',  label: 'Desserts',          emoji: '🍮' },
  { key: 'vin',      label: 'Vins & Cocktails',  emoji: '🍷' },
  { key: 'jus',      label: 'Jus & Smoothies',   emoji: '🧃' },
  { key: 'boisson',  label: 'Boissons',          emoji: '🥤' },
  { key: 'autre',    label: 'Autre',             emoji: '📦' },
]
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

const EMPTY_LIGNE = { nom: '', qte: 1, prix: 0 }
const EMPTY_CMD = { nom_client: '', telephone: '', table_num: '', lignes: [{ ...EMPTY_LIGNE }], mode_paiement: 'especes', statut: 'en_cours', notes: '' }
const EMPTY_MENU = { nom: '', description: '', prix: '', categorie: 'plat', disponible: true, photo: '' }

// ── Éditeur de lignes de commande ─────────────────────────
function LignesEditor({ lignes, menuItems, onChange }) {
  function update(i, field, val) {
    onChange(lignes.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }
  function remove(i) { onChange(lignes.filter((_, idx) => idx !== i)) }
  function add() { onChange([...lignes, { ...EMPTY_LIGNE }]) }
  function addFromMenu(item) {
    onChange([...lignes, { nom: item.nom, qte: 1, prix: item.prix, menu_id: item.id }])
  }

  const total = lignes.reduce((s, l) => s + (parseInt(l.qte) || 0) * (parseInt(l.prix) || 0), 0)
  const disponibles = menuItems.filter(m => m.disponible)

  return (
    <div>
      {/* Raccourcis menu par catégorie */}
      {disponibles.length > 0 && (
        <div className="mb-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-2)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>
            Ajouter depuis le menu
          </p>
          {CATEGORIES.filter(c => disponibles.some(m => m.categorie === c.key)).map(cat => (
            <div key={cat.key} className="mb-2">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>
                {cat.emoji} {cat.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {disponibles.filter(m => m.categorie === cat.key).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addFromMenu(item)}
                    className="text-xs px-2 py-1 rounded-lg border transition-opacity hover:opacity-70"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}
                  >
                    {item.nom} — {formatFCFA(item.prix)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lignes */}
      <label className="label">Détail de la commande</label>
      <div className="space-y-2 mb-2">
        <div className="grid grid-cols-12 gap-1 text-xs font-semibold px-1" style={{ color: 'var(--text-3)' }}>
          <span className="col-span-5">Article / Plat</span>
          <span className="col-span-2 text-center">Qté</span>
          <span className="col-span-3 text-right">Prix unit.</span>
          <span className="col-span-2" />
        </div>
        {lignes.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-1 items-center">
            <input className="input py-1.5 text-sm col-span-5" placeholder="Plat, boisson…"
              value={l.nom} onChange={e => update(i, 'nom', e.target.value)} />
            <input className="input py-1.5 text-sm col-span-2 text-center" type="number" min="1"
              value={l.qte} onChange={e => update(i, 'qte', e.target.value)} />
            <input className="input py-1.5 text-sm col-span-3 text-right" type="number" min="0"
              value={l.prix} onChange={e => update(i, 'prix', e.target.value)} />
            <button onClick={() => remove(i)} disabled={lignes.length === 1}
              className="col-span-2 flex items-center justify-center h-8 rounded text-xs disabled:opacity-30 hover:opacity-70"
              style={{ color: '#DC2626' }}>✕</button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-1">
        <button onClick={add} className="text-xs font-semibold hover:opacity-70" style={{ color: 'var(--primary)' }}>
          + Ligne libre
        </button>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Total : {formatFCFA(total)}</span>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────
export default function Restaurant() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [tab, setTab]             = useState('commandes')
  const [commandes, setCommandes] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('tous')
  const [catFilter, setCatFilter] = useState('tous')

  // Commandes
  const [showFormCmd, setShowFormCmd] = useState(false)
  const [formCmd, setFormCmd]         = useState(EMPTY_CMD)
  const [editIdCmd, setEditIdCmd]     = useState(null)
  const [savingCmd, setSavingCmd]     = useState(false)

  // Menu
  const [showFormMenu, setShowFormMenu]   = useState(false)
  const [formMenu, setFormMenu]           = useState(EMPTY_MENU)
  const [editIdMenu, setEditIdMenu]       = useState(null)
  const [savingMenu, setSavingMenu]       = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const loadCommandes = useCallback(async () => {
    let q = supabase.from('commandes_restaurant').select('*').order('created_at', { ascending: false })
    if (filter !== 'tous') q = q.eq('statut', filter)
    const { data } = await q
    setCommandes(data || [])
  }, [filter])

  const loadMenu = useCallback(async () => {
    const { data } = await supabase.from('menu_restaurant').select('*').order('categorie').order('nom')
    setMenuItems(data || [])
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadCommandes(), loadMenu()]).finally(() => setLoading(false))
  }, [loadCommandes, loadMenu])

  // Realtime : rafraîchir dès qu'une commande arrive via le guest portal
  useEffect(() => {
    const channel = supabase
      .channel('commandes_restaurant_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commandes_restaurant' }, () => {
        loadCommandes()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadCommandes])

  // Pré-remplissage depuis CRM
  useEffect(() => {
    const nom = searchParams.get('nom')
    const tel = searchParams.get('tel')
    const clientId = searchParams.get('client')
    if (nom) {
      setFormCmd(p => ({ ...p, nom_client: nom, telephone: tel || '', client_id: clientId || undefined }))
      setShowFormCmd(true)
    }
  }, [searchParams])

  function totalLignes(lignes) {
    return (lignes || []).reduce((s, l) => s + (parseInt(l.qte) || 0) * (parseInt(l.prix) || 0), 0)
  }

  // ── CRUD Commandes ──────────────────────────────────────
  function openCreateCmd() { setEditIdCmd(null); setFormCmd(EMPTY_CMD); setShowFormCmd(true) }
  function openEditCmd(c) {
    setEditIdCmd(c.id)
    setFormCmd({
      nom_client:    c.nom_client    || '',
      telephone:     c.telephone     || '',
      table_num:     c.table_num     || '',
      lignes:        c.lignes?.length ? c.lignes : [{ ...EMPTY_LIGNE }],
      mode_paiement: c.mode_paiement || 'especes',
      statut:        c.statut        || 'en_cours',
      notes:         c.notes         || '',
    })
    setShowFormCmd(true)
  }
  async function saveCmd() {
    setSavingCmd(true)
    const payload = { ...formCmd, montant_total: totalLignes(formCmd.lignes) }
    if (editIdCmd) await supabase.from('commandes_restaurant').update(payload).eq('id', editIdCmd)
    else           await supabase.from('commandes_restaurant').insert([payload])
    setShowFormCmd(false); setFormCmd(EMPTY_CMD); setEditIdCmd(null); loadCommandes()
    setSavingCmd(false)
  }
  async function updateStatutCmd(id, statut) {
    await supabase.from('commandes_restaurant').update({ statut }).eq('id', id)
    loadCommandes()
  }

  // ── CRUD Menu ───────────────────────────────────────────
  function openCreateMenu() { setEditIdMenu(null); setFormMenu(EMPTY_MENU); setShowFormMenu(true) }
  function openEditMenu(m) {
    setEditIdMenu(m.id)
    setFormMenu({ nom: m.nom, description: m.description || '', prix: m.prix, categorie: m.categorie, disponible: m.disponible, photo: m.photo || '' })
    setShowFormMenu(true)
  }
  async function uploadMenuPhoto(file) {
    if (!file) return
    setUploadingPhoto(true)
    const nom = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('restaurant').upload(nom, file, { cacheControl: '31536000' })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('restaurant').getPublicUrl(nom)
      setFormMenu(p => ({ ...p, photo: publicUrl }))
    }
    setUploadingPhoto(false)
  }
  async function saveMenu() {
    setSavingMenu(true)
    const payload = { ...formMenu, prix: parseInt(formMenu.prix) || 0 }
    if (editIdMenu) await supabase.from('menu_restaurant').update(payload).eq('id', editIdMenu)
    else            await supabase.from('menu_restaurant').insert([payload])
    setShowFormMenu(false); setFormMenu(EMPTY_MENU); setEditIdMenu(null); loadMenu()
    setSavingMenu(false)
  }
  async function toggleDispo(m) {
    await supabase.from('menu_restaurant').update({ disponible: !m.disponible }).eq('id', m.id)
    loadMenu()
  }

  // ── Stats ──────────────────────────────────────────────
  const aujourdhui = new Date().toISOString().slice(0, 10)
  const cmdAuj     = commandes.filter(c => c.created_at?.slice(0, 10) === aujourdhui)
  const caAuj      = cmdAuj.filter(c => c.statut === 'payee').reduce((s, c) => s + (c.montant_total || 0), 0)
  const enCours    = commandes.filter(c => c.statut === 'en_cours').length

  // Menu filtré par catégorie
  const menuFiltré = catFilter === 'tous' ? menuItems : menuItems.filter(m => m.categorie === catFilter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Restaurant & Bar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Commandes & gestion du menu</p>
        </div>
        {tab === 'commandes' && (
          <button onClick={openCreateCmd} className="btn-primary">+ Nouvelle commande</button>
        )}
        {tab === 'menu' && (
          <button onClick={openCreateMenu} className="btn-primary">+ Ajouter au menu</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border-2)' }}>
        {[['commandes', 'Commandes'], ['menu', 'Menu & Carte']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors"
            style={tab === key
              ? { borderColor: 'var(--primary)', color: 'var(--primary)' }
              : { borderColor: 'transparent', color: 'var(--text-3)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Onglet Commandes ──────────────────────────────── */}
      {tab === 'commandes' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Commandes aujourd'hui</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{cmdAuj.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>En cours</p>
              <p className="text-2xl font-bold text-yellow-600">{enCours}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>CA encaissé aujourd'hui</p>
              <p className="text-2xl font-bold text-green-600">{formatFCFA(caAuj)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {['tous', ...Object.keys(STATUTS)].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === s ? 'text-white' : 'border hover:opacity-80'}`}
                style={filter === s ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                {s === 'tous' ? 'Toutes' : STATUTS[s]}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--bg-2)' }}>
                  <tr>
                    <th className="table-th">Date / Heure</th>
                    <th className="table-th">Client</th>
                    <th className="table-th">Table</th>
                    <th className="table-th">Articles</th>
                    <th className="table-th">Total</th>
                    <th className="table-th">Paiement</th>
                    <th className="table-th">Statut</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement...</td></tr>
                  ) : commandes.length === 0 ? (
                    <tr><td colSpan={8} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucune commande</td></tr>
                  ) : commandes.map(c => (
                    <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                      <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>
                        {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="table-td">
                        <p className="font-medium" style={{ color: 'var(--text)' }}>{c.nom_client}</p>
                        {c.telephone && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.telephone}</p>}
                      </td>
                      <td className="table-td" style={{ color: 'var(--text-2)' }}>{c.table_num || '—'}</td>
                      <td className="table-td text-xs" style={{ color: 'var(--text-2)' }}>
                        {(c.lignes || []).slice(0, 2).map(l => `${l.nom} ×${l.qte}`).join(', ')}
                        {(c.lignes || []).length > 2 && ` +${c.lignes.length - 2}`}
                      </td>
                      <td className="table-td font-semibold" style={{ color: 'var(--text)' }}>{formatFCFA(c.montant_total)}</td>
                      <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>{PAIEMENTS[c.mode_paiement] || c.mode_paiement}</td>
                      <td className="table-td"><span className={`badge ${STATUT_COLORS[c.statut]}`}>{STATUTS[c.statut]}</span></td>
                      <td className="table-td">
                        <div className="flex gap-1">
                          <select value={c.statut} onChange={e => updateStatutCmd(c.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                            {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <button onClick={() => openEditCmd(c)} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>
                            Éditer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Onglet Menu & Carte ───────────────────────────── */}
      {tab === 'menu' && (
        <>
          {/* Filtres catégorie */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setCatFilter('tous')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${catFilter === 'tous' ? 'text-white' : 'hover:opacity-80'}`}
              style={catFilter === 'tous' ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
              Tous ({menuItems.length})
            </button>
            {CATEGORIES.filter(c => menuItems.some(m => m.categorie === c.key)).map(cat => (
              <button key={cat.key} onClick={() => setCatFilter(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${catFilter === cat.key ? 'text-white' : 'hover:opacity-80'}`}
                style={catFilter === cat.key ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                {cat.emoji} {cat.label} ({menuItems.filter(m => m.categorie === cat.key).length})
              </button>
            ))}
          </div>

          {menuFiltré.length === 0 ? (
            <div className="text-center py-16 card">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Menu vide</p>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Ajoutez vos plats, vins et boissons</p>
              <button onClick={openCreateMenu} className="btn-primary mt-4">+ Ajouter au menu</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuFiltré.map(item => {
                const cat = CAT_MAP[item.categorie]
                return (
                  <div key={item.id} className={`card overflow-hidden ${!item.disponible ? 'opacity-50' : ''}`}>
                    {/* Photo */}
                    {item.photo && (
                      <div className="h-36 bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.photo} alt={item.nom} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-base">{cat?.emoji}</span>
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                            {cat?.label}
                          </span>
                        </div>
                        <h3 className="font-semibold truncate" style={{ color: 'var(--text)' }}>{item.nom}</h3>
                      </div>
                      <span className="text-lg font-bold ml-2 flex-shrink-0" style={{ color: 'var(--primary)' }}>
                        {formatFCFA(item.prix)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-3)' }}>{item.description}</p>
                    )}
                    {!item.disponible && (
                      <p className="text-xs font-semibold mb-2" style={{ color: '#DC2626' }}>Indisponible</p>
                    )}
                    <div className="flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-2)' }}>
                      <button onClick={() => openEditMenu(item)}
                        className="flex-1 text-xs font-semibold py-1.5 rounded-lg border hover:opacity-70 transition-opacity"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>
                        Modifier
                      </button>
                      <button onClick={() => toggleDispo(item)}
                        className="text-xs font-semibold py-1.5 px-3 rounded-lg border hover:opacity-70 transition-opacity"
                        style={{ borderColor: 'var(--border)', color: item.disponible ? '#D97706' : '#008A05', backgroundColor: 'var(--bg)' }}>
                        {item.disponible ? 'Retirer' : 'Remettre'}
                      </button>
                    </div>
                    </div>{/* end p-4 */}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modal Commande ────────────────────────────────── */}
      {showFormCmd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editIdCmd ? 'Modifier la commande' : 'Nouvelle commande'}
              </h2>
              <button onClick={() => setShowFormCmd(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Client *</label>
                  <input className="input" value={formCmd.nom_client} onChange={e => setFormCmd(p => ({...p, nom_client: e.target.value}))} placeholder="Nom du client" />
                </div>
                <div>
                  <label className="label">Téléphone</label>
                  <input className="input" value={formCmd.telephone} onChange={e => setFormCmd(p => ({...p, telephone: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Table / Espace</label>
                <input className="input" value={formCmd.table_num} onChange={e => setFormCmd(p => ({...p, table_num: e.target.value}))} placeholder="Table 3, Terrasse, Bar…" />
              </div>
              <LignesEditor
                lignes={formCmd.lignes}
                menuItems={menuItems}
                onChange={lignes => setFormCmd(p => ({ ...p, lignes }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Mode de paiement</label>
                  <select className="input" value={formCmd.mode_paiement} onChange={e => setFormCmd(p => ({...p, mode_paiement: e.target.value}))}>
                    {Object.entries(PAIEMENTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select className="input" value={formCmd.statut} onChange={e => setFormCmd(p => ({...p, statut: e.target.value}))}>
                    {Object.entries(STATUTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes (optionnel)</label>
                <textarea className="input" rows={2} value={formCmd.notes} onChange={e => setFormCmd(p => ({...p, notes: e.target.value}))} placeholder="Allergie, préférence…" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowFormCmd(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveCmd} disabled={savingCmd || !formCmd.nom_client} className="btn-primary flex-1">
                {savingCmd ? '...' : editIdCmd ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Menu ────────────────────────────────────── */}
      {showFormMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editIdMenu ? 'Modifier l\'article' : 'Ajouter au menu'}
              </h2>
              <button onClick={() => setShowFormMenu(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Catégorie</label>
                <select className="input" value={formMenu.categorie} onChange={e => setFormMenu(p => ({...p, categorie: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nom *</label>
                <input className="input" value={formMenu.nom} onChange={e => setFormMenu(p => ({...p, nom: e.target.value}))} placeholder="Poulet braisé, Château Margaux…" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={formMenu.description} onChange={e => setFormMenu(p => ({...p, description: e.target.value}))} placeholder="Accompagnement, millésime, origine…" />
              </div>
              <div>
                <label className="label">Prix (FCFA)</label>
                <input className="input" type="number" min="0" value={formMenu.prix} onChange={e => setFormMenu(p => ({...p, prix: e.target.value}))} />
              </div>
              {/* Photo */}
              <div>
                <label className="label">Photo du plat</label>
                {formMenu.photo && (
                  <div className="relative mb-2 rounded-xl overflow-hidden h-32 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formMenu.photo} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormMenu(p => ({ ...p, photo: '' }))}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
                    >×</button>
                  </div>
                )}
                <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:opacity-80 ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}
                  style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                  <span className="text-lg">📷</span>
                  <span className="text-sm font-medium">{uploadingPhoto ? 'Envoi en cours…' : formMenu.photo ? 'Changer la photo' : 'Ajouter une photo'}</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadMenuPhoto(f) }} />
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="dispo" checked={formMenu.disponible} onChange={e => setFormMenu(p => ({...p, disponible: e.target.checked}))} className="rounded" />
                <label htmlFor="dispo" className="text-sm" style={{ color: 'var(--text-2)' }}>Disponible aujourd'hui</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowFormMenu(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveMenu} disabled={savingMenu || !formMenu.nom} className="btn-primary flex-1">
                {savingMenu ? '...' : editIdMenu ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
