// Dominio de Noche de película: nombre de la sesión.
// Spec: docs/specs/noche-de-pelicula.md §3.3

/** Longitud máxima del nombre, en caracteres (RN-11). Coincide con el check de la tabla sesiones. */
export const NOMBRE_MAX = 60

export type ResultadoNombre =
  | { ok: true; nombre: string } // ya recortado
  | { ok: false; error: 'vacio' | 'demasiado_largo' }

/**
 * Quita los espacios de los extremos y cuenta caracteres por puntos de código ([...nombre].length),
 * igual que char_length en PostgreSQL (S-15). RN-11, RN-13, CB-12.
 */
export function validarNombreSesion(entrada: string): ResultadoNombre {
  const nombre = entrada.trim()
  if (nombre === '') return { ok: false, error: 'vacio' }
  if ([...nombre].length > NOMBRE_MAX) {
    return { ok: false, error: 'demasiado_largo' }
  }
  return { ok: true, nombre }
}
