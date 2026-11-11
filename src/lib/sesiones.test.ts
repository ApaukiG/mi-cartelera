import { describe, expect, it, vi } from 'vitest'

// El cliente real de Supabase necesita las variables de entorno; aquí solo
// se prueba la función pura leerSesionGuardada, sin red.
vi.mock('./supabase', () => ({ supabase: {} }))

const { leerSesionGuardada } = await import('./sesiones')

function filaValida() {
  return {
    id: 7,
    nombre: 'Viernes de terror',
    tiempo_disponible: 180,
    tiempo_total: 170,
    creada_en: '2026-11-10T21:30:00+00:00',
    sesion_peliculas: [
      { posicion: 1, tmdb_id: 603, titulo: 'Matrix', duracion: 100 },
      { posicion: 2, tmdb_id: 694, titulo: 'El resplandor', duracion: 60 },
    ],
  }
}

describe('leerSesionGuardada', () => {
  it('convierte una fila válida', () => {
    expect(leerSesionGuardada(filaValida())).toEqual({
      id: 7,
      nombre: 'Viernes de terror',
      tiempoDisponible: 180,
      tiempoTotal: 170,
      creadaEn: '2026-11-10T21:30:00+00:00',
      peliculas: [
        { tmdbId: 603, titulo: 'Matrix', duracion: 100 },
        { tmdbId: 694, titulo: 'El resplandor', duracion: 60 },
      ],
    })
  })

  it('ordena las películas por posición', () => {
    const fila = filaValida()
    fila.sesion_peliculas.reverse()
    expect(leerSesionGuardada(fila).peliculas.map((p) => p.titulo)).toEqual([
      'Matrix',
      'El resplandor',
    ])
  })

  it('lanza Error si falta un campo', () => {
    const sinNombre: Record<string, unknown> = filaValida()
    delete sinNombre.nombre
    expect(() => leerSesionGuardada(sinNombre)).toThrow(
      'Una sesión guardada tiene datos incompletos.',
    )
    expect(() => leerSesionGuardada(null)).toThrow(Error)
    expect(() =>
      leerSesionGuardada({
        ...filaValida(),
        sesion_peliculas: [{ posicion: 1 }],
      }),
    ).toThrow(Error)
  })
})
