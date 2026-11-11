// Dominio de Noche de película: qué películas caben, por qué no caben y en qué orden.
// Funciones puras: sin red, sin Supabase y sin estado global.
// Spec: docs/specs/noche-de-pelicula.md §3.2

import type { Estado, TipoContenido, TituloGuardado } from '../types'
import {
  PAUSA_MIN,
  cabe,
  duracionConocida,
  esTiempoValido,
  minutosNecesarios,
  tiempoTotal,
} from './sesion'

export interface PeliculaCandidata {
  tmdbId: number
  titulo: string
  posterUrl: string | null
  tipo: TipoContenido
  estado: Estado
  duracion: number | null // minutos; null o 0 = desconocida
  errorDuracion: boolean // true si TMDB falló para esta película
}

/** Copia que entra en la sesión y que se guarda (RN-10). */
export interface PeliculaEnSesion {
  tmdbId: number
  titulo: string
  duracion: number
}

export interface DuracionObtenida {
  tmdbId: number
  duracion: number | null
  error: boolean
}

export type MotivoNoDisponible =
  | { tipo: 'no_cabe'; necesita: number; quedan: number; conPausa: boolean }
  | { tipo: 'sin_duracion' }
  | { tipo: 'error_duracion' }

export interface NoDisponible {
  pelicula: PeliculaCandidata
  motivo: MotivoNoDisponible
}

export interface Clasificacion {
  caben: PeliculaCandidata[] // ordenadas por RN-08
  noDisponibles: NoDisponible[] // no caben (por duración), luego sin duración o con error (por título)
}

/** Títulos de la lista que pueden entrar en Noche de película: películas «por ver». RN-02, SU-01. */
export function peliculasPorVer(
  titulos: readonly TituloGuardado[],
): TituloGuardado[] {
  return titulos.filter(
    (t) => t.tipo_contenido === 'pelicula' && t.estado === 'por_ver',
  )
}

/** Une cada título con su duración. Un título sin duración obtenida queda con errorDuracion = true. RN-05, CB-05. */
export function aCandidatas(
  titulos: readonly TituloGuardado[],
  duraciones: readonly DuracionObtenida[],
): PeliculaCandidata[] {
  const porId = new Map(duraciones.map((d) => [d.tmdbId, d]))

  return titulos.map((t) => {
    const obtenida = porId.get(t.tmdb_id)
    const fallo = obtenida === undefined || obtenida.error
    return {
      tmdbId: t.tmdb_id,
      titulo: t.titulo,
      posterUrl: t.poster_url,
      tipo: t.tipo_contenido,
      estado: t.estado,
      duracion: fallo ? null : obtenida.duracion,
      errorDuracion: fallo,
    }
  })
}

function compararTitulos(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' })
}

/** Duración ascendente; en empate, título con localeCompare('es', { sensitivity: 'base' }). RN-08, CB-04. */
export function compararPorDuracionYTitulo(
  a: { titulo: string; duracion: number },
  b: { titulo: string; duracion: number },
): number {
  return a.duracion - b.duracion || compararTitulos(a.titulo, b.titulo)
}

interface ConDuracion {
  pelicula: PeliculaCandidata
  titulo: string
  duracion: number
}

/**
 * Clasifica las candidatas contra el tiempo que queda (SU-02).
 * Excluye las series, los títulos que no están «por ver» y las películas ya agregadas.
 * Lanza RangeError si tiempoDisponible no es válido (precondición: validarTiempoDisponible).
 */
export function clasificarCandidatas(
  candidatas: readonly PeliculaCandidata[],
  sesion: readonly PeliculaEnSesion[],
  tiempoDisponible: number,
  pausa: number = PAUSA_MIN,
): Clasificacion {
  if (!esTiempoValido(tiempoDisponible)) {
    throw new RangeError(`Tiempo disponible no válido: ${tiempoDisponible}`)
  }

  const enSesion = new Set(sesion.map((p) => p.tmdbId))
  const duracionesSesion = sesion.map((p) => p.duracion)
  const quedan = Math.max(
    0,
    tiempoDisponible - tiempoTotal(duracionesSesion, pausa),
  )
  const conPausa = sesion.length > 0

  const caben: ConDuracion[] = []
  const noCaben: (ConDuracion & { necesita: number })[] = []
  const sinDuracion: NoDisponible[] = []

  for (const pelicula of candidatas) {
    if (pelicula.tipo !== 'pelicula') continue // SU-01
    if (pelicula.estado !== 'por_ver') continue // RN-02
    if (enSesion.has(pelicula.tmdbId)) continue // SU-03

    if (pelicula.errorDuracion) {
      sinDuracion.push({ pelicula, motivo: { tipo: 'error_duracion' } })
      continue
    }
    const duracion = pelicula.duracion
    if (!duracionConocida(duracion)) {
      sinDuracion.push({ pelicula, motivo: { tipo: 'sin_duracion' } }) // RN-05
      continue
    }

    const item = { pelicula, titulo: pelicula.titulo, duracion }
    if (cabe(tiempoDisponible, [...duracionesSesion, duracion], pausa)) {
      caben.push(item)
    } else {
      noCaben.push({
        ...item,
        necesita: minutosNecesarios(duracion, sesion.length, pausa),
      })
    }
  }

  caben.sort(compararPorDuracionYTitulo)
  noCaben.sort(compararPorDuracionYTitulo)
  sinDuracion.sort((a, b) =>
    compararTitulos(a.pelicula.titulo, b.pelicula.titulo),
  )

  return {
    caben: caben.map((c) => c.pelicula),
    noDisponibles: [
      ...noCaben.map((c): NoDisponible => ({
        pelicula: c.pelicula,
        motivo: { tipo: 'no_cabe', necesita: c.necesita, quedan, conPausa },
      })),
      ...sinDuracion,
    ],
  }
}

/** Convierte una candidata que cabe en la copia para la sesión. Lanza RangeError si la duración no es conocida. RN-05, RN-10. */
export function aPeliculaEnSesion(
  candidata: PeliculaCandidata,
): PeliculaEnSesion {
  const { duracion } = candidata
  if (candidata.errorDuracion || !duracionConocida(duracion)) {
    throw new RangeError(
      `La película ${candidata.tmdbId} no tiene duración conocida`,
    )
  }
  return { tmdbId: candidata.tmdbId, titulo: candidata.titulo, duracion }
}
