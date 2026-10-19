import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: "Conditions d'utilisation | Les Résidences H₂O",
  description: "Conditions générales d'utilisation du site residencesh2o.com — Les Résidences H₂O.",
}

export default function CguPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#F7F4EE]">
        <section className="pt-32 pb-12 text-white" style={{ background: 'linear-gradient(135deg, #0C3A3D 0%, #14565A 100%)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{"Conditions générales d'utilisation"}</h1>
            <p className="text-white/70 text-sm">Dernière mise à jour : janvier 2025</p>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">

            <Article titre="1. Objet">
              <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du site <strong>residencesh2o.com</strong>, édité par Les Résidences H₂O. En accédant au site, vous acceptez sans réserve les présentes CGU.</p>
            </Article>

            <Article titre="2. Accès au site">
              <p>Le site est accessible gratuitement à tout internaute disposant d'un accès à Internet. Tous les frais liés à l'accès (connexion, matériel) restent à votre charge.</p>
              <p>Les Résidences H₂O se réservent le droit de modifier, interrompre ou fermer le site à tout moment, sans préavis ni indemnité.</p>
            </Article>

            <Article titre="3. Réservations">
              <p>Le formulaire de contact présent sur le site permet de soumettre une <strong>demande</strong> de réservation. Aucune réservation n'est confirmée avant réception d'une confirmation écrite de notre équipe (e-mail ou WhatsApp).</p>
              <p>Les tarifs affichés sur le site sont indicatifs et peuvent évoluer. Seul le tarif confirmé dans notre message de validation fait foi.</p>
              <p>Toute annulation ou modification doit être notifiée par e-mail à contact@residencesh2o.com. Les conditions d'annulation vous seront précisées lors de la confirmation.</p>
            </Article>

            <Article titre="4. Propriété intellectuelle">
              <p>L'ensemble des contenus du site (textes, photographies, vidéos, logo, design) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou utilisation, même partielle, sans autorisation écrite préalable est strictement interdite.</p>
            </Article>

            <Article titre="5. Responsabilité">
              <p>Les Résidences H₂O s'engagent à fournir les services décrits sur le site dans des conditions conformes aux normes d'accueil et de sécurité en vigueur.</p>
              <p>Nous ne saurions être tenus responsables de dommages indirects résultant de l'utilisation du site ou d'une interruption de service indépendante de notre volonté (force majeure, panne technique, etc.).</p>
            </Article>

            <Article titre="6. Liens externes">
              <p>Le site peut contenir des liens vers des sites tiers (WhatsApp, réseaux sociaux). Ces sites ont leurs propres CGU ; nous déclinons toute responsabilité quant à leurs contenus.</p>
            </Article>

            <Article titre="7. Modification des CGU">
              <p>Les Résidences H₂O se réservent le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur le site. Il vous appartient de les consulter régulièrement.</p>
            </Article>

            <Article titre="8. Droit applicable et litiges">
              <p>Les présentes CGU sont soumises au droit ivoirien. En cas de litige, et après tentative amiable infructueuse, les tribunaux compétents de Grand-Bassam (Côte d'Ivoire) seront saisis.</p>
            </Article>

            <Article titre="9. Contact">
              <p>Pour toute question : <a href="mailto:contact@residencesh2o.com" className="text-[#1C6E70] underline">contact@residencesh2o.com</a> — +225 07 49 19 49 52</p>
            </Article>

          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Article({ titre, children }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-[#0C3A3D] mb-3 pb-2 border-b border-[#E2DACB]">{titre}</h2>
      <div className="text-slate-600 text-sm leading-relaxed space-y-2 [&_ul]:mt-2 [&_ul]:space-y-1 [&_ul]:list-none [&_li]:flex [&_li]:gap-1 [&_strong]:text-slate-800">
        {children}
      </div>
    </div>
  )
}
