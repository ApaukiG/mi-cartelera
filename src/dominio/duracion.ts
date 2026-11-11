// Dominio de Noche de película: lectura de la duración que devuelve TMDB.
// Spec: docs/specs/noche-de-pelicula.md §3.4

/** Valor del campo runtime de TMDB → minutos, o null si no es un entero > 0. RN-05 (0 = desconocida). */
export function normalizarDuracion(valor: unknown): number | null {
  if (typeof valor !== 'number') return null
  if (!Number.isInteger(valor) || valor <= 0) return null
  return valor
}
