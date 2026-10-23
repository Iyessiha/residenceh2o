import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ImageGallery from '@/components/ImageGallery'
import { getPhotos } from '@/lib/data'

export const revalidate = 300

export const metadata = {
  title: 'Galerie Photos | Les Résidences H₂O',
  description: 'Découvrez les Résidences H₂O en images : villas, piscines privées et espace événementiel à Villa Poton.',
}

export default async function GalleryPage() {
  const images = await getPhotos()

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section
          className="text-white pt-32 pb-16 sm:pt-40 sm:pb-24"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dk) 100%)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Galerie Photos</h1>
            <p className="text-xl text-white/90">Découvrez les villas, les piscines privées et le cadre au bord du lac des Résidences H₂O</p>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ImageGallery images={images} />
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 rounded-lg p-8 sm:p-12 text-center" style={{ backgroundColor: 'var(--primary-lt)' }}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              Prêt à venir ?
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-2)' }}>
              Choisissez votre villa et réservez votre séjour à Villa Poton
            </p>
            <a
              href="/#contact"
              className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-all hover:bg-[var(--primary-dk)]"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Réserver un duplex
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
