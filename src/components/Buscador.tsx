import { useState } from 'react'
import type { FormEvent } from 'react'
import { buscarTitulos } from '../lib/tmdb'
import { agregarALista } from '../lib/lista'
import { etiquetaTipo } from '../dominio/tipo'
import type { ResultadoTMDB } from '../types'

interface BuscadorProps {
  onAgregado?: () => void
}

export default function Buscador({ onAgregado }: BuscadorProps) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState<ResultadoTMDB[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buscado, setBuscado] = useState(false)
  const [agregando, setAgregando] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [agregados, setAgregados] = useState<string[]>([])

  async function buscar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!texto.trim()) return

    setCargando(true)
    setError(null)
    setMensaje(null)
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

  async function agregar(titulo: ResultadoTMDB) {
    setAgregando(`${titulo.tipo}-${titulo.id}`)
    setError(null)
    setMensaje(null)
    try {
      await agregarALista(titulo)
      onAgregado?.()
      setAgregados((prev) => [...prev, `${titulo.tipo}-${titulo.id}`])
      setMensaje(`"${titulo.titulo}" se agregó a tu lista.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar')
    } finally {
      setAgregando(null)
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
        <button type="submit" disabled={cargando}>
          Buscar
        </button>
      </form>

      {cargando && <p className="mensaje">Buscando...</p>}
      {error && <p className="mensaje mensaje-error">{error}</p>}
      {mensaje && <p className="mensaje mensaje-exito">{mensaje}</p>}
      {buscado && !cargando && !error && resultados.length === 0 && (
        <p className="mensaje mensaje-vacio">No se encontraron resultados.</p>
      )}

      <ul className="rejilla">
        {resultados.map((r) => {
          const clave = `${r.tipo}-${r.id}`
          const yaAgregado = agregados.includes(clave)
          return (
            <li key={clave} className="tarjeta">
              <span className="insignia">{etiquetaTipo(r.tipo)}</span>
              {r.posterUrl ? (
                <img src={r.posterUrl} alt={r.titulo} />
              ) : (
                <div className="sin-poster">Sin póster</div>
              )}
              <div className="tarjeta-cuerpo">
                <span className="tarjeta-titulo">{r.titulo}</span>
                <span className="tarjeta-meta">{r.anio || 's/f'}</span>
                <button
                  onClick={() => agregar(r)}
                  disabled={agregando === clave || yaAgregado}
                >
                  {yaAgregado
                    ? '✓ Agregado'
                    : agregando === clave
                      ? 'Agregando...'
                      : 'Agregar a mi lista'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
