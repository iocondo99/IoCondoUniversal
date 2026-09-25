import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

const STAFF_ROLES = ['admin', 'portiere', 'super_admin']
const ADMIN_ROLES = ['admin', 'super_admin']

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profilo, setProfilo] = useState(null)
  const [condominioIds, setCondominioIds] = useState([]) // condomìni collegati (per il condòmino)
  const [loading, setLoading] = useState(true)

  const caricaProfilo = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profilo_utente')
      .select('id, nome, cognome, email, ruolo_principale, tenant_id, lingua')
      .eq('id', userId)
      .single()
    setProfilo(data || null)

    // Condomìni a cui l'utente è collegato come condòmino (unità -> condominio)
    const { data: links } = await supabase
      .from('condomino_unita')
      .select('unita:unita_id ( condominio_id )')
      .eq('condomino_id', userId)
    const ids = [...new Set((links || []).map((l) => l.unita?.condominio_id).filter(Boolean))]
    setCondominioIds(ids)
  }, [])

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await caricaProfilo(data.session.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      if (s) await caricaProfilo(s.user.id)
      else { setProfilo(null); setCondominioIds([]) }
    })
    return () => sub.subscription.unsubscribe()
  }, [caricaProfilo])

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })
  const logout = () => supabase.auth.signOut()

  const ruolo = profilo?.ruolo_principale
  const value = {
    session, profilo, loading, login, logout,
    condominioIds,
    condominioId: condominioIds[0] || null,   // condominio "principale" del condòmino
    ruolo,
    isStaff: STAFF_ROLES.includes(ruolo),
    isAdmin: ADMIN_ROLES.includes(ruolo),
    isPortiere: ruolo === 'portiere',
    isCondomino: ruolo === 'condomino',
    hasRole: (...roles) => roles.includes(ruolo),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
