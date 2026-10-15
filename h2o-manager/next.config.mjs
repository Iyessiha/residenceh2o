/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer contient du code Node.js natif — ne pas bundler côté client
  serverExternalPackages: ['@react-pdf/renderer'],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  },
}
export default nextConfig
