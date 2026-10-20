import Link from 'next/link'
import FooterInstallButton from './FooterInstallButton'

export default function Footer() {
  return (
    <footer className="bg-[#0C3A3D] text-white/60 py-8 sm:py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <p className="font-serif text-white text-lg font-bold mb-2">Les Résidences H₂O</p>
            <p className="text-sm leading-relaxed">
              Route de Grand-Bassam<br />
              Modeste Beach, Côte d'Ivoire
            </p>
            <p className="text-sm mt-3">
              À 10 min de la plage · 30 min de l'aéroport et d'Abidjan
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">Contact</p>
            <div className="flex flex-col gap-1.5 text-sm">
              <a href="tel:+2250749194952" className="hover:text-white transition-colors">+225 07 49 19 49 52</a>
              <a href="mailto:contact@residencesh2o.com" className="hover:text-white transition-colors">contact@residencesh2o.com</a>
              <a
                href="https://wa.me/2250749194952"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">Navigation</p>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href="/residences" className="hover:text-white transition-colors">Duplexes</Link>
              <Link href="/#chambres" className="hover:text-white transition-colors">Chambres</Link>
              <Link href="/services" className="hover:text-white transition-colors">Services</Link>
              <Link href="/#evenements" className="hover:text-white transition-colors">Événements</Link>
              <Link href="/gallery" className="hover:text-white transition-colors">Galerie</Link>
              <Link href="/#contact" className="hover:text-white transition-colors">Réserver</Link>
            </div>
          </div>

          {/* Légal */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">Informations légales</p>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link>
              <Link href="/cgu" className="hover:text-white transition-colors">{"Conditions d'utilisation"}</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/about" className="hover:text-white transition-colors">À propos</Link>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© {new Date().getFullYear()} Les Résidences H₂O — Tous droits réservés</span>
          <div className="flex items-center gap-4">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <span className="opacity-30">·</span>
            <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            <span className="opacity-30">·</span>
            <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
            <span className="opacity-30">·</span>
            <span className="opacity-40">Site réalisé par MonWe Infinity LLC</span>
            <span className="opacity-30">·</span>
            <FooterInstallButton />
          </div>
        </div>
      </div>
    </footer>
  )
}
