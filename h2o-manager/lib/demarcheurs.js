// Helpers démarcheurs (partagés entre la liste, la fiche et les rapports)

export const nomDemarcheur = (d) => (d ? [d.prenom, d.nom].filter(Boolean).join(' ') : '')

// Totaux par démarcheur : clients apportés, commissions dues (à payer), déjà versées
export function calculerTotaux(clients, reservations) {
  const totaux = {}
  const get = (id) => (totaux[id] ||= { clients: 0, reservations: 0, dues: 0, versees: 0 })
  for (const c of clients) if (c.demarcheur_id) get(c.demarcheur_id).clients += 1
  for (const r of reservations) {
    if (!r.demarcheur_id) continue
    const t = get(r.demarcheur_id)
    t.reservations += 1
    if (r.commission_statut === 'payee') t.versees += Number(r.commission_montant) || 0
    else t.dues += Number(r.commission_montant) || 0
  }
  return totaux
}
