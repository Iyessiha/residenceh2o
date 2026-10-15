const BADGES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Hôte vérifié',
    desc: 'Identité et établissement confirmés',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Coup de cœur voyageurs',
    desc: 'Parmi les logements les mieux notés',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Arrivée autonome',
    desc: 'Accès flexible à votre convenance',
  },
]

export default function HostBadge() {
  return (
    <section className="py-14 bg-white border-b" style={{ borderColor: 'var(--border-2)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Bloc hôte */}
        <div className="flex items-center gap-5 pb-8 mb-8 border-b" style={{ borderColor: 'var(--border-2)' }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1A0A04, #E8513A)' }}
            aria-label="Avatar de Giselle"
          >
            G
          </div>
          <div>
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
              Duplex en résidence de luxe géré par <span style={{ color: 'var(--primary)' }}>Giselle</span>
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              4 voyageurs · 1 duplex · 2 chambres · 2 salles de bain
            </p>
          </div>
        </div>

        {/* Badges réassurance */}
        <div className="grid sm:grid-cols-3 gap-6">
          {BADGES.map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4">
              <span style={{ color: 'var(--primary)' }}>{icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{label}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
