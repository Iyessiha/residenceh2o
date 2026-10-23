/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Les hébergements sont les deux villas (Villa 1, Villa 2) et les chambres à la nuit.
    return [
      { source: '/rooms', destination: '/residences', permanent: true },
      // Anciennes adresses des duplex (avant la fiche « Villa 1 / Villa 2 »)
      { source: '/residences/deluxe', destination: '/residences/villa-1', permanent: true },
      { source: '/residences/jardin', destination: '/residences/villa-2', permanent: true },
      { source: '/residences/presidential', destination: '/residences', permanent: true },
      { source: '/residences/duplex-lac', destination: '/residences/villa-1', permanent: true },
      { source: '/residences/duplex-jardin', destination: '/residences/villa-2', permanent: true },
      { source: '/residences/duplex-signature', destination: '/residences', permanent: true },
    ]
  },
  images: {
    domains: ['images.unsplash.com'],
    // Photos téléversées depuis le manager (Supabase Storage, bucket « galerie »)
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  },
}
export default nextConfig
