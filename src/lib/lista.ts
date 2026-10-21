import { supabase } from './supabase'
import type { ResultadoTMDB } from '../types'

export async function agregarALista(titulo: ResultadoTMDB) {
  const { error } = await supabase.from('mi_lista').insert({
    tmdb_id: titulo.id,
    titulo: titulo.titulo,
    poster_url: titulo.posterUrl,
    tipo_contenido: titulo.tipo,
  })

  if (error) throw new Error(error.message)
}
