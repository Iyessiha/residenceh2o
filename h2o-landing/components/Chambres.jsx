import Link from 'next/link'
import Image from 'next/image'
import { Check, Users, ArrowRight, Star, Crown, BedDouble } from 'lucide-react'
import { formatFCFA, EQUIPEMENTS_CHAMBRE } from '@/lib/residences'

// Ordre d'affichage et libellés des catégories (fiche « Types de chambres et lits »)
const CATEGORIES = [
  { type: 'vvip', titre: 'Chambres VVIP', icone: Crown, style: 'amber' },
  { type: 'vip', titre: 'Chambres VIP', icone: Crown, style: 'amber' },
  { type: 'standard', titre: 'Chambres Standard', icone: Star, style: 'slate' },
  { type: 'non_autonome', titre: 'Chambres non autonomes', icone: BedDouble, style: 'slate' },
]

export default function Chambres({ chambres }) {
  if (!chambres || chambres.length === 0) return null

  const minimum = Math.min(...chambres.map((c) => c.tarif_nuit))

  return (
    <section id="chambres" className="py-24 bg-white text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60 inline-block mb-3">
            Chambres à la nuit
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Vous n'avez pas besoin de la villa entière
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Louez une chambre seule à partir de <strong>{formatFCFA(minimum)} / nuit</strong>, petit déjeuner inclus, ou optez pour une chambre VVIP.
          </p>
        </div>

        {/* Légende des tarifs */}
        <div className="flex items-center justify-center gap-4 mb-14 flex-wrap">
          {CATEGORIES.filter((cat) => chambres.some((c) => c.type === cat.type)).map((cat) => (
            <span
              key={cat.type}
              className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border ${
                cat.style === 'amber'
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-slate-700 bg-slate-100 border-slate-200'
              }`}
            >
              <cat.icone className={`w-4 h-4 ${cat.style === 'amber' ? 'text-amber-600' : 'text-slate-500'}`} />
              {cat.titre}
            </span>
          ))}
        </div>

        {CATEGORIES.map((cat) => {
          const liste = chambres.filter((c) => c.type === cat.type)
          if (liste.length === 0) return null
          const Icone = cat.icone

          return (
            <div key={cat.type} className="mb-14 last:mb-0">
              <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${cat.style === 'amber' ? 'text-amber-800' : 'text-slate-700'}`}>
                <Icone className={`w-5 h-5 ${cat.style === 'amber' ? 'text-amber-600' : 'text-slate-400'}`} />
                {cat.titre}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {liste.map((c) => (
                  <ChambreCard key={c.nom} chambre={c} variant={cat.style === 'amber' ? 'vip' : 'standard'} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Notes de la fiche */}
        <div className="mt-14 grid gap-3 max-w-3xl mx-auto text-sm text-slate-600">
          <p className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
            Chaque chambre accueille 2 personnes maximum. Équipements standard : {EQUIPEMENTS_CHAMBRE.join(', ')}. Une chambre principale a vue sur le lac.
          </p>
          <p className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-3">
            Tarifs par nuit avec petit déjeuner, ou à la journée pour chaque catégorie.
          </p>
        </div>

        {/* CTA bottom */}
        <div className="mt-14 text-center">
          <p className="text-slate-500 text-sm mb-5">
            Disponibilités et tarifs confirmés par notre équipe dans les 24 h.
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-teal-600 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
          >
            <span>Demander une chambre</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function ChambreCard({ chambre, variant }) {
  const isVip = variant === 'vip'
  const occupied = chambre.statut === 'occupee'
  const titre = chambre.nom.replace(` · ${chambre.duplex_nom}`, '')

  return (
    <div className={`rounded-3xl overflow-hidden border flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
      isVip
        ? 'border-amber-200 bg-gradient-to-b from-amber-50/60 to-white shadow-amber-100 shadow-md'
        : 'border-slate-200/70 bg-white shadow-sm'
    }`}>

      {/* Photo */}
      {chambre.photos?.[0] && (
        <div className="relative h-44 w-full bg-slate-100">
          <Image src={chambre.photos[0]} alt={titre} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
        </div>
      )}

      {/* Top band */}
      <div className={`px-5 py-4 flex items-center justify-between ${
        isVip ? 'bg-gradient-to-r from-amber-700 to-amber-500' : 'bg-slate-900'
      }`}>
        <div>
          <p className="text-white font-bold text-sm leading-tight">{titre}</p>
          <p className="text-white/60 text-xs mt-0.5">{chambre.duplex_nom}</p>
        </div>
        {isVip
          ? <Crown className="w-5 h-5 text-amber-200 flex-shrink-0" />
          : <Star className="w-4 h-4 text-white/50 flex-shrink-0" />
        }
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        {chambre.description && (
          <p className="text-slate-500 text-xs leading-relaxed mb-4">{chambre.description}</p>
        )}

        {/* Features */}
        {chambre.features && chambre.features.length > 0 && (
          <ul className="space-y-2 mb-5 flex-1">
            {chambre.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-slate-700">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isVip ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                }`}>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
              <Users className="w-3 h-3" />
              {chambre.capacite} pers. max
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-bold ${isVip ? 'text-amber-800' : 'text-slate-900'}`}>
                {formatFCFA(chambre.tarif_nuit)}
              </span>
              <span className="text-xs text-slate-400">/ nuit</span>
            </div>
            {chambre.tarif_journee > 0 && (
              <span className="block text-[11px] text-slate-500">
                Journée : {formatFCFA(chambre.tarif_journee)}
              </span>
            )}
          </div>

          {occupied ? (
            <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
              Occupée
            </span>
          ) : (
            <Link
              href="/#contact"
              className={`inline-flex items-center gap-1 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow hover:shadow-md ${
                isVip
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-900 hover:bg-teal-600 text-white'
              }`}
            >
              <span>Réserver</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
