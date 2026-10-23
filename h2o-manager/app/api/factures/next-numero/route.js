export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * GET /api/factures/next-numero
 * Retourne le prochain numéro de facture au format FAC-AAAA-NNN.
 * Cherche le dernier numéro de l'année en cours et incrémente.
 */
export async function GET() {
  const supabase = createServiceClient()
  // Calcul fait dans la base (migration 20261027) : numéros uniques et qui se suivent
  const { data, error } = await supabase.rpc('prochain_numero_facture')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ numero: data })
}
