'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

// Rôle de l'utilisateur connecté (table profiles) : undefined = chargement, null = aucun rôle
export function useRole() {
  const [role, setRole] = useState(undefined)
  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { setRole(null); return }
      const { data: profil } = await sb.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
      setRole(profil?.role || null)
    })
  }, [])
  return role
}

// Personnel, paie et trésorerie : réservés à l'admin et à la gérance
export const estGestion = (role) => role === 'admin' || role === 'gerance'
