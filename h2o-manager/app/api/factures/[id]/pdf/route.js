import { createServiceClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { FacturePDF } from '@/lib/pdf/FacturePDF'
import React from 'react'

/**
 * GET /api/factures/[id]/pdf
 * Génère et retourne un PDF pour la facture donnée.
 */
export async function GET(_req, { params }) {
  const { id } = params
  const supabase = createServiceClient()

  const { data: facture, error } = await supabase
    .from('factures')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !facture) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  try {
    const buffer = await renderToBuffer(React.createElement(FacturePDF, { facture }))

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${facture.numero}.pdf"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Erreur de génération PDF', detail: err.message }, { status: 500 })
  }
}
