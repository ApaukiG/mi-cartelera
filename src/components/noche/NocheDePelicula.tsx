import { useEffect, useState } from 'react'
import {
  aCandidatas,
  aPeliculaEnSesion,
  clasificarCandidatas,
  peliculasPorVer,
} from '../../dominio/candidatas'
import type {
  PeliculaCandidata,
  PeliculaEnSesion,
} from '../../dominio/candidatas'
import { obtenerLista } from '../../lib/lista'
import type { TituloGuardado } from '../../types'
import { obtenerDuraciones } from '../../lib/tmdb'
import FormularioTiempo from './FormularioTiempo'
import ListaCandidatas from './ListaCandidatas'

// Vista Noche de película (épica E2).
// Spec: docs/specs/noche-de-pelicula.md §5

type EstadoCarga = 'cargando' | 'lista' | 'error'

/** Lista del usuario + duraciones de TMDB → candidatas. Se llama una vez al entrar (S-17). */
async function cargarCandidatas(): Promise<PeliculaCandidata[]> {
  let porVer: TituloGuardado[]
  try {
    porVer = peliculasPorVer(await obtenerLista())
  } catch {
    throw new Error('No se pudo cargar tu lista. Inténtalo de nuevo.')
  }
  const duraciones = await obtenerDuraciones(porVer.map((t) => t.tmdb_id))
  return aCandidatas(porVer, duraciones)
}

export default function NocheDePelicula() {
  const [carga, setCarga] = useState<EstadoCarga>('cargando')
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [candidatas, setCandidatas] = useState<PeliculaCandidata[]>([])
  const [tiempo, setTiempo] = useState<number | null>(null)
  const [sesion, setSesion] = useState<PeliculaEnSesion[]>([])

  useEffect(() => {
    let activo = true
    cargarCandidatas()
      .then((resultado) => {
        if (!activo) return
        setCandidatas(resultado)
        setCarga('lista')
      })
      .catch((err: unknown) => {
        if (!activo) return
        setErrorCarga(
          err instanceof Error ? err.message : 'No se pudo cargar tu lista.',
        )
        setCarga('error')
      })
    return () => {
      activo = false
    }
  }, [intento])

  function reintentar() {
    setErrorCarga(null)
    setCarga('cargando')
    setIntento((n) => n + 1)
  }

  function agregar(p: PeliculaCandidata) {
    setSesion((actual) => [...actual, aPeliculaEnSesion(p)])
  }

  const clasificacion =
    tiempo !== null ? clasificarCandidatas(candidatas, sesion, tiempo) : null

  return (
    <section>
      <h2>Noche de película</h2>

      {carga === 'cargando' && (
        <p className="mensaje">Cargando tus películas por ver...</p>
      )}

      {carga === 'error' && (
        <>
          <p className="mensaje mensaje-error">{errorCarga}</p>
          <button type="button" onClick={reintentar}>
            Reintentar
          </button>
        </>
      )}

      {carga === 'lista' && candidatas.length === 0 && (
        <p className="mensaje mensaje-vacio">
          No tienes películas por ver. Agrega algunas desde Mi lista.
        </p>
      )}

      {carga === 'lista' && candidatas.length > 0 && (
        <>
          <FormularioTiempo
            onConfirmar={setTiempo}
            onInvalido={() => setTiempo(null)}
          />

          {clasificacion && tiempo !== null && (
            <>
              <h3>Qué cabe</h3>
              <ListaCandidatas
                clasificacion={clasificacion}
                tiempo={tiempo}
                sesionVacia={sesion.length === 0}
                onAgregar={agregar}
              />
            </>
          )}
        </>
      )}
    </section>
  )
}
