import { ShieldCheck, Award, KeyRound } from 'lucide-react'

const BADGES = [
  {
    icon: ShieldCheck,
    label: 'Etablissement verifie',
    desc: 'Residence privee securisee 24h/24 avec caméras, agent de sécurité et groupe électrogène',
  },
  {
    icon: Award,
    label: 'Villa ou chambre seule',
    desc: "Louez la villa duplex entière avec piscine privée, ou une chambre à la nuit dès 40 000 FCFA",
  },
  {
    icon: KeyRound,
    label: 'Accueil personnalise',
    desc: "Conciergerie dediee et flexibilite des horaires d'arrivee",
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
