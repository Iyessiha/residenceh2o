import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: 'H2O Manager — Résidences H2O',
  description: 'Logiciel de gestion hôtelière — Les Résidences H2O',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className={jakarta.className}>{children}</body>
    </html>
  )
}
