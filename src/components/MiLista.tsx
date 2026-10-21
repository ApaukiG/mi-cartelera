import { useEffect, useState } from 'react'
import { obtenerLista } from '../lib/lista'
import type { TituloGuardado } from '../types'

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
            <strong>{t.titulo}</strong> - {t.tipo_contenido} - {t.estado}
          </li>
        ))}
      </ul>
    </section>
  )
}