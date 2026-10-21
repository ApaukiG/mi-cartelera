import { supabase } from './supabase'
import type { Estado, ResultadoTMDB, TituloGuardado } from '../types'

export async function agregarALista(titulo: ResultadoTMDB) {
  const { error } = await supabase.from('mi_lista').insert({
    tmdb_id: titulo.id,
    titulo: titulo.titulo,
    poster_url: titulo.posterUrl,
    tipo_contenido: titulo.tipo,
  })

  if (error) throw new Error(error.message)
}

export async function obtenerLista(): Promise<TituloGuardado[]> {
  const { data, error } = await supabase
    .from('mi_lista')
    .select('*')
    .order('fecha_agregado', { ascending: false })

  if (error) throw new Error(error.message)
  return data as TituloGuardado[]
}

export interface CambiosTitulo {
  estado?: Estado
  calificacion_personal?: number | null
  comentario?: string | null
}

export async function actualizarTitulo(id: number, cambios: CambiosTitulo) {
  const { error } = await supabase.from('mi_lista').update(cambios).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarTitulo(id: number) {
  const { error } = await supabase.from('mi_lista').delete().eq('id', id)
  if (error) throw new Error(error.message)
}