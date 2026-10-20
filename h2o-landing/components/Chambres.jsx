import Link from 'next/link'
import { Check, Users, ArrowRight, Star, Crown } from 'lucide-react'
import { formatFCFA } from '@/lib/residences'

export default function Chambres({ chambres }) {
  if (!chambres || chambres.length === 0) return null

  const standards = chambres.filter((c) => c.type === 'standard')
  const vip       = chambres.filter((c) => c.type === 'vip')

  return (
    <section id="chambres" className="py-24 bg-white text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60 inline-block mb-3">
            Chambres à la nuit
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Vous n'avez pas besoin du duplex entier
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Louez une chambre seule — standard dès <strong>60 000 FCFA / nuit</strong> ou optez pour une suite VIP avec jacuzzi et vue lagune.
          </p>
        </div>

        {/* Type tabs indicator */}
        <div className="flex items-center justify-center gap-4 mb-14 flex-wrap">
          {standards.length > 0 && (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              <Star className="w-4 h-4 text-slate-500" />
              Chambre Standard — dès {formatFCFA(60000)} / nuit
            </span>
          )}
          {vip.length > 0 && (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
              <Crown className="w-4 h-4 text-amber-600" />
              Suite VIP — expérience prestige
            </span>
          )}
        </div>

        {/* Standard rooms */}
        {standards.length > 0 && (
          <>
            <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-slate-400" />
              Chambres Standard
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
              {standards.map((c, i) => (
                <ChambreCard key={i} chambre={c} variant="standard" />
              ))}
            </div>
          </>
        )}

        {/* VIP rooms */}
        {vip.length > 0 && (
          <>
            <h3 className="text-lg font-bold text-amber-800 mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Suites VIP
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vip.map((c, i) => (
                <ChambreCard key={i} chambre={c} variant="vip" />
              ))}
            </div>
          </>
        )}

        {/* CTA bottom */}
        <div className="mt-14 text-center">
          <p className="text-slate-500 text-sm mb-5">
            Disponibilités et tarifs confirmés par notre équipe dans les 24 h.
          </p>
          <Link
            href="#contact"
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

function ChambreCard({ chambre, variant }) {
  const isVip = variant === 'vip'
  const occupied = chambre.statut === 'occupee'

  return (
    <div className={`rounded-3xl overflow-hidden border flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
      isVip
        ? 'border-amber-200 bg-gradient-to-b from-amber-50/60 to-white shadow-amber-100 shadow-md'
        : 'border-slate-200/70 bg-white shadow-sm'
    }`}>

      {/* Top band */}
      <div className={`px-5 py-4 flex items-center justify-between ${
        isVip ? 'bg-gradient-to-r from-amber-700 to-amber-500' : 'bg-slate-900'
      }`}>
        <div>
          <p className="text-white font-bold text-sm leading-tight">{chambre.nom}</p>
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
            {chambre.features.slice(0, 5).map((f) => (
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
              {chambre.capacite} pers.
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-bold ${isVip ? 'text-amber-800' : 'text-slate-900'}`}>
                {formatFCFA(chambre.tarif_nuit)}
              </span>
              <span className="text-xs text-slate-400">/ nuit</span>
            </div>
          </div>

          {occupied ? (
            <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
              Occupée
            </span>
          ) : (
            <Link
              href="#contact"
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
