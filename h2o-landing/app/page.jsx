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
        <section className="py-20" style={{ backgroundColor: 'var(--bg-2)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>Galerie Photos - 145 Images Professionnelles</h2>
              <p className="text-xl" style={{ color: 'var(--text-3)' }}>Explorez la beauté de Residence H2O</p>
            </div>
            <FeaturedGallery />
            <div className="text-center mt-8">
              <Link
                href="/gallery"
                className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-dk)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
              >
                Voir la Galerie Complète (145 photos)
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>Ce que disent nos clients</h2>
              <p className="text-xl" style={{ color: 'var(--text-3)' }}>5★ Avis clients satisfaits</p>
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
                <div key={idx} className="p-8 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--bg-2)' }}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-6 italic" style={{ color: 'var(--text-2)' }}>"{testimonial.text}"</p>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text)' }}>{testimonial.author}</p>
                    <p className="text-sm" style={{ color: 'var(--text-3)' }}>{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Preview */}
        <section className="py-20" style={{ backgroundColor: 'var(--bg-2)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>Blog - 20 Articles SEO</h2>
              <p className="text-xl" style={{ color: 'var(--text-3)' }}>Conseils de voyage et guides destination</p>
            </div>
            <div className="text-center">
              <Link
                href="/blog"
                className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-dk)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
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
