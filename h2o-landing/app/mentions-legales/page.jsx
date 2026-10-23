import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Mentions légales | Les Résidences H₂O',
  description: 'Mentions légales du site residencesh2o.com — Les Résidences H₂O, Villa Poton, ancienne route de Bassam, Côte d\'Ivoire.',
}

export default function MentionsLegalesPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#F7F4EE]">
        <section className="pt-32 pb-12 text-white" style={{ background: 'linear-gradient(135deg, #0C3A3D 0%, #14565A 100%)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Mentions légales</h1>
            <p className="text-white/70 text-sm">Dernière mise à jour : janvier 2025</p>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">

            <Article titre="1. Éditeur du site">
              <p>Le site <strong>residencesh2o.com</strong> est édité par :</p>
              <ul>
                <li><strong>Raison sociale :</strong> Les Résidences H₂O</li>
                <li><strong>Statut :</strong> Établissement d'hébergement touristique</li>
                <li><strong>Adresse :</strong> Villa Poton, ancienne route de Bassam, au lac, Côte d'Ivoire</li>
                <li><strong>Téléphone :</strong> +225 07 49 19 49 52</li>
                <li><strong>E-mail :</strong> contact@residencesh2o.com</li>
              </ul>
            </Article>

            <Article titre="2. Responsable de publication">
              <p>Le responsable de la publication est le gérant des Résidences H₂O.</p>
            </Article>

            <Article titre="3. Hébergeur technique">
              <ul>
                <li><strong>Développement et exploitation :</strong> MonWe Infinity LLC</li>
                <li><strong>Hébergement :</strong> Vercel Inc., 340 Pine Street, Suite 900, San Francisco, CA 94104, États-Unis — <a href="https://vercel.com" className="text-[#1C6E70] underline">vercel.com</a></li>
                <li><strong>Base de données :</strong> Supabase Inc., San Francisco, CA, États-Unis — <a href="https://supabase.com" className="text-[#1C6E70] underline">supabase.com</a></li>
              </ul>
            </Article>

            <Article titre="4. Propriété intellectuelle">
              <p>L'ensemble du contenu du site (textes, photos, vidéos, logo, icônes) est la propriété exclusive des Résidences H₂O ou de ses partenaires. Toute reproduction, diffusion ou utilisation à des fins commerciales est interdite sans autorisation écrite préalable.</p>
            </Article>

            <Article titre="5. Limitation de responsabilité">
              <p>Les informations publiées sur ce site sont fournies à titre indicatif. Les Résidences H₂O s'efforcent d'assurer l'exactitude des contenus mais ne peuvent garantir leur exhaustivité. Les tarifs affichés sont susceptibles d'évoluer ; seule la confirmation de réservation fait foi.</p>
            </Article>

            <Article titre="6. Droit applicable">
              <p>Le présent site et ses contenus sont soumis au droit ivoirien. Tout litige relatif à son utilisation relève de la compétence exclusive des juridictions compétentes en Côte d'Ivoire.</p>
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
