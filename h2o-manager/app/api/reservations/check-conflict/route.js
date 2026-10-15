import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * POST /api/reservations/check-conflict
 * Vérifie si un duplex est disponible pour les dates demandées.
 * Body : { duplex_id, date_arrivee, date_depart, exclude_id? }
 * Répond : { conflict: boolean, reservation?: { nom_client, date_arrivee, date_depart } }
 */
export async function POST(req) {
  const { duplex_id, date_arrivee, date_depart, exclude_id } = await req.json()

  if (!duplex_id || !date_arrivee || !date_depart) {
    return NextResponse.json({ error: 'duplex_id, date_arrivee et date_depart sont requis' }, { status: 400 })
  }
  if (date_arrivee >= date_depart) {
    return NextResponse.json({ error: 'La date de départ doit être après la date d\'arrivée' }, { status: 400 })
  }

  const supabase = createClient()

  // Chevauchement : deux séjours se chevauchent si arrivee_A < depart_B ET depart_A > arrivee_B
  let query = supabase
    .from('reservations')
    .select('id, nom_client, date_arrivee, date_depart, statut')
    .eq('duplex_id', duplex_id)
    .not('statut', 'in', '("annule","cloture")')
    .lt('date_arrivee', date_depart)
    .gt('date_depart', date_arrivee)

  if (exclude_id) {
    query = query.neq('id', exclude_id)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data && data.length > 0) {
    return NextResponse.json({ conflict: true, reservation: data[0] })
  }

  return NextResponse.json({ conflict: false })
}
