// Source unique des chiffres d'affaires et des encaissements.
// Tableau de bord, trésorerie et rapports passent tous par ici : mêmes règles, mêmes chiffres.
//
// Règle : le chiffre d'affaires (CA) vient des opérations, jamais de la somme des factures,
// sinon une commande, un séjour ou un événement serait compté deux fois (opération + sa facture).
//   • Restaurant & Bar : commandes non annulées (date de la commande) ; encaissé = commandes « payée »
//   • Boutique         : ventes non annulées (date de la vente) ; encaissé = ventes « payée »
//   • Hébergement      : réservations non annulées (date d'arrivée) ; encaissé = avance versée
//   • Événements       : événements non annulés (date de l'événement) ; encaissé = acompte reçu
//   • Autres factures  : factures hors brouillon, non liées à une réservation, un événement ou une
//                        commande (date de la facture) ; encaissé = montant payé
// Reste à encaisser = CA − encaissé (jamais négatif, ligne par ligne).

export const SOURCES = [
  { cle: 'restaurant', label: 'Restaurant & Bar', icone: '🍽️' },
  { cle: 'boutique',   label: 'Boutique',         icone: '🛍️' },
  { cle: 'hebergement', label: 'Hébergement',     icone: '🏠' },
  { cle: 'evenements', label: 'Événements',       icone: '🎪' },
  { cle: 'factures',   label: 'Autres factures',  icone: '🧾' },
]

const pad = (n) => String(n).padStart(2, '0')
// Date locale AAAA-MM-JJ (jamais toISOString : il décalerait le jour selon le fuseau)
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Bornes d'une période en heure locale : { debut: Date|null, fin: Date|null } (fin exclue)
export function bornesPeriode(periode, ref = new Date()) {
  const j = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  const y = j.getFullYear(), m = j.getMonth()
  switch (periode) {
    case 'jour':      return { debut: j, fin: new Date(y, m, j.getDate() + 1) }
    case 'semaine':   return { debut: new Date(y, m, j.getDate() - 6), fin: new Date(y, m, j.getDate() + 1) }
    case 'mois':      return { debut: new Date(y, m, 1), fin: new Date(y, m + 1, 1) }
    case 'mois_prec': return { debut: new Date(y, m - 1, 1), fin: new Date(y, m, 1) }
    case 'trimestre': return { debut: new Date(y, m - 2, 1), fin: new Date(y, m + 1, 1) }
    case 'annee':     return { debut: new Date(y, 0, 1), fin: new Date(y + 1, 0, 1) }
    default:          return { debut: null, fin: null }
  }
}

const num = (v) => Number(v) || 0
const ligne = (ca, encaisse, nb) => {
  const enc = Math.min(Math.max(0, encaisse), Math.max(0, ca))
  return { ca, encaisse: enc, reste: Math.max(0, ca - enc), nb }
}

const REPERE_COMMANDE = /^Commande restaurant n°/

// Calcule le détail par source à partir des lignes déjà chargées (fonction pure, testable)
export function calculerFinances({ commandes = [], ventes = [], reservations = [], evenements = [], factures = [] }) {
  const resto = commandes.filter(c => c.statut !== 'annulee')
  const boutique = ventes.filter(v => v.statut !== 'annulee')
  const heberg = reservations.filter(r => r.statut !== 'annule')
  const evts = evenements.filter(e => e.statut !== 'annule')
  const autres = factures.filter(f =>
    f.statut !== 'brouillon' && !f.reservation_id && !f.evenement_id && !REPERE_COMMANDE.test(f.description || ''))

  const somme = (arr, f) => arr.reduce((t, x) => t + num(f(x)), 0)
  const parSource = {
    restaurant:  ligne(somme(resto, c => c.montant_total), somme(resto.filter(c => c.statut === 'payee'), c => c.montant_total), resto.length),
    boutique:    ligne(somme(boutique, v => v.montant_total), somme(boutique.filter(v => v.statut === 'payee'), v => v.montant_total), boutique.length),
    hebergement: heberg.reduce((acc, r) => {
      const l = ligne(num(r.montant_total), num(r.avance), 1)
      return { ca: acc.ca + l.ca, encaisse: acc.encaisse + l.encaisse, reste: acc.reste + l.reste, nb: acc.nb + 1 }
    }, { ca: 0, encaisse: 0, reste: 0, nb: 0 }),
    evenements:  evts.reduce((acc, e) => {
      const l = ligne(num(e.montant_devis), num(e.acompte), 1)
      return { ca: acc.ca + l.ca, encaisse: acc.encaisse + l.encaisse, reste: acc.reste + l.reste, nb: acc.nb + 1 }
    }, { ca: 0, encaisse: 0, reste: 0, nb: 0 }),
    factures:    autres.reduce((acc, f) => {
      const l = ligne(num(f.montant_total), num(f.montant_paye), 1)
      return { ca: acc.ca + l.ca, encaisse: acc.encaisse + l.encaisse, reste: acc.reste + l.reste, nb: acc.nb + 1 }
    }, { ca: 0, encaisse: 0, reste: 0, nb: 0 }),
  }
  // Restaurant et boutique : ligne(...) calcule déjà reste/encaissé bornés ; on additionne ensuite
  const total = Object.values(parSource).reduce(
    (t, l) => ({ ca: t.ca + l.ca, encaisse: t.encaisse + l.encaisse, reste: t.reste + l.reste, nb: t.nb + l.nb }),
    { ca: 0, encaisse: 0, reste: 0, nb: 0 })
  return { parSource, total }
}

