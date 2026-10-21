export type TipoContenido = 'pelicula' | 'serie'
export type Estado = 'por_ver' | 'viendo' | 'vista'

export interface ResultadoTMDB {
  id: number
  tipo: TipoContenido
  titulo: string
  posterUrl: string | null
  anio: string
}

export interface TituloGuardado {
  id: number
  tmdb_id: number
  titulo: string
  poster_url: string | null
  tipo_contenido: TipoContenido
  estado: Estado
  calificacion_personal: number | null
  comentario: string | null
  fecha_agregado: string
}