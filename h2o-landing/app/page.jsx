import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import HostBadge from '@/components/HostBadge'
import Duplexes from '@/components/Duplexes'
import Events from '@/components/Events'
import FeaturedGallery from '@/components/FeaturedGallery'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import BookingWidget from '@/components/BookingWidget'
import { Star } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Nav />
      <BookingWidget />
      <main>
        <Hero />
        <HostBadge />
        <Duplexes />
        <Events />

        {/* Featured Gallery Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Galerie Photos - 145 Images Professionnelles</h2>
              <p className="text-xl text-gray-600">Explorez la beauté de Residence H2O</p>
            </div>
            <FeaturedGallery />
            <div className="text-center mt-8">
              <Link
                href="/gallery"
                className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir la Galerie Complète (145 photos)
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
              <p className="text-xl text-gray-600">5★ Avis clients satisfaits</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
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
              ].map((testimonial, idx) => (
                <div key={idx} className="bg-gray-50 p-8 rounded-lg shadow-lg">
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

        {/* Blog Preview */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Blog - 20 Articles SEO</h2>
              <p className="text-xl text-gray-600">Conseils de voyage et guides destination</p>
            </div>
            <div className="text-center">
              <Link
                href="/blog"
                className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Découvrir Notre Blog
              </Link>
            </div>
          </div>
        </section>

        <Contact />
      </main>
      <Footer />
    </>
  )
}
