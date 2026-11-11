import type { TipoContenido } from '../types'

// Spec: docs/specs/noche-de-pelicula.md §9 (E2-T15, deuda D-21).

const ETIQUETAS: Record<TipoContenido, string> = {
  pelicula: 'Película',
  serie: 'Serie',
}

/** Texto legible del tipo de contenido para mostrarlo en la interfaz. */
export function etiquetaTipo(tipo: TipoContenido): string {
  return ETIQUETAS[tipo]
}
