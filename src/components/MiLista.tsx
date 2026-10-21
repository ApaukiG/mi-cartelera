import { useEffect, useState } from 'react'
import { obtenerLista, actualizarTitulo, eliminarTitulo } from '../lib/lista'
import type { Estado, TituloGuardado } from '../types'
import Detalle from './Detalle'

interface MiListaProps {
  recarga?: number
}

export default function MiLista({ recarga = 0 }: MiListaProps) {
  const [titulos, setTitulos] = useState<TituloGuardado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seleccionado, setSeleccionado] = useState<TituloGuardado | null>(null)

  useEffect(() => {
    obtenerLista()
      .then(setTitulos)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudo cargar tu lista')
      )
      .finally(() => setCargando(false))
  }, [recarga])

  async function cambiarEstado(id: number, estado: Estado) {
    setError(null)
    try {
      await actualizarTitulo(id, { estado })
      setTitulos((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar')
    }
  }

    async function cambiarCalificacion(id: number, valor: string) {
    const calificacion = valor === '' ? null : Number(valor)
    setError(null)
    try {
      await actualizarTitulo(id, { calificacion_personal: calificacion })
      setTitulos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, calificacion_personal: calificacion } : t))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la calificación')
    }
  }

    async function cambiarComentario(id: number, texto: string) {
    const nuevo = texto.trim() === '' ? null : texto.trim()
    const actual = titulos.find((t) => t.id === id)?.comentario ?? null
    if (nuevo === actual) return

    setError(null)
    try {
      await actualizarTitulo(id, { comentario: nuevo })
      setTitulos((prev) => prev.map((t) => (t.id === id ? { ...t, comentario: nuevo } : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el comentario')
    }
  }

  async function eliminar(id: number) {
    if (!window.confirm('¿Eliminar este título de tu lista?')) return
    setError(null)
    try {
      await eliminarTitulo(id)
      setTitulos((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar')
    }
  }

    const pendientes = titulos.filter((t) => t.estado === 'por_ver').length
  const enProgreso = titulos.filter((t) => t.estado === 'viendo').length
  const vistas = titulos.filter((t) => t.estado === 'vista').length

    if (seleccionado) {
    return <Detalle titulo={seleccionado} onVolver={() => setSeleccionado(null)} />
  }

  return (
    <section>
      <h2>Mi lista</h2>
            {!cargando && !error && titulos.length > 0 && (
        <p>
          Tienes {pendientes} pendientes, {enProgreso} en progreso, {vistas} vistas.
        </p>
      )}

      {cargando && <p>Cargando tu lista...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!cargando && !error && titulos.length === 0 && (
        <p>Tu lista está vacía. Busca algo y agrégalo.</p>
      )}

      <ul>
        {titulos.map((t) => (
          <li key={t.id}>
            {t.poster_url ? (
              <img src={t.poster_url} alt={t.titulo} width={120} />
            ) : (
              <div>Sin póster</div>
            )}
            <strong>{t.titulo}</strong> - {t.tipo_contenido}
            <button onClick={() => setSeleccionado(t)}>Ver detalle</button>
            <select
              value={t.estado}
              onChange={(e) => cambiarEstado(t.id, e.target.value as Estado)}
            >
              <option value="por_ver">Por ver</option>
              <option value="viendo">Viendo</option>
              <option value="vista">Vista</option>
            </select>
                        <select
              value={t.calificacion_personal ?? ''}
              onChange={(e) => cambiarCalificacion(t.id, e.target.value)}
            >
              <option value="">Sin calificar</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} ★</option>
              ))}
            </select>
                        <input
              type="text"
              placeholder="Tu comentario..."
              defaultValue={t.comentario ?? ''}
              onBlur={(e) => cambiarComentario(t.id, e.target.value)}
            />
            <button onClick={() => eliminar(t.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </section>
  )
}