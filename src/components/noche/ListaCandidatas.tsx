import type {
  Clasificacion,
  MotivoNoDisponible,
  PeliculaCandidata,
} from '../../dominio/candidatas'
import { PAUSA_MIN } from '../../dominio/sesion'

// Spec: docs/specs/noche-de-pelicula.md §5.2 y §5.3 (tarjetas de candidatas).

interface ListaCandidatasProps {
  clasificacion: Clasificacion
  tiempo: number
  sesionVacia: boolean
  onAgregar: (p: PeliculaCandidata) => void
}

function textoInsignia(motivo: MotivoNoDisponible): string {
  return motivo.tipo === 'no_cabe' ? 'No cabe' : 'Sin duración'
}

function textoMotivo(
  motivo: MotivoNoDisponible,
  pelicula: PeliculaCandidata,
  tiempo: number,
): string {
  switch (motivo.tipo) {
    case 'no_cabe':
      return motivo.conPausa
        ? `Necesita ${motivo.necesita} min (${pelicula.duracion} + ${PAUSA_MIN} de pausa) y te quedan ${motivo.quedan}.`
        : `Dura ${pelicula.duracion} min y tienes ${tiempo}.`
    case 'sin_duracion':
      return 'No tiene duración conocida, así que no se puede agregar.'
    case 'error_duracion':
      return 'No se pudo obtener la duración. Vuelve a intentarlo más tarde.'
  }
}

function Poster({ pelicula }: { pelicula: PeliculaCandidata }) {
  return pelicula.posterUrl ? (
    <img src={pelicula.posterUrl} alt={pelicula.titulo} />
  ) : (
    <div className="sin-poster">Sin póster</div>
  )
}

export default function ListaCandidatas({
  clasificacion,
  tiempo,
  sesionVacia,
  onAgregar,
}: ListaCandidatasProps) {
  const { caben, noDisponibles } = clasificacion

  return (
    <>
      {caben.length === 0 && sesionVacia && (
        <p className="mensaje mensaje-vacio">
          Ninguna de tus películas cabe en {tiempo} minutos. Prueba con más
          tiempo.
        </p>
      )}
      {caben.length === 0 && !sesionVacia && (
        <p className="mensaje mensaje-vacio">
          No cabe ninguna película más en el tiempo que te queda.
        </p>
      )}

      {(caben.length > 0 || noDisponibles.length > 0) && (
        <ul className="rejilla">
          {caben.map((p) => (
            <li key={p.tmdbId} className="tarjeta">
              <span className="insignia">{p.duracion} min</span>
              <Poster pelicula={p} />
              <div className="tarjeta-cuerpo">
                <span className="tarjeta-titulo">{p.titulo}</span>
                <button type="button" onClick={() => onAgregar(p)}>
                  Agregar a la sesión
                </button>
              </div>
            </li>
          ))}
          {noDisponibles.map(({ pelicula, motivo }) => (
            <li key={pelicula.tmdbId} className="tarjeta">
              <span className="insignia">{textoInsignia(motivo)}</span>
              <Poster pelicula={pelicula} />
              <div className="tarjeta-cuerpo">
                <span className="tarjeta-titulo">{pelicula.titulo}</span>
                <span className="tarjeta-meta">
                  {textoMotivo(motivo, pelicula, tiempo)}
                </span>
                <button type="button" disabled>
                  Agregar a la sesión
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
