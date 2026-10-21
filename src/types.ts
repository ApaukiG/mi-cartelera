export type TipoContenido = 'pelicula' | 'serie'
export type Estado = 'por_ver' | 'viendo' | 'vista'

export interface ResultadoTMDB {
  id: number
  tipo: TipoContenido
  titulo: string
  posterUrl: string | null
  anio: string
}