import type { PeliculaEnSesion } from '../../dominio/candidatas'
import { balance, minutosDePausas } from '../../dominio/sesion'

// Spec: docs/specs/noche-de-pelicula.md §5.2 y §5.3 (sesión en armado).
// Todos los cálculos salen de src/dominio/ (S-01).

interface SesionEnArmadoProps {
  peliculas: readonly PeliculaEnSesion[]
  tiempo: number
  onQuitar: (tmdbId: number) => void
}

export default function SesionEnArmado({
  peliculas,
  tiempo,
  onQuitar,
}: SesionEnArmadoProps) {
  if (peliculas.length === 0) {
    return (
      <p className="mensaje mensaje-vacio">
        Tu sesión está vacía. Agrega películas de las que caben.
      </p>
    )
  }

  const { total, restante, exceso } = balance(
    tiempo,
    peliculas.map((p) => p.duracion),
  )
  const pausas = minutosDePausas(peliculas.length)

  return (
    <>
      <ol>
        {peliculas.map((p) => (
          <li key={p.tmdbId}>
            {p.titulo} — {p.duracion} min{' '}
            <button type="button" onClick={() => onQuitar(p.tmdbId)}>
              Quitar
            </button>
          </li>
        ))}
      </ol>

      {exceso > 0 ? (
        <p className="mensaje mensaje-error">
          Tu sesión se pasa por {exceso} min. Quita películas para poder
          guardarla.
        </p>
      ) : (
        <p className="tarjeta-meta">
          Total: {total} min (incluye {pausas} min de pausas) · Te quedan{' '}
          {restante} min
        </p>
      )}
    </>
  )
}
