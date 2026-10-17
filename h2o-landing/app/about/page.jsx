import Link from 'next/link';

export const metadata = {
  title: 'À Propos | Residence H2O - Notre Histoire',
  description: 'Découvrez l\'histoire de Residence H2O, nos valeurs et notre engagement envers l\'excellence.'
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Notre Histoire</h1>
          <p className="text-xl text-blue-100">Excellence, Innovation et Hospitalité Depuis le Début</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Residence H2O offre une expérience d'hébergement de luxe qui dépasse les attentes. Notre mission est de créer un refuge idéal où chaque client se sent précieux et choyé.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Nous croyons que l'hospitalité va au-delà du service - c'est une question de créer des souvenirs durables.
            </p>
          </div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Nos Valeurs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Excellence', desc: 'L\'excellence dans chaque détail' },
              { title: 'Innovation', desc: 'Toujours chercher à améliorer' },
              { title: 'Durabilité', desc: 'Respecter l\'environnement' }
            ].map((value, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg shadow-lg text-center">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">{value.title}</h3>
                <p className="text-gray-700">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Notre Équipe</h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto mb-8">
            Notre équipe dévouée de professionnels est disponible 24/7 pour assurer votre confort et satisfaction.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nous Contacter
          </Link>
        </div>
      </div>
    </main>
  );
}
