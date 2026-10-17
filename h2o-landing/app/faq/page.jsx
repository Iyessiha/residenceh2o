import FAQClient from '@/components/FAQClient';

export const metadata = {
  title: 'FAQ | Residence H2O - Questions Fréquentes',
  description: 'Trouvez les réponses à vos questions sur Residence H2O, nos services et réservations.',
};

const faqItems = [
  {
    question: 'Quelle est votre politique d\'annulation?',
    answer: 'Vous pouvez annuler gratuitement jusqu\'à 7 jours avant votre arrivée. Les annulations moins de 7 jours avant seront facturées 50% du prix.'
  },
  {
    question: 'Acceptez-vous les animaux de compagnie?',
    answer: 'Oui, les animaux de compagnie bien élevés sont acceptés moyennant des frais additionnels de 30€ par nuit.'
  },
  {
    question: 'Y a-t-il un parking?',
    answer: 'Oui, nous offrons un parking gratuit pour tous nos clients. Il y a aussi des services de voiturier disponibles.'
  },
  {
    question: 'Offrez-vous le WiFi?',
    answer: 'Oui, le WiFi haut débit est gratuit dans toutes nos chambres et espaces communs.'
  },
  {
    question: 'Quels sont les horaires du restaurant?',
    answer: 'Notre restaurant est ouvert de 7h à 23h. Room service disponible 24/7.'
  },
  {
    question: 'Comment puis-je réserver?',
    answer: 'Vous pouvez réserver en ligne sur notre site, par téléphone ou via notre application mobile.'
  },
  {
    question: 'Y a-t-il des salles de réunion pour les événements corporatifs?',
    answer: 'Oui, nous avons plusieurs salles de conférence équipées pour les réunions et événements.'
  },
  {
    question: 'Proposez-vous le service d\'étage?',
    answer: 'Oui, le room service est disponible 24/7. Consultez notre menu via la télévision de votre chambre.'
  }
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Questions Fréquentes</h1>
          <p className="text-xl text-blue-100">Trouvez les réponses à vos questions</p>
        </div>
      </div>

      {/* FAQ */}
      <FAQClient items={faqItems} />

      {/* Contact CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Vous n\'avez pas trouvé la réponse?</h2>
          <p className="mb-6">Contactez-nous directement, notre équipe est là pour vous aider</p>
          <a href="tel:+1234567890" className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors">
            Nous Appeler
          </a>
        </div>
      </div>
    </main>
  );
}