// Charge les données de la période puis calcule. `avance` est facultative tant que la base n'est pas à jour.
export async function chargerFinances(supabase, periode) {
  const { debut, fin } = bornesPeriode(periode)
  const dtDebut = debut ? debut.toISOString() : null
  const dtFin = fin ? fin.toISOString() : null
  const dDebut = debut ? ymd(debut) : null
  const dFin = fin ? ymd(fin) : null

  const horodate = (q) => { if (dtDebut) q = q.gte('created_at', dtDebut); if (dtFin) q = q.lt('created_at', dtFin); return q }
  const datee = (q, col) => { if (dDebut) q = q.gte(col, dDebut); if (dFin) q = q.lt(col, dFin); return q }

  const reservationsAvec = (cols) => datee(supabase.from('reservations').select(cols).limit(5000), 'date_arrivee')
  let resv = await reservationsAvec('statut, montant_total, avance, date_arrivee')
  if (resv.error) resv = await reservationsAvec('statut, montant_total, date_arrivee') // avance pas encore créée

  const [cmd, ven, evt, fac] = await Promise.all([
    horodate(supabase.from('commandes_restaurant').select('statut, montant_total, created_at').limit(5000)),
    horodate(supabase.from('ventes').select('statut, montant_total, created_at').limit(5000)),
    datee(supabase.from('evenements').select('statut, montant_devis, acompte, date_evenement').limit(5000), 'date_evenement'),
    horodate(supabase.from('factures').select('statut, montant_total, montant_paye, reservation_id, evenement_id, description, created_at').limit(5000)),
  ])

  const erreur = [cmd, ven, evt, fac, resv].find(x => x.error)?.error?.message || null
  const res = calculerFinances({
    commandes: cmd.data || [], ventes: ven.data || [], reservations: resv.data || [],
    evenements: evt.data || [], factures: fac.data || [],
  })
  return { ...res, erreur }
}

// Dépenses et autres recettes de la période (table tresorerie, réservée admin / gérance).
// Les salaires y figurent dès qu'une fiche de paie est payée. Même découpage de période que le reste.
export async function chargerTresorerie(supabase, periode) {
  const { debut, fin } = bornesPeriode(periode)
  let q = supabase.from('tresorerie').select('type, categorie, montant, date').limit(5000)
  if (debut) q = q.gte('date', ymd(debut))
  if (fin) q = q.lt('date', ymd(fin))
  const { data, error } = await q
  const lignes = data || []
  const depenses = lignes.filter(m => m.type === 'depense')
  const recettes = lignes.filter(m => m.type === 'recette')
  const somme = (arr) => arr.reduce((t, m) => t + num(m.montant), 0)
  const parCategorie = Object.entries(depenses.reduce((acc, m) => {
    const cle = m.categorie || 'Autre'
    acc[cle] = (acc[cle] || 0) + num(m.montant)
    return acc
  }, {})).sort((a, b) => b[1] - a[1])
  return { depenses: somme(depenses), recettes: somme(recettes), nbDepenses: depenses.length, parCategorie, erreur: error?.message || null }
}
