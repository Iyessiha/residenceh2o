/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'pdfkit', 'qrcode-generator'],
  },
  // pdfkit charge ses polices standard dynamiquement — les inclure dans le bundle Vercel
  outputFileTracingIncludes: {
    // Route dynamique /api/factures/[id]/pdf : le glob couvre le segment [id]
    '/api/factures/**': [
      './node_modules/pdfkit/js/standard-fonts/**/*',
      './node_modules/pdfkit/js/font/**/*',
      './public/logo-facture.png',
    ],
  },
  async redirects() {
    return [{ source: '/dashboard/balises', destination: '/dashboard/parametres', permanent: false }]
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  },
}
export default nextConfig
