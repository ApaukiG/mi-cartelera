import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { PeliculaEnSesion } from '../../dominio/candidatas'
import { validarNombreSesion } from '../../dominio/nombre'
import { validarSesionParaGuardar } from '../../dominio/sesion'
import { crearSesion } from '../../lib/sesiones'

// Spec: docs/specs/noche-de-pelicula.md §5.2 y §5.3 (guardar).

interface GuardarSesionProps {
  peliculas: readonly PeliculaEnSesion[]
  tiempo: number
  onGuardada: (nombre: string) => void
}

export default function GuardarSesion({
  peliculas,
  tiempo,
  onGuardada,
}: GuardarSesionProps) {
  const idCampo = useId()
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Evita una segunda sesión si llegan dos envíos antes de que se deshabilite el botón (S-11).
  const enCurso = useRef(false)

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enCurso.current) return

    const guardable = validarSesionParaGuardar(
      tiempo,
      peliculas.map((p) => p.duracion),
    )
    if (!guardable.ok) {
      setError(
        guardable.motivo === 'sin_peliculas'
          ? 'Agrega al menos una película para guardar la sesión.'
          : `Tu sesión se pasa por ${guardable.exceso} min. Quita películas para poder guardarla.`,
      )
      return
    }

    const nombre = validarNombreSesion(texto)
    if (!nombre.ok) {
      setError(
        nombre.error === 'vacio'
          ? 'Ponle un nombre a la sesión.'
          : 'El nombre puede tener como máximo 60 caracteres.',
      )
      return
    }

    enCurso.current = true
    setGuardando(true)
    setError(null)
    try {
      await crearSesion({
        nombre: nombre.nombre,
        tiempoDisponible: tiempo,
        peliculas,
      })
      setTexto('')
      onGuardada(nombre.nombre)
    } catch (err) {
      // La sesión en armado y el nombre se conservan para reintentar (S-12).
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar la sesión.',
      )
    } finally {
      enCurso.current = false
      setGuardando(false)
    }
  }

  return (
    <>
      <form onSubmit={guardar}>
        <label htmlFor={idCampo}>Nombre de la sesión</label>
        <input
          id={idCampo}
          type="text"
          placeholder="Ej.: Viernes de terror"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar sesión'}
        </button>
      </form>
      {error && <p className="mensaje mensaje-error">{error}</p>}
    </>
  )
}
