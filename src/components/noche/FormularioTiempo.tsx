import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { validarTiempoDisponible } from '../../dominio/sesion'
import type { ErrorTiempo } from '../../dominio/sesion'

// Spec: docs/specs/noche-de-pelicula.md §5.2 y §5.3 (formulario de tiempo).

const MENSAJES: Record<ErrorTiempo, string> = {
  vacio: 'Escribe cuántos minutos tienes: un número entero entre 30 y 600.',
  no_entero: 'El tiempo debe ser un número entero de minutos, entre 30 y 600.',
  fuera_de_rango: 'El tiempo debe estar entre 30 y 600 minutos.',
}

interface FormularioTiempoProps {
  onConfirmar: (minutos: number) => void
  /** Se llama cuando el tiempo escrito no es válido, para dejar de mostrar películas (CA-01.4, CA-01.5). */
  onInvalido: () => void
}

export default function FormularioTiempo({
  onConfirmar,
  onInvalido,
}: FormularioTiempoProps) {
  const idCampo = useId()
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<ErrorTiempo | null>(null)

  function confirmar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const resultado = validarTiempoDisponible(texto)
    if (resultado.ok) {
      setError(null)
      onConfirmar(resultado.minutos)
    } else {
      setError(resultado.error)
      onInvalido()
    }
  }

  return (
    <>
      <form onSubmit={confirmar}>
        <label htmlFor={idCampo}>¿Cuántos minutos tienes?</label>
        <input
          id={idCampo}
          type="text"
          inputMode="numeric"
          placeholder="Entre 30 y 600"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit">Ver qué cabe</button>
      </form>
      {error && <p className="mensaje mensaje-error">{MENSAJES[error]}</p>}
    </>
  )
}
