// Dominio de Noche de película: tiempo disponible, pausas y "cabe".
// Funciones puras: sin red, sin Supabase y sin estado global.
// Spec: docs/specs/noche-de-pelicula.md §3.1

/** Pausa entre una película y la siguiente (RN-03). Debe coincidir con c_pausa en crear_sesion. */
export const PAUSA_MIN = 10
/** Límites del tiempo disponible, ambos incluidos (RN-01). */
export const TIEMPO_MIN = 30
export const TIEMPO_MAX = 600

export type ErrorTiempo = 'vacio' | 'no_entero' | 'fuera_de_rango'

export type ResultadoTiempo =
  { ok: true; minutos: number } | { ok: false; error: ErrorTiempo }

/** Texto del campo → minutos. Acepta solo dígitos (con espacios en los extremos). RN-01, CB-07. */
export function validarTiempoDisponible(entrada: string): ResultadoTiempo {
  const texto = entrada.trim()
  if (texto === '') return { ok: false, error: 'vacio' }
  if (!/^\d+$/.test(texto)) return { ok: false, error: 'no_entero' }

  const minutos = Number(texto)
  if (!esTiempoValido(minutos)) return { ok: false, error: 'fuera_de_rango' }
  return { ok: true, minutos }
}

/** true si el tiempo es un entero entre TIEMPO_MIN y TIEMPO_MAX. RN-01. */
export function esTiempoValido(minutos: number): boolean {
  return (
    Number.isInteger(minutos) && minutos >= TIEMPO_MIN && minutos <= TIEMPO_MAX
  )
}

/** true si la duración es un entero > 0. null, 0, negativos y decimales son desconocidos. RN-05. */
export function duracionConocida(duracion: number | null): duracion is number {
  return duracion !== null && Number.isInteger(duracion) && duracion > 0
}

/** Suma de duraciones + pausa × (n − 1). Sesión vacía → 0. RN-03. */
export function tiempoTotal(
  duraciones: readonly number[],
  pausa: number = PAUSA_MIN,
): number {
  if (duraciones.length === 0) return 0
  const suma = duraciones.reduce((acumulado, d) => acumulado + d, 0)
  return suma + pausa * (duraciones.length - 1)
}

/**
 * true si la sesión cabe: tiempoTotal(duraciones, pausa) <= tiempoDisponible. RN-03, RN-04.
 * Devuelve false si el tiempo no es válido o si alguna duración no es conocida.
 */
export function cabe(
  tiempoDisponible: number,
  duraciones: readonly number[],
  pausa: number = PAUSA_MIN,
): boolean {
  if (!esTiempoValido(tiempoDisponible)) return false
  if (!duraciones.every(duracionConocida)) return false
  return tiempoTotal(duraciones, pausa) <= tiempoDisponible
}

export interface Balance {
  total: number // tiempo ocupado (duraciones + pausas)
  restante: number // max(0, disponible − total)
  exceso: number // max(0, total − disponible)
}

/** Total, tiempo que queda y exceso. RN-04, RN-12, CB-21. */
export function balance(
  tiempoDisponible: number,
  duraciones: readonly number[],
  pausa: number = PAUSA_MIN,
): Balance {
  const total = tiempoTotal(duraciones, pausa)
  return {
    total,
    restante: Math.max(0, tiempoDisponible - total),
    exceso: Math.max(0, total - tiempoDisponible),
  }
}

/** Minutos que añade una película: su duración, más la pausa si la sesión no está vacía. RN-03, SU-02. */
export function minutosNecesarios(
  duracion: number,
  peliculasEnSesion: number,
  pausa: number = PAUSA_MIN,
): number {
  return peliculasEnSesion > 0 ? duracion + pausa : duracion
}

export type ResultadoGuardable =
  | { ok: true }
  | { ok: false; motivo: 'sin_peliculas' }
  | { ok: false; motivo: 'excede'; exceso: number }

/**
 * ¿Se puede guardar? Exige al menos una película y que la sesión quepa. RN-04, RN-12, SU-04.
 * Precondición: tiempo válido y duraciones conocidas; si no se cumple, lanza RangeError.
 */
export function validarSesionParaGuardar(
  tiempoDisponible: number,
  duraciones: readonly number[],
  pausa: number = PAUSA_MIN,
): ResultadoGuardable {
  if (!esTiempoValido(tiempoDisponible)) {
    throw new RangeError(`Tiempo disponible no válido: ${tiempoDisponible}`)
  }
  if (!duraciones.every(duracionConocida)) {
    throw new RangeError('La sesión contiene una duración desconocida')
  }
  if (duraciones.length === 0) return { ok: false, motivo: 'sin_peliculas' }

  const { exceso } = balance(tiempoDisponible, duraciones, pausa)
  if (exceso > 0) return { ok: false, motivo: 'excede', exceso }
  return { ok: true }
}
