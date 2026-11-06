import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { BulletinPDF } from '@/lib/pdf/BulletinPDF'
import React from 'react'
import { readFile } from 'fs/promises'
import path from 'path'
// Polices PDF standard à inclure dans le bundle Vercel (comme pour les factures)
import 'pdfkit/standard-fonts/Helvetica'
import 'pdfkit/standard-fonts/HelveticaBold'
import 'pdfkit/standard-fonts/HelveticaOblique'
import 'pdfkit/standard-fonts/HelveticaBoldOblique'

/**
 * POST /api/paie/[id]/pdf
 * Reçoit { fiche, employe, entreprise } du manager et renvoie le bulletin en PDF.
 * Aucune lecture en base : la route ne fait que mettre en page les données reçues.
 */
export async function POST(req) {
  try {
    const { fiche, employe, entreprise } = await req.json()
    if (!fiche || !fiche.id) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }
    const logo = await readFile(path.join(process.cwd(), 'public', 'logo-facture.png')).catch(() => null)
    const buffer = await renderToBuffer(
      React.createElement(BulletinPDF, { fiche, employe: employe || null, entreprise: entreprise || null, logo })
    )
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fiche.numero || 'bulletin'}.pdf"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Bulletin PDF error:', err)
    return NextResponse.json({ error: 'Erreur de génération PDF', detail: err.message }, { status: 500 })
  }
}
