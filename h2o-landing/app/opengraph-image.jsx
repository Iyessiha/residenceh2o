import { ImageResponse } from 'next/og'

export const alt = 'Les Résidences H2O — Villas avec piscine privée à Villa Poton'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Image de partage générée (1200 × 630) aux couleurs du site.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: 90,
          color: 'white',
          background: 'linear-gradient(135deg, #1A0A04 0%, #3A1408 60%, #E8513A 100%)',
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 6, textTransform: 'uppercase', color: '#F49B8B' }}>
          Villa Poton · Ancienne route de Bassam
        </div>
        <div style={{ fontSize: 80, fontWeight: 700, marginTop: 24 }}>Les Résidences H2O</div>
        <div style={{ fontSize: 34, marginTop: 20, opacity: 0.85 }}>
          Villas duplex avec piscine privée au bord du lac
        </div>
      </div>
    ),
    { ...size }
  )
}
