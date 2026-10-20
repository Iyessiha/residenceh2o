'use client'
import { useEffect } from 'react'

// Insère les balises et pixels gérés dans le manager.
// createContextualFragment rend les <script> exécutables, contrairement à innerHTML.
export default function TagManager({ balises }) {
  useEffect(() => {
    const ajoutes = balises.map((b) => {
      const cible = b.emplacement === 'head' ? document.head : document.body
      const fragment = document.createRange().createContextualFragment(b.code)
      const noeuds = Array.from(fragment.childNodes)
      cible.append(fragment)
      return noeuds
    })
    return () => ajoutes.flat().forEach((n) => n.parentNode?.removeChild(n))
  }, [balises])

  return null
}
