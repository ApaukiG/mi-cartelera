import { describe, expect, it } from 'vitest'
import type { TituloGuardado } from '../types'
import {
  aCandidatas,
  aPeliculaEnSesion,
  clasificarCandidatas,
  compararPorDuracionYTitulo,
  peliculasPorVer,
} from './candidatas'
import type { PeliculaCandidata, PeliculaEnSesion } from './candidatas'

let siguienteId = 1

function titulo(datos: Partial<TituloGuardado> = {}): TituloGuardado {
  const id = siguienteId++
  return {
    id,
    tmdb_id: id,
    titulo: `Título ${id}`,
    poster_url: null,
    tipo_contenido: 'pelicula',
    estado: 'por_ver',
    calificacion_personal: null,
    comentario: null,
    fecha_agregado: '2026-11-10T00:00:00Z',
    ...datos,
  }
}

function candidata(datos: Partial<PeliculaCandidata> = {}): PeliculaCandidata {
  const id = siguienteId++
  return {
    tmdbId: id,
    titulo: `Película ${id}`,
    posterUrl: null,
    tipo: 'pelicula',
    estado: 'por_ver',
    duracion: 100,
    errorDuracion: false,
    ...datos,
  }
}

function enSesion(c: PeliculaCandidata): PeliculaEnSesion {
  return aPeliculaEnSesion(c)
}

const titulos = (lista: readonly PeliculaCandidata[]) =>
  lista.map((c) => c.titulo)

describe('peliculasPorVer', () => {
  it('solo deja películas en estado por_ver', () => {
    const porVer = titulo({ estado: 'por_ver' })
    const resultado = peliculasPorVer([
      porVer,
      titulo({ estado: 'viendo' }),
      titulo({ estado: 'vista' }),
    ])
    expect(resultado).toEqual([porVer])
  })

  it('excluye las series', () => {
    const pelicula = titulo()
    const resultado = peliculasPorVer([
      pelicula,
      titulo({ tipo_contenido: 'serie' }),
    ])
    expect(resultado).toEqual([pelicula])
  })
})

describe('aCandidatas', () => {
  it('une cada título con su duración por tmdbId', () => {
    const t = titulo({
      tmdb_id: 603,
      titulo: 'Matrix',
      poster_url: 'https://img/p.jpg',
    })
    const [c] = aCandidatas([t], [{ tmdbId: 603, duracion: 136, error: false }])
    expect(c).toEqual({
      tmdbId: 603,
      titulo: 'Matrix',
      posterUrl: 'https://img/p.jpg',
      tipo: 'pelicula',
      estado: 'por_ver',
      duracion: 136,
      errorDuracion: false,
    })
  })

  it('marca errorDuracion cuando la duración falló o falta', () => {
    const conError = titulo({ tmdb_id: 1001 })
    const sinDato = titulo({ tmdb_id: 1002 })
    const [a, b] = aCandidatas(
      [conError, sinDato],
      [{ tmdbId: 1001, duracion: null, error: true }],
    )
    expect(a).toMatchObject({ duracion: null, errorDuracion: true })
    expect(b).toMatchObject({ duracion: null, errorDuracion: true })
  })

  it('conserva una duración desconocida (null) sin marcarla como error', () => {
    const t = titulo({ tmdb_id: 1003 })
    const [c] = aCandidatas(
      [t],
      [{ tmdbId: 1003, duracion: null, error: false }],
    )
    expect(c).toMatchObject({ duracion: null, errorDuracion: false })
  })
})

describe('compararPorDuracionYTitulo', () => {
  it('ordena por duración ascendente', () => {
    const corta = { titulo: 'Zeta', duracion: 80 }
    const larga = { titulo: 'Alfa', duracion: 120 }
    expect([larga, corta].sort(compararPorDuracionYTitulo)).toEqual([
      corta,
      larga,
    ])
  })

  it('desempata por título sin distinguir mayúsculas ni tildes', () => {
    const lista = [
      { titulo: 'beta', duracion: 95 },
      { titulo: 'Ágora', duracion: 95 },
      { titulo: 'Alfa', duracion: 95 },
    ]
    expect(lista.sort(compararPorDuracionYTitulo).map((p) => p.titulo)).toEqual(
      ['Ágora', 'Alfa', 'beta'],
    )
  })
})

