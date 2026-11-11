import { describe, expect, it } from 'vitest'
import { normalizarDuracion } from './duracion'

describe('normalizarDuracion', () => {
  it('95 → 95', () => {
    expect(normalizarDuracion(95)).toBe(95)
  })

  it('0 → null', () => {
    expect(normalizarDuracion(0)).toBeNull()
  })

  it('null y undefined → null', () => {
    expect(normalizarDuracion(null)).toBeNull()
    expect(normalizarDuracion(undefined)).toBeNull()
  })

  it('"95" (texto) → null', () => {
    expect(normalizarDuracion('95')).toBeNull()
  })

  it('-10 y 95.5 → null', () => {
    expect(normalizarDuracion(-10)).toBeNull()
    expect(normalizarDuracion(95.5)).toBeNull()
  })
})
