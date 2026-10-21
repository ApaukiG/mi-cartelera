import type { ResultadoTMDB } from '../types'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const IMG_BASE = 'https://image.tmdb.org/t/p/w342'

interface RespuestaTMDB {
  results: {
    id: number
    media_type: 'movie' | 'tv' | 'person'
    title?: string
    name?: string
    poster_path: string | null
    release_date?: string
    first_air_date?: string
  }[]
}

export async function buscarTitulos(texto: string): Promise<ResultadoTMDB[]> {
  const url =
    `https://api.themoviedb.org/3/search/multi` +
    `?api_key=${API_KEY}&query=${encodeURIComponent(texto)}&language=es-ES`

  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`Error de TMDB (${respuesta.status})`)

  const datos: RespuestaTMDB = await respuesta.json()

  return datos.results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r): ResultadoTMDB => ({
      id: r.id,
      tipo: r.media_type === 'movie' ? 'pelicula' : 'serie',
      titulo: r.title ?? r.name ?? 'Sin título',
      posterUrl: r.poster_path ? IMG_BASE + r.poster_path : null,
      anio: (r.release_date ?? r.first_air_date ?? '').slice(0, 4),
    }))
}