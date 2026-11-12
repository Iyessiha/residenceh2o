'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { pdfIntegreSupporte, AIDE_IMPRESSION_TACTILE } from '@/lib/pdfSupport'

// Client Supabase anon : seule la fonction facture_publique est appelée (voir la migration)
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function FacturePublique() {
  const { id } = useParams()
  const [etat, setEtat] = useState('chargement')   // chargement | ok | introuvable | erreur
  const [facture, setFacture] = useState(null)
  const [url, setUrl] = useState(null)
  const [detail, setDetail] = useState('')   // cause technique, affichée en petit en cas d'erreur
  const iframeRef = useRef(null)
  const [integre, setIntegre] = useState(true)
  useEffect(() => { setIntegre(pdfIntegreSupporte()) }, [])

  useEffect(() => {
    let blobUrl = null
    let annule = false
    async function charger() {
      if (!UUID.test(id || '')) { setEtat('introuvable'); return }
      try {
        const { data, error } = await sb.rpc('facture_publique', { p_id: id })
        if (error) throw new Error(`base de données (${error.code || error.message || 'rpc'})`)
        if (!data?.facture) { if (!annule) setEtat('introuvable'); return }
        const res = await fetch(`/api/factures/${id}/pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data.facture, _guestUrl: null, _factureUrl: window.location.href, _entreprise: data.entreprise }),
        })
        if (!res.ok) throw new Error(`génération du PDF (HTTP ${res.status})`)
        blobUrl = URL.createObjectURL(await res.blob())
        if (annule) return
        setFacture(data.facture); setUrl(blobUrl); setEtat('ok')
      } catch (e) {
        console.error('Facture publique :', e)
        if (!annule) { setDetail(e?.message || 'inconnue'); setEtat('erreur') }
      }
    }
    charger()
    return () => { annule = true; if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [id])

  function telecharger() {
    const a = document.createElement('a')
    a.href = url
    a.download = `${facture.numero || 'facture'}.pdf`
    document.body.appendChild(a); a.click(); a.remove()
  }

  const bouton = { padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer' }

  return (
    <main style={{ minHeight: '100vh', background: '#F6F4EF', fontFamily: 'system-ui, sans-serif', color: '#1F2A2B' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px 16px' }}>
        <p style={{ fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: '#0C3A3D', fontWeight: 700, margin: 0 }}>
          Les Résidences H₂O
        </p>
        <h1 style={{ fontSize: 24, margin: '6px 0 16px' }}>
          {etat === 'ok' ? `Votre facture ${facture.numero || ''}` : 'Votre facture'}
        </h1>

        {etat === 'chargement' && <p>Chargement de votre facture…</p>}
        {etat === 'introuvable' && <p>Cette facture est introuvable. Vérifiez le QR code ou demandez-en un nouveau à la réception.</p>}
        {etat === 'erreur' && (
          <>
            <p>Impossible d'afficher la facture pour le moment. Réessayez dans un instant.</p>
            <p style={{ fontSize: 12, color: '#6B7678' }}>Détail technique : {detail}</p>
          </>
        )}

        {etat === 'ok' && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <button onClick={telecharger} style={{ ...bouton, background: '#0C3A3D', color: '#fff' }}>Télécharger le PDF</button>
              {integre
                ? <button onClick={() => iframeRef.current?.contentWindow?.print()} style={{ ...bouton, background: '#fff', color: '#0C3A3D', border: '1px solid #0C3A3D' }}>Imprimer</button>
                : <a href={url} target="_blank" rel="noreferrer" style={{ ...bouton, background: '#fff', color: '#0C3A3D', border: '1px solid #0C3A3D', textDecoration: 'none' }}>Ouvrir / Imprimer</a>}
              {integre && <a href={url} target="_blank" rel="noreferrer" style={{ ...bouton, background: '#fff', color: '#0C3A3D', border: '1px solid #D8D3C8', textDecoration: 'none' }}>Ouvrir en plein écran</a>}
            </div>
            {integre ? (
              <iframe ref={iframeRef} src={url} title={`Facture ${facture.numero || ''}`} style={{ width: '100%', height: '75vh', border: '1px solid #D8D3C8', borderRadius: 10, background: '#fff' }} />
            ) : (
              <p style={{ fontSize: 14, color: '#4B5658', lineHeight: 1.5 }}>{AIDE_IMPRESSION_TACTILE}</p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