describe('clasificarCandidatas', () => {
  it('con 120 min incluye las que duran 120 o menos, con su duración', () => {
    const c90 = candidata({ duracion: 90 })
    const c120 = candidata({ duracion: 120 })
    const c121 = candidata({ duracion: 121 })
    const { caben } = clasificarCandidatas([c121, c120, c90], [], 120)
    expect(caben).toEqual([c90, c120])
    expect(caben.map((c) => c.duracion)).toEqual([90, 120])
  })

  it('una película de exactamente 120 cabe en 120', () => {
    const c = candidata({ duracion: 120 })
    expect(clasificarCandidatas([c], [], 120).caben).toEqual([c])
  })

  it('excluye las que están viendo o vista', () => {
    const resultado = clasificarCandidatas(
      [
        candidata({ estado: 'viendo', duracion: 60 }),
        candidata({ estado: 'vista', duracion: 60 }),
      ],
      [],
      120,
    )
    expect(resultado).toEqual({ caben: [], noDisponibles: [] })
  })

  it('excluye las series', () => {
    const resultado = clasificarCandidatas(
      [candidata({ tipo: 'serie', duracion: 45 })],
      [],
      120,
    )
    expect(resultado).toEqual({ caben: [], noDisponibles: [] })
  })

  it('una película sin duración es no disponible con motivo sin_duracion', () => {
    const c = candidata({ duracion: null })
    expect(clasificarCandidatas([c], [], 120)).toEqual({
      caben: [],
      noDisponibles: [{ pelicula: c, motivo: { tipo: 'sin_duracion' } }],
    })
  })

  it('una duración 0 es no disponible con motivo sin_duracion', () => {
    const c = candidata({ duracion: 0 })
    expect(clasificarCandidatas([c], [], 120).noDisponibles).toEqual([
      { pelicula: c, motivo: { tipo: 'sin_duracion' } },
    ])
  })

  it('una duración con error es no disponible con motivo error_duracion', () => {
    const c = candidata({ duracion: null, errorDuracion: true })
    expect(clasificarCandidatas([c], [], 120).noDisponibles).toEqual([
      { pelicula: c, motivo: { tipo: 'error_duracion' } },
    ])
  })

  it('ordena Beta (88), Alfa (95), Zeta (95)', () => {
    const zeta = candidata({ titulo: 'Zeta', duracion: 95 })
    const alfa = candidata({ titulo: 'Alfa', duracion: 95 })
    const beta = candidata({ titulo: 'Beta', duracion: 88 })
    const { caben } = clasificarCandidatas([zeta, alfa, beta], [], 120)
    expect(titulos(caben)).toEqual(['Beta', 'Alfa', 'Zeta'])
  })

  it('las que no caben van después, por duración; las que no tienen duración van al final, por título', () => {
    const cabe = candidata({ titulo: 'Corta', duracion: 60 })
    const larga = candidata({ titulo: 'Larga', duracion: 200 })
    const media = candidata({ titulo: 'Media', duracion: 150 })
    const sinDuracionZ = candidata({ titulo: 'Zulú', duracion: null })
    const conErrorA = candidata({
      titulo: 'Amarillo',
      duracion: null,
      errorDuracion: true,
    })

    const { caben, noDisponibles } = clasificarCandidatas(
      [sinDuracionZ, larga, conErrorA, media, cabe],
      [],
      120,
    )
    expect(titulos(caben)).toEqual(['Corta'])
    expect(noDisponibles.map((n) => n.pelicula.titulo)).toEqual([
      'Media',
      'Larga',
      'Amarillo',
      'Zulú',
    ])
  })

  it('una película de 140 con 120 min → no_cabe, necesita 140, quedan 120, sin pausa', () => {
    const c = candidata({ duracion: 140 })
    expect(clasificarCandidatas([c], [], 120).noDisponibles).toEqual([
      {
        pelicula: c,
        motivo: {
          tipo: 'no_cabe',
          necesita: 140,
          quedan: 120,
          conPausa: false,
        },
      },
    ])
  })

  it('con 20 restantes cabe la de 10 y no la de 15 (necesita 25, con pausa)', () => {
    const agregada = candidata({ duracion: 100 })
    const diez = candidata({ duracion: 10 })
    const quince = candidata({ duracion: 15 })
    const { caben, noDisponibles } = clasificarCandidatas(
      [agregada, diez, quince],
      [enSesion(agregada)],
      120,
    )
    expect(caben).toEqual([diez])
    expect(noDisponibles).toEqual([
      {
        pelicula: quince,
        motivo: { tipo: 'no_cabe', necesita: 25, quedan: 20, conPausa: true },
      },
    ])
  })

  it('una película ya agregada no aparece', () => {
    const agregada = candidata({ duracion: 60 })
    const { caben, noDisponibles } = clasificarCandidatas(
      [agregada],
      [enSesion(agregada)],
      300,
    )
    expect(caben).toEqual([])
    expect(noDisponibles).toEqual([])
  })

  it('al quitar una película de la sesión vuelve a ser candidata', () => {
    const a = candidata({ duracion: 60 })
    const b = candidata({ duracion: 70 })
    const conAmbas = clasificarCandidatas(
      [a, b],
      [enSesion(a), enSesion(b)],
      300,
    )
    expect(conAmbas.caben).toEqual([])

    const sinB = clasificarCandidatas([a, b], [enSesion(a)], 300)
    expect(sinB.caben).toEqual([b])
  })

  it('una película de 700 min nunca cabe', () => {
    const c = candidata({ duracion: 700 })
    const { caben, noDisponibles } = clasificarCandidatas([c], [], 600)
    expect(caben).toEqual([])
    expect(noDisponibles[0].motivo).toMatchObject({
      tipo: 'no_cabe',
      necesita: 700,
    })
  })

  it('sin películas por ver → caben y noDisponibles vacíos', () => {
    expect(clasificarCandidatas([], [], 120)).toEqual({
      caben: [],
      noDisponibles: [],
    })
  })

  it('si ninguna cabe → caben vacío', () => {
    const { caben, noDisponibles } = clasificarCandidatas(
      [candidata({ duracion: 90 }), candidata({ duracion: 100 })],
      [],
      30,
    )
    expect(caben).toEqual([])
    expect(noDisponibles).toHaveLength(2)
  })

  it('un tiempo fuera de rango (29 o 601) lanza RangeError', () => {
    const c = candidata({ duracion: 20 })
    expect(() => clasificarCandidatas([c], [], 29)).toThrow(RangeError)
    expect(() => clasificarCandidatas([c], [], 601)).toThrow(RangeError)
  })
})

describe('aPeliculaEnSesion', () => {
  it('copia tmdbId, título y duración', () => {
    const c = candidata({ tmdbId: 603, titulo: 'Matrix', duracion: 136 })
    expect(aPeliculaEnSesion(c)).toEqual({
      tmdbId: 603,
      titulo: 'Matrix',
      duracion: 136,
    })
  })

  it('lanza RangeError si la duración no es conocida', () => {
    expect(() => aPeliculaEnSesion(candidata({ duracion: null }))).toThrow(
      RangeError,
    )
    expect(() => aPeliculaEnSesion(candidata({ duracion: 0 }))).toThrow(
      RangeError,
    )
    expect(() =>
      aPeliculaEnSesion(candidata({ duracion: 90, errorDuracion: true })),
    ).toThrow(RangeError)
  })
})
