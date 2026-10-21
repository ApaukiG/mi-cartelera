import { supabase } from './supabase'
import type { ResultadoTMDB, TituloGuardado } from '../types'

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