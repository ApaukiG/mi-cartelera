import { useEffect, useState } from 'react'
import { obtenerLista, actualizarTitulo, eliminarTitulo } from '../lib/lista'
import type { Estado, TituloGuardado } from '../types'

export default function MiLista() {
  const [titulos, setTitulos] = useState<TituloGuardado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerLista()
      .then(setTitulos)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudo cargar tu lista')
      )
      .finally(() => setCargando(false))
  }, [])

  async function cambiarEstado(id: number, estado: Estado) {
    setError(null)
    try {
      await actualizarTitulo(id, { estado })
      setTitulos((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar')
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

  return (
    <section>
      <h2>Mi lista</h2>

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
            <select
              value={t.estado}
              onChange={(e) => cambiarEstado(t.id, e.target.value as Estado)}
            >
              <option value="por_ver">Por ver</option>
              <option value="viendo">Viendo</option>
              <option value="vista">Vista</option>
            </select>
            <button onClick={() => eliminar(t.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </section>
  )
}