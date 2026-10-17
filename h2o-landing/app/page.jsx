import Image from 'next/image';
import Link from 'next/link';
import FeaturedGallery from '@/components/FeaturedGallery';
import { ArrowRight, MapPin, Star, Users, Award } from 'lucide-react';

export const metadata = {
  title: 'Residence H2O - Hôtel Luxe et Confortable',
  description: 'Découvrez Residence H2O, votre destination idéale avec 145 chambres luxueuses, piscine olympique, restaurant gastronomique et bien plus.',
};

export default function Home() {
  const stats = [
    { label: '145+', desc: 'Photos Professionnelles' },
    { label: '50+', desc: 'Chambres Luxueuses' },
    { label: '24/7', desc: 'Service Concierge' },
    { label: '5★', desc: 'Avis Clients' }
  ];

  const amenities = [
    {
      icon: '🏊',
      title: 'Piscine Olympique',
      desc: 'Piscine chauffée de 50m avec sauna et jacuzzi privé'
    },
    {
      icon: '💪',
      title: 'Centre Fitness',
      desc: 'Gym équipé avec entraîneurs personnels disponibles 24/7'
    },
    {
      icon: '🍽️',
      title: 'Restaurant Gastronomique',
      desc: 'Cuisine d\'auteur avec chefs renommés et menu international'
    },
    {
      icon: '🧖',
      title: 'Spa & Wellness',
      desc: 'Massages, soins du visage et traitements holistiques'
    },
    {
      icon: '🚗',
      title: 'Service Transport',
      desc: 'Navette gratuite et location de voitures disponibles'
    },
    {
      icon: '📱',
      title: 'Concierge Digital',
      desc: 'App mobile pour contrôler votre séjour'
    }
  ];

  const testimonials = [
    {
      text: "Une expérience inoubliable! Le service est impeccable et les chambres sont magnifiques.",
      author: "Sophie Martin",
      role: "Voyageuse Satisfaite"
    },
    {
      text: "Le meilleur hôtel où j'ai séjourné. L'équipe est dévouée et attentionnée.",
      author: "Jean Dupont",
      role: "Business Traveler"
    },
    {
      text: "Parfait pour une lune de miel! Les vues sont spectaculaires et le service incomparable.",
      author: "Marie & Pierre",
      role: "Jeunes Mariés"
    }
  ];

  return (
    <main>
      {/* ============ HERO SECTION ============ */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Bienvenue à <span className="text-blue-400">Residence H2O</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-2xl mx-auto">
            L'expérience de luxe ultime avec 145 photos spectaculaires et services de classe mondiale
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors group"
            >
              Réserver Maintenant
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              Explorer la Galerie
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="text-white text-center">
            <p className="text-sm mb-2">Découvrir plus</p>
            <div className="text-2xl">↓</div>
          </div>
        </div>
      </section>

      {/* ============ STATS SECTION ============ */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.label}</div>
                <p className="text-blue-100">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AMENITIES SECTION ============ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Équipements de Classe Mondiale</h2>
            <p className="text-xl text-gray-600">Découvrez ce qui rend Residence H2O spécial</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {amenities.map((amenity, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-5xl mb-4">{amenity.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{amenity.title}</h3>
                <p className="text-gray-700">{amenity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GALLERY SECTION ============ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Galerie Photos - 145 Images Professionnelles</h2>
            <p className="text-xl text-gray-600">Explorez la beauté de Residence H2O</p>
          </div>
          <FeaturedGallery />
        </div>
      </section>

      {/* ============ ROOMS SECTION ============ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nos Chambres</h2>
            <p className="text-xl text-gray-600">Du confort à la luxure absolue</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Deluxe', price: '150€', features: ['Vue jardins', 'Salle de bain marbre', 'WiFi'] },
              { name: 'Premium', price: '200€', features: ['Vue panoramique', 'Jacuzzi privé', 'Terrasse'] },
              { name: 'Presidential', price: '350€', features: ['Salons privés', 'Cuisine équipée', 'Concierge'] }
            ].map((room, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600"></div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Suite {room.name}</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-4">{room.price}<span className="text-lg text-gray-600">/nuit</span></p>
                  <ul className="space-y-2 mb-6">
                    {room.features.map((feature, i) => (
                      <li key={i} className="text-gray-700 flex items-center">
                        <span className="text-blue-600 mr-2">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/rooms"
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    En Savoir Plus
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS SECTION ============ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
            <p className="text-xl text-gray-600">Vos avis nous inspirent</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg shadow-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Prêt pour l'expérience?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez nos clients satisfaits et découvrez le luxe à Residence H2O
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors group"
            >
              Réserver Votre Séjour
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transition-colors"
            >
              Nous Contacter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
