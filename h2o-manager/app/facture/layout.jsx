// Page publique : le client y arrive en scannant le QR code de sa facture
export const metadata = {
  title: 'Votre facture — Les Résidences H₂O',
  description: 'Consultez, téléchargez ou imprimez votre facture.',
  robots: { index: false, follow: false },
}

export default function FactureLayout({ children }) {
  return <>{children}</>
}
