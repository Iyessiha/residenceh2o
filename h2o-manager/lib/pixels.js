// Modèles de code pour les pixels courants. L'administrateur saisit seulement l'identifiant.
// L'identifiant est vérifié avant d'être inséré : il ne peut contenir que des lettres, chiffres, tirets et underscores.
export const FOURNISSEURS = {
  meta: {
    nom: 'Meta Pixel (Facebook / Instagram)',
    exemple: '1234567890123456',
    type: 'pixel',
    emplacement: 'head',
    regle: /^\d{8,20}$/,
    code: (id) => `<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');
fbq('track','PageView');
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/></noscript>`,
  },
  ga4: {
    nom: 'Google Analytics 4',
    exemple: 'G-XXXXXXXXXX',
    type: 'pixel',
    emplacement: 'head',
    regle: /^G-[A-Z0-9]{4,20}$/,
    code: (id) => `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');
</script>`,
  },
  gtm: {
    nom: 'Google Tag Manager',
    exemple: 'GTM-XXXXXXX',
    type: 'balise',
    emplacement: 'head',
    regle: /^GTM-[A-Z0-9]{4,12}$/,
    code: (id) => `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>`,
  },
  tiktok: {
    nom: 'TikTok Pixel',
    exemple: 'CXXXXXXXXXXXXXXXXXXXX',
    type: 'pixel',
    emplacement: 'head',
    regle: /^[A-Z0-9]{10,40}$/,
    code: (id) => `<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${id}');ttq.page();
}(window, document, 'ttq');
</script>`,
  },
}

// Retourne le code à enregistrer, ou une erreur lisible.
export function genererCode(fournisseur, identifiant) {
  const modele = FOURNISSEURS[fournisseur]
  const id = (identifiant || '').trim()
  if (!modele) return { erreur: 'Fournisseur inconnu' }
  if (!modele.regle.test(id)) return { erreur: `Identifiant invalide. Exemple : ${modele.exemple}` }
  return { code: modele.code(id) }
}
