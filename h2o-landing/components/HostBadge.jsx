import { ShieldCheck, Award, KeyRound, BedDouble } from ‘lucide-react’

const BADGES = [
  {
    icon: ShieldCheck,
    label: ‘Établissement vérifié’,
    desc: ‘Résidence privée sécurisée 24h/24 avec gardiennage et parking’,
  },
  {
    icon: Award,
    label: ‘Duplex ou chambre seule’,
    desc: ‘Louez le duplex entier avec piscine privée, ou uniquement une chambre à la nuit dès 60 000 FCFA’,
  },
  {
    icon: KeyRound,
    label: ‘Accueil personnalisé’,
    desc: ‘Conciergerie dédiée et flexibilité des horaires d’arrivée’,
  },
]

export default function HostBadge() {
  return (
    <section className="py-12 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {BADGES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                <Icon className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div>
                <p className="font-serif font-bold text-base text-slate-900">{label}</p>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
