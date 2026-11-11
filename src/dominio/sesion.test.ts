import { describe, expect, it } from 'vitest'
import {
  PAUSA_MIN,
  balance,
  cabe,
  duracionConocida,
  minutosNecesarios,
  tiempoTotal,
  validarSesionParaGuardar,
  validarTiempoDisponible,
} from './sesion'

describe('validarTiempoDisponible', () => {
  it('acepta 30 y 600 (límites)', () => {
    expect(validarTiempoDisponible('30')).toEqual({ ok: true, minutos: 30 })
    expect(validarTiempoDisponible('600')).toEqual({ ok: true, minutos: 600 })
  })

  it('rechaza 29 y 601 como fuera_de_rango', () => {
    expect(validarTiempoDisponible('29')).toEqual({
      ok: false,
      error: 'fuera_de_rango',
    })
    expect(validarTiempoDisponible('601')).toEqual({
      ok: false,
      error: 'fuera_de_rango',
    })
  })

  it('rechaza "" y "   " como vacio', () => {
    expect(validarTiempoDisponible('')).toEqual({ ok: false, error: 'vacio' })
    expect(validarTiempoDisponible('   ')).toEqual({
      ok: false,
      error: 'vacio',
    })
  })

  it('rechaza "90,5", "90.5", "noventa" y "-60" como no_entero', () => {
    for (const entrada of ['90,5', '90.5', 'noventa', '-60']) {
      expect(validarTiempoDisponible(entrada)).toEqual({
        ok: false,
        error: 'no_entero',
      })
    }
  })

  it('acepta " 120 " como 120 y "090" como 90', () => {
    expect(validarTiempoDisponible(' 120 ')).toEqual({ ok: true, minutos: 120 })
    expect(validarTiempoDisponible('090')).toEqual({ ok: true, minutos: 90 })
  })
})

describe('duracionConocida', () => {
  it('95 es conocida', () => {
    expect(duracionConocida(95)).toBe(true)
  })

  it('null y 0 son desconocidas', () => {
    expect(duracionConocida(null)).toBe(false)
    expect(duracionConocida(0)).toBe(false)
  })

  it('-5 y 90.5 son desconocidas', () => {
    expect(duracionConocida(-5)).toBe(false)
    expect(duracionConocida(90.5)).toBe(false)
  })
})

describe('tiempoTotal', () => {
  it('una sesión vacía suma 0', () => {
    expect(tiempoTotal([])).toBe(0)
  })

  it('una sola película no lleva pausa (100 → 100)', () => {
    expect(tiempoTotal([100])).toBe(100)
  })

  it('dos películas llevan una pausa (100 + 10 + 60 = 170)', () => {
    expect(tiempoTotal([100, 60])).toBe(170)
  })

  it('tres películas llevan dos pausas (90, 100, 80 → 290)', () => {
    expect(tiempoTotal([90, 100, 80])).toBe(290)
  })

  it('quitar la del medio deja una pausa (90, 80 → 180)', () => {
    expect(tiempoTotal([90, 80])).toBe(180)
  })

  it('usa la pausa recibida por parámetro', () => {
    expect(tiempoTotal([100, 60], 0)).toBe(160)
    expect(tiempoTotal([100, 60], 15)).toBe(175)
  })

  it('la pausa por defecto es PAUSA_MIN', () => {
    expect(PAUSA_MIN).toBe(10)
  })
})

describe('cabe', () => {
  it('una sesión que ocupa exactamente el tiempo disponible cabe (170 en 170)', () => {
    expect(cabe(170, [100, 60])).toBe(true)
  })

  it('un minuto más que el tiempo disponible no cabe (171 en 170)', () => {
    expect(cabe(170, [100, 61])).toBe(false)
  })

  it('una sola película igual al tiempo cabe, sin pausa (120 en 120)', () => {
    expect(cabe(120, [120])).toBe(true)
  })

  it('una sesión vacía cabe', () => {
    expect(cabe(30, [])).toBe(true)
  })

  it('con una duración desconocida (0) no cabe', () => {
    expect(cabe(120, [0])).toBe(false)
    expect(cabe(120, [60, 0])).toBe(false)
  })

  it('con un tiempo fuera de rango (29 o 601) no cabe', () => {
    expect(cabe(29, [20])).toBe(false)
    expect(cabe(601, [100])).toBe(false)
  })

  it('con un tiempo no entero (90.5) no cabe', () => {
    expect(cabe(90.5, [60])).toBe(false)
  })
})

describe('balance', () => {
  it('170 de 180 → restante 10, exceso 0', () => {
    expect(balance(180, [100, 60])).toEqual({
      total: 170,
      restante: 10,
      exceso: 0,
    })
  })

  it('170 de 150 → restante 0, exceso 20', () => {
    expect(balance(150, [100, 60])).toEqual({
      total: 170,
      restante: 0,
      exceso: 20,
    })
  })

  it('exacto → restante 0, exceso 0', () => {
    expect(balance(170, [100, 60])).toEqual({
      total: 170,
      restante: 0,
      exceso: 0,
    })
  })
})

describe('minutosNecesarios', () => {
  it('con la sesión vacía es solo la duración', () => {
    expect(minutosNecesarios(15, 0)).toBe(15)
  })

  it('con películas en la sesión suma la pausa (15 → 25)', () => {
    expect(minutosNecesarios(15, 1)).toBe(25)
  })
})

describe('validarSesionParaGuardar', () => {
  it('una sesión vacía → sin_peliculas', () => {
    expect(validarSesionParaGuardar(120, [])).toEqual({
      ok: false,
      motivo: 'sin_peliculas',
    })
  })

  it('una sesión que se excede → excede con los minutos de exceso', () => {
    expect(validarSesionParaGuardar(150, [100, 60])).toEqual({
      ok: false,
      motivo: 'excede',
      exceso: 20,
    })
  })

  it('una sesión exacta → ok', () => {
    expect(validarSesionParaGuardar(170, [100, 60])).toEqual({ ok: true })
  })

  it('lanza RangeError si no se cumple la precondición', () => {
    expect(() => validarSesionParaGuardar(29, [20])).toThrow(RangeError)
    expect(() => validarSesionParaGuardar(120, [0])).toThrow(RangeError)
  })
})
