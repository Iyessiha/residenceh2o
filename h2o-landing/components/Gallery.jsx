// Remplacer les placeholders par de vraies photos dans les src
const PHOTOS = [
  { id: 1, label: 'Piscine privée duplex D-1', aspect: 'aspect-video' },
  { id: 2, label: 'Vue depuis le pontoon', aspect: 'aspect-square' },
  { id: 3, label: 'Intérieur duplex — salon', aspect: 'aspect-square' },
  { id: 4, label: 'Pergola événementielle', aspect: 'aspect-video' },
  { id: 5, label: 'Chambre vue lac', aspect: 'aspect-video' },
  { id: 6, label: 'Coucher de soleil sur le lac', aspect: 'aspect-square' },
]

export default function Gallery() {
  return (
    <section id="galerie" className="py-20 bg-sand">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="section-label">Galerie</span>
          <h2 className="font-serif text-4xl font-bold text-teal-900 mt-3">
            Découvrez les Résidences H2O
          </h2>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PHOTOS.map((photo) => (
            <div
              key={photo.id}
              className="rounded-xl overflow-hidden bg-gradient-to-br from-teal-700 to-teal-500 flex items-center justify-center group cursor-pointer"
              style={{ minHeight: photo.aspect === 'aspect-video' ? '180px' : '200px' }}
            >
              {/* Placeholder — remplacer par <Image src={photo.src} alt={photo.label} fill className="object-cover" /> */}
              <div className="text-center p-4 opacity-60 group-hover:opacity-80 transition-opacity">
                <span className="text-4xl">📸</span>
                <p className="text-white text-xs mt-2">{photo.label}</p>
                <p className="text-white/50 text-xs mt-1">À remplacer par vraie photo</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Photos réelles à intégrer avant la mise en ligne — voir checklist de livraison
        </p>
      </div>
    </section>
  )
}
