// Projet Supabase « Résidences H2O ».
// L'URL et la clé anon sont publiques par conception (elles sont envoyées au
// navigateur) : la sécurité repose sur les politiques RLS. Les variables
// d'environnement Vercel, si définies, restent prioritaires.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dcalrmjftnfrfyjwhrgb.supabase.co'

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYWxybWpmdG5mcmZ5andocmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzYwMTAsImV4cCI6MjEwNjQ1MjAxMH0.tO6UzBruw5Z_cJOsStNAHoTYsfNEP4T9elckIAQp49I'
