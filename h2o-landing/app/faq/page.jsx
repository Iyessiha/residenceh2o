import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import FAQClient from '@/components/FAQClient'
import { getDuplexes } from '@/lib/data'
import { formatFCFA } from '@/lib/residences'

export const metadata = {
  title: 'FAQ | Les Résidences H₂O',
  description: 'Réponses aux questions sur les Résidences H₂O : tarifs, duplexes, piscine privée, réservation et événements.',
}

// Chaque réponse reprend un fait présent sur la landing. Toute modification
// d'un tarif ou d'un duplex doit être faite dans lib/residences.js.
// Tarifs et capacités viennent du manager : ils ne doivent pas être écrits à la main.
function construireFaq(duplexes) {
  return [
  {
    question: 'Où se trouvent les Résidences H₂O ?',
    answer: 'À Modeste Beach, route de Grand-Bassam : à 10 minutes de la plage et à environ 30 minutes du Plateau à Abidjan.',
  },
  {
    question: 'Combien coûte un séjour ?',
    answer: `Les tarifs sont par nuit et par duplex : ${duplexes.map(d => `${d.nom} ${formatFCFA(d.prix)}`).join(', ')}. Le séjour minimum est de 2 nuits.`,
  },
  {
    question: 'Combien de personnes peuvent séjourner dans chaque duplex ?',
    answer: duplexes.map(d => `${d.nom} : ${d.capacite.toLowerCase()}.`).join(' '),
  },
  {
    question: 'Chaque duplex a-t-il sa propre piscine ?',
    answer: 'Oui, chaque duplex dispose de sa piscine privée, sans vis-à-vis.',
  },
  {
    question: 'Y a-t-il un parking ?',
    answer: 'Oui, le parking est gratuit. La résidence est sécurisée 24h/24 avec gardiennage.',
  },
  {
    question: 'Le Wi-Fi est-il inclus ?',
    answer: 'Oui, le Wi-Fi haut débit est disponible dans les duplexes.',
  },
  {
    question: 'Y a-t-il un restaurant sur place ?',
    answer: 'Oui, un restaurant est disponible sur place. Pour connaître ses horaires, écrivez-nous sur WhatsApp.',
  },
  {
    question: 'Comment réserver ?',
    answer: 'Remplissez le formulaire de réservation sur le site, ou écrivez-nous sur WhatsApp. Nous vous répondons sous 24 h pour confirmer votre séjour.',
  },
  {
    question: 'Peut-on organiser un mariage ou un événement ?',
    answer: "Oui. La pergola peut accueillir jusqu'a 200 invites, avec acces au pontoon et service traiteur cle en main. Demandez un devis sur mesure.",
  },
  {
    question: 'Peut-on privatiser la residence ?',
    answer: "Oui, la privatisation totale est possible sur reservation. L'hebergement des invites est inclus dans nos duplexes.",
  },
  {
    question: "Accueillez-vous des seminaires d'entreprise ?",
    answer: "Oui, la residence accueille seminaires d'entreprise, teambuildings et diners gastronomiques au bord du lac, sur devis.",
  },
  {
    question: "Comment se passe l'accueil ?",
    answer: "Une conciergerie dediee vous accueille, avec une flexibilite sur les horaires d'arrivee.",
  },
  ]
}

export default async function FAQPage() {
  const duplexes = await getDuplexes()
  const faqItems = construireFaq(duplexes)

  return (
    <>
      <Nav />
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-2)' }}>
        {/* Hero */}
        <section
          className="text-white pt-32 pb-16 md:pt-40 md:pb-24"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dk) 100%)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Questions Fréquentes</h1>
            <p className="text-xl text-white/90">Tout savoir sur nos duplexes, nos tarifs et votre réservation</p>
          </div>
        </section>

        {/* FAQ */}
        <FAQClient items={faqItems} />

        {/* Contact CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-white rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--primary)' }}>
            <h2 className="text-2xl font-bold mb-4">Vous n'avez pas trouvé la réponse ?</h2>
            <p className="mb-6">Écrivez-nous sur WhatsApp ou envoyez votre demande depuis le formulaire de réservation.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/2250749194952?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20les%20R%C3%A9sidences%20H2O"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 bg-white font-bold rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                Écrire sur WhatsApp
              </a>
              <a
                href="/#contact"
                className="inline-block px-8 py-3 border border-white/60 font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                Demande de réservation
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
