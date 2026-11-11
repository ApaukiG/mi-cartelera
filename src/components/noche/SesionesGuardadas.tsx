import { useEffect, useState } from 'react'
import { eliminarSesion, listarSesiones } from '../../lib/sesiones'
import type { SesionGuardada } from '../../lib/sesiones'

// Spec: docs/specs/noche-de-pelicula.md §5.2 y §5.3 (sesiones guardadas).
// Las sesiones se muestran tal como se guardaron y no se pueden editar (RN-09, RN-14).

type EstadoCarga = 'cargando' | 'lista' | 'error'

interface SesionesGuardadasProps {
  recarga: number
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function SesionesGuardadas({ recarga }: SesionesGuardadasProps) {
  const [sesiones, setSesiones] = useState<SesionGuardada[]>([])
  const [carga, setCarga] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    listarSesiones()
      .then((resultado) => {
        if (!activo) return
        setSesiones(resultado)
        setError(null)
        setCarga('lista')
      })
      .catch((err: unknown) => {
        if (!activo) return
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar tus sesiones.',
        )
        setCarga('error')
      })
    return () => {
      activo = false
    }
  }, [recarga, intento])

  function reintentar() {
    setError(null)
    setCarga('cargando')
    setIntento((n) => n + 1)
  }

  async function eliminar(sesion: SesionGuardada) {
    const confirmado = window.confirm(
      `¿Eliminar la sesión "${sesion.nombre}"? Esta acción no se puede deshacer.`,
    )
    if (!confirmado) return

    setEliminando(sesion.id)
    setError(null)
    try {
      await eliminarSesion(sesion.id)
      setSesiones((actual) => actual.filter((s) => s.id !== sesion.id))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo eliminar la sesión.',
      )
    } finally {
      setEliminando(null)
    }
  }

  if (carga === 'cargando') {
    return <p className="mensaje">Cargando tus sesiones...</p>
  }

  if (carga === 'error') {
    return (
      <>
        <p className="mensaje mensaje-error">{error}</p>
        <button type="button" onClick={reintentar}>
          Reintentar
        </button>
      </>
    )
  }

  return (
    <>
      {error && <p className="mensaje mensaje-error">{error}</p>}

      {sesiones.length === 0 ? (
        <p className="mensaje mensaje-vacio">
          Aún no tienes sesiones guardadas. Arma tu primera noche de película.
        </p>
      ) : (
        <ul className="rejilla">
          {sesiones.map((s) => (
            <li key={s.id} className="tarjeta">
              <div className="tarjeta-cuerpo">
                <span className="tarjeta-titulo">{s.nombre}</span>
                <span className="tarjeta-meta">
                  Creada el {formatearFecha(s.creadaEn)} · Tiempo disponible:{' '}
                  {s.tiempoDisponible} min · Total: {s.tiempoTotal} min
                </span>
                <ol>
                  {s.peliculas.map((p) => (
                    <li key={p.tmdbId}>
                      {p.titulo} — {p.duracion} min
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  disabled={eliminando === s.id}
                  onClick={() => eliminar(s)}
                >
                  {eliminando === s.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
