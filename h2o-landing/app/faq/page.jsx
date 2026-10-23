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
    answer: "À Villa Poton, ancienne route de Bassam, au bord du lac : à 10 minutes de la plage, à 30 minutes de l'aéroport et du Plateau d'Abidjan.",
  },
  {
    question: 'Combien coûte un séjour ?',
    answer: `Les villas se louent à la nuit complète 24/24 ou à la matinée : ${duplexes.map(d => `${d.nom} ${formatFCFA(d.prix)} la nuit (matinée ${formatFCFA(d.prixJournee)})`).join(', ')}. Le séjour minimum est de 2 nuits.`,
  },
  {
    question: 'Peut-on louer une seule chambre ?',
    answer: 'Oui, les chambres se louent à la nuit avec petit déjeuner, à partir de 40 000 FCFA, ou à la journée. Chaque chambre accueille 2 personnes maximum.',
  },
  {
    question: 'Combien de personnes peuvent séjourner dans chaque villa ?',
    answer: duplexes.map(d => `${d.nom} : ${d.capacite.toLowerCase()}.`).join(' '),
  },
  {
    question: 'Chaque villa a-t-elle sa propre piscine ?',
    answer: 'Oui, chaque villa dispose de sa piscine privée. La piscine n\'est pas surveillée par un maître nageur.',
  },
  {
    question: 'Y a-t-il un parking ?',
    answer: 'Oui, chaque villa dispose d\'un parking pour 2 voitures. La résidence est surveillée par caméras, avec un agent de sécurité.',
  },
  {
    question: 'Le Wi-Fi est-il inclus ?',
    answer: 'Oui, le Wi-Fi 5G est disponible dans les villas, avec TV dans le salon et dans chaque chambre.',
  },
  {
    question: 'Y a-t-il un restaurant sur place ?',
    answer: 'Oui, un restaurant et un bar sont sur place, avec petit déjeuner inclus dans le séjour. Consultez la carte sur la page Restaurant.',
  },
  {
    question: 'Comment réserver ?',
    answer: 'Remplissez le formulaire de réservation sur le site, ou écrivez-nous sur WhatsApp. Nous vous répondons sous 24 h pour confirmer votre séjour.',
  },
  {
    question: 'Peut-on organiser un mariage ou un événement ?',
    answer: "Oui. Un espace événementiel est disponible sur place, avec une terrasse à manger, un bar climatisé et la grande piscine commune. Demandez un devis sur mesure.",
  },
  {
    question: 'Peut-on privatiser la residence ?',
    answer: "Oui, la privatisation totale est possible sur reservation. L'hebergement des invites se fait dans nos villas et chambres.",
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
                href="https://wa.me/2250705259234?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20les%20R%C3%A9sidences%20H2O"
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
