// Plateformes de réservation partenaires, affichées sur les pages principales.
export default function Partenaires() {
  return (
    <section className="py-10 bg-white border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-6">
          Nos partenaires de réservation
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/partenaires/airbnb.webp" alt="Airbnb" className="h-10 w-auto object-contain" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/partenaires/booking.png" alt="Booking.com" className="h-9 w-auto object-contain" loading="lazy" />
        </div>
      </div>
    </section>
  )
}
