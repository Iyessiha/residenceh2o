import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatFCFA } from '@/lib/residences'
import { ChambreCard } from './Chambres'

// Une chambre par catégorie, affichées sur l'accueil. Le catalogue complet est sur /chambres.
const APERCU = ['vvip', 'vip', 'standard']

export default function ChambresApercu({ chambres }) {
  if (!chambres || chambres.length === 0) return null

  const selection = APERCU.map((type) => chambres.find((c) => c.type === type)).filter(Boolean)
  const minimum = Math.min(...chambres.map((c) => c.tarif_nuit))

  return (
    <section id="chambres" className="py-24 bg-white text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60 inline-block mb-3">
            Chambres à la nuit
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Vous n'avez pas besoin de la villa entière
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Louez une chambre seule à partir de <strong>{formatFCFA(minimum)} / nuit</strong>, petit déjeuner inclus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {selection.map((c) => (
            <ChambreCard key={c.nom} chambre={c} variant={c.type === 'vvip' || c.type === 'vip' ? 'vip' : 'standard'} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/chambres"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-teal-600 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
          >
            <span>Voir toutes les chambres ({chambres.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
