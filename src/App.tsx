import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Buscador from './components/Buscador'
import MiLista from './components/MiLista'
import NocheDePelicula from './components/noche/NocheDePelicula'

type Vista = 'mi-lista' | 'noche'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)
  const [recarga, setRecarga] = useState(0)
  const [vista, setVista] = useState<Vista>('mi-lista')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargando(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion)
      // Al cerrar sesión, la próxima entrada empieza en Mi lista (S-20).
      if (!nuevaSesion) setVista('mi-lista')
    })

    return () => subscription.unsubscribe()
  }, [])

  if (cargando) return <p>Cargando...</p>
  if (!session) return <Auth />

  return (
    <div>
      <header>
        <h1>Mi Cartelera Personal</h1>
        <div className="cabecera-usuario">
          <span>{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
        </div>
        <nav aria-label="Secciones">
          <button
            type="button"
            aria-current={vista === 'mi-lista' ? 'page' : undefined}
            onClick={() => setVista('mi-lista')}
          >
            Mi lista
          </button>
          <button
            type="button"
            aria-current={vista === 'noche' ? 'page' : undefined}
            onClick={() => setVista('noche')}
          >
            Noche de película
          </button>
        </nav>
      </header>
      <main>
        {/* Mi lista sigue montada al cambiar de vista para conservar su estado (S-08). */}
        <div hidden={vista !== 'mi-lista'}>
          <Buscador onAgregado={() => setRecarga((n) => n + 1)} />
          <MiLista recarga={recarga} />
        </div>
        {vista === 'noche' && <NocheDePelicula />}
      </main>
    </div>
  )
}

export default App
