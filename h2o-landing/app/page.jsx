import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Duplexes from '@/components/Duplexes'
import Events from '@/components/Events'
import Gallery from '@/components/Gallery'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Duplexes />
        <Events />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
