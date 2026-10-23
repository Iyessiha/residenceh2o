import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Politique de confidentialité | Les Résidences H₂O',
  description: 'Comment les Résidences H₂O collectent, utilisent et protègent vos données personnelles.',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#F7F4EE]">
        <section className="pt-32 pb-12 text-white" style={{ background: 'linear-gradient(135deg, #0C3A3D 0%, #14565A 100%)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Politique de confidentialité</h1>
            <p className="text-white/70 text-sm">Dernière mise à jour : janvier 2025</p>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">

            <Article titre="1. Responsable du traitement">
              <p>Les Résidences H₂O, Villa Poton, ancienne route de Bassam, au lac, Côte d'Ivoire — contact@residencesh2o.com</p>
            </Article>

            <Article titre="2. Données collectées">
              <p>Lors de l'utilisation du site et du formulaire de réservation, nous pouvons collecter :</p>
              <ul>
                <li>— Nom et prénom</li>
                <li>— Adresse e-mail</li>
                <li>— Numéro de téléphone</li>
                <li>— Dates de séjour souhaitées et nombre de personnes</li>
                <li>— Messages libres envoyés via le formulaire de contact</li>
              </ul>
              <p>Ces données sont transmises directement à notre équipe via notre système de gestion interne. Aucune donnée de paiement n'est collectée sur ce site.</p>
            </Article>

            <Article titre="3. Finalités du traitement">
              <p>Vos données sont utilisées exclusivement pour :</p>
              <ul>
                <li>— Répondre à vos demandes de réservation ou d'information</li>
                <li>— Gérer votre séjour et assurer le suivi de votre réservation</li>
                <li>— Vous contacter par téléphone ou e-mail si nécessaire</li>
              </ul>
              <p>Nous ne vendons, ne louons et ne partageons pas vos données avec des tiers à des fins commerciales.</p>
            </Article>

            <Article titre="4. Durée de conservation">
              <p>Vos données sont conservées pendant la durée nécessaire à la gestion de votre réservation, puis archivées pendant 3 ans conformément à nos obligations légales, avant suppression définitive.</p>
            </Article>

            <Article titre="5. Vos droits">
              <p>Conformément aux lois applicables en matière de protection des données, vous disposez des droits suivants :</p>
              <ul>
                <li>— <strong>Droit d'accès :</strong> obtenir une copie des données vous concernant</li>
                <li>— <strong>Droit de rectification :</strong> corriger des données inexactes</li>
                <li>— <strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                <li>— <strong>Droit d'opposition :</strong> vous opposer à un traitement</li>
              </ul>
              <p>Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@residencesh2o.com" className="text-[#1C6E70] underline">contact@residencesh2o.com</a></p>
            </Article>

            <Article titre="6. Cookies">
              <p>Le site peut utiliser des cookies techniques essentiels au fonctionnement (navigation, préférences). Aucun cookie publicitaire ou de traçage tiers n'est utilisé. Vous pouvez configurer votre navigateur pour refuser les cookies.</p>
            </Article>

            <Article titre="7. Sécurité">
              <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou divulgation, notamment via des connexions chiffrées (HTTPS) et une base de données sécurisée.</p>
            </Article>

            <Article titre="8. Contact">
              <p>Pour toute question relative à cette politique : <a href="mailto:contact@residencesh2o.com" className="text-[#1C6E70] underline">contact@residencesh2o.com</a></p>
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
