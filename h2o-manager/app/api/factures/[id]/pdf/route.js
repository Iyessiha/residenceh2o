import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { FacturePDF } from '@/lib/pdf/FacturePDF'
import React from 'react'

/**
 * POST /api/factures/[id]/pdf
 * Reçoit la facture dans le body et génère le PDF.
 * Pas de SUPABASE_SERVICE_ROLE_KEY requis — le client envoie les données.
 */
export async function POST(req) {
  try {
    const { _guestUrl, ...facture } = await req.json()
    if (!facture || !facture.id) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }
    const buffer = await renderToBuffer(
      React.createElement(FacturePDF, { facture, guestUrl: _guestUrl || null })
    )
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${facture.numero || 'facture'}.pdf"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Erreur de génération PDF', detail: err.message }, { status: 500 })
  }
}
