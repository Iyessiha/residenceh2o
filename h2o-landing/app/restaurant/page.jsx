import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { formatFCFA } from '@/lib/residences'
import { getMenu } from '@/lib/data'
import { MENU_FALLBACK, SECTIONS_RESTAURANT, INFRASTRUCTURES_RESTAURANT } from '@/lib/restaurant'

export const metadata = {
  title: 'Restaurant & Bar | Les Résidences H₂O',
  description: 'Restaurant et bar des Résidences H₂O à Villa Poton : petit déjeuner inclus, volailles, poissons, boissons et accès à la grande piscine.',
}

export const revalidate = 300

// Regroupe les plats par section, dans l'ordre de la fiche. Les sections inconnues vont à la fin.
function grouperParSection(plats) {
  const groupes = SECTIONS_RESTAURANT.map(({ section, note }) => ({
    section,
    note,
    plats: plats.filter((p) => p.section === section),
  }))
  const connues = new Set(SECTIONS_RESTAURANT.map((s) => s.section))
  const autres = plats.filter((p) => !connues.has(p.section))
  if (autres.length) groupes.push({ section: 'Autres', note: null, plats: autres })
  return groupes.filter((g) => g.plats.length > 0)
}

function libellePrix(plat) {
  if (plat.prix_libelle) return plat.prix_libelle
  return plat.prix ? formatFCFA(plat.prix) : '—'
}

export default async function RestaurantPage() {
  const menu = (await getMenu()) ?? MENU_FALLBACK
  const groupes = grouperParSection(menu)

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
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Restaurant & Bar</h1>
            <p className="text-xl text-white/90">Petit déjeuner inclus dans votre séjour, carte de volailles, poissons et boissons</p>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Infrastructures */}
            <div className="flex flex-wrap gap-3 mb-14">
              {INFRASTRUCTURES_RESTAURANT.map((item) => (
                <span key={item} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full">
                  {item}
                </span>
              ))}
            </div>

            {/* Carte */}
            {groupes.map((groupe) => (
              <div key={groupe.section} className="mb-14">
                <h2 className="text-2xl font-bold text-gray-900 border-b-2 pb-3 mb-2" style={{ borderColor: 'var(--h2o-lagune)' }}>
                  {groupe.section}
                </h2>
                {groupe.note && <p className="text-sm text-gray-500 italic mb-4">{groupe.note}</p>}
                <ul className="divide-y divide-gray-100">
                  {groupe.plats.map((plat) => (
                    <li key={`${groupe.section}-${plat.nom}`} className="flex items-start justify-between gap-6 py-3">
                      <div>
                        <p className="text-gray-900">{plat.nom}</p>
                        {plat.description && <p className="text-sm text-gray-500">{plat.description}</p>}
                      </div>
                      <p className="font-bold whitespace-nowrap" style={{ color: 'var(--h2o-lagune)' }}>
                        {libellePrix(plat)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <p className="rounded-xl bg-gray-50 border border-gray-200 px-5 py-4 text-sm text-gray-600 mb-14">
              Le client peut faire une demande de plat spécial, à prévenir en avance.
            </p>

            {/* CTA */}
            <div className="rounded-lg p-8 sm:p-12 text-center" style={{ backgroundColor: 'var(--primary-lt)' }}>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                Une commande ou une réservation de table ?
              </h2>
              <p className="text-lg mb-8" style={{ color: 'var(--text-2)' }}>
                Écrivez-nous sur WhatsApp pour vos plats spéciaux et l'accès à la piscine.
              </p>
              <Link
                href="/#contact"
                className="inline-block px-8 py-3 text-white font-bold rounded-lg transition-all"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
