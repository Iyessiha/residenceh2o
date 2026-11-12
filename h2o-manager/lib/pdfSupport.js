// Les tablettes et téléphones n'affichent pas un PDF dans un cadre de page (iframe) et ne peuvent pas
// l'imprimer par script : on leur propose d'ouvrir le PDF dans le lecteur du système (Partager → Imprimer).
export function pdfIntegreSupporte() {
  if (typeof navigator === 'undefined') return true
  const ua = navigator.userAgent || ''
  const tactile = /iPad|iPhone|iPod|Android/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return !tactile && navigator.pdfViewerEnabled !== false
}

export const AIDE_IMPRESSION_TACTILE =
  "Dans le PDF ouvert : sur iPad/iPhone appuyez sur Partager puis Imprimer ; sur Android ouvrez le menu ⋮ puis Imprimer."
