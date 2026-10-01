export function formatFCFA(amount) {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export const STATUT_COLORS = {
  en_attente: 'bg-yellow-100 text-yellow-800',
  confirme: 'bg-green-100 text-green-800',
  en_sejour: 'bg-blue-100 text-blue-800',
  cloture: 'bg-gray-100 text-gray-600',
  annule: 'bg-red-100 text-red-700',
}

export const STATUT_LABELS = {
  en_attente: 'En attente',
  confirme: 'Confirmé',
  en_sejour: 'En séjour',
  cloture: 'Clôturé',
  annule: 'Annulé',
}

export const DUPLEX_STATUT_COLORS = {
  disponible: 'bg-green-100 text-green-800',
  occupe: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-orange-100 text-orange-800',
}
