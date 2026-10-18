import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ImageGallery from '@/components/ImageGallery'

export const metadata = {
  title: 'Galerie Photos | Residence H2O',
  description: 'Explorez notre belle collection de 145 photos de la résidence et des équipements',
}

export default function GalleryPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section
          className="text-white py-16 sm:py-24"
          style={{ backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dk) 100%)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Galerie Photos</h1>
            <p className="text-xl text-white/90">Découvrez la beauté de Residence H2O - 145 images professionnelles</p>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ImageGallery />
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 rounded-lg p-8 sm:p-12 text-center" style={{ backgroundColor: 'var(--primary-lt)' }}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              Prêt à visiter ?
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-2)' }}>
              Découvrez nos résidences en personne ou réservez dès maintenant
            </p>
            <a
              href="#contact"
              className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-all"
              style={{ backgroundColor: 'var(--primary)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--primary-dk)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
            >
              Réserver une Visite
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
