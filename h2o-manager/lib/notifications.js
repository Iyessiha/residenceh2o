// Notifications navigateur du manager.
// Sur Android et en mode PWA, `new Notification()` est refusé : il faut passer
// par le service worker (registration.showNotification). On garde l'API directe
// en repli pour les navigateurs de bureau sans service worker.

export function notificationsSupportees() {
  return typeof window !== 'undefined' && 'Notification' in window
}

// Doit être appelée depuis un geste utilisateur (clic / touche) pour être acceptée par iOS et Safari
export async function demanderPermissionNotifications() {
  if (!notificationsSupportees()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export async function afficherNotification(titre, { corps = '', url = '/dashboard', tag = 'h2o-manager' } = {}) {
  if (!notificationsSupportees() || Notification.permission !== 'granted') return

  const options = {
    body: corps,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag,
    renotify: true,
    data: { url },
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.showNotification) {
        await registration.showNotification(titre, options)
        return
      }
    }
  } catch {
    // on tente le repli ci-dessous
  }

  try {
    new Notification(titre, options)
  } catch {
    // Environnement sans constructeur Notification (ex. certains mobiles) : l'alerte in-app reste affichée
  }
}
