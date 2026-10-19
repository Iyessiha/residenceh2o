export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * GET /api/factures/next-numero
 * Retourne le prochain numéro de facture au format FAC-AAAA-NNN.
 * Cherche le dernier numéro de l'année en cours et incrémente.
 */
export async function GET() {
  const supabase = createClient()
  const year = new Date().getFullYear()
  const prefix = `FAC-${year}-`

  const { data, error } = await supabase
    .from('factures')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let next = 1
  if (data && data.length > 0) {
    const last = data[0].numero // ex: FAC-2026-007
    const parts = last.split('-')
    const lastNum = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(lastNum)) next = lastNum + 1
  }

  const numero = `${prefix}${String(next).padStart(3, '0')}`
  return NextResponse.json({ numero })
}
