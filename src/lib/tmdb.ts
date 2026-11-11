import type { ResultadoTMDB, TipoContenido } from '../types'
import type { DuracionObtenida } from '../dominio/candidatas'
import { normalizarDuracion } from '../dominio/duracion'

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

export interface DetalleTMDB {
  sinopsis: string
  posterGrande: string | null
  elenco: string[]
  calificacionTMDB: number | null
}

export async function obtenerDetalle(
  tmdbId: number,
  tipo: TipoContenido,
): Promise<DetalleTMDB> {
  const ruta = tipo === 'pelicula' ? 'movie' : 'tv'
  const url =
    `https://api.themoviedb.org/3/${ruta}/${tmdbId}` +
    `?api_key=${API_KEY}&language=es-ES&append_to_response=credits`

  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`Error de TMDB (${respuesta.status})`)

  const d = await respuesta.json()

  return {
    sinopsis: d.overview || 'Sin sinopsis disponible.',
    posterGrande: d.poster_path
      ? 'https://image.tmdb.org/t/p/w500' + d.poster_path
      : null,
    elenco: (d.credits?.cast ?? [])
      .slice(0, 8)
      .map((c: { name: string }) => c.name),
    calificacionTMDB:
      typeof d.vote_average === 'number' ? d.vote_average : null,
  }
}

// ---------------------------------------------------------------
// Épica E2 · Noche de película: duración de las películas.
// Spec: docs/specs/noche-de-pelicula.md §4.1
// ---------------------------------------------------------------

/** Máximo de peticiones simultáneas a TMDB al pedir duraciones (S-16). */
const MAX_PETICIONES_SIMULTANEAS = 5

/** Duración en minutos de una película, o null si TMDB no la conoce (0 = null). */
export async function obtenerDuracion(tmdbId: number): Promise<number | null> {
  const url =
    `https://api.themoviedb.org/3/movie/${tmdbId}` +
    `?api_key=${API_KEY}&language=es-ES`

  let respuesta: Response
  try {
    respuesta = await fetch(url)
  } catch {
    throw new Error('No se pudo conectar con TMDB para obtener la duración.')
  }
  if (!respuesta.ok) {
    throw new Error(
      `No se pudo obtener la duración de la película (TMDB respondió ${respuesta.status}).`,
    )
  }

  const datos: unknown = await respuesta.json()
  if (typeof datos !== 'object' || datos === null || !('runtime' in datos)) {
    return null
  }
  return normalizarDuracion(datos.runtime)
}

/**
 * Duraciones de varias películas, con un máximo de 5 peticiones simultáneas.
 * Si falla alguna, esa queda con error: true y el resto se devuelve igual (CB-05).
 * Si fallan todas, lanza Error (CB-06).
 */
export async function obtenerDuraciones(
  tmdbIds: readonly number[],
): Promise<DuracionObtenida[]> {
  if (tmdbIds.length === 0) return []

  const resultados: DuracionObtenida[] = []
  let siguiente = 0

  async function trabajador(): Promise<void> {
    while (siguiente < tmdbIds.length) {
      const indice = siguiente++
      const tmdbId = tmdbIds[indice]
      try {
        const duracion = await obtenerDuracion(tmdbId)
        resultados[indice] = { tmdbId, duracion, error: false }
      } catch {
        resultados[indice] = { tmdbId, duracion: null, error: true }
      }
    }
  }

  const cantidad = Math.min(MAX_PETICIONES_SIMULTANEAS, tmdbIds.length)
  await Promise.all(Array.from({ length: cantidad }, () => trabajador()))

  if (resultados.every((r) => r.error)) {
    throw new Error(
      'No pudimos consultar las duraciones en TMDB. Revisa tu conexión e inténtalo de nuevo.',
    )
  }
  return resultados
}
