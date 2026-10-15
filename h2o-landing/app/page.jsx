import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import HostBadge from '@/components/HostBadge'
import Duplexes from '@/components/Duplexes'
import Events from '@/components/Events'
import Gallery from '@/components/Gallery'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import BookingWidget from '@/components/BookingWidget'

export default function Home() {
  return (
    <>
      <Nav />
      <BookingWidget />
      <main>
        <Hero />
        <HostBadge />
        <Duplexes />
        <Events />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
