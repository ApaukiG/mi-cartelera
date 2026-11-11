import { describe, expect, it } from 'vitest'
import { NOMBRE_MAX, validarNombreSesion } from './nombre'

describe('validarNombreSesion', () => {
  it('"Viernes de terror" es válido', () => {
    expect(validarNombreSesion('Viernes de terror')).toEqual({
      ok: true,
      nombre: 'Viernes de terror',
    })
  })

  it('"" → vacio', () => {
    expect(validarNombreSesion('')).toEqual({ ok: false, error: 'vacio' })
  })

  it('"   " (solo espacios) → vacio', () => {
    expect(validarNombreSesion('   ')).toEqual({ ok: false, error: 'vacio' })
  })

  it('"  Maratón de domingo  " → "Maratón de domingo"', () => {
    expect(validarNombreSesion('  Maratón de domingo  ')).toEqual({
      ok: true,
      nombre: 'Maratón de domingo',
    })
  })

  it('60 caracteres es válido', () => {
    const nombre = 'a'.repeat(NOMBRE_MAX)
    expect(validarNombreSesion(nombre)).toEqual({ ok: true, nombre })
  })

  it('61 caracteres → demasiado_largo', () => {
    expect(validarNombreSesion('a'.repeat(61))).toEqual({
      ok: false,
      error: 'demasiado_largo',
    })
  })

  it('60 caracteres con ñ y tildes es válido', () => {
    const nombre = 'ñ'.repeat(30) + 'á'.repeat(30) // ñ y á precompuestas
    expect(validarNombreSesion(nombre)).toEqual({ ok: true, nombre })
  })

  it('60 caracteres con espacios alrededor es válido tras recortar', () => {
    const nombre = 'b'.repeat(60)
    expect(validarNombreSesion(`   ${nombre}   `)).toEqual({ ok: true, nombre })
  })

  it('cuenta un emoji como un solo carácter, igual que char_length (S-15)', () => {
    const nombre = '🎬'.repeat(60) // 60 puntos de código, 120 unidades UTF-16
    expect(validarNombreSesion(nombre)).toEqual({ ok: true, nombre })
    expect(validarNombreSesion('🎬'.repeat(61))).toEqual({
      ok: false,
      error: 'demasiado_largo',
    })
  })
})
