export default function Footer() {
  return (
    <footer className="bg-teal-950 text-white/60 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <p className="font-serif text-white text-lg font-bold mb-2">Les Résidences H2O</p>
            <p className="text-sm">Route de Grand-Bassam<br />Modeste Beach, Côte d'Ivoire</p>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-2">Contact</p>
            <p className="text-sm">Tél : +225 07 XX XX XX XX</p>
            <p className="text-sm">contact@residencesh2o.com</p>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-2">Navigation</p>
            <div className="flex flex-col gap-1 text-sm">
              <a href="#sejours" className="hover:text-white transition-colors">Séjours</a>
              <a href="#evenements" className="hover:text-white transition-colors">Événements</a>
              <a href="#galerie" className="hover:text-white transition-colors">Galerie</a>
              <a href="#contact" className="hover:text-white transition-colors">Réserver</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-xs">
          © {new Date().getFullYear()} Les Résidences H2O — Tous droits réservés ·{' '}
          <span className="opacity-50">Site réalisé par MonWe Infinity LLC</span>
        </div>
      </div>
    </footer>
  )
}
