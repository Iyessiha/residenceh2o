'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Client Supabase anon : lecture du menu disponible + création d'une commande (voir les migrations du portail invité)
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const VERT = '#0C3A3D'
const CATEGORIES = [
  { key: 'petit_dejeuner', label: 'Petit déjeuner', emoji: '☕' },
  { key: 'entree',         label: 'Entrées',        emoji: '🥗' },
  { key: 'plat',           label: 'Plats',          emoji: '🍽️' },
  { key: 'accompagnement', label: 'Accompagnements', emoji: '🍟' },
  { key: 'dessert',        label: 'Desserts',       emoji: '🍮' },
  { key: 'vin',            label: 'Vins & Cocktails', emoji: '🍷' },
  { key: 'jus',            label: 'Jus & Smoothies', emoji: '🧃' },
  { key: 'boisson',        label: 'Boissons',       emoji: '🥤' },
  { key: 'piscine',        label: 'Piscine',        emoji: '🏊' },
  { key: 'autre',          label: 'Autre',          emoji: '📦' },
]

const fcfa = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA'

function Commander() {
  const searchParams = useSearchParams()
  const tableQR = (searchParams.get('table') || '').slice(0, 40)

  const [menu, setMenu] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreurMenu, setErreurMenu] = useState(false)
  const [cat, setCat] = useState('tous')
  const [panier, setPanier] = useState({})           // { id_article: quantité }
  const [vue, setVue] = useState('menu')             // menu | panier | fait
  const [form, setForm] = useState({ nom: '', telephone: '', table: tableQR, note: '' })
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [reference, setReference] = useState('')

  useEffect(() => { setForm(f => ({ ...f, table: f.table || tableQR })) }, [tableQR])

  useEffect(() => {
    sb.from('menu_restaurant').select('*').eq('disponible', true).order('categorie').order('nom')
      .then(({ data, error }) => {
        if (error) setErreurMenu(true)
        setMenu(data || [])
        setChargement(false)
      })
  }, [])

  const categories = CATEGORIES.filter(c => menu.some(m => m.categorie === c.key))
  const affiches = menu.filter(m => cat === 'tous' || m.categorie === cat)

  const lignes = useMemo(
    () => menu.filter(m => panier[m.id] > 0).map(m => ({ nom: m.nom, qte: panier[m.id], prix: m.prix || 0, menu_id: m.id })),
    [menu, panier]
  )
  const total = lignes.reduce((s, l) => s + l.qte * l.prix, 0)
  const nbArticles = lignes.reduce((s, l) => s + l.qte, 0)

  const ajouter = (id) => setPanier(p => ({ ...p, [id]: (p[id] || 0) + 1 }))
  const retirer = (id) => setPanier(p => {
    const n = { ...p }
    if ((n[id] || 0) <= 1) delete n[id]; else n[id] -= 1
    return n
  })

  async function envoyer() {
    if (envoi) return
    if (!form.nom.trim()) { setErreur('Indiquez votre nom.'); return }
    if (lignes.length === 0) { setErreur('Votre panier est vide.'); return }
    setEnvoi(true); setErreur('')
    const id = crypto.randomUUID()
    const { error } = await sb.from('commandes_restaurant').insert([{
      id,
      nom_client: form.nom.trim().slice(0, 80),
      telephone: form.telephone.trim().slice(0, 30) || null,
      table_num: form.table.trim().slice(0, 40) || null,
      lignes,
      montant_total: total,
      mode_paiement: 'especes',
      statut: 'en_cours',
      notes: form.note.trim().slice(0, 300) || null,
    }])
    setEnvoi(false)
    if (error) { setErreur("Votre commande n'a pas pu être envoyée. Réessayez ou appelez un serveur."); return }
    setReference(id.slice(0, 8).toUpperCase())
    setPanier({})
    setVue('fait')
  }

  const page = { minHeight: '100vh', background: '#F6F4EF', fontFamily: 'system-ui, sans-serif', color: '#1F2A2B', paddingBottom: 96 }
  const wrap = { maxWidth: 720, margin: '0 auto', padding: '0 16px' }
  const champ = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #D8D3C8', fontSize: 16, background: '#fff', boxSizing: 'border-box' }
  const bouton = { padding: '14px 20px', borderRadius: 12, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', background: VERT, color: '#fff', width: '100%' }

  const entete = (
    <header style={{ background: VERT, color: '#fff', padding: '18px 0' }}>
      <div style={wrap}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.8 }}>Les Résidences H₂O</p>
        <h1 style={{ margin: '4px 0 0', fontSize: 22 }}>Restaurant & Bar</h1>
        {tableQR && <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.9 }}>📍 {tableQR}</p>}
      </div>
    </header>
  )

  // ── Commande envoyée ───────────────────────────────────
  if (vue === 'fait') {
    return (
      <main style={page}>
        {entete}
        <div style={{ ...wrap, paddingTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 56, margin: 0 }}>✅</p>
          <h2 style={{ fontSize: 22, margin: '8px 0' }}>Commande envoyée !</h2>
          <p style={{ margin: '4px 0' }}>Nous la préparons. Référence : <strong>{reference}</strong></p>
          <p style={{ margin: '4px 0', color: '#6B7678' }}>Le paiement se fait sur place auprès de notre équipe.</p>
          <button style={{ ...bouton, marginTop: 24, maxWidth: 320 }} onClick={() => setVue('menu')}>Commander autre chose</button>
        </div>
      </main>
    )
  }

  // ── Panier + coordonnées ───────────────────────────────
  if (vue === 'panier') {
    return (
      <main style={page}>
        {entete}
        <div style={{ ...wrap, paddingTop: 20 }}>
          <button onClick={() => setVue('menu')} style={{ background: 'none', border: 'none', color: VERT, fontWeight: 600, fontSize: 15, cursor: 'pointer', padding: 0 }}>← Retour au menu</button>
          <h2 style={{ fontSize: 20, margin: '12px 0' }}>Votre commande</h2>

          <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #E5E0D4' }}>
            {lignes.map(l => (
              <div key={l.menu_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid #F0ECE2' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{l.nom}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6B7678' }}>{fcfa(l.prix)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button aria-label={`Retirer ${l.nom}`} onClick={() => retirer(l.menu_id)} style={{ width: 34, height: 34, borderRadius: 17, border: '1px solid #D8D3C8', background: '#fff', fontSize: 18, cursor: 'pointer' }}>−</button>
                  <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700 }}>{l.qte}</span>
                  <button aria-label={`Ajouter ${l.nom}`} onClick={() => ajouter(l.menu_id)} style={{ width: 34, height: 34, borderRadius: 17, border: 'none', background: VERT, color: '#fff', fontSize: 18, cursor: 'pointer' }}>+</button>
                </div>
              </div>
            ))}
            {lignes.length === 0 && <p style={{ color: '#6B7678' }}>Votre panier est vide.</p>}
            <p style={{ textAlign: 'right', fontWeight: 800, fontSize: 18, margin: '12px 0 0' }}>Total : {fcfa(total)}</p>
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <input style={champ} placeholder="Votre nom *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} autoComplete="name" />
            <input style={champ} placeholder="Téléphone (facultatif)" inputMode="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} autoComplete="tel" />
            <input style={champ} placeholder="Table / emplacement (ex : Table 4, Terrasse)" value={form.table} onChange={e => setForm({ ...form, table: e.target.value })} />
            <textarea style={{ ...champ, minHeight: 70 }} placeholder="Une précision ? (allergie, cuisson…)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          {erreur && <p style={{ color: '#B91C1C', margin: '12px 0 0' }}>{erreur}</p>}
          <button style={{ ...bouton, marginTop: 16, opacity: envoi || lignes.length === 0 ? 0.6 : 1 }} disabled={envoi || lignes.length === 0} onClick={envoyer}>
            {envoi ? 'Envoi…' : `Envoyer la commande — ${fcfa(total)}`}
          </button>
          <p style={{ fontSize: 12, color: '#6B7678', textAlign: 'center', marginTop: 8 }}>Paiement sur place auprès de notre équipe.</p>
        </div>
      </main>
    )
  }

  // ── Menu ───────────────────────────────────────────────
  return (
    <main style={page}>
      {entete}
      <div style={{ ...wrap, paddingTop: 14 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, position: 'sticky', top: 0, background: '#F6F4EF', zIndex: 5 }}>
          {[{ key: 'tous', label: 'Tout', emoji: '📋' }, ...categories].map(c => (
            <button key={c.key} onClick={() => setCat(c.key)}
              style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: cat === c.key ? 'none' : '1px solid #D8D3C8', background: cat === c.key ? VERT : '#fff', color: cat === c.key ? '#fff' : '#1F2A2B' }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {chargement && <p>Chargement du menu…</p>}
        {!chargement && erreurMenu && <p>Impossible de charger le menu pour le moment. Réessayez dans un instant.</p>}
        {!chargement && !erreurMenu && affiches.length === 0 && <p>Le menu n'est pas disponible pour le moment.</p>}

        <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
          {affiches.map(m => {
            const q = panier[m.id] || 0
            return (
              <div key={m.id} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 12, padding: 10, border: '1px solid #E5E0D4' }}>
                {m.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt="" loading="lazy" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{m.nom}</p>
                  {m.description && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7678' }}>{m.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontWeight: 700, color: VERT }}>{m.prix_libelle || fcfa(m.prix)}</span>
                    {q === 0 ? (
                      <button onClick={() => ajouter(m.id)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: VERT, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Ajouter</button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button aria-label={`Retirer ${m.nom}`} onClick={() => retirer(m.id)} style={{ width: 34, height: 34, borderRadius: 17, border: '1px solid #D8D3C8', background: '#fff', fontSize: 18, cursor: 'pointer' }}>−</button>
                        <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700 }}>{q}</span>
                        <button aria-label={`Ajouter ${m.nom}`} onClick={() => ajouter(m.id)} style={{ width: 34, height: 34, borderRadius: 17, border: 'none', background: VERT, color: '#fff', fontSize: 18, cursor: 'pointer' }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {nbArticles > 0 && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: 12, background: 'rgba(246,244,239,0.96)', borderTop: '1px solid #D8D3C8' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <button style={bouton} onClick={() => setVue('panier')}>
              Voir ma commande · {nbArticles} article{nbArticles > 1 ? 's' : ''} · {fcfa(total)}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default function CommanderPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24, fontFamily: 'system-ui' }}>Chargement…</p>}>
      <Commander />
    </Suspense>
  )
}
