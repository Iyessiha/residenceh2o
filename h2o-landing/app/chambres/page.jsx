import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Chambres from '@/components/Chambres'
import { getChambres } from '@/lib/data'

export const metadata = {
  title: 'Chambres à la nuit | Les Résidences H₂O',
  description: 'Toutes les chambres des Résidences H₂O à Villa Poton : VVIP, VIP, standard et non autonomes, à la nuit ou à la journée, petit déjeuner inclus.',
}

export const revalidate = 300

export default async function ChambresPage() {
  const chambres = await getChambres()

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white pt-24">
        <Chambres chambres={chambres} />
      </main>
      <Footer />
    </>
  )
}
