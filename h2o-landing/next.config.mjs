/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // « Chambres » n'existe plus : les hébergements sont les trois duplexes.
    return [
      { source: '/rooms', destination: '/residences', permanent: true },
      // Anciennes adresses des duplex (avant l'alignement sur le manager)
      { source: '/residences/deluxe', destination: '/residences/duplex-lac', permanent: true },
      { source: '/residences/jardin', destination: '/residences/duplex-jardin', permanent: true },
      { source: '/residences/presidential', destination: '/residences/duplex-signature', permanent: true },
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
