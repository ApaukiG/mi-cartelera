import { useEffect, useState } from 'react'
import { obtenerDetalle } from '../lib/tmdb'
import type { DetalleTMDB } from '../lib/tmdb'
import type { TituloGuardado } from '../types'

interface DetalleProps {
  titulo: TituloGuardado
  onVolver: () => void
}

export default function Detalle({ titulo, onVolver }: DetalleProps) {
  const [detalle, setDetalle] = useState<DetalleTMDB | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerDetalle(titulo.tmdb_id, titulo.tipo_contenido)
      .then(setDetalle)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle')
      )
      .finally(() => setCargando(false))
  }, [titulo.tmdb_id, titulo.tipo_contenido])

  return (
    <section>
      <button onClick={onVolver}>← Volver a mi lista</button>
      <h2>{titulo.titulo}</h2>

      {cargando && <p>Cargando detalle...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {detalle && (
        <div>
          {detalle.posterGrande && (
            <img src={detalle.posterGrande} alt={titulo.titulo} width={300} />
          )}
          <h3>Sinopsis</h3>
          <p>{detalle.sinopsis}</p>

          <h3>Elenco</h3>
          <p>{detalle.elenco.length > 0 ? detalle.elenco.join(', ') : 'Sin información de elenco.'}</p>

          <h3>Calificación oficial (TMDB)</h3>
          <p>{detalle.calificacionTMDB !== null ? `${detalle.calificacionTMDB.toFixed(1)} / 10` : 'Sin calificación.'}</p>
        </div>
      )}

      <h3>Mi calificación</h3>
      <p>{titulo.calificacion_personal !== null ? `${titulo.calificacion_personal} ★` : 'Sin calificar'}</p>

      <h3>Mi comentario</h3>
      <p>{titulo.comentario ?? 'Sin comentario.'}</p>
    </section>
  )
}