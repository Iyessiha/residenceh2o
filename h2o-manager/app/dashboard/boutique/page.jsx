'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatFCFA } from '@/lib/utils'

const PAIEMENTS  = { especes: 'Espèces', mobile_money: 'Mobile Money', carte: 'Carte', virement: 'Virement' }
const STATUTS_V  = { en_attente: 'En attente', payee: 'Payée', annulee: 'Annulée' }
const STATUT_CV  = { en_attente: 'bg-yellow-100 text-yellow-800', payee: 'bg-green-100 text-green-800', annulee: 'bg-gray-100 text-gray-500' }
const EMPTY_LIGNE = { nom: '', qte: 1, prix: 0 }
const EMPTY_V = { nom_client: '', telephone: '', lignes: [{ ...EMPTY_LIGNE }], mode_paiement: 'especes', statut: 'payee', notes: '' }
const EMPTY_A = { nom: '', description: '', prix: '', stock: '', categorie: '', actif: true }

function LignesVente({ lignes, articles, onChange }) {
  function update(i, field, val) {
    const next = lignes.map((l, idx) => idx === i ? { ...l, [field]: val } : l)
    onChange(next)
  }
  function add() { onChange([...lignes, { ...EMPTY_LIGNE }]) }
  function remove(i) { onChange(lignes.filter((_, idx) => idx !== i)) }
  function pickArticle(i, article) {
    const next = lignes.map((l, idx) => idx === i ? { ...l, nom: article.nom, prix: article.prix } : l)
    onChange(next)
  }

  const total = lignes.reduce((s, l) => s + (parseInt(l.qte) || 0) * (parseInt(l.prix) || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">Articles vendus</label>
        {articles.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Cliquez sur une ligne pour choisir du catalogue</span>
        )}
      </div>
      {articles.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {articles.filter(a => a.actif).map(a => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                // Ajoute une nouvelle ligne pré-remplie
                onChange([...lignes, { nom: a.nom, qte: 1, prix: a.prix, article_id: a.id }])
              }}
              className="text-xs px-2 py-1 rounded border hover:opacity-70 transition-opacity"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)', color: 'var(--text-2)' }}
            >
              {a.nom} — {formatFCFA(a.prix)}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-2 mb-2">
        <div className="grid grid-cols-12 gap-1 text-xs font-semibold px-1" style={{ color: 'var(--text-3)' }}>
          <span className="col-span-5">Article</span>
          <span className="col-span-2 text-center">Qté</span>
          <span className="col-span-3 text-right">Prix unit.</span>
          <span className="col-span-2" />
        </div>
        {lignes.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-1 items-center">
            <input
              className="input py-1.5 text-sm col-span-5"
              placeholder="Nom de l'article"
              value={l.nom}
              onChange={e => update(i, 'nom', e.target.value)}
            />
            <input
              className="input py-1.5 text-sm col-span-2 text-center"
              type="number" min="1"
              value={l.qte}
              onChange={e => update(i, 'qte', e.target.value)}
            />
            <input
              className="input py-1.5 text-sm col-span-3 text-right"
              type="number" min="0"
              value={l.prix}
              onChange={e => update(i, 'prix', e.target.value)}
            />
            <button
              onClick={() => remove(i)}
              disabled={lignes.length === 1}
              className="col-span-2 flex items-center justify-center h-8 rounded text-xs disabled:opacity-30 hover:opacity-70"
              style={{ color: '#DC2626' }}
            >✕</button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-1">
        <button onClick={add} className="text-xs font-semibold hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }}>
          + Ajouter une ligne
        </button>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Total : {formatFCFA(total)}</span>
      </div>
    </div>
  )
}

export default function Boutique() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [tab, setTab]         = useState('ventes') // 'ventes' | 'articles'
  const [ventes, setVentes]   = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterV, setFilterV] = useState('tous')
  const [showFormV, setShowFormV] = useState(false)
  const [showFormA, setShowFormA] = useState(false)
  const [formV, setFormV]     = useState(EMPTY_V)
  const [formA, setFormA]     = useState(EMPTY_A)
  const [editIdV, setEditIdV] = useState(null)
  const [editIdA, setEditIdA] = useState(null)
  const [savingV, setSavingV] = useState(false)
  const [savingA, setSavingA] = useState(false)

  const loadVentes = useCallback(async () => {
    let q = supabase.from('ventes').select('*').order('created_at', { ascending: false })
    if (filterV !== 'tous') q = q.eq('statut', filterV)
    const { data } = await q
    setVentes(data || [])
  }, [filterV])

  const loadArticles = useCallback(async () => {
    const { data } = await supabase.from('articles').select('*').order('nom')
    setArticles(data || [])
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadVentes(), loadArticles()]).finally(() => setLoading(false))
  }, [loadVentes, loadArticles])

  // Realtime : rafraîchir dès qu'une vente arrive via le guest portal
  useEffect(() => {
    const channel = supabase
      .channel('ventes_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ventes' }, () => {
        loadVentes()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadVentes])

  // Pré-remplissage depuis CRM
  useEffect(() => {
    const nom = searchParams.get('nom')
    const tel = searchParams.get('tel')
    const clientId = searchParams.get('client')
    if (nom) {
      setFormV(p => ({ ...p, nom_client: nom, telephone: tel || '', client_id: clientId || undefined }))
      setShowFormV(true)
    }
  }, [searchParams])

  function totalLignes(lignes) {
    return (lignes || []).reduce((s, l) => s + (parseInt(l.qte) || 0) * (parseInt(l.prix) || 0), 0)
  }

  // ── Ventes ────────────────────────────────────────────────
  function openCreateVente() { setEditIdV(null); setFormV(EMPTY_V); setShowFormV(true) }
  function openEditVente(v) {
    setEditIdV(v.id)
    setFormV({
      nom_client:    v.nom_client    || '',
      telephone:     v.telephone     || '',
      lignes:        v.lignes?.length ? v.lignes : [{ ...EMPTY_LIGNE }],
      mode_paiement: v.mode_paiement || 'especes',
      statut:        v.statut        || 'payee',
      notes:         v.notes         || '',
    })
    setShowFormV(true)
  }
  async function saveVente() {
    setSavingV(true)
    const montant_total = totalLignes(formV.lignes)
    const payload = { ...formV, montant_total }
    if (editIdV) await supabase.from('ventes').update(payload).eq('id', editIdV)
    else         await supabase.from('ventes').insert([payload])
    setShowFormV(false); setFormV(EMPTY_V); setEditIdV(null)
    loadVentes(); loadArticles()
    setSavingV(false)
  }
  async function updateStatutVente(id, statut) {
    await supabase.from('ventes').update({ statut }).eq('id', id)
    loadVentes()
  }

  // ── Articles ──────────────────────────────────────────────
  function openCreateArticle() { setEditIdA(null); setFormA(EMPTY_A); setShowFormA(true) }
  function openEditArticle(a) {
    setEditIdA(a.id)
    setFormA({ nom: a.nom, description: a.description || '', prix: a.prix, stock: a.stock, categorie: a.categorie || '', actif: a.actif })
    setShowFormA(true)
  }
  async function saveArticle() {
    setSavingA(true)
    const payload = { ...formA, prix: parseInt(formA.prix) || 0, stock: parseInt(formA.stock) || 0 }
    if (editIdA) await supabase.from('articles').update(payload).eq('id', editIdA)
    else         await supabase.from('articles').insert([payload])
    setShowFormA(false); setFormA(EMPTY_A); setEditIdA(null); loadArticles()
    setSavingA(false)
  }
  async function toggleActif(a) {
    await supabase.from('articles').update({ actif: !a.actif }).eq('id', a.id)
    loadArticles()
  }

  const aujourdhui = new Date().toISOString().slice(0, 10)
  const ventesAuj  = ventes.filter(v => v.created_at?.slice(0, 10) === aujourdhui)
  const caAuj      = ventesAuj.filter(v => v.statut === 'payee').reduce((s, v) => s + (v.montant_total || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Boutique</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Ventes & catalogue articles</p>
        </div>
        {tab === 'ventes' && (
          <button onClick={openCreateVente} className="btn-primary">+ Nouvelle vente</button>
        )}
        {tab === 'articles' && (
          <button onClick={openCreateArticle} className="btn-primary">+ Nouvel article</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border-2)' }}>
        {[['ventes', 'Ventes'], ['articles', 'Catalogue articles']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors"
            style={tab === key
              ? { borderColor: 'var(--primary)', color: 'var(--primary)' }
              : { borderColor: 'transparent', color: 'var(--text-3)' }}
          >{label}</button>
        ))}
      </div>

      {/* ── Onglet Ventes ─────────────────────────────────── */}
      {tab === 'ventes' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Ventes aujourd'hui</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{ventesAuj.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>CA encaissé aujourd'hui</p>
              <p className="text-2xl font-bold text-green-600">{formatFCFA(caAuj)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Articles en catalogue</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{articles.filter(a => a.actif).length}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {['tous', ...Object.keys(STATUTS_V)].map(s => (
              <button key={s} onClick={() => setFilterV(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterV === s ? 'text-white' : 'border hover:opacity-80'}`}
                style={filterV === s ? { backgroundColor: 'var(--primary)' } : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                {s === 'tous' ? 'Toutes' : STATUTS_V[s]}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--bg-2)' }}>
                  <tr>
                    <th className="table-th">Date</th>
                    <th className="table-th">Client</th>
                    <th className="table-th">Articles</th>
                    <th className="table-th">Total</th>
                    <th className="table-th">Paiement</th>
                    <th className="table-th">Statut</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement...</td></tr>
                  ) : ventes.length === 0 ? (
                    <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucune vente</td></tr>
                  ) : ventes.map(v => (
                    <tr key={v.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                      <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>
                        {new Date(v.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="table-td">
                        <p className="font-medium" style={{ color: 'var(--text)' }}>{v.nom_client}</p>
                        {v.telephone && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{v.telephone}</p>}
                      </td>
                      <td className="table-td text-xs" style={{ color: 'var(--text-2)' }}>
                        {(v.lignes || []).slice(0, 2).map(l => `${l.nom} ×${l.qte}`).join(', ')}
                        {(v.lignes || []).length > 2 && ` +${v.lignes.length - 2}`}
                      </td>
                      <td className="table-td font-semibold" style={{ color: 'var(--text)' }}>{formatFCFA(v.montant_total)}</td>
                      <td className="table-td text-xs" style={{ color: 'var(--text-3)' }}>{PAIEMENTS[v.mode_paiement] || v.mode_paiement}</td>
                      <td className="table-td"><span className={`badge ${STATUT_CV[v.statut]}`}>{STATUTS_V[v.statut]}</span></td>
                      <td className="table-td">
                        <div className="flex gap-1">
                          <select value={v.statut} onChange={e => updateStatutVente(v.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                            {Object.entries(STATUTS_V).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                          </select>
                          <button onClick={() => openEditVente(v)} className="text-xs px-2 py-1 border rounded hover:opacity-70"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>Éditer</button>
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

      {/* ── Onglet Articles ───────────────────────────────── */}
      {tab === 'articles' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.length === 0 ? (
            <div className="col-span-3 text-center py-16" style={{ color: 'var(--text-3)' }}>
              Aucun article. Ajoutez votre premier produit.
            </div>
          ) : articles.map(a => (
            <div key={a.id} className={`card p-4 ${!a.actif ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  {a.categorie && <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>{a.categorie}</span>}
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{a.nom}</h3>
                </div>
                <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{formatFCFA(a.prix)}</span>
              </div>
              {a.description && <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{a.description}</p>}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: a.stock <= 5 && a.stock > 0 ? '#D97706' : a.stock === 0 ? '#DC2626' : 'var(--text-3)' }}>
                  Stock : {a.stock} {a.stock === 0 ? '— Épuisé' : a.stock <= 5 ? '— Stock faible' : ''}
                </span>
              </div>
              <div className="flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-2)' }}>
                <button onClick={() => openEditArticle(a)}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg border hover:opacity-70 transition-opacity"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg)' }}>
                  Modifier
                </button>
                <button onClick={() => toggleActif(a)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg border hover:opacity-70 transition-opacity"
                  style={{ borderColor: 'var(--border)', color: a.actif ? '#D97706' : '#008A05', backgroundColor: 'var(--bg)' }}>
                  {a.actif ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal vente */}
      {showFormV && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editIdV ? 'Modifier la vente' : 'Nouvelle vente'}
              </h2>
              <button onClick={() => setShowFormV(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Client *</label>
                  <input className="input" value={formV.nom_client} onChange={e => setFormV(p => ({...p, nom_client: e.target.value}))} placeholder="Nom du client" />
                </div>
                <div>
                  <label className="label">Téléphone</label>
                  <input className="input" value={formV.telephone} onChange={e => setFormV(p => ({...p, telephone: e.target.value}))} />
                </div>
              </div>
              <LignesVente
                lignes={formV.lignes}
                articles={articles}
                onChange={lignes => setFormV(p => ({ ...p, lignes }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Mode de paiement</label>
                  <select className="input" value={formV.mode_paiement} onChange={e => setFormV(p => ({...p, mode_paiement: e.target.value}))}>
                    {Object.entries(PAIEMENTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select className="input" value={formV.statut} onChange={e => setFormV(p => ({...p, statut: e.target.value}))}>
                    {Object.entries(STATUTS_V).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes (optionnel)</label>
                <textarea className="input" rows={2} value={formV.notes} onChange={e => setFormV(p => ({...p, notes: e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowFormV(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveVente} disabled={savingV || !formV.nom_client} className="btn-primary flex-1">
                {savingV ? '...' : editIdV ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal article */}
      {showFormA && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editIdA ? 'Modifier l\'article' : 'Nouvel article'}
              </h2>
              <button onClick={() => setShowFormA(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Nom *</label>
                <input className="input" value={formA.nom} onChange={e => setFormA(p => ({...p, nom: e.target.value}))} placeholder="T-shirt H2O" />
              </div>
              <div>
                <label className="label">Catégorie</label>
                <input className="input" value={formA.categorie} onChange={e => setFormA(p => ({...p, categorie: e.target.value}))} placeholder="Habillement, Boissons…" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={formA.description} onChange={e => setFormA(p => ({...p, description: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prix (FCFA)</label>
                  <input className="input" type="number" value={formA.prix} onChange={e => setFormA(p => ({...p, prix: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Stock</label>
                  <input className="input" type="number" min="0" value={formA.stock} onChange={e => setFormA(p => ({...p, stock: e.target.value}))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="actif" checked={formA.actif} onChange={e => setFormA(p => ({...p, actif: e.target.checked}))} className="rounded" />
                <label htmlFor="actif" className="text-sm" style={{ color: 'var(--text-2)' }}>Article actif (visible dans les ventes)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowFormA(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveArticle} disabled={savingA || !formA.nom} className="btn-primary flex-1">
                {savingA ? '...' : editIdA ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
