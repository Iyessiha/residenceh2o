import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { FacturePDF } from '@/lib/pdf/FacturePDF'
import React from 'react'
import { readFile } from 'fs/promises'
import path from 'path'
// pdfkit charge ses polices standard par un require dynamique, que Vercel ne suit pas :
// on les importe ici pour qu'elles soient incluses dans le bundle de la route.
import 'pdfkit/standard-fonts/Helvetica'
import 'pdfkit/standard-fonts/HelveticaBold'
import 'pdfkit/standard-fonts/HelveticaOblique'
import 'pdfkit/standard-fonts/HelveticaBoldOblique'

/**
 * POST /api/factures/[id]/pdf
 * Reçoit la facture dans le body et génère le PDF.
 * Pas de SUPABASE_SERVICE_ROLE_KEY requis — le client envoie les données.
 */
export async function POST(req) {
  try {
    const { _guestUrl, _entreprise, ...facture } = await req.json()
    if (!facture || !facture.id) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }
    // Logo horizontal lu dans public/ ; le fichier est inclus dans la route via next.config.mjs
    const logo = await readFile(path.join(process.cwd(), 'public', 'logo-facture.png')).catch(() => null)
    const buffer = await renderToBuffer(
      React.createElement(FacturePDF, { facture, guestUrl: _guestUrl || null, logo, entreprise: _entreprise || null })
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
