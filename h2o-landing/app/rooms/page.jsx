import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Chambres | Residence H2O - Luxe et Confort',
  description: 'Découvrez nos chambres spacieuses et élégamment aménagées avec équipements modernes.'
};

const rooms = [
  {
    id: 1,
    name: 'Suite Deluxe',
    price: '150€',
    capacity: '2 personnes',
    features: ['Vue sur jardins', 'WiFi gratuit', 'Climatisation', 'Salle de bain marbre'],
    image: '/images/gallery/IMG_2890.jpg'
  },
  {
    id: 2,
    name: 'Suite Premium',
    price: '200€',
    capacity: '2-4 personnes',
    features: ['Vue panoramique', 'Jacuzzi privé', 'Terrasse', 'Minibar'],
    image: '/images/gallery/IMG_2891.jpg'
  },
  {
    id: 3,
    name: 'Presidential Suite',
    price: '350€',
    capacity: '4-6 personnes',
    features: ['Salons privés', 'Cuisine complète', 'Vue 360°', 'Service concierge'],
    image: '/images/gallery/IMG_2892.jpg'
  }
];

export default function RoomsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos Chambres</h1>
          <p className="text-xl text-blue-100">Confort et Luxe dans un Environnement Élégant</p>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-64 bg-gray-200">
                <Image
                  src={room.image}
                  alt={room.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{room.name}</h2>
                <p className="text-3xl font-bold text-blue-600 mb-4">{room.price} <span className="text-lg text-gray-600">/nuit</span></p>

                <p className="text-gray-700 mb-4">{room.capacity}</p>

                <ul className="space-y-2 mb-6">
                  {room.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <span className="text-blue-600 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/reservation"
                  className="block text-center px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réserver
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Équipements Standard</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {['WiFi Gratuit', 'Climatisation', 'Télévision', 'Minibar', 'Coffre-fort', 'Sèche-cheveux', 'Toilettes de luxe', 'Service d\'étage'].map((item, idx) => (
              <div key={idx} className="text-gray-700">
                <span className="text-2xl">✓</span>
                <p className="mt-2">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
