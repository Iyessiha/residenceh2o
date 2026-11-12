'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatDate, formatFCFA, STATUT_COLORS, STATUT_LABELS } from '@/lib/utils'
import { nomDemarcheur } from '@/lib/demarcheurs'
import { QRCodeSVG } from 'qrcode.react'

const STATUTS = ['tous', 'en_attente', 'confirme', 'en_sejour', 'cloture', 'annule']

const EMPTY = {
  nom_client: '', telephone: '', email: '', duplex_id: '',
  date_arrivee: '', date_depart: '', nb_personnes: '',
  montant_hebergement: '', avance: '', notes: '', statut: 'en_attente',
  mode_sejour: 'nuit', heure_arrivee: '09:00', heure_depart: '18:00',
  source: 'manuel', type: 'sejour', demarcheur_id: '', entreprise_id: '',
}
const NOUVEAU = '__nouveau__'
const EMPTY_OPT = { nom: '', prix: '' }
const LIBRE = '__libre__'
const hhmm = (t) => (t || '').slice(0, 5)
const EMPTY_DEM = { prenom: '', nom: '', telephone: '', taux: '10' }
const EMPTY_ENT = { nom: '', contact: '', adresse: '' }
const EVT_VIDE = { type_evenement: 'mariage', espace: 'pergola', date_evenement: '', heure_debut: '17:00', nb_invites: '', montant_devis: '', acompte: '', statut: 'en_attente', notes: '' }
const TYPES_EVENEMENT = { mariage: '💍 Mariage', anniversaire: '🎂 Anniversaire', bapteme: '🍼 Baptême', seminaire: '💼 Séminaire', fete_privee: '🎉 Fête privée', autre: '🎪 Autre' }
const EMPTY_CHAMBRE = { ...EMPTY, type: 'chambre', duplex_id: '' }

