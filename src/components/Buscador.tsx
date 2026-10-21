import { useState } from 'react'
import type { FormEvent } from 'react'
import { buscarTitulos } from '../lib/tmdb'
import type { ResultadoTMDB } from '../types'

export default function Buscador() {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState<ResultadoTMDB[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buscado, setBuscado] = useState(false)

  async function buscar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!texto.trim()) return

    setCargando(true)
    setError(null)
    try {
      const datos = await buscarTitulos(texto.trim())
      setResultados(datos)
      setBuscado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section>
      <form onSubmit={buscar}>
        <input
          type="text"
          placeholder="Busca una película o serie..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" disabled={cargando}>Buscar</button>
      </form>

      {cargando && <p>Buscando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {buscado && !cargando && !error && resultados.length === 0 && (
        <p>No se encontraron resultados.</p>
      )}

      <ul>
        {resultados.map((r) => (
          <li key={`${r.tipo}-${r.id}`}>
            {r.posterUrl ? (
              <img src={r.posterUrl} alt={r.titulo} width={120} />
            ) : (
              <div>Sin póster</div>
            )}
            <strong>{r.titulo}</strong> ({r.anio || 's/f'}) - {r.tipo}
          </li>
        ))}
      </ul>
    </section>
  )
}