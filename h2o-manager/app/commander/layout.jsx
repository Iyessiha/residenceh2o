// Page publique : le client y arrive en scannant le QR code de sa table (ou du restaurant)
export const metadata = {
  title: 'Commander — Restaurant & Bar — Les Résidences H₂O',
  description: 'Choisissez vos plats et boissons, nous vous les servons.',
  robots: { index: false, follow: false },
}

export default function CommanderLayout({ children }) {
  return <>{children}</>
}
