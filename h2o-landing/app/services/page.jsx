import Link from 'next/link';

export const metadata = {
  title: 'Services | Residence H2O - Équipements Complèts',
  description: 'Découvrez nos services et équipements de classe mondiale pour votre séjour.'
};

const services = [
  {
    title: 'Piscine Olympique',
    description: 'Piscine chauffée de 50m avec sauna et jacuzzi'
  },
  {
    title: 'Centre de Remise en Forme',
    description: 'Gym complètement équipé avec entraîneurs personnels'
  },
  {
    title: 'Restaurant Gastronomique',
    description: 'Cuisine d\'auteur avec vue panoramique'
  },
  {
    title: 'Spa et Wellness',
    description: 'Massages, soins du visage et bien-être holistique'
  },
  {
    title: 'Concierge 24/7',
    description: 'Service personnalisé disponible jour et nuit'
  },
  {
    title: 'Business Center',
    description: 'Salles de réunion et espace de travail équipées'
  },
  {
    title: 'Transport',
    description: 'Service de navette et location de voitures'
  },
  {
    title: 'Kids Club',
    description: 'Activités et divertissements pour enfants'
  }
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos Services</h1>
          <p className="text-xl text-blue-100">Équipements de Classe Mondiale pour Votre Confort</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {services.map((service, idx) => (
            <div key={idx} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-blue-600 mb-2">{service.title}</h3>
              <p className="text-gray-700">{service.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-blue-600 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à expérimenter le luxe?</h2>
          <p className="text-lg mb-8">Réservez votre séjour dès maintenant et profitez de tous nos services</p>
          <Link
            href="/reservation"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Réserver Maintenant
          </Link>
        </div>
      </div>
    </main>
  );
}
