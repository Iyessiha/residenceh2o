import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import InstallPWA from '@/components/InstallPWA'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: 'H2O Manager — Résidences H2O',
  description: 'Logiciel de gestion hôtelière — Les Résidences H2O',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'H2O Manager' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport = {
  themeColor: '#0C3A3D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="H2O Manager" />
      </head>
      <body className={jakarta.className}>
        {children}
        <InstallPWA />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
          }
        ` }} />
      </body>
    </html>
  )
}
