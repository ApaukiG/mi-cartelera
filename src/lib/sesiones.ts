// Servicio de sesiones de Noche de película (Supabase).
// Spec: docs/specs/noche-de-pelicula.md §4.2
// Los datos que llegan de Supabase se leen como unknown y se validan (S-03).

import type { PostgrestError } from '@supabase/supabase-js'
import type { PeliculaEnSesion } from '../dominio/candidatas'
import { supabase } from './supabase'

export interface NuevaSesion {
  nombre: string // ya validado y recortado (validarNombreSesion)
  tiempoDisponible: number // ya validado
  peliculas: readonly PeliculaEnSesion[] // en orden de agregado
}

export interface SesionGuardada {
  id: number
  nombre: string
  tiempoDisponible: number
  tiempoTotal: number
  creadaEn: string // ISO 8601
  peliculas: PeliculaEnSesion[] // ordenadas por posición
}

const MENSAJE_DATOS_INCOMPLETOS = 'Una sesión guardada tiene datos incompletos.'

function mensajeErrorCrear(error: PostgrestError): string {
  if (error.code === 'P0001') return error.message
  if (error.code === '23514') {
    return 'La sesión no es válida: revisa el nombre y que quepa en tu tiempo.'
  }
  return 'No se pudo guardar la sesión. Revisa tu conexión e inténtalo de nuevo.'
}

/** Llama a la RPC crear_sesion (guardado atómico, S-05) y devuelve el id de la sesión creada. */
export async function crearSesion(nueva: NuevaSesion): Promise<number> {
  const { data, error } = await supabase.rpc('crear_sesion', {
    p_nombre: nueva.nombre,
    p_tiempo_disponible: nueva.tiempoDisponible,
    p_peliculas: nueva.peliculas.map((p) => ({
      tmdb_id: p.tmdbId,
      titulo: p.titulo,
      duracion: p.duracion,
    })),
  })
  if (error) throw new Error(mensajeErrorCrear(error))

  const id: unknown = data
  if (typeof id !== 'number') {
    throw new Error(
      'No se pudo guardar la sesión. Revisa tu conexión e inténtalo de nuevo.',
    )
  }
  return id
}

/** Sesiones del usuario, de la más reciente a la más antigua, con sus películas en orden. */
export async function listarSesiones(): Promise<SesionGuardada[]> {
  const { data, error } = await supabase
    .from('sesiones')
    .select(
      'id, nombre, tiempo_disponible, tiempo_total, creada_en, sesion_peliculas(posicion, tmdb_id, titulo, duracion)',
    )
    .order('creada_en', { ascending: false })
    .order('id', { ascending: false })
    .order('posicion', { referencedTable: 'sesion_peliculas', ascending: true })

  if (error)
    throw new Error('No se pudieron cargar tus sesiones. Inténtalo de nuevo.')

  const filas: unknown = data
  if (!Array.isArray(filas)) throw new Error(MENSAJE_DATOS_INCOMPLETOS)
  return filas.map(leerSesionGuardada)
}

/** Elimina una sesión propia (sus películas se borran en cascada). */
export async function eliminarSesion(id: number): Promise<void> {
  const { data, error } = await supabase
    .from('sesiones')
    .delete()
    .eq('id', id)
    .select('id')

  if (error)
    throw new Error('No se pudo eliminar la sesión. Inténtalo de nuevo.')

  const borradas: unknown = data
  if (!Array.isArray(borradas) || borradas.length === 0) {
    throw new Error('La sesión no existe o no te pertenece.')
  }
}

// --- Lectura de filas (función pura, con tests) -----------------

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function numero(objeto: Record<string, unknown>, campo: string): number {
  const valor = objeto[campo]
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new Error(MENSAJE_DATOS_INCOMPLETOS)
  }
  return valor
}

function texto(objeto: Record<string, unknown>, campo: string): string {
  const valor = objeto[campo]
  if (typeof valor !== 'string') throw new Error(MENSAJE_DATOS_INCOMPLETOS)
  return valor
}

/** Convierte una fila de la consulta (unknown) en SesionGuardada; lanza Error si la forma no es válida. */
export function leerSesionGuardada(fila: unknown): SesionGuardada {
  if (!esObjeto(fila)) throw new Error(MENSAJE_DATOS_INCOMPLETOS)

  const peliculas = fila['sesion_peliculas']
  if (!Array.isArray(peliculas)) throw new Error(MENSAJE_DATOS_INCOMPLETOS)

  const ordenadas = peliculas
    .map((p: unknown) => {
      if (!esObjeto(p)) throw new Error(MENSAJE_DATOS_INCOMPLETOS)
      return {
        posicion: numero(p, 'posicion'),
        pelicula: {
          tmdbId: numero(p, 'tmdb_id'),
          titulo: texto(p, 'titulo'),
          duracion: numero(p, 'duracion'),
        },
      }
    })
    .sort((a, b) => a.posicion - b.posicion)
    .map((p) => p.pelicula)

  return {
    id: numero(fila, 'id'),
    nombre: texto(fila, 'nombre'),
    tiempoDisponible: numero(fila, 'tiempo_disponible'),
    tiempoTotal: numero(fila, 'tiempo_total'),
    creadaEn: texto(fila, 'creada_en'),
    peliculas: ordenadas,
  }
}