export default function Reservations() {
  const supabase     = createClient()
  const searchParams = useSearchParams()

  const [reservations,     setReservations]     = useState([])
  const [duplexes,         setDuplexes]         = useState([])
  const [chambres,         setChambres]         = useState([])
  const [demarcheurs,      setDemarcheurs]      = useState([])
  const [entreprises,      setEntreprises]      = useState([])
  const [avecDemarcheur,   setAvecDemarcheur]   = useState(false)
  const [avecEntreprise,   setAvecEntreprise]   = useState(false)
  const [nouveauDem,       setNouveauDem]       = useState(EMPTY_DEM)
  const [nouvelleEnt,      setNouvelleEnt]      = useState(EMPTY_ENT)
  const [erreur,           setErreur]           = useState('')
  const [origine,          setOrigine]          = useState({ entreprise: false, avance: false, demarcheur: false, journee: false, options: false })
  const [lignesOptions,    setLignesOptions]    = useState([])   // [{ nom, prix, qte }]
  const [catalogue,        setCatalogue]        = useState([])
  const [showCatalogue,    setShowCatalogue]    = useState(false)
  const [nouvelleOpt,      setNouvelleOpt]      = useState(EMPTY_OPT)
  const [erreurCatalogue,  setErreurCatalogue]  = useState('')
  const [typeHebergement,  setTypeHebergement]  = useState('duplex')
  const [evt, setEvt] = useState(EVT_VIDE)   // réservation de l'espace événementiel (table evenements)
  const [infoEvt, setInfoEvt] = useState('')
  const majEvt = (cle, valeur) => setEvt(p => ({ ...p, [cle]: valeur }))
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
    if (searchParams.get('new') === '1') { resetApport(); setForm(EMPTY); setEditId(null); setShowForm(true) }
  }, [searchParams])

  const load = useCallback(async () => {
    setLoading(true)
    const requete = (cols) => {
      let q = supabase.from('reservations').select(cols).order('date_arrivee', { ascending: false })
      if (filter !== 'tous') q = q.eq('statut', filter)
      return q
    }
    let { data, error } = await requete('*, demarcheur:demarcheurs(id, nom, prenom, taux_commission)')
    // Sans la colonne démarcheur (base pas à jour), la liste reste affichée
    if (error) ({ data } = await requete('*'))
    setReservations(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase.from('duplexes').select('id, code, nom, tarif_nuit, tarif_journee').order('code')
      .then(({ data }) => setDuplexes(data || []))
    supabase.from('chambres').select('id, nom, type, tarif_nuit, tarif_journee, statut').order('nom')
      .then(({ data }) => setChambres(data || []))
    supabase.from('demarcheurs').select('id, nom, prenom, taux_commission').order('nom')
      .then(({ data }) => setDemarcheurs(data || []))
    supabase.from('entreprises').select('id, nom, contact, adresse').order('nom')
      .then(({ data }) => setEntreprises(data || []))
    chargerCatalogue()
  }, [])

  async function chargerCatalogue() {
    const { data, error } = await supabase.from('options_sejour').select('id, nom, prix').eq('actif', true).order('nom')
    setCatalogue(error ? [] : (data || []))
  }
  async function ajouterAuCatalogue() {
    setErreurCatalogue('')
    if (!nouvelleOpt.nom.trim()) { setErreurCatalogue("Indiquez le nom de l'option."); return }
    const { error } = await supabase.from('options_sejour').insert([{ nom: nouvelleOpt.nom.trim(), prix: parseInt(nouvelleOpt.prix) || 0 }])
    if (error) { setErreurCatalogue(/options_sejour/.test(error.message) ? "Table des options absente : exécutez le SQL « 20261110_reservations_journee_options » dans Supabase." : error.message); return }
    setNouvelleOpt(EMPTY_OPT); chargerCatalogue()
  }
  async function retirerDuCatalogue(id) {
    { const { error: erreurEcriture } = await supabase.from('options_sejour').delete().eq('id', id); if (erreurEcriture) { window.alert("Enregistrement impossible : " + erreurEcriture.message); return } }
    chargerCatalogue()
  }
  function ajouterOption(valeur) {
    if (!valeur) return
    if (valeur === LIBRE) { setLignesOptions(l => [...l, { nom: '', prix: '', qte: '1' }]); return }
    const o = catalogue.find(x => x.id === valeur)
    if (o) setLignesOptions(l => [...l, { nom: o.nom, prix: String(o.prix), qte: '1' }])
  }
  const majOption = (i, champ, v) => setLignesOptions(l => l.map((x, j) => (j === i ? { ...x, [champ]: v } : x)))

  // Montants : hébergement (calculé ou saisi) + options = total de la réservation
  const estJournee = form.mode_sejour === 'journee'
  const estEvenement = typeHebergement === 'evenement'
  const totalOptions = lignesOptions.reduce((t, l) => t + (parseInt(l.prix) || 0) * (parseInt(l.qte) || 0), 0)
  const montantTotal = (parseInt(form.montant_hebergement) || 0) + totalOptions
  const aMontant = montantTotal > 0

  // Commission prévisionnelle affichée dans le formulaire (le calcul définitif est fait en base)
  const demarcheurNouveau = avecDemarcheur && form.demarcheur_id === NOUVEAU
  const demarcheurChoisi = demarcheurNouveau
    ? { taux_commission: Number(nouveauDem.taux) || 0 }
    : demarcheurs.find(d => d.id === form.demarcheur_id)
  const commissionApercu = avecDemarcheur && demarcheurChoisi && aMontant
    ? Math.round(montantTotal * Number(demarcheurChoisi.taux_commission) / 100)
    : null

  // Calcul auto montant — duplex
  useEffect(() => {
    if (typeHebergement !== 'duplex') return
    if (!form.date_arrivee || !form.duplex_id) return
    if (!estJournee && !form.date_depart) return
    const nuits = estJournee ? 1 : (new Date(form.date_depart) - new Date(form.date_arrivee)) / 86400000
    if (nuits <= 0) return
    const dup = duplexes.find(d => d.code === form.duplex_id)
    const tarif = estJournee ? dup?.tarif_journee : dup?.tarif_nuit
    if (tarif) setForm(p => ({ ...p, montant_hebergement: String(tarif * nuits) }))
  }, [form.date_arrivee, form.date_depart, form.duplex_id, duplexes, typeHebergement, estJournee])

  // Calcul auto montant — chambre
  useEffect(() => {
    if (typeHebergement !== 'chambre') return
    if (!form.date_arrivee || !chambreId) return
    if (!estJournee && !form.date_depart) return
    const nuits = estJournee ? 1 : (new Date(form.date_depart) - new Date(form.date_arrivee)) / 86400000
    if (nuits <= 0) return
    const ch = chambres.find(c => String(c.id) === String(chambreId))
    const tarif = estJournee ? ch?.tarif_journee : ch?.tarif_nuit
    if (tarif) setForm(p => ({ ...p, montant_hebergement: String(tarif * nuits) }))
  }, [form.date_arrivee, form.date_depart, chambreId, chambres, typeHebergement, estJournee])

  function resetApport() {
    setAvecDemarcheur(false); setAvecEntreprise(false)
    setNouveauDem(EMPTY_DEM); setNouvelleEnt(EMPTY_ENT)
    setErreur(''); setOrigine({ entreprise: false, avance: false, demarcheur: false, journee: false, options: false }); setLignesOptions([])
  }

  function openNew() {
    resetApport()
    setForm(EMPTY); setEditId(null); setConflict(null)
    setTypeHebergement('duplex'); setChambreId(''); setEvt(EVT_VIDE)
    setShowForm(true)
  }

  function openEdit(r) {
    resetApport()
    setAvecDemarcheur(!!r.demarcheur_id); setAvecEntreprise(!!r.entreprise_id)
    const optsEdit = Array.isArray(r.options) ? r.options : []
    setOrigine({ entreprise: !!r.entreprise_id, avance: (r.avance || 0) > 0, demarcheur: !!r.demarcheur_id, journee: r.mode_sejour === 'journee', options: optsEdit.length > 0 })
    setLignesOptions(optsEdit.map(o => ({ nom: o.nom || '', prix: String(o.prix ?? ''), qte: String(o.qte ?? 1) })))
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
      montant_hebergement: r.montant_total ? String(Math.max(0, r.montant_total - optsEdit.reduce((t, o) => t + (o.prix || 0) * (o.qte || 0), 0))) : '',
      mode_sejour: r.mode_sejour || 'nuit',
      heure_arrivee: hhmm(r.heure_arrivee) || '09:00', heure_depart: hhmm(r.heure_depart) || '18:00',
      avance: r.avance ? String(r.avance) : '',
      notes: r.notes || '', statut: r.statut, source: r.source, type: r.type,
      demarcheur_id: r.demarcheur_id || '', entreprise_id: r.entreprise_id || '',
    })
    setTypeHebergement(isChambre ? 'chambre' : 'duplex')
    setChambreId(parsedChambreId)
    setEditId(r.id); setConflict(null); setShowForm(true)
  }

  async function checkConflict() {
    // Chambre : même contrôle que pour une villa, sur la chambre choisie
    if (typeHebergement === 'chambre') {
      const ch = chambres.find(c => String(c.id) === String(chambreId))
      if (!ch || !form.date_arrivee || !form.date_depart || form.date_arrivee >= form.date_depart) return false
      let q = supabase.from('reservations').select('id, nom_client, date_arrivee, date_depart')
        .eq('chambre_id', ch.id).not('statut', 'in', '("annule","cloture")')
        .lt('date_arrivee', form.date_depart).gt('date_depart', form.date_arrivee)
      if (editId) q = q.neq('id', editId)
      const { data: occupee } = await q.limit(1)
      if (occupee?.length > 0) { setConflict(occupee[0]); return true }
      setConflict(null)
      return false
    }

    // Journée : bloquée par un séjour de nuit qui occupe la villa ce jour-là, ou par une autre journée aux heures qui se chevauchent
    if (estJournee) {
      if (!form.duplex_id || !form.date_arrivee) return false
      const d = form.date_arrivee
      let qNuit = supabase.from('reservations').select('id, nom_client, date_arrivee, date_depart')
        .eq('duplex_id', form.duplex_id).not('statut', 'in', '("annule","cloture")')
        .lte('date_arrivee', d).gt('date_depart', d)
      if (editId) qNuit = qNuit.neq('id', editId)
      const { data: nuit } = await qNuit.limit(1)
      if (nuit?.length > 0) { setConflict(nuit[0]); return true }
      let qJour = supabase.from('reservations').select('id, nom_client, date_arrivee, date_depart, heure_arrivee, heure_depart')
        .eq('duplex_id', form.duplex_id).eq('mode_sejour', 'journee').eq('date_arrivee', d)
        .not('statut', 'in', '("annule","cloture")')
      if (editId) qJour = qJour.neq('id', editId)
      const { data: jours, error: errJour } = await qJour
      if (!errJour) {
        const deb = form.heure_arrivee || '00:00', fin = form.heure_depart || '23:59'
        const autre = (jours || []).find(x => (hhmm(x.heure_arrivee) || '00:00') < fin && (hhmm(x.heure_depart) || '23:59') > deb)
        if (autre) { setConflict(autre); return true }
      }
      setConflict(null)
      return false
    }
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

  // Traduit une erreur de la base en message compréhensible
  function messageErreur(error) {
    const m = error?.message || String(error)
    if (/reservations_type_check/.test(m)) return "La base refuse ce type d'hébergement (chambre). Exécutez le SQL « 20261109_reservations_correctifs » dans Supabase > SQL Editor, puis réessayez."
    if (/column .*(avance|entreprise_id|mode_sejour|heure_arrivee|heure_depart|options)/i.test(m) || /(avance|entreprise_id|mode_sejour|heure_arrivee|heure_depart|options).*(does not exist|schema cache)/i.test(m)) return "La base n'est pas à jour (journée / options / avance / entreprise). Exécutez les SQL « 20261109_reservations_correctifs » puis « 20261110_reservations_journee_options » dans Supabase > SQL Editor, puis réessayez."
    if (/row-level security|permission denied/i.test(m)) return "Droits insuffisants pour enregistrer (reconnectez-vous, puis réessayez)."
    return m
  }

  async function save() {
    setErreur('')
    if (!form.nom_client.trim()) { setErreur('Le nom du client est obligatoire.'); return }
    if (!form.telephone.trim()) { setErreur('Le téléphone du client est obligatoire.'); return }
    if (estEvenement) {
      if (!evt.date_evenement) { setErreur("Indiquez la date de l'événement."); return }
      const devis = parseInt(evt.montant_devis) || 0, acompte = parseInt(evt.acompte) || 0
      if (acompte > devis) { setErreur("L'acompte ne peut pas dépasser le montant du devis."); return }
      setSaving(true)
      const { error } = await supabase.from('evenements').insert([{
        nom_client: form.nom_client.trim(), telephone: form.telephone.trim(), email: form.email.trim() || null,
        type_evenement: evt.type_evenement, espace: evt.espace, date_evenement: evt.date_evenement,
        heure_debut: evt.heure_debut || null, nb_invites: evt.nb_invites ? parseInt(evt.nb_invites) : null,
        montant_devis: devis || null, acompte: acompte || null, statut: evt.statut, notes: evt.notes.trim() || null,
      }])
      setSaving(false)
      if (error) { setErreur(/row-level security|permission denied/i.test(error.message) ? 'Droits insuffisants pour enregistrer (reconnectez-vous, puis réessayez).' : error.message); return }
      setShowForm(false); setForm(EMPTY); setEvt(EVT_VIDE); setTypeHebergement('duplex'); resetApport()
      setInfoEvt(`Événement de ${form.nom_client.trim()} enregistré pour le ${evt.date_evenement.split('-').reverse().join('/')}${devis > 0 ? ' — facture créée automatiquement.' : '. Ajoutez un devis pour générer la facture.'}`)
      return
    }
    if (aMontant && (parseInt(form.avance) || 0) > montantTotal) {
      setErreur("L'avance ne peut pas dépasser le montant total.")
      return
    }
    if (estJournee) {
      if (!form.date_arrivee) { setErreur('Indiquez la date de la journée.'); return }
      if (!form.heure_arrivee || !form.heure_depart || form.heure_depart <= form.heure_arrivee) { setErreur("L'heure de départ doit être après l'heure d'arrivée."); return }
    }
    if (avecDemarcheur && !form.demarcheur_id) { setErreur('Choisissez le démarcheur ou ajoutez-en un nouveau.'); return }
    if (avecDemarcheur && demarcheurNouveau && !nouveauDem.nom.trim()) { setErreur('Indiquez le nom du nouveau démarcheur.'); return }
    if (avecEntreprise && !form.entreprise_id) { setErreur("Choisissez l'entreprise ou ajoutez-en une nouvelle."); return }
    if (avecEntreprise && form.entreprise_id === NOUVEAU && !nouvelleEnt.nom.trim()) { setErreur("Indiquez le nom de la nouvelle entreprise."); return }

    setSaving(true)
    try {
      const hasConflict = await checkConflict()
      if (hasConflict) return

      let notes = form.notes
      let type = form.type
      let duplex_id = form.duplex_id || null
      let chambre_id = null   // la chambre choisie doit aussi être reliée à la réservation (calendrier, conflits)

      if (typeHebergement === 'chambre') {
        const ch = chambres.find(c => String(c.id) === String(chambreId))
        const chambreNom = ch ? ch.nom : chambreId
        const notesBase = form.notes.replace(/^Chambre souhait[ée]e? : .+?(\n|$)/i, '').trim()
        notes = chambreNom ? `Chambre souhaitée : ${chambreNom}${notesBase ? '\n' + notesBase : ''}` : notesBase
        type = 'chambre'
        duplex_id = null
        chambre_id = ch ? ch.id : null
      } else if (type === 'chambre') {
        type = 'sejour'
      }

      // Démarcheur / entreprise saisis directement dans la réservation : créés ici, puis rattachés
      let demarcheur_id = avecDemarcheur ? form.demarcheur_id : ''
      let entreprise_id = avecEntreprise ? form.entreprise_id : ''
      if (demarcheur_id === NOUVEAU) {
        const taux = Number(String(nouveauDem.taux).replace(',', '.'))
        const { data, error } = await supabase.from('demarcheurs').insert([{
          nom: nouveauDem.nom.trim(), prenom: nouveauDem.prenom.trim(), telephone: nouveauDem.telephone.trim(),
          taux_commission: Number.isFinite(taux) ? taux : 10,
        }]).select('id, nom, prenom, taux_commission').single()
        if (error) { setErreur('Démarcheur non enregistré : ' + messageErreur(error)); return }
        setDemarcheurs(l => [...l, data]); demarcheur_id = data.id
        setForm(p => ({ ...p, demarcheur_id: data.id })); setNouveauDem(EMPTY_DEM)
      }
      if (entreprise_id === NOUVEAU) {
        const { data, error } = await supabase.from('entreprises').insert([{
          nom: nouvelleEnt.nom.trim(), contact: nouvelleEnt.contact.trim(), adresse: nouvelleEnt.adresse.trim(),
        }]).select('id, nom, contact, adresse').single()
        if (error) { setErreur('Entreprise non enregistrée : ' + messageErreur(error)); return }
        setEntreprises(l => [...l, data]); entreprise_id = data.id
        setForm(p => ({ ...p, entreprise_id: data.id })); setNouvelleEnt(EMPTY_ENT)
      }

      // La commission (montant × taux / 100) est calculée par le trigger en base : on n'envoie que le démarcheur.
      // Les colonnes « avance » et « entreprise_id » ne sont envoyées que si elles servent (ou servaient).
      const avance = parseInt(form.avance) || 0
      const payload = {
        nom_client: form.nom_client.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim() || null,
        date_arrivee: form.date_arrivee || null,
        date_depart: (estJournee ? form.date_arrivee : form.date_depart) || null,
        statut: form.statut,
        source: form.source,
        type,
        duplex_id,
        notes: notes || null,
        nb_personnes: form.nb_personnes ? parseInt(form.nb_personnes) : null,
        montant_total: aMontant ? montantTotal : null,
        updated_at: new Date().toISOString(),
      }
      // Démarcheur, avance et entreprise sont facultatifs : ces colonnes ne sont envoyées que si elles servent,
      // une réservation ordinaire s'enregistre donc même si la base n'a pas encore ces colonnes.
      if (typeHebergement === 'chambre') payload.chambre_id = chambre_id
      else if (editId) payload.chambre_id = null
      if (demarcheur_id || origine.demarcheur) payload.demarcheur_id = demarcheur_id || null
      if (estJournee || origine.journee) {
        payload.mode_sejour = estJournee ? 'journee' : 'nuit'
        payload.heure_arrivee = estJournee ? form.heure_arrivee : null
        payload.heure_depart = estJournee ? form.heure_depart : null
      }
      const optionsEnregistrees = lignesOptions.filter(l => l.nom.trim()).map(l => ({ nom: l.nom.trim(), prix: parseInt(l.prix) || 0, qte: parseInt(l.qte) || 1 }))
      if (optionsEnregistrees.length > 0 || origine.options) payload.options = optionsEnregistrees
      if (avance > 0 || origine.avance) payload.avance = avance
      if (entreprise_id || origine.entreprise) payload.entreprise_id = entreprise_id || null

      if (editId) {
        const { error } = await supabase.from('reservations').update(payload).eq('id', editId)
        if (error) { setErreur(messageErreur(error)); return }
        setShowForm(false); setForm(EMPTY); setEditId(null)
        setTypeHebergement('duplex'); setChambreId(''); resetApport()
      } else {
        const { data: inserted, error } = await supabase.from('reservations').insert([payload]).select('id, nom_client, date_arrivee, date_depart, duplex_id, notes').single()
        if (error) { setErreur(messageErreur(error)); return }
        setShowForm(false); setForm(EMPTY); setEditId(null)
        setTypeHebergement('duplex'); setChambreId(''); resetApport()
        if (inserted) {
          const dupUuid = duplexes.find(d => d.code === inserted.duplex_id)?.id || null
          setQrReservation({ ...inserted, duplex_uuid: dupUuid })
        }
      }
      load()
    } catch (err) {
      console.error('save error', err)
      setErreur(messageErreur(err))
    } finally {
      setSaving(false)
    }
  }

  async function updateStatut(id, statut) {
    { const { error: erreurEcriture } = await supabase.from('reservations').update({ statut, updated_at: new Date().toISOString() }).eq('id', id); if (erreurEcriture) { window.alert("Enregistrement impossible : " + erreurEcriture.message); return } }
    load()
  }

  // Le démarcheur est versé en prestataire : on enregistre le paiement de sa commission
  async function solderReservation(r) {
    const reste = (r.montant_total || 0) - (r.avance || 0)
    if (reste <= 0) return
    if (!window.confirm(`Encaisser le solde de ${formatFCFA(reste)} pour ${r.nom_client} ?`)) return
    { const { error: erreurEcriture } = await supabase.from('reservations').update({ avance: r.montant_total, updated_at: new Date().toISOString() }).eq('id', r.id); if (erreurEcriture) { window.alert("Enregistrement impossible : " + erreurEcriture.message); return } }
    load()
  }

  async function marquerCommissionPayee(id) {
    { const { error: erreurEcriture } = await supabase.from('reservations').update({ commission_statut: 'payee' }).eq('id', id); if (erreurEcriture) { window.alert("Enregistrement impossible : " + erreurEcriture.message); return } }
    load()
  }

  async function confirmDelete() {
    if (!deleteId) return
    { const { error: erreurEcriture } = await supabase.from('reservations').delete().eq('id', deleteId); if (erreurEcriture) { window.alert("Enregistrement impossible : " + erreurEcriture.message); return } }
    setDeleteId(null); load()
  }

  const filtered = reservations.filter(r =>
    !search || r.nom_client?.toLowerCase().includes(search.toLowerCase()) || r.telephone?.includes(search)
  )

  const dupNom = (code) => duplexes.find(d => d.code === code)?.nom || code || '—'

  function buildGuestUrl(r) {
    // Villa : identifiant du duplex ; chambre à la nuit : identifiant de la chambre (retrouvée par son nom dans les notes)
    let dupUuid = duplexes.find(d => d.code === r.duplex_id)?.id
    if (!dupUuid && r.notes) {
      const nomCh = r.notes.match(/^Chambre souhait[ée]e? : (.+?)(\n|$)/i)?.[1]?.trim()
      dupUuid = chambres.find(c => c.nom === nomCh)?.id
    }
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

      {infoEvt && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-3 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          <span>✅ {infoEvt} <Link href="/dashboard/evenements" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>Voir les événements →</Link>{' '}<Link href="/dashboard/facturation" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>Facture et QR code →</Link></span>
          <button onClick={() => setInfoEvt('')} className="text-lg leading-none" style={{ color: 'var(--text-3)' }}>×</button>
        </div>
      )}

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
                    {r.demarcheur && (
                      <p className="text-xs" style={{ color: 'var(--primary)' }}>Apporté par {nomDemarcheur(r.demarcheur)}</p>
                    )}
                    {r.entreprise_id && entreprises.find(en => en.id === r.entreprise_id) && (
                      <p className="text-xs" style={{ color: 'var(--primary)' }}>🏢 {entreprises.find(en => en.id === r.entreprise_id).nom}</p>
                    )}
                  </td>
                  <td className="table-td">
                    {r.type === 'chambre'
                      ? <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-2)', color: 'var(--primary)' }}>
                          {r.notes?.match(/^Chambre souhait[ée]e? : (.+?)(\n|$)/i)?.[1] || 'Chambre'}
                        </span>
                      : dupNom(r.duplex_id)
                    }
                    {r.mode_sejour === 'journee' && (
                      <p className="text-xs mt-1" style={{ color: 'var(--primary)' }}>☀️ Journée {hhmm(r.heure_arrivee)}–{hhmm(r.heure_depart)}</p>
                    )}
                  </td>
                  <td className="table-td">{formatDate(r.date_arrivee)}</td>
                  <td className="table-td">{formatDate(r.date_depart)}</td>
                  <td className="table-td">
                    {formatFCFA(r.montant_total)}
                    {Array.isArray(r.options) && r.options.length > 0 && (
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                        dont {r.options.length} option{r.options.length > 1 ? 's' : ''} : {r.options.map(o => `${o.nom}${o.qte > 1 ? ' ×' + o.qte : ''}`).join(', ')}
                      </p>
                    )}
                    {r.montant_total > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span style={{ color: 'var(--text-2)' }}>Avance {formatFCFA(r.avance || 0)}</span>
                        {(r.montant_total - (r.avance || 0)) > 0 ? (
                          <>
                            <span className="badge bg-amber-100 text-amber-800">Reste {formatFCFA(r.montant_total - (r.avance || 0))}</span>
                            <button onClick={() => solderReservation(r)}
                              className="font-semibold px-2 py-0.5 rounded text-white transition-opacity hover:opacity-80"
                              style={{ backgroundColor: 'var(--primary)' }}>
                              Encaisser le solde
                            </button>
                          </>
                        ) : (
                          <span className="badge bg-green-100 text-green-700">Soldé</span>
                        )}
                      </div>
                    )}
                    {r.demarcheur_id && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                          Commission {formatFCFA(r.commission_montant)}
                        </span>
                        {r.commission_statut === 'payee' ? (
                          <span className="badge bg-green-100 text-green-700">Payée</span>
                        ) : (
                          <>
                            <span className="badge bg-amber-100 text-amber-800">À payer</span>
                            <button onClick={() => marquerCommissionPayee(r.id)}
                              className="text-xs font-semibold px-2 py-0.5 rounded text-white transition-opacity hover:opacity-80"
                              style={{ backgroundColor: 'var(--primary)' }}>
                              Marquer comme payée
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
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
                <label className="label">{estEvenement ? 'Type de réservation' : "Type d'hébergement"}</label>
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  {[['duplex', 'Duplex'], ['chambre', 'Chambre'], ...(editId ? [] : [['evenement', 'Espace événementiel']])].map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => { setTypeHebergement(val); setChambreId(''); setConflict(null); setForm(p => ({ ...p, montant_hebergement: '' })) }}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={typeHebergement === val
                        ? { backgroundColor: 'var(--primary)', color: '#fff' }
                        : { backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {!estEvenement && (
              <>
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

              {/* Durée : nuitée ou journée */}
              <div>
                <label className="label">Durée</label>
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  {[['nuit', '🌙 À la nuit'], ['journee', '☀️ À la journée']].map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => { setConflict(null); setForm(p => ({ ...p, mode_sejour: val, montant_hebergement: '' })) }}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={form.mode_sejour === val
                        ? { backgroundColor: 'var(--primary)', color: '#fff' }
                        : { backgroundColor: 'var(--bg)', color: 'var(--text-2)' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {estJournee ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Date</label>
                    <input className="input" type="date" value={form.date_arrivee}
                      onChange={e => setForm(p => ({ ...p, date_arrivee: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Arrivée à</label>
                    <input className="input" type="time" value={form.heure_arrivee}
                      onChange={e => setForm(p => ({ ...p, heure_arrivee: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Départ à</label>
                    <input className="input" type="time" value={form.heure_depart}
                      onChange={e => setForm(p => ({ ...p, heure_depart: e.target.value }))} />
                  </div>
                </div>
              ) : (
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
              )}

              {/* Hébergement : tarif calculé automatiquement, modifiable */}
              <div>
                <label className="label">
                  {estJournee ? 'Tarif de la journée (FCFA)' : 'Montant hébergement (FCFA)'}
                  {((typeHebergement === 'duplex' && form.duplex_id) || (typeHebergement === 'chambre' && chambreId)) && form.date_arrivee && (estJournee || form.date_depart) && (
                    <span className="ml-1 text-xs font-normal" style={{ color: 'var(--primary)' }}>
                      — calculé automatiquement
                    </span>
                  )}
                </label>
                <input className="input" type="number" min="0" value={form.montant_hebergement}
                  onChange={e => setForm(p => ({ ...p, montant_hebergement: e.target.value }))}
                  placeholder="Sélectionnez hébergement + dates pour calcul auto" />
              </div>

              {/* Options (extras) ajoutées au montant */}
              <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: 'var(--bg-2)' }}>
                <div className="flex items-center justify-between">
                  <p className="label !mb-0">Options <span className="font-normal" style={{ color: 'var(--text-3)' }}>(optionnel)</span></p>
                  <button type="button" onClick={() => { setErreurCatalogue(''); setShowCatalogue(true) }}
                    className="text-xs font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                    Gérer le catalogue
                  </button>
                </div>
                {lignesOptions.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_6rem_3.5rem_auto] gap-2 items-center">
                    <input className="input" placeholder="Option" value={l.nom} onChange={e => majOption(i, 'nom', e.target.value)} />
                    <input className="input" type="number" min="0" placeholder="Prix" value={l.prix} onChange={e => majOption(i, 'prix', e.target.value)} />
                    <input className="input" type="number" min="1" placeholder="Qté" value={l.qte} onChange={e => majOption(i, 'qte', e.target.value)} />
                    <button type="button" onClick={() => setLignesOptions(x => x.filter((_, j) => j !== i))}
                      className="text-lg px-1" style={{ color: '#C7391E' }} title="Retirer">×</button>
                  </div>
                ))}
                <select className="input" value="" onChange={e => ajouterOption(e.target.value)}>
                  <option value="">➕ Ajouter une option…</option>
                  {catalogue.map(o => <option key={o.id} value={o.id}>{o.nom} — {formatFCFA(o.prix)}</option>)}
                  <option value={LIBRE}>✏️ Autre (saisie libre)</option>
                </select>
              </div>

              {/* Total = hébergement + options */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3 border" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Montant total</p>
                  {totalOptions > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      Hébergement {formatFCFA(parseInt(form.montant_hebergement) || 0)} + options {formatFCFA(totalOptions)}
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{formatFCFA(montantTotal)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Avance versée (FCFA)</label>
                  <input className="input" type="number" min="0" value={form.avance}
                    onChange={e => setForm(p => ({ ...p, avance: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="label">Reste à payer (FCFA)</label>
                  <div className="input flex items-center font-semibold"
                    style={{ color: montantTotal - (parseInt(form.avance) || 0) > 0 ? '#b45309' : '#15803d' }}>
                    {formatFCFA(Math.max(0, montantTotal - (parseInt(form.avance) || 0)))}
                  </div>
                </div>
              </div>
              {aMontant && (parseInt(form.avance) || 0) > montantTotal && (
                <p className="text-xs text-red-600">L'avance dépasse le montant total.</p>
              )}

              {/* Client apporté par un démarcheur et/ou une entreprise */}
              <div className="rounded-xl p-3 space-y-3" style={{ backgroundColor: 'var(--bg-2)' }}>
                <p className="label !mb-0">Client apporté par <span className="font-normal" style={{ color: 'var(--text-3)' }}>(optionnel)</span></p>
                <div className="flex gap-2">
                  {[
                    ['dem', '🤝 Un démarcheur', avecDemarcheur, v => { setAvecDemarcheur(v); if (!v) setForm(p => ({ ...p, demarcheur_id: '' })) }],
                    ['ent', '🏢 Une entreprise', avecEntreprise, v => { setAvecEntreprise(v); if (!v) setForm(p => ({ ...p, entreprise_id: '' })) }],
                  ].map(([k, label, actif, set]) => (
                    <button key={k} type="button" onClick={() => set(!actif)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${actif ? 'text-white' : ''}`}
                      style={actif
                        ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }
                        : { backgroundColor: 'var(--bg)', color: 'var(--text-2)', borderColor: 'var(--border)' }}>
                      {actif ? '✓ ' : ''}{label}
                    </button>
                  ))}
                </div>

                {avecDemarcheur && (
                  <div className="space-y-2">
                    <label className="label">Démarcheur</label>
                    <select className="input" value={form.demarcheur_id}
                      onChange={e => setForm(p => ({ ...p, demarcheur_id: e.target.value }))}>
                      <option value="">— Choisir —</option>
                      {demarcheurs.map(d => (
                        <option key={d.id} value={d.id}>{nomDemarcheur(d)} ({Number(d.taux_commission)} %)</option>
                      ))}
                      <option value={NOUVEAU}>➕ Nouveau démarcheur…</option>
                    </select>
                    {demarcheurNouveau && (
                      <div className="grid grid-cols-2 gap-2">
                        <input className="input" placeholder="Prénom" value={nouveauDem.prenom}
                          onChange={e => setNouveauDem(p => ({ ...p, prenom: e.target.value }))} />
                        <input className="input" placeholder="Nom *" value={nouveauDem.nom}
                          onChange={e => setNouveauDem(p => ({ ...p, nom: e.target.value }))} />
                        <input className="input" placeholder="Téléphone" value={nouveauDem.telephone}
                          onChange={e => setNouveauDem(p => ({ ...p, telephone: e.target.value }))} />
                        <div className="relative">
                          <input className="input pr-8" type="number" min="0" max="100" step="0.5" placeholder="Commission"
                            value={nouveauDem.taux} onChange={e => setNouveauDem(p => ({ ...p, taux: e.target.value }))} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-3)' }}>%</span>
                        </div>
                      </div>
                    )}
                    {commissionApercu !== null && (
                      <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                        Commission : {formatFCFA(commissionApercu)} ({Number(demarcheurChoisi.taux_commission)} % du montant) — à payer après versement
                      </p>
                    )}
                  </div>
                )}

                {avecEntreprise && (
                  <div className="space-y-2">
                    <label className="label">Entreprise</label>
                    <select className="input" value={form.entreprise_id}
                      onChange={e => setForm(p => ({ ...p, entreprise_id: e.target.value }))}>
                      <option value="">— Choisir —</option>
                      {entreprises.map(en => <option key={en.id} value={en.id}>{en.nom}</option>)}
                      <option value={NOUVEAU}>➕ Nouvelle entreprise…</option>
                    </select>
                    {form.entreprise_id === NOUVEAU && (
                      <div className="grid grid-cols-2 gap-2">
                        <input className="input col-span-2" placeholder="Nom de l'entreprise *" value={nouvelleEnt.nom}
                          onChange={e => setNouvelleEnt(p => ({ ...p, nom: e.target.value }))} />
                        <input className="input" placeholder="Contact (nom, téléphone)" value={nouvelleEnt.contact}
                          onChange={e => setNouvelleEnt(p => ({ ...p, contact: e.target.value }))} />
                        <input className="input" placeholder="Adresse" value={nouvelleEnt.adresse}
                          onChange={e => setNouvelleEnt(p => ({ ...p, adresse: e.target.value }))} />
                      </div>
                    )}
                  </div>
                )}
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
              </>
              )}

              {estEvenement && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Type d'événement</label>
                      <select className="input" value={evt.type_evenement} onChange={e => majEvt('type_evenement', e.target.value)}>
                        {Object.entries(TYPES_EVENEMENT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Espace</label>
                      <select className="input" value={evt.espace} onChange={e => majEvt('espace', e.target.value)}>
                        <option value="pergola">Espace événementiel</option>
                        <option value="jardins">Jardins</option>
                        <option value="full_site">Site complet</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Date *</label>
                      <input className="input" type="date" value={evt.date_evenement} onChange={e => majEvt('date_evenement', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Heure de début</label>
                      <input className="input" type="time" value={evt.heure_debut} onChange={e => majEvt('heure_debut', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Nombre d'invités</label>
                      <input className="input" type="number" min="0" value={evt.nb_invites} onChange={e => majEvt('nb_invites', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Statut</label>
                      <select className="input" value={evt.statut} onChange={e => majEvt('statut', e.target.value)}>
                        <option value="en_attente">En attente</option>
                        <option value="confirme">Confirmé</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Montant du devis (FCFA)</label>
                      <input className="input" type="number" min="0" value={evt.montant_devis} onChange={e => majEvt('montant_devis', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Acompte versé (FCFA)</label>
                      <input className="input" type="number" min="0" value={evt.acompte} onChange={e => majEvt('acompte', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl px-4 py-3 border" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Reste à payer</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{formatFCFA(Math.max(0, (parseInt(evt.montant_devis) || 0) - (parseInt(evt.acompte) || 0)))}</p>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea className="input" rows={2} value={evt.notes} onChange={e => majEvt('notes', e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {erreur && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{erreur}</div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setConflict(null) }} className="btn-secondary flex-1">
                Annuler
              </button>
              <button onClick={save} disabled={saving}
                className="btn-primary flex-1">
                {saving ? 'Enregistrement…' : editId ? 'Enregistrer' : estEvenement ? "Créer l'événement" : 'Créer la réservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalogue des options */}
      {showCatalogue && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Catalogue des options</h2>
              <button onClick={() => setShowCatalogue(false)} className="text-xl" style={{ color: 'var(--text-3)' }}>×</button>
            </div>
            <div className="space-y-2 mb-4">
              {catalogue.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Aucune option. Ajoutez par exemple Petit-déjeuner, Piscine, Transfert aéroport…</p>
              ) : catalogue.map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{o.nom}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{formatFCFA(o.prix)}</span>
                    <button onClick={() => retirerDuCatalogue(o.id)} style={{ color: '#C7391E' }} title="Supprimer">🗑</button>
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <input className="input" placeholder="Nom de l'option" value={nouvelleOpt.nom}
                onChange={e => setNouvelleOpt(p => ({ ...p, nom: e.target.value }))} />
              <input className="input" type="number" min="0" placeholder="Prix FCFA" value={nouvelleOpt.prix}
                onChange={e => setNouvelleOpt(p => ({ ...p, prix: e.target.value }))} />
            </div>
            {erreurCatalogue && <p className="text-xs text-red-600 mt-2">{erreurCatalogue}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCatalogue(false)} className="btn-secondary flex-1">Fermer</button>
              <button onClick={ajouterAuCatalogue} className="btn-primary flex-1">Ajouter</button>
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
                <p className="text-sm text-red-500">Ce logement n'est pas encore configuré pour le portail guest.</p>
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
