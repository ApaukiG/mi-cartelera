import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Buscador from './components/Buscador'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargando(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (cargando) return <p>Cargando...</p>
  if (!session) return <Auth />

  return (
    <div>
      <header>
        <h1>Mi Cartelera Personal</h1>
        <span>{session.user.email}</span>
        <button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </header>
      <main>
        <Buscador />
      </main>
    </div>
  )
}

export default App