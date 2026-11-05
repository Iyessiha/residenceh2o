// Alertes sonores du manager.
// Réglages « son on/off » et « volume » : propres à chaque appareil (localStorage).
// Les rôles concernés, eux, sont partagés (table alertes_reglages).

export const ROLES_MANAGER = [
  { key: 'admin', label: 'Administrateur' },
  { key: 'gerance', label: 'Gérance' },
  { key: 'reception', label: 'Réception' },
]

// Deux sonneries distinctes : réservation (arpège montant) et commande (trois bips)
export const SONS = {
  reservation: { notes: [660, 880, 1100], espace: 0.22, libelle: 'Réservation' },
  commande: { notes: [880, 880, 880], espace: 0.18, libelle: 'Commande / vente' },
}

const CLE_SONS = 'h2o-sons'
const CLE_VOLUME = 'h2o-volume'
const VOLUME_DEFAUT = 80

// Accès au stockage protégé : navigation privée ou stockage bloqué
export function lireSonsActifs() {
  try { return localStorage.getItem(CLE_SONS) !== 'off' } catch { return true }
}

export function ecrireSonsActifs(actif) {
  try { localStorage.setItem(CLE_SONS, actif ? 'on' : 'off') } catch {}
}

export function lireVolume() {
  try {
    const v = parseInt(localStorage.getItem(CLE_VOLUME), 10)
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : VOLUME_DEFAUT
  } catch {
    return VOLUME_DEFAUT
  }
}

export function ecrireVolume(valeur) {
  try { localStorage.setItem(CLE_VOLUME, String(valeur)) } catch {}
}

let contexteAudio = null

function obtenirContexteAudio() {
  try {
    if (!contexteAudio) contexteAudio = new (window.AudioContext || window.webkitAudioContext)()
    return contexteAudio
  } catch {
    return null
  }
}

// À appeler depuis un clic utilisateur : les navigateurs bloquent le son sans interaction.
// Renvoie true si le son est autorisé et prêt à jouer.
export async function activerSon() {
  const ctx = obtenirContexteAudio()
  if (!ctx) return false
  try { await ctx.resume() } catch {}
  if (ctx.state !== 'running') return false
  jouerSon('commande')
  return true
}

export function sonPret() {
  const ctx = contexteAudio
  return !!ctx && ctx.state === 'running'
}

// Joue la sonnerie correspondant au type de notification (ignoré si le son est coupé)
export function jouerSon(type = 'commande') {
  if (!lireSonsActifs()) return
  const ctx = obtenirContexteAudio()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})

  const { notes, espace } = SONS[type] || SONS.commande
  const niveau = 0.35 * (lireVolume() / 100)
  if (niveau <= 0) return

  notes.forEach((frequence, i) => {
    const t = ctx.currentTime + i * espace
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = frequence
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(niveau, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    osc.start(t)
    osc.stop(t + 0.15)
  })
}
