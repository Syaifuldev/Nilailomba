'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser, Profile } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser({
      id: authUser.id,
      email: authUser.email ?? null,
      profile: profile as Profile | null,
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setLoading(false)
        } else {
          await fetchUser()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUser, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = user?.profile?.role === 'admin'
  const isJuri = user?.profile?.role === 'juri'
  const isOperator = user?.profile?.role === 'operator'

  return { user, loading, signOut, isAdmin, isJuri, isOperator }
}
