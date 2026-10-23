import Link from 'next/link'
import FooterInstallButton from './FooterInstallButton'

const LIEN = 'inline-block py-1 hover:text-white transition-colors'
const TITRE = 'text-white text-xs font-bold uppercase tracking-[0.18em] mb-4'

export default function Footer() {
  return (
    <footer className="bg-[#0C3A3D] text-white/60 pt-10 pb-6 sm:pt-14 sm:pb-8">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8 pb-10 border-b border-white/10">

          {/* Adresse */}
          <div>
            <p className="font-serif text-white text-xl font-bold mb-3">Les Résidences H₂O</p>
            <p className="text-sm leading-relaxed">
              Villa Poton<br />
              Ancienne route de Bassam, au lac<br />
              Côte d'Ivoire
            </p>
            <p className="text-sm mt-3 leading-relaxed">
              À 10 min de la plage · 30 min de l'aéroport et d'Abidjan
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className={TITRE}>Contact</p>
            <div className="flex flex-col text-sm">
              <a href="tel:+2250749194952" className={LIEN}>+225 07 49 19 49 52</a>
              <a href="https://wa.me/2250705259234" target="_blank" rel="noopener noreferrer" className={LIEN}>
                WhatsApp · 07 05 25 92 34
              </a>
              <a href="mailto:contact@residencesh2o.com" className={`${LIEN} break-all`}>contact@residencesh2o.com</a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className={TITRE}>Navigation</p>
            <div className="grid grid-cols-2 gap-x-6 text-sm">
              <Link href="/residences" className={LIEN}>Villas</Link>
              <Link href="/chambres" className={LIEN}>Chambres</Link>
              <Link href="/restaurant" className={LIEN}>Restaurant & bar</Link>
              <Link href="/services" className={LIEN}>Services</Link>
              <Link href="/#evenements" className={LIEN}>Événements</Link>
              <Link href="/gallery" className={LIEN}>Galerie</Link>
              <Link href="/#contact" className={LIEN}>Réserver</Link>
              <Link href="/faq" className={LIEN}>FAQ</Link>
            </div>
          </div>

          {/* Informations */}
          <div>
            <p className={TITRE}>Informations</p>
            <div className="flex flex-col text-sm">
              <Link href="/about" className={LIEN}>À propos</Link>
              <Link href="/mentions-legales" className={LIEN}>Mentions légales</Link>
              <Link href="/politique-confidentialite" className={LIEN}>Politique de confidentialité</Link>
              <Link href="/cgu" className={LIEN}>{"Conditions d'utilisation"}</Link>
            </div>
          </div>

        </div>

        {/* Barre du bas */}
        <div className="pt-6 flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-4 text-xs text-center sm:text-left">
          <p>© {new Date().getFullYear()} Les Résidences H₂O — Tous droits réservés</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <p className="opacity-50">Site réalisé par MonWe Infinity LLC</p>
            <FooterInstallButton />
          </div>
        </div>
      </div>
    </footer>
  )
}
