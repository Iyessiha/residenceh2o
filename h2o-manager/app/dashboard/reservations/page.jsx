'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatDate, formatFCFA, STATUT_COLORS, STATUT_LABELS } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'

const STATUTS = ['tous', 'en_attente', 'confirme', 'en_sejour', 'cloture', 'annule']

const EMPTY = {
  nom_client: '', telephone: '', email: '', duplex_id: '',
  date_arrivee: '', date_depart: '', nb_personnes: '',
  montant_total: '', notes: '', statut: 'en_attente',
  source: 'manuel', type: 'sejour',
}
const EMPTY_CHAMBRE = { ...EMPTY, type: 'chambre', duplex_id: '' }

export default function Reservations() {
  const supabase     = createClient()
  const searchParams = useSearchParams()

  const [reservations,     setReservations]     = useState([])
  const [duplexes,         setDuplexes]         = useState([])
  const [chambres,         setChambres]         = useState([])
  const [typeHebergement,  setTypeHebergement]  = useState('duplex')
  const [chambreId,        setChambreId]        = useState('')
  const [filter,           setFilter]           = useState('tous')
  const [loading,          setLoading]          = useState(true)
  const [showForm,         setShowForm]         = useState(false)
  const [editId,           setEditId]           = useState(null)
  const [form,             setForm]             = useState(EMPTY)
  const [saving,           setSaving]           = useState(false)
  const [conflict,         setConflict]         = useState(null)
  const [search,           setSearch]           = useState('')
  const [deleteId,         setDeleteId]         = useState(null)
  const [qrReservation,    setQrReservation]    = useState(null) // { id, nom_client, date_arrivee, date_depart, duplex_uuid }

  // Ouvrir le formulaire si ?new=1 dans l'URL
  useEffect(() => {
    if (searchParams.get('new') === '1') { setForm(EMPTY); setEditId(null); setShowForm(true) }
  }, [searchParams])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('reservations').select('*').order('date_arrivee', { ascending: false })
    if (filter !== 'tous') q = q.eq('statut', filter)
    const { data } = await q
    setReservations(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase.from('duplexes').select('id, code, nom, tarif_nuit').order('code')
      .then(({ data }) => setDuplexes(data || []))
    supabase.from('chambres').select('id, nom, type, tarif_nuit, statut').order('nom')
      .then(({ data }) => setChambres(data || []))
  }, [])

  // Calcul auto montant — duplex
  useEffect(() => {
    if (typeHebergement !== 'duplex') return
    if (!form.date_arrivee || !form.date_depart || !form.duplex_id) return
    const nuits = (new Date(form.date_depart) - new Date(form.date_arrivee)) / 86400000
    if (nuits <= 0) return
    const dup = duplexes.find(d => d.code === form.duplex_id)
    if (dup?.tarif_nuit) setForm(p => ({ ...p, montant_total: String(dup.tarif_nuit * nuits) }))
  }, [form.date_arrivee, form.date_depart, form.duplex_id, duplexes, typeHebergement])

  // Calcul auto montant — chambre
  useEffect(() => {
    if (typeHebergement !== 'chambre') return
    if (!form.date_arrivee || !form.date_depart || !chambreId) return
    const nuits = (new Date(form.date_depart) - new Date(form.date_arrivee)) / 86400000
    if (nuits <= 0) return
    const ch = chambres.find(c => String(c.id) === String(chambreId))
    if (ch?.tarif_nuit) setForm(p => ({ ...p, montant_total: String(ch.tarif_nuit * nuits) }))
  }, [form.date_arrivee, form.date_depart, chambreId, chambres, typeHebergement])

  function openNew() {
    setForm(EMPTY); setEditId(null); setConflict(null)
    setTypeHebergement('duplex'); setChambreId('')
    setShowForm(true)
  }

  function openEdit(r) {
    const isChambre = r.type === 'chambre'
    // Extraire l'id chambre depuis les notes si dispo
    let parsedChambreId = ''
    if (isChambre) {
      // notes stocke "Chambre souhaitée : NomChambre\n..." — on retrouve par nom
      const match = r.notes?.match(/^Chambre souhait[ée]e? : (.+?)(\n|$)/i)
      if (match) {
        const ch = chambres.find(c => c.nom === match[1].trim())
        if (ch) parsedChambreId = String(ch.id)
      }
    }
    setForm({
      nom_client: r.nom_client || '', telephone: r.telephone || '',
      email: r.email || '', duplex_id: r.duplex_id || '',
      date_arrivee: r.date_arrivee || '', date_depart: r.date_depart || '',
      nb_personnes: r.nb_personnes ? String(r.nb_personnes) : '',
      montant_total: r.montant_total ? String(r.montant_total) : '',
      notes: r.notes || '', statut: r.statut, source: r.source, type: r.type,
    })
    setTypeHebergement(isChambre ? 'chambre' : 'duplex')
    setChambreId(parsedChambreId)
    setEditId(r.id); setConflict(null); setShowForm(true)
  }

  async function checkConflict() {
    // Chambre : pas de vérification de conflit
    if (typeHebergement === 'chambre') return false
    // Duplex non renseigné ou dates manquantes : on laisse passer (pas de conflit possible)
    if (!form.duplex_id || !form.date_arrivee || !form.date_depart) return false
    if (form.date_arrivee >= form.date_depart) return false

    // Vérification directe via client Supabase — pas de dépendance à la route API
    let query = supabase
      .from('reservations')
      .select('id, nom_client, date_arrivee, date_depart')
      .eq('duplex_id', form.duplex_id)
      .not('statut', 'in', '("annule","cloture")')
      .lt('date_arrivee', form.date_depart)
      .gt('date_depart', form.date_arrivee)
    if (editId) query = query.neq('id', editId)
    const { data } = await query.limit(1)
    if (data?.length > 0) {
      setConflict(data[0])
      return true
    }
    setConflict(null)
    return false
  }

  async function save() {
    setSaving(true)
    try {
    const hasConflict = await checkConflict()
    if (hasConflict) return

    let notes = form.notes
    let type = form.type
    let duplex_id = form.duplex_id || null

    if (typeHebergement === 'chambre') {
      const ch = chambres.find(c => String(c.id) === String(chambreId))
      const chambreNom = ch ? ch.nom : chambreId
      const notesBase = form.notes.replace(/^Chambre souhait[ée]e? : .+?(\n|$)/i, '').trim()
      notes = chambreNom ? `Chambre souhaitée : ${chambreNom}${notesBase ? '\n' + notesBase : ''}` : notesBase
      type = 'chambre'
      duplex_id = null
    }

    const payload = {
      ...form,
      type,
      duplex_id,
      notes,
      nb_personnes: form.nb_personnes ? parseInt(form.nb_personnes) : null,
      montant_total: form.montant_total ? parseInt(form.montant_total) : null,
      updated_at: new Date().toISOString(),
    }

    if (editId) {
      await supabase.from('reservations').update(payload).eq('id', editId)
      setShowForm(false); setForm(EMPTY); setEditId(null)
      setTypeHebergement('duplex'); setChambreId('')
    } else {
      const { data: inserted } = await supabase.from('reservations').insert([payload]).select('id, nom_client, date_arrivee, date_depart, duplex_id').single()
      setShowForm(false); setForm(EMPTY); setEditId(null)
      setTypeHebergement('duplex'); setChambreId('')
      if (inserted) {
        const dupUuid = duplexes.find(d => d.code === inserted.duplex_id)?.id || null
        setQrReservation({ ...inserted, duplex_uuid: dupUuid })
      }
    }
    load()
    } catch (err) {
      console.error('save error', err)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatut(id, statut) {
    await supabase.from('reservations').update({ statut, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function confirmDelete() {
    if (!deleteId) return
    await supabase.from('reservations').delete().eq('id', deleteId)
    setDeleteId(null); load()
  }

  const filtered = reservations.filter(r =>
    !search || r.nom_client?.toLowerCase().includes(search.toLowerCase()) || r.telephone?.includes(search)
  )

  const dupNom = (code) => duplexes.find(d => d.code === code)?.nom || code || '—'

  function buildGuestUrl(r) {
    const dupUuid = duplexes.find(d => d.code === r.duplex_id)?.id
    if (!dupUuid) return null
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const p = new URLSearchParams({
      nom: r.nom_client || '',
      arrivee: r.date_arrivee || '',
      depart: r.date_depart || '',
      rid: r.id,
    })
    return `${base}/guest/${dupUuid}?${p.toString()}`
  }

  function openQR(r) {
    const dupUuid = duplexes.find(d => d.code === r.duplex_id)?.id || null
    setQrReservation({ ...r, duplex_uuid: dupUuid })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Réservations</h1>
        <button onClick={openNew} className="btn-primary">+ Nouvelle réservation</button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUTS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === s ? 'text-white' : 'border hover:opacity-80'
            }`}
            style={filter === s ? { backgroundColor: 'var(--primary)' } : { borderColor: 'var(--border)', color: 'var(--text-2)' }}>
            {s === 'tous' ? 'Toutes' : STATUT_LABELS[s]}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="ml-auto border rounded-lg px-3 py-1.5 text-sm focus:outline-none w-48"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
          placeholder="Rechercher un client..." />
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-2)' }}>
              <tr>
                <th className="table-th">Client</th>
                <th className="table-th">Hébergement</th>
                <th className="table-th">Arrivée</th>
                <th className="table-th">Départ</th>
                <th className="table-th">Montant</th>
                <th className="table-th">Statut</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-td text-center py-10" style={{ color: 'var(--text-3)' }}>Aucune réservation</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-t" style={{ borderColor: 'var(--border-2)' }}>
                  <td className="table-td">
                    <p className="font-medium" style={{ color: 'var(--text)' }}>{r.nom_client}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{r.telephone}</p>
                  </td>
                  <td className="table-td">
                    {r.type === 'chambre'
                      ? <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-2)', color: 'var(--primary)' }}>
                          {r.notes?.match(/^Chambre souhait[ée]e? : (.+?)(\n|$)/i)?.[1] || 'Chambre'}
                        </span>
                      : dupNom(r.duplex_id)
                    }
                  </td>
                  <td className="table-td">{formatDate(r.date_arrivee)}</td>
                  <td className="table-td">{formatDate(r.date_depart)}</td>
                  <td className="table-td">{formatFCFA(r.montant_total)}</td>
                  <td className="table-td">
                    <span className={`badge ${STATUT_COLORS[r.statut]}`}>{STATUT_LABELS[r.statut]}</span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <select value={r.statut} onChange={e => updateStatut(r.id, e.target.value)}
                        className="text-xs rounded px-2 py-1 focus:outline-none border"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                        {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <button onClick={() => openEdit(r)}
                        className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
                        title="Modifier">✏️</button>
                      {r.duplex_id && duplexes.find(d => d.code === r.duplex_id)?.id && (
                        <button onClick={() => openQR(r)}
                          className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-70"
                          style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                          title="QR code client">⬛</button>
                      )}
                      <button onClick={() => setDeleteId(r.id)}
                        className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-70"
                        style={{ borderColor: 'var(--border)', color: '#C7391E' }}
                        title="Supprimer">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulaire création / édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {editId ? 'Modifier la réservation' : 'Nouvelle réservation'}
              </h2>
              <button onClick={() => { setShowForm(false); setConflict(null) }}
                className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>

            {/* Alerte conflit */}
            {conflict && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <strong>Conflit de dates :</strong> {conflict.nom_client} occupe ce duplex
                du {formatDate(conflict.date_arrivee)} au {formatDate(conflict.date_depart)}.
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nom client *</label>
                  <input className="input" value={form.nom_client}
                    onChange={e => setForm(p => ({ ...p, nom_client: e.target.value }))}
                    placeholder="Koné Aminata" />
                </div>
                <div>
                  <label className="label">Téléphone *</label>
                  <input className="input" value={form.telephone}
                    onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                    placeholder="+225 07…" />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>

              {/* Toggle Duplex / Chambre */}
              <div>
                <label className="label">Type d'hébergement</label>
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  {[['duplex', 'Duplex'], ['chambre', 'Chambre à la nuit']].map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => { setTypeHebergement(val); setChambreId(''); setConflict(null); setForm(p => ({ ...p, montant_total: '' })) }}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={typeHebergement === val
                        ? { backgroundColor: 'var(--primary)', color: '#fff' }
                        : { backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  {typeHebergement === 'duplex' ? (
                    <>
                      <label className="label">Duplex</label>
                      <select className="input" value={form.duplex_id}
                        onChange={e => setForm(p => ({ ...p, duplex_id: e.target.value }))}>
                        <option value="">— Choisir —</option>
                        {duplexes.map(d => (
                          <option key={d.code} value={d.code}>
                            {d.nom} ({d.code}) — {d.tarif_nuit ? `${new Intl.NumberFormat('fr-FR').format(d.tarif_nuit)} FCFA/nuit` : '—'}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="label">Chambre</label>
                      <select className="input" value={chambreId}
                        onChange={e => setChambreId(e.target.value)}>
                        <option value="">— Choisir —</option>
                        {chambres.map(c => (
                          <option key={c.id} value={String(c.id)}>
                            {c.type === 'vvip' || c.type === 'vip' ? '★ ' : ''}{c.nom}{c.tarif_nuit ? ` — ${new Intl.NumberFormat('fr-FR').format(c.tarif_nuit)} FCFA/nuit` : ''}
                            {c.statut === 'occupee' ? ' (occupée)' : ''}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
                <div>
                  <label className="label">Nbre personnes</label>
                  <input className="input" type="number" min="1" max={typeHebergement === 'chambre' ? 4 : undefined}
                    value={form.nb_personnes}
                    onChange={e => setForm(p => ({ ...p, nb_personnes: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Arrivée</label>
                  <input className="input" type="date" value={form.date_arrivee}
                    onChange={e => setForm(p => ({ ...p, date_arrivee: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Départ</label>
                  <input className="input" type="date" value={form.date_depart}
                    min={form.date_arrivee || undefined}
                    onChange={e => setForm(p => ({ ...p, date_depart: e.target.value }))} />
                </div>
              </div>

              {/* Montant calculé automatiquement */}
              <div>
                <label className="label">
                  Montant total (FCFA)
                  {((typeHebergement === 'duplex' && form.duplex_id) || (typeHebergement === 'chambre' && chambreId)) && form.date_arrivee && form.date_depart && (
                    <span className="ml-1 text-xs font-normal" style={{ color: 'var(--primary)' }}>
                      — calculé automatiquement
                    </span>
                  )}
                </label>
                <input className="input" type="number" value={form.montant_total}
                  onChange={e => setForm(p => ({ ...p, montant_total: e.target.value }))}
                  placeholder="Sélectionnez hébergement + dates pour calcul auto" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Statut</label>
                  <select className="input" value={form.statut}
                    onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
                    {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Source</label>
                  <select className="input" value={form.source}
                    onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                    <option value="manuel">Manuel</option>
                    <option value="site_web">Site web</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telephone">Téléphone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setConflict(null) }} className="btn-secondary flex-1">
                Annuler
              </button>
              <button onClick={save} disabled={saving || !form.nom_client || !form.telephone}
                className="btn-primary flex-1">
                {saving ? 'Vérification…' : editId ? 'Enregistrer' : 'Créer la réservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR code réservation */}
      {qrReservation && (() => {
        const url = buildGuestUrl(qrReservation)
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl text-center" style={{ backgroundColor: 'var(--bg)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>QR Code — Portail client</h2>
                <button onClick={() => setQrReservation(null)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
              </div>
              <p className="text-sm mb-1 font-semibold" style={{ color: 'var(--text)' }}>{qrReservation.nom_client}</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
                {formatDate(qrReservation.date_arrivee)} → {formatDate(qrReservation.date_depart)}
              </p>
              {url ? (
                <>
                  <div className="flex justify-center mb-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-2)' }}>
                    <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="var(--text)" level="M" />
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
                    Le client scanne ce code pour accéder à son portail, suivre son séjour et passer des commandes.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="btn-secondary flex-1 text-sm">🖨 Imprimer</button>
                    <button onClick={() => { navigator.clipboard?.writeText(url); alert('Lien copié !') }}
                      className="btn-primary flex-1 text-sm">🔗 Copier le lien</button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-500">Ce duplex n'est pas encore configuré pour le portail guest.</p>
              )}
            </div>
          </div>
        )
      })()}

      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Supprimer la réservation ?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={confirmDelete}
                className="flex-1 btn text-white"
                style={{ backgroundColor: '#C7391E' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
