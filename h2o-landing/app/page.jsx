import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import HostBadge from '@/components/HostBadge'
import Duplexes from '@/components/Duplexes'
import Events from '@/components/Events'
import FeaturedGallery from '@/components/FeaturedGallery'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import BookingWidget from '@/components/BookingWidget'
import Chambres from '@/components/Chambres'
import { Star, ArrowRight, Quote, Shield, Compass, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getDuplexes, getPhotos, getChambres } from '@/lib/data'

export const revalidate = 300

export default async function Home() {
  const [duplexes, photos, chambres] = await Promise.all([getDuplexes(), getPhotos(), getChambres()])

  return (
    <>
      <Nav />
      <BookingWidget duplexes={duplexes} />
      <main className="bg-[#FAF8F5]">
        <Hero />
        <HostBadge />
        <Duplexes duplexes={duplexes} />
        <Chambres chambres={chambres} />
        <Events />

        {/* Featured Gallery Section */}
        <section className="py-24 bg-white" id="galerie">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200/60 inline-block mb-3">
                  Immersion Visuelle
                </span>
                <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                  L'art de vivre au fil de l'eau
                </h2>
                <p className="text-slate-600 text-base sm:text-lg mt-3 max-w-xl">
                  Chaque détail a été pensé pour allier sérénité, confort haut de gamme et vue spectaculaire sur la lagune.
                </p>
              </div>

              <div className="mt-6 md:mt-0">
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-2 px-6 py-3 text-slate-900 hover:text-teal-600 font-semibold text-sm border border-slate-300 rounded-xl hover:border-teal-500 transition-all group"
                >
                  <span>Explorer toute la collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <FeaturedGallery photos={photos.slice(0, 6)} />
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-[#FAF8F5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200/60 inline-block mb-3">
                Expériences Partagées
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                Ce que nos hôtes ont ressenti
              </h2>
              <div className="flex items-center justify-center gap-2 text-amber-500 mt-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-800 ml-1">4.9 / 5</span>
                <span className="text-xs text-slate-500">(Séjours vérifiés)</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  text: "Avoir sa propre piscine face à la lagune sans aucun regard indiscret est un luxe rare, à 10 minutes de la plage et à 30 minutes d'Abidjan. Le pontoon au coucher du soleil est magique.",
                  author: "Dr. Stéphane Kouassi",
                  role: "Week-end en amoureux",
                  date: "Séjour en Octobre 2026"
                },
                {
                  text: "Nous avons célébré les 30 ans de ma femme sous la pergola. L'organisation, le traiteur et l'hébergement de notre famille dans les duplex étaient tout simplement parfaits.",
                  author: "Aïcha & Patrick Diallo",
                  role: "Événement privé",
                  date: "Séjour en Septembre 2026"
                },
                {
                  text: "Calme absolu, literie d'hôtel 5 étoiles, propreté irréprochable et un service de conciergerie très réactif sur WhatsApp. Notre nouveau havre de paix régulier.",
                  author: "Marc-Antoine de S.",
                  role: "Séjour détente & business",
                  date: "Séjour en Août 2026"
                }
              ].map((testimonial, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-white border border-slate-200/70 shadow-sm hover:shadow-xl transition-all relative flex flex-col justify-between"
                >
                  <Quote className="w-10 h-10 text-teal-500/20 mb-4" />
                  <p className="mb-6 text-slate-700 text-sm leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">{testimonial.author}</p>
                    <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                      <span>{testimonial.role}</span>
                      <span className="text-teal-600 font-medium">{testimonial.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Invitation & Lifestyle Banner */}
        <section className="py-20 bg-gradient-to-r from-[#0B1721] to-[#122838] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-teal-400 font-mono text-xs uppercase tracking-widest block mb-3">
              ✦ Évasion & Ressourcement ✦
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold mb-6 tracking-tight">
              Prêt pour votre parenthèse lagunaire ?
            </h2>
            <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Que ce soit pour un week-end romantique, des vacances en famille ou une réception d'exception, Les Résidences H₂O vous ouvrent leurs portes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#contact"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-sm px-8 py-4 rounded-xl shadow-xl shadow-teal-900/40 transition-all hover:-translate-y-0.5"
              >
                Planifier une réservation
              </a>
              <Link
                href="/faq"
                className="bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-6 py-4 rounded-xl border border-white/20 transition-all"
              >
                Consulter la FAQ
              </Link>
            </div>
          </div>
        </section>

        <Contact duplexes={duplexes} />
      </main>
      <Footer />
    </>
  )
}
